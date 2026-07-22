# ADR-074: Prototyp-substratets adress-struktur och växlar-standard (T80)

- Status: Accepted (Session 76 — 2026-07-22; grillad samsyn S76 Del 3
  [4 beslut, samtliga på Code-rekommendation med Marcus-kvittens, flera
  villkorade "djupt genomtänkt och branschledarmässigt" → research-pass
  per beslut före låsning]; kanonisk samsyns-trail:
  `tasks/sessions/2026-07-22-session-76.md` Del 3)
- Datum: 2026-07-22
- Fas: Session 76 — arbetssätt/dev-verktyg (ingen
  byggfas-status-ändring)

> **Amendering (Session 76 samma dag, 2026-07-22 — Marcus-direktiv i
> TASK-29-granskningen, underkännande #2 på växlarens form →
> L299-lösningsklass-byte; klassad FACIT-REVIDERING med komplett
> direktiv per ADR-071-amenderingens gränstest):** en post;
> beslutstexten nedan bevaras oförändrad (immutabilitet).
>
> 1. **Beslut 2:s UI-form REVIDERAD: hörn-pill + expanderbar panel →
>    dockad, dragbar IKON-RAIL** (Figma/Stripe-klassens verktygsrail;
>    Marcus-direktivet: "side-bar … med ikoner bara och tooltips …
>    fast plats bredvid contentytan men att det går att dra och
>    flytta den"). Formen: vertikal rail, default DOCKAD vid höger
>    kant vertikalt centrerad; endast ikon-knappar med mörka
>    mikro-tooltips (skarpa vyn = öga · variant-bokstäver med
>    steg-badge på aktiv · data-toggle · nytt-fönster) · flyttbar via
>    grip-handtag (position persisteras i `POS_KEY`; dubbelklick
>    dockar tillbaka). Följdrivningar, öppna: pilstegningen ersätts
>    av DIREKTA variant-knappar (bättre än cykling — direktaccess) ·
>    identitetsRADEN ersätts av steg-badge + tooltip (andemeningen
>    "identiteten alltid synlig" består) · `MIN_KEY`-persistensen
>    utgår (railen är permanent minimal — minimal-först-PRINCIPEN
>    består i starkare form). Beslut 2:s tokens-krav och a11y-golv
>    oförändrade. Empirisk bifångst som stärkte bytet: pill-formens
>    "Visa prototyp-växlaren"-knapp kolliderade med appens
>    `/^Visa/`-frånvaro-assertion i e2e (CI-run 29933197540 röd) —
>    rail-formen namnger dev-överlägget utanför appens namn-rymd.
>
> **Amendering 2 (Session 76 samma dag — polervågen på Marcus-
> granskning 2 ["Nu börjar de likna något"] + Codes topp-till-tå-
> pass):** sex förfiningar INOM rail-formen, beslutstexten bevaras:
> grip-handtaget bär ingen tooltip (aria-label räcker) · EN variant i
> familjen renderas som PROTOTYP-IKON (kolv) i stället för kryptisk
> bokstav — "vad betyder K?"-fyndet; bokstäver endast när flera
> varianter kräver särskiljning; URL-korrelationen bor i tooltipen ·
> tooltips alltid NORMALVIKT (ärver aldrig aktiv knapps fetstil) ·
> KONSTANT rail-höjd: data-knappens plats reserveras alltid
> (soft-disablad utan aktiv variant — höjd-hopp förbjudna) · tooltips
> SIDFLIPPAR nära vänsterkanten (klipp-resten stängd) ·
> TANGENTBORDS-flytt på grippen (pilar nudgar, Home/Escape dockar —
> a11y-paritet med pointer-draget) + fokus-ring via
> `--color-border-focus`-tokenet.

T80 föddes S75 Del 8 (Marcus review-våg 1): `?variant`-konventionen var
odokumenterad i specs (URL-STATE-SPEC saknade den; ADR-044 täcker endast
/dev-ytorna; auktoritativ text bodde i kod-kommentarer +
prototype-skillen) och växlaren upplevdes ful/okonsekvent.
Problem-bilden verifierades till fem smärtor (S76 Del 3, Marcus-kvittens
"Definitivt A"): växlarens utseende/placering (S73 K59 "växlaren är i
vägen") · adress-inkonsekvensen (alias-hacket: listans K→A, detaljsidans
A/B→K) · steg ej adresserbara · jämförelse = växla-fram-och-tillbaka ·
omuppfinnande per familj. Kod-forensiken fann alias-mekanikens rotorsak:
vinnarens OMDÖPNING till "K" vid konvergensen.

Research per T80-radens mandat (FÖRE design): Storybook (stabila
story-ID:n + query-tillstånd som delnings-kontrakt) · Histoire
(varianter URL-navigerbara; param-formen odokumenterad — tunt precedent
öppet deklarerat) · Vercel Toolbar (minimal-först hörn-widget;
dev-tillstånd som delbart tillstånd) · Chromatic/Applitools (jämförelse
= snapshot-diff av tagna lägen) · Polypane (live-sida-vid-sida bor i
betraktnings-lagret/panes, inte i appen) · preview-environment-praxisen
(URL-delning som review-primitiv). Källänkar: S76 Del 3.

18.13 river event-familjens prototyp-INSTANSER; PrototypeSwitcher är
stående delad dev-komponent och består — beslutet gäller det PERMANENTA
arbetssättet för kommande familjer/produkter.

## Beslut

1. **Adress-strukturen: query-tillstånd på riktiga routes, stabil
   nyckelrymd.** `?variant=` + `?data=` via nuqs på RIKTIGA routes
   består (UI-underform A orörd — riktig auth/datahämtning är
   prototyp-modellens kärna och skälet ADR-044 valde bort Storybook).
   Nyckelrymden standardiseras: divergens-varianter får stabila nycklar
   `a`/`b`/`c`; VINNAREN BEHÅLLER SIN NYCKEL genom konvergensen (ingen
   K-omdöpning — rotorsaks-fixen som dödar alias-behovet framåt);
   nyckelschemat är konsekvent över familjens alla ytor (familje-flödet
   bär värdet utan översättning); aliaser är enbart legacy-inmappning
   för historiska URL:er, aldrig för nya pass. Steg adresseras INTE i
   URL:en — branschen adresserar endast det monterade; frysta stegs hem
   är snapshot-artefakterna (beslut 3).
2. **Växlar-standarden: minimal-först hörn-widget
   (Vercel-Toolbar-formen).** Default är minimerad hörn-pill nere höger
   ovanför bottom-naven — aldrig bottom-center över innehållet (dagens
   expanderad-default inverteras; S73 K59 + Marcus eget
   minimerings-beteende är empirin). Minimal-läget bär
   ‹ ›-pilstegning genom varianterna + aktiv nyckel/steg-badge;
   expanderad panel (opt-in, localStorage-minnet består) behåller
   chips + identitetsrad + data-växel, stylad med designsystemets
   tokens i stället för den massiva svarta plattan. A11y-golvet består
   (aria-pressed/labels). Inga kortkommandon nu — läggs vid empiriskt
   behov, inte "ifall".
3. **Jämförelse-formen: snapshot-par kanoniskt + fönster-lagret för
   live.** Varje fryst steg får skärmdump-par i sessionens bilagor
   enligt standardiserad namnkonvention (S72-praxisen FORMALISERAD, ej
   ny mekanik; tas i prototyp-takt via L304-formen — fristående
   Playwright, credentials-fritt). Live-sida-vid-sida görs i
   FÖNSTER-LAGRET via växlarens "öppna i nytt fönster"-handling (samma
   route, vald variant) — branschmönstret: Chromatic snapshot-diff,
   Polypane panes, preview-URL-delning. INGEN /dev/compare-iframe-route
   — deferred öppet; re-trigger: konvergens-pass som empiriskt faller
   på två-fönster-formen.
4. **Hemvist och leverans.** URL-STATE-SPEC bär dev-parameter-sektionen
   (konventionens spec-hem — luckan som födde T80 stängd);
   prototype-skillen (hub) bär arbetssätts-formen (identitetsmodellen,
   nyckel-livscykeln, snapshot-par-standarden, komponent-hänvisningen —
   T78 b, tas i S76:s hub-bunt). PrototypeSwitcher förblir stående
   delad dev-komponent (DEV-grindad, EJ 11/11/11-produktbiblioteket).
   Ombyggnaden till beslut 2–3 exekveras som kort **TASK-29** via
   do-work-substratet (byggbar spec → kort; aldrig inline förbi
   leverans-grindarna).

## Alternativ som övervägdes

- **Path-baserad dedikerad dev-yta** (`/dev/proto/<familj>/<variant>`)
  — avvisad: river UI-underform A (riktiga routen med riktig
  auth/data); Storybook-mönstrets lärdom är stabila nycklar +
  query-tillstånd, inte path-formen.
- **Steg-adressering i URL:en** — avvisad ärligt: kräver att alla steg
  hålls monterade, mot throwaway-kontraktet; branschen adresserar
  endast monterat; historikens hem är snapshot-arkivet
  (Chromatic-modellen).
- **/dev/compare-iframe-route** — avvisad nu: spekulativ komplexitet
  över golvet (auth/SW/viewport-strul; inget ledar-precedent för
  in-app-två-upp — Polypane la jämförelsen i browser-lagret); deferred
  med öppen re-trigger (beslut 3).
- **Expanderad-default med enbart omstyling** — avvisad: behåller
  "i vägen"-felet som empirin redan falsifierat.
- **Storybook + Storybook-MCP** — ej aktuell: MCP:n är gränssnitt TILL
  en Storybook-instans; ADR-044:s avvisande står med ordagrann
  ompröv-trigger ("om primitiverna paketeras som fristående Mm
  Component Library") — vid den triggern tas Storybook + MCP i samma
  vågskål (bokfört S76 Del 3). Besläktat bibliotekslager-spår: Claude
  Design/DesignSync (T83) — samma horisont, rör ej
  prototyp-substratet.

## Konsekvenser

- **TASK-29** (växlar-ombyggnaden) född `ready-for-agent` ur beslut
  2–3; exekverings-tillfället är Marcus val (egen do-work-order eller
  batch-inkludering).
- URL-STATE-SPEC §Dev-parametrar skriven i samma commit;
  prototype-skillens T78 b-uppdatering går i S76:s hub-bunt (T78 b +
  T81-referensraden + T82-flaggorna = ETT plugin-bump-moment).
- Kommande familjers pass ärver formen utan omuppfinnande;
  alias-mekaniken fryser som legacy.
- **Ärlig gräns:** två-fönster-jämförelsens tillräcklighet är obevisad
  tills nästa konvergens-pass — re-triggern är öppen och rivs öppet om
  empirin faller.

## Referenser

- `tasks/sessions/2026-07-22-session-76.md` Del 3 (kanonisk trail,
  inkl. research-källänkarna).
- Tråd-registret: T80 (spåret) · T78 (växlar-standardiseringen, b-delen
  hub) · T83 (Claude Design/bibliotekslagret).
- ADR-044 (dev-ytor + Storybook-avvisandet med ompröv-trigger) ·
  ADR-071/073 (kort-substratet + tvåstegs-stängningen).
- `src/components/dev/PrototypeSwitcher.tsx` (T78 a-komponenten) ·
  prototype-skillen (hub, `plugins/marcus-system/skills/prototype/`).
