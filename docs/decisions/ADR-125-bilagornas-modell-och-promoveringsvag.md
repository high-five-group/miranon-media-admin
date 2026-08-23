# ADR-125: Bilagornas modell och promoveringsväg — eventinnehåll, platser, en renderare, härledd inaktualitet

- **Status:** Accepted (beslutat av orkestreraren på Marcus uttryckliga
  mandat, S108 resume 8, 2026-08-23: *"Kör! Jag kvitterar. Du har mandat
  att bestämma tekniska saker, håll branschledarmönster bara."* — efter
  att planen och de två arkitekturfrågorna A/B lagts fram som STOPP.
  Modellens tio beslut är Marcus egna, grillade till samsyn i S108 Del 2 § D
  2026-08-20.)
- **Datum:** 2026-08-23
- **Fas:** Dokument-, bilage- och mallspåret (S108, `ADR-119`-vägen) —
  promoveringen av prototypen till skarp yta
- **Rör:** Airtable (båda baser): nya tabeller `Eventinnehåll`,
  `Agendapunkter`, `Platser`; nya fält på `Eventplanering` och `Bilagor` ·
  `supabase/functions/_shared/mall-render.ts` (ny) ·
  `supabase/functions/_shared/mallar/` (ny, synkad kopia) ·
  `supabase/functions/generate-event-attachment/` ·
  `supabase/functions/preview-receipt/` ·
  `supabase/functions/send-receipt-email/` ·
  `supabase/functions/_shared/receipt-pdf.ts` (rivs) ·
  `supabase/functions/test-docraptor-render/` (rivs) ·
  `supabase/config.toml` (`static_files`) ·
  `src/components/dokument/prototyp/` (töms vid promoveringen) ·
  `src/components/dokument/DokumentYta.tsx` · Mer-sidan ·
  `docs/reference/data-model.md` · `docs/mallar/bilagor/` (förlagan, orörd)
- **Relation till tidigare beslut:** kanoniserar S108 Del 2 § D:s tio
  beslut (grillad samsyn, aldrig tidigare ADR-bokförd — numret vandrade
  121 → 125 medan parallella sessioner förbrukade serien). Bygger på
  [`ADR-119`](ADR-119-pdf-renderingsvagen-extern-motor-per-event.md)
  (extern HTML/CSS-motor, generering en gång per event; **löser in dess
  beslut 6:s öppna del** — invalideringen) och
  [`ADR-124`](ADR-124-forhandsgranskningens-leveransvag-transient-utkast-i-storage.md)
  (utkast-vägen behålls oförändrad som förhandsgranskning). Promoveringen
  följer [`ADR-103`](ADR-103-promoveringsformen-prototypen-promoveras-skarpa-bygget-avskaffas.md)
  B2 steg för steg. **Ersätter `ADR-118` beslut 1** (räckvidd som
  AND-filter, Del 2 § D beslut 4). Respekterar
  [`ADR-057`](ADR-057-lager-oberoende-fitness-invariant.md): klienten
  bygger ingen HTML och når ingen renderare — allt går via adaptern.

## Kontext

Prototypen (`GenereringsPrototyp.tsx`, 2 335 rader, 17 konvergensvarv,
Marcus *"Nu är jag helt nöjd"* på bekräftelsebilagan och godkänd form på
deltagarinformationen) är klar att promoveras — men den vilar på tre saker
en prototyp får ha och en skarp yta inte kan ha, samtliga disk-verifierade
vid resume 8 (`origin/main` `583fcd45`):

1. **Ingen datakälla.** Eventet är en hårdkodad fixtur (`ARBOGA`, rad 99),
   platserna seedad React-state (`PLATSER_SEED`), redigeringarna
   `overrides`-state. Inget fält och ingen tabell bär *eventinnehåll* eller
   *platser* — `data-model.md` har noll träffar på agenda, parkering,
   transport.
2. **Renderaren är test-only.** `skapaDokument(true)` → `test-docraptor-render`,
   en EF vars filhuvud säger *"får ALDRIG nå produktion"* och som står
   utanför `.prod-functions-allowlist.conf`. De tre prod-EF:erna ritar
   fortfarande med pdf-lib; kvittots godkända HTML-mall är inte inkopplad
   (Marcus i prod 2026-08-23: *"fortfarande det gamla fula kvittot"*).
3. **Mallarna är Vite-only.** Klienten hämtar `/docs/mallar/bilagor/*.html`
   med `?direct`-CSS-fetch — en väg som inte finns i prod-bygget, och som
   kvittot (skapas vid betalning, utan klient) aldrig kan gå.

Därtill är inaktuell-markeringen (beslut 7) obyggd, och *Skapa*-knappen
persisterar inget: den öppnar ett utkast. Promoveringen är därför inte en
flagg-flipp utan tre lager som måste finnas under formen innan flaggan rivs.

Research-passet
[`mallar-server-side-docraptor-prod-2026-08-23.md`](../research/mallar-server-side-docraptor-prod-2026-08-23.md)
grundar teknikvalen i § Beslut 4–5. Dess "premisskorrigering" om
`sjalvbarande.ts` är FEL — passet läste huvudkatalogen på en gammal gren;
filen finns (233 rader) på `origin/main`. Rättat i forskningsfilen.

## Beslut

### 1. Modellen — Del 2 § D:s tio beslut är kanon

Fältmodell med standardvärden, inte innehållsbibliotek (1) · redigering i
appen, aldrig i Airtable (2) · agendan som radschema med explicit typ
(3) · räckvidd som AND-filter, tom axel = obegränsad (4) · tomt block
utelämnas ur PDF:en men listas alltid i vyn (5) · texten hör till EVENTET,
med "spara som platsens standard" (6) · ändrad källtext gör dokumentet
INAKTUELLT, aldrig tyst regenerering (7) · `Platser` additiv tabell + länk,
`Ort` orörd (8) · räckvidden bär tre axlar (9) · redigeringen bor på Mer
som två rader (10). Fulltext: sessionsdok S108 Del 2 § D.

### 2. Datamodellen — relationell, läsbar i basen, text verbatim

Basen är en förstklassig leverabel (`ADR-063`): ingen JSON-blob, inga
textkonventioner som måste sniffas (beslut 3), varje begrepp en egen
entitet som Lotta kan läsa i Airtable.

| Yta | Form | Fält |
|---|---|---|
| **`Eventinnehåll`** (ny tabell) | en rad per Event × Typ (ORDLISTA § Eventinnehåll; sju kombinationer i prod) | `Namn` (formel `{Event} & " · " & {Typ}`, primär) · `Event` (singleSelect, samma val som `Eventplanering.Event (source)`) · `Typ` (singleSelect Utbildning/Föreläsning) · `Tid` · `Pris` · `Anmälningsavgift` · `Resterande belopp` (singleLineText, verbatim som förlagan) · `Beskrivning` · `Förberedelser` · `Tag med` · `För dig som röker` · `Parfym och kosmetika` · `Mat/fika` · `Övernattning` · `Utrustning` (multilineText) · `Agendapunkter` (länk) |
| **`Agendapunkter`** (ny tabell) | en rad per agendapunkt; hör till EXAKT EN av `Eventinnehåll` (standard) eller `Eventplanering` (eventets egen kopia) | `Text` (primär) · `Dag` (number 1/2) · `Ordning` (number) · `Tid` (singleLineText, t.ex. "30 min") · `Meditation` (checkbox) · `Eventinnehåll` (länk) · `Event` (länk → Eventplanering) |
| **`Platser`** (ny tabell) | en rad per plats (ORDLISTA § Plats); Rönninge seedas | `Namn` (primär) · `Adress` · `Parkering` · `Transport` · `Kläder` (multilineText) |
| **`Eventplanering`** (+18 fält) | eventets egen kopia — tomt fält = standardvärdet gäller | `Plats` (länk → Platser) · suffixet `(bilagetext)` (med inledande mellanslag) på: `Tid`, `Pris`, `Anmälningsavgift`, `Resterande belopp`, `Sista betalningsdag` (date), `Beskrivning`, `Förberedelser`, `Tag med`, `För dig som röker`, `Parfym och kosmetika`, `Mat/fika`, `Övernattning`, `Utrustning`, `Adress`, `Parkering`, `Transport`, `Kläder` · `Agendapunkter` (länk, auto-född spegel) |
| **`Bilagor`** (+2 fält) | genererade dokument | `Mall` (singleSelect Bekräftelsebilaga/Deltagarinformation) · `Källhash` (singleLineText) |

**Uppslag, inte länk, mellan event och eventinnehåll:** eventets
`Event (source)` × `Typ` pekar ut sin `Eventinnehåll`-rad deterministiskt.
En länk hade varit en andra sanning som Airtables UI kan låta glida isär
från de två nyckelfälten — samma felklass beslut 8 redan bokför för `Ort`.

**Sista betalningsdag** härleds `Startdatum − 14 dagar` (samma regel som
`Anmälningar.Deadline slutbetalning`) när eventets eget fält är tomt.

**Seed:** `Platser` får Rönninge (verbatim ur förlagorna); `Eventinnehåll`
får alla sju kombinationerna som rader, varav *Resor i medvetandet 1 ×
Utbildning* fylls verbatim ur Rogers mallar och de övriga lämnas tomma för
Lotta (beslut 10:s yta). Inga fixturer i prod utöver det.

### 3. Inaktualitet är HÄRLEDD, och regenerering är ERSÄTTNING

Vid generering skrivs `Källhash` = SHA-256 över den exakta ifyllnadsdatan
(eventfält + gällande eventinnehåll + gällande plats + agendan, kanoniskt
serialiserad). Vid listning beräknar adaptern dagens hash av samma data och
markerar raden *inaktuell* när de skiljer sig. Ingen checkbox skrivs vid
redigering: en lagrad flagga kräver att VARJE skrivväg (appen, Airtables
UI, automationer) kommer ihåg att sätta den — härledningen kan inte
glömmas. Regenerering ersätter filen och uppdaterar raden
(`useReplaceAttachment`-vägen, samma `attachmentId`), så Åtgärds-sidans
bilageval förblir giltigt. Beslut 7:s kärna — aldrig tyst regenerering —
är oförändrad: markeringen är ett val Lotta ser, inte en automat.

### 4. Renderingsvägen — EN renderare, server-side, mallarna bundlade

`supabase/functions/_shared/mall-render.ts` exporterar en ren funktion
`renderaMallPdf(mall, data, { test })` som läser bundlade mallfiler, fyller
i med **Eta** (`autoEscape: true` explicit — aldrig `<%~ %>` på
Airtable-härledd text), gör HTML:en självbärande (portering av
`docraptor-sjalvbarande.mjs`:s regex-inlining till Deno — ingen DOM, Deno
saknar `DOMParser`), POST:ar synkront till DocRaptor (`document_content`,
`test`-flaggan ur `ENVIRONMENT`, en retry på 5xx/timeout) och returnerar
bytes. Samma produktionsnyckel i båda miljöernas `DOCRAPTOR_API_KEY`:
`test: true` är nyckel-oberoende, gratis och vattenstämplad (DocRaptors
egen dokumentation, research § 2).

**Mallarnas hemvist:** `docs/mallar/bilagor/` förblir den Marcus-granskade
förlagan (granskningsverktygen `mall:granska`, `render-bilage-mall.mjs`
orörda). `supabase/functions/_shared/mallar/` är en **byte-identisk,
committad kopia** av `*.html`, `*.css` och de sex fria typsnittsfilerna ur
`public/fonts/bilagor/` — skriven av `scripts/synka-bilagemallar.mjs` och
vakad av CI-grinden `scripts/check-mallparitet.sh` (fäller på varje byte
som skiljer). Kopian är ett bokfört undantag av samma klass som
`CLAUDE.md`:s D0-lista: Supabases `static_files` kräver att filerna ligger
inom `functions/`, och en kopia i `supabase/` gör dessutom att en
malländring klassas som full CI (den ändrar prod-EF:ernas utdata), vilket
en ändring under `docs/` (D0, docs-only) aldrig hade gjort. Cavolini
(`lokala-typsnitt/`, gitignorerad licens) bundlas aldrig — ersätts av
Carlito/Selawik/Comic Neue per `docs/mallar/bilagor/README.md` §
Fontstrategin.

**Bundlingsmekanismen avgörs av ett minimaltest, inte av ett antagande.**
Primär väg: `[functions.<namn>] static_files = ["./functions/_shared/mallar/*"]`
samt `Deno.readFile(new URL('../_shared/mallar/x.html', import.meta.url))`.
Mätt 2026-08-23: maskinen saknar `docker` på PATH och Docker Desktop kör
inte — dagens 39/39-deploy gick via CLI:ts API-bundling, för vilken
`static_files`-stödet är obelagt (research § Vad jag inte kunde belägga).
Därför: skiva 0 deployar en minimal EF till staging med exakt denna form
och läser filen skarpt. Faller den: fallback i ordning (b) text-import
`with { type: 'text' }` för HTML/CSS + typsnitten via publik URL på appens
domän (`/fonts/bilagor/*.ttf` serveras redan av Vercel, inga persondata),
(c) genererade TS-strängmoduler. Utfallet bokförs i § Updates innan
byggskivorna startar.

### 5. EF-topologin — tre prod-funktioner, noll pdf-lib, noll test-EF i kedjan

| EF | Efter promoveringen |
|---|---|
| `generate-event-attachment` | den persisterande EF:en för BÅDA mallarna (`mall: 'bekraftelse' \| 'deltagarinfo'`); behåller sin `preview`-gren (utkast, `ADR-124`) och sin persistering (Storage under eventets prefix + Bilagor-rad + `rensaUtkast`); byter ritningen pdf-lib → `renderaMallPdf`; skriver `Mall` + `Källhash`; stöder `ersatt: attachmentId` för regenerering |
| `preview-receipt` · `send-receipt-email` | `renderKvittoPdf` (pdf-lib) → `renderaMallPdf('kvitto', …)`; `receipt-pdf.ts` rivs; `receipt-content.ts`:s spegelkontrakt rättas (Del 7:s `ADR-083`-fynd) |
| `test-docraptor-render` | rivs — dess enda kvarvarande uppgift (mätinstrument, `ADR-119` beslut 7) övergår till `generate-event-attachment`:s preview-gren i staging |

Ifyllnadsdatan (`{ event, eventinnehall, plats, agenda }`) hämtas av EF:en
ur Airtable — klienten skickar `eventId` + `mall` + ev. `ersatt`, aldrig
HTML. Det stänger `T171`:s exponering (persondata i klientbyggd HTML) och
håller `ADR-057`.

### 6. Promoveringen följer `ADR-103` B2 ordagrant

`ariaSnapshot`-par tas i variant-läge FÖRE flippen → DEV-gaten och
`?variant=a` rivs, `prototyp/` töms (`GenereringsPrototyp.tsx` blir
`GenereringsVy.tsx` bredvid `DokumentYta.tsx`; `sjalvbarande.ts` rivs —
servern gör jobbet; `MALL_META.fastForm` städas) → listvyns handkopierade
klasser ersätts med `DokumentYta`:s egna komponenter (inaktuell-badge
läggs där) → Marcus granskar den promoverade ytan → ny visuell baslinje
tas EFTER godkännande. Facit låses efter godkännandet (`ADR-074`), inte
före.

### 7. Redigeringsytorna — Mer får två rader

*Eventinnehåll* (standardtexter per Event × Typ, inkl. agendan) och
*Platser* — beslut 10. Eventets egna kopior redigeras som i dag i
genereringsvyn (block-dialogen med "spara som platsens standard").

### 8. Prod-schemaändringar är ett HITL-moment per tabell

Staging-schemat skapas av ett skript i `create-bilagor-table.mjs`:s form
(Meta-API, staging-låst). Prod-schemat skapas först efter Marcus GO i
klartext per tabell — additivt, men irreversibelt i data när rader fötts.
Fält-ID:n bokförs i `data-model.md` för båda baser i samma skiva.

## Alternativ som vägdes

- **JSON-blob-fält för eventinnehållet** — en rad att skapa, men oläsbart
  i basen och mot `ADR-063`. Förkastat.
- **1:1-tabell `Eventtexter`** i stället för 18 fält på `Eventplanering` —
  håller eventtabellen smal, men lägger en join och en rad-skapelse i
  varje skrivväg; beslut 6 säger att texten hör till eventet. Fälten
  göms i vyer i stället. Förkastat.
- **Länkfält `Eventplanering → Eventinnehåll`** — andra sanning bredvid
  `Event (source)` × `Typ`. Förkastat (§ 2).
- **Agendan som textfält med radkonvention** — textsniffning, beslut 3
  avvisade det. Förkastat.
- **Lagrad `Inaktuell`-checkbox** — kräver att varje skrivväg minns den.
  Förkastat (§ 3).
- **Klienten bygger HTML, EF:en vidarebefordrar** (dagens prototypväg,
  mallar i `public/mallar/`) — två renderingsvägar (kvittot kan inte gå
  den), persondata i klientbyggd HTML. Förkastat.
- **Mallarna i Storage** — inget kopiekrav, men ett nätverkshopp per fil
  per rendering och en cache-fråga; `ADR-119` beslut 3 gör fördelen
  ointressant. Förkastat.
- **`deno-dom` för ifyllning** — fungerar, onödig vikt mot en strängmall
  med escaping. Förkastat.
- **Promovera `test-docraptor-render` till prod** — en EF vars namn och
  filhuvud säger test; renderaren hör hemma i `_shared`. Förkastat.

## Konsekvenser

- **Förkrav utanför repot:** DocRaptor-produktionsnyckel i båda miljöernas
  secrets (Marcus sätter dem själv via `!`-prefixet — nyckeln passerar
  aldrig chatten); prod-tabeller/fält efter GO; prod-bucketen (`TASK-308`).
- **Kostnad per dokument** i prod är verklig (`test: false`) — generering
  sker fortsatt en gång per event och mall (`ADR-119` beslut 3), aldrig vid
  listning eller sändning.
- **Skuld bokförd:** `Ort` och `Plats`-länken är två sanningar om var
  eventet ligger (beslut 8, oförändrad); `Agendapunkter`-raden hör till
  exakt en förälder — invarianten vaktas av skrivvägen, inte av basen.
- **`T154`:s lucka** (Lotta har skrivit över, Roger ändrar standarden)
  löses av härledningen: eventets egen kopia ingår i hashen, standarden
  gör det bara när kopian är tom — dokumentet blir inaktuellt exakt när
  det som faktiskt trycktes skulle bli annorlunda.
- **Minimaltestet i skiva 0 kan byta bundlingsväg** — bokförs i § Updates,
  aldrig tyst.

## ADR-bar

Alla tre villkor håller: (1) svårt att återställa — tre nya tabeller och
tjugo fält i prod-basen, en renderingsväg som ersätter pdf-lib i tre
EF:er; (2) överraskande utan kontext — *varför bär `Eventplanering` arton
textfält med suffix, varför är inaktualitet inte ett fält, varför ligger
mallarna två gånger i repot?* har svar bara grillningen och research-passet
känner; (3) verklig avvägning — basens läsbarhet mot fältantal, härledning
mot lagring, en renderare mot två.

## Updates

Inga ännu — skiva 0:s minimaltest-utfall bokförs här först.
