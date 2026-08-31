# Designfynd — S113-slutvandringen 2026-08-31 (orkestrerarens designvandring)

Marcus dom under vandringen (verbatim klass): grundformen ok, men ytorna ser ut
som "utkast/kladd" — saknar känsla. Denna lista är den systematiska
inventeringen bakom domen, mätt genom sida-vid-sida-jämförelse mot appens
etablerade ytor i 1440×900. Skärmdumparna i denna katalog är beviset.

## Det etablerade formspråket (facit för jämförelsen)

- **Hem:** cream-kort med overline-etikett (NÄSTA EVENT), ikon-metadata,
  guld-progressbar · bevakningsrader i ljusgrå rundade rader med chevron ·
  EN mörk fullbreddsknapp som primär CTA per sektion ("Bekräfta alla") ·
  Genvägar = grå container med ikonrader + chevron (navigationsformen).
- **Mer-listor** (anmalningar): EN sammanhållen rundad container, avatar-chip
  per rad, hårlinjer mellan rader, högerställd tidsstämpel + chevron.
- **Detaljvyer** (anmälans etablerade sektioner): term/definition-rader i grå
  rundade containrar, högerställda värden, hårlinjer, EN färgad
  primärknapp med ikon ("Skicka bekräftelse", grön).
- **Åtgärds-sidan:** numrerade kompakta åtgärdsrader med räknare + chevron,
  chips för mottagare.

## Avvikelserna, per yta

### 1. Hem-kortet Betalningar (`design-hem-betalningskort.png` + kontext)
- a) Sektionen är NAKEN — ingen kortyta/container medan grannarna (Nästa
  event, bevakningar, Genvägar) bär sina; ser ohemmastadd ut.
- b) TVÅ mörka fullbreddsknappar staplade i identisk vikt — huset använder EN
  primär CTA per sektion. "Registrera betalning" är dessutom NAVIGATION (länk
  till inkorgen) i knappkostym; Genvägar-radformen är husets navigationsform.
- c) Räknarraden "5 öppna · 5 förfallna · 0 kvitton att skicka" är platt grå
  text — nyckeltal utan hierarki (jämför Nästa events metadata + progressbar).
- d) Ingen overline-etikett/vikthierarki i rubriken (grannkortet har
  NÄSTA EVENT-overline + display-rubrik).

### 2. Betalningsinkorgen /mer/betalningar (`design-inkorg-1440.png` vs `design-anmalningar-1440.png`)
- a) Radform: separata grå kort per person med gap — Mer-listspråket är EN
  container med hårlinjeavdelade rader.
- b) Inga avatar-chips (initialer) — alla etablerade personlistor leder med dem.
- c) "Importera bankrapport" är en ensam strö-knapp vänsterställd mellan
  segmentväljaren och listan — hör hemma i sidhuvudets handlingsyta.
- d) Kortens inre komposition är tung: tre textrader + badges + outline-knapp
  utan grid-alignment.

### 3. Anmälans detaljvy, Betalningar-sektionen (`design-anmalan-detalj-1440.png`)
- a) Sektionen börjar korrekt i dt/dd-språket (avgift/slutbetalning/deadline)
  men degraderar därefter.
- b) "Saknas 500 kr." — NYCKELTALET — är en naken vänsterställd textrad utan
  vikt eller radstruktur.
- c) Knappkaos: "Registrera betalning" (liten outline, vänster) +
  "Registrera återbetalning" (fullbredd outline) — två olika bredder/former
  staplade asymmetriskt.
- d) INBETALNINGAR-raderna: tre flytande knappar (Visa/Skicka igen/Makulera)
  inline i löptexten, oalignerade mellan rader; radstrukturen (hårlinjer,
  konsekvent indrag) saknas.

### 4. Åtgärds-panelen "Pricka av och notera" (`design-atgarder-panel-1440.png`)
- a) Åtta personer × två ALLTID synliga tomma noteringsfält = 16 tomma inputs
  i en vägg — noteringen ska vara on-demand (affordance), inte permanent.
- b) Samma knappbredds-kaos som detaljvyn (liten outline + fullbredd blandat).
- c) Personblocken är vita kort i grå container — tyngre än Åtgärd-sektionens
  etablerade kompakta radform; hierarkin mellan person/fält/knappar är platt.

### 5. Formulären (registrera/återbetalning/makulera) — strukturellt goda
- Belopps-knappar, live-status, feltexter och fokusföring håller. Putsbehov:
  visuell vikt på status-raden och konsekvent knappordning
  (primär höger/vänster enligt husets konvention — mät den först).

### 6. Swish-importen (bekräftelselistan)
- Strukturen och texterna är starka (läst som X, Säker/Omatchad, redan
  registrerade-gruppen). Putsbehov: samma radforms-klass som inkorgen (2a/2d)
  + "1 rader"-kongruensen.

## Språkfynd (Gunilla-klass, till fix)
- "1 kvitto skickade" → "1 kvitto skickat" (kongruens; N>1 = "skickade").
- "1 rader · 1 säkra · 0 osäkra · 0 omatchade" → kongruens vid N=1.
- Ramrader (posttyp 01/03) räknas in i "N rader i filen var inte
  inbetalningar" — sant men förvirrande; överväg att räkna enbart
  transaktionsrader.
- Hem säger "kvitton att skicka", inkorgen "kvitton i kö" — redan bokförd
  Marcus-fråga (346.7 fråga 4); designpasset inför inget nytt ordval.

## Vad som INTE ska röras
- Flödeslogik, härledningar, EF-vägar — funktionsvandringen verifierade dem.
- Facit-ytornas INNEHÅLL (kryss-semantik, saknas-läsning) — endast komposition.
- AMENDERING-sidofilerna uppdateras när formen ändras (facit-disciplinen).
