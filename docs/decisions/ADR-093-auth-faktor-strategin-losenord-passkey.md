# ADR-093: Auth-faktor-strategin — lösenord vid accept, passkey som erbjudande

- Status: Accepted (Marcus-kvitterad 2026-08-02, grillad samsyn i
  T95-grillningen — S95 Del 2 beslut 6)
- Datum: 2026-08-02
- Fas: 7-framdragning (T95 Spår B; `TASK-127.1`)

> **Om beslutsvägen — bokförd öppet.** S87-spaningen
> ([`a4-riktig-webbapp-inbjudan.md`](../../tasks/sessions/bilagor/s87-spaning/a4-riktig-webbapp-inbjudan.md))
> citerade OWASP ASVS 5.0 V6 med konkreta krav-ID:n och verifierade
> Supabase Auth Passkeys' faktiska beta-status (maj 2026) mot
> plattformens changelog — och rekommenderade uttryckligen "passkey som
> erbjudande efter första inloggningen" som den lägre-risk-vägen.
> `/grill-me` gav Marcus tre alternativ (A: enbart lösenord, B:
> passkey-först, C: lösenord + erbjudande) och kvitterade C samma dag
> (sessionsdok [S95 Del 2](../../tasks/sessions/archive/2026-08/2026-08-02-session-95.md),
> beslut 6 + § Öppna declines för TOTP-MFA). Noteras av samma skäl som i
> [ADR-092](ADR-092-invite-identitetsmodellen-anvandarinbjudan.md): en
> läsare ska kunna se vem som vägde, inte bara vad som beslutades.

## Kontext

Dagens auth är enbart e-post + lösenord via `signInWithPassword`; ingen
MFA, inga passkeys, inget team-/roll-begrepp utöver `ADMIN_EMAILS`.
`SECURITY-SPEC.md` innehöll sedan tidigare en "Passkey-roadmap (Fas 8)"
som var föråldrad på tre skilda axlar, samtliga verifierade av S87-
spaningen:

1. **Fel mekanism.** Roadmapen föreslog `@simplewebauthn/browser` +
   `@simplewebauthn/server` och en egen `register-passkey`-Edge Function.
   Supabase Auth Passkeys gick i BETA maj 2026 med native stöd
   (`supabase.auth.signInWithPasskey()`, `auth.passkey`,
   `auth.admin.passkey`) och kräver enbart `supabase-js` `v2.105.0+` —
   repot har redan `^2.110.6`. Ingen separat klientbibliotek eller egen
   Edge Function behövs.
2. **Fel domän.** Roadmapens utkast till Edge Function hårdkodade
   `rpID: 'admin.miranon.se'` — [ADR-091](ADR-091-hosting-deploy-vercel-pro.md)
   låste appens origin till `admin.miranon.dev`.
3. **Fel gating.** Roadmapen ramade in passkey som en flerstegs
   "Fas 8"-migration (steg 2–4 uttryckligen märkta "Fas 8") som Lotta
   registrerar i efterhand via en separat inställningssida — inte som det
   faktiska beslutet: ett frivilligt erbjudande direkt efter FÖRSTA
   inloggningen, oavsett fas-nummer.

**OWASP ASVS 5.0 V6, citerat i S87-bilagan** (verifierat mot
`raw.githubusercontent.com/OWASP/ASVS/master/5.0/en/0x15-V6-Authentication.md`):
6.2.1 (minst 8 tecken, 15 starkt rekommenderat), 6.2.4/6.2.12
(breach-kontroll), 6.3.1 (rate limiting mot credential stuffing), 6.3.8
(enumeration-neutrala svar — statuskod OCH svarstid — gäller uttryckligen
även registrering och glömt-lösenord), 6.4.1 (aktiveringskoder säkert
slumpade + tidsbegränsade eller engångs), 6.5.1 (engångsanvändning),
6.3.3 (MFA krävs för ASVS L2; hårdvarubunden faktor för L3).

**Beta-risken:** Supabases passkey-API är uttryckligen märkt
experimentellt och "kan ändras utan förvarning" (plattformens eget
changelog). Att göra kontoskapandet BEROENDE av ett experimentellt API
(alternativ B nedan) riskerar att själva accept-flödet går sönder utan
förvarning.

## Beslut

1. **Lösenord enligt ASVS 5.0 V6-golvet vid accept** (`/valkommen`,
   `TASK-127.6`): minst 8 tecken/15 rekommenderat (6.2.1), breach-kontroll
   (6.2.4/6.2.12), rate limiting (6.3.1), enumeration-neutrala svar
   inklusive svarstid på BÅDE accept- och glömt-lösenord-flödet (6.3.8),
   engångstoken som dör vid användning (6.4.1/6.5.1).
2. **Passkey som frivilligt erbjudande EFTER första lyckade inloggning**
   (`TASK-127.8`), via Supabases native passkey-API — inte
   SimpleWebAuthn, ingen egen Edge Function. Lösenordet kvarstår som
   permanent fallback. Detta isolerar beta-risken till en opt-in-yta som
   inte gatar kontoskapandet.
3. **TOTP-MFA öppet skjuten, inte tyst bortprioriterad** — trigger för
   omprövning: Roger efterfrågar det, eller en uttalad ASVS
   L2-ambition (S95 Del 2 § Öppna declines).
4. **SECURITY-SPEC.md:s "Passkey-roadmap (Fas 8)"-avsnitt rivs öppet**
   och ersätts av en pekare till denna ADR i samma landning (AC#2) —
   se § Konsekvenser.

## Alternativ som förkastades

- **(A) Enbart lösenord enligt ASVS-golvet, inget passkey-erbjudande
  alls.** Säkert och okomplicerat, men missar en verklig möjlighet att
  visa upp modern, native Supabase-funktionalitet för Roger utan att ta
  på sig extra risk — förkastad som onödigt konservativ nu när plattformen
  stöder det direkt.
- **(B) Passkey-först vid accept, lösenord som fallback.** Skulle
  imponera mest på Roger, men gör själva kontoskapandet beroende av ett
  API som Supabase uttryckligen kan ändra utan förvarning — för hög risk
  på den allra första, mest kritiska ytan i hela flödet.
- **TOTP-MFA i v1.** Stabilt och billigt sätt att nå ASVS L2, men
  bedömd som scope utöver vad två användare motiverar just nu
  (över-engineering-vakten) givet att passkey-erbjudandet redan är den
  starkare praktiska faktorn. Öppen decline med uttalad omprövningstrigger.

## Konsekvenser

- Accept-routen (`TASK-127.6`) implementerar ASVS-golvet ovan; glömt-
  lösenord-flödet (`TASK-127.7`) ärver samma enumeration-neutralitet.
- Passkey-erbjudandet (`TASK-127.8`) är en egen, senare skiva — gatar
  INTE invite-/accept-/login-skivorna (`127.5`/`127.6`/`127.3`).
- `SECURITY-SPEC.md`:s stale passkey-avsnitt (tidigare rad 790–839)
  ersatt av pekare till denna ADR i samma commit som denna ADR mintas
  (§ nedan, se filens diff) — öppen rivning, inte tyst radering.
- ADR-bar-prövningen: svår att återställa (auth-faktor-valet berör
  accept-routen, login-vyn och den framtida passkey-ytan) ·
  överraskande utan kontext (SECURITY-SPEC:s befintliga plan såg
  beslutad ut men var stale på mekanism, domän OCH gating) · verklig
  avvägning (tre reella alternativ vägda, se § Alternativ). Alla tre
  villkor håller.

## Relaterat

- [S87-spaningen](../../tasks/sessions/bilagor/s87-spaning/a4-riktig-webbapp-inbjudan.md)
  — ASVS 5.0 V6-citaten och Supabase-passkey-beta-verifieringen.
- Sessionsdok S95 Del 2, beslut 6 + § Öppna declines (TOTP-MFA).
- [ADR-092](ADR-092-invite-identitetsmodellen-anvandarinbjudan.md) —
  följeslagar-beslutet: vem som får sätta denna auth-faktor och när.
- [ADR-091](ADR-091-hosting-deploy-vercel-pro.md) — domänschemat som
  gör den gamla roadmapens `rpID` fel.
- `docs/specs/SECURITY-SPEC.md` § Passkey (riven och ersatt i samma
  landning).
