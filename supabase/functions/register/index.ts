// @ts-nocheck
// supabase/functions/register/index.ts
//
// Deno Edge Function. Deploy with:
//   supabase functions deploy register
//
// This is the ONLY thing allowed to write to public.registrations — the
// client-side Supabase key can no longer INSERT there directly (see the
// accompanying rls-policies.sql). The client instead calls this function
// with a Bearer token (the logged-in user's Supabase session access token).
//
// It re-verifies the caller's identity from their JWT rather than trusting
// any "email" field the client might send, so there's no way to register
// on someone else's behalf.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// TODO: once you have a production domain, replace '*' with it explicitly
// (e.g. 'https://mosaic2k26.in') so only your own frontend can call this.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Short, easy-to-type fallback code — this is what actually gets encoded
// into the QR (see RegisterSection.tsx) and what a volunteer can type by
// hand if scanning fails. Avoids visually ambiguous characters (0/O,
// 1/I/L) so it reads back cleanly under bad lighting.
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function generateEntryCode(length = 6): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'Missing Authorization header' }, 401);
    }
    const jwt = authHeader.replace('Bearer ', '');

    // Scoped to the caller's own token — used ONLY to find out who they
    // actually are. This client has no elevated privileges.
    const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await callerClient.auth.getUser(jwt);
    if (userError || !userData?.user?.email) {
      return json({ error: 'Invalid or expired session' }, 401);
    }
    const email = userData.user.email.toLowerCase();
    const userId = userData.user.id;

    const body = await req.json().catch(() => null);
    if (!body) {
      return json({ error: 'Invalid JSON body' }, 400);
    }
    const { name, mobile, category, collegeName, year, collegeIdPhotoUrl, personPhotoUrl } = body as {
      name?: string;
      mobile?: string;
      category?: string;
      collegeName?: string;
      year?: string;
      collegeIdPhotoUrl?: string;
      personPhotoUrl?: string;
    };

    if (
      !name?.trim() ||
      !mobile?.trim() ||
      !category ||
      !collegeName?.trim() ||
      !year ||
      !collegeIdPhotoUrl ||
      !personPhotoUrl
    ) {
      return json({ error: 'Missing required fields' }, 400);
    }
    if (category !== 'SFIT' && category !== 'Non-SFIT') {
      return json({ error: 'Invalid category' }, 400);
    }
    if (!['FE', 'SE', 'TE', 'BE'].includes(year)) {
      return json({ error: 'Invalid year' }, 400);
    }
    if (collegeName.trim().length > 150) {
      return json({ error: 'College name is too long' }, 400);
    }

    // The photo "URLs" here are actually storage PATHS now (see below),
    // not public URLs — the bucket is private, so a path is all we can
    // meaningfully store; a signed URL is generated fresh, on demand,
    // whenever someone is actually allowed to view the photo.
    const belongsToUser = (path: string) => path.startsWith(`${userId}/`);
    if (!belongsToUser(collegeIdPhotoUrl) || !belongsToUser(personPhotoUrl)) {
      return json({ error: "Photo paths don't belong to this account" }, 403);
    }

    // Service-role client — bypasses RLS. Only used after everything above
    // has already been verified against the caller's real identity.
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Idempotent: if this email is already registered, hand back the
    // existing row instead of creating a duplicate (covers double-submits
    // and someone re-registering from a different device).
    const { data: existing, error: lookupError } = await adminClient
      .from('registrations')
      .select('*')
      .eq('college_email', email)
      .maybeSingle();

    if (lookupError) {
      return json({ error: lookupError.message }, 500);
    }
    if (existing) {
      return json({ registration: existing }, 200);
    }

    const ticketId = crypto.randomUUID();

    // Retry a few times in the unlikely event of an entry_code collision
    // (requires a UNIQUE constraint on entry_code — see the ALTER TABLE
    // note in the handoff doc / prior message).
    let inserted: Record<string, unknown> | null = null;
    let lastInsertError: { message: string } | null = null;

    for (let attempt = 0; attempt < 5 && !inserted; attempt++) {
      const entryCode = generateEntryCode();
      const { data: attemptData, error: attemptError } = await adminClient
        .from('registrations')
        .insert({
          ticket_id: ticketId,
          entry_code: entryCode,
          name: name.trim(),
          college_email: email,
          mobile: mobile.trim(),
          category,
          college_name: collegeName.trim(),
          year,
          college_id_photo_url: collegeIdPhotoUrl,
          person_photo_url: personPhotoUrl,
        })
        .select()
        .single();

      if (!attemptError && attemptData) {
        inserted = attemptData;
      } else {
        lastInsertError = attemptError;
      }
    }

    if (!inserted) {
      return json({ error: lastInsertError?.message ?? 'Could not complete registration.' }, 500);
    }

    return json({ registration: inserted }, 201);
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});