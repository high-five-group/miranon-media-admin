# ADR-124: Förhandsgranskningens leveransväg — transient utkast i Storage, signerad URL

- **Status:** Accepted (beslutat av orkestreraren på Marcus uttryckliga
  mandat, S108 resume 7, 2026-08-22: *"Va senior här Claude och led detta
  arbete framåt. Du har mandat att besluta ingången här."* — efter att
  kontraktskonflikten i § Kontext lagts fram som STOPP. Marcus muntliga GO
  för riktningen fanns redan från Del 10: *"Vi kör på din rekommendation"*.)
- **Datum:** 2026-08-22
- **Fas:** Dokument-, bilage- och mallspåret (S108, `ADR-119`-vägen)
- **Rör:** `supabase/functions/_shared/utkast.ts` (ny) ·
  `supabase/functions/test-docraptor-render/index.ts` ·
  `supabase/functions/preview-receipt/index.ts` ·
  `supabase/functions/generate-event-attachment/index.ts` ·
  `src/data/mutations/dokumentKalla.ts` ·
  `src/data/mutations/useForhandsgranskaBilaga.ts` ·
  `src/domain/schemas/Attachment.schema.ts` (`DocumentPreviewSchema`) ·
  `.purge-staging-policy.json` · `TASK-302` (PRD + skivor `302.1`–`302.3`)
- **Relation till tidigare beslut:** bygger på
  [`ADR-119`](ADR-119-pdf-renderingsvagen-extern-motor-per-event.md) (PDF:en
  renderas av en extern HTML/CSS-motor; beslut 7:s minimaltest-disciplin är
  exakt den som fällde två hypoteser här). **Amenderar `TASK-146.5`:s AC #3**
  (förhandsvisningens sidoeffektsfrihet) öppet — ordalydelsen i § Beslut 3
  ersätter den gamla i båda EF-filhuvudena. Supersederar inget.
  Respekterar [`ADR-055`](ADR-055-datakalla-atkomst-router-context-di.md)/
  [`ADR-057`](ADR-057-lager-oberoende-fitness-invariant.md): klienten når
  Storage enbart via adaptern och den signerade URL:en, aldrig direkt.

## Kontext

**Problemet är mätt, inte antaget.** Marcus A/B i riktig Chrome 151 (headed;
headless Chromium saknar PDF-visare — S108 Del 10 § A): samma 174 KB-PDF
scrollar **perfekt** när den serveras som `http://` av en statisk server,
och **laggigt** som `blob:` — dagens leveransväg för klass B/C i
`dokumentKalla.ts` § `blobUrlFranBase64` och för prototypens
förhandsgranskning. Två oberoende agent-pass friade innehållet
(`docs/research/pdf-scrollprestanda-pdfium-chrome-2026-08-22.md`: bilderna
41 %, texten 27 %, vattenstämpeln 20 %, QR-koderna 1,9 % av
renderingskostnaden — och kostnaden är densamma oavsett leveransväg).

**Klientvägarna föll i sex armar** (resume 7, scratchpad-riggen
`sw-range-rigg/`, mätt mekaniskt headed och bedömd av Marcus):

| Arm | Leverans | Marcus dom |
|---|---|---|
| A | `http://` direkt från statisk server (utan Range-stöd) | **perfekt** |
| B | Service Worker ur Cache API, 206/Range-kapabel | lika dålig som C |
| C | `blob:` (dagens väg) | laggig |
| D | SW-passthrough av ett nätverkssvar | dålig |
| E | B + `noopener` | dålig |
| F | C + `noopener` | *"näst bäst"* — lindring, inte lösning |

Tre slutsatser bär beslutet. **Range-stöd är inte förklaringen** — arm A:s
server saknar det helt. **Det som skiljer är vem som serverar:** svar från
Chromes nätverkstjänst scrollar jämnt; svar som passerar renderer-/blob-/SW-
piping gör det inte (mekaniken är bara halvt belagd —
`docs/research/pdf-forhandsgranskning-leveransvag-blob-vs-url-2026-08-22.md`
§ 1–2 — men utfallet är entydigt). **Alltså är ingen klientlösning möjlig;**
PDF:en måste ligga bakom en riktig URL.

**Kontraktet som står i vägen.** `generate-event-attachment/index.ts` rad
58–68 (AC #3, `TASK-146.5`) och `preview-receipt/index.ts` rad 10–30 säger
att förhandsvisningen *"rör VARKEN Storage-uppladdningen … eller
Bilagor-radskapelsen … noll sidoeffekter, inte 'sidoeffekter som sedan
städas'"*. Premissen bakom den formuleringen var att bytes till klienten
räcker för att visa dokumentet. Den premissen är falsifierad ovan. Handoffen
från paus 6 tolkade avsikten som "inga Bilagor-rader, inget kvittonummer" —
källtexten förkastar uttryckligen den tolkningen, vilket var STOPP-punkten
vid resume 7.

**Servervägarna, mot förstapartskällor**
(`docs/research/pdf-forhandsgranskning-serverlosning-natverkstjanst-2026-08-22.md`):
transient Storage-objekt + signerad URL är den enda kandidaten vars förkrav
redan är mätt i vår miljö (staging: `HEAD 200 accept-ranges=bytes
content-type=application/pdf`, `RANGE 206`, Del 10 § C). DocRaptors hosted
documents ger en *"publicly-accessible"* URL *"[that] doesn't require
authentication"* — persondata på en publik extern URL, `T171`-klassen — och
är ett separat betalt tillägg. En Edge Function som GET-svarar har ett
motstridigt källäge om Kong-omskrivning av `application/pdf`, kräver en egen
token-mekanism utan precedent, och dess mellanlagrings-variant kollapsar till
Storage eftersom EF-isolater är tillståndslösa. Vercel-projektet är ren SPA.

## Beslut

### 1. Förhandsgranskningen levereras som en signerad Storage-URL — samma mönster som klass A

Alla tre dokumentklasser får sin visnings-URL från Storage. Klass A har den
redan (`get-attachment-download-url`, `SIGNED_DOWNLOAD_URL_TTL_SECONDS =
300`). Klass B/C (och prototypens DocRaptor-väg) skriver ett transient utkast
och returnerar `{ url, utgar }` i stället för `{ pdfBase64 }`. Klienten
bygger aldrig mer en `blob:` för ett dokument — `blobUrlFranBase64` rivs i
`302.2`. Ingen ny TTL, ingen ny bucket, ingen ny konstant.

### 2. Utkastet är bundet per konstruktion — inte städat av en klocka

Sökvägen är `utkast/<eventId>/<typ>.pdf` i bucket `bilagor`, `typ` ∈
`bilaga` | `kvitto` | `deltagarinformation`, skriven med `upsert: true`.
Därmed finns högst **ett** utkast per event och dokumenttyp: mängden växer
med antalet events, inte med antalet förhandsgranskningar. Skarp generering
eller sändning för ett event tar bort `utkast/<eventId>/` (utkastet är
ersatt). Staging-CI:s setup-purge får en target för prefixet. Ingen
`pg_cron`, ingen `waitUntil`-städning — en klocka hade lagt till en mekanism
utan nuvarande användare (dubbelriktad över-engineering-vakt) för en mängd
som redan är bunden.

### 3. AC #3 amenderas öppet — ordalydelsen är fastlagd här

Den nya formuleringen, som skrivs VERBATIM i båda EF-filhuvudena (`302.2`)
och ersätter den gamla:

> Förhandsvisningen har noll KONSUMENT-SYNLIGA sidoeffekter: ingen
> Bilagor-rad, inget allokerat kvittonummer, inget mail. Den skriver ett
> TRANSIENT utkast under `utkast/<eventId>/<typ>.pdf` i bucket `bilagor` —
> aldrig listat i appen, överskrivet per event och typ (`upsert`), borttaget
> vid skarp generering — för att Chromes PDF-visare bara scrollar jämnt på en
> URL serverad av nätverkstjänsten (ADR-124).

Det gamla resonemanget om kvittonummer och Resend står kvar; det är
fortfarande sant. Det som ändras är ETT led: Storage-bytes räknas inte längre
som den sidoeffekt AC #3 skyddar mot, eftersom skyddets syfte — att Lotta
aldrig ser en artefakt hon inte bett om och att inget räknas — hålls intakt.

### 4. Utkast-URL:en ligger aldrig under appens origin

Den signerade URL:en är cross-origin (Supabase Storage). Det är inte en
tillfällighet: appens Service Worker (`src/sw.ts`) bär en `NavigationRoute`
som serverar `index.html` för varje navigering under appens origin, och arm
B/D visar att en SW-förmedlad leverans laggar även när den är korrekt. En
framtida "snyggare" URL under appens domän skulle återskapa exakt det
uppmätta felet.

### 5. Acceptansen är Marcus scroll, inte ett mekaniskt bevis

Riggen bevisade att SW-vägen öppnar *identiskt* med http-vägen — och Marcus
hand fällde den ändå. `302.1` är därför enhetens grind: prototypen byts
först, Marcus bedömer scrollen mot `http://`-referensen, och först då rörs
de skarpa EF:erna (`302.2`). Faller grinden är hypotesen att Storage-URL:en
beter sig som arm A falsifierad, och enheten går tillbaka till Marcus.

## Öppet, och medvetet inte beslutat här

- **Tidsstyrd städning i prod.** Mängden är bunden (beslut 2), men ett event
  som aldrig får en skarp bilaga behåller sitt utkast. Bokförs som känd rest;
  byggs när en mätning visar att det kostar något.
- **Persondata i kvitto-utkastet.** Köparuppgifter ligger i privat bucket
  bakom en 300-sekunders signerad URL, högst ett per event. Exponeringsklassen
  bokförs i `T171` (`302.3`); om `T171` landar i en striktare policy följer
  utkastet den.
- **`generate-event-attachment` ritar fortfarande med pdf-lib.** Bytet till
  DocRaptor-vägen är promoveringens sak, inte denna ADR:s.

## Alternativ som förkastades

**Service Worker-route med `workbox-range-requests`.** Bevarar AC #3:s
bokstav och rör ingen server — rangordnad etta av research-passet. Prövad
med minimaltest innan något byggdes (`ADR-119` beslut 7-disciplinen):
mekaniskt identisk med http-vägen, men Marcus scroll lika dålig som blob.
Falsifierad.

**`noopener` på blob-URL:en.** Arm F, *"näst bäst"*. En enradsfix som lindrar
men inte når referensen. Förkastad som lösning; står kvar som fallback om
`window.open` blockeras.

**DocRaptor hosted documents.** Uppfyller AC #3:s bokstav till hundra
procent — och lägger persondata på en publik, oautentiserad extern URL.
Förkastad på `T171`-grund, inte på kostnad.

**Edge Function som GET-svarar `application/pdf`.** Odokumenterat om Kong
skriver om typen, egen token-mekanism utan precedent, och en ~10 sekunders
tom flik under rendering — UX:et Marcus redan avvisat (Del 10 § E).

## Konsekvenser

- **Positivt:** förhandsgranskningen scrollar som en fil — det enda
  acceptanskriteriet; en leveransväg för alla tre klasser i stället för två;
  blob-URL:ernas "revokera aldrig"-minnesläcka (`dokumentKalla.ts` rad 30–35,
  en motivering som dessutom var falsifierad — en blob kan inte svara på
  byte-range-anrop) försvinner.
- **Kostnad:** en Storage-skrivning per förhandsgranskning; tre EF:er och
  adapter-kontraktet ändras; prod-deploy av två skarpa EF:er (Marcus moment,
  `scripts/fas4-prod-deploy.sh`); `.purge-staging-policy.json` får en target.
- **Risk:** att någon "förenklar" bort upsert-sökvägen till en per anrop —
  då växer mängden obundet och beslut 2 faller. Därför API-testet i `302.1`
  (andra anropet skapar inget nytt objekt).

## ADR-bar

Alla tre villkor håller: (1) svårt att återställa i koherens — ett
kontrakt i två EF-filhuvuden amenderas och klientens dokumentflöde byter
form; (2) överraskande utan kontext — *varför skriver en förhandsvisning
till Storage?* har ett svar bara den som sett sex-arms-mätningen känner;
(3) verklig avvägning — sidoeffektsfrihetens bokstav mot det enda
leveranssätt som fungerar.

## Updates

Inga ännu.
