# T50 — UI-härdning: fler-stegs accident-proof sänd-grind (massutskick)

- **Tillstånd:** `active` — **NÄSTA SESSIONS FOKUS** (Marcus-direktiv)
- **Uppstod:** Session 44 (Fas 6h prod-deploy-planering)
- **Commit-tagg:** `git log --grep "\[T50\]"`

> ⚠️ **MÅSTE vara på plats FÖRE Lotta använder sändet skarpt.** Detta är det tredje
> oberoende skyddslagret (UI-bekräftelsen) mellan ett oavsiktligt klick och en
> riktig inkorg — utöver (a) idempotensnyckeln och (b) fail-closed-spärren. Utan det
> kan en icke-teknisk användare avfyra ett massutskick av misstag.

## Varför denna tråd

`send-email` blir skarp på prod i Fas 6h (Session 44). Server-sidans säkerhet
(idempotens + fail-closed `ENVIRONMENT`-spärr) skyddar mot dubbel-sändning och
oavsiktliga icke-prod-mottagare, men skyddar INTE mot att en behörig användare
(Lotta) av misstag startar ett riktigt massutskick i appen. Klient-UX:en runt
Skicka-knappen måste göra ett oavsiktligt bulk-utskick **fysiskt omöjligt** för en
icke-teknisk användare (Gunilla-principen).

Eget, distinkt arbete (klient-UX, inte EF-deploy) — egen session.

## Form (beslutad i Session 44)

Grundat i branschmönster (Nielsen Norman Group — destruktiv-handling-bekräftelse +
Mailchimps lista-sänd-bekräftelse):

- **Granska-steg:** ruta som återger exakt vad som händer — mottagarantal ("skickas
  till 87 personer"), segmentnamn, ämnesrad, med förhandsvisning av mailtexten.
  **REVIDERAD Session 45:** avsändar-/Reply-To-visning UTELÄMNAD ur T50 —
  `RESEND_FROM`/`RESEND_REPLY_TO` är server-only secrets (ej i `src/`, ej i
  EF-svar); människo-synlig verifiering av de faktiska värdena sker via Marcus
  självtest (T51), ej i granska-rutan.
- **Skriv-för-att-bekräfta:** Skicka-knappen låst tills användaren skriver något
  medvetet (mottagarantalet eller ordet `SKICKA`) — går inte att trigga av misstag.
- **Faro-färgad slutknapp** ("Skicka till 87 personer"); Avbryt som tryggt förval.
- **Test-till-sig-själv-knapp:** ~~BESLUTAT: med.~~ **REVIDERAD Session 45 →
  DEFERRAD till [T53](README.md).** Disk bevisar `send-email` är segmentIds-only
  (server-resolverad, ADR-067 consent-GOLV); explicit enkel-mottagare kräver
  net-new EF-kontrakt + ADR eller funkar bara icke-prod. Falsifierat beslut rivs
  öppet, ej tyst (se T53 options A/B/C).

## Förkrav — forensiskt pre-pass FÖRE bygge

Kartlägg det BEFINTLIGA sänd-flödet (L3 compose/send, byggt Session 41 —
`SegmentMailCompose` + send-adaptern) FÖRE design. Härdningen designas mot det som
faktiskt finns, ingen dubblering. Test-till-sig-själv-knappen knyter ev. en EF-/
adapter-yta — verifiera mot disk om en enkel-mottagar-väg redan finns eller måste
byggas.

## Relaterat

- Full plan: [session-44](../sessions/2026-06-29-session-44.md) § Del 1, undersektion
  "Nästa session — UI-härdning".
- [T51](README.md) — Reply-To gold-standard-verifiering (förhandsvisning visar de
  faktiska avsändar-/Reply-To-värdena Lotta ser).
- ADR-067 (bulk-mail-send-kontraktet) · L3 compose/send (Session 41).
