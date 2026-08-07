# Grillnings-substrat kod-verifieras FÖRE frågorna — dokumenten är karta, koden är terräng

**Innan en grillningsfråga formuleras ur research-dok, trådar eller ADR:er:
verifiera substratets bärande premisser mot koden. En fråga byggd på en
dok-premiss som koden redan falsifierat slösar en hel kvittensrunda — och
riskerar att låsa ett beslut om att bygga något som redan finns.** `[UNIVERSAL]`

Mätt 2026-08-07 (S99, uppdrag 1-grillningen). Grillningens fråga 2 och 5
presenterade "bygg ADR-087-hooken" som en skiva, med substratets ord "PENDING
IMPLEMENTATION" som grund — hämtat ur research-passens text (2026-07-30) och
ett Explore-svep som läste dokument, inte `scripts/`. Verkligheten:
`scripts/stop-vakt.sh` var byggd, registrerad på båda hook-eventen och
tvåsidigt bevisad sedan `TASK-113` (commit `2971a165`). Divergensen upptäcktes
först i `/to-prd`:s skarv-steg — EFTER att Marcus kvitterat en plan som
innehöll en redan byggd komponent — för att en `ls scripts/` råkade visa
`test-stop-vakt.sh`.

Marcus fällde principen i klartext: *"KODEN är och ska vara den enda
sanningskällan. Hade du använt research-pass på att utforska koden innan
grillningen eller innan frågorna så skulle vi slippa överraskningar."*

**Formen som håller:** grillnings-förberedelsens faktainsamling får aldrig
stanna vid dokument-svep. För varje mekanism substratet påstår vara
byggd/obyggd/pending: ett kod-bevis (filen finns/finns inte, registreringen
finns/finns inte, testsviten finns/finns inte) INNAN premissen bär en fråga.
Kostnad: sekunder per premiss. Alternativkostnad: en felaktig skiva i en
kvitterad plan, en korrektionsrunda, och förtroendeslitage på grillningen som
form.

**Släktskap:** ADR-086 kräver redan att UPPDRAGS-mottagaren prövar premisser —
denna lärdom flyttar samma disciplin ett steg tidigare, till
grillnings-förberedelsen: intervjuaren prövar sitt eget substrat innan det blir
frågor. Pre-K-forensikregeln (hub-CLAUDE.md) säger samma sak för
config-förslag; detta är dess grillnings-form.
