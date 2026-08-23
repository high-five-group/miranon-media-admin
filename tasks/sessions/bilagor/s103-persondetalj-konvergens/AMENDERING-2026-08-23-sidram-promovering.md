# Amendering 2026-08-23 — husets delade SidRam-primitiv ersätter det inline byggda sidkromet (TASK-299.6)

> Denna sidofil finns för att `facit.json` är AGENT-FRUSET: `ADR-104`-hooken
> (`scripts/deny-facit-godkand-skrivning.sh`) nekar varje agent-`Edit`/`Write`
> mot ett manifest vars `godkand` är satt — oavsett om skrivningen rör fältet
> självt. Bokföringen bor därför i en sidofil bredvid manifestet, formen
> kanoniserad i `ADR-102` § Updates 2026-08-22 § A3. `godkand`-fältet i
> `facit.json` är INTE rört av denna commit.

**Yta:** Persondetaljen (`facit.json`s enda `ytor`-post, godkänd 2026-08-12,
citat "godkänner", `sha 4648823a589f86c843ac1f7bc59790df491e461b`; källor
`src/routes/_authenticated/personer/$personId.tsx` och
`src/components/persons/PersonDetail.tsx`).

**Avvikelse:** Sidkromets chevron — en inline byggd
`Link`-från-`@tanstack/react-router` med klass-strängen `mx-4 flex size-11
shrink-0 items-center justify-center self-start rounded-full bg-bg-muted` och
`ChevronLeft` 26 px — är ersatt av husets delade `SidRam`-primitiv
(`src/components/primitives/SidRam.tsx`, TASK-299.1, PRD `TASK-299`
beslut 3+5). `SidRam` renderar SAMMA geometri ur samma klass-sträng och samma
`aria-label "Tillbaka till personer"`; primitivens härkomst-docblock namnger
uttryckligen denna fils `sidRam`-form som en av de sex kopior den lyftes ur.
Dev-växeln `?sidram=ny` (TASK-299.1) — som lät båda formerna leva parallellt
under Marcus mätfönster — är riven i samma landning (`ADR-103` B2 steg 4).
Rubriken lever kvar som sidans egen (PRD `TASK-299` § OMFATTNINGEN LÅST
punkt 2 — bara sidkromet; `SidRam`s rubrik-ägande gren används INTE här).

Till skillnad från de två dialekt-ytorna i `TASK-299.11` (aktivitetshistoriken
och dokumentytan) finns här INGET missalignment att fixa: persondetaljen bar
redan kant-i-kant-dialekten före TASK-299.1 — chevron `mx-4`, rubrikblock
`px-4` — vilket är just varför `SidRam` kunde härledas ur den. Bytet är
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

1. **Pixelmätning (`TASK-299.2`-agenten, 2026-08-23, kortets notes, `#1866`).**
   Ytan renderades med och utan `?sidram=ny` i den hermetiska fixturvärlden på
   desktop (1280×900) och mobil (375×812). Skärmdumparna var **byte-identiska
   (MD5 lika)** i båda vyerna, och chevronens/rubrikens `boundingBox()` låg på
   samma x-position i båda lägena — desktop `left=372/372`, mobil `left=32/32`.
   Noll pixelskillnad är inte en tolkning här, det är ett hashvärde.
2. **Mekaniskt facit (denna landnings egen körning, 2026-08-23).**
   `tests/visual/persondetalj-promoverings-grind.spec.ts` — manifestets
   utpekade mekaniska facit, `ariaSnapshot`-referenserna under
   `tests/visual/__aria__/persondetalj-promoverings-grind.spec.ts/`
   (`persondetalj-rik`/`-tunn` × `visual-desktop`/`-mobile`) — kördes mot
   diffen och gav **8/8 gröna, exit 0, UTAN om-baselinjering**. Referenserna
   fångades ur variant-läget FÖRE flippen och är orörda sedan 2026-08-12;
   grinden jämför struktur plus tillgängligt namn, så en grön körning betyder
   att ingen nod bytt roll, ordning eller namn.

Punkt 2 avgör dessutom `A2`-skärpning 2 uttryckligen: ändringen **tar inte
bort och döper inte om någon nod** — hade den gjort det hade den låsta
`ariaSnapshot`-referensen fällt. Osäkerhetsregeln ("osäkert ⇒ klass (c)")
aktiveras därmed inte: det finns ingen kvarvarande osäkerhet att eskalera.

Detta är alltså en ANNAN klassning än syskonamenderingen i `TASK-299.11`
(samma datum, samma primitiv, klass **(c)**) — och skillnaden är saklig, inte
procedurell: där flyttade innehållskolumnen 16 px och en riktig Lotta såg det;
här flyttar ingenting.

## Vad som INTE är amenderat

- **Manifestets `not`-fält och de sju blocken (B1–B8)** är orörda — formen
  under sidkromet är oförändrad i sin helhet.
- **Bilderna:** manifestet deklarerar `bilder: []`, en avsiktlig frånvaro
  (`check-facit` invariant (b)). Det finns därför inga facit-bilder som kan
  bli en generation bakom. Det MEKANISKA facit — `ariaSnapshot`-referenserna
  — är tvärtom bevisat aktuellt av körningen ovan.
- **`referenser`-nyckeln** deklareras inte av detta manifest — det hör till de
  24 stämplade ytor som `scripts/check-facit.sh` räknade upp som
  icke-innehållslåsta vid denna landnings körning (2026-08-23: 12 manifest,
  27 ytor, 11 låsta referenser). Invariant (d):s hash-lås berörs därför inte
  av denna amendering.
- **Rivningen (`B2` steg 4)** som `not`-fältet beskriver — PROTO_VARIANTS,
  rail-monteringen, `PersonNoteEditor.tsx` — är utförd sedan 2026-08-12 och
  rörs inte här. Det enda som rivits nu är dev-växeln `?sidram=ny`, en
  TASK-299.1-artefakt som aldrig fanns när stämpeln sattes.

## Omstämplings-läge

**Stämpeln behålls — ingen omstämpling behövs** (`ADR-102` § A1 klass (b)).
`godkand`-fältet i `facit.json` rörs INTE av denna agent-commit. Klassningen
är ett agent-FÖRSLAG som bärs av granskningen (`ADR-102` § A2, "vem bär
klassningen"); faller den domen åt andra hållet är rätt åtgärd att lyfta
posten till klass (c) och lämna omstämplingen till Marcus egen `--ersatt`-kanal
(`ADR-104` beslut 1–2), inte att röra fältet här.
