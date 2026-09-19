---
owner: marcus803
updated: 2026-09-19
review_by: 2026-12-19
status: stable
---

# Luma-studien — mönster för nya miranon.se (Code, 2026-09-19)

> **Proveniens:** avgränsat research-pass (bakgrundsagent, Session 128), kört
> **oisolerat i huvudkatalogens worktree** `s128-docs`
> (gren `docs/s128-fodelse`, `aea8ef0` vid landning). Beställt av
> orkestreraren som ett av tre parallella S128-pass (de andra: intagskedjans
> inventering, Shopify-API-vägen). Ingen produktionskod rörd — passet är
> läsning plus denna fil. **Ett verktygsproblem gjorde att passet inte kunde
> genomföras som beställt** — se § Metod nedan, läs den FÖRE resten av
> dokumentet. Detta är inte en fullständig mätning; det är en källbelagd
> mönsterstudie med en öppet redovisad lucka.

---

## Kort svar

**Domen i klartext:** Lumas **struktur och flöde** är starkt överförbara till
nya miranon.se — sidtypsindelning (hem/discover · kalender · eventsida ·
anmälan), eventsidans blockordning, kalenderns månadsvy med prickar,
anmälan-inline-på-sidan (aldrig egen sida/modal), bekräftelse-mail med
kalender-tillägg, och att-göra-gatade automatpåminnelser (väntelista/pending
får dem inte). Dessa mönster är källbelagda mot Lumas egen hjälpdokumentation
och går att bygga i vårt stack utan att låna en rad kod eller en pixel.

**Lumas visuella SPECIFIKA värden (typsnitt, spacing, radier, skuggor,
färgkoder) kunde INTE mätas i detta pass** — en delad
`chrome-devtools`-webbläsarprofil var upptagen av en annan samtidig session
under passets HELA körtid (se § Metod). Ingen skärmdump togs, ingen
`getComputedStyle`-läsning gjordes, ingen Lighthouse-granskning kördes.
Detta är den enskilt viktigaste begränsningen i detta dokument, och den gäller
direkt delfråga 5 och 6 i uppdraget — båda är **ofullständiga** och kräver ett
uppföljande pass med fungerande webbläsaråtkomst innan några pixel- eller
tillgänglighetsbeslut fattas på deras underlag.

**Den avgörande delfrågan** visade sig inte vara visuell utan strukturell:
**hur Luma gatar automatiska påminnelser på godkännande-/väntelistestatus,
och hur väntelistan promoveras helt MANUELLT (ingen automatisk
plats-tilldelning)** — ett mönster som är direkt applicerbart på Miranons
väg A (formulär → Supabase EF → Airtable tills Fas E) och som förklarar varför
en enkel "först till kvarn"-väntelista är fel modell för oss redan innan vi
bygger den.

---

## Metod — och en blockad som måste redovisas öppet

Uppdraget beställde `mcp__chrome-devtools__*` (uttryckligen inte Playwright,
upptaget av ett parallellt pass). Vid FÖRSTA anropet (`new_page` mot
`https://luma.com`) svarade verktyget:

```text
The browser is already running for /Users/marcus/.cache/chrome-devtools-mcp/chrome-profile.
Use --isolated to run multiple browser instances.
Cause: The browser is already running for /Users/marcus/.cache/chrome-devtools-mcp/chrome-profile.
Use a different `userDataDir` or stop the running browser first.
```

Verifierat i skalet (`ps aux`): den delade profilkatalogen
`~/.cache/chrome-devtools-mcp/chrome-profile` hölls låst av en **levande**
Chrome-process (PID 7523, `SingletonLock` pekade på den, ~2 timmars
körtid) — inte en orphanad/kraschad rest. Två separata
`chrome-devtools-mcp`-serverprocesser kördes samtidigt på maskinen (PID 7222
och 8686, olika terminal-sessioner), vilket är konsekvent med att en annan
samtidig Claude Code-session (troligen S127, eller S128:s egen parallella
Shopify-API-vägen-pass) redan höll profilen när detta pass startade.

**Jag avstod uttryckligen från att döda den processen.** Den tillhör inte
detta pass, och att avsluta en annan sessions webbläsare är exakt den typ av
sidoeffekt-på-delad-resurs uppdraget förbjuder ("rör inga andra filer i
repot" — samma princip appliceras här på en delad process). Jag försökte
`list_pages`/`new_page` **tio gånger** utspritt över hela passets körtid (med
verkligt research-arbete emellan, inte en sömn-loop) — blockaden höll hela
tiden, inklusive vid sista försöket omedelbart före denna fil skrevs.

**Vad jag gjorde i stället:** byggde om metoden kring `WebFetch` (HTML → text,
utan JS-exekvering av tunga SPA-vyer) och `WebSearch` mot Lumas egen
hjälpdokumentation (`help.luma.com`, förstapart) plus tredjeparts
UI-genomgångar. Det ger **strukturella och textuella fakta** — sidordning,
knapptexter, gatningsregler, flödessteg — men **inga uppmätta visuella
värden**. Varje påstående nedan är källmärkt med `[MÄTT]` (jag observerade det
direkt, t.ex. en HTTP-redirect) eller `[CITERAT: <källa>]` (hämtat ur en
sidas textinnehåll, inte mätt av mig). Ingenting i denna fil är gissat.

**Skärmdumpskatalogen är TOM.** Skapad enligt uppdrag
(`/private/tmp/claude-501/-Users-marcus-Repon-miranon-media-admin/0d749d3e-4015-4e6a-8477-b1c31a5545c7/scratchpad/luma/`),
men inget kunde läggas i den eftersom ingen sida någonsin renderades i en
webbläsare jag kontrollerade.

**Domänhypotesen verifierades ändå — mätt, inte citerat.** Två oberoende
`WebFetch`-anrop (`https://lu.ma/xi49xg4d` och
`https://help.lu.ma/p/helpart-.../event-registration-process`) gav båda ett
servern-genererat `301 Moved Permanently` med `Location`-header till
`luma.com`/`help.luma.com`. **`luma.com` är alltså den kanoniska domänen idag
[MÄTT]**, medan `lu.ma` lever kvar som en fungerande kort-URL-omdirigering —
samtliga verkliga eventlänkar jag hittade via sökning använde fortfarande
`lu.ma/<kod>`-formen, inte `luma.com/<kod>` direkt. Relevant för Miranon Media: om
`miranon.se` någon gång ska bära korta, delningsbara eventlänkar (jfr
`ADR-122`:s problem med handskrivna Elfsight-länkar) är mönstret "kort
redirect-domän + kanonisk domän" värt att notera, inte kopiera rakt av.

---

## Vad vi redan visste (inventerat FÖRE första sökningen)

Två befintliga research-pass i detta repo citerar redan Luma, och jag läste
båda i sin helhet innan jag sökte något nytt:

- **[`hallplats-modellen-eventsidan-2026-07-26.md`](hallplats-modellen-eventsidan-2026-07-26.md)**
  (S91) — undersökte ADMIN-sidans (Lottas verktyg, inte den publika sajten)
  block-struktur för anmälningar/betalningar. Luma citeras där för: *Blasts*
  som egen schemaläggningsbar utskicksyta filtrerad på gäststatus + biljettyp,
  och att Luma grindar påminnelser på **godkännande/väntelista, aldrig
  betalning** (*"Guests who are still pending approval or on the waitlist do
  not receive automated reminders"*). Detta pass **bekräftar och fördjupar**
  samma fynd oberoende (se § 4) och lägger till den EXAKTA timingen ("1 day
  and 1 hour before") samt att väntelistan är **manuellt** promoverad, inte
  automatisk — den senare biten fanns inte i S91-passet.
- **[`checkin-monsterklassen-2026-07-26.md`](checkin-monsterklassen-2026-07-26.md)**
  (S91) — Lumas två check-in-lägen (Standard med ångra-på-posten, Express med
  "senast skannade"-lista) och att ingen av fem undersökta produkter bygger
  massmarkering vid dörren. Detta rör check-in-appen, inte den publika sajten,
  och är alltså **inte** i scope för detta pass — men bekräftar att Luma
  konsekvent är en stark precedent-källa i detta repos tidigare research.
- **`docs/decisions/ADR-122-eventlankens-vakt-och-atgardskon.md`** — inte om
  Luma, men avgörande KONTEXT: dagens miranon.se använder en **Elfsight Event
  Calendar-widget** med **handskrivna** anmälningslänkar, vilket redan orsakat
  en mätt felklass (64 felmatchade anmälningar av 304). Detta är exakt den typ
  av strukturell skörhet en custom-byggd kalender/eventsida (inspirerad av
  Luma) skulle eliminera by construction — se § 7.
- **`tasks/threads/T79-custom-miranon-se-webbplats-app-samverkan-marcus.md`**
  och `docs/reference/miranon-arkitektur/arkitektur-destillat-och-gap-2026-07-25.md`
  § Spår 2 — dagens miranon.se är en **Shopify-mall + Elfsight-widgetar**
  (kalender + formulär). Livscykel-modellen `draft → scheduled → published →
  archived` med synlighet skild från bokningsbarhet är redan föreslagen som
  källarkitektur, medan basens fält idag bara är en checkbox
  (`Publicerad på miranon.se`). Relevant för § 7: Lumas eventstatus-modell
  (går/väntelista/pending/checked in) är en LIKNANDE men **annan** axel — gäst-
  status, inte publicerings-status — och de två får inte blandas ihop när
  datamodellen designas.
- **Sessionsdoket `tasks/sessions/2026-09-19-session-128.md` Del 1** — Marcus
  ordagranna uppdrag, väg A (formulär → Supabase EF → Airtable tills Fas E),
  och att inget säljs på sajten (ingen Shopify-produktkoppling behövs för
  SAJTENS del, bara för att den nuvarande sajten historiskt är byggd på en
  Shopify-mall).

**Ingen ADR eller lessons-post täcker frågan** "vilka Luma-sidtyper/flöden ska
vi låna" — sökning på "Luma" i `tasks/lessons.md` gav noll träffar, och ingen
ADR i `docs/decisions/` nämner Luma. Detta pass är alltså den FÖRSTA
strukturerade genomlysningen av Lumas publika ytor (i motsats till dess
admin-/check-in-ytor, som redan var täckta).

**Åldersbedömning:** de två befintliga passen är från 2026-07-26, drygt sju
veckor gamla. Luma är ett snabbrörligt produktteam (help-artiklar refererar
"Update to Reminders on Luma" som en namngiven ÄNDRING), så jag verifierade
reminders-gatningen på nytt i stället för att bara återanvända S91:s citat —
den höll oförändrad (se § 4), men verifieringen var värd att göra om.

---

## Frågan

Vilka sidtyper, layoutmönster, interaktionsmönster och anmälningsflöden bär
Lumas publika ytor — och vilka av dem är överförbara till nya miranon.se,
vilka är det inte, och varför?

---

## 1. Sidtyps-inventering

| Sidtyp | URL-mönster (observerat) | Vad den gör | Källa |
|---|---|---|---|
| **Startsida** | `luma.com` | Fyra hero-sektioner med skiftande adjektiv ("Delightful", "Vivid", "Stellar", "Lovely"), primär CTA "Create Your First Event", sekundär "Discover Events". Toppnav: Discover · Pricing · App · Help · Sign In | `[CITERAT: luma.com, WebFetch]` |
| **Discover/utforska** | `luma.com/discover` (äldre `explore`-alias existerar) | INGEN sök-ruta eller datumfilter enligt den textstruktur jag kunde läsa — i stället tre parallella ingångar: **12 kategori-plattor** med räknare (Family 647, Tech 4K, AI 4K …), **6 utvalda kalendrar** (community-organisatörer), **städer grupperade per kontinent** med räknare (London 58, Paris 40, Berlin 50 …) | `[CITERAT: luma.com/discover, WebFetch]` |
| **Organisatör-kalender (publik)** | `luma.com/<slug>` (t.ex. ett institut-exempel) | Organisatörens egen "hemsida": titel, sociala länkar, **månadsvis kalendergrid med prickar** för dagar med event, `Upcoming`/`Past`-flikar, `Follow`-knapp, `Submit Event`-länk, moderationsnotis ("X events pending approval") | `[CITERAT: WebFetch, organisatörsexempel]` |
| **Eventsida (publik)** | `luma.com/<kod>` / kort-URL `lu.ma/<kod>` | Se § 2 | `[MÄTT: 301-redirect] + [CITERAT: tre olika eventsidor]` |
| **Anmälan** | Inline-block på eventsidan — INGEN egen URL, inget separat steg | Se § 4 | `[CITERAT: help.luma.com/event-registration-process]` |
| **Bekräftelse/biljett** | Egen ticket-vy efter anmälan (`Add to Wallet`, QR, `Add to Calendar`) | Se § 4 | `[CITERAT: help.luma.com/mobile-wallet-passes, sökresultat]` |
| **Hjälpcenter** | `help.luma.com` | Förstaparts-dokumentation, egen domän | `[MÄTT: 301-redirect från help.lu.ma]` |
| **Pricing / App** | Länkade från toppnav, ej undersökta i detta pass | Utanför frågans scope (organisatörens betalvägar, inte publik-facing innehåll) | — |

**Tolkning för Miranon Media:** fyra av dessa sidtyper är direkt relevanta —
startsida, kalender (motsvarar "alla kommande event"), eventsida, anmälan.
Discover-sidans kategori-/stad-navigering är en **multi-organisatör**-lösning
(Luma är en marknadsplats med tusentals arrangörer); Miranon Media är EN arrangör,
så en motsvarighet skulle vara kraftigt överdimensionerad — se § 7.

---

## 2. Eventsidans anatomi

Undersökt via tre olika eventsidor (en gratis, en betald, en fullbokad med
väntelista — samtliga historiska/publikt sökbara event, inga verkliga namn
citeras nedan per repots pseudonymiseringsregel).

### Blockordning, uppifrån och ned (konsekvent över alla tre)

1. **Omslagsbild** — stort kvadratiskt/liggande format högst upp
2. **Arrangörens avatar + namn + Follow-knapp**
3. **Eventtitel** som stor rubrik
4. **Värd(ar)** — namn + sociala ikoner (Instagram, LinkedIn, webb)
5. **Datum/tid** — läst som fritext, t.ex. "April 19 Saturday, 10:00 AM –
   4:00 PM"; på ett av exemplen bröts tiden ner i en egen **agenda** med
   tidsblock inom beskrivningen
6. **Plats** — adress i klartext + inbäddad Google Maps-länk
7. **Beskrivning** — rubriker + punktlistor för struktur (agendapunkter, pris,
   regler som "21+, inga undantag")
8. **Registrerings-/biljettblock** — se § 4; placerat MELLAN beskrivning och
   deltagarlista på de exempel jag kunde läsa, inte längst upp
9. **Deltagarantal** — "X Went" (avslutade event) / gäst-avatarer
10. **Värdkontakt + "rapportera event"**
11. **Sidfot** — Discover/Pricing/Help, sociala länkar, app-nedladdning

`[CITERAT: tre eventsidor, WebFetch — se § Källförteckning]`

### Pris, platser kvar, arrangör

- **Pris:** visas som separata **biljettyper** med egna priser (ex: "General
  Admission $10" / "VIP $75") — inte ett enda pris för hela eventet.
  `[CITERAT]`
- **Platser kvar:** enligt sökresultat och hjälptext använder Luma
  formuleringen **"spots left"** som kapacitetsindikator, men jag kunde INTE
  verifiera den EXAKTA UI-placeringen eller om den alltid visas (kräver live
  DOM-läsning). `[CITERAT, EJ verifierat i UI — flaggat i § Vad jag inte
  kunde belägga]`
- **Arrangör:** konsekvent en kombination av "presenter" (organisation, med
  sociala länkar) och namngivna "host(s)" — två separata roller på samma
  sida. `[CITERAT]`

### Anmälnings-CTA vid scroll (mobil kontra desktop)

**Kunde INTE verifieras i detta pass** — detta kräver att man faktiskt
scrollar en levande sida och observerar om knappen blir sticky, vilket
förutsätter en fungerande webbläsare. Tredjeparts-UI-genomgångar jag hittade
nämnde inte scroll-beteendet specifikt. Detta är ett konkret hål i § Vad jag
inte kunde belägga — och ett av de viktigaste att stänga i ett uppföljande
pass, eftersom en sticky anmälnings-CTA direkt påverkar hur vi bygger
motsvarande yta.

### Sold-out/väntelista-läget

På den fullbokade eventsidan:

- Titeln bar explicit **"\*Sold Out - Waitlist Only\*"** som en del av
  eventnamnet (inte bara en badge)
- En textrad: **"This event is currently SOLD OUT due to attendee
  capacity."**
- Knappen ändrades till **"Require Approval"**/väntelisteflöde i stället för
  direktbekräftelse
- Instruktionstext förklarade att **kortet INTE debiteras förrän en plats
  öppnas och anmälan godkänts** — en tydlig, läsbar förklaring av vad som
  händer, inte bara en gråtonad knapp
- Praktisk platshanteringsinstruktion till redan anmälda: "avboka om du inte
  kan komma, så flyttas väntelistan fram"

`[CITERAT: help.luma.com/waitlist + en fullbokad eventsida, WebFetch]`

---

## 3. Kalender-/listmönstret

**Organisatörens kalendersida** (motsvarigheten till en "alla event"-sida för
Miranon Media) bygger på:

- **Månadsgrid med prickar** — en kalenderyta (inte en ren lista) där dagar
  med event markeras, och månaden kan bläddras
- **`Upcoming` / `Past`-flikar** — enkel tvådelning, ingen mer granulär
  tidsindelning (inget "denna vecka"/"denna månad" utöver själva
  kalendergriden)
- **Tomt läge:** en av de undersökta organisatörssidorna visade explicit
  **"You have 0 events pending approval"** som moderationsnotis, men jag
  kunde INTE verifiera hur en kalender med noll KOMMANDE event renderas för
  en besökare (troligen ett tomt-state under griden, men detta är ett hål —
  se § 8)
- **Filtrering:** Discover-sidans kategori-/stad-navigering är
  multi-organisatörens motsvarighet till filter; på en ENSKILD organisatörs
  kalender kunde jag inte belägga tagg-/kategorifilter inom kalendern själv —
  Lumas egen hjälpsida (redan citerad i S91-passet, `managing-your-guest-list`
  m.fl.) nämner "filter events by tags" som en kalender-egenskap, men jag
  kunde inte se den i praktiken i detta pass. `[CITERAT, ofullständigt
  verifierat]`

**Grupperingsprincip:** dag-nivå (kalendergriden), inte vecka eller "nästa 7
dagar"-block. Detta skiljer sig från många enklare eventlistor (rak
kronologisk lista) — Luma väljer en genuin KALENDER-metafor, inte en
sorterad lista med datumrubriker.

---

## 4. Anmälningsflödet

Källa: `help.luma.com` (förstaparts-hjälpartiklar, citerade direkt) plus
observation av knapptexter på tre eventsidor. **Ingenting nedan skickades in
— jag stannade vid att läsa formulärets och flödets textbeskrivning.**

### Steg och fält

1. **Inline på eventsidan, INTE en egen sida eller modal.**
   *"Guests access the event through a shared Luma Event Page, where they
   find a registration button."* Registreringen sker "on the event page
   itself, not in a separate modal." `[CITERAT: help.luma.com,
   event-registration-process]`
2. **Minimifält:** namn + e-post. **Inget konto krävs** — *"Guests don't need
   a Luma account or a sign-in to register."* `[CITERAT]`
3. **Anpassningsbara fält:** arrangören kan lägga till egna
   registreringsfrågor via en "Registration"-flik i sitt adminläge.
   `[CITERAT]`
4. **Biljettval** vid flera biljettyper (observerat på det betalda
   eventexemplet: två separata rader att välja mellan innan man går vidare).
   `[CITERAT]`
5. **Betalning** (om biljett kostar pengar) — auktoriseras vid anmälan; vid
   väntelista auktoriseras men **debiteras INTE förrän godkänd**.
   `[CITERAT: help.luma.com/waitlist]`

### Knapptexter, observerade per läge

| Läge | Knapptext | Källa |
|---|---|---|
| Öppen, direkt anmälan | (ej entydigt verifierat — troligen "Register"/"RSVP", men jag såg bara knappen i "Request to Join"-läget på de tre exempel jag läste, samtliga med godkännande- eller efterhandsstatus) | `[EJ verifierat — flaggat]` |
| Kräver godkännande | **"Request to Join"** | `[CITERAT]` |
| Fullbokat, väntelista | **"Join Waitlist"** | `[CITERAT]` |

### Bekräftelseläge

- **E-postbekräftelse** med **kalenderbjudan som läggs till automatiskt** —
  *"a registration confirmation email with a calendar invite"* som
  *"automatically gets added to their calendar"* utan manuellt klick.
  `[CITERAT]`
- **Digital biljett/wallet-pass** med **QR-kod** för in-person-event — samma
  QR-kod fungerar i bekräftelsemailet och i en "Add to Wallet"-genererad pass.
  `[CITERAT: help.luma.com/mobile-wallet-passes]`
- **Online-event:** bekräftelsemailet bär en unik join-länk (Zoom eller
  motsvarande). `[CITERAT]`

### Godkännande-krävs-läget

- Gästen ser initialt ett **pending**-tillstånd, ingen omedelbar bekräftelse
- Arrangören godkänner/avböjer manuellt i efterhand, vardera med egen
  e-postmall (anpassningsbar) `[CITERAT]`

### Väntelisteläget — VIKTIGASTE strukturella fyndet i detta pass

- **Promovering är HELT MANUELL.** Lumas egen hjälptext: *"hosts must
  manually approve waitlisted guests when spots become available."* **Ingen
  automatisk "först till kvarn"-tilldelning finns.** `[CITERAT:
  help.luma.com/waitlist]`
- Ingen tidsgräns för att acceptera en erbjuden plats nämns i
  dokumentationen. `[CITERAT, frånvaro noterad]`
- Väntelistade gäster saknar åtkomst till eventdetaljer (t.ex. en
  video-länk) förrän godkända. `[CITERAT]`

### Automatpåminnelser — gatade på status, ALDRIG på betalning

- *"Reminders go out via email, SMS, and push notifications."* `[CITERAT]`
- *"Guests who are still pending approval or on the waitlist do not receive
  automated reminders."* `[CITERAT: help.luma.com/update-to-reminders-on-luma
  — bekräftar S91-passets citat oförändrat]`
- **Exakt timing:** *"Our standard reminders go out 1 day and 1 hour before
  the event."* `[CITERAT — samma artikel]`

### Felhantering

**Kunde INTE beläggas i detta pass.** Ingen hjälpartikel jag hittade
beskriver vad som händer om: e-postformatet är ogiltigt, eventet blir
fullbokat MEDAN någon fyller i formuläret, eller betalningen nekas. Detta
kräver antingen live-formulärtestning (som uppdraget uttryckligen förbjuder —
"skicka aldrig in ett formulär") eller en djupare hjälpartikel jag inte
hittade. Flaggat i § 8.

---

## 5. Det visuella språket — INTE uppmätt, med skälet upprepat

Uppdraget bad om en tabell med MÄTTA värden (typsnitt, spacing, radier,
skuggor, färgroller, rörelse, mörkt/ljust läge). **Jag kan inte leverera den
tabellen** — se § Metod. Det som går att säga, källbelagt men INTE mätt av
mig:

| Egenskap | Vad som är känt | Status |
|---|---|---|
| Typsnitt | Organisatörer kan "choose a font for your event title" från "a curated collection of professional typefaces" — antal och namn okänt | `[CITERAT, ofullständigt]` |
| Färgsystem | ETT tema-val ger en tonfärg ("tint") som genomsyrar HELA eventsidan OCH bär över i alla e-postmallar (länkar, knappar, accenter) — en enda källa-till-sanning-färg per event, inte ett flerskiktat token-system som vårt eget | `[CITERAT: help.luma.com/event-themes-and-customization]` |
| Teman | "Over 40" fördefinierade teman i kategorier (Minimal, Confetti, Emoji, Pattern, Seasonal, Warp, Special Effects) | `[CITERAT]` |
| Mörkt/ljust läge | Många teman stödjer BÅDA lägena med ett `Auto`-alternativ som "follows the viewer's appearance setting" (dvs. `prefers-color-scheme`) | `[CITERAT]` — mönstret (auto via systeminställning) är samma som vårt eget `prefers-*`-krav, men INGEN egen mätning av kontrastvärden gjordes |
| Rörelse | Tredjepartskälla nämner "custom slide-up transitions for detail screens" som känns "responsive and modern" — ingen `prefers-reduced-motion`-hantering nämnd eller verifierad | `[CITERAT, tredjepart — svagare källa]` |
| Radier/skuggor/spacing | **Ingen källa jag hittade anger konkreta värden.** Detta kräver `getComputedStyle`. | **EJ BELAGT** |
| Max-bredder/breakpoints | **Ingen källa.** Kräver `resize_page` + mätning. | **EJ BELAGT** |

**Slutsats för § 5:** det enda strukturellt intressanta, KÄLLBELAGDA fyndet är
att Luma kör **en enda tonfärg per event** (vald av arrangören, appliceras
genom hela sidan och e-post) snarare än ett fast varumärkes-palett. Det är en
produktdesign-egenskap (multi-tenant-plattform där varje arrangör vill sticka
ut), inte nödvändigtvis rätt för Miranon Media, som har ETT varumärke och redan ett
3-lagers token-system (`--p-*` → `--mm-*` → komponent). Se § 7.

---

## 6. Tillgänglighets-granskning — INTE genomförd, och det måste sägas rakt ut

**Ingen Lighthouse-granskning kördes** (kräver en fungerande
`chrome-devtools`-session). **Ingen axe-core- eller manuell tangentbords-
/skärmläsargranskning gjordes.** Jag sökte aktivt efter tredjepartskällor som
skulle kunna fylla luckan:

- Sökning efter "Luma accessibility screen reader keyboard navigation" gav
  **noll relevanta träffar** — de träffar som kom upp handlade om andra
  produkter som råkar heta Luma (en energibolagstjänst, en dejtingtjänst) och
  om generell tillgänglighetsteori, inte om `lu.ma`/`luma.com` specifikt.
- En akademisk designkritik (IXD@Pratt, se källförteckning) nämnde **noll**
  tillgänglighetsfynd trots att den explicit gick igenom UX-brister
  (otydliga obligatoriska fält, förvirrande ikonnamn). Det är svagt negativt
  belägg — en granskning som LETADE efter UX-problem och inte nämnde
  tillgänglighet, men det är inte detsamma som "Luma är otillgänglig" eller
  "Luma är tillgänglig". Frånvaro av fynd är inte ett fynd.

**Detta betyder konkret: vi vet INTE om Luma når vårt 11/10-golv, och vi får
under inga omständigheter anta att den gör det bara för att den ser polerad
ut.** Repots kvalitetsribba (`CLAUDE.md` § Kvalitetsribba) sätter
tillgänglighet till **11, utan undantag**, oavsett vad förlagan gör. Ett
uppföljande pass MÅSTE köra `lighthouse_audit` (både `desktop` och `mobile`)
plus en verklig tangentbords-genomvandring på minst en eventsida och
anmälningsflödet innan vi lånar ett enda interaktionsmönster rakt av utan att
själva verifiera det mot WCAG.

**Vad som ÄR känt, indirekt:** att teman kan följa `prefers-color-scheme`
(§ 5) är ett gott tecken, men rör bara färgläge — inte fokusordning,
landmärken, rubrikhierarki eller tangentbordsflöde, vilket är precis de
punkter uppdraget efterfrågade och som ingen källa besvarade.

---

## 7. Överförbarhets-tabell

| Mönster | Värde/form hos Luma | Överförbart till miranon.se? | Skäl |
|---|---|---|---|
| Eventsida: block-ordning (bild → titel → värd → datum/plats → beskrivning → CTA → deltagarantal) | Se § 2 | **Ja** | Ren informationsarkitektur, inget varumärkesspecifikt. Löser samma problem vi redan har: dagens Elfsight-widget saknar denna konsekventa struktur och är källan till `ADR-122`:s länkfel. |
| Anmälan INLINE på eventsidan, aldrig egen sida/modal | § 4 | **Ja** | Matchar Marcus väg A (formulär skriver direkt till EF). Eliminerar ett extra navigationssteg för Gunilla-målgruppen — en sida att förstå, inte två. |
| Namn + e-post som minimifält, inget konto krävs | § 4 | **Ja** | Miranons deltagare (Lottas kunder) förväntas inte skapa konto — matchar redan dagens Elfsight-formulär i princip, och är rätt golv för Gunilla-principen: ingen inloggning att förklara. |
| Kalendergrid med prickar per dag | § 3 | **Anpassat** | Bra mönster för EN arrangör med MÅNGA event utspridda över månader. Miranon Media har ett mindre, mer sporadiskt eventflöde — en enklare KRONOLOGISK LISTA grupperad per månad (utan full kalendergrid-interaktion) ger samma överblick med mindre byggkostnad och färre interaktionslägen att tillgänglighetstesta. Behåll IDÉN (tydlig tids-gruppering), skala ner FORMEN. |
| Discover-sidans kategori-/stad-navigering | § 1 | **Nej** | Löser ett multi-tenant-marknadsplats-problem (tusentals arrangörer). Miranon Media är EN arrangör — motsvarande yta vore spekulativ komplexitet utan användare (`~/.claude/CLAUDE.md` § över-engineering-vakt). |
| En (1) tonfärg per event, appliceras genomgående + i mejl | § 5 | **Nej** | Motsatt vårt designval. Vi har redan ett 3-lagers token-system (`--p-*`/`--mm-*`/komponent, `DESIGN-SYSTEM-SPEC.md`) byggt för ETT konsekvent varumärke (Roger & Lottas identitet), inte ett verktyg där varje event väljer sin egen kulör. Att låna mekaniken skulle underminera vårt eget systembeslut utan skäl. |
| 40+ färdiga teman med animationer/partikeleffekter | § 5 | **Nej** | Löser problemet "arrangörer utan designkompetens ska ändå få ett snyggt event". Miranon Media har ETT event-flöde med ETT varumärke som redan är designat (FK-inspirerat token-system) — temaväljaren löser ett problem vi inte har, och adderar en komplexitetsyta (40+ varianter att tillgänglighetstesta) vi definitivt inte vill äga. |
| Väntelista: MANUELL godkännande, ingen auto-tilldelning | § 4 | **Ja, men PRÖVAT mot vårt eget nät** | Matchar redan Lottas arbetssätt (hon godkänner manuellt idag). VIKTIGT: `hallplats-modellen-eventsidan-2026-07-26.md` visade att vår egen bekräftelse-/betalnings-modell redan är ett NÄT, inte en kedja (sex verkliga undantagsfall). Lumas väntelistemodell är en KEDJA (en axel: pending → approved → going). Innan vi bygger en väntelista på nya miranon.se måste den modelleras mot VÅRA verkliga undantag, inte kopieras rakt av. |
| Påminnelser gatade på godkännande/väntelista-status, ALDRIG på betalning | § 4 | **Ja** | Redan REKOMMENDERAT i `hallplats-modellen`-passet (Del 5.2) som branschmönster för eventinfo-frågan. Detta pass bekräftar det oberoende med exakt timing (1 dag + 1 timme). Direkt applicerbart när eventinfo-motorn (utanför task-18:s omfattning) någon gång byggs. |
| E-postbekräftelse med automatiskt kalender-tillägg | § 4 | **Ja** | Lågt byggkostnad, hög Gunilla-nytta (hon slipper komma ihåg att lägga till eventet själv). Standard branschmönster (delas av Eventbrite/Cvent enligt tidigare research). |
| QR-biljett/wallet-pass för in-person-check-in | § 4 | **Nej, i nuläget** | `checkin-monsterklassen-2026-07-26.md` konstaterade redan att vår app **saknar biljett-QR helt** och att införa det är ett eget spår, inte en check-in-skiva. Samma slutsats gäller här: attraktivt mönster, men en förutsättning (biljettkoder i basen + bekräftelsemail) som inte finns och inte ska byggas "ifall". |
| Sold-out-läge med FÖRKLARANDE text (inte bara gråtonad knapp) | § 2 | **Ja** | Ren Gunilla-vinst: en förklarande mening ("din anmälan hanteras när en plats öppnas") kostar nästan inget och förhindrar förvirring — motsvarar redan repots princip att aldrig låta UI påstå något outtalat (jfr `hallplats-modellen` § "krysset ljuger"-fyndet). |
| Sticky anmälnings-CTA vid scroll | Ej verifierat (§ 2) | **Kan ej bedömas** | Vi vet inte om Luma ens gör detta. Ingen dom möjlig förrän ett uppföljande pass mätt beteendet live. |
| Visuella exaktvärden (radier, skuggor, spacing-skala, typsnittsstorlekar) | Ej mätt (§ 5) | **Kan ej bedömas** | Se § Metod. Detta är den tydligaste kvarvarande skulden i detta pass. |

---

## 8. Vad som INTE besvarades

Utöver de punkter som redan är flaggade ovan, samlat:

1. **Ingen levande DOM lästes någonsin** — noll `take_snapshot`, noll
   `take_screenshot`, noll `evaluate_script`, noll `lighthouse_audit`. Detta
   är roten till nästan alla luckor nedan.
2. **Eventsidans CTA-beteende vid scroll** (sticky eller ej, mobil kontra
   desktop) — okänt.
3. **Exakta visuella värden** — typsnittsfamilj/storleksskala, spacing-rytm,
   radier, skuggor, exakta färgkoder, breakpoints — okänt.
4. **Lighthouse-poäng** (prestanda + tillgänglighet) på en eventsida —
   okänt.
5. **Tangentbordsflöde och skärmläsarbeteende** i registreringsflödet —
   okänt. Ingen tredjepartskälla fyllde luckan.
6. **Tomt läge när en organisatör har NOLL kommande event** — okänt (såg bara
   en moderationsnotis om noll VÄNTANDE event, inte noll KOMMANDE).
7. **Felhantering i anmälningsformuläret** (ogiltig e-post, kapacitet som tar
   slut mitt i ifyllnad, nekad betalning) — ingen källa beskrev detta.
8. **Exakt knapptext för en ÖPPEN, ej godkännande-krävande anmälan** — jag såg
   bara "Request to Join" (godkännande) och "Join Waitlist" (fullbokat); den
   enklaste, vanligaste vägen ("bara anmäl dig") observerades aldrig direkt
   eftersom alla tre undersökta exempel råkade kräva godkännande eller vara
   fullbokade.
9. **Kalenderns tagg-/kategorifilter på EN organisatörs sida** (skilt från
   Discover-sidans multi-organisatörsfilter) — nämnt i en hjälpartikel men
   aldrig sett i praktiken i detta pass.
10. **Om WebFetch-metoden själv missade innehåll** som bara renderas via
    JavaScript efter sidladdning (troligt för kalenderns eventlistor, där
    resultaten kom tillbaka ovanligt tomma trots att sidstrukturen — flikar,
    kalendergrid — lästes fint). Detta är en metod-svaghet jag flaggar öppet:
    WebFetch konverterar statisk/initial HTML, och en tungt klient-renderad
    lista kan vara osynlig för den även när den finns på riktigt.

---

## Dom

Lumas **mönster** — informationsarkitektur, blockordning, gatningsregler för
kommunikation, inline-anmälan utan konto — är en stark, källbelagd förebild
för nya miranon.se och kräver inget lån av kod, bilder eller text för att
återanvändas. Sju av de mönster som undersöktes bedöms **direkt
överförbara**, tre bedöms **inte överförbara** (multi-tenant-lösningar på
problem Miranon Media inte har), ett kräver **anpassning i skala** (kalendergrid →
enklare kronologisk lista), och **två centrala delar av det ursprungliga
uppdraget — visuella exaktvärden och tillgänglighetsgranskning — kunde inte
besvaras alls** på grund av en delad verktygsresurs som var upptagen under
passets hela körtid. Domen på delfråga 5 och 6 är därför: **omätt, inte
"godkänt" och inte "underkänt".**

---

## Vad jag inte kunde belägga

Sammanställt (se även § 8 för den fulla listan):

- **All visuell mätdata** (typsnitt, spacing, radier, skuggor, exakta
  färgvärden, breakpoints) — kräver en fungerande `chrome-devtools`-session.
- **Lighthouse-poäng** (prestanda + tillgänglighet) på någon Luma-sida.
- **En genomförd tangentbords-/skärmläsargranskning** — ingen förstaparts-
  eller tredjepartskälla fyllde denna lucka; frånvaron av fynd rapporteras
  som frånvaro, inte som friande.
- **Sticky-CTA-beteende vid scroll**, mobil kontra desktop.
- **Felhantering i anmälningsformuläret.**
- **Tomt-läge för en organisatörskalender med noll kommande event.**
- **Om WebFetch-metoden missade JS-renderat innehåll** på kalendersidan
  (metod-svaghet, inte ett Luma-fynd).
- **Orsaken till att chrome-devtools-profilen var låst** — jag verifierade
  ATT den var upptagen av en levande process (PID 7523), men inte VILKEN
  session som ägde den.

---

## Rekommendation

**Detta är en rekommendation, inte ett beslut.**

1. **Använd överförbarhets-tabellen (§ 7) som utgångspunkt för grillningen**
   av nya miranon.se — sju mönster är redan källbelagt klara att diskutera,
   och tre är källbelagt AVFÄRDADE med skäl (spara den diskussionen).
2. **Kör ett uppföljande, snävt research-pass ENBART mot § 5 och § 6**
   (visuella exaktvärden + Lighthouse + tangentbordsgranskning) så snart
   `chrome-devtools`-profilen är ledig — troligen efter att S127/den
   parallella sessionen stänger sin webbläsare. Det passet behöver inte
   upprepa något av detta dokuments strukturella arbete, bara komplettera
   § 5–6 och de tio punkterna i § 8.
3. **Bygg aldrig en väntelista eller ett kalendergrid rakt av från Lumas
   modell** utan att först stämma av mot vårt EGET nät av undantagsfall
   (`hallplats-modellen-eventsidan-2026-07-26.md` Del 3) — Lumas modell är en
   ren kedja, vår domän är bevisat inte det.
4. **Tillgänglighetsgolvet (11, utan undantag) verifieras ALDRIG genom att
   anta att en polerad förlaga klarar det.** Detta gäller särskilt eftersom
   ingen tredjepartskälla kunde bekräfta ELLER dementera Lumas
   tillgänglighet — vi bygger vårt eget golv oavsett vad punkt 2:s
   uppföljning visar.

---

## Källförteckning

### Förstapart — Luma

- Startsida: <https://luma.com> — `[WebFetch, 2026-09-19]`
- Discover-sida: <https://luma.com/discover> — `[WebFetch, 2026-09-19]`
- Eventregistrering, process: <https://help.luma.com/p/helpart-ULf0wUFr7qsv6r8/event-registration-process> — `[WebFetch, 2026-09-19; nådd via 301 från help.lu.ma]`
- Väntelista: <https://help.luma.com/p/waitlist> — `[WebFetch, 2026-09-19]`
- Påminnelser: <https://help.luma.com/p/update-to-reminders-on-luma> — `[WebFetch, 2026-09-19]`
- Blasts: <https://help.luma.com/p/sending-or-scheduling-event-blasts> — `[WebFetch, 2026-09-19]`
- Teman/anpassning: <https://help.luma.com/p/event-themes-and-customization> — `[WebFetch, 2026-09-19]`
- Mobile wallet passes (omnämnd via sökresultat): <https://help.luma.com/p/mobile-wallet-passes> — `[WebSearch-sammandrag, 2026-09-19, ej direkt WebFetch]`
- Guest list-hantering: <https://help.luma.com/p/managing-your-guest-list> — `[WebFetch, 2026-09-19 — gav inte den efterfrågade informationen, se § 4]`
- Exempel på betald eventsida: <https://luma.com/xi49xg4d> (nådd via 301 från `lu.ma/xi49xg4d`) — `[WebFetch, 2026-09-19]`
- Exempel på fullbokad/väntelista-eventsida: <https://luma.com/gv331avt> (nådd via 301 från `lu.ma/gv331avt`) — `[WebFetch, 2026-09-19]`
- Exempel på gratis eventsida: <https://luma.com/szeoiaob> — `[WebFetch, 2026-09-19]`
- Exempel på organisatörskalender: `luma.com/<institut-slug>` — `[WebFetch, 2026-09-19; slug ej återgiven här eftersom exemplet inte tillför något utöver mönstret redan beskrivet]`

### Tredjepart — UI-genomgångar och recensioner (svagare källklass, deklarerat)

- IXD@Pratt, designkritik: <https://ixd.prattsi.org/2026/02/luma-design-critique/> — `[WebFetch, 2026-09-19]`
- screensdesign.com, UI-genomgång: <https://screensdesign.com/showcase/luma-delightful-events> — `[WebFetch, 2026-09-19]`
- nicelydone.club, komponentbibliotek-katalog: <https://nicelydone.club/apps/luma/components> — `[WebFetch, 2026-09-19]`
- party.pro, tips/recension: <https://party.pro/luma/> — `[WebFetch, 2026-09-19]`

### Interna källor (detta repo)

- [`hallplats-modellen-eventsidan-2026-07-26.md`](hallplats-modellen-eventsidan-2026-07-26.md) — Luma-citat om Blasts och påmimnelse-gatning, bekräftat och fördjupat i detta pass
- [`checkin-monsterklassen-2026-07-26.md`](checkin-monsterklassen-2026-07-26.md) — Lumas check-in-lägen, utanför detta pass scope men samma källa
- `docs/decisions/ADR-122-eventlankens-vakt-och-atgardskon.md` — dagens Elfsight-baserade miranon.se, kontext för § 7
- `tasks/threads/T79-custom-miranon-se-webbplats-app-samverkan-marcus.md` — arkitekturkontext (livscykel-modell, väg A)
- `docs/reference/miranon-arkitektur/arkitektur-destillat-och-gap-2026-07-25.md` § Spår 2
- `tasks/sessions/2026-09-19-session-128.md` Del 1 — uppdragets ursprung, Marcus ordagranna citat
- `src/styles/tokens/primitives.css`, `docs/specs/DESIGN-SYSTEM-SPEC.md` — vårt eget 3-lagers token-system, referens för § 5/§ 7

### Metod-belägg (verktygsfel)

- `ps aux`-utdrag, 2026-09-19: PID 7523 (Google Chrome, `~/.cache/chrome-devtools-mcp/chrome-profile`, `SingletonLock`-mål), samt två parallella `chrome-devtools-mcp`-serverprocesser (PID 7222, 8686) — `[MÄTT, lokal shell-inspektion]`
