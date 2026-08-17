# Ett facit som blir irrelevant arkivflyttas med ARKIVERAD.md och pekar-svep — det raderas aldrig

**När en yta byggs om från grunden pekar det gamla, stämplade facitet på
komponenter som inte längre finns, och facit-grinden fäller. Radering är fel
svar: kvittot på en genomförd granskning är historik som ska överleva. Formen
som gäller är ARKIVFLYTT — bilagekatalogen flyttas under
`tasks/sessions/archive/bilagor/`, en `ARKIVERAD.md` förklarar varför och vad
som ersatte den, och alla inpekningar svepas i SAMMA landning.**

Instans (S102, 2026-08-16, Marcus vägval 1): Morgonkollen (`task-243.1`, PR
**#1426**, merge `3792359d`) rev sex hem-komponenter. Facit-grinden fällde
eftersom det gamla `s55-hem-konvergens`-facitet pekade på just dem. Vägvalet
blev arkivflytt till `tasks/sessions/archive/bilagor/s55-hem-konvergens/` +
`ARKIVERAD.md` + pekar-svep — bokfört som PREJUDIKAT, inte som engångsfix.
Två självfångade verktygsfel uppstod under själva flytten (pipe-dold
checkout-exitkod och tyst `git add`-pathspec-avbrott), båda rättade öppet i
samma pass.

**Det generella:** ett stämplat facit är ett granskningskvitto med en
namngiven granskare. Grinden fäller för att kvittot pekar fel, inte för att
kvittot är värdelöst. Flytta det dit där det fortsätter vara sant (arkivet),
lämna en förklaring, och laga pekarna i samma commit — annars blir grinden
grön på bekostnad av spårbarheten.
