---
owner: marcus803
updated: 2026-08-21
review_by: 2026-11-21
status: draft
---

# Mall-ifyllnadsvyer — branschmönster för fält/värde-översikt före generering (2026-08-21)

> **Proveniens:** avgränsat research-pass 2026-08-21, kört av en research-agent
> (modell: Claude Fable 5, `claude-fable-5`) åt S108 (bilagespåret). Ingen
> produktionskod ändrad, ingen commit gjord, inga git-kommandon körda.
>
> **Frågan (en enda):** hur designar branschledande produkter vyn där en
> användare FYLLER I EN DOKUMENTMALL INFÖR GENERERING — en översikt av mallens
> fält/block med aktuellt värde, var värdet kommer ifrån (standard vs eget),
> vad som saknas, och hur man ändrar ett fält — på MOBIL bredd (~390 px)?
>
> **Metod:** endast förstapartskällor (leverantörers egna designsystem,
> hjälpcenter och källkod). Sidor som är klientrenderade (Apple HIG, Material
> 3, Atlassian, DocuSign) lästes via deras JSON-dataändpunkt respektive en
> riktig webbläsare (Playwright), så citaten är tagna ur faktisk sidtext,
> inte ur meta-beskrivningar. Polaris lästes ur Shopifys eget
> `Shopify/polaris`-repo (arkiverat 2026; `polaris.shopify.com` omdirigerar nu
> till `shopify.dev`) — båda ytorna anges. Varje påstående bär sin URL. Där
> belägg saknas står det uttryckligen.
>
> **Vad passet INTE gjorde:** inga skärmbilder av PandaDoc/DocuSign/Stripe
> renderades (kräver inloggade konton); deras mönster är belagda ur
> hjälpcentrets text, inte ur egen observation av gränssnittet.

---

## 0. Kortversion

Det närmaste dokumenterade branschmönstret är GOV.UK:s **Summary list** i
**Check your answers**-mönstret: en `<dl>` med nyckel · värde · "Change"-länk
per rad, som på smal skärm (under 641 px) **staplas** till tre block per rad,
och där ett **saknat** värde visas som en **länk i värdekolumnen** ("Enter
…") i stället för en Change-åtgärd. Ingen av de sju designsystemen stöder
**chips för status på en rad**: Material 3 definierar chips som interaktiva
handlingar/filter och säger uttryckligen att en ensam chip inte ska visas;
Polaris och Atlassian reserverar Badge/Lozenge för status men kräver
sparsamhet och skiljer status från "beskrivande metadata" (Tag). För
redigering av ett fält i taget på mobil pekar Material 3 (listor →
detaljsida; fullskärmsdialog för formulärfält i compact) och Apple HIG
(disclosure indicator → nästa nivå; modalitet endast vid tydlig nytta) åt
samma håll: **öppna en egen yta per fält** snarare än att editera inline i
listan; Atlassians Inline edit är ett dokumenterat alternativ men är
explicit inte avsett "inside of a form".

---

## 1. Källgenomgång per produkt/designsystem

### 1.1 GOV.UK Design System — Summary list, Check answers, Task list, Tag

**Summary list** (<https://design-system.service.gov.uk/components/summary-list/>)

- Syfte, verbatim: *"Use a summary list to show information as a list of key
  facts."* Sidan anger att den passar för metadata och för att summera
  användarens svar i slutet av ett formulär (check answers).
- Ska INTE användas för tabelldata eller enkla listor; komponenten bygger på
  `<dl>`. Den ska inte användas för task lists — använd `<table>`, `<ul>`
  eller `<ol>` då.
- Radstruktur: **Key** (etikett), **Value** (värdet), **Actions** (valfria
  länkar, typiskt "Change" med visuellt dold kontext-text, t.ex. "Change
  name"). Klasser: `govuk-summary-list__key`, `__value`, `__actions`.
- **Saknad information:** när användaren återvänder till en ofullständig resa
  eller tjänsten fått nya frågor, visa en **länk i värdekolumnen** (t.ex.
  "Enter contact information") i stället för en "change"-åtgärd, så att
  användaren kan fylla luckan. (Sidans avsnitt om att visa saknad
  information; formuleringen ovan är sidans, återgiven i passets
  sammanfattning.)
- Tillgänglighet, verbatim: *"Actions rely on context from the surrounding
  content so may require additional accessible text."* → parametern
  `visuallyHiddenText`.
- Rader utan åtgärd blandade med rader med åtgärd: modifieraren
  `govuk-summary-list__row--no-actions` för konsekvent bottenkant.
- **Summary cards**: flera summary lists i `govuk-summary-card` med titel och
  kort-nivå-åtgärder — för flera relaterade listor (t.ex. flera personer).
- Kantlinjer: `govuk-summary-list--no-border` bara när raderna saknar
  åtgärder; verbatim: *"Think carefully before you remove row borders"* —
  de hjälper användare som zoomar/förstorar att hitta i listan.

**Mobil-beteendet är inte prosa på sidan utan finns i komponentens källkod**
(<https://raw.githubusercontent.com/alphagov/govuk-frontend/main/packages/govuk-frontend/src/govuk/components/summary-list/_mixin.scss>,
läst 2026-08-21):

- `.govuk-summary-list` får `display: table` **först från brytpunkten
  `tablet`**; raden `display: table-row` likaså. Under brytpunkten är
  key/value/actions vanliga blockelement: `__key` får `margin-bottom:
  govuk-spacing(1)`, `__value` `margin-bottom: govuk-spacing(3)` *"until
  tablet"*, `__actions` `margin-bottom: govuk-spacing(3)`. Från tablet:
  `__key` 30 % bredd, `__actions` 20 % bredd med `text-align: right`.
- Brytpunkten `tablet` är **641 px**
  (<https://raw.githubusercontent.com/alphagov/govuk-frontend/main/packages/govuk-frontend/src/govuk/settings/_media-queries.scss>:
  `mobile: 320px, tablet: 641px, desktop: 769px`). Vid ~390 px är summary
  list alltså **staplad**: etikett (fet) / värde / åtgärd, vänsterställt,
  med bottenkant per rad.
- Källkodskommentar, verbatim: *"Make sure that any multi-line inline-blocks
  inside of the summary list (e.g. Tag components) don't cause the text
  baseline to shift"* — GOV.UK räknar alltså med att en **Tag kan stå i
  värdecellen** (jfr Task list nedan), men Tag är inte en del av summary
  list-grammatiken i sig.

**Check answers** (<https://design-system.service.gov.uk/patterns/check-answers/>)

- Verbatim: *"Show a single check answers page immediately before the
  confirmation screen for small to medium-sized transactions."* Större
  transaktioner: check answers per sektion.
- Struktur: dela upp i sektioner och *"only show sections that are relevant
  to users."* Två-tredjedels-bredd för korta svar (läsbar radlängd), full
  bredd för långa.
- Verbatim: *"You should provide a 'Change' link next to each section"* och
  *"'Change' links contain hidden text to make them accessible to screen
  reader users."*
- **Valfria frågor utan svar visas som "Not provided"** — så användaren ser
  att frågan hoppades över.
- Efter ändring: *"the 'Continue' button should return them to the check
  answers page. They should not need to go through the rest of the
  transaction again."* Leder ändringen till nya frågor hanteras de före
  återgången.

**Task list** (<https://design-system.service.gov.uk/components/task-list/>;
den gamla `/patterns/task-list-pages/` svarar HTTP 410)

- Statusgrammatik: **"Completed" som vanlig svart text utan bakgrund**,
  medan "Incomplete" m.fl. är färgkodade Tag-element. Rationalen, verbatim:
  *"The 'Completed' task now uses black text with no background colour,
  which will draw more attention to tasks that require action."*
- Hint-text: *"Only use hint text if there is evidence that the user needs
  more information about what the task will include."* / *"Keep hint text
  to a single short sentence, without any full stops."*
- Ingen mobil-specifik prosa på sidan.

**Tag** (<https://design-system.service.gov.uk/components/tag/>)

- Verbatim: *"Use the Tag component when it's possible for something to
  have more than one status and it's useful for the user to know about that
  status."*
- Verbatim: *"Do not make a tag interactive by making it into a link or
  button."* Använd adjektiv, inte verb.
- Minimera antalet: *"Sometimes a single status is enough."* /
  *"start with the smallest number of statuses you think might work, then
  add more if your user research shows there's a need."*
- *"Do not use colour alone to convey information, because it's not
  accessible."*

**Question pages / en sak per sida** (<https://design-system.service.gov.uk/patterns/question-pages/>)

- Verbatim: *"Asking just one question per question page helps users
  understand what you're asking them to do, and focus on the specific
  question and its answer."* Gruppering tillåts när forskning stöder det,
  t.ex. interna tjänster där användare växlar snabbt mellan uppgifter.

### 1.2 Apple Human Interface Guidelines

Läst via HIG:s JSON-data (`developer.apple.com/tutorials/data/design/human-interface-guidelines/<sida>.json`),
samma innehåll som sidorna nedan.

**Lists and tables** (<https://developer.apple.com/design/human-interface-guidelines/lists-and-tables>)

- Verbatim: *"iOS Settings uses a hierarchy of lists to help people choose
  options"*.
- Verbatim: *"Keep item text succinct so row content is comfortable to
  read."* och *"If each item consists of a large amount of text, consider
  alternatives that help you avoid displaying over-large table rows. For
  example, you could list item titles only, letting people choose an item
  to reveal its content in a detail view."*
- Stilar: *"In iOS and iPadOS, for example, the grouped style uses headers,
  footers, and additional space to separate groups of data"*.
- Navigationsaffordans (iOS/iPadOS/visionOS), verbatim: *"If you need to
  let people drill into a list or table row's subviews, use a disclosure
  indicator accessory control."* och *"A disclosure indicator reveals the
  next level in a hierarchy; it doesn't show details about the item."*
  Info-knappen är tvärtom: visar detaljer, navigerar inte.
- **Saknat belägg:** HIG-sidan uttalar INTE explicit grammatiken "etikett
  vänster, värde höger" som en regel — den hänvisar till Settings som
  exempel och till plattformens rad-API:er. Påståendet "Settings-
  grammatiken är HIG-norm" går därför inte att källbelägga som prosa; det
  är belagt som *exempel* (Settings) och som *navigations-affordans*
  (disclosure indicator).

**Labels** (<https://developer.apple.com/design/human-interface-guidelines/labels>)

- Verbatim: *"Use a label to display a small amount of text that people
  don't need to edit. If you need to let people edit a small amount of
  text, use a text field."*
- Systemets fyra etikettfärger och deras användning: Label = *"Primary
  information"*, Secondary = *"A subheading or supplemental text"*,
  **Tertiary = *"Text that describes an unavailable item or behavior"***,
  Quaternary = *"Watermark text"*. (Relevant för hur "saknas"/platshållare
  kan tonas ned typografiskt utan färgkodning.)

**Text fields** (<https://developer.apple.com/design/human-interface-guidelines/text-fields>)

- Verbatim: *"Show a hint in a text field to help communicate its purpose.
  A text field can contain placeholder text — such as 'Email' or 'Password'
  — when there's no other text in the field. Because placeholder text
  disappears when people start typing, it can also be useful to include a
  separate label describing the field to remind people of its purpose."*
- Verbatim: *"Stack multiple text fields vertically when possible, and use
  consistent widths to create a more organized layout."*
- iOS/iPadOS: *"Display a Clear button in the trailing end of a text field
  to help people erase their input."*

**Entering data** (<https://developer.apple.com/design/human-interface-guidelines/entering-data>)

- Verbatim: *"Get information from the system whenever possible."*
- Verbatim: *"You can also prefill fields with reasonable default values,
  which can minimize decision making and speed data entry."*
- Verbatim: *"When possible, offer choices instead of requiring text entry.
  It's usually easier and more efficient to choose from lists of options
  than to type information, even when a keyboard is conveniently
  available."*
- Verbatim: *"When data entry is necessary, make sure people understand
  that they must provide the required data before they can proceed. For
  example, if you include a Next or Continue button after a set of text
  fields, make the button available only after people enter the data you
  require."*

**Modality** (<https://developer.apple.com/design/human-interface-guidelines/modality>)

- Verbatim: *"Present content modally only when there's a clear benefit."*
- Verbatim: *"Aim to keep modal tasks simple, short, and streamlined."*
- Verbatim: *"Make it easy to identify a modal view's task."* (titel som
  namnger uppgiften) och *"Always give people an obvious way to dismiss a
  modal view."*
- Verbatim: *"When necessary, help people avoid data loss by getting
  confirmation before closing a modal view."*

**Settings** (<https://developer.apple.com/design/human-interface-guidelines/settings>)

- Verbatim: *"Aim to provide default settings that give the best experience
  to the largest number of people."*
- Verbatim: *"When possible, prefer letting people modify task-specific
  options without going to your settings area."* — alternativen ska ligga
  *"in the screens they affect, where they're discoverable and
  convenient."*

### 1.3 Material Design 3 — Lists, Chips, Text fields, Dialogs

Läst i renderad webbläsare; råa HTML:en innehåller bara meta-beskrivningen.

**Lists** (<https://m3.material.io/components/lists/guidelines>)

- Anatomi: *"Container and label text are required. All other elements are
  optional"* — supporting text, **trailing text**, trailing icon, trailing
  selection control, leading avatar/icon/media.
- Radhöjder: *"Label text only"*, *"Label text with supporting text on one
  line"*, *"Label text with supporting text that wraps to two lines"* (M3
  talar om en/två/tre rader så).
- **Trailing text**, verbatim: *"Trailing text can provide additional
  meta-information about a list item, such as a price, count, or other
  details."*
- **Trailing icon**, verbatim: *"A trailing icon is often used to
  communicate status or indicate an action, like Show more."*
- Skanning: *"Keep label text brief."* / *"Limit supporting text to one to
  three lines"* / *"Truncate supporting text, depending on screen size"*.
- **Compact (mobil)**, verbatim: *"Lists should extend edge-to-edge in
  compact windows. Selecting a list item should open a page with the
  details."* och *"Reduce the amount of information shown at compact
  breakpoints"*. Medium/expanded: *"a list and the detailed information can
  appear side-by-side."*
- Interaktionsklasser: *"In a single-action list, the entire list item
  performs one action, such as navigating to a new page."* Single-action-
  rader *"Can't have secondary nested actions"*. Multi-action: *"Place
  supplementary actions, like a bookmark or menu, in the trailing
  position."*
- *"Non-interactive lists can organize information in a scannable way.
  They don't perform any actions and can't be selected."*

**Chips** (<https://m3.material.io/components/chips/guidelines>)

- Definition, verbatim: *"Chips help people enter information, make
  selections, filter content, or trigger actions."* Fyra varianter:
  assist (handling), filter, input (användarens egen information),
  suggestion (produktgenererade förslag). **Ingen variant är statisk
  status.**
- Verbatim: *"Chips appear as a group of interactive elements"* och
  *"Don't display a single chip by itself. Chips should appear in a set."*
- Verbatim: *"Chips represent forking paths for a current task, while
  buttons represent linear steps."*
- Filter chips: *"Filter chips should not present only a single option"*.
- Etikett: *"Chip label text should be 20 characters or fewer"*; mål-yta
  *"minimum 48dp target size, regardless of placement or density."*

**Text fields** (<https://m3.material.io/components/text-fields/guidelines>)

- Verbatim: *"Label text tells people what information is requested. Every
  text field should have a label."* och *"Label text should be aligned with
  the input text, and always visible."* Undantag: *"A text field doesn't
  require a label if the field's purpose is indicated by a separate,
  adjacent label."*
- Obligatoriskt: asterisk vid etiketten + förklaring i supporting text
  eller en not i början av formuläret; *"Indicate all required fields"*.
- **Read-only**, verbatim: *"Read-only text fields display pre-filled text
  that people cannot edit."* / *"A read-only text field is styled the same
  as a regular text field and is clearly labeled as read-only."*
- Fel: *"Swap supporting text with error text"* och *"It's strongly
  recommended to show an error icon when the text field is in the error
  state."*
- Compact: *"For compact breakpoints, text fields can span the full width
  of the display."* / *"Don't apply density to text fields by default. This
  lowers their targets below the recommended 48x48 CSS pixels."*

**Dialogs** (<https://m3.material.io/components/dialogs/guidelines>)

- Verbatim: *"Dialogs are purposefully interruptive, so they should be used
  sparingly."*
- **Full-screen dialog**, verbatim: *"Full-screen dialogs may be used for
  content or tasks that meet any of these criteria: Dialogs that include
  components which require keyboard input, such as form fields; When
  changes aren't saved instantly; When components within the dialog open
  additional dialogs"* och *"Full-screen dialogs are for compact
  breakpoints only, like mobile devices. For medium and expanded
  breakpoints, use a basic dialog."*
- *"To save a selection in a full-screen dialog, use Save."* / *"The
  confirmation action should be clear about what happens next, like Send
  or Create. Avoid using vague terms like Done, OK, or Close."* / *"Don't
  disable the confirmation button."* / Vid stängning utan att spara:
  bekräftelsedialog för att kasta ändringar.
- *"Errors about the dialog fields should always appear inline where they
  occur."*

### 1.4 Shopify Polaris — Badge, Description list, Form layout, Resource list, Index table

**Källäge:** `polaris.shopify.com` och `polaris-react.shopify.com`
omdirigerar (301) till <https://shopify.dev/docs/api/polaris>. Den
fullständiga riktlinjetexten finns i Shopifys eget repo
(`github.com/Shopify/polaris`, **arkiverat**, senast pushat 2026-08-11).
Nya webbkomponent-sidan för Badge:
<https://shopify.dev/docs/api/app-home/web-components/feedback-and-status-indicators/badge>.

**Badge** (repo: <https://raw.githubusercontent.com/Shopify/polaris/main/polaris.shopify.com/content/components/feedback-indicators/badge.mdx>;
live: URL ovan)

- Repo, verbatim: *"Badges are used to inform merchants of the tone of an
  object or of an action that's been taken."*
- Repo, innehåll: *"Use a single word to describe the tone of an object."*
  / *"Only use two words if you need to describe a complex state."* /
  *"Always describe the tone in the past tense. For example, refunded not
  refund."*
- Repo, Don't: *"Don't use alternatives to existing badge options. Only
  create a new badge option if there aren't any existing options to
  communicate the tone you need."*
- Repo, varianter Incomplete / Partially complete / Complete: *"Use to
  indicate when a given task has not yet been completed."* etc. Warning/
  Critical: *"seeing this badge can feel stressful for merchants so it
  should only be used when absolutely necessary."*
- Repo, relaterat: *"To represent an interactive list of categories
  provided by merchants, use tags"*.
- Live (shopify.dev), verbatim: *"The badge component displays status
  information or indicates completed actions through compact visual
  indicators."* / *"Badges are static, system-generated indicators. Don't
  use badges for merchant-created tags or removable items."* / *"Place
  badges adjacent to the items they describe. In list items, position them
  near the title."* / *"Use `base` size in table cells, list items, or when
  showing multiple badges together."*
- **Saknat belägg:** en ordagrann mening *"use badges sparingly"* finns
  INTE i någon av de två Polaris-ytorna. Sparsamheten är belagd indirekt
  (Warning/Critical "only when absolutely necessary"; "Don't use
  alternatives to existing badge options").

**Description list** (repo: <https://raw.githubusercontent.com/Shopify/polaris/main/polaris.shopify.com/content/components/lists/description-list.mdx>)

- Verbatim: *"Description lists are a way to organize and explain related
  information. They're particularly useful when you need to list and define
  terms such as in a glossary."*
- Best practices, verbatim: *"Provide information that isn't
  action-oriented."* — Polaris description list är alltså **inte** avsedd
  för key/value-rader med åtgärd (till skillnad från GOV.UK summary list).
- Producerar `<dl>/<dt>/<dd>`. Ingen prosa om mobil-stapling på sidan.

**Form layout** (repo: <https://raw.githubusercontent.com/Shopify/polaris/main/polaris.shopify.com/content/components/layout-and-structure/form-layout.mdx>)

- Verbatim: *"Use to stack form fields vertically, which makes them easier
  to scan and complete."* Fältgrupper i rad: *"Field groups will wrap
  automatically on smaller screens."* / *"Use caution when arranging
  unrelated fields next to each other as this makes fields easier to
  miss."*
- Etiketter: *"Placed above or beside the form field"* / *"Short and
  succinct (1–3 words)"*.
- *"Group related tasks under section titles to provide more context and
  make the interface easier to scan"*.

**Resource list** (repo: <https://raw.githubusercontent.com/Shopify/polaris/main/polaris.shopify.com/content/components/lists/resource-list.mdx>;
live: <https://shopify.dev/docs/api/app-home/patterns/compositions/resource-list>)

- Repo, verbatim: *"Have items that perform an action when clicked. The
  action should navigate to the resource's details page or otherwise
  provide more detail about the item."*
- Repo, småskärm: shortcut actions *"are shown when the mouse is hovered
  over the list item, and are not shown on small screen devices, so the
  action must also be accessible in another way."* Persistent shortcut
  actions *"roll up into an overflow menu on small screens."*
- Live: exemplen visar chevron för navigerbar detaljsida; ingen prosa om
  responsivt beteende.

**Index table** (repo: <https://raw.githubusercontent.com/Shopify/polaris/main/polaris.shopify.com/content/components/tables/index-table.mdx>;
live: <https://shopify.dev/docs/api/app-home/patterns/compositions/index-table>)

- Repo, verbatim: *"Hide bulk actions on small screens using the
  `condensed` prop. We only recommend hiding bulk actions on screens
  smaller than 490px"*. Rad-`tone` kan markera status med bakgrundsfärg.
- Live: statusbadges ligger som **cellinnehåll** (`<s-badge tone="success">
  Active</s-badge>`), inte som rad-attribut; `listSlot="primary"/"secondary"`
  *"control responsive stacking"* — ingen vidare mobilprosa.

### 1.5 Atlassian Design System — Lozenge, Tag, Inline edit, Badge

Läst i renderad webbläsare.

**Lozenge** (<https://atlassian.design/components/lozenge/usage>)

- Verbatim: *"A lozenge is a prominent, compact label used to communicate a
  meaningful attribute that affects how people understand, prioritize or
  act on an object."*
- Verbatim: *"Use lozenges for important labels that need to be easily
  noticed — like workflow status (e.g. On track, In progress, Completed),
  system state (e.g. Live, Active, On, Disabled), priority (High, P1,
  Urgent), permissions (Locked, Read only, Private) and promotional labels
  (Premium, New, Try)."*
- Verbatim: *"Lozenges should be used to indicate an important label that
  affects prioritization, action, interpretation or product understanding.
  They have higher visual prominence than a tag which should be used
  instead when the label is just descriptive metadata that helps classify,
  group, or filter information."*
- Don't, verbatim: *"Don't use lozenges for descriptive metadata that only
  classifies or categorizes — use a tag instead."*
- Verbatim: *"Lozenges are non-interactive."* — vid interaktivitet: lozenge
  dropdown trigger.
- Tillgänglighet: *"Don't use color alone to signify an important
  attribute."* / *"Don't use long labels in lozenge. They have a max width
  of 200 pixels"*.

**Tag** (<https://atlassian.design/components/tag/usage>)

- Verbatim: *"A tag is a subtle, compact label used to categorize and
  organize content."* / *"Tags work best for lower priority metadata such
  as categories, attributes, or topics that support scanning and
  filtering."*
- Rubrik + verbatim: *"Don't use tags to communicate status"* — *"Tags
  should only be used to categorize or organize information. Tags provide
  less visual prominence than lozenges to create visual hierarchy."*
- *"Tags are designed to be displayed within a tag group."*

**Inline edit** (<https://atlassian.design/components/inline-edit/usage>)

- Verbatim: *"An inline edit displays a custom input component that
  switches between reading and editing on the same page."*
- Verbatim: *"Use inline edit on screens where information needs to be
  updated often, such as a work item page."* / *"Use this instead of a form
  when you have information that may already exist and can be edited."*
- **Tomt värde**, verbatim: *"Field: When in read view, the field is hidden
  and aligned with the label. When in an empty state, you can customise
  what placeholder text is shown here."* och *"Only use placeholder prop to
  show default values. Don't use it to act as a label for the field."*
- Edit view: *"Controls: Options to save or cancel the current data entry
  appear at the end of the field."* / *"Keep action buttons visible
  wherever possible. The contents in the field are saved when the user
  navigates away from the element, but this isn't immediately obvious on
  its' own."*
- Affordans: *"Make sure that inline edit fields have enough visual
  affordance that sighted people recognise them as editable"*.
- **Avgränsning**, verbatim: *"Use inline edit for an editable field that
  is not part of a form. Don't use inline edit inside of a form."*
- Ingen mobil-specifik prosa.

**Badge** (<https://atlassian.design/components/badge/usage>)

- Verbatim: *"Badge is used to display numeric status data."* (Atlassians
  Badge är tal, inte textstatus — statusen är Lozenge.)

### 1.6 PandaDoc — Variables, Fill in document details, Pre-send checks

**Variables (new experience)** (<https://support.pandadoc.com/en/articles/9714599-variables>)

- Verbatim: en variabel är *"a merge field designed to save you time by
  auto-filling any information that frequently occurs in your documents."*
- Ifyllnad, verbatim: *"To fill out a variable with actual info, click on a
  variable in a template/document or open the variables list under
  Variables on the right, and enter a value."* — två vägar: **i dokumentet**
  eller **i en sidopanel-lista**.
- Visning av ofylld variabel i editorn: text i hakparentes, gul bakgrund
  (*"so you can easily distinguish between text and a variable"*); gul
  bakgrund syns inte för mottagaren.
- Oanvända variabler listas under *"Not used"* i panelen.
- **Källa för standardvärde:** rollvariabler *"will be populated upon
  document creation"* och CRM-variabler *"auto-filled with the field
  value"* (classic-artikeln,
  <https://support.pandadoc.com/en/articles/15030600-variables-classic-experience>).
- Ingen mobilprosa i någon av artiklarna.

**Fill in document details step** (<https://support.pandadoc.com/en/articles/12115828-fill-in-document-details-step>)

- Verbatim: *"The Fill in document details step adds a web form to your
  template. The form collects the information needed to populate your
  document's variables."* / *"Each variable gets a question field with a
  label derived from the variable name."*
- Fälttyper: *"Short text, Long text, Number, Email, Phone number, Date,
  Multiple choice, Checkboxes, Dropdown, and layout blocks (Title, Image)."*
- Obligatoriskt styrs per fält (*"uncheck Required in the right panel"*).
  **Saknat belägg:** artikeln säger inget om standardvärden eller mobil.

**Pre-send checks** (<https://support.pandadoc.com/en/articles/15002199-pre-send-checks>)

- Tre kontroller vid Send: *"Check 1 — Unassigned fields"*, *"Check 2 —
  Unassigned recipients"*, *"Check 3 — Unfilled variables"*.
- Verbatim: *"Each check surfaces one at a time, with the fix right in
  front of you."*
- Verbatim: *"The Fill empty variables wizard opens, listing every variable
  in your document that hasn't been filled in."* och *"You don't have to
  fill every variable. If you select Next with some left blank, those
  placeholders will remain empty in the sent document."*
- → PandaDocs svar på "vad saknas" är en **separat lista över enbart de
  ofyllda**, visad vid sändnings-ögonblicket, inte en status-markör per rad
  i översikten.

### 1.7 DocuSign — Pre-fill fields / Sender fields

**Create a Template and Add Pre-fill Fields**
(<https://support.docusign.com/s/document-item?language=en_US&bundleId=xry1643227563338&topicId=oqb1611172929107.html>,
uppdaterad 2025-08-11)

- Avsändaren fyller i **på dokumentet** i prepare-vyn: *"When you enter the
  prepare view for your template, select the pencil icon on the left to
  access the Pre-fill Tools."*
- Obligatoriskt: *"You can require senders to complete a pre-fill field
  before sending. Select the field, then select Mandatory in the Field
  Properties panel."*
- **Standardvärde**, verbatim: *"If you want to set initial values for any
  pre-fill fields before saving the template (such as the name of your
  department or division), do that now. Select the field, then enter the
  value for it in the Add Text property."* / Låsning: *"To lock the values
  so senders can't change them, select Restrict Changes in the Sender
  Permissions property."*
- Efter sändning blir värdet permanent.

**Add Sender Fields to Pre-Fill Data**
(<https://support.docusign.com/s/document-item?bundleId=gbo1643332197980&topicId=nwo1611173513994.html&_LANG=enus&language=en_US>,
uppdaterad 2026-05-11)

- Verbatim: *"For Text fields, enter the field data in the Default text
  property for the field."* Felaktigt format: *"An error message appears
  below the field if you enter invalid data. This message specifies the
  correct format for the data."*
- → DocuSigns modell är **dokument-förankrad** (fält placerade på sidan +
  egenskapspanel), inte en fältlista. **Saknat belägg:** ingen prosa om
  mobilvy för avsändarens ifyllnad, och ingen dokumenterad lista-över-
  saknade-fält-vy i dessa artiklar.

### 1.8 Stripe Dashboard — Create invoice / Checkout

**Use the Dashboard** (<https://docs.stripe.com/invoicing/dashboard>)

- Steg 1–11 är dokumenterade; avslutas med: *"Click Review invoice and
  decide whether you want to include additional emails or continue
  editing. Send the invoice."* Utkast sparas automatiskt: *"Whenever you
  exit the invoice editor, Stripe saves a draft."*
- **Saknat belägg:** dokumentationen beskriver INTE review-stegets
  radgrammatik (label/värde + "Edit") och säger inget om mobilbredd.
  Påståendet i uppdragsfrågan om "rader med label/värde + Edit" kan alltså
  inte verifieras ur Stripes egna docs i detta pass (skulle kräva inloggad
  observation).

**Checkout** (<https://docs.stripe.com/payments/checkout/customization/appearance>)

- Sidan täcker färger/typsnitt/form; **ingen prosa** om ordersammanfattningens
  layout på mobil hittades. Ingen slutsats dras.

### 1.9 Notion / Linear — "Empty"-visning

- Notion *Database properties* (<https://www.notion.com/help/database-properties>)
  och Linear *Create issues* (<https://linear.app/docs/creating-issues>)
  lästes. **Ingen av dem beskriver i text hur ett tomt egenskapsvärde
  visas** ("Empty"-platshållare) eller mobilbeteende. Inget påstående görs
  om dessa produkter i syntesen nedan.

---

## 2. Syntes mot de tre frågorna

### A. Radgrammatik — vänster/höger eller staplat? Hur visas "saknas"?

**Vad källorna säger:**

1. GOV.UK summary list är **vänster/höger på ≥ 641 px och staplad under**
   (källkod: `display: table` först från `tablet`; under brytpunkten är
   key/value/actions block med egna bottenmarginaler). Vid 390 px är
   mönstret alltså: **fet etikett / värde / åtgärdslänk**, vänsterställt,
   en bottenkant per rad. (`_mixin.scss`, `_media-queries.scss` ovan.)
2. Material 3 ger samma riktning utan att kalla det summary list: i compact
   *"Reduce the amount of information shown"*, listor *"edge-to-edge"*, och
   trailing text är för *"meta-information … such as a price, count, or
   other details"* — dvs korta värden kan stå till höger, långa hör hemma
   som supporting text under etiketten (en/två/tre-radsvarianterna).
3. Apple HIG: etikett-vänster/värde-höger är belagt som **exempel**
   (Settings) och via disclosure indicator som navigationsaffordans, inte
   som uttalad regel; *"Keep item text succinct"* och "list titles only,
   let people choose an item to reveal its content in a detail view" för
   långa värden.
4. Polaris form layout: *"stack form fields vertically"*, etiketter *"above
   or beside"*.

**Hur "saknas" visas — tre dokumenterade former, ingen av dem en chip:**

- **GOV.UK summary list:** en **länk i värdekolumnen** ("Enter …") i
  stället för Change — den saknade raden ÄR sin egen handling.
- **GOV.UK check answers:** *"Not provided"* som vanlig text för **valfria**
  obesvarade frågor (skiljer medvetet hoppat-över från saknat-krävt).
- **Atlassian inline edit:** anpassningsbar **platshållartext** i läsläget
  vid tomt värde; platshållare får visa *default values*, aldrig agera
  etikett.
- **Apple HIG Labels:** tertiär etikettfärg för *"Text that describes an
  unavailable item or behavior"* — typografisk nedtoning, inte färgkod.
- Röd text/fel-ton för "saknas" är **inte** belagt som översiktsmönster i
  någon källa; M3 och Polaris/Atlassian reserverar fel-/warning-ton för
  faktiska fel (M3: *"Swap supporting text with error text"*; Polaris
  Warning/Critical *"only when absolutely necessary"*).

**Slutsats A:** staplad rad (etikett / värde / handling) vid 390 px är det
enda källbelagda mönstret för en key/value/action-översikt; kort värde kan
ligga som trailing text om det får plats, men källorna väljer stapling när
värdet är löptext. "Saknas" visas som **handlingslänk i värdeplatsen**
("Lägg till …") eller som nedtonad platshållartext — inte som chip, inte
rött.

### B. Status-chips per rad ("Standard" / "Egen text" / "Saknas")

**Stöder något system mönstret?** Nej — inget av de sju designsystemen
dokumenterar en chip/badge **per rad** som anger värdets *härkomst*.

- **Material 3 avråder chips för status:** chips är *"interactive
  elements"* för att *"enter information, make selections, filter content,
  or trigger actions"*; *"Don't display a single chip by itself. Chips
  should appear in a set."* En ensam status-chip i slutet av varje rad
  bryter båda.
- **Atlassian skiljer status från metadata:** Lozenge för attribut som
  *"affects prioritization, action, interpretation"* (workflow-status,
  systemtillstånd, behörighet — "Read only", "Locked" är listade exempel);
  Tag för *"descriptive metadata that helps classify, group, or filter"*.
  "Kommer från standard" är beskrivande härkomst, inte ett
  arbetsflödestillstånd — enligt Atlassians egen uppdelning hör det INTE
  hemma i en lozenge, och Tag *"should only be used to categorize or
  organize information"*, i tag-grupper.
- **Polaris Badge** är för *"status information or … completed actions"* —
  ett ord, dåtid ("Refunded", "Fulfilled"); *"Don't use alternatives to
  existing badge options"*. "Egen text" är ingen sådan status.
- **GOV.UK Task list** är den enda källan som sätter status-tag per rad —
  och gör det **asymmetriskt**: det normala läget ("Completed") är **vanlig
  text**, bara det som kräver handling ("Incomplete") får tag, med
  rationalen att dra blicken till det som kräver åtgärd. Tag-sidan:
  *"Sometimes a single status is enough."*

**Branschens lugnaste sätt att ange standard vs eget** (härlett ur
källorna, inget system adresserar exakt denna distinktion):

1. **Värdet självt bär informationen** — DocuSign och PandaDoc visar
   standardvärdet *i fältet* (DocuSign "initial values"/"Default text",
   PandaDoc rollvariabler *"populated upon document creation"*), utan
   någon separat "standard"-markör; Apple: *"prefill fields with reasonable
   default values"*.
2. **Sekundär text under värdet** ("Standardtext" / "Egen text") är den
   M3-form som finns för metadata: supporting text *"one to three lines"*,
   eller Apple HIG:s *Secondary label* (*"supplemental text"*). Det är text
   i hierarkin, inte en komponent.
3. **Bara avvikelsen markeras** — GOV.UK Task list-principen: det som är
   som förväntat (standard) är tyst; bara det som kräver handling (saknas)
   får en synlig markör, och då som **handlingslänk** (summary list) eller
   en enda tag (task list).

**Slutsats B:** tre chips per rad saknar stöd och motsägs av M3 (chips =
handling/filter, aldrig ensamma) och av Atlassians/Polaris statusdefinition.
Det källbelagda lugna läget är: värdet visas, härkomsten som nedtonad
sekundärtext, och endast "saknas" får en markör — i form av länken "Lägg
till …" i värdeplatsen.

### C. Redigering — inline/morf, dialog eller separat sida, ett fält i taget på mobil?

- **Material 3, compact:** *"Selecting a list item should open a page with
  the details."* För inmatning: *"Full-screen dialogs may be used for …
  Dialogs that include components which require keyboard input, such as
  form fields"* och *"Full-screen dialogs are for compact breakpoints only,
  like mobile devices."* Spara-knappen ska heta det den gör (*"Send or
  Create. Avoid … Done, OK, or Close"*), aldrig inaktiverad, inline-fel,
  bekräftelse vid stängning med osparade ändringar. Basdialoger är
  *"purposefully interruptive, so they should be used sparingly"*.
- **Apple HIG:** drill-down via disclosure indicator till *"the next level
  in a hierarchy"*; modalitet *"only when there's a clear benefit"*, *"keep
  modal tasks simple, short, and streamlined"*, tydlig titel, tydlig
  stängning, bekräftelse vid dataförlust. Settings: *"prefer letting people
  modify task-specific options without going to your settings area"* —
  ändringen ska ske där den verkar.
- **GOV.UK:** Change-länk per rad → separat frågesida → *"the 'Continue'
  button should return them to the check answers page"*; *"one question per
  question page helps users … focus on the specific question and its
  answer."* (Gruppering tillåts när forskning stöder det.)
- **Atlassian inline edit** är det enda dokumenterade morf-mönstret: läs-
  och redigeringsläge *"on the same page"*, synliga spara/avbryt-kontroller,
  placeholder för tomt läge. Men: *"Use inline edit for an editable field
  that is not part of a form. Don't use inline edit inside of a form."*, och
  sidan har ingen mobilprosa. En genereringsöversikt som samlar fält inför
  ett "Skapa"-steg är till sin funktion ett formulär.
- **PandaDoc** erbjuder båda vägarna (klicka i dokumentet eller redigera i
  sidopanelens lista) på desktop, och ett **separat webbformulär**
  ("question field" per variabel) som ifyllnadssteg — ingen mobilprosa.
- **DocuSign** redigerar på dokument-canvas + egenskapspanel — ingen
  mobilprosa.

**Slutsats C:** för ett fält i taget på 390 px konvergerar M3, Apple HIG och
GOV.UK på **en egen yta per fält** (detaljsida/fullskärms-dialog med tydlig
titel, "Spara"-knapp som säger vad den gör, inline-fel, återgång till
översikten). Inline-morf är belagt (Atlassian) men uttryckligen inte för
formulärkontext och utan mobilbelägg. En liten centrerad dialog är det
minst belagda valet för tangentbordsinmatning på mobil (M3 hänvisar
formulärfält till fullskärm i compact).

---

## 3. Rekommendation för genereringsvyn (strikt härledd ur källorna)

1. Bygg översikten som en **staplad summary list** (`<dl>`: fet etikett /
   värde / handling, bottenkant per rad) — GOV.UK-källkodens beteende under
   641 px, M3:s "reduce information at compact".
2. Gruppera raderna i **sektioner med rubrik** (GOV.UK check answers
   "sections"; Polaris "section titles"; HIG grouped style) och visa bara
   relevanta sektioner.
3. Visa **värdet självt**, med härkomst som **nedtonad sekundärtext** under
   ("Standardtext" / "Egen text") — M3 supporting text / HIG secondary
   label; ingen chip, ingen badge för härkomst (M3 chips = handling/filter,
   aldrig ensamma; Atlassian/Polaris: status ≠ beskrivande metadata).
4. **Saknat värde = handlingslänk i värdeplatsen** ("Lägg till …"), inte
   rött, inte chip (GOV.UK summary list "Enter …"-länk); valfritt
   obesvarat = vanlig text "Ej angivet" (GOV.UK "Not provided").
5. Bara det som kräver handling får en markör (GOV.UK task list:
   "Completed" som vanlig text, tag bara på "Incomplete").
6. Per rad **en** handling: "Ändra" med visuellt dold kontext
   ("Ändra ämnesrad") — GOV.UK `visuallyHiddenText`.
7. "Ändra" öppnar **en egen yta för det fältet** (fullskärm i compact, M3;
   disclosure/drill-down, HIG) med titel som namnger fältet, alltid aktiv
   "Spara"-knapp med tydligt verb, inline-fel, bekräftelse vid osparad
   stängning — och återgång till översikten efteråt (GOV.UK check answers).
8. Använd inte inline-morf i översikten (Atlassian: *"Don't use inline edit
   inside of a form"*; inget mobilbelägg).
9. Generera-knappen görs tillgänglig först när obligatoriska fält finns
   (HIG entering data); alternativt PandaDoc-formen: en **separat lista
   över enbart det som saknas** vid genererings-ögonblicket.
10. Förifyll standardvärden i själva fälten (HIG *"prefill fields with
    reasonable default values"*; DocuSign/PandaDoc gör detsamma) så att
    "standard" är det tysta normalläget, inte en etikett.

---

## 4. Precedent-tabell

|Produkt / system|Mönster|URL|
|---|---|---|
|GOV.UK Design System|Summary list: key / value / "Change"; saknat värde som länk i värdekolumnen; staplad under 641 px (källkod)|<https://design-system.service.gov.uk/components/summary-list/> · <https://raw.githubusercontent.com/alphagov/govuk-frontend/main/packages/govuk-frontend/src/govuk/components/summary-list/_mixin.scss>|
|GOV.UK Design System|Check your answers: sektioner, Change-länk, "Not provided", återgång efter ändring|<https://design-system.service.gov.uk/patterns/check-answers/>|
|GOV.UK Design System|Task list: "Completed" som vanlig text, tag bara för det som kräver handling|<https://design-system.service.gov.uk/components/task-list/>|
|GOV.UK Design System|Tag: status, ej interaktiv, minsta antal statusar|<https://design-system.service.gov.uk/components/tag/>|
|GOV.UK Design System|En fråga per sida|<https://design-system.service.gov.uk/patterns/question-pages/>|
|Apple HIG|Lists and tables: Settings-hierarki, disclosure indicator, korta radtexter|<https://developer.apple.com/design/human-interface-guidelines/lists-and-tables>|
|Apple HIG|Labels: primär/sekundär/tertiär etikettfärg ("unavailable item")|<https://developer.apple.com/design/human-interface-guidelines/labels>|
|Apple HIG|Text fields: platshållare + separat etikett, staplade fält|<https://developer.apple.com/design/human-interface-guidelines/text-fields>|
|Apple HIG|Entering data: förifyll standardvärden, val före inmatning, Continue aktiv först när krav uppfyllda|<https://developer.apple.com/design/human-interface-guidelines/entering-data>|
|Apple HIG|Modality: modalt bara vid tydlig nytta; kort, titlad, tydlig stängning|<https://developer.apple.com/design/human-interface-guidelines/modality>|
|Apple HIG|Settings: standardvärden för flest; ändra där det verkar|<https://developer.apple.com/design/human-interface-guidelines/settings>|
|Material Design 3|Lists: trailing text = metadata; compact → öppna detaljsida; reducera information|<https://m3.material.io/components/lists/guidelines>|
|Material Design 3|Chips: handling/filter/input/suggestion; aldrig en ensam chip; inte status|<https://m3.material.io/components/chips/guidelines>|
|Material Design 3|Text fields: alltid synlig etikett, required-asterisk, read-only, fel ersätter supporting text|<https://m3.material.io/components/text-fields/guidelines>|
|Material Design 3|Dialogs: fullskärmsdialog för formulärfält i compact; sparsamt med basdialoger|<https://m3.material.io/components/dialogs/guidelines>|
|Shopify Polaris|Badge: status, ett ord i dåtid, inga egna varianter; statisk|<https://shopify.dev/docs/api/app-home/web-components/feedback-and-status-indicators/badge> · <https://raw.githubusercontent.com/Shopify/polaris/main/polaris.shopify.com/content/components/feedback-indicators/badge.mdx>|
|Shopify Polaris|Description list: term/beskrivning, "isn't action-oriented"|<https://raw.githubusercontent.com/Shopify/polaris/main/polaris.shopify.com/content/components/lists/description-list.mdx>|
|Shopify Polaris|Form layout: staplade fält, sektionstitlar, etikett ovanför/bredvid|<https://raw.githubusercontent.com/Shopify/polaris/main/polaris.shopify.com/content/components/layout-and-structure/form-layout.mdx>|
|Shopify Polaris|Resource list: rad navigerar till detalj; shortcut actions döljs på småskärm|<https://raw.githubusercontent.com/Shopify/polaris/main/polaris.shopify.com/content/components/lists/resource-list.mdx> · <https://shopify.dev/docs/api/app-home/patterns/compositions/resource-list>|
|Shopify Polaris|Index table: `condensed` < 490 px; badge som cellinnehåll|<https://raw.githubusercontent.com/Shopify/polaris/main/polaris.shopify.com/content/components/tables/index-table.mdx> · <https://shopify.dev/docs/api/app-home/patterns/compositions/index-table>|
|Atlassian Design System|Lozenge: status/tillstånd/behörighet; ej för beskrivande metadata; icke-interaktiv|<https://atlassian.design/components/lozenge/usage>|
|Atlassian Design System|Tag: kategorisering; "Don't use tags to communicate status"|<https://atlassian.design/components/tag/usage>|
|Atlassian Design System|Inline edit: läs/redigera på samma sida; placeholder vid tomt; "not inside of a form"|<https://atlassian.design/components/inline-edit/usage>|
|Atlassian Design System|Badge: numeriska värden|<https://atlassian.design/components/badge/usage>|
|PandaDoc|Variables: fyll i dokumentet eller i sidopanelens lista; "Not used"; roll-/CRM-förifyllnad|<https://support.pandadoc.com/en/articles/9714599-variables> · <https://support.pandadoc.com/en/articles/15030600-variables-classic-experience>|
|PandaDoc|Fill in document details: webbformulär med ett frågefält per variabel|<https://support.pandadoc.com/en/articles/12115828-fill-in-document-details-step>|
|PandaDoc|Pre-send checks: "Fill empty variables"-wizard listar enbart ofyllda; får lämnas tomma|<https://support.pandadoc.com/en/articles/15002199-pre-send-checks>|
|DocuSign|Pre-fill fields: på dokumentet i prepare-vyn; Mandatory; initial values; Restrict Changes|<https://support.docusign.com/s/document-item?language=en_US&bundleId=xry1643227563338&topicId=oqb1611172929107.html>|
|DocuSign|Sender fields: "Default text"-egenskap; formatfel under fältet|<https://support.docusign.com/s/document-item?bundleId=gbo1643332197980&topicId=nwo1611173513994.html&_LANG=enus&language=en_US>|
|Stripe|Create invoice: steg + "Review invoice"; radgrammatik och mobil EJ dokumenterad|<https://docs.stripe.com/invoicing/dashboard>|
|Notion / Linear|"Empty"-visning EJ dokumenterad i hjälptext|<https://www.notion.com/help/database-properties> · <https://linear.app/docs/creating-issues>|

---

## 5. Öppna luckor (belägg som INTE gick att få i passet)

- Stripes review-stegs faktiska radgrammatik och Checkout-sammanfattningens
  mobil-layout: kräver inloggad observation; inte i docs.
- Apple HIG:s "etikett vänster / värde höger"-regel: finns som exempel
  (Settings) och rad-API, inte som uttalad riktlinje.
- Notion/Linear "Empty"-platshållare: inte beskrivet i hjälpcentrens text.
- Polaris ordagranna "use badges sparingly": finns inte; sparsamheten är
  indirekt belagd.
- PandaDoc/DocuSign mobilflöden för avsändarens ifyllnad: ingen prosa.
