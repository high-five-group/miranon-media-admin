# En delad primitivs inre wrapper bryter konsumenternas min-w-0-kedja utan att något test faller

**Att lägga ett nytt element mellan en primitiv och dess `children` ändrar
DOM-hierarkin för varje konsument; ett flex-item utan `min-w-0` i den
kedjan gör varje `truncate` nedanför verkningslös, och det syns bara när
ett innehåll är längre än sin behållare — vilket ingen fixtur hade.** Mätt
2026-09-07 (S123 resume 1): TASK-361 r2 (`ac2143f7`, 2026-09-02) lade ett
`<span className="inline-flex items-center justify-center">` runt Button:s
children för att laddläget inte skulle ändra måttet; fem dagar senare såg
Marcus i prod att en bekräftelsebilagas långa namn på Mer → Bilagor rann
584 px utanför kortet på desktop och 794 px på mobil, trots att
`DokumentYta.tsx` var oförändrad sedan 2026-08-30 och uttryckligen byggde
klippningen på `min-w-0` i varje led. Forensiken gick via
`git diff <prod-baslinje>..main -- <vyn>` (tom på relevanta rader) → `git
log --since` på primitiver/stilar → TASK-361:s diff. Fixen (`TASK-431`,
PR #2452): `min-w-0 max-w-full` på etikett-spannet plus ett hermetiskt
boundingBox-test med ett 90-teckens namn. Regel: en primitiv som omsluter
`children` bär `min-w-0 max-w-full` på omslaget som default, och dess
egen testsvit bär ett trunkeringsfall med överlångt innehåll — annars är
klippningen en egenskap ingen grind vaktar.
