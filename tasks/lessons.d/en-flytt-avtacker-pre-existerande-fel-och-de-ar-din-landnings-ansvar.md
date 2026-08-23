# En flytt avtäcker pre-existerande fel — och de är din landnings ansvar

**[UNIVERSAL] När en layout- eller konfigurationsflytt fäller något som "inte
rör" din ändring är standardsvaret fel åt båda hållen: varken "det är inte
mitt fel" eller "då backar jag flytten" är rätt. Differentialmät (stasha
flytten, kör om), rotorsaka i KÄLLAN, och landa fixen tillsammans med flytten
— annars lämnar du en defekt som nu är nåbar men fortfarande obokförd.**

Instans (S111, 2026-08-23, `fe2e2bb1`): den delade `SidRam`-primitiven flyttade
sidans innehåll 40 px. Eventväljarens popover började då flippa **över**
triggern vid 1280×720 — mätt: popover `y=337`, `h=304`, mot trigger `y=359`.
React Arias `Select` öppnar på `pointerdown` och väljer det som ligger under
pekaren vid `pointerup`, så ett vanligt klick valde **första alternativet**
utan att användaren rörde musen. Samma väljare sitter på dokumentsidan och
eventsidan.

**Felet fanns före flytten.** `ListBox`ens `max-h-80` (320 px) fick redan
tidigare inte plats under triggern vid låg fönsterhöjd; flytten ändrade bara
hur ofta villkoret uppfylldes. Fixen låg därför i väljaren, inte i sidramen:
`shouldFlip={false}` (RAC sätter då `maxHeight` till det utrymme som finns) och
listan som `min-h-0 flex-1 overflow-auto` i en fokuserbar `<section
tabIndex={0}>` (axe `scrollable-region-focusable`, WCAG 2.1.1 — listboxen bär
virtuell fokus och kan inte själv ta `tabindex`). Mätt efter: popover `y=425`,
under triggern; `pointerup` träffar inget alternativ. Acceptance 61/61,
promoveringsgrindar 168/168.

## Varför båda de intuitiva svaren är fel

**"Inte mitt fel"** stämmer om orsak, men inte om ansvar. En defekt som var
onåbar och nu är nåbar är en NY defekt för användaren, oavsett hur gammal
koden är. Den landar med din PR om du inte stoppar den.

**"Backa flytten"** gör felet onåbart igen utan att laga det, och tar samtidigt
bort det enda som gjorde det synligt. Nästa gång någon rör samma yta återupptäcks
det från noll — och då kanske i produktion i stället för i en testsvit.

## Formen som fungerar

1. **Differentialmät först.** Stasha flytten och kör samma test. Faller det
   fortfarande är felet pre-existerande; faller det inte har din ändring
   infört det. Det är två helt olika utredningar och skillnaden kostar en
   `git stash`.
2. **Rotorsaka i den komponent som äger beteendet**, inte i den som råkade
   avslöja det. Här ägde väljaren sin egen placeringslogik; sidramen ägde bara
   40 px.
3. **Landa fixen med flytten.** En separat "vi tar det sen"-post är samma
   klass som en obevakad defekt: den syns bara så länge någon minns
   sammanhanget.

## Den generella formen

**En ändring som ändrar förutsättningarna är en upptäcktsoperation, inte bara
en ändring.** Samma mönster gäller en versionsbump som väcker en latent
inkompatibilitet, en flagga som aktiverar en dittills död kodgren, och en
prestandaförbättring som gör en race nåbar. Räkna med att scopet växer när en
förutsättning byts — och att tillväxten är information, inte ett hinder.

Besläktat: `L292` (en precedens-ändring aktiverar latent DÖD konfiguration —
inventera vad som VINNER efteråt) — där aktiverades regler av en
kaskad-ändring, här av en geometri-ändring. Samma rot.
