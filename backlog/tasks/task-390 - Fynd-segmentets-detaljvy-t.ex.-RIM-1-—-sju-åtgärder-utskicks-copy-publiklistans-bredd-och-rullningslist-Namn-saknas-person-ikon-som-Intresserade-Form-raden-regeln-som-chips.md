---
id: TASK-390
title: >-
  Fynd: segmentets detaljvy (t.ex. RIM 1) — sju åtgärder: utskicks-copy,
  publiklistans bredd och rullningslist, 'Namn saknas' + person-ikon som
  Intresserade, Form-raden, regeln som chips
status: To Do
assignee: []
created_date: '2026-09-04 10:03'
updated_date: '2026-09-05 16:54'
labels:
  - ready-for-agent
dependencies: []
ordinal: 687000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
FYND (Marcus 2026-09-04, S120 Del 1, verbatim i sessionsdoket): öppnar man ett segment, t.ex. RIM 1 (Mer → Segment → kort), ser man sju saker att åtgärda i detaljvyn. Formen bor i src/components/segment/prototyp/VariantD.tsx (skarpa vyn sedan TASK-249.5/TASK-379; SegmentDetalj rad ~2620, PublikSektion rad ~2380–2600, PersonRad rad ~2331, visatNamn rad ~1035, definitionFor rad ~742). Ytan är facit-stämplad (tasks/sessions/bilagor/s104-segment-divergens/facit.json, godkand 2026-08-16) — ändringarna landar som FACIT-AMENDERING i den bilagan (mönster: AMENDERING-2026-08-31-startvyns-sidram-och-messagebox.md), efter att Marcus itererat och stämplat formen i webbläsaren. ARBETSFORM: ett förslag på alla sju i EN draft-PR med skärmdumpar (desktop 1440 + mobil 375) → Marcus itererar → stämpel → amenderings-fil + review-loop → landning. PUNKTERNA (Marcus ord): 1) 'Skicka utskick till det här segmentet' byts till 'Gör ett utskick till det här segmentet' (rad ~2718). 2) Listan med publiken har inte rätt bredd — mät mot sidans övriga kort; kommentaren i koden (rad ~2572) talar om en yttre mx-4 men koden bär <div className="px-4"> inuti en sektion som redan har inset, sannolikt dubbel inset. 3) Rullningslisten på publiklistan går för högt upp — jämför förebilden DeltagarListan (src/components/events/detail/Deltagare.tsx ~1189) och mät. 4) '(namn saknas)' byts till 'Namn saknas' utan parentes (visatNamn rad ~1036; aktaNamn/NAMN_SENTINEL-logiken orörd). 5) Initial-rundeln visar en person-ikon när namn saknas, EXAKT som Intresserade-sidan: src/components/intresserade/Intresserade.tsx rad ~101–110 (UserRound size-5 i size-9-rundel bg-bg-muted text-text-muted, aria-hidden), aldrig initialer ur platshållarsträngen. 6) Regel-blockets rad 'Form: Predikat över dimensioner' (rad ~2740) är obegriplig (Gunilla-principen). Orkestrerarens rekommendation: ta bort raden — den skiljer två interna regelformer (predikat vs ärvd uppräknad) som användaren inte har någon nytta av; Räknas ur/Motsvarar bär den mening som finns. Marcus avgör i iterationen. 7) Reglerna i regel-blocket är i dag prosa (definitionFor: beskrivning vinner, annars klartext 'A ELLER B. Utan: C'). Marcus: 'borde de inte vara nedtonade eller sitta i pills eller rutor?' Orkestrerarens rekommendation: behåll avsiktsmeningen som prosa och rendera själva regeln STRUKTURERAT under den som chip-grupper (utbildning/nivå som chips i regelverkstadens ValChip-stil fast läs-only, operatorerna 'och'/'eller'/'utan' som text mellan) — samma mönster som filter-pills hos Linear/GitHub/Notion. Marcus avgör i iterationen. Källor: S120 sessionsdok Del 1 · s104-facit · Intresserade.tsx · Deltagare.tsx.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Copy: primärknappen lyder 'Gör ett utskick till det här segmentet'; ingen annan sträng ändrad; acceptance-test som asserterar knapptexten uppdaterat.
- [x] #2 Publiklistans platta har samma yttre kant som sidans övriga kort (mätt i DOM: samma vänster/höger-x som KORT_KLASS-korten på 1440 och 375); dubbel inset borta.
- [x] #3 Rullningslisten börjar i nivå med listans första rad och slutar vid sista, som DeltagarListan; ingen list ovanför innehållet; fokusring och print-läge oförändrade.
- [x] #4 Namnlös medlem visas som 'Namn saknas' (utan parentes) med person-ikon i rundeln enligt Intresserade.tsx-mönstret; namngivna rader oförändrade; räknaren 'namnlösa' oförändrad.
- [x] #5 Form-raden i Regeln-blocket är borttagen ELLER omskriven enligt Marcus stämpel; ingen teknisk term (predikat/dimension) syns för användaren.
- [x] #6 Regeln renderas som Marcus stämplat i iterationen (rekommendation: avsiktsmening som prosa + chip-grupper för utbildningar/nivåer med operatorer som text); prefers-contrast: more och print klarar formen; aria-snapshot i tests/visual/segment-promoverings-grind.spec.ts uppdaterad medvetet i samma landning om DOM ändras.
- [x] #7 Facit-amendering skriven i tasks/sessions/bilagor/s104-segment-divergens/ (AMENDERING-<datum>-detaljvyn-sju-atgarder.md) med Marcus stämpelcitat och nya bilder; facit.json orört i övrigt.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
