---
owner: marcus803
updated: 2026-09-17
review_by: 2026-12-17
status: draft
---

# KG2 — Fem externa fakta plattformsleverantörerna dokumenterar, plus tre rättelser i våg 1

> **Proveniens:** skrivet av en agent i CI-djupgranskningen (Session 126,
> 2026-09-17), uppdrag KG2, våg 2. Modell: Sonnet 5 (`claude-sonnet-5`), se
> egen rapport till orkestreraren. Arbetat i worktreen
> `s126-ci-djupgranskning`, gren `docs/s126-ci-djupgranskning`, HEAD
> `9a541a15b9acd22aed216cb29defe69a0ec94c77` vid skrivtillfället.
> Repo-filernas ögonblicksbild är `origin/main` `eeca8c72` (2026-09-08); alla
> externa mätningar nedan (GitHub API, GitHub-dokumentationens källkod,
> Airtables och Vercels dokumentation) är LIVE, hämtade 2026-09-17. Läste
> `00-agentkontrakt.md` och `01-orkestrerarens-stickprov.md` i sin helhet
> före arbetet — loggens version gäller före agenternas egna filer, och
> uppdragets fem frågor bygger direkt på stickproven S8, S9, S14 och S18.
> Jag har INTE spawnat några egna agenter eller forkar (kontraktets
> tillägg inför våg 2).

**Teknisk ordlista för den som inte kodar dagligen:** en *organisation*
("org") på GitHub är ett delat konto flera personer/system kan äga repon
under — motsatsen är ett *personligt* konto. Ett repo är *publikt* om vem
som helst på internet kan läsa koden, *privat* om bara inbjudna kan det.
En *merge queue* ("sammanslagningskö") är GitHubs mekanism för att testa och
landa ändringsförslag i tur och ordning utan att de krockar. Ett *ruleset*
är en regeluppsättning som skyddar en gren (t.ex. "ingen får radera `main`").
En *plan* är vilken betalningsnivå ett GitHub-konto står på (Free/Pro/Team/
Enterprise Cloud). *429* är webbens standard-felkod för "du frågar för ofta,
vänta".

## Kort svar

| # | Fråga | Utfall | Vad det betyder för åtgärdsplanen |
|---|---|---|---|
| A1 | Behövdes Enterprise-planen? | **Nej, inte för det den köptes för.** Org-ägandet var nödvändigt (merge queue kräver det, oavsett synlighet) — men eftersom repot är och förblev PUBLIKT ger GitHub merge queue OCH rulesets på VILKEN PLAN SOM HELST (Free/Pro/Team) för ett org-ägt publikt repo. Enterprise Cloud är bara ett krav för PRIVATA repon. | ~11–21 USD/månad betalas i dag för en funktion repot redan hade fått gratis. Den enda verifierade fördel Enterprise faktiskt ger (oavsett synlighet) är en högre samtidighets-gräns för CI-jobb (500 mot 60/40/20) — värdefullt för en agent-flotta, men INTE bevisat att den någonsin utnyttjats. |
| A2 | Finns en rollback-kommandoväg för frontend, och vad kostar den? | **Ja, och den har en verklig bieffekt** som saknades i J1e: en `vercel rollback` stänger av automatisk produktions-tilldelning för nya `main`-pushar tills man aktivt promotar tillbaka. | En körd men aldrig-övad kommandoväg med en dold bieffekt är farligare än "ingen väg alls" — man kan råka lämna prod i ett läge där kod slutar gå live utan att märka det. Runbook nedan. |
| A3 | Kan CI mot staging svälta Airtable-prod? | **Nej för den vanliga 5 req/s-gränsen (skild per bas)** — men Airtable har en ANDRA, tidigare obokförd gräns: 50 req/s DELAT över alla tokens från samma användare/service-konto, oavsett bas. Om stagings och prods token delar konto är den gränsen gemensam. | Ny, tidigare oupptäckt risk-yta att utreda: äger staging- och prod-Airtable-tokens SAMMA Airtable-användare/service-konto? Om ja finns en teoretisk delad kvot trots skilda baser. |
| A4 | Vad händer med push-händelser när kön landar flera PR:er? | **Bekräftat**, ordagrant ur GitHubs egen källkod: en `push`-händelse bär alltid TOPP-committen, oavsett hur många commits som ingick. `max_entries_to_merge: 1` skulle tvinga en landning i taget — till priset av fler, dyrare post-merge-körningar. | Bekräftar S18:s mekanism-förklaring fullt ut. Ger ett konkret, litet reversibelt handtag (`max_entries_to_merge: 1`) att väga mot kostnaden. |
| A5 | Är Actions-minuter verkligen gratis, och vad begränsar en agent-flotta i praktiken? | **Ja, gratis, ordagrant bekräftat** i GitHubs egen dokumentation. Den praktiska begränsningen är samtidiga jobb-platser (20/40/60/500 per plan) — men J8.7:s uppmätta kötider mätte VÅR EGEN interna mutex, inte GitHubs jobb-kö. | Ingen ekonomisk risk finns i dag. Om en framtida, större agent-flotta någonsin mättes träffa jobb-taket vore det ett konkret, mätbart skäl att BEHÅLLA en högre plan — men det skälet är i dag ohärlett, inte bevisat. |

## Vad jag läste först

Jag läste, i denna ordning, före något nytt sökarbete:

- `underlag/00-agentkontrakt.md` (hela) — arbetskontraktet, evidenskraven,
  märkningsreglerna (verifierad/starkt indikerad/osäker/ej verifierbar).
- `underlag/01-orkestrerarens-stickprov.md` (hela) — särskilt S8 (Vercel-
  rollback), S9 (Airtable 429), S14 (repot publikt, Enterprise-frågan öppen),
  S16 (51/63-felräkningen) och S18 (push-händelser vid kö-landning). Dessa
  fem stickprov ÄR uppdragets ryggrad — varje delfråga i KG2 är en direkt
  fortsättning på en öppen fråga stickprovsloggen redan ställt.
- `underlag/j8-7-tid-och-kostnad.md` (hela) — mätte redan att repot är
  publikt och att Enterprise-kostnaden (~21 USD/mån) gick till "merge queue",
  men flaggade själv (§ Fynd 5, dom-stycket) att premissen "Enterprise krävs
  för merge queue på ett publikt repo" INTE var kontrollerad mot GitHubs
  dokumentation — exakt den lucka jag stänger i § A1 nedan.
- `underlag/j1e-externa-installningar-och-deployvagar.md` (hela) — bär de två
  meningar jag rättar i B1, plus hela deploy-väg-inventeringen för Vercel/
  Supabase/Airtable som min rollback-runbook bygger vidare på.
- `07-hermetiska-tester-kontra-realistisk-e2e.md` (hela, två gånger, för att
  aktivt leta efter dubbletter/motsägelser per B2).
- `underlag/j4a-branschpraxis-ur-primarkallor.md` (hela, 830 rader) — för att
  hitta B3:s påstådda "privat repo"-mening.
- `docs/decisions/ADR-076-merge-grinden-ruleset-pr-flode.md` (hela, inklusive
  samtliga fyra amenderingsblock) — bar den ursprungliga, redan korrekta
  distinktionen ("rulesets är kostnadsfritt tillgängliga; merge queue är det
  INTE — kräver org-ägt repo") FÖRE org-flytten, vilket visade sig vara exakt
  rätt gräns.
- `docs/research/arbetsflode-processgranskning-eftergranskning-2026-07-24.md`
  § 4 — ett äldre (7,5 veckor) forskningspass som REDAN 2026-07-24 skrev:
  *"GitHubs merge queue är i nuläget begränsad till organisationsägda publika
  repo eller organisationsägda privata Enterprise Cloud-repo"*, med länk till
  GitHubs dokumentation. Detta var alltså känt och korrekt formulerat INNAN
  Enterprise-köpet — se § A1 för vad som gick förlorat på vägen.
- `tasks/sessions/archive/2026-07/2026-07-26-session-91.md` (riktat, rad
  ~1700–1760 samt ~2500–2580) — Marcus egna skäl för Enterprise-köpet, och
  bekräftelse att beslutet fattades 2026-07-27 "uttryckligen för merge queue".
- `backlog/tasks/task-199 …md` (hela) — den redan gjorda utredningen av
  frontend-deploy-vägen; min rollback-runbook lägger till PLATTFORMSFAKTA,
  duplicerar inte kortets egen, redan djupa Vercel-utredning.
- `supabase/functions/_shared/airtable-retry.ts` (hela) och
  `docs/reference/airtable-constraints.md` P4-posten (hela, inkl. "andra
  manifestationen") — läsvägens 429-hantering och det redan bokförda
  "taket är DELAT"-fyndet (som visade sig gälla PER BAS, inte kors-bas — se
  § A3 för nyansen).

**Vad som var nytt:** ingen tidigare fil i `docs/research/` hade verifierat
GitHubs plan-krav för merge queue/rulesets mot källkoden i `github/docs`
(bara mot sekundära sammanfattningar eller en enda, äldre `WebSearch`), ingen
hade läst Vercels Instant Rollback-dokumentation för bieffekten på
auto-tilldelning, och ingen hade hittat Airtables 50 req/s-gräns över flera
baser (bara den kända 5 req/s-per-bas-gränsen). Dessa tre är genuint nya
fynd i denna gransknings historik.

## Metod

Samtliga plattformspåståenden nedan är verifierade på ETT av tre sätt,
märkta inline:

1. **Källkodsläsning hos leverantören** — jag hämtade `github/docs`s egna
   Markdown-källfiler direkt via `gh api repos/github/docs/contents/...`
   (samma repo som bygger `docs.github.com`) i stället för att lita på en
   webbsidas renderade, sammanfattade text. Detta är den STARKASTE
   evidensklassen här, eftersom det är exakt den fil GitHubs egen
   dokumentationsplattform bygger sidan av.
2. **Leverantörens publicerade dokumentationssida**, hämtad direkt
   (Vercel, Airtable) via `WebFetch` mot den officiella domänen.
3. **GitHubs eget REST-API mot vårt konto/repo**, läsande anrop, för att
   skilja PLATTFORMSREGEL (vad GitHub TILLÅTER) från VÅRT FAKTISKA VAL (vad
   vi RÅKAR ha aktiverat) — dessa två förväxlas lätt.

Jag har INTE kört några skrivande kommandon mot GitHub, Vercel, Supabase
eller Airtable. `gh api` mot `github/docs` är en LÄSNING mot ett publikt,
tredjeparts open source-repo — inte vårt eget repo, och omfattas alltså inte
av kontraktets sparsamhetskrav mot VÅR repo-API-användning (som jag ändå höll
mig sparsam mot: en handfull `gh api`-sökningar, inga upprepade anrop).

## A1 — Behövde vi Enterprise-planen för merge queue och rulesets?

**Dom: nej, inte för det den köptes för. Verifierad.**

### Vad GitHubs egen källkod säger, ordagrant

GitHubs dokumentationsplattform bygger sina sidor av "reusable"-textblock.
Jag hämtade blocket som styr merge queue-sidans plan-krav direkt
(`data/reusables/gated-features/merge-queue.md` i `github/docs`, hämtat
2026-09-17):

> *"Pull request merge queues are available in any public repository owned
> by an organization, or in private repositories owned by organizations
> using GitHub Enterprise Cloud."*

Och för repository rulesets (`available-rules-for-rulesets.md`, samma
källa):

> *"Rulesets are available in public repositories with GitHub Free and
> GitHub Free for organizations, and in public and private repositories
> with GitHub Pro, GitHub Team, and GitHub Enterprise Cloud."*

Läs de två citaten tillsammans mot vårt repo:

| Krav | Vad texten säger | Gäller det oss? |
|---|---|---|
| Merge queue kräver ORG-ägande | Ja, för BÅDA grenarna (publik och privat) | **Ja, org-flytten 2026-07-27 var nödvändig** — ett personligt konto får aldrig merge queue, oavsett plan eller synlighet |
| Merge queue på ett PUBLIKT org-repo | Ingen plan-begränsning nämns alls | **Vi behövde INGEN specifik plan** — repot var och är publikt |
| Merge queue på ett PRIVAT org-repo | Kräver Enterprise Cloud | Gäller inte oss — repot är publikt |
| Rulesets på ett PUBLIKT repo | Tillgängligt redan på **Free** | **Vi behövde inte ens Pro** för själva ruleset-funktionen |

Vårt faktiska ruleset (`main-skydd`, id `19627609`) är ett REPO-nivå-ruleset,
inte ett organisationsomfattande — J1e verifierade redan live att
`gh api orgs/high-five-group/rulesets` ger en tom lista (`[]`). Det är
alltså den enklaste, mest tillåtande formen som existerar, och den kräver
enligt citatet ovan bara att kontot är på GitHub Free. (Ett ORGANISATIONS-
omfattande ruleset, som skulle täcka FLERA repon på en gång, kräver Team/
Enterprise enligt en annan sida — `about-rulesets.md`: *"for customers on
Team and Enterprise plans"* — men det är inte vad vi använder.)

### Vad som faktiskt hände, rekonstruerat

`ADR-076`s ursprungliga kontext-stycke (skrivet 2026-07-23, INNAN org-
flytten) hade redan rätt gräns: *"Repot är publikt (ADR-024) och User-ägt —
rulesets är kostnadsfritt tillgängliga; merge queue är det INTE (kräver
org-ägt repo)."* Ett fristående forskningspass samma vecka
(`arbetsflode-processgranskning-eftergranskning-2026-07-24.md` § 4) skrev
självständigt samma distinktion, med en länk till GitHubs dokumentation.

2026-07-27 flyttade Marcus repot till organisationen `high-five-group` —
korrekt åtgärd, eftersom org-ägande verkligen krävs. Men i samma steg
valdes **Enterprise Cloud**-planen (~21 USD/månad för en plats), "uttryckligen
för att öppna merge queue" (`ADR-076` § Korrigering 2026-07-27, samt Marcus
egen kvittens i S91 § 9.4). Enligt citaten ovan var just PLAN-VALET
onödigt: eftersom repot förblev PUBLIKT hade Free, Pro eller Team räckt
för både merge queue och rulesets. Sannolik förklaring: den ursprungliga,
korrekta distinktionen ("org-ägande krävs") glömdes bort eller
sammanblandades med den ANDRA, verkliga Enterprise-gränsen (privata repon)
i beslutsögonblicket — en förväxling mellan "org krävs" och "Enterprise
krävs" som är lätt att göra eftersom båda nämns i samma dokumentationsstycke.

### Fanns det ett ANNAT skäl att köpa Enterprise?

Jag sökte repot brett (`grep -rn -i "enterprise"` över `docs/decisions`,
`tasks/sessions`, `docs/research`, samt hela sessionsarkivet) och hittade
**inget dokumenterat, användet skäl utöver merge queue**: inget spår av
SSO/SAML, IP-allowlistor, anpassade repo-roller, organisationsomfattande
audit-log-användning eller GitHub Advanced Security-specifika funktioner
kopplade till detta repo. De Enterprise-relaterade träffarna i sökningen
gäller antingen Airtables EGEN (orelaterade) enterprise-nivå, Vercels
Skew Protection (också Pro/Enterprise, en annan leverantör), eller
diskussioner om VARFÖR merge queue köptes — samma spår som ovan.

**Den enda verifierade, plan-oberoende fördelen Enterprise faktiskt ger:**
en högre samtidighetsgräns för CI-jobb (se § A5): 500 samtidiga jobb mot
60 (Team) / 40 (Pro) / 20 (Free). Om en agent-flotta med 5–15 samtidigt
körande agenter genuint behöver köra fler än ~60 CI-jobb parallellt är
det ett verkligt, kvarstående skäl att BEHÅLLA en betald plan — men J8.7:s
mätningar av kötid är, som § A5 visar, mätningar av VÅR EGEN interna kö,
inte av detta GitHub-tak, så påståendet är i dag OBEVISAT, inte
motbevisat.

**Vad detta INTE är:** en rekommendation att säga upp planen. Se
§ Rekommendation.

## A2 — Vercel Instant Rollback: bieffekten och en korrekt runbook

**Dom: kommandovägen finns, och den har en dold bieffekt J1e inte
beskrev. Verifierad** direkt mot Vercels egen dokumentation
(`vercel.com/docs/instant-rollback` och
`vercel.com/docs/deployments/rollback-production-deployment`, båda hämtade
2026-09-17).

### Bieffekten, ordagrant

> *"After a rollback, Vercel turns off auto-assignment of production
> domains. This means new pushes to your production branch won't replace
> the rolled-back deployment."*

Och i "Undo a rollback"-avsnittet:

> *"After a rollback, Vercel turns off auto-assignment of production
> domains. This means new pushes to your production branch won't go live
> automatically. To restore normal deployment behavior, you need to undo
> the rollback by promoting a different deployment."*

Detta är den centrala frågan A2 ställde, och svaret är **ja**: en rollback
stänger av kopplingen mellan `main` och Production tills man aktivt
promotar tillbaka. `ADR-091`s flöde ("Vercel Production följer `main`
automatiskt") gäller alltså INTE längre efter en rollback, förrän man
medvetet återställer det.

### Plan-skillnader

| Plan | Vad du kan rulla tillbaka till |
|---|---|
| **Hobby** | Bara den OMEDELBART föregående produktions-deployen |
| **Pro / Enterprise** | Vilken som helst tidigare deploy som någonsin varit aliaserad till produktionsdomänen ("eligible deployments") |

Citat: *"Hobby users can roll back to the immediately previous deployment
... For teams on a Pro or Enterprise plan, all deployments previously
aliased to a production domain are eligible to roll back."* Vår egen plan
(Vercel Pro, `ADR-091`) ger alltså den FRIA formen, inte bara "en tillbaka".

### Miljövariabler och cron

- **Miljövariabler ändras INTE av en rollback** — den återställda deployen
  behåller sina EGNA, byggtid-inbakade värden. Citat: *"There are no
  change in Environment Variables, and they will remain in their original
  state"* samt *"Vercel won't update environment variables if you change
  them in the project settings and will roll back to a previous build."*
  **Praktisk konsekvens för oss:** `VITE_FEATURE_BETALNINGAR` är en
  Vite-byggtidsflagga (bakas in vid `vercel --prod`, enligt J1e:s egen
  tabell). En rollback till en deploy från FÖRE flaggan sattes skulle
  alltså återinföra det GAMLA flagg-värdet, inte det nuvarande.
- **Cron-jobb ÅTERSTÄLLS till den rullade-tillbaka deployens tillstånd.**
  Citat: *"If the project uses cron jobs, they will be reverted to the
  state of the rolled back deployment."* Har ett cron-jobb lagts till
  ELLER tagits bort mellan den gamla och nya deployen, försvinner/
  återkommer det vid rollback.

### Korrekt rollback-runbook, steg för steg (destillat ur Vercels egen incident-guide)

```bash
# 1. Bekräfta att produktionen faktiskt är trasig
vercel logs --environment production --status-code 5xx --since 30m

# 2. Rulla tillbaka OMEDELBART för att återställa tjänsten
vercel rollback <tidigare-deployment-url-eller-id>
vercel rollback status                     # bekräfta att den gick igenom

# 3. Verifiera att tjänsten är återställd
vercel logs --environment production --status-code 5xx --since 5m

# 4. Hitta VILKEN deploy som orsakade felet (för att kunna fixa roten)
vercel list --prod
vercel inspect <trasig-deployment-url>
vercel inspect <trasig-deployment-url> --logs

# 5. Jämför fel-loggar mellan den goda och den trasiga deployen
vercel logs --deployment <trasig-id> --level error --expand
vercel logs --deployment <god-id> --level error --expand

# 6. (Vid behov) binärsök igenom flera deployer mellan god och trasig
vercel bisect --good <god-url> --bad <trasig-url>

# 7. Fixa lokalt, deploya som PREVIEW först och verifiera
vercel deploy
vercel curl /den-paverkade-sidan --deployment <preview-url>

# 8. Släpp fixen till produktion — DETTA återställer normalläget
vercel deploy --prod
# ELLER, om ingen ny kod behövs: promota en känd god deploy explicit
vercel promote <deployment-url>
vercel promote status
```

**Hur man kommer TILLBAKA till normalläget** (det steg J1e och `TASK-199`
saknade): så länge produktionen står i "rullad tillbaka"-läge kopplar
INTE nya `main`-pushar automatiskt vidare. Två vägar att stänga det
fönstret:

1. **Dashboard:** knappen **"Undo Rollback"** dyker upp på projektets
   produktions-ruta så snart det står i rullat-tillbaka-läge; den ber om
   vilken deploy som ska promotas och återställer auto-tilldelningen.
2. **CLI:** `vercel promote <deployment-id-eller-url>` — samma effekt.
   En vanlig `vercel deploy --prod` (steg 8 ovan) promotar en NY build
   till produktion, vilket funktionellt är samma sorts explicit handling
   som en promote och därmed **högst sannolikt** också återställer
   auto-tilldelningen (Vercels dokumentation beskriver inte detta EXAKTA
   scenario ord för ord — märkt **starkt indikerad**, inte verifierad,
   se § Vad jag inte kunde belägga).

**Vad detta betyder för `TASK-199`:** kortets öppna fråga var "hur ser en
korrekt runbook ut". Svaret ovan är plattformsfakta färdig att skrivas in
i en ny runbook-fil eller som ett tillägg till
`docs/reference/prod-driftsattning-runbook.md` — men steget att FAKTISKT
KÖRA en rollback skarpt, en gång, i en kontrollerad situation, återstår och
är utanför denna delfrågas scope.

## A3 — Airtable 429: gränser, dubbelskapande-risk och delad kvot

**Dom: den kända 5 req/s-per-bas-gränsen håller staging och prod isär —
men en ANDRA, tidigare obokförd gräns (50 req/s per Airtable-KONTO, över
ALLA baser) kan i teorin dela dem ändå. Verifierad** mot Airtables egen
sida (`airtable.com/developers/web/api/rate-limits`, fullständig text
hämtad ordagrant 2026-09-17).

### Hela den officiella texten (citerad i sin helhet för första gången i denna granskning)

> *"The API is limited to 5 requests per second per base.*
>
> *Additionally, there is a limit of 50 requests per second for all
> traffic using personal access tokens from a given user or service
> account.*
>
> *If you exceed these rates, you will receive a 429 status code and will
> need to wait 30 seconds before subsequent requests will succeed.*
>
> *Airtable may change the enforced API rate limits or enforce additional
> types of limits in our sole discretion, including tiered based on
> pricing plan. Upon receiving a 429 status code, API integrations should
> back-off and wait before retrying the API request.*
>
> *The official JavaScript client has built-in back-off and retry logic.
> If you anticipate a higher read volume, we recommend using a caching
> proxy."*

### Vad detta betyder, punkt för punkt

1. **5 req/s är PER BAS**, inte per token. `airtable-constraints.md`s egen
   P4-post hade redan denna slutsats rätt ("taket är DELAT ... 5 req/s
   gäller per bas, alltså för alla samtidiga klienter tillsammans") — det
   här bekräftar den mot primärkällan ordagrant.
2. **Staging (`apphjj8Q7lkXCMsL4`) och prod (`app8uGPrVCVOm6LfD`) är
   OLIKA baser** (J1e:s tabell). Den vanliga 5 req/s-gränsen är därför
   strukturellt SKILD mellan dem — en CI-körning mot staging kan inte
   fylla stagings 5 req/s-hink och därigenom svälta prod via DEN
   mekanismen. **Detta är den del av A3:s fråga som håller: nej, inte via
   bas-gränsen.**
3. **Men en HELT SEPARAT gräns finns**, som jag inte hittade bokförd
   någonstans i repot innan detta pass: **50 req/s, delat över ALLA
   personal access tokens som tillhör SAMMA användare eller SAMMA
   service-konto** — oavsett vilken bas de pratar med. Detta är en
   KONTO-nivå-gräns, ortogonal mot bas-gränsen.
4. **Om stagings och prods Airtable-tokens är registrerade under samma
   Airtable-användare/service-konto delar de alltså denna 50 req/s-hink**
   trots att de pratar med olika baser. Jag kunde INTE avgöra detta från
   repot: `atkomst-och-nycklar.md` visar att SAMMA variabelnamn
   (`STAGING_AIRTABLE_TOKEN`) historiskt återanvänts för både en
   staging-scopad PAT (CI:s GitHub-secret) och en helt annan, PROD-scopad
   PAT (lokala schema-skript) — namnen är alltså inte en pålitlig
   vägledning till vilket KONTO en token tillhör. Se § Vad jag inte kunde
   belägga.

### Är ett 429-avvisat anrop garanterat oskrivet?

Airtables dokumentation säger INTE detta explicit — ingen av meningarna
ovan uttalar sig om server-sidans exekveringstillstånd vid ett 429-svar.
**Osäker, ej Airtable-specifikt dokumenterad** — men starkt indikerad av
webbens allmänna standard: HTTP-statuskod 429 ("Too Many Requests",
definierad i RFC 6585) betyder per konvention att servern AVVISADE
förfrågan innan den behandlades, till skillnad från t.ex. en timeout där
utfallet är okänt. Eftersom Airtable inte skriver ut detta ordagrant för
sin egen tjänst bör antagandet "ett 429 = aldrig utfört" behandlas som en
STARK branschkonvention, inte en Airtable-garanti.

### Läsvägens backoff kontra en 30 s-spärr, inom Edge Function-gränsen

`airtable-retry.ts` (läst i sin helhet) implementerar exakt Airtables
kontrakt för LÄSVÄGEN: exponentiell backoff från 30 000 ms (`30 s → 60 s`),
additiv jitter uppåt (aldrig under golvet), tak på 2 omförsök. Taket är
medvetet härlett ur Supabase Edge Functions `Request idle timeout: 150 s`
— värsta fall 112,5 s ryms, ett tredje omförsök (262,5 s) hade gett en 504
i stället för ett ärligt fel. **Detta räcker för att TÅLA en enda
30-sekunders-spärr** (ett omförsök) och har marginal för ETT till om
budgeten fortfarande är låst vid uppvaknandet (andra omförsöket) — men
räcker INTE mot en LÅNGVARIGARE spärrperiod (t.ex. flera överlappande
429:or i rad från olika klienter som håller varandra låsta), vilket modulens
egen kommentar själv flaggar som en känd, olöst gräns ("En full-walk över
många sidor som möter 429 på flera sidor kan summera över idle timeout").

### Bokfört skäl för skrivvägens saknade omförsök?

**Nej — ingen dokumenterad motivering hittad.** Jag sökte riktat
(`docs/decisions`, `airtable-constraints.md`, `tasks/lessons/vol-*.md`,
samtliga `_shared/*.ts`-filer) efter en motivering till att
`updateAirtableRecord`, `createAirtableRecord`, `upsertAirtableRecord`,
`deleteAirtableRecord`, `createAirtableRecords` och `deleteAirtableRecords`
i `airtable-client.ts` ALDRIG anropar `withAirtable429Retry`. Jag läste
källkoden runt varje funktion (rad 266–523) — ingen kommentar där nämner
429 alls. Stickprov S9 hade redan samma slutsats ("J5 fann inget skäl och
kallar luckan odokumenterad"); denna riktade sökning bekräftar den. Det
enda NÄRLIGGANDE resonemanget som finns är `ADR-066`s idempotens-diskussion
(om en `POST`-retry kan dubbelskapa vid NÄTVERKS-fel/timeout) — men den
handlar om klientens egen retry vid ett fel som INTE är ett 429, och nämner
aldrig 429 eller Airtables lockout-kontrakt.

## A4 — Push-händelser vid kö-landning, verifierat mot GitHubs källkod

**Dom: bekräftat i alla tre delar. Verifierad.**

### En push, en körning, alltid toppen

GitHubs egen dokumentationskälla för `push`-händelsen
(`content/actions/reference/workflows-and-actions/events-that-trigger-workflows.md`
i `github/docs`, hämtad 2026-09-17) specificerar `GITHUB_SHA`-värdet för en
`push`-händelse så här, ordagrant i tabellform:

> *"`GITHUB_SHA`: Tip commit pushed to the ref."*

"Tip" betyder den SISTA (översta) committen i det som pushades — inte varje
enskild commit i pushen. Detta är den mekaniska förklaringen bakom S18:s
fynd: när merge-kön landar flera köade PR:er i EN push till `main`, blir
`GITHUB_SHA` för DEN pushens `push`-händelse den ÖVERSTA landade committen,
och `post-merge.yml`s "ärvda klassning" ser bara den toppen — precis
mekanismen S18 fastställde genom att jämföra 686 landningar mot
körningshistoriken.

### Vad `max_entries_to_merge`, `min_entries_to_merge` och `ALLGREEN` faktiskt styr

GitHubs egen sida om ruleset-regler (`available-rules-for-rulesets.md`)
beskriver merge queue-inställningarna så här, ordagrant:

> *"Minimum/maximum group size: The number of pull requests that will be
> merged together in a group."*
>
> *"Require all queue entries to pass required checks: When this setting
> is enabled, each item in the merge group must pass all required checks.
> When this setting is disabled, only the commit at the head of the merge
> group ... must pass its required checks to merge."*

Den andra meningen ÄR den tekniska definitionen av `ALLGREEN` (aktiverad)
kontra `HEADGREEN` (avstängd) — vårt ruleset kör `ALLGREEN`, vilket betyder
att VARJE post i en grupp om upp till tre (`max_entries_to_merge: 3`,
S5) måste klara sina egna required checks innan gruppen landar tillsammans
i en gemensam, kombinerad topp-commit.

### Finns en inställning som tvingar en push per PR — och vad kostar den?

**Ja: `max_entries_to_merge: 1`.** Sätts maximal gruppstorlek till 1 kan
aldrig fler än en PR landa i samma push — varje landning får sin EGEN
`push`-händelse, sin EGEN topp-commit, och därmed sin EGEN fullständiga
`post-merge.yml`-klassning. Det skulle STÄNGA precis den täckningslucka
S18 identifierade (en kod-PR som hamnar UNDER en docs-PR i samma grupp och
därför aldrig får sin post-merge-svit körd).

**Vad det kostar:** `ALLGREEN` testar redan varje kö-post OBEROENDE av de
andra (det är hela poängen med `ALLGREEN`) — gruppering påverkar alltså
inte hur mycket som testas I KÖN, bara hur många SEPARATA landningar
(pushar) som sker till `main`. Med `max_entries_to_merge: 1` skulle
`post-merge.yml`s dyra svit (`Staging (API + E2E)`, `A11y` — 16–56 minuter
per körning enligt J8.7) köra EN GÅNG PER PR i stället för EN GÅNG PER
GRUPP OM UPP TILL TRE. I en aktiv period med flera landningar tätt inpå
varandra (vilket S18 mätte: 55 av 85 saknade körningar följdes av nästa
landning inom 1–15 minuter) skulle detta alltså **flerdubbla** antalet
dyra post-merge-körningar under en intensiv sessions gång — mer
väntetid/kö-trängsel (redan gratis i pengar, se § A5), inte mer pengar.

## A5 — GitHub Actions på publika repon: gratis, men med ett verkligt tak

**Dom: gratis bekräftat ordagrant. Samtidighetstaket är verkligt och
plan-beroende, men obevisat som en faktisk flaskhals hos oss. Verifierad**
för gratis-delen (GitHubs egen källtext), **starkt indikerad** för
taknumren (dokumenterade, ej stress-testade mot vår last).

### Gratis, ordagrant

`github/docs`s egen återanvända textblock för Actions-fakturering
(`data/reusables/actions/actions-billing.md`, hämtat 2026-09-17):

> *"GitHub Actions usage is free for standard GitHub-hosted runners in
> public repositories, and for self-hosted runners ... For private
> repositories, each GitHub account receives a quota of free minutes and
> storage for use with GitHub-hosted runners, depending on the account's
> plan. Any usage beyond the included amounts is billed to your account."*

Detta bekräftar J8.7:s egen empiriska mätning (organisationens faktiska
fakturerings-API, 100 % rabatt tre månader i rad) med en primärkälle-text
som säger samma sak rakt ut, oavsett vilken plan kontot står på.

### Samtidighetstaket, per plan

`docs.github.com/en/actions/reference/limits` (hämtad 2026-09-17), för
STANDARD GitHub-hostade runners:

| Plan | Max samtidiga jobb (totalt) | Max samtidiga macOS-jobb |
|---|---|---|
| Free | 20 | 5 |
| Pro | 40 | 5 |
| Team | 60 | 5 |
| **Enterprise Cloud** | **500** | 50 |

Detta är en HELT ANNAN gräns än pengar: den finns oavsett om repot är
publikt eller privat, och den styr hur många CI-JOBB (inte hela
körningar — varje `ci.yml`-körning har ~16 jobb, per J8.7:s egen mätning)
som får rulla PARALLELLT innan resten ställs i kö och väntar på en ledig
plats.

### Räcker J8.7:s kötider för att säga något om detta taket?

**Nej, inte direkt — de mäter en ANNAN kö.** J8.7:s "Väntan (mutex-kö)"
(3–35 minuter) mäter VÅR EGEN, interna `staging-tests`-mutex (en
concurrency-grupp i `post-merge.yml` som serialiserar EN specifik jobbtyp
i taget, oavsett hur många GitHub-jobb-platser som finns lediga). Den
mäter INTE hur länge ett jobb stod och väntade på grund av GitHubs eget
plan-tak. Ingen fil i denna granskning har isolerat den senare formen av
väntan.

**En enkel räkning visar ändå att taket INTE är helt overksamt i
teorin:** en enda `ci.yml`-körning drar ~16 jobb samtidigt (mätt av J8.7).
På Free (20-tak) skulle en ENDA sådan körning nästan mätta hela
kontots jobb-budget — en andra samtidig körning (t.ex. en till PR som
öppnas eller kön som testar två poster parallellt) skulle DELVIS köa. På
Team (60) ryms grovt 3–4 fulla körningar samtidigt; på Enterprise (500)
ryms i praktiken obegränsat många för denna repos skala. **Detta är en
räkning ur dokumenterade tal, inte en mätning av verklig kö-väntan hos
oss — märkt starkt indikerad, inte verifierad.** Att avgöra om det NÅGONSIN
faktiskt bitit hos oss kräver ett riktat mått (t.ex. jobb-nivåns
`started_at` minus dess körnings `created_at`, jämfört mellan flera
samtidiga körningar under en intensiv agent-session) som ingen fil i denna
granskning har gjort.

## Rättelseprotokoll — Del B

### B1 — `underlag/j1e-externa-installningar-och-deployvagar.md`

| Plats | Före | Efter |
|---|---|---|
| Rad ~32–33 (§ Kort svar) | *"Supabase ... har det bästa PROCESS-dokumentet av de fyra ... men **noll mekanisk rollback var som helst i kedjan** — ... detta är verifierat som en plattformsbegränsning ..., inte en lucka i vår dokumentation."* | Meningen står kvar OFÖRÄNDRAD (den gäller fortfarande Supabase/EF/migrationer/Airtable-schema), men en `> **Rättat i våg 2 …**`-blockquote är tillagd direkt efter som stryker "var som helst i kedjan" som ett påstående om ALLA fyra spår, med hänvisning till § A2 ovan för Vercels faktiska kommandoväg. |
| Rad ~271 (§ 3a, Frontend-flödet) | *"**Rollback:** ingen kommandoväg. Tre alternativ i stigande ingrepp: klientlokal cache-rensning ..., Vercel-dashboardens 'promota tidigare deploy' ..., eller en revert-PR ..."* | *"**Rollback:** ~~ingen kommandoväg~~ **rättat.** Tre alternativ ...: klientlokal cache-rensning ..., `vercel rollback <deployment-id/url>` / dashboardens 'Instant Rollback' ..., eller en revert-PR ..."* plus en `> **Rättat i våg 2 …**`-blockquote som förklarar bieffekten (auto-tilldelning stängs av) och att vägen ALDRIG körts hos oss (oförändrat fynd). |

Grindar körda mot filen efter ändring (se § Grindutfall).

### B2 — `07-hermetiska-tester-kontra-realistisk-e2e.md`

| Plats | Före | Efter |
|---|---|---|
| Rad ~328 (§ "Finns kritiska flöden ...") | *"... och `supabase/functions/`s fullständiga lista (**51** Edge Functions) mot `tests/e2e/`s innehåll"* | *"... (**63** Edge Functions — rättat i våg 2 ...)"*, med en not om att ingen namngiven funktion i den efterföljande tabellen påverkas. |
| Rad ~655–666 (§ Källor, "Repo-filer") | *"`supabase/functions/` (**51** Edge Functions vid första katalog-listningen 2026-09-17 förmiddag; **VOLATIL under detta pass** — denna worktree delas med flera samtidigt körande bygg-agenter ... en omräkning senare samma dag gav **63**. ... Totalräkningen 51/63 är en sidoiakttagelse om trädets rörlighet ..."* | *"`supabase/functions/` (**63** Edge Functions, verifierat både på disk och i commiten vid denna gransknings ögonblicksbild)"* plus en `> **Rättat i våg 2 …**`-blockquote som stryker "51" och förklaringen "snabbt rörlig worktree/VOLATIL" som en felräkning (stickprov S16), och bekräftar att ingen slutsats i filen byggde på talet 51. |

**Genomläsning för dubbletter/motsägelser (B2 ii), fullständig fil läst två
gånger:** utöver 51/63-paret ovan hittade jag INGA andra dubblerade
sektioner, upprepade tabeller eller tal som anges olika på två ställen.
Filens matematik höll konsekvent vid egen kontrollräkning (t.ex.
"1786+529+524+304+118+109+10 ≈ 3 380" summerar exakt till 3 380; "cirka
4 200" för en full post-merge/natt-körning stämmer inom rimlig
avrundning mot 3 380 + 524 självtest-omkörning + 322 visuell = 4 226).
Stickprov S16:s processfynd — att filen är en sammanfogning av tre
agentpass/forkar — manifesterade sig INTE som synliga dubbletter i den
FÄRDIGA texten; sammanfogningen tycks ha skett städat. Den enda
substansiella lämningen av sammanslagningen var exakt 51/63-paret, nu
rättat på båda ställena.

Grindar körda mot filen efter ändring (se § Grindutfall).

### B3 — `underlag/j4a-branschpraxis-ur-primarkallor.md`: PREMISS EJ BELAGD, INGEN ÄNDRING GJORD

Jag läste filen i sin HELHET (830 rader, två Read-anrop) och körde riktade
sökningar (`grep -n -i "privat"`, `"PRIVAT"`, `"Private"`, `"private"`,
`"kvot"`, `"Actions-kvot"`, `"gratis"`, `"kostnadsfri"`, `"Actions-minut"`,
`"fakturer"`, `"billing"`) över hela filen. **Ingen av dessa gav en träff
som påstår att repot är privat, eller en skaltaggning som uttryckligen
vilar på "privat repo" eller "Actions-kvot".** Filens enda kostnads-/
gratis-relaterade rad handlar om Vercels HOSTING-gratisnivå ("på alla
nivåer inklusive gratisnivån"), inte om GitHub-repots synlighet.

Jag sökte sedan i HELA `ci-djupgranskning-2026-09-17`-katalogen efter frasen
och fann den bara på ETT ställe: `underlag/01-orkestrerarens-stickprov.md`
rad 299, där ORKESTRERAREN SJÄLV skriver att *"J4a:s skalbeskrivning
('privat repo') är fel i en detalj"* — men det är en parafras av vad
orkestreraren TROR filen säger, inte ett citat ur filen. J4a:s egen text
(§ "Vad jag läste först", § dimension 1 och 11, § Rekommendationer)
diskuterar genomgående "vår skala" i termer av teamstorlek och kodbas-
storlek (jämförelser med DHH:s 55 000-radiga Ruby-kodbas, en "ensam
utvecklare"-referens) — ALDRIG i termer av repo-synlighet eller
Actions-kostnad. Slutsats: **B3:s premiss håller inte mot disk.** Ingen
rättelse har gjorts i filen, eftersom det inte finns något att rätta.
Detta är i sig ett giltigt fynd (uppdragets § "Uppdragets premisser är
hypoteser") — inte en avvikelse från uppdraget.

## Grindutfall

Körda riktat mot de TVÅ faktiskt ändrade filerna, i förgrunden, med
`--no-globs`:

```text
npx markdownlint-cli2 --no-globs "docs/research/ci-djupgranskning-2026-09-17/underlag/j1e-externa-installningar-och-deployvagar.md"
→ exit 0 (Summary: 0 error(s))

vale "docs/research/ci-djupgranskning-2026-09-17/underlag/j1e-externa-installningar-och-deployvagar.md"
→ exit 0

npx markdownlint-cli2 --no-globs "docs/research/ci-djupgranskning-2026-09-17/07-hermetiska-tester-kontra-realistisk-e2e.md"
→ exit 0 (Summary: 0 error(s))

vale "docs/research/ci-djupgranskning-2026-09-17/07-hermetiska-tester-kontra-realistisk-e2e.md"
→ exit 0
```

`j4a-branschpraxis-ur-primarkallor.md` rördes inte (§ B3) och behövde
därför ingen grindkörning. Denna fil (`kg2-...md`) kördes genom samma två
grindar innan leverans (se orkestrerarens egen körning av `check:docs` för
den samlade, repo-brett verifieringen — jag har enligt kontraktet INTE
kört den helgrinden själv).

## Vad jag inte kunde belägga

- **Om stagings och prods Airtable-tokens delar samma Airtable-användare/
  service-konto** (§ A3) — avgörande för om den nyupptäckta 50 req/s-
  gränsen faktiskt är delad mellan dem. `atkomst-och-nycklar.md` visar att
  samma VARIABELNAMN historiskt burit olika PAT-VÄRDEN i olika kontexter,
  vilket gör namnet opålitligt som bevis. **Ej verifierbar av mig i denna
  session** — kräver antingen Airtables egen "Personal access tokens"-sida
  (som listar vilket konto varje PAT tillhör) eller en riktad fråga till
  Marcus om vilket Airtable-konto som skapade respektive token.
- **Om ett 429-avvisat Airtable-anrop garanterat inte utfördes** (§ A3) —
  Airtable dokumenterar det inte explicit för sin egen tjänst. Jag har
  markerat detta "starkt indikerad" via HTTP-standardens allmänna
  konvention (RFC 6585), inte "verifierad".
- **Om `vercel deploy --prod` faktiskt återställer auto-tilldelningen
  efter en rollback** (§ A2, runbookens steg 8) — Vercels dokumentation
  beskriver bara "Undo Rollback"-knappen och `vercel promote` explicit för
  detta. Jag bedömer det som högst sannolikt att en vanlig `--prod`-deploy
  har samma effekt (den ÄR en explicit produktions-tilldelning), men har
  inte hittat en mening som säger det rakt ut, och kan inte pröva det utan
  att köra en skarp deploy mot vårt Vercel-projekt.
- **Om `main-skydd`-rulesetet skulle förbli fullt fungerande på en LÄGRE
  plan** (§ A1) rent PRAKTISKT, utöver den dokumenterade tillåtelsen — jag
  har INTE testat att faktiskt nedgradera planen (det vore en skarp,
  potentiellt destruktiv handling helt utanför denna gransknings mandat:
  jag är utåt skrivskyddad). Slutsatsen vilar på GitHubs dokumenterade
  regel, inte på ett skarpt prov.
- **Exakt hur många GitHub Actions-jobb-platser vår fleet faktiskt
  förbrukar samtidigt vid toppbelastning** (§ A5) — inget mätt underlag i
  denna granskning isolerar detta från vår egen interna mutex-kö. Kräver
  ett nytt, riktat mått (jobb-nivåns kötid jämförd med samtidiga
  körningars antal under en mätt intensiv session).
- **Om `08-04A5:s "starkt indikerad"-räkning** (16 jobb per körning ×
  antal samtidiga körningar mot 20/40/60/500-taken) håller vid EXTREM
  fleet-belastning (t.ex. 15 agenter som alla pushar inom samma minut) —
  ej mätt, ej observerat i det underlag jag haft tillgång till.

## Risker

- **Att läsa A1 som "säg upp Enterprise nu".** Den enda VERIFIERADE
  fördelen (samtidighetstaket) är genuint relevant för en agent-tung
  arbetsform som denna, och kostnaden att RÅKA nedgradera för tidigt (en
  agent-flotta som plötsligt köar mot ett 60-jobbs-tak mitt i en session)
  är operativt värre än 11–21 USD/månad. Se § Rekommendation.
- **Att lita på `vercel deploy --prod` som en beprövad "undo"-väg** (§ A2)
  utan att någonsin ha kört den skarpt. Om den INTE återställer
  auto-tilldelningen (den obevisade delen ovan) kan man tro sig ha
  återställt normalläget utan att ha gjort det.
- **Att anta att staging/prod-Airtable-tokens är säkert isolerade** bara
  för att de pratar med olika baser (§ A3). Den nya 50 req/s-kontogränsen
  är en genuint ny riskyta som ingen tidigare fil i repot bokfört.

## Rekommendation

**Detta är en rekommendation, inte ett beslut — Marcus väger.**

1. Utred (litet, billigt, en `gh api organizations/... /settings/billing`-
   liknande koll räcker inte — detta kräver att titta i GitHubs egen
   plan-inställningssida eller fråga supporten) om organisationen
   `high-five-group` kan nedgraderas från Enterprise Cloud till Team utan
   att förlora merge queue eller rulesets — enligt § A1 ska den inte göra
   det, så länge repot förblir publikt. Väg det mot samtidighetstakets
   verkliga värde (60 mot 500 jobb) INNAN beslut — om fleet-arbetet
   regelbundet kör 5+ samtidiga fulla `ci.yml`-körningar (≈80+ jobb) är
   Team:s 60-tak för lågt, och kostnaden är motiverad trots att den
   ursprungliga anledningen (merge queue) var fel.
2. Skriv in A2:s rollback-runbook (eller en pekare till denna fil) i
   `docs/reference/prod-driftsattning-runbook.md`, och lägg till ett steg
   som EXPLICIT kontrollerar auto-tilldelningens status efter en rollback
   — annars kan `TASK-199`s nästa incident bli "prod slutade uppdatera
   sig efter en rollback ingen mindes att den stängde av auto-deploy".
3. Klarlägg vilket Airtable-konto/service-konto som äger respektive
   Airtable-token (staging-CI, prod-EF, de lokala schema-skriptens) och
   bokför det i `atkomst-och-nycklar.md` — den nya 50 req/s-kontogränsen
   (§ A3) är annars en osynlig, odokumenterad delad resurs.
4. Överväg `max_entries_to_merge: 1` (§ A4) ENDAST om täcknings-luckan
   S18 fann (kod-PR:er som aldrig får sin post-merge-svit körd) bedöms
   allvarligare än den extra väntetiden/kö-trängseln en sådan ändring
   skulle kosta — det är en ren avvägning, inget som platsar-eller-inte.

## Källor

**GitHub, primärkälla (källkoden bakom `docs.github.com`, `github/docs`,
hämtad via `gh api repos/github/docs/contents/...`, 2026-09-17):**

- `data/reusables/gated-features/merge-queue.md`
- `content/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets.md`
- `content/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets.md`
- `content/actions/reference/workflows-and-actions/events-that-trigger-workflows.md`
- `data/reusables/actions/actions-billing.md`
- `content/billing/reference/actions-runner-pricing.md`
- [`docs.github.com/en/actions/reference/limits`](https://docs.github.com/en/actions/reference/limits) (samtidighetstak per plan)
- [`docs.github.com` — Managing a merge queue](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue)

**GitHub, levande API-mätning (2026-09-17):**

- `gh api repos/high-five-group/miranon-media-admin` — synlighet/ägarskap (redan verifierad av S14/J8.7, ej omätt av mig)
- `gh api orgs/high-five-group/rulesets` — bekräftar tom org-nivå-lista (redan verifierad av J1e, ej omätt av mig)

**Vercel, primärkälla:**

- [`vercel.com/docs/instant-rollback`](https://vercel.com/docs/instant-rollback)
- [`vercel.com/docs/deployments/rollback-production-deployment`](https://vercel.com/docs/deployments/rollback-production-deployment)

**Airtable, primärkälla:**

- [`airtable.com/developers/web/api/rate-limits`](https://airtable.com/developers/web/api/rate-limits)

**Lokala artefakter (lästa på disk, ej ändrade utom där B1/B2 anger):**

- `underlag/00-agentkontrakt.md`, `underlag/01-orkestrerarens-stickprov.md`
- `underlag/j8-7-tid-och-kostnad.md`, `underlag/j1e-externa-installningar-och-deployvagar.md`,
  `07-hermetiska-tester-kontra-realistisk-e2e.md`, `underlag/j4a-branschpraxis-ur-primarkallor.md`
- `docs/decisions/ADR-076-merge-grinden-ruleset-pr-flode.md`
- `docs/research/arbetsflode-processgranskning-eftergranskning-2026-07-24.md`
- `tasks/sessions/archive/2026-07/2026-07-26-session-91.md` (rad ~1700–1760, ~2500–2580)
- `backlog/tasks/task-199 …md`
- `supabase/functions/_shared/airtable-retry.ts`, `supabase/functions/_shared/airtable-client.ts`
- `docs/reference/airtable-constraints.md` (P4-posten)
- `docs/reference/atkomst-och-nycklar.md`
