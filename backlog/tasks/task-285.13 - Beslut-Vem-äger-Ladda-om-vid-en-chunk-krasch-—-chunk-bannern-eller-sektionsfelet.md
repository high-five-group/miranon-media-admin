---
id: TASK-285.13
title: >-
  Beslut: Vem äger 'Ladda om' vid en chunk-krasch — chunk-bannern eller
  sektionsfelet?
status: To Do
assignee: []
created_date: '2026-08-21 14:14'
updated_date: '2026-08-22 08:56'
labels:
  - ready-for-human
dependencies:
  - TASK-285.5
  - TASK-285.7
parent_task_id: TASK-285
ordinal: 530000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
TVÅ oberoende bygg-agenter mätte samma sak, var och en i sin egen skiva, utan att känna till den andras slutsats.

FAKTISKT TILLSTÅND: vid en verklig chunk-fel-krasch monteras SAMTIDIGT (a) ChunkBanner (TASK-285.5, global, role=alert, knapptext 'Ladda om', placerad som första barn i main) och (b) SectionError (TASK-285.7, MessageBox intent=error, role=alert, knapptext 'Ladda om' sedan 285.7). Två SAMTIDIGT FYLLDA alert-regioner med IDENTISKT tillgängligt namn.

HUR DET UPPTÄCKTES: TASK-285.7:s eget nya test föll på 'strict mode violation' — en oscopad getByRole('button', { name: 'Ladda om' }) matchade båda knapparna. Agenten scopade sin lokator till SectionErrors egen alert-region och flaggade dubbleringen utan att lösa den. TASK-285.5-agenten verifierade sedan fyndet mot #1718:s FAKTISKA diff (inte mot orkestrerarens referat) och bekräftade det oberoende, likaså utan att bygga en lösning. Båda gjorde rätt: ingen av dem ägde frågan.

VARFÖR DET INTE ÄR EN DETALJ: TASK-285:s användarberättelse 15 lyder 'Som skärmläsaranvändare vill jag att det aldrig finns två tomma alert-regioner i en vy, så att landmärkesnavigering förblir entydig'. Den handlar om TOMMA regioner, men andan är entydig navigering — två samtidigt FYLLDA alert-regioner med samma namn är en skarpare variant. Tillgänglighet är 11 utan undantag (CLAUDE.md § Kvalitetsribba). Familjen har dessutom redan tagit ställning till att notiser inte får konkurrera: TASK-285.5:s kort säger att chunk-bannern 'ersätter uppdateringsnotisen, staplas aldrig på den'. Detta är samma klass, ett annat par.

FUNKTIONELLT GÖR BÅDA RÄTT SAK. Detta är inte en bugg som ska lagas av nästa agent — det är ett produktbeslut om vilken yta som äger åtgärden när hela sidan ändå behöver laddas om.

OPTIONS-RYMDEN (ej uttömmande, ej rekommenderad — Marcus avgör): (1) chunk-bannern äger 'Ladda om', sektionsfelet visar ingen knapp när chunk-flaggan är satt; (2) sektionsfelet äger den, chunk-bannern kortas till ren information; (3) båda behålls men bara en bär role=alert och den andra role=status; (4) de får olika tillgängliga namn som skiljer räckvidd ('Ladda om sidan' kontra 'Ladda om den här delen') — notera att alternativ 4 kolliderar med ADR-121 beslut 7:s copy-regel att 'Ladda om' aldrig skrivs om.

MÅSTE AVGÖRAS FÖRE TASK-285.10 (stämplingen) — Marcus kan inte stämpla en familj vars två ytor konkurrerar om samma åtgärd. Bör vägas ihop med TASK-285.9 (härdningen), som är den naturliga hemvisten för verkställandet.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Marcus har valt vilken yta som äger 'Ladda om' vid chunk-krasch, och valet är bokfört verbatim i ADR-121 § Updates eller i DESIGN-SYSTEM-SPEC § 21
- [x] #2 Det valda beteendet är verkställt i koden och bevisat med ett test som fäller om båda regionerna åter får identiskt tillgängligt namn
- [x] #3 Beslutet är sammanvägt med ADR-121 beslut 7:s copy-regel (Ladda om skrivs aldrig om till Uppdatera) så att lösningen inte bryter familjens språk
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verkställt 2026-08-22 (alternativ 1). Sektionsfelet renderar ingen actions-slot när chunk-flaggan är satt; chunk-bannerns knapp är orörd ("Ladda om" oförändrad). Chunk-grenens brödtext bär lösningen i ord ("Ladda om sidan för att hämta den nya versionen"), eftersom den gamla lydelsen bar kvar det del-scopade löftet. Beslutet bokfört i ADR-121 § Updates 2026-08-22 (ADR-100 §1 rad 2: beslut + avvisade alternativ ägs av ADR:er); DESIGN-SYSTEM-SPEC § 21 § Öppna poster fick en pekare, inte en kopia.

PREMISS-DIVERGENS (ADR-086): kortets AC #3 och Description tillskriver copy-regeln "Ladda om skrivs aldrig om" till ADR-121 BESLUT 7. Beslut 7 i ADR-121 heter "Copy-omskrivningen följer formvalet, den föregår det inte" och innehåller ingen sådan regel. Regelns faktiska, auktoritativa hemvist är docs/specs/DESIGN-SYSTEM-SPEC.md § 21 § Copy-golvet, rad 1796: "Ladda om", inte "Uppdatera" (FK/AF + WordPress 17/17, mätt domänkollision mot "uppdatera en anmälan"). REGELN håller och band lösningen; bara källhänvisningen var fel. Alternativ 4 är alltså uteslutet av § 21:s copy-golv, som beslut 4 + 7 tillsammans gav familjen.

KÄND KONSEKVENS, bokförd i ADR-updaten: ChunkBanner bor i AppShell, så på ytor utanför skalet (login, glomt-losenord, /dev/*) visas sektionsfelets chunk-besked utan banner bredvid. Därför bär brödtexten lösningen i ord i stället för en hänvisning uppåt.
<!-- SECTION:NOTES:END -->
