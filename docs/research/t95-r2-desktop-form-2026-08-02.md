---
owner: marcus803
updated: 2026-08-02
review_by: 2027-02-02
status: stable
---

# Vad är det mest branschledarmässiga sättet 2026 att skeppa "riktig app"-känsla för en Apple-hushålls admin-webbapp — maxad PWA, Tauri, Electron, eller kombination? (Code, 2026-08-02)

> **Proveniens:** avgränsat research-pass **R2** för tråd
> [`T95`](../../tasks/threads/README.md), beställt i
> Session 95 grillningens beslut 9 (bilaga
> [`a4-riktig-webbapp-inbjudan.md`](../../tasks/sessions/bilagor/s87-spaning/a4-riktig-webbapp-inbjudan.md)
> § MARCUS-BESLUT + `tasks/sessions/archive/2026-08/2026-08-02-session-95.md` Del 1 + Del 2).
> Marcus-beslut B2 (grillad, 2026-08-02): PWA:n maxas NU oavsett detta pass
> resultat — passet avgör bara om en desktop-wrapper DÄRUTÖVER är motiverad,
> och wrapper-beslutet tas därefter som egen ADR. Del 2 ligger vid detta
> pass tid på gren `docs/s95-del2-samsyn` (commit `6ff0528b`), ännu inte
> mergad till `main`.

## Kort svar

**Bygg ingen wrapper nu. Maxa PWA:n (redan beslutat) och låt Safaris
inbyggda "Add to Dock" (macOS) + "Öppna som webbapp" (iPadOS/iOS 26) bära
"riktig app"-känslan för hela hushållet — det kostar noll extra
kodsignering, noll Apple Developer-avgift och noll auto-update-pipeline,
och ger Roger redan idag ett Dock-ikon, ett eget fönster utan
webbläsarkrom, Stage Manager/Mission Control-integration och
badge/notis-stöd.** En wrapper (om den någonsin byggs) skulle uteslutande
gynna Roger — Lotta, som enligt `CLAUDE.md:349` är appens dagliga
användare, kör mest iPad + mobil och får noll nytta av en Mac-wrapper. Om
brytpunkten ändå nås: **Tauri före Electron**, för att det här är ett
Mac-bara tunt skal runt en redan färdig Vite-SPA, inte en ny app — men
precedensen för "liten SaaS bygger en Mac-only-wrapper åt en person" är
**tunn**; de tre-fyra namngivna exemplen som finns (Linear, Superhuman,
1Password) är alla kommersiella multi-användarprodukter, inte en
2-användares hushållsadmin.

## Delfråga 1 — macOS: Safaris "Add to Dock" vs Chrome/Edge-installation

**Auktoritativ förstapartskälla:** Apple Developer, WWDC23-sessionen
["What's new in web apps"](https://developer.apple.com/videos/play/wwdc2023/10120/),
och [Apple Support — "Turn a website into an app in Safari on Mac"](https://support.apple.com/guide/safari/add-to-dock-ibrw9e991864/mac).

Sedan macOS Sonoma (2023) kan valfri webbsida läggas till Dock via
Arkiv → Lägg till i Dock — inget manifest krävs, men ett manifest styr namn,
ikon, `start_url`, `display` (tar bort verktygsfältet) och `scope`
(länkar utanför scope öppnas i Safari i stället). Web-appen delar **inga**
cookies, historik eller inställningar med Safari efter skapandet, fungerar
med Stage Manager, Mission Control och Cmd+Tab, är sökbar via Dock,
Launchpad och Spotlight, och får native systemprompter för kamera/
mikrofon/plats. Web Push (Notification API) och Badging API
(`navigator.setAppBadge()`) fungerar på Dock-webbappar — bekräftat
oberoende av [Jim Nielsens tekniska genomgång](https://blog.jim-nielsen.com/2023/unread-badge-macos-safari-web-app/)
av att koppla ett olästräkne-badge till en Gmail-Dock-app.

**Den tekniska detaljen som avgör hela rekommendationen** kommer från
[eclecticlight.co:s reverse-engineering av Sonomas web-appar](https://eclecticlight.co/2023/10/05/how-do-sonomas-web-apps-work/)
(oberoende, teknisk källa — Howard Oakleys blogg, känd för macOS-internals-
research): Dock-webbappens `.app`-bunt i `~/Applications/` är bara **18 KB
och innehåller ingen körbar kod**. Den får en **ad hoc-signatur via
LaunchServices** (inte ett Developer ID-certifikat), och den faktiska
körningen sker via en dold `Web App.app`-runtime i en systemägd Cryptex
(`/System/Volumes/Preboot/Cryptexes/App/...`). Konsekvensen: **det finns
ingen Gatekeeper-varning att undvika, för det finns aldrig ett tredjeparts-
binärt att godkänna** — och därmed heller inget Apple Developer Program,
ingen kodsignering och ingen notarisering att sätta upp för att nå den
här nivån av "riktig app"-känsla. Priset är att bunten inte går att
kopiera till en annan Mac (rapporteras som "skadad", eftersom UUID:et är
LaunchServices-registrerat lokalt) — irrelevant här, Roger installerar
själv på sin egen dator.

**Chrome/Edge-installation på macOS** ger en jämförbar men separat väg:
Chrome 73+ (2019) och Edge stödjer PWA-installation på macOS, Windows,
Linux och ChromeOS via install-ikonen i adressfältet eller menyn — den
installerade appen körs som egen process med eget Dock-ikon, oberoende av
Safari. [Chrome for Developers dokumenterar](https://developer.chrome.com/blog/richer-install-ui-desktop)
att en "richer install"-dialog (app-butiks-liknande, med skärmdumpar och
beskrivning) kräver `description` + minst en `screenshots`-post med
`form_factor: "wide"` för desktop — exakt de manifestfält bilagan
(`a4-riktig-webbapp-inbjudan.md` fynd 5) redan identifierat som saknade.
Detta är samma manifest-arbete som Spår A redan planerar, oavsett
webbläsare.

**Dom för delfråga 1:** macOS ger "riktig app"-känsla för Roger helt
gratis genom Safari, utan att en enda rad wrapper-kod eller en enda
kodsignerings-timme behövs. Chrome/Edge-vägen kräver samma manifest-
komplettering som redan är planerad i Spår A och tillför inget nytt utöver
det.

## Delfråga 2 — iPadOS/iOS hemskärms-webbappar 2026 (Lottas huvudyta)

**Auktoritativ förstapartskälla:** [WebKit-bloggen, WWDC25-sammanfattningen
"News from WWDC25: web technology coming this fall in Safari 26 beta"](https://webkit.org/blog/16993/news-from-wwdc25-web-technology-coming-this-fall-in-safari-26-beta/),
samt [WebKit — "Web Push for Web Apps on iOS and iPadOS"](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)
och [WebKit — "Badging for Home Screen Web Apps"](https://webkit.org/blog/14112/badging-for-home-screen-web-apps/).

**Det största enskilda fyndet i detta delspår:** från och med **Safari 26
(iOS 26/iPadOS 26, hösten 2025/2026)** öppnas **varje** webbsida som läggs
till hemskärmen som en fristående webbapp som DEFAULT — oavsett om sidan
har ett manifest eller `apple-mobile-web-app-capable`-metatagg eller inte.
Detta är en direkt konsekvens av WebKit-teamets egen ändring, citerad
ordagrant i sammanfattningen: tidigare krävdes explicit konfiguration för
standalone-läge, nu måste användaren aktivt slå av "Öppna som webbapp" om
de VILL ha webbläsarläge. Detta gör iPadOS/iOS till platsen där Marcus
manifest-investering (Spår A) ger **mest** utdelning oberoende av
wrapper-frågan, eftersom Lotta redan får standalone-känslan som
plattforms-default.

**Push-notiser och Badging på iOS/iPadOS** kräver Safari 16.4+ (2023) och
fungerar bara för webbappar som är tillagda på hemskärmen via Dela → Lägg
till på hemskärmen — en öppen flik ger inget. `Notification.requestPermission()`
måste utlösas av en direkt användarhandling. Badging-behörighet beviljas
automatiskt när notis-behörighet ges.

**Kända begränsningar, bekräftade brett men INTE av en enda förstaparts-
källa** (tredjepartssammanställningar, konsekventa sinsemellan men bör
läsas som branschbild snarare än Apple-citat): `beforeinstallprompt` finns
inte i WebKit — installation är alltid manuell Dela-flöde; installation
via en in-app-webbläsare (t.ex. länk öppnad i Instagram) ger ofta inget
eller degraderat Lägg till-alternativ; service worker-cache kan städas av
OS efter veckors inaktivitet (svagare persistens än Android).

**EU-DMA-episoden (historisk, löst):** Apple stängde av fristående
hemskärms-webbappar i EU i februari 2024 (iOS 17.4) som en tolkning av
Digital Markets Act, och **återinförde dem två veckor senare** efter
användarreaktioner — bekräftat av [Apples egen DMA-supportsida](https://developer.apple.com/support/dma-and-apps-in-the-eu/)
och brett tredjepartstäckt (TechCrunch, AppleInsider). Relevant här bara
som en påminnelse om att plattformsbeteendet för hemskärms-webbappar i EU
historiskt varit politiskt känsligt, inte tekniskt stabilt på 100%.

**Dom för delfråga 2:** Lottas huvudyta (iPadOS + mobil) har ingen
wrapper-motsvarighet överhuvudtaget att jämföra mot — Apple tillåter inte
tredjeparts-webbläsar-motorer eller sidladdade native-appar på iOS/iPadOS
utanför App Store, så "riktig app"-känsla där är **uteslutande** en PWA-
fråga, redan i linje med B2-beslutet. iOS 26:s default-till-webbapp-ändring
är goda nyheter oberoende av wrapper-utfallet.

## Delfråga 3 — Tauri vs Electron 2026 för en Mac-bara wrapper av en befintlig Vite-SPA

**Kodsignering + notarisering — identiskt krav för båda, verifierat mot
båda projektens egen dokumentation:**
[Tauris egen macOS-signeringsguide](https://v2.tauri.app/distribute/sign/macos/)
och [Electrons egen kodsigneringsguide](https://www.electronjs.org/docs/latest/tutorial/code-signing)
beskriver samma Apple-process: ett "Developer ID Application"-certifikat
från Apple Developer Program, `codesign` (eller motsvarande verktyg i
respektive bygg-pipeline) följt av notarisering via Apples `notarytool`
(App Store Connect API-nyckel ELLER Apple ID + app-specifikt lösenord).
**Apple Developer Program kostar 99 USD/år**, verifierat direkt mot
[Apples egen prissida](https://developer.apple.com/programs/) — samma
avgift oavsett individ eller organisation, och samma avgift oavsett
Tauri eller Electron. Utan detta certifikat visar macOS Gatekeeper en
"okänd utvecklare"-varning vid varje körning — exakt den signal en
tidigare cybersäkerhetsexpert som Roger skulle lägga märke till, och som
Add to Dock-vägen (delfråga 1) helt saknar eftersom den aldrig producerar
en tredjeparts-binär att varna för.

**Bundle-storlek — konsekvent riktning över alla granskade källor, men
siffrorna varierar mellan källorna:** Tauri använder OS:ets egen webview
(WKWebView på macOS) och bundlar varken Chromium eller Node.js; Electron
bundlar båda. [OpenReplays jämförelse](https://blog.openreplay.com/comparing-electron-tauri-desktop-applications/)
anger installer-storlek 80–150 MB (Electron) mot 2–10 MB (Tauri);
[Gethopp.app:s egna mätning](https://www.gethopp.app/blog/tauri-vs-electron)
på en sexfönstersapp mätte 244 MiB mot 8,6 MiB. Riktningen (10–25×
mindre) är konsekvent, men de exakta talen skiljer mellan
tredjepartskällor och bör läsas som "samma storleksordning", inte
punktexakt fakta.

**Minnesanvändning — INTE lika entydigt som bundle-storleken, och detta är
det mest belagda motfyndet i hela passet.** Flera 2026-jämförelseartiklar
(OpenReplay, Gethopp, samt ett antal SEO-liknande "2026"-bloggar som
`pkgpulse.com`, `tech-insider.org`, `rustify.rs` — **dessa senare
behandlas som lågt trovärdiga och citeras INTE som bevis**, se § Vad jag
inte kunde belägga) hävdar 50–75% lägre RAM för Tauri. Men
[en öppen GitHub-issue i tauri-apps/tauris eget repo](https://github.com/tauri-apps/tauri/issues/5889)
("Memory benchmark might be incorrect: Tauri might consume more RAM than
Electron") lägger fram en oberoende mätning som pekar **åt motsatt håll
på macOS specifikt**: att ladda `postman.com` gav Tauri (WKWebView) 421 MB
mot Electron 337 MB på macOS 12.6.1, och `vscode.dev` gav Tauri 429 MB mot
Electron 332 MB — en skillnad på >90 MB till Electrons fördel, förklarad
med att Tauris officiella benchmark-metod (verktyget `mprof` med
`psutil`-backend) inte räknar delat minne mellan Chromiums processer
korrekt. Jag har INTE kört en egen mätning mot vår faktiska SPA (se § Vad
jag inte kunde belägga) — men det finns alltså en primärkälle-nivå-
invändning (Tauris eget repo) mot det som annars är den mest upprepade
2026-siffran, och den är specifikt om macOS/WKWebView.

**Auto-update — båda har en gratis förstapartsväg.**
[Tauris updater-plugin](https://v2.tauri.app/plugin/updater/) kräver ett
eget signeringsnyckelpar (separat från Apple-certifikatet) och kan peka
mot en statisk JSON-fil på t.ex. GitHub Releases utan egen server.
[Electrons update-dokumentation](https://www.electronjs.org/docs/latest/tutorial/updates)
pekar mot `update.electronjs.org`, en gratis tjänst Electron-teamet
driver för publika GitHub-repon, och kräver macOS-kodsignering för att
fungera alls (Squirrel.Mac). Ingen av vägarna kostar pengar för vår
skala.

**macOS-minimikrav:** [Tauris egna förutsättningssida](https://v2.tauri.app/start/prerequisites/)
anger macOS Catalina (10.15)+ för utveckling, vilket i praktiken inte är
en vägg för en Mac köpt de senaste ~6 åren — ingen relevant risk för
Rogers dator identifierad.

**Dom för delfråga 3:** om en wrapper någonsin byggs, väger allt utom det
motsägda minnesfyndet mot Tauri för EXAKT detta fall (ett tunt skal runt
en redan existerande SPA, en enda plattform) — mindre bundle, samma
kodsignerings-krav som Electron ändå måste bära, en jämförbar gratis
auto-update-väg. Men minnesfrågan på macOS specifikt förtjänar en egen
mätning innan valet låses i en ADR, inte ett antagande grundat på 2026-
blogginläggens siffror.

## Delfråga 4 — Branschledar-precedent för wrapper vs PWA hos jämförbara små SaaS

**Fyra namngivna exempel hittades, men precedensen matchar INTE riktigt
vår skala — det redovisas öppet nedan.**

1. **Linear** — [Linears eget changelog från 2019-04-25](https://linear.app/changelog/2019-04-25-linear-desktop-app)
   beskriver desktop-appen som "samma Javascript/React-applikation" som
   webben, wrappad med Electron specifikt för Dock-badge, förbättrade
   notiser och "alltid på"-närvaro — motiv som är strukturellt identiska
   med Rogers Dock-badge/notis-behov. Linear var ett litet team 2019, men
   produkten har alltid haft många team som användare, inte en
   tvåpersonshushålls-app.
2. **Superhuman** — beskrivs i egen dokumentation/press som "fundamentalt
   en webbapp" med en Electron-wrapper som alternativ till webbläsarflik,
   byggt tidigt i företagets liv.
3. **1Password 8** — **rättat mot en primärkälla under detta pass.**
   Flera sekundärkällor påstod att 1Password bytt till Tauri; det
   motbevisades genom att läsa
   [1Password-medgrundaren Dave Teares egen genomgång](https://dteare.medium.com/behind-the-scenes-of-1password-for-linux-d59b19143a23)
   av arkitekturen, som explicit skriver: "Finally we bundled everything
   using Electron to allow us to integrate deeply with the operating
   system." Den faktiska arkitekturen är Rust-kärna + Electron-skal, INTE
   Tauri. Detta är ett bra exempel på varför sekundärkällor om
   Tauri/Electron-val måste kontrolleras mot en primärkälla innan de
   citeras — se vidare i § Vad jag inte kunde belägga.
4. **Microsoft Teams** migrerade FRÅN Electron TILL WebView2 (Microsofts
   motsvarighet till Tauris "använd OS:ets egna webview"-mönster),
   bekräftat brett i teknikpress ([TechTimes](https://www.techtimes.com/articles/297228/20231005/microsoft-teams-now-faster-uses-less-ram-thanks-edge-webview.htm),
   [Tomtalks](https://tomtalks.blog/microsoft-teams-2-0-will-use-half-the-memory-dropping-electron-for-edge-webview2/)):
   installer-storlek 134 MiB → ~12 MiB, minne ungefär halverat. **Viktig
   begränsning jag verifierade separat:** WebView2 är ett
   **Windows-bara** Microsoft-verktyg — [Microsoft har officiellt slutat
   erbjuda WebView2 publikt för macOS och Linux](https://github.com/MicrosoftEdge/WebView2Feedback/issues/1660)
   och koncentrerar sig på Windows. Teams för Mac förblir alltså
   Electron-baserat; vinsten gäller bara Windows-sidan. Detta är en
   direkt varning mot att extrapolera Teams-siffrorna till en Mac-bara
   kontext.

**Dom för delfråga 4, uttryckligen ärlig om tunnheten:** precedensen för
"ETT wrapper-mönster existerar och fungerar" är solid (fyra oberoende
namngivna exempel, samma riktning: återanvänd webb-koden, wrappa för
OS-integration). Precedensen för **vår specifika skala** — en
tvåpersonshushålls interna admin-app, där wrappern bara gynnar EN av de
två användarna på EN av deras enheter — är **tunn till obefintlig**. Ingen
av de fyra exemplen är en jämförbar liten SaaS med en handfull
användare; samtliga är kommersiella produkter med hundratals till
miljontals användare. Ingen sökning under detta pass hittade ett publikt
dokumenterat exempel på en organisation som byggt en Mac-only-wrapper
uteslutande för att imponera på/tjäna EN namngiven persons dator.

## Dom

**PWA-maxningen (redan beslutad, B2) plus plattformarnas egna gratis
webbapp-mekanismer — Safaris "Add to Dock" på macOS och Safari 26:s
webbapp-som-default på iPadOS/iOS — täcker "riktig app"-känslan för hela
hushållet utan att en enda rad wrapper-kod skrivs.** Det är inte en
kompromiss: det ÄR den branschledarmässiga 2026-vägen för just den här
plattformskombinationen, eftersom Apple själva byggt just detta
(Dock-integration, notiser, badge, Stage Manager) rakt in i Safari utan
att kräva ett Developer-konto, en kodsignering eller en
notariserings-pipeline.

En wrapper skulle bara flytta nålen för Roger, och bara på marginalen
utöver vad Add to Dock redan ger honom gratis: en egen namnbar
titelrad/varumärkning bortom Safaris minimala verktygsfält, och en
"Verifierad utvecklare"-Gatekeeper-status i stället för OS-ägd ad
hoc-signering. Det senare kan läsas åt två håll för en
cybersäkerhetskunnig granskare — en riktigt signerad tredjepartsbinär är
INTE per automatik ett starkare förtroendesignal än en OS-genererad
webbapp-bunt utan egen körbar kod alls; den senare har objektivt sett en
mindre attackyta. Given att Marcus investeringsvilja explicit inte är
kostnadsstyrd, är det ändå INTE kostnaden som talar mot en wrapper nu —
det är att förmånen är smal (en person, en enhet) och att precedensen för
just den skalan är obelagd.

## Vad jag inte kunde belägga

- **Ingen egen mätning av minnesanvändning gjordes mot Miranon Media
  Admins faktiska SPA i Tauri vs Electron på macOS.** Det motsägda fyndet
  i delfråga 3 (Tauri/WKWebView kan använda MER minne än Electron på
  macOS specifikt, enligt en primärkälle-nivå-invändning i
  `tauri-apps/tauri`-repot) är från 2022 och mot generiska sajter
  (`postman.com`, `vscode.dev`), inte mot vår app. Om wrapper-frågan
  någonsin blir aktuell bör en 2-nod-mätning (per repots
  "Testa ALLTID nytt bibliotek/approach med minimalt test"-disciplin)
  köras mot faktisk build innan Tauri/Electron låses i en ADR.
- **Flera 2026-"jämförelse"-bloggar (`tech-insider.org`, `rustify.rs`,
  `pkgpulse.com`, `buildmvpfast.com`) citerades ALDRIG som bevis i detta
  dokument**, trots att de dök upp konsekvent i sökningarna och
  återkommande gav specifika procentsiffror (75% mindre minne, 96%
  mindre bundle, etc.). De saknar synlig författaridentitet, saknar
  länkade primärkällor för sina siffror, och mönstret (identisk
  "2026 i rubriken + samma påstådda procentsatser" över flera olika
  domäner) är typiskt för SEO-genererat innehåll snarare än genuin
  mätning. De är noterade här som en läsvarning, inte förkastade i
  tystnad.
- **1Password/Tauri-förväxlingen ovan (delfråga 4, punkt 3) visar en bredare
  osäkerhet jag inte kunnat kvantifiera:** hur många andra "X bytte till
  Tauri"-påståenden i sökresultaten är på samma sätt felaktiga eller
  förenklade jämfört med en primärkälla? Jag har bara haft tid att
  verifiera 1Password-fallet djupt (eftersom det var det mest citerade).
  Övriga Tauri-adoptionslistor som cirkulerar i bloggosfären bör
  behandlas som obekräftade tills en primärkälla läses.
- **Ingen svensk eller nordisk precedent för "liten hushålls-/förenings-
  admin-app med desktop-wrapper" hittades överhuvudtaget** — sökningen
  var på engelska och internationell, och en nordisk vinkel undersöktes
  inte separat inom passets tidsram.
- **Chrome/Edge-installationens exakta beteende på macOS 26 (Tahoe)
  specifikt** verifierades inte lika djupt som Safaris — informationen om
  Chrome 73+-stödet är från 2019 och antas fortfarande gälla, men ingen
  2026-specifik Chrome-release-not lästes för att bekräfta att inget
  regresserat.

## Rekommendation

Detta är en rekommendation till den kommande ADR:n om desktop-formen
("riktig app"-idén, fråga 9 i grillningen) — Marcus/ADR-processen äger
beslutet.

1. **Bygg ingen wrapper i denna omgång.** Slutför Spår A (manifest +
   install-yta) enligt redan grillad plan. Det ger både Roger (via Safari
   Add to Dock) och Lotta (via Safari 26:s webbapp-som-default på
   iPadOS/iOS) i praktiken hela "riktig app"-känslan utan extra
   infrastruktur.
2. **Sätt en explicit, konkret brytpunkt för när wrappern blir motiverad**
   snarare än att lämna frågan öppen på nytt: Roger efterfrågar den
   uttryckligen EFTER att ha använt Add to Dock-versionen, ELLER ett
   konkret kapabilitetsgap identifieras som Add to Dock/PWA-manifestet
   strukturellt inte kan täcka (t.ex. en meny­rads-genväg, en global
   tangentbordsgenväg, eller ett behov av att distribuera appen helt
   utanför webbläsarens installationsflöde).
3. **Om brytpunkten nås: välj Tauri, inte Electron**, för just detta
   scenario (ett Mac-bara tunt skal runt en redan byggd Vite-SPA) — men
   kör en 2-nod-mätning av verkligt minnesbeteende mot vår faktiska build
   INNAN valet låses i ADR, eftersom delfråga 3:s motsägda minnesfynd
   specifikt gäller macOS/WKWebView.
4. **Underskatta inte Add to Dock-vägens säkerhetsberättelse för Roger.**
   En OS-genererad, ad hoc-signerad appbunt utan egen körbar kod är,
   strikt tekniskt, en MINDRE attackyta än en tredjeparts-binär — även en
   korrekt Developer ID-signerad sådan. Det är värt att säga rakt ut i
   presentationen till Roger snarare än att low-key hoppas att avsaknaden
   av en wrapper inte läses som "mindre seriöst".

## Källförteckning

**Förstapartskällor (leverantör/organisation, primär):**

- [developer.apple.com/videos/play/wwdc2023/10120](https://developer.apple.com/videos/play/wwdc2023/10120/) — Apple, WWDC23 "What's new in web apps"
- [support.apple.com/guide/safari/add-to-dock-ibrw9e991864/mac](https://support.apple.com/guide/safari/add-to-dock-ibrw9e991864/mac) — Apple Support, Safari-hjälp
- [support.apple.com/en-us/104996](https://support.apple.com/en-us/104996) — Apple Support, "Use Safari web apps on Mac"
- [developer.apple.com/programs/](https://developer.apple.com/programs/) — Apple Developer Program, pris ($99/år)
- [developer.apple.com/support/dma-and-apps-in-the-eu/](https://developer.apple.com/support/dma-and-apps-in-the-eu/) — Apple, DMA-supportsida
- [webkit.org/blog/16993](https://webkit.org/blog/16993/news-from-wwdc25-web-technology-coming-this-fall-in-safari-26-beta/) — WebKit-bloggen, Safari 26-nyheter (webbapp-som-default)
- [webkit.org/blog/13878](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/) — WebKit-bloggen, Web Push för hemskärms-webbappar
- [webkit.org/blog/14112](https://webkit.org/blog/14112/badging-for-home-screen-web-apps/) — WebKit-bloggen, Badging API
- [web.dev/patterns/web-apps/richer-install-ui](https://developer.chrome.com/blog/richer-install-ui-desktop) — Chrome for Developers/web.dev, richer install UI-krav
- [v2.tauri.app/distribute/sign/macos/](https://v2.tauri.app/distribute/sign/macos/) — Tauri, officiell macOS-signeringsguide
- [v2.tauri.app/plugin/updater/](https://v2.tauri.app/plugin/updater/) — Tauri, officiell updater-dokumentation
- [v2.tauri.app/start/prerequisites/](https://v2.tauri.app/start/prerequisites/) — Tauri, officiella förkrav (macOS-minimiversion)
- [electronjs.org/docs/latest/tutorial/code-signing](https://www.electronjs.org/docs/latest/tutorial/code-signing) — Electron, officiell kodsigneringsguide
- [electronjs.org/docs/latest/tutorial/updates](https://www.electronjs.org/docs/latest/tutorial/updates) — Electron, officiell auto-update-guide
- [`github.com/tauri-apps/tauri/issues/5889`](https://github.com/tauri-apps/tauri/issues/5889) — Tauri-projektets eget GitHub-repo, minnesbenchmark-invändning
- [`github.com/MicrosoftEdge/WebView2Feedback/issues/1660`](https://github.com/MicrosoftEdge/WebView2Feedback/issues/1660) — Microsoft, officiell bekräftelse att WebView2 inte släpps publikt för macOS
- [linear.app/changelog/2019-04-25-linear-desktop-app](https://linear.app/changelog/2019-04-25-linear-desktop-app) — Linear, eget changelog
- [dteare.medium.com — "Behind the scenes of 1Password for Linux"](https://dteare.medium.com/behind-the-scenes-of-1password-for-linux-d59b19143a23) — 1Password-medgrundare Dave Teare, förstahandsredogörelse för arkitekturen

**Tredjepartskällor (oberoende teknisk research, sekundär men trovärdig):**

- [eclecticlight.co — "How do Sonoma's Web Apps work?"](https://eclecticlight.co/2023/10/05/how-do-sonomas-web-apps-work/) — teknisk reverse-engineering av macOS-webbappars kodsignering/exekvering
- [blog.jim-nielsen.com — badge-genomgång](https://blog.jim-nielsen.com/2023/unread-badge-macos-safari-web-app/) — oberoende teknisk verifiering av Badging API på macOS
- [blog.openreplay.com — Electron vs Tauri](https://blog.openreplay.com/comparing-electron-tauri-desktop-applications/) — jämförelsedata (bundle/minne)
- [gethopp.app/blog/tauri-vs-electron](https://www.gethopp.app/blog/tauri-vs-electron) — egna benchmark-mätningar (bundle/minne)
- [techtimes.com — Teams/WebView2](https://www.techtimes.com/articles/297228/20231005/microsoft-teams-now-faster-uses-less-ram-thanks-edge-webview.htm) — teknikpress, Teams-migreringen
- [tomtalks.blog — Teams/WebView2](https://tomtalks.blog/microsoft-teams-2-0-will-use-half-the-memory-dropping-electron-for-edge-webview2/) — teknikpress, Teams-migreringen

**Interna källor (detta repo, verifierat mot disk/gren 2026-08-02):**

- [`CLAUDE.md:349`](../../CLAUDE.md) — "produkten Lotta använder dagligen"
- [`vite.config.ts` rad 40–71](../../vite.config.ts) — nuvarande VitePWA-manifest
- [`docs/decisions/ADR-047-pwa-arkitektur-fas-5.md`](../decisions/ADR-047-pwa-arkitektur-fas-5.md) — PWA-grundens arkitekturbeslut
- [`tasks/sessions/bilagor/s87-spaning/a4-riktig-webbapp-inbjudan.md`](../../tasks/sessions/bilagor/s87-spaning/a4-riktig-webbapp-inbjudan.md) — S87-spaningen som satte upp T95
- `tasks/sessions/archive/2026-08/2026-08-02-session-95.md` Del 1 (main) + Del 2 (gren `docs/s95-del2-samsyn`, commit `6ff0528b`) — grillningens beslut 9 + enhetsprofilen
