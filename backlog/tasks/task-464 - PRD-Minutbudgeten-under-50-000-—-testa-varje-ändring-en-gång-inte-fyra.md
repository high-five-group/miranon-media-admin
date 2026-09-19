---
id: TASK-464
title: 'PRD: Minutbudgeten under 50 000 — testa varje ändring en gång, inte fyra'
status: To Do
assignee: []
created_date: '2026-09-18 22:38'
updated_date: '2026-09-19 10:48'
labels: []
dependencies: []
priority: high
ordinal: 803000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
### Problemformulering

Marcus, 2026-09-19: "jag ska kunna jobba exakt lika mycket som nu och LÄTT klara mig under 50 000 minuter i månaden, utan att betala extra och utan att vi tar bort något verkligt skydd (säkerhet, tillgänglighet, hermetik-beviset, review-grinden)." Mätningen (docs/research/actions-minutbudget-2026-09-18.md) gav honom rätt i att något är fundamentalt fel: samma träd testas fyra gånger per landning (förslag, kö, huvudgren, efterkontroll) — 87 % av minuterna. Augustis arbetstakt med dagens uppsättning ger cirka 137 800 minuter i månaden; en kodlandning kostar 190 minuter, en ren markdown-landning 35. Kostnaden är noll kronor i dag enbart för att repot är publikt — den blir cirka 527 USD i månaden den dag repot görs privat.

### Lösning

Kärnan: testa varje ändring EN gång, inte fyra. Ordningen är beslutad (sessionsdok S126 Del 10–11): (1) nu-högen klar — N3 landad som e6308887; (2) de billiga skivorna: S4 + SE2 i samma ändring, och S5 CodeQL bara på kod; (3) grillning + ADR + bygge av "full svit en gång, i kön" (S2, med S1b/S1/S3 runt om); (4) mät om med samma metod; (5) repot privat när budgeten håller. Buntade dokument-landningar (S8) är ett billigt steg ovanpå och följs redan som arbetsform: en stängningsbatch per pass. Underlagets paket: P1 ≈ 90 800 (räcker inte), P2 ≈ 53 000, med S8 ≈ 31 600.

### Användarberättelser

1. Som ägare vill jag arbeta i samma takt som i dag och ändå ligga under 50 000 fakturerade Actions-minuter i månaden med marginal, så att repot kan göras privat utan löpande kostnad.
2. Som ägare vill jag att inget verkligt skydd försvinner på vägen: säkerhetsskanningen, tillgänglighetstesterna, hermetik-beviset och review-grinden finns kvar.
3. Som orkestrerare vill jag att varje CI-ändring redovisas i BÅDA måtten — väntetid och fakturerade minuter — så att en förbättring i det ena inte tyst köps med en försämring i det andra (N6: väntan halverad, +9 100 minuter i månaden).
4. Som orkestrerare vill jag att en ren dokumentändring bara kör det som kan fällas av en dokumentändring.

### Implementationsbeslut

Två regler bärs i allt CI-arbete: (a) båda måtten, alltid; (b) ifrågasätt underifrån — "måste vi köra det här, här, så här ofta?" Varje jobb avrundas uppåt till hel minut (27,5 % av det fakturerade är avrundning), så ett nytt JOBB är dyrt och ett nytt STEG i ett befintligt jobb billigt. Varje skivas PR-kropp bär sektionen "Kostnad i två mått" med mätta körningar. S2 (den stora) byggs INTE före grillning och egen ADR — den flyttar var grinden bor.

### Testbeslut

Varje villkorad grind bevisas tvåsidigt (kontrastpar: en ändring som ska hoppa den, en som ska köra den). Aggregatorn ci-passed förblir fail-closed (L322); scripts/check-aggregator-needs.mjs och gate-proof.yml ska vara gröna genom varje skiva. Ommätningen efter S2 använder underlagets egen metod så att talen är jämförbara.

### Utanför omfattningen

Egen runner (mätt fel för oss, I9). Att sänka push-frekvensen som generell regel (ADR-097) — S8 prövas separat i grillningen. Tilläggsprodukterna Secret Protection / Code Security (obeslutade). Själva klicket som gör repot privat (Marcus).

### Estimat

S4 + SE2: en skiva. S5: en skiva plus en repo-inställning. S2-paketet: storleksordning en vecka efter grillning. Skivorna för steg 3 mintas efter grillningen, inte före.

### ADR-koppling

S2 kräver egen ADR (flyttar den obligatoriska grinden till kö-ytan; rör ADR-076 och ADR-036). S8 rör ADR-097. ADR-105 (review-grinden) får inte försvagas.

### Ytterligare anteckningar

Ledstjärnan i sin helhet: tasks/sessions/2026-09-17-session-126.md Del 11. Underlag: docs/research/actions-minutbudget-2026-09-18.md (§ Kort svar, § B spakarna, § C paketen) och docs/research/ci-djupgranskning-2026-09-17/10-migrations-och-atgardsplan.md (SE1, SE2).
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
GRILLAD 2026-09-19 (S126 Del 17, /grill-with-docs, Marcus kvittens). Tio beslut; de som ändrar detta PRD: (1) MÅL skärpt — arkitekturen ska KUNNA bära 2 x augustis takt; (2) STEGAD VÄG — testjusteringar nu (uppskattat 39 000–44 000 min/mån, utrymme till ca 1,3 x), privat därefter, SNUBBELTRÅD: budgetvarning vid 40 000 min; först då research om egen byggmaskin / byggmaskinstjänst / buntade kodlandningar — 'Utanför omfattningen: egen runner' står alltså kvar, nu med ett mätbart omprövningsvillkor; (3) VÄNTETIDSTAK dokument <= 5 min, kod <= 12 min median / <= 15 min p95; skärvningen BEHÅLLS (S6/S7 görs inte); (4) S2 med lokalt urval i bygg-agentens kontrakt, snubbeltråd ca 5 % kö-fällningar; (5) S8 som LANDNINGS-buntning för orkestrerarens dokument, ADR-097 amenderas; (6) S3 nu, efterkontroll på klocka till research-pass (docs/research/efterkontroll-pa-klocka-2026-09-19.md); (7) privat NU i helgen; (8) Code Security + Secret Protection KÖPS (omprövas när appen är 'klar') — 'Utanför omfattningen: tilläggsprodukterna obeslutade' är därmed avgjort. Nya användarberättelser: 5. Som ägare vill jag kunna arbeta MER än i dag utan att taket spricker, så att tillväxt inte kräver en ny arkitektur. 6. Som ägare vill jag att väntan på en landning har ett uttalat tak som mäts, så att den inte glider. 464.1 (S4+SE2) och 464.2 (S5) är Done; mätt: dokumentlandning 31 -> 13 fakturerade min, väntan 8,4 -> 2,8 min per två rundor.
<!-- SECTION:NOTES:END -->
