# S87-spaningen — nio läsande agenter, rådata

> **Proveniens:** Marcus lade 2026-07-25 fram åtta frågor/funderingar plus en
> önskan att starta bygget av Check-in-sidan, Personer-vyn och persondetalj.
> I stället för åtta separata sessioner kördes **ett läsande spanings-pass**:
> nio subagenter med strikt read-only-mandat, en per fråga plus en för
> bygg-spåret. Rapporterna nedan är agenternas **oredigerade returer**.
>
> **Drift:** 9/9 agenter, 0 fel, ~15 min väggklocka, 483 verktygsanrop,
> ~1,38 M subagent-tokens.

## Varför rådata ligger kvar i repot

Rapporterna bär **fil:rad-, commit- och PR-belägg för varje påstående**. Att
kasta dem skulle betyda att varje slutsats måste återverifieras från noll —
en spaning kostar ~1,4 M tokens att köra om. Destillatet (S87 Del 1 +
sessionsdok S86 Del 4) bär slutsatserna; dessa filer bär beviskedjan bakom
dem. Samma logik som Pocock-korpusen: destillat för läsning, råmaterial för
verifiering.

Katalogen ligger utanför båda prosa-grindarna — markdownlint-globben är
`tasks/sessions/*.md` (enkel stjärna) och `.vale.ini` har
`[tasks/sessions/**/*.md]` med tom `BasedOnStyles`. Ingen lint-exkludering
behövde läggas till.

## Läsvarning — rapporterna är INTE facit

Agent-utfall är **hypoteser tills de verifierats mot disk**. Tre påståenden
korsverifierades manuellt före användning (frontend-deployens frånvaro ·
Personer-ytornas existens · L340:s vänte-form) — de bar. Minst två fynd i
rapporterna visade sig **felaktiga eller internt motsägelsefulla** vid
granskning:

- **a3** rekommenderade lychee-exkludering i `ci.yml` för
  arkitektur-konversationen och skrev samtidigt att "lychee-risken är noll".
  Verifierat: doket har **0 URL:er och 0 relativa länkar** → ingen
  ci.yml-ändring behövs. Den enda högrisk-ytan i landningen försvann.
- **a2** läste T85:s sekvenslåsning som spärr mot allt vidare arbete.
  Ordagrant undantar låsningen **produktarbete** (`T85-riskanpassad-ci.md:85–91`:
  *"Nattbygget blockeras inte: produktarbete = den 'normala drift'
  eftergranskningens punkt 9 efterfrågar"*). Den binder bara T86-beslutet och
  vidare CI-utbyggnad.

Läs dem som väl underbyggda utredningar, inte som beslut.

## Innehåll

| Fil | Fråga | Kärnfynd |
|---|---|---|
| [a1-instant-routes-adr.md](a1-instant-routes-adr.md) | Borde "Routes"-ADR:n mintas nu? | **Nej** — baren nås inte (villkor 1 faller, inga nya konsumenter). Men `URL-STATE-SPEC` är föråldrad och tre route-beslut bor i tre hemvister |
| [a2-review-pilot-t86-f6.md](a2-review-pilot-t86-f6.md) | T86-utvärdering, F6, T85-fönstret | Piloten **omogen** (6 av 10–15) och i **gråzon** (median 9,5 min mot ≤5). F6 kördes, inkonklusivt-positivt |
| [a3-arkitektur-konversationen.md](a3-arkitektur-konversationen.md) | Var landar arkitektur-doket? | `docs/reference/`, Pocock-precedenten. **Editera inte byggplanen** — placeringen är ett epok-beslut (ADR-068) |
| [a4-riktig-webbapp-inbjudan.md](a4-riktig-webbapp-inbjudan.md) | "Riktig app" + inbjudan till Roger & Lotta | **Det finns ingen frontend-deploy alls.** Ingen URL att bjuda in till. Auth saknar signup/invite/reset helt |
| [a5-xapi-grejen.md](a5-xapi-grejen.md) | Vad är "Xapi-grejen"? | Fas 6.5. Marcus minne stämmer exakt — panelen är låst K10-facit. Men lagringstabellen **finns inte** och historik-vyn saknar facit |
| [a6-forensik-fixvagen.md](a6-forensik-fixvagen.md) | Varför tog fix-vågen 1 h 11 m? | 33 % död väntan från ett idiom **L340 självt föreskriver**. Fixarna var inte enkla (552 rader / 17 filer) |
| [a7-task48-plockbarhet.md](a7-task48-plockbarhet.md) | Är task-48 plockbar? | **Nej** — saknar `ready-for-agent`, förälder och DoD #5/#6. Omfattningen hänger på en enda länk-fork: 4 h eller 1,5 session |
| [a8-systemmeddelanden-design.md](a8-systemmeddelanden-design.md) | Systemmeddelandena i skärmavbilderna | Båda visar `AppErrorBoundary`. Appen har **inget toast-lager** — seende får noll kvitto där skärmläsare får 17 |
| [a9-byggsparet-checkin-personer.md](a9-byggsparet-checkin-personer.md) | Check-in, Personer, persondetalj | **Personer + persondetalj finns redan byggda** (Fas 6a) — ombyggnad till facit, inte nybygge. Check-in saknar write-väg helt |

## Vad korsläsningen gav som ingen enskild rapport kunde se

Agent 4 fann att ingen frontend-deploy finns. Agent 5 och agent 8 planerade
båda arbete vars uttalade syfte var *"innan jag bjuder in Roger och Lotta"* —
utan att veta att det inte finns någon adress att bjuda in till. **Ingen av de
tre kunde se att den ena rapporten drar undan brådskan från de andra två.**
Det är integratörsvärdet, och det är skälet att spaningen kördes samlad i
stället för som separata sessioner.

## Marcus åtta punkter — var de landade

Spaningen utgick från åtta frågor Marcus skrev ned 2026-07-25 plus en önskan
att starta bygget av tre vyer. Tabellen är kartan från hans anteckningar till
repots durabla bärare — **efter den här raden behövs anteckningarna inte
längre.**

| Marcus punkt | Vad det visade sig vara | Durabel bärare | Väntar på |
|---|---|---|---|
| 1. Instant/Routes-ADR | Ingen ADR — baren nås ej. Men `URL-STATE-SPEC` har driftat och route-grammatiken bor i tre hemvister | **T94** | Konventions-hemmets grillning |
| 2. Review-piloten T86 / F6 / T85 | Piloten omogen (6 av 10–15) och i **gråzon** (median 9,5 min mot ≤5). F6 kördes, inkonklusivt-positivt | T86 (escapes omtriagerad) · T89 | T85-sessionen; F6-beslutet är eget litet moment |
| 3. Arkitektur-konversationen | AI-assistenten genuint odokumenterad; miranon.se saknade arkitektur | `docs/reference/miranon-arkitektur/` · **T93** · T79 | Epok-grillning (Övning 2 vs 3) |
| 4. "Riktig app" + inbjudan | **Grind 0 saknas helt: ingen frontend-deploy** | **T95** | Grillning + hosting-ADR |
| 5. "Xapi-grejen" | Fas 6.5. Marcus minne stämde exakt — panelen är låst K10-facit. Men lagringstabellen finns inte och historik-vyn saknar facit | `byggplan.md` Fas 6.5 · `FEATURE-ACTIVITY-LOG.md` | Grillning (4 öppna beslut, 2 ADR-kandidater) |
| 6. Fix-vågens 1 h 11 m | 33 % död väntan från ett idiom **L340 självt föreskrev** | `ci-wait.sh` + L340-amendering + L343 · **T92** (resten) | — levererat |
| 7. task-48 | Var inte plockbar; omfattningen hängde på en enda fork | Kortet, nu `ready-for-agent` | — plockbart |
| 8. Systemmeddelandena | Båda bilderna = `AppErrorBoundary`. Appen saknar toast-lager helt | **T96** | Prototyp-pass |
| Bygget (Check-in/Personer/persondetalj) | Personer + persondetalj **finns redan** men förfacit ⇒ ombyggnad. Check-in obyggd, write-vägen saknas | **T97** | Grillning för check-in-forken |

Ordningen som föreslogs och kvitterades: **T85-korrigeringen → task-48 →
Roger & Lotta-spåret (T95)**, med de övriga köade. Skälet till att T85 går
först är inte sekvenslåsningen (den blockerar inte produktarbete) utan att
**den billigaste stunden att röra CI är när ingenting är i luften** — och att
T85 avblockerar både T86-beslutet och T87, där task-48:s avsiktliga
baseline-drift ska landa.
