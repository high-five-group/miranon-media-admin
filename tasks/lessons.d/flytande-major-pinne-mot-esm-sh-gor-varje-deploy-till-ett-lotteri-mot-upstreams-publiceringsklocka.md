# Flytande major-pinne mot esm.sh gör varje deploy till ett lotteri mot upstreams publiceringsklocka

**[UNIVERSAL] En import som pekar på "senaste 2.x" (`esm.sh/@supabase/supabase-js@2`)
bundlas på nytt vid varje deploy mot vad CDN:et råkar resolva just då. Publicerar
upstream en ny version minuter före deployen kan CDN:et ha huvudpaketet men
inte dess transitiva beroende färdigbyggt, och bundlingen faller med "Module not
found" på första funktionen — utan att någon kodrad i repot ändrats.** Mätt
2026-09-07 (S123 resume 1): `fas4-prod-deploy.sh --deploya` föll på
`compute-segment` med `Module not found
"https://esm.sh/@supabase/functions-js@2.116.0/denonext/functions-js.mjs"`;
`npm view @supabase/supabase-js time` gav 2.116.0 publicerad 16:26:56 UTC, deployen
kördes ~16:45 UTC, och samtliga tre esm.sh-adresser svarade 200 vid mätning 16:50 UTC.
Andra körningen ~16:55 UTC gick igenom — prod bär nu 2.116.0 medan staging-EF:erna
(bundlade 2026-09-06 17:07 UTC) bar 2.115.0 tills de deployades om samma kväll.
Marcus ordagrant: *"Deployen har ALDRIG strulat förut."* Den hade inte det —
fönstret är minuter brett och ingen hade träffat det. Regel: pinna exakt version
i varje EF-import (samma version överallt), byt version bara via en avsiktlig PR,
och låt en CI-grind fälla flytande major-pinnar; faller en deploy på
"Module not found" mot ett CDN är första åtgärden att läsa upstreams
publiceringstid, inte att felsöka koden. Kort: `TASK-433`.
