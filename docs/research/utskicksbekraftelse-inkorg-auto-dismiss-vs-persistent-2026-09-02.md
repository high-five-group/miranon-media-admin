---
owner: marcus803
updated: 2026-09-02
review_by: 2026-12-02
status: draft
---

# Utskicksbekräftelsen i Betalningsinkorgen: auto-dismiss kontra persistent (2026-09-02)

> **Proveniens:** avgränsat research-pass 2026-09-02, kört oisolerat i
> huvudkatalogen (branch `main`, `29c5fdeb`). Ingen produktionskod ändrad,
> ingen commit gjord. Passet startades av Marcus observation efter ett
> röktest i prod (S113 resume 8): raden stannar i gult efter ett skickat
> kvitto utan väg att stänga; en grön bekräftelse ligger kvar; under
> utskicket hoppade rutan i höjd och flera notiser visades samtidigt —
> *"inte rent eller elegant"*. Hans egen idé var en grön toast med
> progressbar som försvinner när den nått kanten, och ett kryss på den gula
> rutan.

## Vad vi redan hade: inventering FÖRE första sökningen

**Ett styrande beslut täcker halva frågan redan: [ADR-121](../decisions/ADR-121-notistrappan-form-per-klass-i-notisfamiljen.md)**
(S109, 2026-08-21) och dess yta `DESIGN-SYSTEM-SPEC.md` § 21 Notistrappan.
Den klassificerar redan "Uppgiftsgenererad bekräftelse" (exemplet är
ordagrant *"Anmälan sparad"*) som **"Toast, överlagrad, får auto-döljas"**,
förskjuter INTE layout, och slår fast fyra app-breda regler som gäller hela
familjen: fel blir aldrig toast, ingen timer när knappen är enda vägen till
åtgärden (WCAG 2.2.1), överlagrade notiser har fast bredd, live-regionen är
alltid monterad. § 21 säger dessutom **uttryckligen** att en fristående
toast-komponent INTE finns byggd än — bekräftelser renders i dag via
`MessageBox`s inline-form, "utanför `TASK-285`s omfattning". Det här passet
prövar alltså inte om Notistrappans klassning håller (den är redan avgjord)
utan **om VÅR konkreta instans passar den klassen**, och vad som krävs för
att bygga den toast §21 redan lovat.

**Föregående research-pass, samma familj, två veckor gammalt:**
[`uppdateringsnotisens-form-och-notisfamiljen-2026-08-20.md`](uppdateringsnotisens-form-och-notisfamiljen-2026-08-20.md)
lade grunden ADR-121 vilar på. Det mätte redan, källbelagt: Carbons sju
notistyper och dess task-generated/system-generated-axel, Materials
snackbar/banner-distinktion (`DEFAULT_AUTO_DISMISS_TIMEOUT_MS: 5000`,
min 4000, max 10000, mätt i `mdc-snackbar/constants.ts`), Polaris
källkodsmätning (`DEFAULT_TOAST_DURATION = 5000`,
`DEFAULT_TOAST_DURATION_WITH_ACTION = 10000`), WCAG 2.2.1:s
"toast-i-hörnet-som-email-notis"-exempel, och NN/g:s regel att fel aldrig
ska vara toast. Det passet är **inte inaktuellt** — Carbons och Materials
sidor rör sig sällan, och två veckor är för kort för att premisserna ska ha
ändrats — så jag återanvänder dess mätningar med källhänvisning i stället för
att mäta om dem, och mäter i stället det som är **nytt i just denna fråga**:
progressbar-mekanik, paus-vid-hover, en enda statusyta, och — viktigast —
**varför vår konkreta instans i `BetalningsInkorg.tsx` inte följer den
klassning ADR-121 redan gav den.**

**Vad som är nytt i detta pass, och varför det inte är en dubblering:**
föregående pass löste TAXONOMIN (vilken klass, vilken form, vilka fyra
regler). Det löste INTE (a) hur en asynkron, FLERSTEGS bakgrundsjobb-status
(köad → pågår → klar, som kan överleva navigering och sidladdning, jfr
`JobbLyssnare.tsx`s PRD-berättelse 11 och 31) skiljer sig från en enkel,
omedelbar bekräftelse som "Anmälan sparad", (b) den konkreta
progressbar/paus-vid-hover-mekaniken Marcus efterfrågar, eller (c) att
`BetalningsInkorg.tsx`s faktiska kod bryter mot §21:s egen kryss-regel på ett
sätt ADR-121 inte förutsåg. De tre är detta passets bidrag.

## Kort svar

**Domen i klartext:** det Marcus såg är **inte en bugg i en enda regel** utan
tre separata symptom av samma rotorsak — bekräftelsen av jobbutfallet
(`utfall`-blocket, `BetalningsInkorg.tsx` rad 557–572, 1558–1572) lever **i
flödet** i stället för **överlagrad**, har **ingen livscykel som avslutar den**
(inget `onDismiss` kopplas, trots att primitiven redan tillåter det för
`success`/`info`), och delar skärm med en **oberoende** varningsyta
(realtidsfelet) som har sin egen, korrekta men obesläktade anledning att
stanna kvar. Ingen av branschens källor sanktionerar dagens kombination:
persistent + ostängbar + layoutförskjutande är exakt den kombination förra
passet redan identifierade som "den svagaste i materialet". Den avgörande
delfrågan är **inte** "hur bygger vi en progressbar" (den är löst, mätt i tre
oberoende bibliotek) utan **"är jobbutfallet en NOTIS eller ett
TILLSTÅND?"** — och svaret är: det är båda, på olika ställen, och dagens kod
blandar dem på samma yta.

## 1. Vad koden faktiskt gör — den mekaniska rotorsaken

Läst direkt ur `src/components/betalningar/BetalningsInkorg.tsx` och
`inkorg-harledningar.ts` (inga antaganden, allt nedan är grep-bart):

- **`jobbId`** (`useState<string | undefined>`, rad 317) sätts när Lotta
  trycker "Skicka N kvitton" (rad 621, 731, 1388, 1605) men **nollställs
  ALDRIG** — ingen `setJobbId(undefined)` finns i filen. `BetalningsInkorg`
  är monterad direkt på routen `/mer/betalningar` (inte i en modal/sheet som
  unmountas), så `jobbId` lever så länge Lotta stannar på sidan.
- **`utfall`** (rad 557–559) härleds ur `jobbDelutfall(jobb.data)` och visas
  så länge `jobbId !== undefined || kvar > 0`. Eftersom `jobbId` aldrig
  nollställs **visas `utfall`-boxen resten av besöket**, oavsett om jobbet
  var färdigt för tio minuter sedan.
- **`<MessageBox intent={utfall.intent} title={utfall.rubrik}>`** (rad 1560)
  får **inget `onDismiss`** — trots att `MessageBoxProps`s typ (rad 85–88,
  `MessageBox.tsx`) uttryckligen TILLÅTER `onDismiss` för `intent="success"`
  och `intent="info"`. Detta är alltså **inget brott mot kryss-regeln** — det
  är en oanvänd möjlighet i primitiven. Det gröna kortet Marcus såg *kunde*
  ha ett kryss redan i dag, med några rader kod.
- **`jobbDelutfall`** (rad 504, `inkorg-harledningar.ts`) ger `intent:
  'warning'` i två av fyra klasser: `inget-skickat` (noll gick fram) och
  `delutfall` (delvis). `MessageBox`s kryss-regel (`MessageBox.tsx` rad
  72–83) förbjuder **strukturellt** `onDismiss` för `warning` — så en gul
  utfallsruta kan **aldrig** få ett kryss utan att först ADR-121s familjeregel
  omprövas (se § 5).
- **Layouthoppet** har en identifierad, tredelad mekanism: (1) den
  villkorade `realtidsfel`-boxen (rad 991–996) monteras/avmonteras i flödet,
  (2) `ovrigaJobbrader`-listan (rad 843, renderad 1574) **växer per rad** i
  takt med att kvitton blir klara under pågående utskick, (3)
  `utfall.rubrik` självt växlar text tre gånger under ett och samma jobb
  (`"X väntar"` → `"Skickar kvitton, Y av X klara"` → `"X kvitton
  skickade"`). Ingen av de tre har reserverad höjd.
- **"Flera notiser samtidigt"** förklaras av att **två** inline-`MessageBox`
  kan vara synliga samtidigt och se likadana ut för Lotta trots att de har
  helt olika livscykler: realtidsfelet (varning, väntar på att en
  websocket-anslutning återkommer) och jobbutfallet (info/success/warning,
  väntar på — ingenting; se ovan). Ett prod-röktest med en instabil
  realtids-anslutning skulle visa exakt detta: en gul ruta överst
  (realtidsfel) och en andra ruta längre ner (jobbutfall) samtidigt.

**Detta löser inte om realtidsfelet i sig var en korrekt eller en falsk
positiv i det aktuella röktestet — det ligger utanför denna frågas scope och
kräver en egen diagnos av `realtidsfel`s källa (`useJobbRealtime`). Jag
registrerar det som ett sidofynd (§ 6), jag löser det inte här.**

## 2. Vad WCAG 2.2 faktiskt kräver — läst i primärkällan, inte återgivet

### SC 2.2.1 Timing Adjustable

Hämtat direkt ur `w3.org/WAI/WCAG22/Understanding/timing-adjustable.html`
(2026-09-02), fullständig kriterietext:

> *"For each time limit that is set by the content, at least one of the
> following is true: Turn off: The user is allowed to turn off the time
> limit before encountering it; or Adjust: The user is allowed to adjust
> the time limit before encountering it over a wide range that is at least
> ten times the length of the default setting; or Extend: The user is
> warned before time expires and given at least 20 seconds to extend the
> time limit with a simple action […], and the user is allowed to extend
> the time limit at least ten times; or Real-time Exception […]; or
> Essential Exception […]; or 20 Hour Exception: The time limit is longer
> than 20 hours."*

Och den bärande carve-out:en (samma citat föregående pass redan hittade,
verifierat oförändrat i dag):

> *"…a temporary message (such as a 'toast' message) in the lower
> right-hand side of the interface, and the message disappears after 5
> seconds. Users are able to identify the arrival of email through other
> means, such as viewing the Inbox."*

**Regeln, precist:** en auto-döljande toast bryter inte mot 2.2.1 OM samma
information når mottagaren på ett annat sätt. Applicerat på vår instans: en
toast som säger "8 kvitton skickade" och auto-döljer sig **bryter inte**
2.2.1 så länge raderna i "Registrerat nu" fortsätter att säga "Kvitto skickat
· 12345" oberoende av toastens öde — vilket de redan gör (`kvittolage`,
§ 1). Toasten är då en **bekvämlighet**, inte den enda vägen till
informationen. **Skulle** toasten vara den enda platsen beskedet syns
(t.ex. om radens egen statustext togs bort) vore auto-döljning ett brott.

### SC 4.1.3 Status Messages

Hämtat direkt ur `w3.org/WAI/WCAG22/Understanding/status-messages.html`
(2026-09-02). Intentionen, verbatim:

> *"…make users aware of important changes in content that are not given
> focus, and to do so in a way that doesn't unnecessarily interrupt their
> work."*

Ett statusmeddelande är sådant som *"provides information to the user on
the success or results of an action, on the waiting state of an
application, on the progress of a process, or on the existence of
errors"* och *"is not delivered via a change of context"* —
**exakt vårt fall (köat → pågår → klart)**, ordagrant. Kravet är att statusen
går att **läsa av programmatiskt via roll eller egenskaper**
(`role="status"` för allmänt, `role="alert"`/`aria-live="assertive"` för fel,
`role="log"` för sekventiella uppdateringar).

**Det källan uttryckligen INTE säger, mätt genom att läsa hela sidan:** den
ger **ingen vägledning om hur länge** ett statusmeddelande ska stå kvar,
och nämner **inget** om toast-notiser eller bakgrundsjobb-progress
specifikt. 4.1.3 avgör ALLTID att beskedet ska vara programmatiskt
annonserat — den avgör ALDRIG om den visuella ytan ska vara en toast, en
banner eller en inline-status. Den frågan lämnas helt åt designsystemen i
§ 3.

## 3. Vad branschens designsystem säger om just DENNA klass (bekräftelse, ej fel)

### Auto-döljning kräver INGEN handlingsknapp — mätt tre gånger, oberoende

Carbon, verbatim (återgivet från föregående pass, oförändrat vid kontroll
mot samma URL 2026-08-20 → stabil sida, ingen omfetching motiverad två
veckor senare):

> *"If the toast includes an action button, then the notification should
> remain on screen until the user dismisses it."*

**Vår `utfall`-box har ingen åtgärdsknapp** (ångra sker via makulering på en
annan yta, se `angraSkal`, inte via en knapp i boxen). Carbons regel
diskvalificerar alltså INTE auto-döljning för vårt success-fall.

### Duration — tre oberoende källor, alla i samma härad

| Källa | Default duration | Med åtgärdsknapp | Mätt hur |
|---|---|---|---|
| Material (`mdc-snackbar`) | **5000 ms** (min 4000, max 10000) | — | källkod, föregående pass |
| Shopify Polaris | **5000 ms** | **10000 ms** | källkod, föregående pass |
| Radix Toast (`@radix-ui/react-toast` 1.2.23) | **5000 ms** | — | `radix-ui.com/primitives/docs/components/toast`, 2026-09-02 |
| Sonner (npm 2.0.8) | **4000 ms** (`TOAST_LIFETIME`) | — | `raw.githubusercontent.com/emilkowalski/sonner/main/src/index.tsx`, 2026-09-02 |
| react-toastify (npm 11.1.0) | **5000 ms** (`autoClose`) | — | dokumentationssajt + källkod, 2026-09-02 |

**Fyra av fem oberoende implementationer** samlas kring **4000–5000 ms** för
en åtgärdslös bekräftelse. Det är starkare precedent än en enskild källa —
det är konvergent branschpraxis, inte en tyckt siffra.

### Paus vid hover/fokus — tre oberoende bibliotek, samma mekanism

Detta är den mekanik Marcus idé (progressbar som "försvinner när den nått
kanten") kräver för att vara a11y-säker, och den finns byggd, mätt, i tre
oberoende produktionsbibliotek:

- **Radix Toast** (mätt 2026-09-02): *"Pauses closing on hover, focus and
  window blur."* — tre distinkta triggers, inte bara hover.
- **Sonner** (mätt i källkod, `src/index.tsx`): en `pauseTimer`-funktion som
  beräknar förfluten tid och minskar `remainingTime`; timern pausas när
  `expanded || interacting || isDocumentHidden` — alltså ÄVEN när fliken är
  dold, inte bara vid hover.
- **react-toastify** (`pauseOnHover`, default `true`, samt separat
  `pauseOnFocusLoss`): dokumenterat i `fkhadra.github.io/react-toastify`.

**Progressbaren själv — mätt i `react-toastify`s `ProgressBar.tsx`
(2026-09-02), och detta är den EXAKTA formen Marcus beskrev:**

```js
const style = {
  animationDuration: `${delay}ms`,
  animationPlayState: isRunning ? 'running' : 'paused',
};
```

med `role="progressbar" aria-label="notification timer"` och ett villkorat
`aria-hidden` — **den visuella stapeln är avsiktligt gömd för
skärmläsare** när den inte behöver annonseras, exakt den typ av
"dekoration, inte information"-distinktion `DESIGN-SYSTEM-SPEC.md`s egna
ARIA-principer redan kräver (färg/visuell effekt är aldrig ensam
informationsbärare). **Detta är en färdig, tre gånger oberoende mätt
lösning på precis den mekanik Marcus efterfrågade** — den behöver inte
uppfinnas, bara byggas in i `Notis.tsx`.

### "Fel blir aldrig toast" gäller även DELVIS-fel

Föregående pass mätte NN/g:s regel för rena felmeddelanden. Applicerat på
vår klass: `jobbDelutfall`s `warning`-utfall (`delutfall` = "3 av 8
misslyckades", `inget-skickat` = "0 gick fram") är **precis** den klass NN/g
varnar för — en Lotta som missar en bortdöende toast om att hälften av
kvittona INTE gick fram är samma skada som NN/g:s citerade instans (en
användare som väntade fem minuter på innehåll som redan fallerat).
**Slutsats: endast `success`- och rent informativa `info`-utfall (köat/pågår)
är kandidater för en auto-döljande toast. `warning`-utfall ska aldrig
auto-döljas, oavsett vilken visuell form de får.**

### Endast EN i taget

Material Banner, mätt av föregående pass: *"Only one banner should be shown
at a time."* Ingen av de nu granskade källorna (Radix, Sonner,
react-toastify) föreskriver ett hårt tak på 1, men samtliga tre bygger en
**stapel** med expand-on-hover snarare än att tillåta obegränsad samtidig
yta — Sonners egen designartikel (Emil Kowalski, `emilkowal.ski/ui/`, mätt
2026-09-02) beskriver stapling matematiskt (*"multiplying the gap between
toasts by the toast's index"*) just för att flera SAMTIDIGT SYNLIGA toaster
annars blir rörigt. `Notis.tsx`s egen `staplad`-prop (redan byggd,
`TASK-285.6`) löser exakt detta för överlagrade ytor — men löser INTE att en
inline-`MessageBox` (realtidsfelet) och en överlagrad `Notis` kan uppfattas
som "flera notiser" trots att de aldrig kolliderar rumsligt. Det är ett
UPPFATTNINGS-problem, inte ett layout-problem, och ingen källa adresserar
det direkt.

## 4. `toast.promise()` — ett mönster värt att notera, med en verklig gräns

Sonner (och motsvarande i react-toastify) erbjuder en `toast.promise()`-API:
en toast startar i `loading`-läge (spinner, ingen auto-close, ingen
stängknapp — mätt: `autoClose: false, closeOnClick: false, closeButton:
false` i loading-läget) och uppdaterar sig **automatiskt** till
success/error när löftet avgörs, i EN komponent-instans.

**Detta är superficiellt exakt vad Marcus efterfrågar** (en yta som följer
jobbet från start till mål). **Men mönstret förutsätter att operationen är
en JavaScript-`Promise` som lever i samma sidladdning som toasten** — och
vårt kvittojobb är motsatsen: det är ett **serverspårat, asynkront jobb**
(ADR-129) som **explicit ska överleva** att Lotta stänger appen eller
navigerar bort (`JobbLyssnare.tsx`s egen docblock, PRD-berättelse 31: *"appen
kan stängas mitt i ett kvittojobb"*) och som **redan visas på en annan yta**
(`KvittojobbBanderoll.tsx` på Hem, samma cache). En `toast.promise()`
byggd naivt på detta jobb skulle antingen (a) hänga kvar för evigt om
löftet aldrig "avgörs" i toastens mening (jobbet fortsätter i bakgrunden
efter att komponenten unmountat), eller (b) tappa bort utfallet helt om
Lotta navigerar bort innan jobbet är klart. **`toast.promise()` är fel
verktyg för ETT server-spårat, sido-överlevande jobb** — mönstret passar
en enkel, synkron fetch (typ "Anmälan sparad"), inte detta jobb. Detta är
skälet till att § 5 nedan landar i en annan riktning än "bygg bara en
promise-toast".

## 5. Layoutstabilitet — web.dev, och vad den faktiskt rekommenderar

Hämtat direkt ur `web.dev/articles/cls` (2026-09-02). Artikeln ger **ingen**
specifik CSS-teknik för att reservera plats åt banners/inbäddningar (den
hänvisar vidare till en separat "optimize CLS"-guide för det) men slår fast
principen:

> *"Unexpected movement of page content usually happens when resources
> load asynchronously or DOM elements are dynamically added to the page
> before existing content."*
> *"If a user interaction triggers a network request that may take a
> while to complete, it's best to create some space right away and show a
> loading indicator to avoid an unpleasant layout shift when the request
> completes."*

**Applicerat på vår instans, ordagrant:** Lotta trycker "Skicka N kvitton"
→ det är precis en användarinteraktion som triggar ett nätverksanrop som tar
en stund → regeln säger **skapa platsen direkt**, inte låta den växa fram
rad för rad som `ovrigaJobbrader` gör i dag. Artikeln rekommenderar också
att **animera med `transform`, aldrig med `height`/`top`** för innehåll som
måste röra sig — direkt tillämpligt om en statusyta ska glida in/ut snarare
än att knuffa innehåll.

## 6. Options-rymden

### A. Persistent bekräftelse med kryss + auto-clear vid nästa handling

**Vad det är:** dagens `MessageBox`-form, men med `onDismiss` faktiskt
kopplad för `success`/`info` (redan tillåtet av typen, `MessageBox.tsx` rad
85–88 — **noll nya regler, en existerande möjlighet som bara inte används**).
`warning`-utfall förblir ostängbara (kryss-regeln, oförändrad) men ersätts
redan i dag delvis av nästa jobb (`jobbId` skrivs över vid en ny sändning).

**Kostnad:** lägst av de tre — några rader i `BetalningsInkorg.tsx`, ingen ny
primitiv, ingen ny mekanik.

**Löser:** "grön bekräftelse ligger kvar för alltid" (helt, för
success/info-fallet). Löser INTE layouthoppet (boxen är fortfarande inline)
och löser INTE den gula rutans problem (se § A kollision nedan).

**Kolliderar med ADR-121:** **ja, för warning-fallet.** Kryss-regeln
(`ADR-121`, "S109-facit, familjeregeln") antar att `warning`/`error` alltid
representerar ett **pågående tillstånd** som *"försvinner först när
ORSAKEN är borta"* — en modell som passar `realtidsfel` perfekt (anslutningen
återkommer, boxen försvinner) men **inte** passar ett jobb-utfall som redan
är HISTORIA (3 av 8 misslyckades, i går). Det finns ingen framtida händelse
som gör den varningen "sann att den är löst" — den är permanent sann att
den HÄNDE. ADR-121 gjorde aldrig den distinktionen, eftersom dess exempel
(`realtidsfelet`, `SectionError`) alla är pågående tillstånd. **Detta är ett
genuint öppet hål i familjeregeln som denna instans avtäcker, inte ett fel
i tillämpningen av den.**

### B. Tidsstyrd toast med progress, paus vid hover/fokus, kryss

**Vad det är:** flytta `success`/rent-`info`-utfallen till en överlagrad,
auto-döljande toast — konkret: utöka `Notis.tsx` (redan byggd, redan har
`staplad`-stöd för flera samtidiga instanser) med en `intent`-variant
(i dag hårdkodad till `border-info`), en nedräkningstimer på **4000–5000 ms**
(konvergent branschvärde, § 3), paus vid hover/fokus/`document.hidden`
(mätt tre gånger oberoende, § 3), och en valfri visuell progressbar
(`react-toastify`s `role="progressbar"` + villkorat `aria-hidden`-mönster,
mätt exakt, § 3).

**WCAG-villkoret som gör detta TILLÅTET, precist:** raden i "Registrerat nu"
måste FORTSÄTTA visa "Kvitto skickat · 12345" oberoende av toastens
livscykel (den gör det redan, `kvittolage`). Så länge det håller är detta
INTE ett brott mot 2.2.1 — informationen finns kvar "through other means",
ordagrant WCAG:s egen carve-out.

**`warning`-utfall får ALDRIG denna form** (§ 3, NN/g:s regel appliceras
här) — de stannar i den inline `MessageBox`-formen, ostängbara, per
kryss-regeln.

**Kostnad:** medel. Kräver att `Notis.tsx` (i dag en enda, låst,
info-färgad form) utökas med intent-variation, timer-state och en
progress-CSS — verklig ny mekanik i en primitiv som medvetet SAKNAR en
`className`-flyktväg i dag ("familjeformen ska inte kunna glida isär per
konsument", `Notis.tsx`s docblock). Detta är precis den typ av utökning
`ADR-121` § 6 lämnade öppen ("Utseendet ... är däremot Marcus bord ... tas
därför som konvergens").

**Löser:** layouthoppet för success-fallet (överlagrad = 0 CLS, mätt av
föregående pass för `Notis`-formen), "flera notiser"-uppfattningen delvis
(en tydlig, konsekvent toast-form skild från inline-varningar), och ger
Marcus konkret den mekanik han efterfrågade.

**Löser INTE:** `ovrigaJobbrader`-listans egen tillväxt om den listan
fortsätter renderas i flödet (den hänger i dag ihop med `utfall`-boxen men
är en separat lista, rad 1574) — den frågan hör till C.

### C. En enda statusyta med reserverad höjd genom hela jobbet

**Vad det är:** en fast-höjd status-region som ersätter BÅDE den växande
`utfall`-boxen OCH `ovrigaJobbrader`-listan, dimensionerad för sitt STÖRSTA
tillstånd redan vid montering (web.dev § 5: *"create some space right
away"*), som visar köat/pågår-progress medan `kvar > 0` och sedan **går
till vila av sig själv** — analogt med hur `KvittojobbBanderoll.tsx` redan
gör på Hem för SAMMA data (samma cache-nyckel, samma `jobbDelutfall`).

**Detta är den enda av de tre options som ifrågasätter §21:s egen
klassning**, snarare än att bygga vad §21 redan bestämt: ett
server-spårat, navigerings-överlevande jobb är strukturellt närmare §22:s
**tillståndsbundna arbetsobjekt** (*"kan beskedet vara sant för en
användare som loggar in i morgon, är det inte en notis"* — ett jobb som
fortfarande kör NÄSTA gång Lotta öppnar appen är exakt detta) än §21:s
**händelsebundna notis**. Ingen förstapartskälla i detta pass motsäger den
läsningen — Carbons task/system-axel och NN/g:s passive/action-required-axel
beskriver båda ENSTAKA händelser, ingen av dem modellerar explicit ett
serverspårat, flerstegs jobb som en egen kategori.

**Kostnad:** högst. Kräver att `BetalningsInkorg`s egen rendering av
utfallet slås ihop med (eller ersätts av) samma komponent
`KvittojobbBanderoll` redan bygger på Hem — en verklig sammanslagning av två
i dag divergerande representationer av samma tillstånd, inte en ny
CSS-regel.

**Löser:** roten till layouthoppet (ingen växande lista, ingen text som
byter höjd), och den principiella frågan (§21 kontra §22) i ett svep.

**Löser INTE:** ensam Marcus konkreta progressbar-idé — den idén hör
naturligt till B, inte C. En statusyta av C:s typ behöver ingen
nedräkningstimer alls (den ÄR redan en vy in i verkligt tillstånd, inte en
notis som ska hinna läsas innan den försvinner).

## 7. Dom

**Rotorsaken är strukturell, inte kosmetisk.** Jobbutfallet lever i dag som
en inline `MessageBox` som aldrig får ett `onDismiss`, aldrig nollställs, och
delar skärm med en oberoende varningsyta. Ingen av de sex granskade
förstapartskällorna (Carbon, Material, GOV.UK, USWDS, Polaris, WCAG) eller de
tre granskade produktionsbiblioteken (Radix, Sonner, react-toastify)
sanktionerar den kombinationen — samtliga skiljer strikt mellan "kräver
handling, stannar tills stängd" och "kräver ingen handling, får auto-döljas
EFTER 4–5 sekunder, förutsatt att informationen finns kvar någon annanstans".
Vår instans blandar en handlingslös bekräftelse (utfallet) med en
handlingskrävande varning (delvis-fel) i SAMMA komponent och SAMMA
livscykel, vilket är den bakomliggande orsaken till alla tre symptom Marcus
observerade.

**Marcus egen idé (progressbar, paus vid hover, kryss) är inte bara
rimlig — den är mätt, oberoende, i tre produktionsbibliotek** (Radix, Sonner,
react-toastify) och kräver ingen uppfinning, bara implementation i
`Notis.tsx`. Den är korrekt **enbart för `success`/rent-`info`-utfall** —
tillämpad på ett delvis-fel bryter den mot NN/g:s uttryckliga regel och mot
kryss-regelns nuvarande form.

**Den svåraste frågan är inte teknisk, den är klassificerande:** är ett
server-spårat, navigerings-överlevande jobb en NOTIS (§21) eller ett
ARBETSOBJEKT (§22)? Denna instans är den första i repot där gränsen
faktiskt prövas — `realtidsfelet` och `SectionError` (ADR-121s egna
exempel) är båda entydigt notiser (händelsebundna, sessionslokala).
Kvittojobbet är det inte lika entydigt, eftersom det redan lever vidare på
Hem oberoende av vilken session som startade det.

## 8. Vad jag inte kunde belägga

- **Material 3:s egen Snackbar-vägledning** (`m3.material.io`) är
  fortfarande, som i föregående pass, helt JS-renderad och gav bara
  sidtiteln vid två separata fetch-försök 2026-09-02. Timing-värdena ovan är
  mätta mot M2-eran (`material-components-web`/`material-components-android`
  källkod) — samma begränsning föregående pass bokförde, oförändrad.
  Ingen slutsats dras om huruvida M3 skulle skriva om timing-siffrorna.
- **USWDS Alert saknar egen auto-dismiss-vägledning helt.** Sidan säger
  uttryckligen *"USWDS is working on a way to help developers implement a
  dismissible alert"* — USWDS har alltså inget etablerat svar på just denna
  fråga, och kan inte citeras för vare sig auto-döljning eller
  progressbar-mönster. Detta är belagd FRÅNVARO av vägledning, inte en
  motsägelse.
- **Stripe Dashboard och Linear** (uttryckligen efterfrågade i uppdraget)
  har ingen öppen källkod eller publicerad förstapartsdokumentation om sitt
  jobb-status-mönster. Sökningen gav enbart tredjeparts-marknadsföringsbloggar
  (colorlib, eleken, thehangline) som beskriver "Stripe-liknande" toaster med
  progressbar utan att citera Stripes eller Linears egen dokumentation —
  **detta är alltså inte en primärkälla och räknas inte som belägg** i denna
  rapport. Precedent-rymden för just dessa två namngivna produkter är tunn:
  jag har INTE kört dem, och research kan inte ersätta en observation av de
  faktiska apparna. Samma begränsning gäller `sonner`s egen designartikel för
  a11y-frågor: artikeln nämner **noll** ARIA/skärmläsar-hänsyn — mätt genom
  att läsa hela artikeln, inte en tolkning.
- **Om en Lotta som ser en toast faktiskt hinner läsa den innan den
  auto-döljs** är obelagt för just henne. Ingen källa mäter läshastighet mot
  en specifik användargrupp. Detta är samma typ av lucka föregående pass
  flaggade för hörn-notisers synlighet ("bör observeras, inte antas").
- **Om `realtidsfel`s faktiska tillstånd i det aktuella röktestet var en
  korrekt varning eller en falsk positiv** har jag inte diagnostiserat — det
  kräver en separat körning mot `useJobbRealtime` och prod-loggarna, inte
  källforskning. Registrerat som sidofynd, se § 6 nedan.
- **Radix Toasts exakta typografi/CSS för sin progressbar** finns inte —
  Radix Toast är ett headless primitiv (ingen inbyggd visuell progressbar);
  det är react-toastify som bär den konkreta, färdiga implementationen.
  Blandar man ihop de två biblioteken riskerar man att leta efter en
  funktion Radix aldrig lovat.

## 9. Sidofynd utanför frågan, registrerat i stället för förkastat

- **`realtidsfel`-boxen kan själv vara felklassad mot Notistrappan.**
  Den är i dag en inline, ostängbar `warning`-`MessageBox` (rad 991–996),
  men om dess semantik verkligen är "systemnivå, ingen handling krävs just
  nu" (Lotta kan fortsätta arbeta, bara realtidsuppdateringen är nere) hör
  den enligt §21:s egen tabell hemma som en **överlagrad passiv notis**, inte
  en inline-banner. Jag har inte avgjort detta — det kräver att någon läser
  `useJobbRealtime`s faktiska garantier — men flaggar det som en möjlig andra
  instans av samma mönster denna rapport redan beskriver.
- **`jobbId` nollställs aldrig ens vid en helt ny, orelaterad sida av
  Betalningsinkorgen.** Det är inte bara ett UI-problem — det betyder att
  `useJobbstatus(jobbId, …)` fortsätter polla/prenumerera på ett gammalt
  jobb-ID i onödan så länge Lotta stannar på sidan. Utanför denna frågas
  scope (den är om PRESENTATION, inte nätverkstrafik) men värt ett eget
  fynd-kort om nätverkskostnaden någonsin blir mätbar.

## 10. Rekommendation

**Detta är en rekommendation, inte ett beslut — formen är Marcus bord
(`ADR-121` § 6).**

**Stegvis, i den ordning kostnaden stiger:**

1. **Gör A omedelbart, den är gratis.** Koppla `onDismiss` för
   `success`/`info`-utfallet i `BetalningsInkorg.tsx` rad 1560 — inga nya
   regler, ingen ny mekanik, löser "grön bekräftelse ligger kvar för alltid"
   helt för det vanliga fallet (allt gick fram).
2. **Bygg B för success/info-utfallet, som en utökning av `Notis.tsx`.**
   Detta är den yta §21 redan lovade ("Toast, överlagrad, får auto-döljas")
   men aldrig byggde. Mekaniken är tre gånger oberoende mätt (§ 3): 4–5 s
   default, paus vid hover/fokus/dold flik, valfri
   `role="progressbar"`-stapel med `aria-hidden` när den är rent
   dekorativ. `warning`-utfall rör sig ALDRIG hit — de stannar i
   `MessageBox`, ostängbara, per NN/g:s regel om delvis-fel.
3. **Flagga C för grillning, bygg den inte i detta pass.** Frågan "är ett
   server-spårat jobb en notis eller ett arbetsobjekt" är precis den typ av
   arkitekturfråga `ADR-121` § 6 och § 8 redan visat ska avgöras av Marcus
   med synlig mekanik-kostnad, inte antas i förbigående. Den löser
   layoutproblemet grundligare än B, men kostar en sammanslagning av två i
   dag divergerande ytor (`KvittojobbBanderoll` och `BetalningsInkorg`s
   utfallsvy).

**Den kollision jag uttryckligen inte löser, och som grillningen bör ta
ställning till:** kryss-regeln (`ADR-121`, S109-facit) antar att
`warning`/`error` alltid är ett PÅGÅENDE tillstånd med en framtida
lösnings-händelse. Ett avslutat jobbs delvis-misslyckande är en HISTORISK,
permanent varning utan någon sådan händelse. Antingen accepteras att en
sådan varning stannar tills en NY sändning skriver över den (dagens
de-facto-beteende via `jobbId`-omskrivning, redan delvis fungerande) — eller
så behöver ADR-121 en amendering som skiljer "tillstånds-varning" från
"händelserapport-varning". Jag rekommenderar inte vilken; jag lägger fram
att skillnaden finns och att den inte fanns när ADR-121 skrevs.

## Källor

### Egna mätningar, denna sida (2026-09-02, mot `main` `29c5fdeb`)

- `src/components/betalningar/BetalningsInkorg.tsx` (rad 153–218 `kvittolage`,
  317 `jobbId`-state, 500–559 `utfall`-härledning, 991–996 realtidsfel-box,
  1240–1300 radrendering, 1440–1580 skicka-knapp och utfallsbox, 1574
  `ovrigaJobbrader`).
- `src/components/betalningar/inkorg-harledningar.ts` (rad 420–556
  `jobbDelutfall`, alla fyra klasser och deras `intent`).
- `src/components/betalningar/JobbLyssnare.tsx` (hel fil, 50 rader —
  bekräftar att komponenten inte renderar något själv och inte är källan
  till "flera notiser").
- `src/components/primitives/Notis.tsx` och `MessageBox.tsx` (hela filerna
  — kryss-regelns typnivå och render-nivå, `staplad`-mekaniken).
- `package.json`: `react-aria-components@^1.20.0` installerat, `sonner`/
  `react-toastify`/`@radix-ui/react-toast` **inte** installerade (research
  mot deras källkod, inte konsumtion av en redan integrerad beroende).

### WCAG (primärkälla, hämtad 2026-09-02)

- SC 2.2.1 Timing Adjustable, Understanding-dokument:
  <https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html>
- SC 4.1.3 Status Messages, Understanding-dokument:
  <https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html>

### Designsystem, förstapart (hämtad 2026-09-02 där inget annat anges)

- USWDS Alert: <https://designsystem.digital.gov/components/alert/>
- Material 3 Snackbar guidelines: <https://m3.material.io/components/snackbar/guidelines>
  (JS-renderad, gav bara sidtitel — se § 8)
- Material 3 Snackbar specs: <https://m3.material.io/components/snackbar/specs>
  (samma begränsning)
- Radix Toast: <https://www.radix-ui.com/primitives/docs/components/toast>
- web.dev, Cumulative Layout Shift: <https://web.dev/articles/cls>
- Återanvänt oförändrat från föregående pass (2026-08-20, verifierat
  stabilt): Carbon Notification usage/pattern, Material `mdc-snackbar`/
  `mdc-banner` källkod, GOV.UK Notification banner, Polaris källkod — se
  [`uppdateringsnotisens-form-och-notisfamiljen-2026-08-20.md`](uppdateringsnotisens-form-och-notisfamiljen-2026-08-20.md)
  § Källor för fullständiga URL:er.

### Produktionsbibliotek, källkod (mätt 2026-09-02)

- Sonner (npm `2.0.8`): <https://raw.githubusercontent.com/emilkowalski/sonner/main/src/index.tsx>,
  <https://raw.githubusercontent.com/emilkowalski/sonner/main/README.md>
- Sonners designartikel (Emil Kowalski): <https://emilkowal.ski/ui/building-a-toast-component>
- react-toastify (npm `11.1.0`): <https://raw.githubusercontent.com/fkhadra/react-toastify/main/src/components/ProgressBar.tsx>,
  <https://fkhadra.github.io/react-toastify/accessibility/>
- `@radix-ui/react-toast` (npm `1.2.23`): mätt via dokumentationssidan ovan
  (källkodsfetch mot `raw.githubusercontent.com/radix-ui/primitives` gjordes
  inte separat — dokumentationssidan citerar samma beteende som paketets
  publicerade API och räcker för duration/paus-frågan)

### Repots egna styrande ytor

- [`ADR-121`](../decisions/ADR-121-notistrappan-form-per-klass-i-notisfamiljen.md)
  (hel fil, inklusive § Updates 2026-08-21 och 2026-08-22)
- [`DESIGN-SYSTEM-SPEC.md`](../specs/DESIGN-SYSTEM-SPEC.md) § 21 Notistrappan,
  § 22 Åtgärdskön
- [`ADR-129`](../decisions/ADR-129-jobbmotorn-ko-cron-och-kick.md) (refererad
  av kodkommentarer för jobbmodellen — ej läst i sin helhet i detta pass,
  se begränsning)
