---
id: TASK-127.7
title: 'Skiva: Glömt lösenord + återställning'
status: To Do
assignee: []
created_date: '2026-08-02 14:33'
updated_date: '2026-08-05 13:03'
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
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
