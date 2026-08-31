# Amendering 2026-08-31 — Startvyns SidRam + MessageBox-konvertering (TASK-349)

## Skäl för sidofilen

`facit.json` i den här katalogen är **stämplat** (`godkand.av: marcus`,
`godkand.datum: 2026-08-16`, sha `a40f3543670f0de310d27542241128b4b5242ea3`)
och därmed agent-fryst av `ADR-104`-hooken
(`scripts/deny-facit-godkand-skrivning.sh`) — en agent kan aldrig skriva om
manifestet, inte ens ett fält som inte rör `godkand`. Bokföringen av en
ändring mot ett stämplat facit bor därför i en SIDOFIL bredvid manifestet,
per `ADR-102` § "Amenderingsmekaniken för ett STÄMPLAT facit" (2026-08-22)
och dess kanoniska form (§ A3).

## Yta / berört manifest

`tasks/sessions/bilagor/s104-segment-divergens/facit.json`, ytan
**`segment-listan`** (startvyn `SegmentLista` i
`src/components/segment/prototyp/VariantD.tsx`) — samt, i mindre grad, de
fem ytor vars interna "tillbaka"-chevron konsolideras till samma primitiv
(se § Avvikelse nedan): `segment-detaljvyn`, `verkstaden`,
`nytt-segment-mallvyn`, `generatorn`, `utskicksvyn`. `tackningsvyn` är
nästlad inuti `segment-listan` och berörs inte separat.

Manifestet stämplades 2026-08-16/17 med citatet *"Godkänd mot facit
2026-08-17"*.

## Avvikelse

Två separata förändringar, landade i samma skiva (`TASK-349`):

1. **`segment-listan` FÅR HUSETS SIDRAM (ny, prod-synlig navigering).**
   Startvyn saknade helt tillbaka-navigering till Mer-menyn — filen bar
   bara en lokal `SidRam`-funktion vars `onTillbaka`-gren användes internt
   av de andra sex ytorna; startvyns eget grenval (ingen `onTillbaka`-prop
   given) föll till en `<Link to="/mer">`, men `SegmentLista` anropade
   ALDRIG den lokala `SidRam`-funktionen alls — dess `<section>` var en
   rå `<header>`-wrapper utan chevron. En chevron (`<SidRam to="/mer"
   tillbakaEtikett="Tillbaka till Mer" />`, husets delade primitiv,
   `ADR-126`) finns nu där ingen fanns förut.

2. **Info-texten under `<h1>Segment</h1>` blir en KRYSSBAR `MessageBox
   intent="info"`.** Texten var en ren `<p className="text-small
   text-text-muted">` utan chrome. Den bär nu `MessageBox`s ram (vänster
   accentkant, tonad bakgrund, padding) och ett synligt kryss
   (`onDismiss`, KRYSS-REGELN i `MessageBox.tsx`) som avfärdar rutan och
   minns valet per enhet (`localStorage`, `segment-startinfo-minne.ts`).
   Texten själv är oförändrad, ord för ord — det är endast INRAMNINGEN och
   avfärdningsmöjligheten som är nya.

3. **Konsolidering (fem ytor): lokal `SidRam`-kopia → husets
   `SidRamKnapp`.** `segment-detaljvyn`, `verkstaden`,
   `nytt-segment-mallvyn`, `generatorn` och `utskicksvyn` (två
   `SidRamKnapp`-anrop, mutuellt uteslutande grenar) bytte sin
   `onTillbaka`-chevron från den lokala `SidRam`-funktionen (klasserna
   `mx-4 flex size-11 … hover:bg-bg-emphasized motion-safe:transition-
   colors`, topp-luft via sektionens `pt-2 lg:pt-10`) till husets
   `SidRamKnapp` (delad `CHEVRON_KLASS`, topp-luft `mt-2 lg:mt-10` på
   själva chevronen i stället för padding på sektionen). Detta ÄR en FLYTT
   (`ADR-126` B4) — geometrin är matematiskt samma offset (margin-top på
   flex-barn kollapsar inte i en `flex-col`, samma princip
   `primitives/SidRam.tsx`s docblock citerar för `PersonDetail`/
   `EventCheckin`s redan genomförda migrering) — men husets `CHEVRON_KLASS`
   saknar `hover:bg-bg-emphasized motion-safe:transition-colors`, vilket
   redan är det etablerade, skarpt levererade beteendet för primitivens
   ~tio andra konsumenter (Intresserade, Waitlist, PersonDetail, m.fl.) —
   ingen ny avvikelse introduceras här, ytorna blir bara konsekventa med
   resten av huset.

## Klassning: (c) — utskriven, med mätning

`ADR-102` § A2 testet: *"Påverkar ändringen vad en användare ser i prod?"*

- Punkt 1 (ny chevron) och punkt 2 (MessageBox-inramning + kryss) svarar
  **Ja, otvetydigt** — nya, tidigare obefintliga interaktiva element
  (en länk och en avfärda-knapp) syns nu på en yta där de inte fanns.
  Detta är per definition en UTVIDGNING av formen (`ADR-102` § A4), inte en
  motsägelse inom en redan låst form — B1 ("vid motsägelse vinner
  prototypen") gäller därför inte här; A4 pekar direkt på klass (c).
- Punkt 3 (fem interna chevron-konsolideringar) är i sig en KANDIDAT för
  klass (b) — mätt nettonoll geometrisk skillnad, med precedent
  (persondetalj/check-in-migreringen). Den bokförs ändå under samma
  sidofil och samma klassning som punkt 1–2, eftersom hela ändringen landar
  i EN skiva mot SAMMA manifest och A2:s regel är entydig: **"Osäkert ⇒
  klass (c)"** — att dela upp en och samma landning i två klassningar hade
  krävt två sidofiler för en ändring som Marcus redan bedömt som en enhet
  (se nedan).

**Marcus har redan gett den underliggande auktorisationen** för HELA denna
skiva — sessionsdok `tasks/sessions/2026-08-31-session-114.md` § Del 1,
Marcus scope-kvittens (*"Kvitterar."*, 2026-08-31), Våg A punkt 2, verbatim:

> *"Segment-startvyn får husets `SidRam` (tillbaka till Mer) + info-texten
> under h1 byts till kryssbar `MessageBox intent="info"`;
> `VariantD.tsx`:s lokala SidRam-kopia konsolideras bort. Facit-stämplad
> yta → ADR-102-amenderingsmekaniken."*

Detta är den skrivna Marcus-grund `ADR-102` § A2 kräver för en klass
(c)-motivering ("en agent avgör detta ALDRIG själv" — bärs här av
orkestrerarens/Marcus egen scope-kvittens, inte av agentens eget omdöme).

## Vad som INTE är amenderat

- `segment-listan`s och de fem andra ytornas ÖVRIGA form är orörd —
  knapprad, kort, villkor, publiklista, utskicksgrammatik: allt annat
  DOM-innehåll under respektive `data-testid`-scope är byte-identiskt
  (bevisat mekaniskt, se § Referens nedan).
- `tackningsvyn` (nästlad i `segment-listan`) är helt oberörd.
- Filens READ-ONLY-förstärkning (no-op-mutationer `saveSegment`/
  `sendEmail`/testmail, docblock ~rad 210) är INTE ändrad.
- Inga beteendeskillnader i de interna vy-bytena (`onTillbaka`-funktionerna
  själva är oförändrade — bara vilken komponent som renderar chevronen).

## Omstämplings-läge

**Klass (c): `godkand`-fältet rörs INTE av denna commit.** Ingen agent
skriver till ett stämplat manifest (mekaniskt hindrat av
`deny-facit-godkand-skrivning.sh` under alla omständigheter). Manifestets
stämpel (`av: marcus`, `datum: 2026-08-16`, sha `a40f3543…`) står kvar
oförändrad och gäller den ÖVRIGA, orörda formen. Vill Marcus omstämpla för
att uttryckligen bekräfta den nya formen (chevron + MessageBox) sker det
via hans egen kanal — inte via denna sidofil eller denna agent.

## Referens + hash

Ingen av de sju ytorna i detta manifest deklarerar nyckeln `referenser`
(mätt: `grep -c '"referenser"' facit.json` → 0 träffar) — manifestet
tillhör den täckningslucka `ADR-102` § "Täckningsluckan i invariant (d)"
(2026-08-28) namnger men medvetet INTE fäller på (`FACIT_VARNA_
ODEKLARERAD_REFERENS`, `.facit-policy.conf`). Det finns alltså inget
låst hash-par att uppdatera här.

Det MEKANISKA facit för denna yta är i stället promoverings-grindens
`ariaSnapshot`-referenser (`tests/visual/__aria__/segment-promoverings-
grind.spec.ts/*.aria.yml`, `TASK-249.1`). De är **oförändrade av denna
skiva** — `git status --porcelain tests/visual/` visar noll rader efter
körningen nedan, och samtliga 14 tester (7 ytor × 2 viewports) är gröna:

```
npx playwright test --project=visual-desktop --project=visual-mobile \
  tests/visual/segment-promoverings-grind.spec.ts
# 14 passed
```

Skälet är strukturellt, inte tur: varje `toMatchAriaSnapshot()`-anrop
scopar till `page.getByTestId(<yta>)`, och SidRam/SidRamKnapp-chevronen
(liksom `<header>` och den nya `MessageBox`) renderas som en SYSKON-nod
FÖRE respektive testid-div — aldrig som ett barn av den. Ändringen ligger
alltså helt utanför vart och ett av de sju scopen, vilket är samma
strukturella avgränsning `TASK-249.1`s spec-fil redan dokumenterar för
`PrototypRigg`/`SkalprovsVaxel`.
