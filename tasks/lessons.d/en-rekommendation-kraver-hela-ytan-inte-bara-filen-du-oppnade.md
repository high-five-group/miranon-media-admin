# En rekommendation kräver hela ytan, inte bara filen du öppnade

**Läser du en komponentfil och drar en slutsats om vad som SAKNAS på skärmen, har
du bara läst en del av skärmen. Det som saknas kan mycket väl renderas av
anroparen.** `[UNIVERSAL]`

Mätt 2026-08-06 (S93, iterationsvåg 3). Marcus rapporterade att talen krockade:
topp-räknarna visar 12 (aktiva), registret 14 (alla, inkl. två avbokade).
Rekommendationen blev: *gör de saknade synliga — lägg en "Avbokade 2"-rad i
toppen*, med motiveringen att Lotta då själv räknar 12 + 2 = 14.

Underlaget var `HallplatsToppA` i `DeltagareHallplatsPrototyp.tsx`, där de fyra
stegraderna bor. Där fanns ingen Avbokade-rad. Slutsatsen "raden saknas" följde.

**Den var fel.** Raden fanns — i logistik-gruppen, renderad av `Deltagare.tsx`
intill "Eventinfo skickad" och "Bor över". DOM-mätningen efter bygget visade
**två identiska "Avbokade 2"-knappar 197 px isär**. Rekommendationen vilade på
en premiss som en enda grep över anropande fil hade fällt.

**Vad som räddade det:** att mäta den byggda ytan i browsern i stället för att
lita på att koden gjorde det den skulle. Felet fångades före handover, inte av
Marcus. Men det borde inte ha byggts alls.

**Det generella:** en komponent äger sin egen JSX, aldrig skärmen. Frågor av
formen *"visas X någonstans?"* eller *"saknas X?"* besvaras med en sökning över
hela renderingsvägen — anropare, syskon, wrappers — eller med en DOM-mätning.
Aldrig med "jag läste komponenten och såg inget".

Symptomet var här dubbel rendering, vilket är billigt. Samma felklass i motsatt
riktning — *"det finns redan, jag bygger inget"* — är dyrare, eftersom den inte
lämnar något spår att mäta.

**Fixen som blev kvar:** upplysningen bor nu där talet 14 föds, i registrets fot
("Visar 14 av 14 i registret — 2 av dem är avbokade"). Informationen saknades
alltså aldrig; den stod 200 px från talet den förklarade.
