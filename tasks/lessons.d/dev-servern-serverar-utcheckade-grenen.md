# Dev-servern serverar huvudkatalogens utcheckade gren — en gren-växling är en tillståndsändring för varje levande server i trädet

**En `git switch` i en katalog med en levande dev-server byter INNEHÅLLET i
allt servern servar, utan omstart och utan varning. Granskningsytor,
demolänkar och pågående QA som pekar på servern följer med till den nya
grenen — mitt i användningen.** `[UNIVERSAL]`

Mätt 2026-08-13 (S103): en gren-växling i huvudkatalogen svepte undan den yta
Marcus just granskade — servern på `:5173` bytte tyst till den nya grenens
värld. Samma mekanik åt andra hållet 2026-08-15: QA-vandringens server
startades MEDVETET först efter att huvudkatalogen ställts på main, så att
det granskade var det landade.

**Det generella:** servern är en projektion av arbetsträdet, inte en frusen
kopia. Operativa konsekvenser: (1) före `git switch` i en katalog — inventera
levande servrar därifrån; (2) före granskning — verifiera VILKEN gren
serverns katalog står på; (3) parallella sessioner använder egna portar OCH
egna kataloger, aldrig bara egna portar (en främmande sessions server på en
port säger inget om vilken katalog den projicerar).
