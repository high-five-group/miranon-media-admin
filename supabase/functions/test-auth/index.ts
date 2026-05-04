// test-auth — minimal endpoint för isolerad testning av requireUser-helpern.
//
// Naming: Supabase CLI accepterar inte underscore-prefix på funktionsnamn
// (regex ^[A-Za-z][A-Za-z0-9_-]*$). Konventionen blev därför `test-`-prefix
// (med hyphen) istället för `_test_`. Samma intent: prefix för deploy-pipe-
// filtrering så test-funktioner ALDRIG når produktion. Se TODO Fas 7 i
// tasks/sessions/2026-05-04-security-hardening.md §F.
//
// Anropar BARA requireUser och returnerar { ok: true, userId } vid success
// eller den 401-Response som requireUser producerar vid fel.
//
// Existerar för att Playwright ska kunna verifiera helpern i isolation,
// utan att tester behöver gå via en datafunktion (där fel kan komma från
// Airtable, validering eller andra steg). Per Marcus utökade DoD för M2:
// "de tre deny-path-testerna (anonym/ogiltig/anon-key) ska köras direkt
// mot requireUser-helpern, inte bara mot M2:s wiring."
//
// Returvärde är medvetet trivialt — den här endpointen exponerar inget
// känsligt data och utför inga sidoeffekter.

import { requireUser } from '../_shared/auth.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const auth = await requireUser(req, corsHeaders);
  if (auth instanceof Response) return auth;

  return new Response(JSON.stringify({ ok: true, userId: auth.user.id }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
