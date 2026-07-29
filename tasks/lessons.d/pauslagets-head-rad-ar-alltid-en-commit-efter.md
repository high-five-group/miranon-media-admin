# PAUSLÄGE-blockets HEAD-rad är alltid en commit efter — det är formen, inte ett slarv

**Ett paus-block som bokför sitt eget `HEAD` skriver ner ett värde som paus-commiten
själv omedelbart gör inaktuellt. Avvikelsen är därför inbyggd i formen och ska
läsas som förväntad, inte utredas som divergens vid varje resume.** `[UNIVERSAL]`

**Empiri (S91, fem förekomster under tre dygn):** sjunde, åttonde, nionde,
trettonde och femtonde resumen fann alla samma sak — `PAUSLÄGE`-blockets
`main @ <sha>` pekade en commit före faktiskt `HEAD`. Femtonde resumen: blocket
sade `f3a2a11`, disk sade `02a9517` — och `02a9517` var merge-commiten för
*pausens egen PR*.

Mekanismen är trivial när den väl är utskriven: paus-blocket författas, commitas,
pushas och mergas. Raden som beskriver `HEAD` skrivs alltså **före** den commit som
landar raden. Den kan per konstruktion aldrig vara aktuell i det ögonblick nästa
resume läser den.

**Den trettonde resumen formulerade det redan rätt** — *"mönstret är nu så stabilt
att det är en egenskap hos paus-formen, inte ett misstag per gång"* — och lämnade
det som lesson-kandidat. Detta är den posten, med en femte datapunkt.

**Vad lärdomen ändrar i praktiken:**

1. **Disk vinner, alltid.** Det är redan resume-rutinens regel; det som saknats är
   att veta att just *denna* avvikelse är väntad och inte behöver undersökas.
2. **Rapportera den som bekräftad form, inte som fynd.** En förväntad avvikelse som
   varje gång rapporteras som ⚠️ tränar läsaren att ignorera ⚠️ — och då kostar den
   mer än den upplyser.
3. **Fixa den inte genom att skriva om paus-formen.** Att låta paus-blocket utelämna
   `HEAD` vore att ta bort information som ÄR användbar (den säger vad som var landat
   när pausen skrevs). Rätt åtgärd är att formen bär sin egen begränsning i klartext.

**Den generella klassen:** varje artefakt som bokför sitt eget tillstånd i samma
skrivning som ändrar tillståndet lider av detta. Sessionsdokets `updated:`-fält,
en CHANGELOG:s "senast ändrad", ett kort som noterar sin egen commit — alla är
samma form. **Frågan att ställa är inte "stämmer värdet?" utan "kunde värdet ha
stämt när det skrevs?"** Är svaret nej är avvikelsen formens, inte författarens.
