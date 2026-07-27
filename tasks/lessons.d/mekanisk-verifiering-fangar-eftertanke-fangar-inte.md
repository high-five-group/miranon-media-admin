# Mekanisk verifiering fångar felen; granskning av egen kod gör det inte

**Fyra av fem fel i ett arbetspass fångades av parsning, skarp körning, negativt
self-test och empirisk kartläggning. Noll fångades av att läsa igenom det egna
arbetet.**

**Empiri (S91, 2026-07-27, Del 6):** fördelningen mättes i efterhand över ett
pass med fem fel. Varje fångst hade ett *instrument* bakom sig — aldrig en
genomläsning.

Detta är inte en observation om en enskild dag utan stöd för den etablerade
fångst-fördelningen (self-review ~9 %, transparens-rapport ~64 %,
Marcus-pushback ~27 %). Den praktiska konsekvensen är att tiden ska läggas på att
**bygga instrumentet**, inte på att granska hårdare: ett negativt self-test som
tar fem minuter att skriva fångar mer än trettio minuters läsning.

**Motmedlet i praktiken:** när ett arbete känns färdigt, fråga inte *"har jag
missat något?"* utan *"vilket kommando skulle avslöja att jag missat något?"* —
och kör det. Den första frågan har empiriskt svarsfrekvens nära noll.
