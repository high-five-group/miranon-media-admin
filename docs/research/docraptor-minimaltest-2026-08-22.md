---
owner: marcus803
updated: 2026-08-22
review_by: 2026-11-22
status: draft
---

# DocRaptor-minimaltestet — skarpt anrop från en Edge Function i staging (2026-08-22)

> **Proveniens:** kortlöst bygg-uppdrag, S108 MARCUS-SEKVENS punkt 3
> (ADR-119 beslut 7 — förkrav för att någon mall ska få byggas mot
> DocRaptor på riktigt). Kört i egen worktree
> (`.claude/worktrees/agent-a250162d50a59919b`), gren
> `feat/s108-docraptor-minimaltest` från `origin/main`
> (`393e857a787fe4db4db70ed42e0e489a0144a6f7`). **Modell:** exakt rad ur
> egen systemprompt — *"You are powered by the model named Sonnet 5. The
> exact model ID is claude-sonnet-5."*
>
> **Detta är ett MÄTPASS med en testharness, inte produktionskoppling.**
> Prototypen (`src/components/dokument/prototyp/GenereringsPrototyp.tsx`),
> `generate-event-attachment` och kvittots `renderKvittoPdf`
> (`_shared/receipt-pdf.ts`) är ORÖRDA.

## Kort svar

**DocRaptor fungerar från en Supabase Edge Function i staging.** Alla tre
bilage-mallarna renderades korrekt (sökbar text, rätt svenska tecken, rätt
inbäddade typsnitt, rätt sidstorlek A4), på 2,8–3,6 sekunder motorlatens per
anrop och 51–310 kB per fil — långt under Resends 40 MB-tak. Felvägarna
(timeout, ogiltig nyckel) svarar ärligt med strukturerad JSON och korrekt
HTTP-status, aldrig en hängning. Ett negativt typsnittstest bevisar att den
självbärande data-URI-inbäddningen faktiskt BÄR fonten i det positiva
fallet — utan den faller PDF:en tillbaka till en annan font.

## Metod

1. **Premiss 1 (pröva innan bygg):** ett rått `curl`-anrop mot
   `https://YOUR_API_KEY_HERE@api.docraptor.com/docs` med svensk text,
   INNAN något byggdes — se § Premiss 1.
2. **`scripts/docraptor-sjalvbarande.mjs`** — gör en redan tokenfylld
   granskningsfil (`scripts/render-bilage-mall.mjs`s utdata) helt
   självbärande: varje `<link rel=stylesheet>` inlinas som `<style>`,
   varje `url(...)`-typsnittsreferens och `<img src>` blir en `data:`-URI.
   Ren regex/Node, inga nya beroenden, samma minimala princip som
   `render-bilage-mall.mjs`.
3. **`supabase/functions/test-docraptor-render/index.ts`** — STAGING-ONLY
   testharness-EF (samma mönster som `test-pdf-generation`, MEDVETET
   UTELÄMNAD ur `.prod-functions-allowlist.conf`). Ren proxy: tar emot
   `{ html, namn }`, POST:ar till DocRaptor med `test: true` (styrt av att
   nyckeln är exakt platshållaren `YOUR_API_KEY_HERE`), 30 s
   `AbortController`-tak (override:bar via `?timeoutMs=` — ENDAST när
   nyckeln är platshållaren), och svarar med PDF-bytes + headers
   `x-docraptor-ms`/`x-pdf-bytes`/`x-docraptor-test-mode`, eller
   `{ fel, status, ms }` vid fel.
4. **`scripts/docraptor-minimaltest.mjs`** (`npm run docraptor:minimaltest`,
   laddar `.env.test`) — kör de tre mallarna × 3 repetitioner mot den
   deployade EF:en, sparar varje PDF i `test-results/docraptor/`, mäter
   latens/bytes, verifierar text via `pdftotext -raw` och typsnitt via
   `pdffonts`, kör felfallen (timeout, ogiltig nyckel) och det negativa
   typsnittstestet, och skriver `test-results/docraptor/matdata.json`.
5. Vägrar köra om `supabase/.temp/project-ref` inte pekar på staging
   (`pqtshyierkdgwdnxuirz`) — mekaniskt, inte bara en kommentar.

## Premiss 1 — DocRaptors testnyckel

```bash
curl -X POST "https://YOUR_API_KEY_HERE@api.docraptor.com/docs" \
  -H "Content-Type: application/json" \
  -d '{"test": true, "document_type": "pdf", "document_content": "<p>åäö ÅÄÖ</p>"}'
```

**HTTP 200.** Giltig PDF (29 523 bytes, Prince 15.1). `pdftotext -raw`
returnerade exakt `åäö ÅÄÖ` — korrekt UTF-8, ingen mojibake.

**Vattenstämpel — bekräftad VISUELLT, INTE i textlagret.** `pdftoppm`-
rendering av testdokumentet visar en repeterad "TEST DOCUMENT"-banderoll
plus texten "Document doesn't look right? We'll help you out!" överst och
underst på sidan. `pdftotext`/`strings` hittar INGET av detta — vattenstämpeln
stör alltså inte den textbaserade verifieringen (a) nedan, men den syns för
en mänsklig granskare eller vid visuell diff. Viktigt för nästa steg: ett
skarpt konto (`test: false`) krävs för vattenstämpelfria dokument.

Detta avgjorde att passet kunde köras utan ett skarpt DocRaptor-konto — inget
konto-förkrav uppstod.

## Byggd harness — vad som deployades

- `supabase/config.toml`: `[functions.test-docraptor-render]` med
  `verify_jwt = true`, tillagd efter `test-attachments-storage`.
- `test-docraptor-render` deployad till **staging**
  (`pqtshyierkdgwdnxuirz`), verifierat via `supabase functions list`:
  `"slug":"test-docraptor-render","status":"ACTIVE","version":1"`.
- **Ej** tillagd i `.prod-functions-allowlist.conf` (verifierat:
  `grep docraptor .prod-functions-allowlist.conf` → 0 träffar).
- `DOCRAPTOR_API_KEY`-secret satt till platshållaren `YOUR_API_KEY_HERE`
  i staging via `supabase secrets set`.

## Mättabellen (a)–(c) — per mall, 3 repetitioner

Alla tre mallar: **1 sida, A4 (595,276 × 841,89 pt), Producer "Prince 15.1"**
(bekräftar branschmotorn — samma renderare som ADR-119 § Beslut 2 valde).
Ingen mall producerade fler sidor än väntat eller trunkerat innehåll.

| Mall | Bytes | EF-latens median/max (ms) | Klient-latens median/max (ms) | åäö+känt ord OK | Mojibake | Vattenstämpel |
|---|---|---|---|---|---|---|
| bekraftelsebilaga | 309 422 | 2990 / 3421 | 4960 / 5542 | JA | NEJ | JA (visuellt bekräftad) |
| deltagarinformation | 68 368 | 2969 / 3040 | 4304 / 4375 | JA | NEJ | JA |
| kvitto | 51 823 | 2941 / 3001 | 4399 / 4607 | JA | NEJ | JA |

"Känt ord" = `Rönninge` (finns i alla tre mallars ifyllda fixture-data via
plats/orgAdress). Textkontrollen kräver samtidigt förekomst av å, ä OCH ö
och frånvaro av vanliga mojibake-mönster (`Ã¥`/`Ã¤`/`Ã¶`/`Â`) — alla nio
körningar (3 mallar × 3 repetitioner) klarade den.

Alla tal ovan är från den SISTA av TRE körningar (`npm run
docraptor:minimaltest`, se `test-results/docraptor/matdata.json`,
gitignorerad artefakt — den tredje körningen skedde efter en Biome-
formateringsfix på mätskripten, som ren regressionsverifiering att fixen
inte ändrade beteendet). Samtliga tre körningars EF-latens låg i samma
ordningsstorlek för `bekraftelsebilaga`: 2874–3021 ms (körning 1),
2805–3101 ms (körning 2), 2990–3421 ms (körning 3). Ingen av de tre
körningarna gav en flake eller ett oväntat fel-svar, och PDF-bytesen var
byte-för-byte identiska över samtliga körningar (samma `bytes`-värde per
mall i alla tre).

> **Rättelse, 2026-08-29 (`TASK-340.3`):** "byte-för-byte identiska" ovan
> går utöver sitt eget belägg (ADR-083-klassen). Mätningen var ett
> byte-ANTAL läst ur svarshuvudet `x-pdf-bytes`
> (`bytes: Number(res.headers.get('x-pdf-bytes'))`,
> `git show 0563adae:scripts/docraptor-minimaltest.mjs` — mätskriptet är
> sedan riven) — ingen hashning, ingen faktisk innehållsjämförelse. Ett
> lika stort men olika `/ID`-par i PDF-trailern hade gett exakt samma
> `bytes`-värde och passerat obemärkt. DocRaptor slumpar i själva verket
> `/ID` per anrop och kan inte styras (belagt oberoende: fältet saknas
> bland DocRaptors dokumenterade `prince_options`, en `pdf_id`-parameter
> strippas vid API-gränsen, och `/ID` varierade mellan två anrop med
> identisk indata). Se
> [`forhandsgranska-spara-atervand-bilageflodet-2026-08-29.md`](forhandsgranska-spara-atervand-bilageflodet-2026-08-29.md)
> § 2.3 för hela underlaget. Originaltexten ovan lämnas orörd — detta är en
> tillagd, daterad not, ingen tyst omskrivning.

**Typsnitt (`pdffonts`, positivt fall) — Carlito faktiskt inbäddad och
använd i alla tre:**

- bekraftelsebilaga: `Carlito-Regular`, `Carlito-Bold`, `Carlito-BoldItalic`,
  `ComicNeue-Bold`, `Selawik-Bold` — alla `emb=yes`.
- deltagarinformation: `Carlito-Regular`, `Carlito-Bold`, `Carlito-Italic`,
  `ComicNeue-Bold` — alla `emb=yes`.
- kvitto: `Carlito-Regular`, `Carlito-Bold` — `emb=yes`.

`Cavolini` (rubrikfontet) förekommer INTE i något fall — förväntat: den
licensierade filen saknas i denna worktree (ingen `lokala-typsnitt`-symlänk,
se `bilaga-delad.css`s eget filhuvud), så CSS-fallbacken till Comic Neue
Bold/Selawik-Bold tog över. Detta är samma FALLBACK-mekanism det negativa
typsnittstestet nedan bevisar medvetet för Carlito.

**(b) Latens-observation värd att bokföra:** skillnaden mellan EF-latens
(motorns egen `x-docraptor-ms`, mätt runt `fetch`) och klient-latens
(hela HTTP-resan från denna testrigg) är 1,2–2,1 sekunder — Supabase
gateway + auth + nätverksresan mellan testriggen (denna Mac) och
Edge-noden. Det är INTE representativt för produktionsflödet: ADR-119
beslut 3 kör genereringen EN gång per event, i förväg, aldrig i
sändvägens kritiska väg — så varken EF-latensen eller klient-overheaden
ligger på en väntande användare.

## Felfallen (d) — faktiska svar

**Timeout (`?timeoutMs=1`, honoreras eftersom nyckeln är platshållaren):**

```json
{"fel":"DocRaptor svarade inte inom 1 ms (timeout)","status":504,"ms":17.0}
```

HTTP 504, JSON, ingen hängning. `AbortController` avbröt `fetch` inom
millisekunder av det satta taket (uppmätt EF-intern tid 16,7–28,3 ms över de
tre körningarna — overhead från `AbortController.abort()` till att `fetch`
faktiskt kastar `AbortError`, inte DocRaptor-nätverkstid).

**Ogiltig nyckel (secret temporärt satt till `fel-nyckel`):**

```json
{"fel":"DocRaptor svarade 401: <?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<errors>\n  <error>Please provide a valid API key.</error>\n</errors>\n","status":401,"ms":1208}
```

HTTP 401, DocRaptors faktiska felmeddelande vidarebefordrat. Secret
återställdes till `YOUR_API_KEY_HERE` i SAMMA skriptkörning (`finally`-block)
— verifierat dubbelt: (1) `supabase secrets list`s `updated_at` för
`DOCRAPTOR_API_KEY` ändrades vid både sättning och återställning, (2) ett
separat slutverifieringsanrop EFTER hela passet gav `status 200,
content-type application/pdf, x-docraptor-test-mode true` — beteendemässigt
bevis, inte bara ett tidsstämpel-antagande, att nyckeln verkligen fungerar
igen.

## Negativt typsnittstest — Carlito medvetet uteslutet

`kvitto`-mallen självbärande-gjord med `Carlito-{Regular,Bold,Italic,
BoldItalic}.ttf` MEDVETET uteslutna ur data-URI-inbäddningen (`--utan-
typsnitt`-flaggan i `docraptor-sjalvbarande.mjs`). Anropet lyckades
(HTTP 200, 66 358 bytes — större än det positiva kvitto-fallets 51 823 bytes,
olika font-subsets ger olika storlek).

`pdffonts` på resultatet:

```text
name                type      encoding  emb sub uni
PXAAAA+Calibri-Bold  TrueType  WinAnsi   yes yes yes
PXAAAB+Calibri       TrueType  WinAnsi   yes yes yes
```

**Ingen Carlito.** Prince föll tillbaka till sitt eget default (`Calibri`),
INTE till Comic Neue/Selawik som CSS-stacken specificerar för `Cavolini`
(rubrikfontet) — `bilaga-delad.css` har ingen egen fallback-kedja definierad
för `Carlito` bortom det generiska `sans-serif`, så Prince väljer sin egen
standard. Det bekräftar det som skulle bevisas: när fonten FINNS i den
självbärande HTML:en (det positiva fallet ovan) används den FAKTISKT
(`Carlito-Regular`/`Carlito-Bold` inbäddade och `emb=yes`) — inbäddningen är
inte kosmetisk, den styr verkligen vilket typsnitt renderaren väljer.

## Vad som INTE mättes

- **Skarp DocRaptor-nyckel / `test: false`.** Prod-kontot är, per uppdraget,
  ett Marcus-moment utanför detta pass. Vattenstämpelfria dokument och
  faktisk fakturering är overifierade.
- **Kostnad.** Ingen fakturering skedde (testnyckeln är gratis) — det
  verkliga priset per anrop mot ett skarpt konto är overifierat här.
  ADR-119 § Konsekvenser räknade redan 30 event × 2 dokument ≈ 5,5
  genereringar/månad ≈ 4 % av billigaste plan — den siffran är OFÖRÄNDRAD
  av detta pass, bara motorns FUNKTION är nu bevisad.
- **Kallstart.** EF:en var redan varm (nyligen deployad + flera föregående
  anrop) vid varje mätning i detta pass — ingen isolerad
  första-anrop-mot-kall-instans-mätning gjordes. `test-pdf-generation`s
  precedent (TASK-146.1) mätte kallstart externt (första vs efterföljande
  anrop); samma metod skulle behövas här om kallstart blir relevant för en
  framtida SLA-diskussion.
- **Nätverksvariabilitet över tid.** Två körningar samma dag, samma
  nätverk — ingen mätning över flera dagar/tider.
- **Riktiga persondata.** Alla fixturer är fiktiva (Anna Andersson,
  fiktivt kvittonummer) — oförändrat från de befintliga fixturerna i
  `docs/mallar/bilagor/fixtures/`.

## Rekommendation — nästa steg

Motorn är bevisat körbar från staging-EF:en med rätt svensk text, rätt
typsnitt, rimlig latens och ärlig felhantering. Nästa steg (utanför detta
pass scope) är att koppla ihop det med produktflödet:

1. **Prototypens förhandsgranskning → EF → `blob:`-URL i ny flik** —
   samma DokumentYta-mönster (`src/components/dokument/DokumentYta.tsx`)
   som redan visar genererade dokument, men med `test-docraptor-render`
   (eller dess produktionsvariant) som källa i stället för webbläsarens
   `document.write`. `renderaDokument()`s självbärande HTML-byggnad
   (rad ~542, `GenereringsPrototyp.tsx`) är redan nästan identisk med vad
   `docraptor-sjalvbarande.mjs` gör — de kan sannolikt dela logik i en
   framtida skiva i stället för att hållas som två separata
   implementationer.
2. **En riktig `generate-*-attachment`-EF per mall**, byggd på
   `test-docraptor-render`s bevisade anropsmönster men med skarp nyckel,
   `test: false`, och Storage-persistering (samma mönster som
   `generate-event-attachment` redan har för klass B).
3. **Skarpt DocRaptor-konto** — Marcus-moment, förkrav för
   vattenstämpelfria produktionsdokument.

## Artefakter

- `scripts/docraptor-sjalvbarande.mjs` — självbärande-görare (återanvändbar).
- `supabase/functions/test-docraptor-render/index.ts` — staging-only
  testharness-EF.
- `scripts/docraptor-minimaltest.mjs` (`npm run docraptor:minimaltest`) —
  mätskriptet, körbart igen för en framtida mall.
- `test-results/docraptor/*.pdf` + `matdata.json` — gitignorerade
  mätartefakter, skrivna under `npm run docraptor:minimaltest`s körning.
  **INTE garanterat kvar på disk i efterhand:** `test-results/` är
  Playwrights standard-`outputDir` och rensas av `npm run test:api` (körd
  som en av DoD-grindarna EFTER mätpasset i denna leverans) — mätt här:
  katalogen fanns kvar efter mätpasset men var borta efter att `test:api`
  körts. Talen i denna rapport är därför den bestående källan; PDF:erna kan
  regenereras när som helst genom att köra `npm run docraptor:minimaltest`
  på nytt (kräver staging-länk + `DOCRAPTOR_API_KEY`-secret satt till
  platshållaren).
