# ADR-121: Notistrappan — form per klass i notis- och felmeddelande-familjen

- **Status:** Accepted (Marcus GO 2026-08-21, *"Då kör vi på detta!"*, efter en
  genomgång där han uttryckligen bad om Code:s eget ställningstagande på tre
  öppna punkter)
- **Datum:** 2026-08-21
- **Fas:** Fas 6 (go-live-förberedelse — Lotta släpps in i appen inom kort)
- **Rör:** `src/components/AppShell/AppUpdateBanner.tsx` ·
  `src/components/AppShell/OfflineIndicator.tsx` ·
  `src/components/primitives/MessageBox.tsx` ·
  `src/components/ErrorBoundary/{SectionError,AppError}.tsx` ·
  `docs/specs/DESIGN-SYSTEM-SPEC.md` § 21
- **Relation till tidigare beslut:** supersederar INGET.
  [`ADR-047`](ADR-047-pwa-arkitektur-fas-5.md) § Amendering 2026-08-13 (1)
  och (2) står **helt orörda** — `autoUpdate` + `onNeedReload` + timvis
  `registration.update()`, omladdningsbeslutet hos användaren, och
  roll-mappningen `alert`/`status`. Det ADR:n aldrig beslutade var **formen**;
  ordet "banner" förekommer där enbart som filnamn och syftande substantiv.
  [`ADR-078`](ADR-078-instant-regeln.md) beslut 4 komponerar oförändrat
  ovanpå. Formen speglar [`ADR-113`](ADR-113-laddtrappan-yttrappa-for-laddindikatorer.md)
  (trappa i en ADR + yttrappa i spec-paragraf) — samma problemklass, samma
  redan kvitterade lösning.

## Kontext

Marcus dom över uppdateringsbannern, verbatim: *"Det ser ju skitfult ut,
fruktansvärt. trycker ner innehållet, en långtextsträng och en centrerad
knapp... Detta kan vi ju inte acceptera som 'Proffsigt'."* Och därefter, om
hela familjen: *"Vi har samma problem med alla felmeddelanden ... det är så
rigoröst fula."*

Två pass ligger under detta beslut, och **inget av dem är självbärande utan
det andra**:

- **Vad VI har** —
  [`s107-felmeddelande-inventering`](../../tasks/sessions/bilagor/s107-felmeddelande-inventering/README.md):
  fem ytor, **fyra separata designspråk**, tre knappformer, tre breddregimer.
  Mätt med `getComputedStyle`, inte uppskattat.
- **Vad BRANSCHEN gör** —
  [`uppdateringsnotisens-form-och-notisfamiljen-2026-08-20.md`](../research/uppdateringsnotisens-form-och-notisfamiljen-2026-08-20.md):
  notis-taxonomin, copy-domarna, rekommendation plus två fullt utvecklade
  alternativ. Märkt `draft`, uttryckligen *"rekommendation, inte beslut"*.

### Layoutskadan, mätt två gånger av två olika pass

| Bredd | Research (inloggningsvyn) | S109 (autentiserat, `/personer` + `/hem`) |
|---|---|---|
| 1440 px | 0,0335 | **0,0142** / 49 px |
| 1280 px | 0,0376 | **0,0179** / 49 px |
| 390 px | 0,1469 | **0,1469** / 124 px |

Samtliga mätningar: `hadRecentInput: false`, alltså fullt räknade som
oväntade. Andra mätningen ligger i
[`s109-cls-matning`](../../tasks/sessions/bilagor/s109-cls-matning/README.md)
och **falsifierade halva research-passets gissning**: talen är identiska på
mobil men ungefär hälften på desktop, inte *"samma härad eller högre"*.

Vid 390 px spränger **en enda visning** hela
`docs/specs/PERFORMANCE-BUDGET.md`:s mål (`<0.1`).

### Tre fynd som ändrade arbetets form

1. **`DESIGN-SYSTEM-SPEC.md` hade noll träffar** på banner, notis, toast eller
   `MessageBox`. Hela familjen saknade styrande yta. Research-passets dom:
   *det* är den verkliga luckan, inte antalet ytor.
2. **Ytorna är indelade efter var i koden felet uppstod** (AppShell, primitiv,
   ErrorBoundary) — en implementationsaxel. Varje undersökt designsystem
   delar i stället på två andra axlar: *orsakade användaren detta?* och
   *kräver det handling nu?*
3. **`SectionError`:s *"Försök igen"* kan strukturellt aldrig lyckas** vid
   chunk-fel — den kör om samma import mot samma saknade fil.

## Beslut

### 1. De två lägena i `AppUpdateBanner` delas — de hör inte till samma klass

*"Ny version finns"* och *"en del av sidan kunde inte laddas"* har olika
brådska och olika klass. Att de idag bor i samma komponent är en artefakt av
att de delar mekanism, inte ett designval.

### 2. *"Ny version finns"* blir en överlagrad, passiv notis

Ingen layoutförskjutning (mätt `0,0000` för samma budskap överlagrat). Fast
bredd, aldrig full bredd. Ingen timer — WCAG 2.2.1 och Carbon är samstämmiga
om att en notis vars knapp är enda vägen till åtgärden inte får auto-döljas.
Alltid monterad `role="status"` `aria-live="polite"` med enbart innehållet som
växlar (sonner-mönstret, MDN:s krav på live-regioner). Fokus flyttas aldrig.

### 3. *"Kunde inte laddas"* stannar som banner i flödet — men flyttas och kortas

Detta läge blockerar redan Lotta; den får förskjuta layout. Den flyttas **under
app-huvudet** i innehållets bredd (Carbon, Material och GOV.UK föreskriver
samma placering) i stället för överst i vyporten, och kortas. `role="alert"`
behålls oförändrat.

**Varför det dyrare läget är det som behålls i flödet — frekvensargumentet.**
Chunk-läget mäter **högre** än info-läget (`+68 %` vid 1280 px, `+17 %` vid
390 px, där det tar 145 px = **17 % av vyporthöjden**). Det ser bakvänt ut
tills frekvensen räknas in: info-läget fyrar vid **varje deploy**, chunk-läget
bara när en session överlever en deploy **och** användaren navigerar. Beslutet
tar alltså bort den **vanliga** kostnaden och behåller den **sällsynta**. Den
motiveringen finns inte i research-passet — den kommer ur S109:s egen mätning.

### 4. Notis-familjen får en styrande yta

Taxonomin (research-passet § 7.2) skrivs in i `DESIGN-SYSTEM-SPEC.md` § 21 som
en **notistrappa**, i exakt samma form som `ADR-113` gav laddindikatorerna.
Det är repots egen etablerade lösning på samma problemklass, redan kvitterad
en gång.

### 5. Fel blir aldrig toast; bekräftelser får bli det

NN/g, verbatim: *"a toast ... while appropriate for passive notifications,
**would be a bad way to implement an error message**"*. Regeln gäller hela
familjen.

### 6. Den visuella formen beslutas INTE här — en variant, itererad

Arkitekturvalet ovan är avgjort av evidens; ett divergens-pass på det vore
teater. **Utseendet** på den överlagrade notisen är däremot Marcus bord —
klagomålet var visuellt, och hans öga har slagit mätningen förr
(`TASK-282`, ikoncentreringen, där det gick emot sex mätmetoder). Formen tas
därför som **konvergens** (`ADR-103`): EN byggd variant, itererad i
dev-servern tills han är nöjd, inte tre halvfärdiga.

### 7. Copy-omskrivningen följer formvalet, den föregår det inte

Långtextsträngen är mätbart halva problemet (118 tecken, bryts till tre rader
under 1024 px). Men fyra av sex granskade strängar faller mot GOV.UK och NN/g,
och rätt hemvist för databesked-meningen beror på beslut 8 nedan. Skrivs copyn
först skrivs den två gånger.

## Öppet, och medvetet inte beslutat här

### 8. Var databesked-varningen tar vägen

Research-passet föreslår att varningen (*"Har du skrivit något som inte är
sparat, kopiera det först"*) flyttas till en **bekräftelsedialog** som visas
när "Ladda om" trycks **medan ett formulär har osparade ändringar**. Motivet är
riktigt: NN/g *"Preserve the user's input"* och GOV.UK *"Do not clear any form
fields"* lägger bevarandet på systemet, inte på användaren.

**Men den formen kräver att appen VET vilka formulär som har osparade
ändringar — och det är verklig ny mekanik.** Det är exakt den invändning som
vägde tyngst mot research-passets `Alternativ 2` (*"visa ingenting, ladda om
vid nästa säkra brytpunkt"*), som förkastades bland annat för att *"avgöra
vilken navigering som är 'säker' kräver att vi vet var formulär har osparade
ändringar, vilket är verklig ny mekanik"*.

**Samma mekanik kan inte vara diskvalificerande i ett alternativ och gratis i
ett annat.** Invändningen fördes in i ADR:n i stället för att glida förbi:
detta beslut fastslår att varningen ska **ut ur notisen**, men inte var den
landar. Vägarna — dialog med osparad-detektion · en kortare varning kvar i
notisen · att bära den i chunk-bannern enbart — vägs vid skivningen, med
mekanik-kostnaden synlig.

### Övrigt öppet

- **Om en hörn-notis faktiskt SES av Lotta** är obelagt. GOV.UK varnar för att
  banners missas; NN/g varnar för motsatsen om hörn-notiser. En kort
  observation medan hon arbetar avgör frågan bättre än någon källa.
- **`SectionError`:s *"Försök igen"*-löfte** är mätt trasigt vid chunk-fel men
  åtgärdas inte av detta beslut. Skarven mot
  [`T151`](../../tasks/threads/T151-sentry-kedjan-ar-byggd-men-inte-inkopplad.md)
  § LUCKA 3 hör dit.
- **`AppError`** är medvetet ostylad för att överleva ett dött stylesheet.
  Följden — att den enda ytan där något verkligen gått fel är den enda som
  inte ser ut som appen — är känd och ej löst.

## Alternativ som förkastades

**Alternativ 1 — behåll banner-formen, flytta och strama den.** Carbon och
Material sanktionerar uttryckligen formen för system-nivå-budskap, och det är
en betydligt mindre ändring. **Förkastat:** den löser inte det Marcus faktiskt
klagade på. Layoutförskjutningen finns kvar vid varje bredd, och `ADR-078`
beslut 4 bär hans egen regel *"hopp i layouten är absolut förbjudet i denna
app"*. Den enda uppmätta produktionen som gör precis detta är Mattermost — som
också är den enda utan stängknapp och utan a11y-roll.

**Alternativ 2 — visa ingenting, ladda om vid nästa säkra brytpunkt.**
Sentrys och Grafanas väg; noll förskjutning, noll copy, noll avbrott, och
Gunilla-principen talar starkt för den (Lotta behöver inte veta vad en version
är). **Förkastat:** den kräver att `ADR-047`:s S105-beslut rivs öppet, och det
beslutet har ett gott skäl — osparad inmatning. Den kräver dessutom
osparad-detektions-mekaniken (se punkt 8) och lämnar kvar chunk-fel-fönstret
för en användare som står stilla länge på samma vy.

## Konsekvenser

- **Positivt:** den vanliga notisen kostar `0,0000` i CLS i stället för
  `0,1469` på mobil. Familjen får sin första styrande yta. Två budskap med
  olika brådska slutar dela form.
- **Kostnad:** en ny överlagrad notis-yta ska byggas och a11y-bevisas, och
  `AppUpdateBanner` delas i två. Copy-arbetet över fem ytor kvarstår.
- **Risk:** hörn-notisen kan missas av Lotta. Det är obelagt åt båda håll och
  bör observeras, inte antas.
