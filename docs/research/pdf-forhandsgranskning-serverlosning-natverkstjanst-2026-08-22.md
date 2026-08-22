---
owner: marcus803
updated: 2026-08-22
review_by: 2026-11-22
status: draft
---

# Serverlösning för nätverkstjänst-serverad PDF-förhandsgranskning (2026-08-22)

> **Proveniens:** avgränsat research-pass (marcus-system:research), kört
> **oisolerat** i orkestrerarens worktree
> (`.claude/worktrees/s108-paus-docs`, gren `docs/s108-resume-7`,
> HEAD `5811fc2b`) — huvudkatalogen ägdes vid start av en annan session
> (PID 28332), avvikelsen är bokförd av orkestreraren i uppdraget. Committar
> inget — filen är fristående och orörd i Git tills orkestreraren landar den.
>
> **Inventering FÖRE första sökningen.** Två pass från SAMMA dag lästa i sin
> helhet:
>
> - [`pdf-forhandsgranskning-leveransvag-blob-vs-url-2026-08-22.md`](pdf-forhandsgranskning-leveransvag-blob-vs-url-2026-08-22.md)
>   — besvarar VARFÖR `blob:` scrollar sämre (Chromiums Mojo-blob-IPC kontra
>   nätverkstjänstens cache, plus två dokumenterade Chromium-buggar för
>   `blob:` + `window.open`). Slutar med en RANGORDNING som redan pekar mot
>   "signerad Storage-URL" som vinnare, men prövar aldrig DocRaptor hosted,
>   Vercel eller en Edge-Function-GET mot förstapartskällor — det är exakt
>   det HÅL detta pass fyller.
> - [`pdf-scrollprestanda-pdfium-chrome-2026-08-22.md`](pdf-scrollprestanda-pdfium-chrome-2026-08-22.md)
>   — friar PDF-INNEHÅLLET (mallens CSS/bilder) som orsak. Ortogonal fråga,
>   ingen överlappning.
>
> **Ett STYRANDE beslut hittat som redan besvarat halva frågan — behandlat
> som "håller premissen?", inte som öppen fråga.**
> `tasks/sessions/2026-08-20-session-108.md` § Del 10 (läst i sin helhet)
> visar att Marcus REDAN gett muntligt GO på "Alternativ A" (transient
> Storage-objekt + signerad URL, samma mönster som klass A:s
> `getAttachmentDownloadUrl`): *"Vi kör på din rekommendation."* Storage-
> Range-förkravet är redan MÄTT mot staging (`HEAD: 200
> accept-ranges=bytes`, `RANGE: 206`). Men orkestrerarens egen not i samma
> avsnitt flaggar en olöst premiss: *"Marcus har inte prövat den tolkningen
> explicit"* — tolkningen att AC #3:s sidoeffektsfrihet ("rör VARKEN
> Storage-uppladdningen... eller Bilagor-radskapelsen") gäller BILAGOR-RADEN
> och kvittonumret, inte Storage-bytes i sig. Detta pass tar INTE den
> tolkningen som given. I stället prövas den mot två kandidater som
> strukturellt INTE rör vår Storage alls (DocRaptor hosted, EF-GET), för att
> ge Marcus ett verkligt val snarare än en bekräftelse av vad som redan
> lutar åt ett håll.
>
> Sökt (noll träffar): `docs/decisions/` för en ADR som redan avgjort
> frågan — ingen finns. `ADR-118`/`ADR-119` lästa i sin helhet: ADR-119
> beslutar RENDERINGSMOTORN (DocRaptor) och att SPARADE bilagor lagras i
> Storage — täcker inte den transienta förhandsgranskningen. `T171`
> (persondata i publikt repo) läst i sin helhet — relevant för att bedöma
> en NY extern exponeringsyta (DocRaptor hosted, se § 1), inte avgörande i
> sig för denna fråga.
>
> **Åldersbedömning:** Supabase- och DocRaptor-dokumentationen citeras live
> 2026-08-22 (i dag) — ingen åldringsrisk. Community-trådar om
> content-type-omskrivning är 1–3 år gamla på vissa punkter (flaggat
> explicit i § 2 där det gäller). Chromium-mekaniken är redan täckt av
> grannpasset och återanvänds, inte omresearchad.
>
> Alla externa källor hämtade **2026-08-22**.

## Kort svar

**Rangordning (rekommendation, INTE beslut — Marcus avgör):**

1. **Transient objekt i Supabase Storage under ett dedikerat prefix + kort
   signerad URL** ("Alternativ A", redan muntligt godkänt av Marcus i
   Del 10). Minsta, mest kontrollerbara kontraktsavvikelse — och den enda
   kandidaten som redan har sitt tekniska förkrav MÄTT och bekräftat
   (`accept-ranges: bytes`, 206 på en riktig signerad URL, Del 10 § C).
   Kräver fortfarande Marcus explicita ja till TOLKNINGEN av AC #3
   (orkestrerarens öppna fråga, ej stängd av detta pass) och ett städnings-
   beslut (§ 3).
2. **DocRaptor hosted documents.** Rör varken vår Storage eller vår
   Bilagor-tabell — uppfyller AC #3:s BOKSTAV fullständigt. Men: kräver ett
   NYTT betalat DocRaptor-tillägg utöver det betalda DocRaptor-konto vi
   ännu inte ens har (`"As a paid add-on, DocRaptor can provide long-term,
   publicly-accessible hosting"`), skapar en URL som är **`"publicly-
   accessible and doesn't require authentication"`** — en ny extern
   exponeringsyta av precis den klass `T171` just bokförde som ett mönster,
   inte ett undantag, hos oss.
3. **Supabase Edge Function som GET-svarar direkt.** Rankas sist bland de
   verkliga alternativen: en odokumenterad, delvis motsägande källbild om
   huruvida `application/pdf` drabbas av samma Kong-omskrivning som
   `text/html`/`application/octet-stream` gör på standarddomänen (§ 2),
   kräver ett nytt betalt tillägg (anpassad domän, 10 USD/månad) för att
   vara SÄKER, och kräver att vi bygger en egen signerad-query-token-
   mekanism utan förstaparts-precedent. Dess enda sätt att undvika en
   render-blockerande, ~10 sekunder tom flik (redan avvisat UX, Del 10 § E)
   är att lägga bytesen i ett mellanlager mellan POST och GET — och
   Supabase egen arkitekturdokumentation bekräftar att en Edge Function
   ISOLATE är **stateless mellan anrop** (`"No persistent state; each run
   is stateless"`), så det mellanlagret måste vara Storage eller en extern
   tjänst. Kandidaten KOLLAPSAR alltså till kandidat 1 eller 2 med extra
   rörliga delar, snarare än att vara ett tredje, oberoende alternativ.
4. **Vercel.** Inte en kandidat i denna stack: `vercel.json` deklarerar
   `"framework": "vite"` — en ren SPA-build utan server-funktioner. All
   backend-logik går redan via Supabase Edge Functions
   (`ADR-057`/`ADR-091`). Bekräftat kort, inte djupforskat vidare.

**Den avgörande delfrågan:** ingen av kandidaterna ger ett GRATIS svar på
"hur serverar vi transient, nyss renderad data via nätverkstjänsten UTAN
att röra NÅGON persistent yta." Varje kandidat lägger den transienta byten
NÅGONSTANS utanför klienten — vår egen Storage (kandidat 1), en
tredjeparts server (kandidat 2), eller (om man försöker undvika båda) ett
konstruerat mellanlager som Supabase själva dokumenterar inte kan hålla
tillstånd mellan anrop. Frågan är alltså inte "vilken kandidat har NOLL
avvikelse" utan "vilken avvikelse är minst, mest kontrollerbar, och mest
källbelagt fungerande" — och där vinner Storage-kandidaten på alla tre
punkter i denna kodbas just nu.

## Bakgrund som styr bedömningen

Tre fakta, alla verifierade mot disk i detta pass, ramar in varje kandidat:

- **AC #3** (`generate-event-attachment/index.ts` rad 58–68,
  `preview-receipt/index.ts` rad 10–30): förhandsgranskningen får INTE
  skapa en Bilagor-rad, ladda upp till Storage-bucketen `bilagor`, allokera
  ett kvittonummer eller skicka mail. Ordalydelsen citerad verbatim: *"en
  förhandsvisning som aldrig når den koden har per konstruktion noll
  sidoeffekter, inte 'sidoeffekter som sedan städas'."*
- **Persondata-läget för just dessa två EF:er är LÅGT, per design** —
  inte obelagt, utan uttryckligen konstruerat bort: ADR-119 beslut 3 säger
  *"Ingen persondata förekommer"* för klass B (event-mallade brev), och
  `preview-receipt/index.ts`s eget filhuvud förklarar i detalj varför
  klass C:s förhandsgranskning STRUKTURELLT inte kan bära en riktig
  kunds namn (generator-katalogen har ingen vald anmälan/betalning).
  Detta sänker allvaret i en extern exponeringsyta (kandidat 2 i § 1) för
  DESSA två konsumenter specifikt — men `T171` visar att repot har ett
  mätt MÖNSTER av att personuppgifter läcker in där ingen förväntat det,
  så "designat bort idag" är inte samma sak som "aldrig ett problem för
  varje framtida konsument av samma mekanism" (t.ex. `GenereringsPrototyp
  .tsx`/`useForhandsgranskaBilaga.ts`, som redan är en tredje konsument av
  samma renderingsväg och vars innehåll inte är lika strikt avgränsat).
- **Ett beslut är redan fattat, inte bara föreslaget:** Marcus GO på
  Alternativ A i Del 10 § E ("Vi kör på din rekommendation") — men
  **ej byggd**, och en explicit tolkningsfråga är olöst (se
  proveniens-blocket). Detta pass prövar alternativet på nytt mot
  primärkällor i stället för att bara upprepa slutsatsen.

## 1. DocRaptor hosted documents

**Källa:** `docraptor.com/documentation/api/hosted_documents` och
`docraptor.com/document-hosting`, hämtade 2026-08-22.

**Hur den anropas.** Verbatim: *"simply set the `hosted` parameter to
`true` when using the HTTP API."* Synkront svar (samma `/docs`-ändpunkt vi
redan använder i `test-docraptor-render`), JSON-form verbatim: `{
"download_id": "123-456-abc", "download_url":
"http://<<unbranded domain>>/download/123-456-abc", "number_of_pages": 1
}`. Marknadsföringssidan konkretiserar domänen: *"our API will publish
your new document at an unbranded URL like
`https://documentdeliver.com/your-document`."* — en RIKTIG `https://`-URL
på en tredjepartsdomän, alltså per definition nätverkstjänst-serverad för
Chromes PDF-visare, samma väg som en signerad Storage-URL redan är.

**Utgång/städning.** *"By default, we'll permanently host the
document"* om inget annat anges. Två sätt att begränsa livslängden:
`hosted_download_limit` eller `hosted_expires_at` vid skapandet, eller en
efterhands-städning via en autentiserad **PATCH** mot
`http://api.docraptor.com/expire/{download_id}.json`. Ingen automatisk
kort-TTL-default finns — permanent är default-läget, vilket gör en
explicit `hosted_expires_at` eller en efterhands-`expire`-anrop
OBLIGATORISKT för att detta ska vara en transient lösning och inte en ny,
permanent, oövervakad extern lagringsyta.

**Åtkomstkontroll — den avgörande siffran för persondata-bedömningen.**
Verbatim: *"The download URL is publicly-accessible and doesn't require
authentication."* Detta är en STRUKTURELLT annan säkerhetsmodell än en
Supabase signerad URL (som bär en tidsbunden, kryptografisk signatur i
frågesträngen) — DocRaptors unbranded URL är hemlig genom
ogissningsbarhet (ett UUID i sökvägen), inte genom kryptografisk
tidsbindning i sig, även om `hosted_expires_at` sätter en bortre gräns.

**Kostnad — och ett förkrav vi inte uppfyller i dag.** Verbatim: *"As a
paid add-on [länk i original: `/document-hosting`], DocRaptor can provide
long-term, publicly-accessible hosting for your documents."* Prissättning
(samma sida): "1¢ per document" i hosting-avgift (mätt dagligen), plus en
nedladdningsavgift som varierar per plan (0–6 cent per nedladdning efter
de första fem gratis). **Detta är ett tillägg UTÖVER ett betalt
DocRaptor-konto** — och sessionsdoket (Del 10 § CARRY) bokför själv att
*"DocRaptor prod-konto — Marcus-moment... Förkrav för promovering"* ännu
INTE är klart. Kandidat 1 kräver alltså TVÅ separata betal-steg
(kontouppgradering + hosting-tillägg) innan den ens går att prova skarpt,
mot noll nya betal-steg för kandidat 3 (Storage är redan betalt och
använt).

**Test-nyckel-kompatibilitet.** Dokumentationen nämner, i samma
sammanhang som hosting-gränser: *"[Test documents](/documentation/api/
test_documents) are limited to 5 downloads regardless of the value you
provide for this option."* — dvs. hosted FUNGERAR med testnyckeln
(`YOUR_API_KEY_HERE`, samma som `test-docraptor-render` redan använder),
men begränsat till 5 nedladdningar oavsett `hosted_download_limit`. Bra
nog för ett minimaltest, inte representativt för skarp drift (vattenstämpel
kvarstår också, samma begränsning som redan är känd och bokförd i
`docraptor-minimaltest-2026-08-22.md`).

**Storleksgräns.** *"the output file size is limited to keep hosting
affordable. Hosted documents output must be less than **100mb**"* — inget
problem för våra 51–310 kB-mallar (`docraptor-minimaltest-2026-08-22.md`).

**Bedömning mot AC #3 och T171:** Kandidat 1 är den ENDA av de tre
verkliga kandidaterna som lämnar VÅR EGEN Storage och Bilagor-tabell
fullständigt orörda — AC #3:s bokstav håller till 100 %. Men den ersätter
den avvikelsen med en NY, av oss ohanterad extern yta: ett publikt,
ej autentiserat dokument på tredjepartsservern, som vi måste komma ihåg
att explicit stänga (PATCH) eller tidsbegränsa vid skapandet — en disciplin
av exakt den typ `T171` visar att vi ännu inte har goda vanor kring. Given
att `generate-event-attachment`/`preview-receipt` idag är persondatafria
per design väger denna risk lägre för just DESSA två konsumenter, men
väger tyngre om mekanismen återanvänds rakt av för `GenereringsPrototyp
.tsx`s bilage-editor-förhandsgranskning (en tredje, redan existerande
konsument av samma renderingsväg, se `useForhandsgranskaBilaga.ts`).

## 2. Supabase Edge Function som GET-svarar direkt mot nätverkstjänsten

Denna kandidat delas i tre delfrågor: content-type-tillförlitlighet, auth
utan `Authorization`-header, och mellanlagrings-varianten.

### 2a. Content-Type-omskrivning på standarddomänen — motstridigt källäge

**Officiell dokumentation** (`supabase.com/docs/guides/functions/limits`,
hämtad 2026-08-22), verbatim: *"Serving of HTML content is only supported
with custom domains (Otherwise `GET` requests that return `text/html`
will be rewritten to `text/plain`)."* Ordagrant gäller detta bara
`text/html` — dokumentationen nämner INGET om `application/pdf`.

**Community-rapporter breddar räckvidden, men är inte förstapart.**
GitHub-diskussion `supabase/discussions/35627` ("Edge function changing
the Content-Type header in a response", hämtad 2026-08-22) beskriver
samma omskrivning för **`application/octet-stream`** — en utvecklare satte
`Content-Type: application/octet-stream` för en tar.gz-fil och fick
`text/plain;charset=UTF-8` tillbaka. En kommentar i tråden pekar till
diskussion `#31238` och konstaterar: *"this is only the case for
non-custom domains"* — samma undantag som HTML-regeln.

**Ett äldre, motstridigt datapunkt finns också.** GitHub-issue
`supabase/supabase#18175` ("Wrong Content-Type return parsing for
application/pdf on edge function", **Closed**, hämtad 2026-08-22): felet
där låg i **Supabase JS-klientens** `functions.invoke()`-parsning (blob
kontra sträng), INTE i själva HTTP-svaret — rapportören bekräftade
uttryckligen att en RÅ HTTP-begäran via Postman visade PDF:en korrekt.
Detta talar för att `application/pdf` KAN passera oskadd över nätverket,
men mäter en annan lager (klient-SDK:ns parsning) än frågan vi ställer
(Kong-proxyns content-type-hantering vid en webbläsar-NAVIGERING).

**Dom på denna delfråga: EJ ENTYDIGT BELAGT.** De två källorna mäter olika
saker (en officiell regel specifikt om `text/html`, en community-rapport
om `application/octet-stream`, en gammal buggrapport om en annan
kod-lagerskikt för `application/pdf`). Ingen förstapartskälla bekräftar
ELLER dementerar uttryckligen att `application/pdf` omfattas av samma
Kong-omskrivning som `text/html`. Att avgöra detta med säkerhet kräver en
egen mätning mot vårt staging-projekt (se § Vad jag inte kunde belägga) —
en mätning detta pass inte fick utföra eftersom den hade krävt en
kodändring/deploy, utanför ett research-pass mandat.

**Riskreducering finns, till ett pris.** Att köpa en anpassad domän för
Edge Functions (10 USD/månad, `supabase.com/docs/guides/platform/
custom-domains` + branschprissökning, hämtad 2026-08-22, verbatim:
*"$0.0137 per hour ($10 per month)"*) undanröjer HELA denna osäkerhet per
den officiella regelns egen undantagsklausul — men är ett nytt löpande
kostnadsåtagande specifikt för detta problem, och dokumentationen
tillägger en egen varningsflagga: *"Once you activate the domain, SAML
Single Sign-On will likely stop working until the domain is activated"*
(irrelevant för oss i dag, men ett tecken på att detta INTE är en
friktionsfri växel).

### 2b. Autentisering utan `Authorization`-header

En webbläsarnavigering (klick, `window.open` med en URL, eller adressfält)
bär ALDRIG en `Authorization`-header. `supabase.com/docs/guides/functions/
auth`, hämtad 2026-08-22, bekräftar det ordinarie mönstret: sätt
`verify_jwt = false` i `config.toml` för funktioner som *"handle their own
authentication or are meant to be public"* — samma mekanism repot redan
använder för `test-auth` (`config.toml` rad 23–24, kommenterad: *"verify_jwt
= false så att testerna kan nå requireUser... Annars fångar gateway:n
saknad/ogiltig JWT innan helpern körs."*).

Vad Supabase INTE ger är en färdig mekanism för "signerad query-parameter
i stället för header" — det är ett applikationsmönster VI måste bygga (en
kort-livad HMAC över `{eventId, syfte, utgång}` i frågesträngen, verifierad
i handlern), analogt med AWS SigV4-presignerade URL:er men UTAN
förstaparts-Supabase-precedent för just denna form. Repot har redan ETT
liknande mönster internt — `create-attachment-upload-ticket/index.ts`
returnerar en `token` — men det är Supabases EGEN
`createSignedUploadUrl()`-mekanism (Storage-lagret), inte en egenhändigt
byggd Edge-Function-nivå-HMAC. Att bygga en ny sådan mekanism för detta
enda syfte är genomförbart men en ny, oprövad kodyta att underhålla och
säkerhetsgranska — en kostnad kandidat 1 och 3 inte har (båda återanvänder
en redan existerande, testad signerings-mekanism: DocRaptors egen resp.
Supabase Storages egen).

### 2c. Mellanlagrings-varianten (POST renderar, GET serverar) — strukturellt kollapsad

Uppdragets fråga pekar ut en variant: "POST renderar och returnerar en URL
till en GET som serverar ur ett KORTLIVAT mellanlager." Supabases egen
arkitekturdokumentation (`supabase.com/docs/guides/functions/architecture`,
hämtad 2026-08-22) svarar direkt på om det mellanlagret kan vara EF:ens
egen processminne: **nej** — verbatim: *"No persistent state; each run is
stateless, ideal for ephemeral tasks"* samt *"Multiple isolates can run
simultaneously in the same edge location"* utan någon garanti om att två
separata HTTP-anrop (POST följt av GET) träffar samma isolat. En variabel
satt i POST-anropet finns alltså INTE garanterat kvar när GET-anropet
kommer in millisekunder eller sekunder senare.

Detta betyder att "mellanlagret" måste vara en riktig, delad, extern
resurs — vilket ÄR Storage (kandidat 3) eller en tredjepartstjänst
(kandidat 1, om man räknar DocRaptors egen hosting som "mellanlagret").
**Kandidat 2c är därför inte ett tredje, oberoende alternativ** — det är
kandidat 1 eller 3 med en extra Edge-Function-hop i mitten, utan att lösa
något av deras respektive kontraktsfrågor.

Ett dokumenterat, men opröv­at av detta pass, verktyg finns för en
SJÄLVSTÄNDIG variant: `EdgeRuntime.waitUntil()` ("Background Tasks",
`supabase.com/blog/edge-functions-background-tasks-websockets`, hämtad
2026-08-22). En och samma EF-anrop skulle kunna: ladda upp den transienta
filen till Storage, returnera den signerade URL:en direkt, och i en
bakgrundsuppgift som fortsätter EFTER svaret redan skickats vänta N
sekunder och sedan radera Storage-objektet — själv-städande, utan extern
cron. Begränsning, källbelagt: *"Free projects can run background tasks
for a maximum of 150 seconds (2m 30s). If you are on a paid plan, this
limit increases to 400 seconds (6m 40s)."* En radering efter t.ex. 60–90
sekunder ryms gott inom detta tak, men om Lotta lämnar fliken öppen längre
än så och webbläsaren gör ett nytt Range-anrop efter att bakgrunds-
uppgiften redan raderat objektet skulle scrollningen brytas mitt i — en
avvägning som måste vägas mot en fristående sweep-lösning (§ 3). **Detta
är ett tekniskt smakprov för § 3:s städningsfråga, inte en fjärde
kandidat** — det förutsätter fortfarande att bytesen landar i Storage.

## 3. Transient objekt i Supabase Storage + kort signerad URL ("Alternativ A")

**Förkravet är redan MÄTT, inte antaget** (Del 10 § C, staging, en riktig
signerad URL ur `get-attachment-download-url`):

```text
HEAD:  200  accept-ranges=bytes  content-type=application/pdf
RANGE: 206  content-range=bytes 0-1023/1024
```

Detta är den ENDA kandidaten i detta pass med en egen, redan utförd
mätning mot VÅR miljö — inte bara mot leverantörens dokumentation.

**Signerad URL:s TTL kan vara mycket kort.** Supabase JS-referensens
`createSignedUrl(path, expiresIn)`-exempel visar `expiresIn` angivet i
sekunder med ett exempel på 60 sekunder ("en URL giltig i en minut") —
ingen dokumenterad minimigräns hittades i sökningen (sekundärkälla, se
§ Källförteckning; den primära referenssidan gav 404 vid direkt hämtning
i detta pass). Husets egen konstant `SIGNED_DOWNLOAD_URL_TTL_SECONDS = 300`
(`supabase/functions/_shared/attachments.ts` rad 177) visar att 300
sekunder redan är en etablerad, fungerande TTL i denna kodbas för klass A.

**Ingen inbyggd objekt-TTL/lifecycle finns i Supabase Storage.**
Sökningen gav ingen förstapartsdokumentation för automatisk radering av
Storage-objekt efter tid. En obesvarad feature-request
(`github.com/orgs/supabase/discussions/20171`, hämtad 2026-08-22) bekräftar
läget: *"When uploading a file to s3 you have the option to add lifecycles
to expire the object after a set period. This API should be exposed to the
storage side of supabase."* — inget officiellt Supabase-svar i tråden.
Community-mönstret som beskrivs där är ett `expires_at`-metadatafält +
en `pg_cron`-jobb som kör en städfunktion nattligen. **Repot har i dag
INGEN `pg_cron`-baserad städning** — de befintliga purge-skripten
(`.purge-staging-policy.json`, `npm run seed:review:clean`) körs
kommando-drivet (manuellt eller vid CI-jobbstart), inte tidsstyrt. En
transient-objekt-lösning kräver alltså ANTINGEN ny cron-infrastruktur
ELLER `EdgeRuntime.waitUntil()`-självstädning i samma anrop (§ 2c) ELLER
att man accepterar räckvidden av en manuell/CI-driven sweep (samma mönster
som redan finns, bara en ny target-lista).

**Kontraktsavvikelsens storlek — bokförd, inte dolt.** AC #3:s ordalydelse
("rör VARKEN Storage-uppladdningen... eller Bilagor-radskapelsen") pekar
båda ut Storage OCH Bilagor-tabellen som förbjudna mål. En transient fil
under ett eget prefix (t.ex. `bilagor/utkast/`) bryter den FÖRSTA av de
två MEN inte den ANDRA (ingen Bilagor-rad, inget kvittonummer). Detta pass
delar orkestrerarens tidigare bedömning (Del 10) att avsikten bakom AC #3
sannolikt handlar om att undvika PERMANENTA, konsument-synliga artefakter
(en rad Lotta ser i Dokument-ytan, ett kvitto som räknas) snarare än att
förbjuda varje byte i Storage — men detta pass **bekräftar INTE** den
tolkningen som Marcus egen, uttalade avsikt: ingen primärkälla i detta
repo (ADR, PRD-kort, sessionscitat) visar Marcus själv ha sagt just detta.
Det förblir en rimlig, men obekräftad, tolkning tills Marcus uttalar sig.

## 4. Vercel

`vercel.json` (repo-rot, läst i detta pass) deklarerar `"framework":
"vite"`, `"buildCommand": "npm run build"`, `"outputDirectory": "dist"` —
en ren SPA-build med en enda SPA-rewrite-regel (`/(.*)`→`/index.html`).
Inga `functions`- eller `api/`-kataloger, inga edge-middleware-deklarationer
i repot. `ADR-091` (hosting/deploy-beslutet) och dess research
(`t95-r1-hosting-vercel-2026-08-02.md`) beskriver Vercel uteslutande som
STATISK host + domän/TLS, aldrig som en backend-plattform — all
serverlogik i denna app går via Supabase Edge Functions
(`ADR-057`s lager-oberoende). Att lägga en Vercel-serverless-/edge-route
här hade inneburit ett HELT NYTT backend-ben parallellt med Supabase Edge
Functions, för ett problem de andra tre kandidaterna redan löser inom
befintlig infrastruktur — en spekulativ komplexitetsökning som
över-engineering-vakten (`~/.claude/CLAUDE.md`) avvisar utan vidare
utredning. Detta pass går därför inte djupare in i Vercels
funktionsformer.

## Rangordning (rekommendation)

**Detta är en rekommendation, inte ett beslut — Marcus avgör**, och
matchar (bekräftar, prövar om, stänger INTE) den riktning Del 10 redan
pekade mot.

1. **Transient Storage-objekt + kort signerad URL, under dedikerat prefix
   (`bilagor/utkast/` eller egen bucket).** Motivering: enda kandidaten
   med ett MÄTT, inte bara dokumenterat, tekniskt förkrav i vår egen
   miljö; återanvänder en redan skarp, redan granskad mekanism
   (`createSignedUrl`, samma familj som `create-attachment-upload-ticket`
   redan använder); kräver INGEN ny betald tjänst; minsta bokförda
   kontraktsavvikelse (Bilagor-tabellen och kvittonumreringen förblir
   helt orörda). Kvarstående, olösta frågor innan bygge: (a) Marcus
   explicita ja till tolkningen av AC #3 — INTE stängt av detta pass, (b)
   valt städningsmönster — `EdgeRuntime.waitUntil()`-självstädning
   (enklast, ingen ny infrastruktur, men bunden av 150–400 s körtids-tak)
   kontra en fristående sweep (mer robust för långa granskningar, men ny
   cron-yta).
2. **DocRaptor hosted documents.** Motivering för plats 2, inte 1: den
   ENDA kandidaten som lämnar HELA vår egen infrastruktur orörd (starkast
   AC #3-bokstavstrogenhet), men (a) kräver TVÅ nya betal-steg vi inte har
   i dag (DocRaptor prod-konto + hosting-tillägget självt), (b) skapar en
   PUBLIK, ej autentiserad extern URL — en ny exponeringsklass som
   `T171` visar är precis den typ av lucka detta repo just nu har svårt
   att hålla koll på, (c) kräver en egen disciplin (glöm inte att sätta
   `hosted_expires_at` eller `PATCH /expire`) som är lätt att missa i en
   framtida, mindre noggrann ändring. Värd att hålla som en medveten
   FALLBACK om Marcus väger den externa-exponerings-kostnaden lägre än
   detta pass gör, eller om ett framtida behov (dela en förhandsgranskning
   med någon UTANFÖR appen) gör den publika länken till en FÖRDEL i
   stället för en risk.
3. **Supabase Edge Function GET direkt mot nätverkstjänsten.** Rankas
   sist av skäl som inte handlar om att den är principiellt fel, utan om
   att den lägger till osäkerhet (motstridigt content-type-källäge, ny
   betald anpassad domän, en egenbyggd auth-mekanism) UTAN att lösa något
   kandidat 1 eller 3 inte redan löser — och dess enda väg att undvika en
   render-blockerande navigering kräver ändå ett mellanlager som
   strukturellt ÄR kandidat 1 eller 3 (§ 2c).
4. **Vercel.** Inte en kandidat i denna stack; bekräftat kort ovan.

## Vad jag inte kunde belägga

- **Om `application/pdf` specifikt (till skillnad från `text/html` och
  `application/octet-stream`) drabbas av Kong-proxyns content-type-
  omskrivning på Supabase Edge Functions standarddomän.** Källäget är
  genuint motstridigt (§ 2a) — en officiell regel som bara nämner
  `text/html`, en community-rapport om `application/octet-stream`, en
  gammal, lagerskild buggrapport om `application/pdf` som pekar åt andra
  hållet. Att stänga denna lucka med säkerhet kräver en riktig mätning
  mot vårt eget staging-projekt (en `curl -I` mot en GET-ändpunkt som
  medvetet svarar `Content-Type: application/pdf` utan `Authorization`)
  — utanför detta research-pass mandat eftersom det hade krävt en
  kodändring/deploy.
- **Minsta dokumenterade `expiresIn`-värdet för `createSignedUrl`.** Den
  primära referenssidan (`supabase.com/docs/reference/javascript/
  storage-from-createsignedurl`) gav 404 vid direkt hämtning i detta pass;
  slutsatsen ("60 sekunder fungerar, ingen dokumenterad minimigräns")
  vilar på en sekundär sök-syntes, inte en direkt citerad primärkälla.
- **Om DocRaptors hosted-tillägg går att köpa/testa FRISTÅENDE av det
  större "prod-konto"-steget** Del 10 redan bokfört som öppet Marcus-
  moment, eller om de är samma köp. Dokumentationen särskiljer dem
  språkligt ("ett betalt konto" kontra "ett paid add-on ovanpå") men ingen
  källa i detta pass bekräftar om de faktureras/aktiveras separat eller
  tillsammans.
- **Om Chromiums `PluginResponseInterceptorURLLoaderThrottle`/
  `PdfStreamDelegate` behandlar ett Service-Worker-svar annorlunda än ett
  äkta nätverkstjänst-svar ÄVEN när båda är byte-identiska och
  Range-kapabla** (den ursprungliga hypotesen i uppdraget). En relevant
  CEF-issue (`bitbucket.org/chromiumembedded/cef/issues/2727`, titel
  antyder "PDFs not loading with NetworkService and MimeHandlerView")
  hittades men krävde inloggning — innehållet gick inte att läsa i detta
  pass. Detta lämnas medvetet ytligt: mekanismen är sekundär mot
  beslutet (uppdragets egen prioritering), och grannpasset
  (`pdf-forhandsgranskning-leveransvag-blob-vs-url-2026-08-22.md`) har
  redan gjort den tunga mekanism-utredningen för blob-vägen specifikt.
- **Praktisk latens för en riktig hosted-DocRaptor-anrop** (skiljer sig
  det synkrona svarets tid från ett vanligt `/docs`-anrop utan `hosted`?)
  — ingen källa mätte eller nämnde detta separat.

## Oväntade fynd

- **Kandidat 2c (mellanlagret) visade sig inte vara en självständig
  kandidat alls** när den prövades mot Supabases egen
  arkitekturdokumentation — en strukturell insikt uppdraget inte
  efterfrågade explicit men som avgör rangordningen: "serverad av
  nätverkstjänsten UTAN persistens NÅGONSTANS" är inte en lösning som
  finns, bara en lösning som FLYTTAR persistensen. Värt att bära vidare
  till varje framtida liknande fråga ("kan vi bara servera det direkt
  utan att lagra det") i denna kodbas.
- **`EdgeRuntime.waitUntil()`/Background Tasks** är ett dokumenterat,
  redan tillgängligt verktyg (`supabase.com/blog/edge-functions-
  background-tasks-websockets`) som ingen tidigare research i
  `docs/research/` nämner (sökt: `grep -rli "waitUntil\|background.task"
  docs/research/` gav noll träffar före detta pass). Relevant utöver
  denna fråga för varje framtida "gör X, städa sedan efter dig"-mönster
  i EF-lagret.
- **DocRaptor hosted documents kräver ett HELT SEPARAT betalt tillägg**
  utöver det redan bokförda öppna Marcus-momentet ("DocRaptor prod-konto").
  Detta var inte tydligt i tidigare research (`docraptor-minimaltest-
  2026-08-22.md` mätte bara det vanliga `/docs`-anropet) och bör vägas in
  om DocRaptor hosted någonsin blir det valda alternativet — kostnaden är
  högre än en första anblick ("vi har redan DocRaptor") antyder.

## Källförteckning

### Primärkällor

- DocRaptor — Hosted Documents API: <https://docraptor.com/documentation/api/hosted_documents> (hämtad 2026-08-22)
- DocRaptor — Document Hosting (marknadsföring + pris): <https://docraptor.com/document-hosting> (hämtad 2026-08-22)
- DocRaptor — API-dokumentation (60 s synkront tak, test-dokument-gräns): <https://docraptor.com/documentation/api> (hämtad 2026-08-22)
- Supabase — Edge Functions Limits (HTML→text/plain-regeln, minne/CPU/duration-tak, funktionsstorlek): <https://supabase.com/docs/guides/functions/limits> (hämtad 2026-08-22)
- Supabase — Securing Edge Functions (`verify_jwt`-mönstret): <https://supabase.com/docs/guides/functions/auth> (hämtad 2026-08-22)
- Supabase — Edge Functions Architecture ("No persistent state; each run is stateless"): <https://supabase.com/docs/guides/functions/architecture> (hämtad 2026-08-22)
- Supabase — Custom Domains (kostnad, ett-per-projekt-gräns, SAML-varning): <https://supabase.com/docs/guides/platform/custom-domains> (hämtad 2026-08-22)
- Supabase — Serving assets from Storage (signerad URL, `createSignedUrl`-exempel): <https://supabase.com/docs/guides/storage/serving/downloads> (hämtad 2026-08-22)
- Supabase blogg — Background Tasks, Ephemeral Storage, WebSockets (`EdgeRuntime.waitUntil()`, 150/400 s-tak): <https://supabase.com/blog/edge-functions-background-tasks-websockets> (hämtad 2026-08-22)
- Egen mätning, staging, Del 10 § C (`tasks/sessions/2026-08-20-session-108.md` rad 1731–1743): signerad Storage-URL svarar `accept-ranges: bytes` och `206 Partial Content`.

### Community-/sekundärkällor (tydligt märkta)

- GitHub-diskussion `supabase/discussions/35627`, "Edge function changing the Content-Type header in a response" (content-type-omskrivning för `application/octet-stream`, ej förstapart): <https://github.com/orgs/supabase/discussions/35627> (hämtad 2026-08-22)
- GitHub-diskussion `supabase/discussions/31238` (bakgrund till HTML-omskrivningen, ofullständigt läsbar): <https://github.com/orgs/supabase/discussions/31238> (hämtad 2026-08-22)
- GitHub-issue `supabase/supabase#18175`, "Wrong Content-Type return parsing for application/pdf on edge function" (Closed — klient-SDK-lager, inte HTTP-svaret): <https://github.com/supabase/supabase/issues/18175> (hämtad 2026-08-22)
- GitHub-diskussion `supabase/discussions/20171`, "Expiring objects (Storage)" (obesvarad feature-request, community-workaround): <https://github.com/orgs/supabase/discussions/20171> (hämtad 2026-08-22)
- GitHub-diskussion `supabase/discussions/38327`, "Best practice for PDF generation from Supabase Edge Functions" (obesvarad, bekräftar samma problembeskrivning som denna fråga): <https://github.com/orgs/supabase/discussions/38327> (hämtad 2026-08-22)
- GitHub-issue `supabase/edge-runtime#91`, ReadableStream-stall (Closed, fixad i PR #93 — streaming-svar fungerar): <https://github.com/supabase/edge-runtime/issues/91> (hämtad 2026-08-22)
- Websöknings-syntes (sekundär, ej direkt citerad primärsida): Supabase custom-domain-pris "$10/month"; `createSignedUrl`-`expiresIn`-exempel "60 sekunder" (hämtade via sökresultat 2026-08-22, ej en enskild citerbar URL)
- Bitbucket CEF-issue #2727 ("networkservice: PDFs not loading...") — titel indikerar relevans, INNEHÅLL EJ LÄSBART (kräver inloggning): <https://bitbucket.org/chromiumembedded/cef/issues/2727/> (försökt hämtad 2026-08-22, avvisad)

### Interna källor (repot)

- `supabase/functions/generate-event-attachment/index.ts` rad 58–68 — AC #3, sidoeffektsfrihets-kontraktet.
- `supabase/functions/preview-receipt/index.ts` rad 1–60 — varför en egen EF, varför ingen riktig persondata är möjlig i denna väg.
- `supabase/functions/test-docraptor-render/index.ts` — den befintliga DocRaptor-proxyn, `hosted`-parametern är EJ satt i dag.
- `src/data/adapters/AirtableAdapter.ts` rad 831–845 — `renderPdfFranHtml`, dokumenterat PROVISORISK adress mot `test-docraptor-render`.
- `src/data/config/supabase-client.ts` rad 130–176 — `postEdgeFunctionBlob`, varför denna väg avviker från husets vanliga base64-i-JSON-mönster.
- `src/data/mutations/dokumentKalla.ts`, `src/data/mutations/useForhandsgranskaBilaga.ts` — konsumenterna, `blobUrlFranBase64`.
- `supabase/functions/_shared/attachments.ts` rad 174–177 — `SIGNED_DOWNLOAD_URL_TTL_SECONDS = 300`, befintlig TTL-konvention.
- `supabase/functions/create-attachment-upload-ticket/index.ts` — befintligt signerad-URL-mönster (Storage-inbyggt, inte egenbyggd HMAC).
- `vercel.json` — SPA-only-deploykonfiguration.
- [`ADR-118`](../decisions/ADR-118-bilagors-rackviddsmodell.md), [`ADR-119`](../decisions/ADR-119-pdf-renderingsvagen-extern-motor-per-event.md) — rendering/lagringsbesluten som ramar in frågan.
- [`T171`](../../tasks/threads/T171-personuppgifter-i-publikt-repo.md) — persondata-mönstret som väger mot kandidat 1.
- `tasks/sessions/2026-08-20-session-108.md` rad 1638–1917 (Del 10) — Marcus GO på Alternativ A, den öppna tolkningsfrågan, `EdgeRuntime.waitUntil`-relevanta gränser.
- [`pdf-forhandsgranskning-leveransvag-blob-vs-url-2026-08-22.md`](pdf-forhandsgranskning-leveransvag-blob-vs-url-2026-08-22.md), [`pdf-scrollprestanda-pdfium-chrome-2026-08-22.md`](pdf-scrollprestanda-pdfium-chrome-2026-08-22.md), [`docraptor-minimaltest-2026-08-22.md`](docraptor-minimaltest-2026-08-22.md) — angränsande pass, se proveniens-blocket för exakt gränsdragning.
