---
owner: marcus803
updated: 2026-07-26
review_by: 2027-01-26
status: stable
---

# Hermetik-mätningen — steg 1:s utfall (S91, 2026-07-26)

> **Proveniens:** skarp mätning, inte uppskattning. E2E-sviten kördes lokalt med
> en catch-all-vakt i rapporterande läge (`PLAYWRIGHT_HERMETIK_RAPPORT=1`), och
> varje anrop som slank förbi testernas egna mockar loggades. Körningarna skedde
> lokalt just för att inte stjäla staging-mutexen från CI. Ingen produktionskod
> rörd; instrumentet är no-op utan miljövariabeln.
>
> Detta dokument besvarar steg 1 i
> [`staging-svitens-tidsbudget-2026-07-26.md`](staging-svitens-tidsbudget-2026-07-26.md)
> § 5 och **korrigerar det passet på en bärande punkt** (se § Falsifierat).

## Kort svar

**Restrafiken är verklig men till 86 % harmlös.** Av 865 restanrop går 747 till
Google Fonts och bara 118 till staging. Passets siffra "296 av 332 tester är
hermetiska" var för optimistisk på fil-nivå — **samtliga 32 e2e-filer** har
restanrop — men problemet är mycket mindre än den siffran antyder:

**19 av 32 filer blir helt rena enbart genom typsnitts-pinning**, en mekanism som
redan finns färdig och bevisad i `tests/visual/support/assets/`.

Kvar med äkta staging-beroende: **13 filer**.

## Mätningen

| | Antal | Andel |
|---|--:|--:|
| Restanrop totalt | 865 | 100 % |
| Google Fonts (`fonts.googleapis.com` + `fonts.gstatic.com`) | 747 | **86,4 %** |
| Äkta staging (`*.supabase.co`) | 118 | 13,6 % |

**Reproducerbarhet — tre fulla körningar:**

|Mått|Körning A|Körning B|Körning C|
|---|--:|--:|--:|
|**Staging-anrop**|118|118|118|
|**Filer med staging-beroende**|13|13|13|
|**Rena efter font-pinning**|19|19|19|
|Google Fonts|747|747|745|
|Totalt|865|865|863|

**De siffror som bär beslutet är identiska över samtliga körningar.** Endast
font-räkningen varierar, med två anrop, och det följer av hur många sidor som
hann renderas innan körningen stötte på testfel. Instrumentet mäter stabilt.

### Staging-restanropen per fil

|Fil|Anrop|
|---|--:|
|`shell.staging.test.ts`|24|
|`event-bekraftelse.staging.test.ts`|20|
|`events-list.staging.test.ts`|13|
|`event-deltagare.staging.test.ts`|12|
|`mark-paid.staging.test.ts`|12|
|`skapa-event.staging.test.ts`|9|
|`event-narvaro-register.staging.test.ts`|8|
|`event-bor-over.staging.test.ts`|5|
|`event-detail.staging.test.ts`|5|
|`mer-index.staging.test.ts`|4|
|`persist-cache.staging.test.ts`|3|
|`css-cascade.staging.test.ts`|2|
|`auth-flow.staging.test.ts`|2|

### Vilka endpoints restrafiken träffar

|Endpoint|Anrop|
|---|--:|
|`get-event-notes`|55|
|`get-registrations`|27|
|`get-events`|22|
|`get-event`|7|
|`get-event-formats`|3|
|`auth/v1/token`|2|
|`auth/v1/logout`|1|
|`get-persons`|1|
|`create-event`|1|

Mönstret bekräftar passets hypotes om **sido-anrop**: en sida mockar sitt
huvudanrop men låter notes, registrations och formats gå vidare till staging.
Tre endpoints bär 104 av 118 anrop, så täckningen är koncentrerad — inte utspridd
över hela ytan.

## Falsifierat: e2e-sviten skriver till staging

Tidsbudget-passet slog fast att **"E2E-sviten skriver aldrig till staging"** och
att allt skrivbevis ligger i API-sviten. **Det stämmer inte.**

```text
POST /functions/v1/create-event
  skapa-event.staging.test.ts › "formuläret skapar ett riktigt event i staging
                                 och landar i bekräftelseläget"
```

Testet är medvetet designat som ett skarpt skrivtest — namnet säger det rakt ut.
Samma fil gör dessutom två egna `POST /auth/v1/token` via
`helpers/fristaende-session.ts`, alltså en inloggning vid sidan av den delade
`storageState`.

Slutsatsen om utbrytning står kvar, men premissen måste rättas innan den bär ett
arkitekturbeslut: **`skapa-event` är ett skrivtest och hör till den svit som
behöver skarp backend**, oavsett vad som händer med resten.

## De 19 filer som blir rena med enbart typsnitts-pinning

`anmalan-detalj` · `event-add-registration` · `event-anmalda` ·
`event-anteckningar` · `event-narvaro` · `event-ny-anmalan` ·
`events-list-kalender` · `hem-laddlage` · `hem` · `mer-anmalningar` ·
`mer-intresserade` · `mer-maillogg` · `mer-segment-send` · `mer-segment` ·
`mer-vantelista` · `person-detail` · `person-note-edit` · `persons-list` ·
`pwa-offline`

Mekanismen finns redan: `tests/visual/support/hermetic.ts` servar
`fonts.googleapis.com` och `fonts.gstatic.com` ur incheckade filer i `assets/`.
Arbetet är att återanvända den, inte att bygga den.

## Instrumentet

`tests/e2e/support/test-bas.ts` — en delad `test`-bas för e2e-sviten. **Sömmen
saknades helt före detta:** samtliga 32 filer importerade `test` direkt ur
`@playwright/test`, vilket gjorde det omöjligt att applicera något tvärs över
sviten utan att röra varje fil. Frånvaron var alltså en del av problemet, inte
bara ett hinder för mätningen.

Vakten registreras **före** testkroppen, vilket i Playwright betyder att den
prövas **sist** — testets egna mockar fångar sina anrop först, och vakten ser
enbart resten. Anropet släpps igenom med `fallback()`: rapporterande, inte
avbrytande, så sviten beter sig identiskt under mätningen. Avbrytande läge är
steg 2:s sak.

Hela instrumentet är **no-op utan `PLAYWRIGHT_HERMETIK_RAPPORT=1`**.

### Två buggar i instrumentet, båda fångade skarpt

Bokförda öppet eftersom båda var tysta felklasser:

1. **Rapporten låg i `test-results/`**, som Playwright rensar vid varje
   körningsstart. Fem minuters mätdata raderades av nästa `playwright test`. I CI
   hade den försvunnit lika tyst. Flyttad till `.hermetik/`, utanför `outputDir`.
2. **Filen ackumulerade över körningar.** `appendFileSync` från flera workers är
   rätt form för samtidiga skrivare, men filen rensade aldrig sig själv: 865
   rader blev 871 efter ett enda isolerat test, utan att något såg fel ut. Varje
   mätning hade förorenats tyst av den föregående. Nollställs nu i `globalSetup`
   — vid **start**, inte i teardown, så en kraschad körning inte lämnar kvar data
   som nästa mätning räknar in.

Bugg 2 upptäcktes bara för att rapporten visade ett `create-event`-anrop som det
isolerade testet omöjligt kunde ha gjort.

## Testfel under mätningen — inte orsakade av instrumentet

|Test|Med mätläge|Utan mätläge|Isolerat|
|---|---|---|---|
|`hem.staging.test.ts:410` (dagar-kvar-pillen)|faller|**faller**|passerar|
|`person-detail.staging.test.ts:115`|passerar|**faller**|—|

Kontrollprovet (full svit **utan** mätläge) gav **fler** fel, inte färre.
Instrumentet är alltså uteslutet som orsak; båda felen är pre-existing
interferens under full svit.

**`person-detail`-felet är sannolikt TASK-52** — men med en avvikelse värd att
notera: kortet slår fast att *"e2e-sviten och fixturvärlden använder
schema-trogna strängar, så ingen grind ser den"*. Om det är samma defekt har den
alltså börjat synas i e2e, vilket betyder att staging-datan ändrats sedan kortet
skrevs. Orsakskedjan är **inte** verifierad här och ska prövas mot kortet innan
något antas.

### Sviten är inte idempotent mot staging — och mätningen bevisade det

Felantalet steg med antalet körningar:

|Körning|Läge|Fel|
|---|---|--:|
|1|mätläge|1|
|2|mätläge|1|
|3|kontrollprov, utan mätläge|2|
|4|mätläge|**6**|

Fyra fulla sviter kördes mot samma staging-bas inom ungefär trettio minuter. Två
mekanismer kan förklara stegringen, och båda är egenskaper hos uppställningen:

1. **Sviten skriver.** `skapa-event` skapar ett riktigt event per körning. En
   `--dry-run` av purge-skriptet efteråt visade **23 sentinel-event, varav 4 "för
   färska"** — exakt de fyra körningarna. Ålders-guarden på 60 minuter skyddar
   dem, alltså låg de kvar och påverkade efterföljande körningar.
2. **Rate-limit.** Fyra sviter à hundratals Airtable-anrop mot en bas med fem
   anrop per sekund.

**Detta är ett fynd i sig, inte bara en störning i mätningen:** e2e-sviten mot
delad muterbar staging är känslig för sin egen historik. Samma svit, samma kod,
olika utfall beroende på vad som körts före.

Skarp purge kördes **inte**: de 19 äldre sentinelerna är inte den här sessionens
att radera, och CI:s `Staging sentinel purge`-jobb plockar dem vid nästa körning.

#### RÄTTELSE — fyndet är svagare än det först formulerades

Första lydelsen av avsnittet ovan påstod att icke-idempotensen var "ett argument
för utbrytningen som mätningen råkade producera". **Den slutsatsen höll inte när
den prövades.**

Samma kod kördes i CI (PR #253, körning `30220126225`) och staging-jobbet blev
**grönt på 9 min 48 s — noll fel**, medan mina lokala körningar gav upp till sex.
Skillnaden är mekanisk och lätt att belägga:

- CI: `test-staging` har `needs: [purge]`, alltså **städas basen före varje
  körning**.
- Lokalt: `npm run test:e2e:staging` är enbart `playwright test
  --project=chromium-authenticated` — **ingen purge alls**.

Degraderingen 1 → 1 → 2 → 6 mätte alltså effekten av att köra fyra sviter i rad
**utan städning**, vilket CI aldrig gör. Sviten är inte idempotent *utan purge* —
och purge-jobbet finns just därför.

Vad som står kvar: sviten är beroende av en städmekanism för att vara stabil, och
den beroendekedjan finns inte i ett hermetiskt jobb. Det är en verklig men
**mycket svagare** fördel än den ursprungliga formuleringen antydde, och den får
inte användas som bärande argument för utbrytningen. Flakighet i CI existerar
(TASK-27 bevakar den, och S90 bokförde ett skarpt fall), men **denna mätning
bevisar den inte**.

## Vad detta betyder för steg 2

- **Font-pinningen är den enskilt största hävstången** och den billigaste: en
  redan byggd mekanism som ensam gör 19 av 32 filer rena.
- **13 filer behöver arbete**, koncentrerat till tre endpoints. Det är ett
  hanterbart, uppräknat arbete — inte en öppen mängd.
- **`skapa-event` ska inte flyttas.** Den skriver skarpt till staging, och det är
  dess syfte.
- **`auth-flow` och `persist-cache` rör auth-endpoints** och hör till det passet
  redan klassade som omockbart.

## Öppna frågor

1. **Är `person-detail`-felet TASK-52 eller något annat?** Orsakskedjan är inte
   prövad. Kortets påstående om att sviten inte ser defekten är i konflikt med
   observationen.
2. **Blir de 19 filerna verkligen rena, eller finns anrop som vakten inte ser?**
   Vakten fångar det som når nätverkslagret. Anrop som testets egna mockar
   fångade räknas inte — vilket är avsikten, men det betyder att mätningen svarar
   på "vad går ut", inte "vad skulle gå ut utan mockar".
3. **Kostar font-pinningen något i tid?** Visual-ramen servar filerna från disk;
   effekten på e2e-svitens väggklocka är omätt.

## Källförteckning

- `.hermetik/rapport.jsonl` — rådata, 865 rader, två reproducerande körningar
  2026-07-26 (gitignorerad; regenereras med
  `PLAYWRIGHT_HERMETIK_RAPPORT=1 npm run test:e2e:staging`)
- [`staging-svitens-tidsbudget-2026-07-26.md`](staging-svitens-tidsbudget-2026-07-26.md)
  § 4–5 — passet som beställde mätningen
- `tests/visual/support/hermetic.ts` — den bevisade hermetiska ramen
- `backlog/tasks/task-52 - Fynd-persondetaljen-faller…md` — kortet för
  `person-detail`-defekten
