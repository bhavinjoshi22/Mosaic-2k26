// @ts-nocheck
// supabase/functions/scan-lookup/index.ts
//
// Deploy with: supabase functions deploy scan-lookup
//
// Called by VolunteerScanPage.tsx after scanning a QR code, or after a
// volunteer manually types in the short entry code. Both paths send the
// same value — the QR now encodes `entry_code` (a short human-typeable
// code) rather than the internal `ticket_id` UUID, so scanning and manual
// entry hit the exact same lookup.
//
// Only works for logged-in accounts listed in the `volunteers` table —
// everyone else gets a 403, even if they're a normal logged-in attendee.
//
// This is the ONLY place in the whole app that's allowed to see someone
// else's registration/photos. It uses the service_role key internally
// (never exposed to any browser), and re-verifies the caller is an
// allow-listed volunteer before doing anything.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// TODO: once you have a production domain, replace '*' with it explicitly.
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

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Missing Authorization header' }, 401);
    const jwt = authHeader.replace('Bearer ', '');

    // Scoped to the caller's own token — used only to find out who they are.
    const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await callerClient.auth.getUser(jwt);
    if (userError || !userData?.user) {
      return json({ error: 'Invalid or expired session' }, 401);
    }
    const callerEmail = userData.user.email?.toLowerCase();
    if (!callerEmail) {
      return json({ error: 'Google account has no email — cannot verify.' }, 401);
    }

    // Service-role client — bypasses RLS. Only used after we've confirmed
    // below that the caller is an allow-listed volunteer.
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: volunteer } = await adminClient
      .from('volunteers')
      .select('email, role')
      .eq('email', callerEmail)
      .maybeSingle();

    if (!volunteer) {
      return json({ error: 'This Google account is not authorized for entry scanning.' }, 403);
    }

    // 'gate' = main entrance, marks overall fest entry. Anything else is a
    // committee name — that volunteer marks attendance for just their own
    // event, independently of every other committee and of gate entry.
    const role = volunteer.role ?? 'gate';
    const isGate = role === 'gate';

    const body = await req.json().catch(() => null);
    // Field name kept as `ticketId` for backwards compatibility with the
    // frontend's request body — the value it carries is now the short
    // entry_code, not the internal ticket_id UUID.
    const rawCode = body?.ticketId as string | undefined;
    const markCheckedIn = Boolean(body?.markCheckedIn);

    if (!rawCode) {
      return json({ error: 'Missing code' }, 400);
    }

    // Normalize: entry codes are generated uppercase, and manual typing
    // may include stray whitespace.
    const entryCode = rawCode.trim().toUpperCase();

    const { data: registration, error: lookupError } = await adminClient
      .from('registrations')
      .select('*')
      .eq('entry_code', entryCode)
      .maybeSingle();

    if (lookupError) return json({ error: lookupError.message }, 500);
    if (!registration) {
      return json({ error: 'No registration found for this code.' }, 404);
    }

    let wasAlreadyCheckedIn: boolean;

    if (isGate) {
      // Gate volunteers: mark overall fest entry on the registration row,
      // exactly as before. Still only flips once (idempotent).
      wasAlreadyCheckedIn = registration.checked_in === true;
      if (markCheckedIn && !wasAlreadyCheckedIn) {
        await adminClient
          .from('registrations')
          .update({ checked_in: true, checked_in_at: new Date().toISOString() })
          .eq('entry_code', entryCode);
      }
    } else {
      // Committee volunteers: never touch the gate's checked_in flag — just
      // record (or look up) this committee's own attendance row. The
      // unique(entry_code, committee) constraint makes the insert safely
      // idempotent even under a double-tap.
      const { data: existingCheckin } = await adminClient
        .from('event_checkins')
        .select('id')
        .eq('entry_code', entryCode)
        .eq('committee', role)
        .maybeSingle();

      wasAlreadyCheckedIn = !!existingCheckin;

      if (markCheckedIn && !wasAlreadyCheckedIn) {
        await adminClient.from('event_checkins').insert({
          entry_code: entryCode,
          committee: role,
          checked_in_by: callerEmail,
          // Snapshot name/year/category so committee screens and the admin
          // dashboard never have to touch the (locked-down) registrations
          // table to display them.
          name: registration.name,
          year: registration.year ?? null,
          category: registration.category,
        });
      }
    }

    // Short-lived signed URLs (5 min) — service_role can generate these
    // regardless of whose folder the photos live in.
    const [collegeIdSigned, personSigned] = await Promise.all([
      adminClient.storage
        .from('registration-photos')
        .createSignedUrl(registration.college_id_photo_url, 300),
      adminClient.storage
        .from('registration-photos')
        .createSignedUrl(registration.person_photo_url, 300),
    ]);

    return json(
      {
        registration: {
          name: registration.name,
          college_email: registration.college_email,
          mobile: registration.mobile,
          category: registration.category,
          year: registration.year ?? null,
          ticket_id: registration.ticket_id,
          entry_code: registration.entry_code,
        },
        collegeIdPhotoUrl: collegeIdSigned.data?.signedUrl ?? null,
        personPhotoUrl: personSigned.data?.signedUrl ?? null,
        alreadyCheckedIn: wasAlreadyCheckedIn,
        scannerRole: role,
        // Lets a committee volunteer see a gentle warning if someone
        // reaches their stall without having passed the main gate yet —
        // informational only, never blocks the committee's own scan.
        enteredAtGate: registration.checked_in === true,
      },
      200
    );
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});