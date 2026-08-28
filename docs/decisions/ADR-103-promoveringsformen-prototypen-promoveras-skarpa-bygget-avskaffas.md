# ADR-103: Promoveringsformen — prototypen promoveras, det skarpa bygget avskaffas

- Status: Accepted (grillad samsyn S93 sjunde resumen, 2026-08-08 — sex
  kvitterade beslut, kanonisk trail: `tasks/sessions/archive/2026-08/2026-08-02-session-93.md`
  Del 12; Marcus polval-kvittensen verbatim: *"Jag är med dig på A"*)
- Datum: 2026-08-08
- Fas: Session 93 — processform (ingen byggfas-status-ändring)

## Kontext

`ADR-102` slog fast att prototypen ÄR facit och att skarpa ytan ska vara
identisk — men lämnade formen för HUR öppen. Processauditen (Marcus order
2026-08-07: *"full audit på hela processen … grilla varje lösning på varje
rotorsak"*) byggde därefter fyra axlar: rotorsaks-verifieringen (R1–R9
adversarialt prövade), tidslinjen (56 poster, transkript-utvidgad),
First principles-dekonstruktionen (ramaxeln) och branschreferensen
(RP1–RP3). Samlat underlag:
`docs/research/processaudit-syntes-och-grillningsunderlag-2026-08-08.md`
(Del 5 bär integrationen och forken).

Auditens avgörande fynd: vår dåvarande form — konvergens till godkänd
slutform + prototyp samlokaliserad i skarpa kodens filer + ÅTERBYGGE av
samma yta + PNG som spec-bärare — har **noll branschprecedent**. Den var
ingen beslutad helhet utan en obeslutad kombination av `ADR-074`:s
divergens-val och `/prototype`-skillens throwaway-kontrakt. Varje
översättningshopp i kedjan prototyp→bilder→PRD→AC→agent→kod läckte mätbart
(sex spec-fel, *"bilderna finns inte i repot"*, F43/F56), och "skarpa
bygget" byggde aldrig något: netto **−134 rader** `src/` över sex skivor.

Forken stod mellan två branschbelagda poler. **Pol A** (Vercel v0-klassen):
behåll konvergensfasen till slutform och PROMOVERA prototypen. **Pol B**
(Pococks modell): skala ner prototypen till fråge-besvarare, parkera den på
egen gren, bygg skarpa från spec med bevis-loop. Pococks skäl att kalla
promovering ett antimönster — prototypens låga kvalitet — är inte
tillämpligt här: våra prototyper byggs av produktionskomponenter i
produktionskodbasen mot designsystemet, så promovering släpper inte in
främmande kod utan flippar vilken gren av redan landad produktionskod som
är den ovillkorliga. T66-konvergensfasen (vår egen konstruktion, inte
Pocock-arv) är kärnan i Marcus arbetsform — 20+ iterationsvågor till
*"Jag är nöjd. Lås som facit"* är formgivning till slutform, och
processen ska tjäna den, inte amputera den.

## Beslut

**B1. Polvalet: Pol A — promovering.** "Det skarpa bygget" avskaffas som
begrepp. Den godkända prototypen byggs aldrig om; den promoveras.
Identitet mellan prototyp och produktion blir en STRUKTUR som inte kan
brytas, i stället för ett mål som ska verifieras i efterhand.

**B2. Promoveringsordningen** (ersätter `ADR-102` B4:s sekvens):

1. Prototypens form promoveras — villkoret flippas så variant-formen blir
   den ovillkorliga; skarpas DATAVÄGAR behålls (det `protoDataMode` styr
   är datakälla, inte form — distinktionen bevaras).
2. Marcus granskar den promoverade ytan — facit-bilderna byter roll från
   spec till REGRESSIONSSTÖD för granskningen.
3. Marcus godkänner.
4. Flaggan/variant-koden rivs mekaniskt — det som rivs är villkor och
   växlar, aldrig formen. `ADR-102` B3:s spärr (ingen rivning före
   godkännande) vaktar detta steg oförändrad.

**B3. Flaggformen för framtida prototyper: O3-hybrid med tvålagrig
mekanisering.** (1) EN central läspunkt per yta — variant-beslutet fattas
på ett ställe, aldrig fläckvis (Fowlers "Inversion of Control"; dagens
127 spridda förekomster över 8 filer är antimönstret litteraturen varnar
för). (2) Lager 1, build-time: läspunkten står bakom
`import.meta.env.DEV` — prototypgrenar är strukturellt onåbara i
produktionsbygget (`EventDetail.tsx:284`-klassen kan inte uppstå igen).
(3) Lager 2, referens-scanning: en grind räknar prototyp-markörer mot
manifestet så en halv rivning eller kvarglömd flagga fäller rött.
`ADR-074`:s live-växlingsvärde behålls fullt ut — spridningen dör, inte
växlaren. Formen gäller från NÄSTA prototyp; A1–A6-promoveringen
refaktorerar inte dagens form (den rivs i B2 steg 4).

**B4. Bevismekanismerna.** Promoverings-grinden: ett `ariaSnapshot`-par
per yta (variant-läget FÖRE flippen mot promoverad yta EFTER; fäller på
varje skillnad — deterministisk, noll nya beroenden). Utförarens uppdrag
bär bevis-loopen som arbetsform (skärmdump → jämför → lista skillnader →
fixa; körningen lämnar spår, inte en bock). Regressionslåset: efter
Marcus godkännande tas visual-baslinjen om på den godkända ytan via
CI-artefakt. Eskaleringsväg, bokförd: tvåfönster-diff av
BackstopJS-klassen (O1) tas in OM `ariaSnapshot` empiriskt missar
form-skillnader — eskalering på evidens, inte misstanke. Struktur enligt
branschens egen: mekaniken fäller ATT ytor skiljer sig; Marcus öga avgör
VILKEN som är rätt.

**B5. Apparatens gräns: HITL/AFK per fas — inte storlekströsklar.**
Divergens + konvergens (formen itereras mot Marcus öga) är HITL: Marcus +
Code direkt mot dev-servern i sekund–minuttempo, ingen skiva, inget kort,
ingen agent-spawn per våg. Promovering + härdning (flippen, datakoppling,
a11y, tester, städ) och landning är AFK: apparaten, med
promoverings-AC + B4:s grindar. Vid varje fas-gräns gäller
*"Continue costs nothing"* — fortsätt i sittande läge prövas FÖRST.
Empirin: iterationsvågorna fungerade direkta (20 vågor på timmar) och
havererade genom apparaten (150 min/skiva, 500–620k tokens).

## Vad som INTE beslutas här

- **Godkännande-mekaniken** (`godkand`-fältet ska bära Marcus faktiska
  kvittens, inte självbetjäning) — AVGJORD 2026-08-08:
  [`ADR-104`](ADR-104-godkannande-mekaniken-kanalseparation.md)
  (G2-grillningen, S93 Del 14 — kanalseparation).
- **Stale-dok-vakten och parallellsessions-friktionen** (K1/K6, F55) —
  G6-grillningen.
- **Fork-subagentformens ekonomi** — omätt; eget mätkort före vidare
  G5-förfining. `T134`:s 3×-mätning mätte spawn-från-noll, inte fork.
- **Storybook-vägen som biblioteksnivå-evolution** (FP väg 2) — vilande
  mot `ADR-044`:s ompröv-trigger; rör inte prototyp-processen.

## Konsekvenser

- `A1`–`A6` skivas om som PROMOVERINGS-skivor (flip + härdning + B4-bevis),
  inte återbyggen; åtgärds-ytan får därmed sitt ägande kort (R9-luckan).
- `TASK-145.6` omdefinieras: från "riv prototypen" till "riv flaggan efter
  godkänd promovering" (B2 steg 4).
- `145.3`/`145.5` DoD #6 skrivs om till *"baslinje omtagen EFTER godkänd
  promovering"* — dagens lydelse styr mot en åtgärd som inget bevisar.
- `EventDetail.tsx:284`-härdningen (DEV-grind) ingår i promoverings-vågen.
- `facit.json`-manifestet utvidgas (registret saknas) så B3 lager 2 och
  rivningsspärren täcker ytorna där avvikelserna faktiskt sitter.
- `ADR-102` och `ADR-074` amenderas med pekare hit (B4-ersättningen
  respektive framtida flaggform). `ADR-102` B1 ("prototypen ÄR facit")
  FULLBORDAS av denna form; B2:s identitetskrav uppfylls numera
  strukturellt.
- Hub-arbete, separat commit: `/prototype`-skillens UI-gren byter
  throwaway-kontrakt mot promoveringskontrakt; termen *promovering* lyfts
  till `SYSTEMET.md` §0 vid nästa hub-sync.

## Referenser

- `docs/research/processaudit-syntes-och-grillningsunderlag-2026-08-08.md`
  (fyra-axlars-syntesen; Del 5 = forken) samt de sex underlagsfilerna den
  kartlägger (tidslinjen, R1–R6, R7–R9, FP-dekonstruktionen, RP1–RP3).
- `ADR-102` (facit-principen) · `ADR-074` (adress-struktur/växlare) ·
  `ADR-044` (Storybook-avvisandet med ompröv-trigger).
- `tasks/sessions/archive/2026-08/2026-08-02-session-93.md` Del 12 (grillnings-trail med
  samtliga sex kvittenser).
