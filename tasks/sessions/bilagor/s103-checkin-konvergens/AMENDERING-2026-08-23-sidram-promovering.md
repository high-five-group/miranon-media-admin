# Amendering 2026-08-23 — husets delade SidRam-primitiv ersätter det inline byggda sidkromet (TASK-299.6)

> Denna sidofil finns för att `facit.json` är AGENT-FRUSET: `ADR-104`-hooken
> (`scripts/deny-facit-godkand-skrivning.sh`) nekar varje agent-`Edit`/`Write`
> mot ett manifest vars `godkand` är satt — oavsett om skrivningen rör fältet
> självt. Bokföringen bor därför i en sidofil bredvid manifestet, formen
> kanoniserad i `ADR-102` § Updates 2026-08-22 § A3. `godkand`-fältet i
> `facit.json` är INTE rört av denna commit.

**Yta:** Check-in / dörrlistan, variant D (`facit.json`s enda `ytor`-post,
godkänd 2026-08-14, citat "Toppen! Nu vill jag stämpla och promovera denna,
det blir toppen!", `sha c7db8b1606831014393489a389aad44f5d57e969`; källor
`src/components/events/EventCheckin.tsx` och
`src/routes/_authenticated/event/$eventId/narvaro.tsx`).

**Avvikelse:** Sidkromets chevron — som manifestets `not`-fält beskriver som
"husets sidkrom (44 px rund chevron + rubrik text-3xl på sidRam-platsen)",
byggd INLINE i `EventCheckin.tsx` som en `Link`-från-`@tanstack/react-router`
med klass-strängen `mx-4 flex size-11 shrink-0 items-center justify-center
self-start rounded-full bg-bg-muted` och `ChevronLeft` 26 px — är ersatt av
husets delade `SidRam`-primitiv (`src/components/primitives/SidRam.tsx`,
TASK-299.1, PRD `TASK-299` beslut 3+5). `SidRam` renderar SAMMA geometri ur
samma klass-sträng och samma `aria-label "Tillbaka till eventet"`; primitivens
härkomst-docblock namnger uttryckligen `EventCheckin.tsx` (chevron `mx-4`) som
en av de sex kopior den lyftes ur. Dev-växeln `?sidram=ny` (TASK-299.1) —
som lät båda formerna leva parallellt under Marcus mätfönster — är riven i
samma landning (`ADR-103` B2 steg 4). Rubriken `<h1>Check-in</h1>` och
eventidentitets-raden lever kvar som sidans egna (PRD `TASK-299` §
OMFATTNINGEN LÅST punkt 2 — bara sidkromet; `SidRam`s rubrik-ägande gren
används INTE här).

Till skillnad från de två dialekt-ytorna i `TASK-299.11` (aktivitetshistoriken
och dokumentytan) finns här INGET missalignment att fixa: dörrlistan bar redan
kant-i-kant-dialekten före TASK-299.1 — chevron `mx-4`, innehållsblocken
`mx-4` — vilket är just varför `SidRam` kunde härledas ur den. Bytet är
IMPLEMENTATION utan form.

**Marcus-grunden** (`TASK-299.2` Implementation Notes, 2026-08-22, citerad i
`TASK-299` § OMFATTNINGEN LÅST): ytaxeln — *"jag tycker vi ska köra full
omfattning"* — den delade sidramen bärs av alla ytor. Ägandeskapsaxeln —
*"Jag står vid dina rekommendationer på alla punkter"*, svar på frågan "Bara
sidkromet eller rubrik-blocket också?" — bara sidkromet, rubriken lever kvar
i sidan. Samma beslut bär PRD `TASK-299` beslut 3 (sidramen blir kant-i-kant)
och beslut 5 (bredden mätningsberoende, nu låst).

## Klassning: **(b)** — formen är OFÖRÄNDRAD, ändringen är ett källbyte

`ADR-102` § A2 steg 2: **påverkar ändringen vad en användare ser i prod?**

**Nej — och mätningen som säger varför finns i två oberoende former.**

1. **Geometrimätning (`TASK-299.2`-agenten, 2026-08-23, kortets notes,
   `#1866`).** Ytan renderades med och utan `?sidram=ny` i den hermetiska
   fixturvärlden på desktop (1280×900) och mobil (375×812). Chevronens och
   rubrikens `boundingBox()` låg på **samma x-position i båda lägena** —
   desktop `left=376/376`, mobil `left=36/36` — och de två lägena var
   visuellt identiska vid granskning sida vid sida.
2. **Mekaniskt facit (denna landnings egen körning, 2026-08-23).**
   `tests/visual/dorrlista-promoverings-grind.spec.ts` — promoverings-grinden
   vars `ariaSnapshot`-referenser fångades ur variant-läget FÖRE flippen
   (`ADR-103` B4) — kördes mot diffen och gav **26/26 gröna, exit 0, UTAN
   om-baselinjering**, inklusive sex axe-svep och de tre kvalitetsribbe-lägena
   (`prefers-contrast: more`, `prefers-reduced-motion`, print). Grinden
   jämför struktur plus tillgängligt namn, så en grön körning betyder att
   ingen nod bytt roll, ordning eller namn.

Punkt 2 avgör `A2`-skärpning 2 uttryckligen: ändringen **tar inte bort och
döper inte om någon nod** — hade den gjort det hade den låsta
`ariaSnapshot`-referensen fällt. Osäkerhetsregeln ("osäkert ⇒ klass (c)")
aktiveras därmed inte.

**En observation ur mätningen som medvetet INTE höjer klassningen, bokförd
öppet i stället för bortvald:** till skillnad från persondetaljen (där
skärmdumparna var MD5-identiska) skilde sig dörrlistans skärmdumpar på
enstaka bytes mellan de två lägena, trots identisk `boundingBox` och identisk
visuell granskning. `TASK-299.2`-agentens bedömning — som denna post ansluter
sig till — är att det är dev-only brus (React Query/TanStack Devtools-badgen,
samma artefaktklass som `s102`- och `s106`-faciten redan dokumenterar), inte
en layoutskillnad. Det är också precis den situation `ADR-102` § A2
skärpning 1 beskriver: en skillnad som kommer ur testmiljön och inte ur prod.
Beviset som bär klassningen är därför punkt 2, det mekaniska facit — som per
konstruktion är immunt mot den brusklassen — inte pixeljämförelsen.

Detta är alltså en ANNAN klassning än syskonamenderingen i `TASK-299.11`
(samma datum, samma primitiv, klass **(c)**) — och skillnaden är saklig, inte
procedurell: där flyttade innehållskolumnen 16 px och en riktig Lotta såg det;
här flyttar ingenting.

## Vad som INTE är amenderat

- **Manifestets `not`-fält** är orört i sak: framstegskortets höjdlås,
  sessionsvalet, söket, arbetslistan, den etikettlösa kryssrutan,
  kvittensfönstret på 1,2 s, klargruppen, tint-hörnen och meta-raden är alla
  oförändrade. Avvikelsen är avgränsad till sidkromets IMPLEMENTATION.
- **Facit-bilderna** (`slutlage-desktop.png`, `slutlage-mobil.png`) förblir
  korrekta referenser: chevronens position är oförändrad (mätt ovan), så de
  är INTE en generation bakom — till skillnad från `s106`- och
  `s102`-bilderna i `TASK-299.11`, där kolumnmarginalen faktiskt flyttade.
- **`referenser`-nyckeln** deklareras inte av detta manifest — det hör till de
  24 stämplade ytor som `scripts/check-facit.sh` räknade upp som
  icke-innehållslåsta vid denna landnings körning (2026-08-23: 12 manifest,
  27 ytor, 11 låsta referenser). Invariant (d):s hash-lås berörs därför inte
  av denna amendering.

## Omstämplings-läge

**Stämpeln behålls — ingen omstämpling behövs** (`ADR-102` § A1 klass (b)).
`godkand`-fältet i `facit.json` rörs INTE av denna agent-commit. Klassningen
är ett agent-FÖRSLAG som bärs av granskningen (`ADR-102` § A2, "vem bär
klassningen"); faller den domen åt andra hållet är rätt åtgärd att lyfta
posten till klass (c) och lämna omstämplingen till Marcus egen `--ersatt`-kanal
(`ADR-104` beslut 1–2), inte att röra fältet här.
