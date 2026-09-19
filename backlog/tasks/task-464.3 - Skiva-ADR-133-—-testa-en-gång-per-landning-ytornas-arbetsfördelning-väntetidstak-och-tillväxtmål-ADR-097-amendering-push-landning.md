---
id: TASK-464.3
title: >-
  Skiva: ADR-133 — testa en gång per landning: ytornas arbetsfördelning,
  väntetidstak och tillväxtmål (+ ADR-097-amendering push/landning)
status: To Do
assignee: []
created_date: '2026-09-19 10:48'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-464
priority: high
ordinal: 819000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Skriv ADR-133 ur den kvitterade samsynen och amendera ADR-097. ADR:n låser: vad varje CI-yta gör (förslaget lätt; hela acceptance-klassen + tvåsidiga beviset EN gång, i kön; main kör inte om det kön körde; efterkontrollen kör bara det den ensam kan), de två mätbara målen (under 50 000 fakturerade min/mån med arkitektur som kan bära 2 x augustis takt; väntetidstak dokument <= 5 min, kod <= 12 min median / <= 15 min p95), att skärvningen behålls, snubbeltrådarna (40 000 min; ca 5 % kö-fällningar) och de AVVISADE alternativen med skäl (egen byggmaskin nu, riven skärvning S6/S7, etikett-utlöst full svit, buntning av alla dokument-PR:er, history-rewrite hör INTE hit). Efterkontroll på klocka står som ÖPPEN, deferrad punkt med pekare till research-passet. Precedent citeras ur researchen (Rust auto-bygget, Kubernetes Prow/Tide, Chromium CQ) — ordagrant med URL och hämtdatum, aldrig ur minnet. ADR-097 får en Updates-post: avvisningen gällde session-batchad PUSH; LANDNINGS-buntning av orkestrerarens egna dokument (en bunt per pass) är normalform, agenters dokument-PR:er orörda. Mintas enligt repots count-token-mekanik (docs/decisions/README.md). Källa för besluten: tasks/sessions/2026-09-17-session-126.md Del 17 (grillad samsyn, Marcus kvittens 2026-09-19) + Del 11 (ledstjärnan). Underlag: docs/research/actions-minutbudget-2026-09-18.md. Varje faktapåstående här är en HYPOTES tills du prövat den mot disk (ADR-086). Täcker användarberättelser: 1, 2, 3, 5, 6.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 ADR-133 finns i docs/decisions/, följer repots ADR-mall, och bär ADR-barens tre villkor prövade i egen sektion
- [ ] #2 Varje beslut 1–6 i Del 17 återfinns i ADR:n med sitt skäl och sitt avvisade alternativ; inget beslut är omtolkat
- [ ] #3 Minst tre branschprecedent citerade ordagrant med URL + hämtdatum ur researchen; är precedent-rymden tunn på en punkt sägs det öppet
- [ ] #4 ADR-097 bär en Updates-post om distinktionen push/landning; ADR-076, ADR-077 och ADR-036 pekar på ADR-133 där den ändrar deras räckvidd
- [ ] #5 npm run check:docs grön (ADR-räkningen och index uppdaterade)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
