---
id: TASK-127.7
title: 'Skiva: Glömt lösenord + återställning'
status: Done
assignee: []
created_date: '2026-08-02 14:33'
updated_date: '2026-08-05 13:29'
labels:
  - ready-for-agent
dependencies:
  - TASK-127.3
parent_task_id: TASK-127
ordinal: 211000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Två nya publika sidor: begär återställning (enumeration-neutral — exakt samma bekräftelse oavsett om adressen finns i systemet) och sätt nytt lösenord (samma ASVS-golv som accept-sidan). Auth-lagret får återställningsmetoderna. Samma formmönster som den omskrivna login-vyn — därav beroendet. Den dag Lotta glömmer sitt lösenord löser hon det själv på en minut.

Täcker användarberättelser: 5, 8.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Begär-flödet ger identiskt svar för känd och okänd adress — i innehåll och utan mätbar tidsskillnad som externt beteende
- [x] #2 Återställningslänken är engångs; förbrukad eller utgången länk ger vänligt felläge
- [x] #3 Sätt-nytt-lösenord-sidan bär samma ASVS-golv som accept-sidan
- [x] #4 Acceptance- och a11y-sviterna gröna
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Implementation Notes (TASK-127.7)

**Route-val (T46-kartans Grind 0 punkt 7):**
- Begär-sidan: `/glomt-losenord` (matchar login.tsx:s befintliga "Glömt lösenord?"-copy)
- Landningssidan (recovery-mailets `redirectTo`): `/nytt-losenord`

**`supabase/config.toml` `[auth]` `additional_redirect_urls` uppdaterad** med
`"https://admin.miranon.dev/nytt-losenord"` (bredvid befintlig `/valkommen`).
**KRÄVER `supabase config push` mot staging FÖRST, sedan prod** (T46-kartans
ordning: STAGING FÖRST, förebild TAGEN FÖRE, diff mot den EFTER) innan
återställningsmailets länk faktiskt landar rätt — utan pushen faller Supabase
tyst tillbaka på bar `site_url` (ingen path), och länken pekar fel. Detta är
ORKESTRERARENS uppgift, inte byggd här (config push är en produktionsförändring
utanför en byggagents mandat).

**login.tsx ändrad** (utanför kortets explicit uppräknade filer, men inom
scope — kortet äger user story 5): "Glömt lösenord?"-knappen länkade tidigare
till ingenstans (togglade en attrapp-notis, TASK-127.3s medvetna platshållare
i väntan på denna skiva). Nu en riktig `<Link to="/glomt-losenord">`.

**Enumeration-neutralitet (AC#1) — fail-open-designen, öppet bokförd:**
`/glomt-losenord` visar SAMMA bekräftelse ("Kolla din inkorg") oavsett om
`resetPasswordForEmail` lyckas, misslyckas (5xx) eller kraschar (nätverksfel)
— en STRÄNGARE tolkning än login.tsx/valkommen.tsx:s "ett generiskt fel per
catch-gren"-konvention, motiverad av att GoTrues rate-limit är
adress-korrelerad (känd-adress-signal om den läckt till UI:t). Se
`src/routes/glomt-losenord.tsx`s docblock för fullt resonemang.

STÄNGD 2026-08-05 (S96, orkestrerarens CI-verifiering — tvåstegs-stängningen per ADR-071).

LEVERERAD via PR #786 (MERGED 13:27Z). CI grön per jobb: Lint+Audit+TypeCheck · Pure+Build · Acceptance (hermetisk) · Webblasarbeteende · Docs link check · CodeQL · Analyze ×2 · Detect changed files · CI Passed or Skipped · **Vercel** — samtliga SUCCESS. A11y/Staging/purge korrekt SKIPPED för diff-klassen.

CODEQL FÄLLDE FÖRST — 1 high severity, åtgärdad av orkestreraren i commit a8ca8631. Regeln js/incomplete-url-substring-sanitization träffade url.includes('pwnedpasswords.com') i tests/webblasarbeteende/nytt-losenord.test.ts:110. I SAK en falsk positiv (koden är en observation som räknar nätverksanrop, inte en säkerhetsgrind — ingenting godkänns på matchningens grund), men formen rättades i stället för att varningen avfärdades: exakt värdnamnstest på parsad URL. Bevis i båda riktningar, fem fall: gamla formen gav TRE falska träffar (?x=pwnedpasswords.com · pwnedpasswords.com.elak.example · path-prefixet /auth/v1/userdata), nya noll. src/lib/env-coherence.ts:17 bär ett ytligt likartat mönster men rördes INTE — den är fail-closed och CodeQL flaggade den aldrig.

ÖPPEN POST SOM ORKESTRERAREN ÄGER: additional_redirect_urls bär nu https://admin.miranon.dev/nytt-losenord i config.toml, men **supabase config push är INTE körd** — värdet är alltså inte skarpt i någon miljö. Marcus order 2026-08-05: miljökonfiguration (denna push, CORS, HIBP) tas samlat i nästa resume. Tills dess fungerar återställningslänken inte mot staging/prod.

AGENTENS AVVIKELSER, båda accepterade: (1) login.tsx ändrad trots att uppdragets Ram-sektion inte nämnde filen — motiverat av att kortet äger user story 5 och att login.tsx:s egen kommentar pekade hit; en ren funktionsflytt, ingen redesign. (2) Striktare enumeration-neutralitet än syskonsidorna: 200, 5xx OCH nätverkskrasch ger identisk bekräftelsetext, så svarstiden inte läcker. Motiverat mot ADR-093 § ASVS 6.3.8.

test:api kunde inte köras fullt lokalt (staging-mutexen upptagen av orelaterad körning). Agenten valde att INTE kringgå skyddet med MM_STAGING_PREFLIGHT=off — rätt beslut; CI körde den.

AVBLOCKERAR: inget nytt (TASK-127.9 väntade redan bara på 127.6, som är Done).
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
