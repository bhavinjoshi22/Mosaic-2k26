// @ts-nocheck
// supabase/functions/check-volunteer/index.ts
//
// Deploy with: supabase functions deploy check-volunteer
//
// Tiny gate check, called right after Google login on VolunteerScanPage —
// "is this logged-in email one of our 15 volunteers, yes or no". Doesn't
// return any registration data, just a boolean, so it's safe to call
// immediately without needing a QR scan first.
//
// scan-lookup ALSO independently re-checks the volunteer list on every
// actual lookup — this function only controls what the UI shows, it's not
// the real security boundary (that's still scan-lookup + RLS).

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ isVolunteer: false }, 200);
    const jwt = authHeader.replace('Bearer ', '');

    const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await callerClient.auth.getUser(jwt);
    if (userError || !userData?.user?.email) {
      return json({ isVolunteer: false }, 200);
    }
    const email = userData.user.email.toLowerCase();

    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: volunteer } = await adminClient
      .from('volunteers')
      .select('email, role, is_admin')
      .eq('email', email)
      .maybeSingle();

    // role is 'gate' for main-entrance volunteers, or a committee name
    // (e.g. 'CODEX') for committee volunteers — the frontend uses this to
    // decide what the scanner screen marks attendance for. is_admin grants
    // visibility across every committee's check-ins (see scan-lookup /
    // the RLS policy in add-admin-visibility.sql) — true for the site
    // owner's own account only.
    // isVolunteer is true only when there's an actual scanning role
    // (gate or a committee) — an admin-only account (role = null) is NOT
    // treated as a volunteer, so RootRoute/VolunteerScanPage never try to
    // send the admin into scanner mode. isAdmin is independent of that.
    return json(
      {
        isVolunteer: !!volunteer?.role,
        role: volunteer?.role ?? null,
        isAdmin: volunteer?.is_admin === true,
      },
      200
    );
  } catch (err) {
    return json({ isVolunteer: false, error: String(err) }, 200);
  }
});