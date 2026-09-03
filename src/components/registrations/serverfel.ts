/**
 * Serverns egen svenska mening, skalad ur `EdgeFunctionError`s tekniska hölje.
 *
 * `supabase-client.ts` § `edgeFunctionError` bygger meddelandet som
 * `Edge Function "<namn>" <status>: <serverns text> (requestId: <id>)`.
 * Serverns text ÄR redan begriplig — `cancel-registration` svarar t.ex.
 * "Anmälan är redan avbokad." (`_shared/cancel-registration.ts`
 * § `felmeddelande`) och `rebook-registration` "Anmälan sitter redan på det
 * eventet. Välj ett annat event." (`_shared/rebook-registration.ts`
 * § `beslutaOmbokning`) — men prefixet och requestId:t är för utvecklare, inte
 * för Lotta.
 *
 * Matchar mönstret inte (nätverksfel, ett kast utanför EF-vägen) returneras
 * meddelandet ORÖRT — hellre en teknisk mening än ingen alls.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * BRUTEN UT UR `AvbokningsYta` I TASK-368.5 — SAMMA KOD, TVÅ KONSUMENTER
 * ═══════════════════════════════════════════════════════════════════════════
 * Funktionen skrevs i `TASK-368.3` som en filprivat hjälpare i
 * `AvbokningsYta.tsx`. Ombokningssteget behöver EXAKT samma skalning av EXAKT
 * samma felform (båda EF:erna svarar `{error, code}` genom samma klient), och
 * en andra kopia hade varit två reguljära uttryck som kan glida isär tyst.
 * Flytten är ren — ingen rad i logiken är ändrad, och `AvbokningsYta`s
 * beteende är oförändrat (bevisat av `anmalan-avbokning.acceptance.test.ts`s
 * serverfel-test, som asserterar att varken "Edge Function" eller "requestId"
 * syns).
 */
const EF_HOLJE_PREFIX = /^Edge Function "[^"]+" \d{3}: /;
const EF_HOLJE_SUFFIX = / \(requestId: [^)]*\)$/;

export function begripligtServerfel(fel: Error): string {
  const skalat = fel.message.replace(EF_HOLJE_PREFIX, '').replace(EF_HOLJE_SUFFIX, '').trim();
  if (skalat === '') return 'Servern svarade utan förklaring.';
  return /[.!?]$/.test(skalat) ? skalat : `${skalat}.`;
}
