# Dukning — segment-ytans divergens-pass (S104, `task-181`)

> **Vad detta är:** premissunderlaget för divergens-passets tre bygg-agenter.
> Syntes av tre utredningspass 2026-08-10 mot bas `720d8c57`. Varje påstående
> bär sin källa. Obelagda punkter står under § Osäkerheter — de får aldrig
> behandlas som fakta (`ADR-086`).
>
> **Marcus order som styr passet (2026-08-10, verbatim):** *"duka upp för
> byggagenterna så de bygger 3 riktigt bra varianter. Vi har idag flera sidar
> som är 'facit-låsta' och 'färdig-designade' återanvänd struktur, komponenter
> och mönster. Appen formspråk är ju i grunden satt via de 'färdiga'
> skärmarna/sidorna."*

---

## 0. Den viktigaste regeln: kopiera INTE din närmaste granne

**Två formspråks-generationer lever samtidigt i repot.**

| Generation | Var | Kännetecken |
|---|---|---|
| **G2 — facit-låst, kanonisk** | `src/components/events/` + `events/detail/` | Tonala kortgrupper (`DetaljGrupp`), pill-toggles (`ToggleButtonGroup`), markera-läge + batch-bar, `StatusBadge`, `Skeleton` i slutgeometri |
| **G1 — pre-facit, äldre** | `AnmalningarList`, `Waitlist`, `Intresserade`, `PersonsList` — **och dagens `SegmentBuilder.tsx`** | `<ul>` med `border-b`-rader, `<h2 className="font-medium text-lg">`, inga tonala kort, inga pillar, synlig "Laddar…"-text |

Dagens segment-yta är **G1**. Den naiva läsningen — "titta på grannfilen" —
återskapar exakt den form Marcus vill bort ifrån. **Formen hämtas ur
Event-familjen (G2)**, även om sidan strukturellt fortsätter leva under
`/mer/segment`.

Belägg: `docs/byggplan.md` rad ~120 listar Segment som en av fem ytor som
**inte** gått genom facit-kedjan.

---

## 1. Vad som redan är facit-låst — ärvs, omprövas inte

### 1.1 Åtgärdssidan (`facit.json`, godkänd 2026-08-09, `sha: cfc62f9f`)

Marcus låsningsord verbatim: *"jag låser Åtgärdssidan och Granskningsidan (och
granskningssidans olika ytor/lägen) som facit. Det är okej för v1, jag vill att
de blir 'skarpa' sidor i appen nu."*

| Låst yta | Facit-form | Relevans här |
|---|---|---|
| `atgarder-mottagarurval` | `data-testid="mottagar-kort"`, lista öppnad | **Trygghetstriadens (b) har redan en låst form** |
| `atgarder-granskning` | Granskningsläge + urvalsfilter + tre utfallslägen (allt/delvis/inget) | T50-lager 1 (granska före sändning) |
| `atgarder-tomt-lage` | Eventväljare utan valt event | Tomtillståndets anatomi |

Facit är **`ariaSnapshot`-referenser**, inte bilder
(`tests/visual/__aria__/atgardssida-promoverings-grind.spec.ts/`).

**Konsekvens:** segment-sändvyn uppfinner inte mottagarurval eller
granskningssteg. Den **ärver grammatiken** från `AtgardsSida.tsx`. Divergensen
flyttar därmed uppåt — till segmentbyggets struktur och till hur
bygge → mottagare → utskick binds ihop.

### 1.2 Eventsidan/hållplats (`facit.json`, godkänd 2026-08-10, `sha: e25efd05`)

Fem ytor: anteckningar, betalningar, gruppdynamik, åtgärder, register. Bär
`DetaljGrupp`-anatomin och register-ytans filtrering.

### 1.3 Ett riktningsbeslut med tung precedens

**Eventsidan är en REN ÖVERSYN.** Batch-bekräftelsen som en gång låg direkt på
sidan är **riven** (`TASK-145.3`): *allt som VERKSTÄLLER något bor på
Åtgärds-sidan*. Batch-barens primärknapp heter alltid **"Åtgärder"** och tar
urvalet vidare — den verkställer aldrig själv.

Samma riktning: betalningar som eget toppnivåblock är rivet (`TASK-145.4`) och
konsoliderat in i registret. **Facit-riktningen har varit att konsolidera
arbetsytor in i den lista de hör till, inte sprida ut dem.**

---

## 2. Komponenter att bygga med (verifierade mot disk)

### 2.1 Primitiver — `src/components/primitives/`

Alla på **react-aria-components** (`ADR-044`) + CVA + `cn()`.

| Komponent | Props-yta i korthet |
|---|---|
| `Button` | `intent`: primary·secondary·danger·ghost·success × `emphasis`: solid·outline·subtle × `size` |
| `Input` / `TextArea` | `label` (obligatorisk), `hideLabel`, `description`, `errorMessage`, `size` |
| `Select` / `SelectItem` | `label`, `hideLabel`, `errorMessage`, `items`, `size` |
| `RadioGroup` / `Radio` | `label`, `orientation`, `value`/`onChange` |
| `ToggleButtonGroup` / `ToggleButton` | `label`, `spread` (likbreda segment), `selectedKey` |
| `Modal` / `Dialog` | `title`, `children`, `actions` (render-fn med `{close}`), `size`, `isDismissable` |
| `MessageBox` | `intent`: info·success·warning·error, `title`, `onDismiss` |
| `Skeleton` | `variant`: text·number·listRow |
| `NavCard` | `to` (router-typad), `icon`, `label` — API:t medvetet minimalt |
| `SlideToConfirm` | `label`, `prompt`, `confirmedLabel`, `isSelected`/`onChange` |

**Finns INTE:** Checkbox-primitiv (använd rå RAC `Checkbox`) · tabellkomponent
(**ingen `<table>` finns någonstans i appen**) · toast-system (allt är inline
`MessageBox`).

### 2.2 Mönsterbärare i Event-familjen

- **`DetaljGrupp`** (`events/detail/DetaljGrupp.tsx`) — **den mest
  återanvändbara byggstenen.** Rubriken står **utanför** den tonala kortytan
  (`px-4`-indrag, FK-mönstret). Kortytan:
  `divide-y divide-border rounded-2xl border border-transparent bg-bg-muted px-4 contrast-more:border-border-strong`.
  Inuti: `EtikettVardeRad` (`dt`/`dd`, etikett dämpad, värde högerställt,
  tomma värden hoppas över) och `AndraRad` (penn-ikon + "Ändra", **exakt samma
  48 px geometri i läs- och redigeringsläge** så morfen aldrig hoppar).
- **`EventCard`** (`events/EventCard.tsx:176-255`) — slot-baserat listkort.
  `relative flex flex-col gap-2 rounded-2xl border bg-bg-muted p-4 hover:bg-bg-emphasized motion-safe:transition-colors`.
  En länk täcker hela kortet via `after:absolute after:inset-0` **på rubriken**,
  inte på `<li>`. Meta-rader med `lucide-react`-ikon `size={14}`, `aria-hidden`,
  `shrink-0`.
- **Markera-läget** (`events/detail/Deltagare.tsx`) — **starkaste källan för en
  yta där Lotta ska välja ut personer.**
  - `useMarkeringsLage(kandidatIds)` (rad 418–473): `aktivt`, `valda:
    ReadonlySet<string>`, `antal`, `allaValda`, `oppna/stang/vaxla/markeraAlla/rensa`.
    **Saneras automatiskt när kandidatmängden krymper.** Esc stänger.
  - `MarkerbartKort` (rad 1000–1042): hela kortet är en rå RAC `<Checkbox>`.
    Vald: `border-(--mm-success) bg-(--mm-success-bg)`. **Kanten är
    WCAG 1.4.1-bäraren, inte plattan** (plattan mäter 1,05:1 mot vitt).
  - `MarkeringsBatchBar` (rad 505–~570): **renderas alltid** — konstant
    geometri över lägena, inget layouthopp. Ordning: Markera → **"Åtgärder"**
    (`intent="primary"`) → "Markera alla" (`secondary`) → "Rensa" (`ghost`,
    syns bara vid `antal > 0`). Live-räknare i `aria-live="polite"`.
- **`StatusBadge`** (`registrations/StatusBadge.tsx`) — tonal pill, `ton`:
  success·warning, `storlek`: sm·md. **Alla pillar bär
  `border border-transparent`** så `contrast-more:border-*` inte ger
  layouthopp. Kanonisk regel, härledd ur inventering av 23 förekomster.
- **`IdChip`** (`registrations/IdChip.tsx`) — mono-ID med klick-att-kopiera.

### 2.3 Sidanatomin (ur `EventsList.tsx` — den rikaste facit-källan)

Uppifrån och ned:

1. Utskriftshuvud (`hidden print:block`) — kontext skärmen bär implicit skrivs ut explicit.
2. Vy-rad: sekundär ingång vänster (`rounded-full bg-bg-muted`-kapsel) + vy-toggel höger (ikon-only med `aria-label`).
3. Primär-toggel (`ToggleButtonGroup spread`) + filter-tratt på samma rad (RAC `Disclosure`/`DisclosurePanel`). Aktiv: `bg-text text-text-inverse`; siffer-badge `bg-accent`, `aria-hidden`.
4. Filterpanel = tonalt kort (`rounded-2xl bg-bg-muted p-4`), **live utan Apply-knapp**, räknare "Visar X av Y" + Rensa + Skriv ut i panelfoten.
5. Grupprubriker som riktiga `<h2>`.
6. Likformiga slot-kort.
7. **Två skilda tomlägen:** "ingen data i perioden" vs "filtren matchar inget" (det senare med Rensa-knapp). Strukturerat och centrerat: `flex flex-col items-center gap-1/2 py-12 text-center`.

**Spacing-rytm:** `gap-6` mellan toppnivåblock · `gap-3`/`gap-4` inom kort ·
`gap-2`/`gap-2.5` inom listrader · `px-4` som konsekvent sid-inset (sektioner
har **aldrig** egen dubbel padding).

**Detaljsidans ram** (`EventDetail.tsx:142-322`):
`<section className="flex flex-col gap-6 pt-2 lg:pt-10">` med
chevron-tillbaka (44 px rund knapp, `bg-bg-muted`, `aria-label`), `<header>`
med `border-border border-b px-4 pb-5`, `<h1>` som entitetsnamn med `ref` för
fokusflytt. **Primär åtgärd bor i egna ovillkorliga kort direkt under
headern** — inte i headern, inte som flytande FAB.

---

## 3. Formens golv — gäller alla tre varianterna

### 3.1 T50-härdningens tre skyddslager

Kravet är **beteendet**, inte dagens form. Serverhalvorna rörs **inte** av en
UI-omdesign.

| Lager | Vad kravet är | Var dagens form sitter |
|---|---|---|
| **(a) Skriv-för-att-bekräfta** | Knappen som utlöser den oåterkalleliga sändningen får inte vara aktiverbar förrän användaren skrivit ett värde som bevisar att hen sett mottagarantalet. Fältet nollställs vid varje modalöppning. | `SegmentMailCompose.tsx:46, 95-96, 229-244, 285-301` |
| **(b) Mottagarkontroll** | Antalet (och helst vilka) syns **före** sändning — och **servern äger sanningen** om vilka som faktiskt kontaktas. | Klient: `SegmentMailCompose.tsx:64-72, 88-92`. Server: `send-email` löser mottagare ur `segmentIds`, **aldrig ur en klientbyggd lista** (`send-email/index.ts:22-23, 174`) |
| **(c) Pessimistisk bulk** | Ingen optimistisk flip. Stabil idempotensnyckel per **sändavsikt**, byts först efter lyckad sändning. Delvis/nollresultat får **aldrig** se ut som full framgång. | Klient: `SegmentMailCompose.tsx:50, 79-81, 200-204, 308-346`. Server: `send-bulk.ts:60-77, 169-176` |

**Grön-knapp-regeln (`task-18.16`):** en handling som når **utomstående**
(mail-utskick) får `intent="success"` — **aldrig** `intent="danger"`. Rött är
reserverat för destruktiva/interna borttagningar. Oåterkalleligheten bärs av
bekräftelse-grinden och den spatiala separationen (Avbryt `mr-auto` längst
vänster, faroknapp längst höger), **inte av färg**.

### 3.2 Trygghetstriaden (Marcus 2026-08-10, ärvd från `147.10`)

| Del | Läge i dag | Hakpunkt |
|---|---|---|
| **(a) Förhandsvisning som mottagaren ser den** | Plain-text `pre-wrap` i modalen — **inte** renderad HTML, ingen platshållarifyllning | `AtgardsSida.tsx` bär redan ett forskningsgrundat **"EN NAMNGIVEN MOTTAGARE"**-mönster (rad ~1981–1986, `fyllPlatshallare` ~456). Underlag: `docs/research/mottagar-preview-monster-2026-08-07.md` |
| **(b) Synlig mottagarlista** | **Saknas** — bara aggregerat antal | **Nästan gratis:** `compute-segment`-svaret bär redan `{id, namn, email, ejGodkandMail}` per medlem och klienten har datan i minnet. Listan bör visuellt skilja "får mailet" från "undertrycks av serverns consent-grind" |
| **(c) "Skicka test till mig"** | **Saknas — och kan inte byggas funktionellt än** | Beror på `task-147.1`s revision av `send-email` (ny enkel-mottagar-gren, AC #5). Kortet är `To Do`. **I prototypen: stub.** Beroendet följer med in i facit + PRD |

### 3.3 Tillgänglighet 11 — utan undantag

- **Fokusflytt vid dataanländning:** `headingRef` + `useEffect` som fokuserar `<h1>` en gång när data anländer. Identiskt mönster i minst fem vyer.
- **Global fokusring** (`base.css:213-217`): `*:focus-visible` med `--mm-focus-ring` (`#1B4965`) — en **exklusiv** färg, används aldrig till annat.
- **Textfält visar ring vid varje fokus** (även musklick) via `.mm-fokusring-vid-fokus` (`base.css:207-211`, `TASK-134`).
- **`prefers-contrast: more`:** mönstret är `border-transparent … contrast-more:border-border-strong` — 54 belagda ställen.
- **`prefers-reduced-motion`:** global neutralisering (`base.css:298-308`) **plus** varje transition som `motion-safe:transition-*`, aldrig bar `transition-*`.
- **Print:** `print:hidden` på navigation/kontroller, egna print-huvuden, `break-inside-avoid` per listrad.
- **Färg aldrig ensam bärare:** status alltid även som text; dekorativa ikoner `aria-hidden`.
- `isDisabled` på RAC-komponenter framför native `disabled`.

### 3.4 Tokens — konsumera dessa, verifiera resten

Ytor: `bg-bg-muted`, `bg-bg-emphasized`, `bg-surface` · Text: `text-text`,
`text-text-secondary`, `text-text-muted`, `text-text-inverse` · Kanter:
`border-border`, `border-border-strong` · Feedback: `bg-success`/`bg-success-bg`,
`text-success`, `bg-error`/`bg-error-bg`, `text-error`, `bg-warning`/`bg-warning-bg`,
`bg-info`/`bg-info-bg`.

Typografi: `text-caption`, `text-small`, `text-body`, `text-lg`, `text-xl`,
`text-2xl`, `text-3xl`. **Aldrig godtyckliga `text-[Npx]`.**

> **`--mm-color-primary` FINNS INTE.** Det var en levande bugg (checkbox föll
> till webbläsarens default-blå), fixad S100 varv 14. Skriv aldrig den strängen.
> Kör `grep -rn "var(--mm-" src/` mot faktiska token-filer innan du inför en ny
> token-referens.
>
> Finns inte heller: `--mm-table-*` (ingen tabellkomponent) · `--mm-toast-*`
> (inget toast-system).

---

## 4. Domän-fällor varianterna måste respektera

Ur `docs/reference/data-model.md` § Kända fällor:

- **#34 — föreläsnings-segment kan visa 0 träffar trots att data finns.**
  Orsak: `Deltaganden`-rader oavstämda (`Status="Ej avstämt"`). Golvet
  (`Närvaropoäng=1`) lättas **medvetet inte** (`ADR-064` beslut 4a). **Visas
  neutralt, aldrig som fel** — dagens formulering är en god förebild:
  *"0 personer matchar - inga med genomförd närvaro ännu"*.
- **#35 — naket "Resor i medvetandet" är ett DISTINKT kursnamn** från
  RIM 1/2/3-serien. `segment-taxonomy.ts:52-55` (`labelForPar`) bär i dag
  disambigueringen. **Den måste bevaras** — kopiera inte taxonomin blint.
- **#39 — `Utskickslogg.Antal skickade` ljuger** (`COUNTA` på länkfält, visar
  alltid 1). Spegla aldrig fältet i UI. Riktiga siffran är EF-svarets `accepted`.
- **#44 — Marcus egna adresser är riktiga betalande deltagares adresser**
  (`highfive.epost@gmail.com`, `inbox@marcusemails.com`). En testmail-väg får
  **aldrig** filtrera på adressmönster. Lessons `L258`/`L259`.

---

## 5. Prototyp-reglerna för detta pass

- **Underform A** — befintlig route `/mer/segment`, `?variant=a|b|c`. Befintlig
  datahämtning, parametrar och auth **behålls**; bara det renderade underträdet
  byts.
- **Växlaren:** `src/components/dev/PrototypeSwitcher.tsx` — delad, DEV-grindad,
  **aldrig inline-kopierad**. Nycklar `a`/`b`/`c` är stabila; vinnaren behåller
  sin nyckel genom konvergensen (`ADR-074` beslut 1).
- **Read-only förstärkt.** Ingen variant kopplas till verkliga mutationer —
  stub. En prototyp registrerar **aldrig** en operation i write-allowlisten.
  Varken prod eller staging tar prototyp-writes.
- **Grind-principen:** körbarhets-golvet gäller (biome + typecheck — repot
  förblir bootbart, CI grön). Leverans-grindarna (tester, axe, arch-audit,
  11/11/11) gäller **inte** — de möter den promoverade ytan i
  promoverings-skivorna.
- **Frågan nedskriven högst upp i varje variantfil** + prototyp-märkning
  (kontraktets klausul i + ii).
- **Dela inte för mycket kod mellan varianter.** En delad rubrikrad är bra; en
  delad `Layout` motverkar poängen — varje variant ska vara fri att kasta
  layouten.
- **Hoppa över putsningen** — tester, felhantering utöver körbarhet,
  abstraktioner. **Inte** typer/lint.

---

## 6. Osäkerheter — obelagt, får inte behandlas som fakta

1. **Personer-listans tonal/zebra-fork är INTE avgjord.** S102 skriver
   "tonal/zebra-valet först", men ingen stämpling finns på disk. Ett
   research-pass 2026-08-10 rekommenderar **tonal** med stark precedens
   (Polaris, Primer, GOV.UK, Material, Ant Design — zebra är en tabell-teknik,
   inte ett listmönster). En rekommendation är **inte** Marcus kvittens.
2. **"Mail-handling" som femte facit-lös yta går inte att belägga som
   distinkt** från Segment (`SegmentMailCompose`) och den redan låsta
   åtgärdssidan.
3. **Mer/Intresserade + Maillogg** — routar finns, men ingen prototyp-bilaga
   eller facit-referens hittad. Obelagt om pass ens är påbörjat.
4. **Multi-segment-utskick:** EF:en stödjer redan **union över flera** segment
   (`resolveSegmentMembers`); UI:t begränsar till ett. Ingen PRD/ADR säger om
   det är i scope.
5. **Tooltips-förbudet** gäller enligt disk **endast** dev-verktyget
   `PrototypeSwitcher` — ingen app-bred regel är belagd. Generalisera inte.
6. **Chevron-regeln är RIVEN och ersatt.** Gammal regel ("navigationsrader bär
   inte chevron") revs 2026-07-21 (`task-18.3`). **Gällande regel: chevron
   betyder att raden leder vidare** — 18 px höger, `aria-hidden`, sekundärfärg.
7. **`ADR-064` är inte läst i sin helhet** av utredarna. En variant som
   överväger att bredda `SegmentRule`-schemat **måste läsa den först** —
   repots egen regel om att läsa den styrande ADR:n innan förslaget formuleras.

---

## 7. Funktionsfyndet — bekräftat i fem lager

**Segment är strikt filterbaserade. En handplockad individ går inte att lägga till.**

| Lager | Var begränsningen sitter |
|---|---|
| UI | `SegmentBuilder.tsx` exponerar bara `RadioGroup` över taxonomi-par — ingen personsökning finns i komponentträdet |
| Domänschema | `Segment.schema.ts:21-29` — `{include: Par[], exclude: Par[]}`, ingen `personIds`-gren |
| EF-kontrakt | `parseSegmentRule` validerar strikt; `computeMembership` itererar `Deltaganden` och kvalificerar via mängd-medlemskap — ingen kodväg för en person utan matchande närvarorad |
| Airtable-allowlist | `field-allowlists.ts:151-154` — tre fält, `App-segmentregel` bär samma `{include, exclude}`-JSON |
| Källan | Medlemskap beräknas alltid ur `Närvaropoäng=1` (`ADR-064` beslut 1) |

Att öppna för handplockning är därför **inte en UI-ändring** utan en
`ADR-064`-revision. Passet tar **ställning** — det bygger inte lagret.
