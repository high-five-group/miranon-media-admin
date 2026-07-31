---
owner: marcus803
updated: 2026-07-30
review_by: 2027-01-30
status: draft
---

# Behöver en brådskande revert företräde i merge queue? (Code, 2026-07-30)

> **Proveniens:** avgränsat research-pass 2026-07-30, beställt av `TASK-96`.
> Kortet registrerade en motsägelse i `CONTRIBUTING.md`: § Landnings-ordningen
> förklarar den manuella sekvenseringen UPPHÄVD, medan § Revert-vägen längre ned
> fortfarande instruerar enligt just de formerna. Kortet slår uttryckligen fast
> att motsägelsen **inte får lappas som en texträttelse** — frågan om brådskan
> måste avgöras först. Detta pass avgör den frågan. Ingen kod, inget kort, ingen
> ADR rörd; enda leveransen är denna fil.
>
> **Mätning före citat.** Där ett påstående gick att pröva mot vår faktiska
> konfiguration har jag prövat det och rapporterar mätningen i stället för
> dokumentationens formulering. Mätningarna kördes 2026-07-30 mot `gh` **2.96.0**
> och mot repots ruleset `main-skydd` (id `19627609`) i dess dåvarande tillstånd.
> Empirin om kön omfattar **84 kö-körningar** och **45 landade PR:er** från
> kö-aktiveringen 2026-07-29 till och med natten mot 2026-07-31 — alltså hela
> köns livstid, inte ett stickprov.

## Kort svar

**Behovet av kö-företräde är borta. Skriv om § Revert-vägen till att kön äger
ordningen — samma sak som § Landnings-ordningen redan säger.**

Tre skäl, alla mätta:

1. **Kö-väntan är försumbar för den revert som betyder något.** Efter eget grönt
   kö-bygg landar en post på median **16 s**. Varje mätbar straffavgift i hela
   materialet drabbade en docs-post som grupperats med en kod-PR — 308 s, 293 s
   och 240 s. Deras kod-klassade grannar betalade 23 s, 19 s och 14 s. Straffet
   faller alltså **alltid på den snabba posten**, aldrig på den långsamma.
2. **En mekanism för företräde finns — men den biter inte på den kostnad som
   faktiskt vuxit.** `jump` omordnar kön; den hoppar inte över kö-bygget. Och det
   är kö-bygget, inte kö-väntan, som fördubblat exponeringsfönstret.
3. **`--admin` förbi kön är stängd för oss.** Det är ett medvetet beslut
   (ADR-076 beslut 2), verifierat mot faktisk konfiguration, inte mot
   dokumentationen.

**Det viktigaste fyndet ligger dock utanför frågan:** § Revert-vägens
exponeringsfönster är efter kö-aktiveringen **ungefär dubbelt så långt som filen
påstår** — och orsaken är strukturell, inte tillfällig. Se § 2.3. Den rättelsen
är mer värd än priorititets-frågan som beställde passet.

---

## 1. Vad säger GitHubs egen dokumentation om företräde?

### 1.1 Ja — `jump` finns, och den är förstapartsdokumenterad

GitHubs dokumentation har en egen rubrik för saken, *"Jumping to the top of the
queue"*:

> When adding a pull request to a merge queue, there is an option to move your
> pull request to the top of the queue.

Med en uttrycklig varning:

> Be aware that jumping to the top of a merge queue will cause a **full rebuild
> of all in-progress pull requests**, as the reordering of the queue introduces a
> break in the commit graph. Heavily utilizing this feature can slow down the
> velocity of merges for your target branch.

Källa: [`managing-a-merge-queue.md`](https://raw.githubusercontent.com/github/docs/main/content/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue.md),
rad 114–119 i den hämtade råtexten.

### 1.2 Mätt: mekanismen finns i det levande API:et — men inte i `gh`

Dokumentationen beskriver en UI-option. Frågan för oss är om den är nåbar
programmatiskt. Introspektion mot GitHubs GraphQL-API 2026-07-30:

| Mutation / input | Mätt utfall | Betydelse |
|---|---|---|
| `enqueuePullRequest` | finns; `EnqueuePullRequestInput` bär fältet **`jump: Boolean`** — *"Add the pull request to the front of the queue."* | företräde ÄR nåbart via API |
| `enablePullRequestAutoMerge` | `EnablePullRequestAutoMergeInput` har **inget `jump`-fält** | företräde kan **inte** förarmeras |
| `dequeuePullRequest` | finns; input tar `id` | se § 5, oväntat fynd |

`gh pr merge` på **2.96.0** exponerar ingen `--jump`-flagga (mätt: `gh pr merge --help`).

**Konsekvensen är operativt avgörande.** `jump` är en *enqueue-tidpunkts*-option,
och `--auto` köar åt dig utan den. En brådskande revert kan därför inte armeras
med företräde i förväg: någon måste vaka tills PR-grinden blir grön och först då
avfyra en handskriven GraphQL-mutation. Just det arbetssättet — en oprövad väg som
körs första gången under tidspress — är vad § Revert-vägen själv varnar för i sin
sista mening.

### 1.3 Företräde som roll-rättighet — och GitHubs eget användningsfall

GitHub har brutit ut två kö-rättigheter som går att dela ut via custom repository
roles. Ordagrant ur dokumentationens råa källfil, rad 24–27:

```markdown
### Merge queue

* Request a solo merge
* Jump to the front of the queue
```

Källa: [`additional-permissions.md`](https://raw.githubusercontent.com/github/docs/main/data/reusables/organizations/additional-permissions.md).

GitHubs changelog namnger användningsfallet — och det är precis vårt:

> A popular use case is to create elevated roles for your on-call rotation. For
> instance, a role based on `Write` with the "Jump the merge queue" and "Request
> a solo merge" repository permissions added so that your on-call team can get
> that fixed quickly.

Källa: [changelog 2024-08-29](https://github.blog/changelog/2024-08-29-add-repository-permissions-to-custom-organization-roles/).

**Läs det rätt:** GitHub bekräftar att brådskande åtgärder är kö-företrädets
avsedda syfte. Det gör frågan legitim — men det avgör den inte, eftersom
rättigheten är byggd för organisationer vars köer är djupa nog att det spelar
roll. Vår är inte det (§ 2).

### 1.4 `--admin` förbi kön: stängd för oss — mätt, inte antaget

`gh` 2.96.0 påstår i sin egen hjälptext:

> To bypass a merge queue and merge directly, pass the `--admin` flag.

**Det påståendet är falskt under vårt ruleset.** Mätt mot faktisk konfiguration:

| Mätning | Utfall |
|---|---|
| Mitt repo-behörighetsläge | `admin: true` |
| `main-skydd` → `bypass_actors` | `[]` (tom) |
| `main-skydd` → `current_user_can_bypass` | **`"never"`** |

`current_user_can_bypass` är GitHubs eget beräknade fält för den autentiserade
användaren. Att jag är repo-admin och ändå får `never` är hela svaret: vägen är
stängd **för alla**, med avsikt (ADR-076 beslut 2, tom bypass-lista).

Felläget är dessutom dokumenterat av `gh`:s egna underhållare. I
[cli/cli#8746](https://github.com/cli/cli/issues/8746) rapporterar en användare
exakt detta, och felet visar sig vara konfigurationen — inte en bugg i `gh`:

> `GraphQL: Changes must be made through the merge queue`

Issuen stängdes som `COMPLETED` 2024-02-26 efter att rapportören konstaterat att
spärren *"Do not allow bypassing the above settings"* var ikryssad. Vår
motsvarighet är tom bypass-lista. GitHubs dokumentation formulerar villkoret
likadant för UI-vägen: admin kan merga direkt *"if allowed by branch protection
settings"* — och för oss är det inte tillåtet.

**Nödvägen kvarstår som § Revert-vägen redan beskriver den:** att synligt
inaktivera rulesetet är Marcus beslut, syns i rulesetets historik, och är
uttryckligen inte en tyst gräddfil. Den slutsatsen står oförändrad efter detta
pass.

---

## 2. Vad kostar kön i praktiken?

### 2.1 Mätt kö-djup: grunt, och nästan alltid ett

84 kö-körningar, 2026-07-29 → 2026-07-31:

| Mätning | Utfall |
|---|---|
| Kö-körningar totalt | 84 |
| Varav röda | **0** |
| Största uppmätta samtidighet | **3** (= vårt `max_entries_to_build`) |
| Andel aktiv kö-tid med djup 1 | **84 %** |
| Andel aktiv kö-tid med djup 3 | **3 %** (5,2 min av ~206 min) |
| Poster som köade bakom en pågående post | 25 av 84 |

Att `max_entries_to_build: 3` faktiskt nåtts betyder att taket är rätt satt — men
det höll i 3 % av tiden, och bara vid ett enda tillfälle. Belastningen har ändå
varit verklig: dygnet 2026-07-30 landade **25 PR:er** genom kön, varav 21 efter
kl. 16 UTC — utan att kön någonsin höll mer än tre poster samtidigt. Hög
landnings-takt ger alltså inte automatiskt djup kö, eftersom posterna byggs
parallellt och lämnar kön i grupp.

Att **noll av 84 poster fällts** betyder att det dyra
felläget (en post faller ut, efterföljarna byggs om) ännu aldrig inträffat hos
oss. Det är ingen garanti för framtiden; det är en mätning av vad vi hittills
sett.

### 2.2 Mätt kö-straff: faller alltid på fel post

Ur faktiska landnings-tidsstämplar för 30 PR:er (ingen modell — mätt tid från
eget grönt kö-bygg till landad):

| Mätning | Utfall |
|---|---|
| Median väntan efter eget grönt bygg | **16 s** |
| p90 | 27 s |
| Max | **308 s** (≈ 5 min 8 s) |
| Antal som betalade mer än 30 s | **3 av 30** |

De tre som betalade — och vad deras grannar betalade:

| PR | Klass | Eget kö-bygg | Väntan | Grupperad med | Grannens väntan |
|---|---|---|---|---|---|
| #476 | docs | 71 s | **308 s** | #477 (kod, 446 s) | 19 s |
| #480 | docs | 68 s | **293 s** | #479 (kod, 439 s) | 23 s |
| #490 | docs | 82 s | **240 s** | #487 (kod, 432 s) | 14 s |

Tre av tre följer samma mönster. Materialet innehåller inget motexempel: ingen
kod-klassad post har någonsin betalat mer än 30 s kö-väntan.

**Det här är passets strukturella nyckel.** Kö-straffet är asymmetriskt och
**inverterat mot brådskan**: det drabbar bara den snabba posten. En revert av
*kod* — den dyra sorten, där exponeringen faktiskt gör skada — är kod-klassad,
byggs samtidigt med andra kod-PR:er och betalar ≈ 20 s. Den enda revert som kan
fördröjas nämnvärt är en *docs*-revert, alltså den sort där det som backas är
dokumentation och skadan av några minuters extra exponering är minst.

Kön kostar alltså mest precis där det spelar minst roll.

### 2.3 Det som faktiskt blev dyrare — och som företräde inte kan laga

Under kön passerar varje PR **två fulla CI-lopp**: först PR-grinden (som måste
bli grön innan `--auto` köar posten), sedan kö-bygget på `merge_group`-ytan.
Mätt över 45 landade PR:er:

| Klass | Median PR-CI | Median kö-CI | Median totalt, grön-start → landad |
|---|---|---|---|
| **Kod** (n = 11) | 435 s | 449 s | **933 s ≈ 15,6 min** |
| **Docs** (n = 34) | 73 s | 75 s | **188 s ≈ 3,1 min** |

Ett konkret genomlopp, PR #483 (kod): PR-CI 20:09:59 → 20:17:34 (455 s), kö-bygge
20:17:53 → 20:25:54 (481 s), landad 20:26:21. **16 min 22 s.**

Jämför vad `CONTRIBUTING.md` § Revert-vägen påstår i dag:

> Ett kod-fel kan alltså vara ute ur `main` inom omkring åtta minuter från
> beslut, ett docs-fel inom drygt en

De talen mättes 2026-07-28, före kön, och de **saknar kö-bygget helt**.
Verkligheten efter kö-aktiveringen är ungefär den dubbla i båda klasserna.

**Och detta är argumentet som avgör hela frågan:** den kostnad som faktiskt vuxit
är det andra CI-loppet — och `jump` tar inte bort det. Att hoppa i kön omordnar
posterna; kö-bygget körs ändå. Företräde adresserar en väntan på ~20 s och lämnar
en CI-kostnad på ~450 s orörd. Mekanismen biter inte på problemet.

*Avgränsning i talen ovan:* "totalt" mäts från PR-CI-start till landad och
innehåller därmed även tiden tills posten armerades. För en revert är den tiden
≈ 0. Den revert-relevanta summan är de två CI-loppen plus mätt merge-overhead:
≈ 435 + 449 + 16 ≈ **15,0 min** för kod, ≈ 73 + 75 + 16 ≈ **2,7 min** för docs.

---

## 3. Hur hanterar jämförbara projekt akuta reverts under merge queue?

**Precedent-rymden är delad, och det ena halvan är tunn. Det deklareras öppet.**

### 3.1 Mekanism-precedent: stark och bred (fyra system)

Att köer bär ett företrädes-begrepp är etablerad praxis, inte en GitHub-egenhet:

| System | Mekanism | Verifierat citat |
|---|---|---|
| **Rust — bors/homu** | `p=`-parameter på godkännande | Rollup-proceduren använder `@bors r+ p=5`; kön filtrerar på `^p=[1-9]` |
| **Mergify** | `priority_rules` (top-level) | *"Priority rules in Mergify are a set of guidelines that determine the order of pull requests within a merge queue."* Värden `low`/`medium`/`high` eller 1–10 000 |
| **GitLab — merge trains** | *Merge immediately* | *"Merging immediately can use a lot of CI/CD resources. Use this option only in critical situations."* |
| **GitHub — native** | `jump` vid enqueue | § 1.1 ovan |

**Det mest upplysande fyndet är Mergifys default.** Deras
`allow_checks_interruption` — *"Allow interrupting the ongoing checks when the
pull request entering the queue has a higher priority than the queued one(s)"* —
har defaultvärdet **`false`**, och konsekvensen är dokumenterad: *"a pull request
with higher priority will be inserted just after the pull requests that have
checks running."*

Alltså: den mest konfigurerbara köprodukten i urvalet låter som standard **inte**
ens en högprioriterad PR avbryta pågående bygg. GitHubs `jump` motsvarar
`allow_checks_interruption: true` — det läge Mergify gjort till opt-in därför att
ombyggnads-kostnaden sällan är värd den.

GitLab bekräftar samma avvägning från andra hållet, och erbjuder dessutom en
*billigare* utväg än GitHub: `skip_merge_train: true` via API:t, där *"the merge
request merges, and the existing merge train pipelines are not canceled or
restarted"* — med den dokumenterade risken att *"the changes in the merge request
that skipped the train are not verified against any of the other merge requests
in the train."* Någon motsvarighet finns inte i GitHubs native-kö.

### 3.2 Policy-precedent: jag hittade ingen — och så här sökte jag

Jag letade efter konkreta `CONTRIBUTING`-/runbook-texter hos projekt på GitHubs
**nativa** merge queue som skriver ut hur en brådskande revert ska hanteras. Jag
**hittade inga**. För att frånvaron ska vara mätbar och inte bara oredovisad —
här är vad sökningen faktiskt bestod av:

| Vad jag sökte | Hur | Utfall |
|---|---|---|
| `"merge queue"` + `revert` + `merge_group` i contributing-guider | webbsök, öppen | endast leverantörs- och blogg-material, ingen projekt-policy |
| Kö-företräde vid revert, GitHub-domäner | webbsök begränsat till `docs.github.com`, `github.blog`, `github.com` | GitHubs egen dokumentation + två community-trådar; ingen projekt-policy |
| `"Jump the merge queue"` / `"solo merge"` i `github/docs` | GitHubs kod-sök-API mot repot | träff endast i rättighetslistan (§ 1.3) |

**Vad jag INTE gjorde, och som skulle behövas för ett hållbart negativt
resultat:** en systematisk svepning av repon som faktiskt kör `merge_group` i
sina workflows — via kod-sök över många organisationer — följt av läsning av
deras contributing-texter. Det ligger utanför detta pass omfång.

**Räkningen fejkas inte:** för delfråga 3 landar jag på **noll verifierade
projekt-policyer** och **fyra** verifierade mekanism-precedenter. Slutsatsen i
§ 4 vilar därför på våra egna mätningar och på leverantörernas egna
kostnadsvarningar — inte på att någon jämförbar organisation gjort samma val.
Skulle ett framtida beslut med ADR-permanens vilja åberopa precedent för
*policyn* är underlaget för tunt som det står, och det ska då sägas rakt ut i
ADR:n snarare än fyllas ut.

---

## 4. Vägarna, vägda

| Väg | Möjlig för oss? | Vinst | Kostnad | Dom |
|---|---|---|---|---|
| **A. `jump` via GraphQL** | Ja, sannolikt (jag är repo-admin) | ≤ 5 min, och bara för en docs-revert | full ombyggnad av upp till 3 pågående poster (~450 s CI vardera); kan ej förarmeras; handskriven mutation under tidspress | **Avstå** |
| **B. `--admin` förbi kön** | **Nej** — `current_user_can_bypass: never` | — | — | **Stängd** (ADR-076 beslut 2) |
| **C. Acceptera kö-tiden** | Ja | ingen ny mekanism, inget nytt felläge | median 16 s, uppmätt värsta fall 5 min 8 s | **Vald** |
| **D. Nödvägen: inaktivera rulesetet** | Ja, men Marcus beslut | fullt förbi grinden | synlig i rulesetets historik; river skyddet för allt annat samtidigt | **Oförändrad sista utväg** |

Väg A är dessutom sämre än den ser ut. Vinsten (≤ 5 min) realiseras bara i det
läge där reverten är docs-klassad *och* råkar ligga bakom en kod-PR. Kostnaden
betalas alltid: upp till tre pågående poster byggs om från grunden, vilket
försenar dem med ~7 min var. I varje uppmätt konfiguration hos oss är väg A
netto-negativ.

---

## Dom

**Behovet av kö-företräde för en brådskande revert är borta.** Det som gjorde den
gamla regeln riktig var att sekvenseringen var en mänsklig hand som kunde välja
fel ordning. Kön väljer nu ordningen själv, och den ordningen straffar
systematiskt fel post — den snabba, inte den långsamma — vilket gör att en
kod-revert passerar praktiskt taget obehindrat.

En mekanism för företräde **finns** (`jump`), är förstapartsdokumenterad, och
GitHub namnger uttryckligen on-call-fallet som dess syfte. Vi bör ändå inte
använda den, eftersom den vid vårt uppmätta kö-djup kostar mer än den ger — och
framför allt eftersom den inte rör den kostnad som faktiskt vuxit.

`--admin`-vägen är stängd för oss, med avsikt, och det är verifierat mot faktisk
konfiguration snarare än mot `gh`:s hjälptext, som på den punkten är felaktig för
vårt repo.

---

## Vad jag inte kunde belägga

1. **Att `jump` faktiskt fungerar för oss — inte utfört.** Jag har belagt att
   mutationen finns i schemat och att jag är repo-admin. Jag har **inte** kört
   den. Att göra det kräver en verklig öppen PR och skulle omordna en skarp kö.
   Att mekanismen existerar är mätt; att den är tillgänglig för just vårt
   repo/plan är **bedömning**.
2. **Vem som får hoppa i kön är inte förstapartsdokumenterat.** GitHubs
   dokumentationssida om merge queue säger ingenting om roll eller rättighet för
   `jump` (kontrollerat direkt). Påståendet att det är admin-only by default
   kommer från
   [community-diskussion #65496](https://github.com/orgs/community/discussions/65496)
   — vars ursprungspost uttryckligen klagar på att det *"isn't mentioned
   anywhere"* — och den tråden har **ingen officiell GitHub-svarspost**. Behandla
   det som obelagt.
3. **`--admin`-spärren är härledd ur konfiguration, inte ur ett utfört försök.**
   `current_user_can_bypass: "never"` är GitHubs eget beräknade fält och är
   starkt belägg, men jag har inte försökt merga förbi kön. Ett skarpt försök
   skulle landa något i `main` och ligger utanför ett research-pass mandat.
4. **Kö-ordningen i § 2.2 är delvis inferens.** Jag såg körningarnas start- och
   sluttider, inte kö-positionerna. Att start-ordning ≈ kö-ordning följer av att
   kö-grenarna skapas i tur och ordning, och modellen bekräftades mot faktiska
   landnings-tidsstämplar (två grupperade landningar föll ut på sekunden). Men
   en post som köade och *inte* fick börja bygga (bortom `max_entries_to_build`)
   är osynlig i mina data. Vid djup > 3 gäller mina tal inte längre.
5. **Noll fällda kö-poster av 84 är inte bevis för att felläget är ovanligt.**
   Fönstret är två dygn. Det dyra fallet — en post faller ut och efterföljarna
   byggs om — är oprövat hos oss, inte motbevisat.
6. **Talet 5 min 8 s är ett uppmätt max, inte ett tak.** Det är största straffet
   i 30 landningar. Ett djupare kö-läge eller en långsammare svit ger ett större
   tal.

---

## Rekommendation

*Detta är en rekommendation, inte ett beslut.*

1. **Skriv om § Revert-vägen till att kön äger ordningen.** Stryk att revert-PR:n
   armeras FÖRST, att andra landningsklara PR:er ska vänta, och hänvisningarna
   till form B. Ersätt med samma mening som § Landnings-ordningen redan bär:
   armera med `gh pr merge --auto --merge`; kön sköter sekvenseringen. Brådskan
   ändrar rollerna, inte ordningen.
2. **Rätta exponeringsfönstret i samma landning.** Talen "omkring åtta minuter"
   och "drygt en" är mätta före kön och saknar kö-bygget. Mätt efter kön:
   **≈ 15 min för kod, ≈ 3 min för docs.** Detta är viktigare än punkt 1,
   eftersom det är siffran någon förlitar sig på när något brinner.
3. **Bokför `jump` som känd, prövad och medvetet vald bort** — inte som en
   glömd möjlighet. Med trip-wire, så beslutet går att ompröva mekaniskt:
   återuppta frågan om kö-djupet regelmässigt överstiger
   `max_entries_to_build` (3), eftersom poster bortom taket slutar byggas
   samtidigt och kostnaden då blir additiv i stället för parallell. Det är den
   strukturella klippan, inte en känsla av att kön blivit lång.
4. **Städa de kvarvarande stale-raderna i samma svep** (svar på `TASK-96` AC #4;
   se § 5 för inventeringen). Särskilt rad 344–348, som fortfarande påstår att
   merge queue *"är en egen öppen post"* och att ordningen gäller *"tills den
   finns"* — den finns sedan 2026-07-29.
5. **Överväg `min_entries_to_merge_wait_minutes` och `max_entries_to_merge` i
   kö-parametertabellen.** Tabellen i § Landnings-ordningen listar fem
   parametrar; rulesetet bär sju. Ingen av de två saknade ändrar något beslut
   här, men en tabell som ser komplett ut bör vara det.

---

## 5. Oväntade fynd utanför frågan

1. **`dequeuePullRequest` finns i GraphQL-API:et.** `CLAUDE.md` § Landning säger
   att *"`gh` har ingen dequeue"* — vilket är korrekt om CLI:t, och bekräftas av
   GitHubs dokumentation: *"You cannot use GitHub CLI to remove a pull request
   from a merge queue."* Men **API:et har det**: mutationen `dequeuePullRequest`
   är mätt närvarande i schemat. Slutsatsen *"en köad gren kan inte uppdateras,
   och det finns ingen väg ur"* är därmed för stark — det finns en väg ur, den
   går bara inte via `gh`. Detta är ett eget fynd som förtjänar ett kort; jag har
   inte prövat mutationen.
2. **`CONTRIBUTING.md` bär en andra motsägelse som `TASK-96` inte fångade.**
   Rad 344–348 (*"Avgränsning: detta är sekvensering för hand, ingen kö-automat"*
   … *"tills den finns är ordningen en aktörs ansvar"*) står som gällande text i
   en sektion vars rubrik säger att kön är aktiv sedan 2026-07-29. Den ligger
   utanför det bevarade historik-blocket och läses därför som instruktion.
3. **Full inventering av kvarvarande form A/B-referenser** (`TASK-96` AC #4):
   rad 312–316 (de överstrukna formerna, avsiktligt bevarade som historik),
   323–331 (form B:s bikostnad — CI-vakten), 332–337 (form B kräver att agenten
   är klar), 344–348 (fynd 2 ovan), 381–385 (revert-sektionens köordning),
   och 452 (*"gäller § Landnings-ordningens form B"*). Sex ställen; två är
   avsiktlig historik, fyra läses som gällande instruktion.

---

## Källförteckning

**Förstapartskällor — GitHub:**

- [Managing a merge queue](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue)
  — och dess råtext:
  [`managing-a-merge-queue.md`](https://raw.githubusercontent.com/github/docs/main/content/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue.md)
- [Merging a pull request with a merge queue](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/incorporating-changes-from-a-pull-request/merging-a-pull-request-with-a-merge-queue)
- [`additional-permissions.md`](https://raw.githubusercontent.com/github/docs/main/data/reusables/organizations/additional-permissions.md)
  — kö-rättigheterna "Request a solo merge" / "Jump to the front of the queue"
- [Add repository permissions to custom organization roles](https://github.blog/changelog/2024-08-29-add-repository-permissions-to-custom-organization-roles/)
  — on-call-användningsfallet, 2024-08-29
- [cli/cli#8746 — `gh pr merge --admin` Does not circumvent merge queue as documented](https://github.com/cli/cli/issues/8746)

**Tredjepart / obekräftat:**

- [community-diskussion #65496 — Permissions required to jump the queue](https://github.com/orgs/community/discussions/65496)
  — ingen officiell svarspost; används endast som markering av att frågan är
  odokumenterad

**Mätningar utförda i detta pass (2026-07-30):**

- GraphQL-introspektion mot `api.github.com`: `EnqueuePullRequestInput`,
  `EnablePullRequestAutoMergeInput`, `DequeuePullRequestInput`, `Mutation`-fälten
- `gh api repos/high-five-group/miranon-media-admin/rulesets/19627609`
- `gh pr merge --help` på `gh` 2.96.0
- 84 `merge_group`-körningar och 45 landade PR:er via
  `gh api .../actions/runs` och `gh pr list`

**Internt:**

- [`CONTRIBUTING.md`](../../CONTRIBUTING.md) § Landnings-ordningen, § Revert-vägen
- [ADR-076](../decisions/ADR-076-merge-grinden-ruleset-pr-flode.md) — merge-grinden, tom bypass-lista
- [ADR-077](../decisions/ADR-077-riskanpassad-ci-klassning-dedup-nightly.md) — CI-klassningen
- [`merge-queue-mot-staging-mutex-2026-07-26.md`](merge-queue-mot-staging-mutex-2026-07-26.md)
  — föregående pass; dess § 4 citerade redan köhopps-varningen
