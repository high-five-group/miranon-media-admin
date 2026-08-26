# Svensk apostrof i en `.purge-staging-policy.json`-notruta trigger listparitet-grinden

TASK-309.22 (2026-08-26), miranon-media-admin · `scripts/check-listparitet.sh`

**Vad som antogs:** att ett fritt formulerat, förklarande `_TASK-nnn`-notfält
i en ny purge-target (samma mönster som `generate-event-attachment-sentineler`
redan bär) var fritt att skriva prosa i, så länge JSON:en var giltig.

**Vad som faktiskt hände:** `npm run check:docs` föll på paret
`sentinel-markorer` — grinden extraherar VARJE `'...'`-sekvens ur HELA
`.purge-staging-policy.json` (inte bara ur `filterByFormula`/
`exactMatchPattern`) och kräver en motsvarande backtick-kodspan i
`CONTRIBUTING.md`. Min förklarande prosa innehöll dels en possessiv-apostrof
(`upload-attachment.staging.test.ts's sentinel-formel…`), dels ett citerat
filnamn omslutet av raka enkelcitat (`EXAKT '2025-HörlurarMiranonMedia.pdf'`)
— fem apostrofer totalt, ett udda antal, vilket fick regexen att para ihop
GODTYCKLIGA textsnuttar mellan dem som om de vore markörer. Tre falska
"markörer" rapporterades, ingen av dem en verklig sentinel-sträng.

**Varför det inte syntes i den befintliga `generate-event-attachment-
sentineler`-noten:** den noten råkar ENDAST använda enkelcitat runt de TVÅ
faktiska markör-strängarna (`'Bekräftelsebilaga –'`/`'Deltagarinformation –'`)
och undviker possessiv-apostrofer helt — inte av uttalad regel, utan av
skrivvana. Grinden såg alltså aldrig detta fall förrän en fri-prosa-not med
apostrofer i BÅDA rollerna (possessiv OCH citattecken) skrevs.

**Hur det löstes:** skrev om noten till att helt sakna raka enkelcitat —
possessiv via `:s` (samma svenska tekniska konvention som `EF:ens`/`CLI:ts`
redan använder i repot) och citerade strängar utan citattecken alls (kontext
gör det tydligt). Den FAKTISKA sentinel-markören (`ZZ-attachment-filename-
test-`, i `filterByFormula`) fick sin egna backtick-motsvarighet tillagd i
`CONTRIBUTING.md`s sentinel-markörer-stycke, enligt paritetsgrindens krav.

**Generalisering [UNIVERSAL för alla spokes med samma
`check-listparitet.sh`-mönster]:** ett fritt-text-notfält i EN sida av ett
`sentinel-markorer`-liknande listparitetspar är INTE fritt från grindens
teckenklass bara för att det "bara är en kommentar" — grinden läser rå text,
inte JSON-semantik eller fältnamn. Skriv sådana noter helt utan raka
enkelcitat (`'...'`); använd backticks eller ingen quotering alls. Kör
`npm run check:docs` (eller minst `bash scripts/check-listparitet.sh`)
INNAN push så en spridd apostrof upptäcks lokalt, inte i CI.
