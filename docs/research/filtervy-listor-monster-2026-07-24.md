# Filtervy för listvyer — mönster-research (Code, 2026-07-24)

> **Proveniens:** avgränsat research-pass (bakgrundsagent) 2026-07-24, på
> väg in i TASK-17.7. Alla bärande påståenden är verifierade mot angiven
> käll-URL samma dag. Tunn precedent-rymd deklareras öppet där den finns —
> räkningen är inte fejkad.

## Frågan

Vilket interaktionsmönster använder FK Designsystemet och branschledarna
(GOV.UK Design System, MOJ Design System, NN/g m.fl.) för filtrering av
listvyer — disclosure-expanderad filterbar kontra sidopanel kontra dialog
— och vad är etablerad praxis för utskrift (print) av en filtrerad lista?

## Beslutet frågan informerar

**TASK-17.7:** event-listan får en filtrerings-ingång i period-toggel-raden
(Marcus-skiss: filterikon eller expander-pil) som expanderar baren nedåt
till en filtervy, plus en "Skriv ut"-knapp. Konsumeras i Session 83:s
konvergens-prototyp-pass (HITL i browsern). Kontext: React + React Aria
Components, FK-inspirerat token-system, mobil-först admin-app för två
användare; listan är månadsgrupperad med period-toggel (Kommande|Tidigare)
och vyval lista/kalender.

---

## Destillat per källa

### 1. FK Designsystemet (förstapartskälla)

**Inget dedikerat filter-mönster finns.** Komponentlistan
(`designsystem.forsakringskassan.se/latest/components/`) saknar
filter-komponent och filtrerings-mönster — tunn precedent-rymd på
mönster-nivå, deklarerad öppet. Byggstenarna finns däremot:

- **Chip** — explicit filter-ändamål: *"Chip är lämpliga att använda för
  att till exempel filtrera ett sökresultat eller göra ett snabbt val."*
  Implementeras som radioknappar/kryssrutor inuti `FFieldset` med
  chip-attribut — dvs. chips är semantiskt formulärkontroller, inte
  taggar. Vakt: *"Använd inte chip istället för en radioknappsgrupp, en
  grupp med kryssrutor eller en dropplista i ett formulär."*
  (Produktionsklar, v6.52.2.)
- **Expanderbar panel** (FExpandablePanel, + FExpand/FExpandableParagraph)
  — för att *"gruppera information och formulärskomponenter"* och
  *"minska mängden information som visas vid första anblick"*. Rubrik som
  toggle, `expanded`-state, heading-nivå konfigurerbar. Ingen
  filter-specifik vägledning, men användningsfallet (dölj
  formulärkontroller tills de behövs) är exakt filtervy-fallet.
- Kryssruta (FCheckboxField) och Datumväljare (FDatepickerField) finns
  som fältkomponenter för filterdimensionerna.

**FK-slutsats:** FK:s eget språk för filtrering = chips (snabbval) +
expanderbar yta (dölj kontroller initialt). Ingen sidopanel, ingen dialog
finns som FK-mönster.

### 2. MOJ Design System (närmast kompletta förstaparts-mönstret)

MOJ har både en **Filter-komponent** och ett **"Filter a
list"-mönster** — det mest genomarbetade offentliga
förstaparts-mönstret i denna rymd:

- **Placering desktop:** vänster sidopanel i tvåkolumnslayout
  (`moj-filter-layout`); resultaten till höger.
- **Mobil:** panelen är **dold som default** (`startHidden: true`) och
  öppnas via toggle-knapp "Show filter"/"Hide filter"
  (sekundär-knapp, JS-modulen `FilterToggleButton`); brytpunkt
  `min-width: 48.0625em` (~769 px). Dvs. på mobil är MOJ-mönstret i
  praktiken en disclosure-expander — sidopanelen är bara
  desktop-arrangemanget av samma innehåll.
- **Apply-semantik:** batch — formulär + "Apply filters"-knapp;
  *"When the user clicks 'Apply filters' the page refreshes to show the
  items that match the filters."* (Server-renderat arv: sid-refresh.)
- **Valda filter:** sektionen "Selected filters" överst med borttagbara
  taggar — *"The selected filters are displayed at the top to let users
  see what they've selected and remove them easily"* — plus
  "Clear filters"-länk för allt på en gång.
- **Filtertyper:** *"filtren kan vara vilken formkontroll som helst,
  inklusive datuminmatningar, kryssrutor, fritextinmatning och
  radioknappar."*
- **Research-fynd:** *"Users don't always see they can filter"* —
  filtrets synlighet/affordans är den kända svagheten.
- **Status-varning:** mönstret är märkt "To be reviewed" (2021) — MOJ
  flaggar själva att det inte utvecklats på senare tid.

### 3. GOV.UK Design System

**Inget publicerat filter-mönster** — "Filter a list" ligger i
community-backloggen (issue #133) med tjänste-exempel GOV.UK search
(finders), GOV.UK Pay Admin och GOV.UK Notify Admin. Tunn
precedent-rymd på publicerad mönster-nivå; praxisen lever i tjänsterna
och i MOJ-mönstret ovan.

GOV.UK:s bidrag är i stället **print-praxisen** (se §5): govuk-frontend
levererar inbyggda print-styles och en dedikerad override-klass för att
dölja element vid utskrift.

### 4. NN/g — när disclosure-bar, sidopanel eller dialog; apply-semantik

- **Batch vs interaktiv** (*"User Intent Affects Filter Design"*,
  nngroup.com/articles/applying-filters/): interaktiv filtrering
  (resultat uppdateras per val) gynnar utforskande användare och
  *"fungerar acceptabelt om resultaten visas på under en sekund"*;
  batch (Apply-knapp) gynnar användare med flera kriterier klara i
  huvudet och är säkra valet vid långsamma uppdateringar. Riktlinje:
  *"Let users tell you when they're done selecting filters."*
  **Mobilrekommendation: batch + Apply** — motivet är uttryckligen
  långsamma **sidladdningar** ("page loads are often slow on the go"),
  inte mobilformatet i sig.
- **Mobil-konventionen** (*"Mobile Faceted Search with a Tray"*,
  nngroup.com/articles/mobile-faceted-search/): filterkontroller på en
  **separat skärm är antimönstret** — det bryter kopplingen mellan
  kontroller och resultat. Rekommenderat: en **tray/overlay ovanpå
  resultaten** så att resultaten förblir delvis synliga medan filtren är
  öppna (Amazon/eBay-precedent); accordion-grupper i trayen; Apply-knapp
  i trayen. Notera: *"the tray of accordions … is unnecessary for larger
  devices"* — overlay/dialog är en mobil-kompensation, inte ett mål.
- **Filter före facetter** (*"Filters vs. Facets"*,
  nngroup.com/articles/filters-vs-facets/): facetterad navigation är
  *"significantly more expensive to create and maintain"*; enkla filter
  är *"easier to understand and faster to use"* — bygg facett-maskineri
  endast om användarna bevisligen behöver det.

### 5. Utskrifts-praxis (print) för filtrerade listor

- **GOV.UK (förstapartskälla, starkast precedent):** govuk-frontend har
  print-styles inbyggda i komponenterna — text går till svart,
  länkar skriver ut sin href efter länktexten via `::after`
  (*"Home (/homepage)"*) så att pappret bär kontext som annars går
  förlorad. För att dölja element vid utskrift finns den dedikerade
  override-klassen **`govuk-!-display-none-print`** (PR
  alphagov/govuk-frontend#1586); GOV.UK:s publiceringsplattform
  refaktorerade t.o.m. bort komponenternas egna `display: none`-regler
  till förmån för klassen (alphagov/govuk_publishing_components#1561) —
  dvs. "dölj-vid-print" är en **utility-klass i systemet**, inte ad
  hoc-CSS per komponent. "Print this page"-mönster ligger i backloggen
  (issue #166), inte publicerat.
- **USWDS:** ingen dedikerad print-vägledning hittad på
  designsystem.digital.gov — negativt fynd, deklarerat öppet.
- **Community-konsensus** (CSS-Tricks "Print Stylesheet Approaches:
  Blacklist vs Whitelist", SitePoint "Printer-friendly Pages with CSS"):
  tre återkommande mönster — (1) dölj chrome (navigation, sidopaneler,
  knappar, banners) med `display: none`, (2) förenkla färger (vit
  bakgrund, svart text), (3) expandera länkar med href. Blacklist
  (dölj det som inte ska med) räcker för en enkel vy; whitelist för
  komplexa sidor. Print-CSS läses efter screen-CSS.
- **Aktiva filter i utskriftshuvudet:** ingen förstaparts-vägledning
  hittad hos FK/GOV.UK/MOJ/USWDS — **tunn precedent-rymd, öppet
  deklarerad**. Syntes-stöd finns dock: MOJ:s "Selected filters"-taggar
  är sidinnehåll (inte kontroller) och följer naturligt med i
  utskriften, och GOV.UK:s länk-href-princip är samma filosofi —
  pappret ska bära den kontext skärmen bär implicit.

---

## Syntes och REKOMMENDATION för TASK-17.7

Konvergensbilden över källorna: **sidopanel är desktop-arrangemanget för
stora facett-rymder; dialog/fullskärm är antimönstret på mobil; det
mobila normalmönstret är en yta som expanderar nära kontrollen och låter
resultaten förbli synliga.** Marcus-skissen (expander från
period-toggel-raden) ÄR detta mönster.

### Interaktionsform: disclosure-expanderad filterbar — bekräftad

- **Välj expander-baren** (filterikon/pil i period-toggel-raden som
  expanderar nedåt). Den är: (a) MOJ:s mobilbeteende (dold panel +
  toggle-knapp) utan sidopanel-överbyggnaden, (b) NN/g:s tray-princip
  (kontroller nära resultaten, resultaten synliga nedanför) utan
  overlay-kostnaden, (c) FK:s FExpandablePanel-användningsfall
  ("minska mängden information som visas vid första anblick").
- **Välj bort sidopanel:** motiverad endast vid stor facett-rymd och
  desktop-först (MOJ/GOV.UK finders); fel verktyg för en mobil-först
  tvåanvändar-app med få filterdimensioner.
- **Välj bort dialog/fullskärms-overlay:** NN/g visar att separat skärm
  bryter kontroll↔resultat-kopplingen, och att även trayen är
  "unnecessary for larger devices". Dialog blir aktuell först om
  filtervyn växer sig för lång för en expander — inte nu.
- Implementationsspår: React Aria **Disclosure/DisclosurePanel**
  (trigger-knapp med `aria-expanded`, panel med `role="group"/"region"`,
  Enter/Space, controlled via `isExpanded`) är den färdiga primitiven —
  ingen egen ARIA-mekanik behövs.
- **Affordans-läxan från MOJ** (*"Users don't always see they can
  filter"*): filtrerings-ingången behöver text eller tydlig ikon + label,
  och aktivt filter-läge måste synas även när panelen är stängd (t.ex.
  räknar-badge på filterknappen och/eller valda-filter-chips kvar i/under
  baren). Ett dolt aktivt filter är mönstrets kända felläge.

### Filterdimensions-tänk (generiskt)

- **Enkla filter, inte facett-maskineri** (NN/g: facetter är dyra; enkla
  filter snabbare att förstå). Dimensionerna byggs som oberoende
  formkontroller — MOJ: "vilken formkontroll som helst" — inte som ett
  generiskt facetteringssystem.
- **FK-vokabulären per dimensionstyp:** få ömsesidigt uteslutande val →
  chips (radio-läge); flerval → chips (checkbox-läge) eller
  kryssrute-grupp; datumintervall → datumväljare; fritext → sökfält.
  Chips är FK:s uttalade filter-idiom och matchar token-systemet.
- **Valda filter som borttagbara chips + "Rensa filter"** (MOJ
  "Selected filters"-sektionen) — synliga, borttagbara ett-och-ett,
  rensningsbara i klump.

### Apply-semantik: interaktiv (live), inte Apply-knapp

- NN/g:s villkor för interaktiv filtrering — resultat under ~1 sekund —
  är trivialt uppfyllt: datat är redan i klienten och filtreringen är
  lokal. NN/g:s mobil-motiv för batch (långsamma **sidladdningar**)
  föreligger inte; MOJ/GOV.UK:s Apply-knapp är arv från
  server-renderade formulär med sid-refresh.
- Därför: **live-filtrering** — varje val uppdaterar listan omedelbart,
  med resultat-räknare ("N event visas") i/vid panelen och
  `aria-live`-annonsering av räknaren så att uppdateringen är
  förnimbar även utan synfält. Ingen Apply-knapp; panelen stängs med
  samma toggle (eller Esc).
- Fallback-regeln bokförs: skulle en framtida dimension kräva
  server-anrop per val, byt den ytan till batch + Apply (NN/g-regeln är
  hastighetsstyrd, inte stilstyrd).

### Print-form

- **"Skriv ut"-knappen** anropar `window.print()` — utskriften ÄR den
  aktuella, filtrerade, synliga listan (skriv ut det användaren ser;
  ingen parallell "utskriftsvy").
- **`@media print` med blacklist-approach:** dölj app-chrome —
  navigation, period-toggel/vyval-raden, filterpanelen och själva
  Skriv ut-knappen (kontroller är meningslösa på papper). Följ
  GOV.UK-idiomet med en **återanvändbar utility-klass** (motsvarigheten
  till `govuk-!-display-none-print`) i token-/utility-lagret i stället
  för ad hoc `display: none` per komponent — det är repo-ribban
  "varje komponent ska klara print" satt i system.
- Förenkla färger till svart-på-vitt via print-styles (GOV.UK-praxis);
  månadsgruppering och radinnehåll behålls som dokumentstruktur
  (rubriker + lista), sidbrytningsvänligt
  (`break-inside: avoid` per event-rad/grupp).
- **Utskriftshuvud med kontext** — syntes, öppet deklarerad (ingen
  förstaparts-precedent funnen): en print-synlig rad med period
  (Kommande/Tidigare), aktiva filter och utskriftsdatum, så pappret är
  självbeskrivande. Naturlig form: valda-filter-chipsen är innehåll och
  följer med i utskriften (MOJ-analogt); datum + period läggs till i en
  print-only-rad. Samma filosofi som GOV.UK:s länk-href-i-print:
  papper ska bära kontext som skärmen bär implicit.

### Öppet deklarerade tunna precedent-rymder

1. FK saknar filter-mönster (endast byggstenar: chip + expanderbar yta).
2. GOV.UK saknar publicerat filter-mönster (backlog #133); MOJ-mönstret
   är "To be reviewed" sedan 2021.
3. USWDS saknar funnen print-vägledning.
4. "Aktiva filter i utskriftshuvud" saknar dokumenterad
   förstaparts-precedent — rekommendationen är syntes av MOJ:s
   Selected-filters-som-innehåll + GOV.UK:s kontext-i-print-princip.

---

## Källförteckning

### Förstapartskällor

- FK Designsystem, Komponenter:
  <https://designsystem.forsakringskassan.se/latest/components/>
- FK Designsystem, Chip:
  <https://designsystem.forsakringskassan.se/latest/components/chip.html>
- FK Designsystem, Expanderbar panel:
  <https://designsystem.forsakringskassan.se/latest/components/expandable/fexpandablepanel.html>
- MOJ Design System, Filter (komponent):
  <https://design-patterns.service.justice.gov.uk/components/filter/>
- MOJ Design System, Filter a list (mönster):
  <https://design-patterns.service.justice.gov.uk/patterns/filter-a-list/>
- GOV.UK Design System community backlog, Filter a list (issue #133):
  <https://github.com/alphagov/govuk-design-system-backlog/issues/133>
- GOV.UK Design System community backlog, Print this page (issue #166):
  <https://github.com/alphagov/govuk-design-system-backlog/issues/166>
- govuk-frontend, display-none-print-override (PR #1586):
  <https://github.com/alphagov/govuk-frontend/pull/1586>
- govuk_publishing_components, print-refaktor till override-klass
  (PR #1561):
  <https://github.com/alphagov/govuk_publishing_components/pull/1561>
- React Aria Components, Disclosure:
  <https://react-aria.adobe.com/Disclosure>
- USWDS (negativt fynd — ingen print-vägledning):
  <https://designsystem.digital.gov/>

### Auktoritativ tredjepart (research-organ)

- NN/g, "User Intent Affects Filter Design" (batch vs interaktiv):
  <https://www.nngroup.com/articles/applying-filters/>
- NN/g, "Mobile Faceted Search with a Tray":
  <https://www.nngroup.com/articles/mobile-faceted-search/>
- NN/g, "Filters vs. Facets: Definitions":
  <https://www.nngroup.com/articles/filters-vs-facets/>

### Community-praxis (print-CSS)

- CSS-Tricks, "Print Stylesheet Approaches: Blacklist vs Whitelist":
  <https://css-tricks.com/print-stylesheet-approaches-blacklist-vs-whitelist/>
- SitePoint, "How to Create Printer-friendly Pages with CSS":
  <https://www.sitepoint.com/css-printer-friendly-pages/>
