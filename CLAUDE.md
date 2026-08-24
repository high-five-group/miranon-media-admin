---
owner: marcus803
updated: 2026-08-24
review_by: 2026-11-15
status: stable
---

# CLAUDE.md — Miranon Media Admin (React)

> **Äger:** de projekt-specifika alltid-gäller-instruktionerna till Code
> (triage-processen `ADR-053`, DoD-kommandolistans pekare-form,
> verktygsfakta) — ordalydelsen bor här, inte kopierad någon annanstans.
> **Kartlägger:** repots övriga styrande docs (`docs/byggplan.md`,
> `docs/reference/data-model.md`, `CONTRIBUTING.md`, `docs/decisions/`) via
> pekare, aldrig kopia (`ADR-100` §2). **Vid konflikt vinner:** den yta
> `ADR-100` §1:s domäntabell pekar ut för den aktuella kunskapsklassen —
> denna fils egen prosa om en annan yta viker alltid för den utpekade
> källan.

---

## Vad är detta projekt?

Admin-app för **Miranon Media** (Roger & Lotta). Hanterar event, anmälningar, betalningar, personer, leads, närvaro och mail.

Detta är en **React-konvertering** av det Vue-byggda systemet i `~/Repon/miranon-media-os/`. Vue-projektet ligger kvar som referens under hela konverteringen — alla 4 komponenter på 11/11/11, 12 composables och hela arkitekturen porteras steg för steg enligt en styrande plan. Vue-repot `~/Repon/miranon-media-os/` är **fryst** referens — inte ett aktivt redigerings-mål.

**Styrande dokument för byggandet:** `docs/byggplan.md` (i detta repo). Vue-repots `react-migration/`-mapp är historiskt referensmaterial — användes som källa under Fas 0 + Fas 1 men ersätts av byggplan.md från och med Fas 2.

**Airtable-basen är en förstklassig LEVERABEL, inte ett provisorium:** den maxas KONTINUERLIGT till 11/10 / branschledarmässig — defekter och förbättringspotential åtgärdas i basen när de avtäcks, ej väntas ut — och blir mall + övningsprojekt i Passionslyftet. Den är datakälla nu för att bygget ska avtäcka vad appen behöver av sin datakälla — defekt-registret (`docs/reference/data-model.md` §Kända fällor + T16) är kravspecen, ett löpande committat åtagande. Resolution sker I BASEN, ej lappa, ej designa-bort; Supabase-migration är ett separat senare spår, ej en ersättning. Post-Fas-6-milstolpen är omdefinierad till en dedikerad SLUTGENOMLYSNING ("en gång till") för kvarvarande förbättringspotential + audit av registrens korrekthet — ej längre resolutions-hemmet. Fullt beslut: [ADR-063](docs/decisions/ADR-063-airtable-bas-som-forstklassig-leverabel.md) § Updates (2026-08-14).

---

## Instruktioner — Alltid gäller

- **Styrande dokument för byggandet:** `docs/byggplan.md`. Läs den innan varje fas. Avvik aldrig utan att uppdatera byggplanen först.
- Research före implementation (princip: `~/.claude/CLAUDE.md` § Instruktioner, "Research först, bygg sedan"): kolla React Aria, TanStack, Radix, FK Designsystemet INNAN du designar en lösning. Branschledarnas mönster är golvet.
- **Airtable-schema före write:** konsultera `docs/reference/data-model.md` (fält-skrivbarhet, formel/rollup-fält, §Kända fällor, write-fält-IDs) INNAN du designar någon Airtable-fält-operation. Anta aldrig fält-form — verifiera mot referensen eller live via Code. Gäller vid Code:s fält-operations-design och utförande.
- **Prod-basens UI-/automations-lager (historisk karta):** [`docs/reference/schema_reference.md`](docs/reference/schema_reference.md) — interfaces, vyer, formulär, Zapier/Make och automationerna A1–A11 med skriptkod; frusen ögonblicksbild mars 2026, kopierad ur frysta Vue-repot 2026-08-01. För fält-data är `data-model.md` auktoritativ.
- **Airtable-plattformens väggar:** `docs/reference/airtable-constraints.md` är den auktoritativa katalogen över vad Airtable strukturellt INTE kan (30 poster, A–G), var och en med `v1-kompensation` + `Fas E-krav` — den är därmed också migrations-kravspecen. Konsultera INNAN arkitektur-, test- eller CI-design som rör datakällan, och anta aldrig att en vägg är vår egen design. Vad valet kostar i testbarhet: [ADR-063](docs/decisions/ADR-063-airtable-bas-som-forstklassig-leverabel.md) § S91-not.
- **Samarbetssystemets mekanik:** hur vårt Code/Marcus-system fungerar och sitter ihop bor i hubbens `SYSTEMET.md` (`marcus-system/SYSTEMET.md`) — den navigerbara mekanik-kartan (roller, hub/spoke, plugin/skills, governing/CI, lifecycle, tråd/backlog-substrat, MCP, distribution). Spoke-pekare: [`docs/reference/systemet.md`](docs/reference/systemet.md). Slå upp on-demand när du behöver systemets mekanik; läs inte in den i förväg.
- Testa nytt bibliotek/approach med minimalt test (1 komponent, 1 hook) — princip: `~/.claude/CLAUDE.md` § Instruktioner ("minimalt test... innan full implementation").
- Verifiera per komponent: 11/11/11 (bibliotek) eller 11/10/10 (vyer) — grundprincipen (`~/.claude/CLAUDE.md` § Instruktioner, "Verifiera innan klart") gäller alltid.
- Fånga lärdomar i `tasks/lessons.md` — kadens och `[UNIVERSAL]`-märkning: `~/.claude/CLAUDE.md` § Instruktioner ("Fånga varje lärdom").
- **Uppdrag till agenter källmärker varje faktapåstående** (fil/commit/kommando) — obelagda påståenden behandlas av mottagaren som HYPOTES ([ADR-086](docs/decisions/ADR-086-uppdragets-premisser-provas-av-mottagaren.md)).
- **Sanningshierarkin — varje kunskapsklass har EXAKT EN auktoritativ källa:** domäntabellen bor i [ADR-100](docs/decisions/ADR-100-sanningshierarkin-koden-ager-beteendet.md) §1 — slå upp den där, den återges inte här. Karta, aldrig kopia — vid en motsägelse mellan två styrande ytor vinner den ADR:n pekar ut.

---

## Triage av det oväntade — alltid-på (ADR-053)

När något OVÄNTAT uppstår (utanför nuvarande scope — nära eller långt ifrån, men alltid
oväntat), kör denna triage innan du fortsätter. Lita inte på omdöme i stunden — det är den
empiriskt svagaste mekanismen (självgransknings-fångstraten, se `~/.claude/CLAUDE.md`
§ Roll-arkitektur), samma svaghetsklass ADR-043 kodade bort för lifecycle.
Klassa mot två axlar: närhet till nuvarande scope, och om det BLOCKERAR nuvarande arbete.

- Blockerar + i scope → hantera nu (enabling-detour, egen landning).
- Blockerar + utanför scope → STOPPA, eskalera till Marcus (väg-beslut).
- Blockerar ej + värdefullt → defer till tråd-registret (durabelt, för senare).
- Blockerar ej + lågvärde → förkasta EXPLICIT (noteras kort, aldrig tyst).

Ledstjärna: registrera — förkasta aldrig tyst. Ett oväntat värde som inte fångas dör med
sessionen. Baren för "blockerar" hålls hög: bara det som genuint stoppar nuvarande arbete
eskaleras eller hanteras nu; allt annat defereras eller förkastas, så inte varje småsak blir
en tråd.

Kriteriet ny session vs detour = sessions-paus-distinktionen (ADR-051): fortsätter samma
scope → detour; distinkt scope → egen session.

HUR (ge tråden ett ID, lägg en rad i indexet, skapa ev. tråd-kort): se
tasks/threads/README.md § "Så här registrerar du en ny tråd". Princip här, mekanik där.

---

## Stack

React + TypeScript + Vite + TanStack Router + Biome; se `package.json` för versioner.

---

## Bygg, testa, linta

Kanoniska kommandon (per `CONTRIBUTING.md` Definition of Done):

```bash
npm run test:api            # API-tester gröna
npm run typecheck           # 0 typfel (tsc -b, äkta över project references)
npx @biomejs/biome check .  # 0 lint-fel
npm run build               # bygg grön
```

De fyra ovan är DoD-disciplinen (`ADR-036`, `CONTRIBUTING.md`) och är vad som
körs före push. CI kör betydligt fler grindar (shellcheck-strict, actionlint,
yamllint, audit-ci, 14 dokumentations-grindar (`npm run check:docs`s egen
slutrad, TASK-161.2-omräkning 2026-08-08 — stod som "13" här, exakt den
kopierings-drift stycket nedan varnar för), ~20 gatekeeper-testsviter,
Acceptance-klassen, Webblasarbeteende-klassen) — **och det är CI:s jobb, inte
ditt.** Merge queue hindrar en röd PR från att landa, så kostnaden av att
missa något lokalt är en extra CI-cykel, inte ett trasigt `main`.

### `verify:ci-parity` är ett DIAGNOSVERKTYG — plocka fram det, kör det inte som rutin

```bash
npm run verify:ci-parity         # scripts/verify-ci-parity.mjs — kör CI:s uppsättning lokalt
npm run verify:ci-parity:fast    # samma minus Acceptance+Webblasarbeteende — iteration bara
```

**Kör det INTE före varje push.** Full körning kostar **910,7 s** mot CI:s
**401,0 s** parallellt — felfrekvensen i mätfönstret var **3 av 99 ≈ 3 %**,
vilket gör kostnaden ungefär **30× besparingen**. En rutin som körde
verktyget på varje landning mättes **2,3–2,9× dyrare** än vad som faktiskt
gjordes; `Acceptance` + `Webblasarbeteende` stod ensamma för ~91 % av
kostnaden och fällde **noll** fel — samtliga röda låg i de billiga jobben.

**Plocka fram det i tre lägen:**

1. Du har ändrat `ci.yml`/`ci-suite.yml` själv och vill veta att uppsättningen
   fungerar innan du pushar
2. CI blev röd och du vill reproducera lokalt i stället för att pusha om
3. Ändringen är stor eller riskabel nog att en extra CI-cykel kostar mer än
   vanligt

**Varför raden ser ut så här nu, och underlagets styrka:** en tidigare
formulering gick utöver `ADR-036` (lokal verifiering är DoD-disciplin, inte
full CI-replik) och lästes bokstavligt samma dag den skrevs — en agent körde
153 acceptance-tester på en ändring som bestod av en enda markdown-fil.
Felfrekvensen ovan vilar på n=99 med 3 röda — ett stickprov, inte statistik;
eskalering uppåt är alltid tillåten, och talet omprövas när `npm run
metrics:ci` bär mer data. Beslutets sammanfattande tabell och fullständig
historik:
[`ADR-036`](docs/decisions/ADR-036-kvalitetsgrind-ci-enda-mekaniska-enforcement.md)
§ Updates 2026-08-05 (andra amenderingen). Full mätserie och metod:
[`verify-ci-parity-regel-vantetid-2026-08-05.md`](docs/research/verify-ci-parity-regel-vantetid-2026-08-05.md).

**Härlett ur `ci.yml`/`ci-suite.yml`, inte en fjärde handhållen kopia.**
Skriptet YAML-parsar de två workflow-filerna och kör deras `run:`-block
VERBATIM vid varje körning (en ny rad i ett känt jobb plockas upp
automatiskt, ingen manifest-post att glömma), och återanvänder `npm run
check:docs` för dokumentations-grindarna i stället för att duplicera dem. En
**paritets-grind** körs INNAN något annat och fäller fail-closed (exit 2) om
ci.yml/ci-suite.yml drifar bort från vad `.ci-parity-policy.json` känner
till — samma [ADR-083](docs/decisions/ADR-083-prosa-som-pastar-mekanism.md)-
disciplin resten av filen följer. Default är alltid det fullständiga läget,
med avsikt (Acceptance-klassen ensam är CI:s tyngsta jobb — se
[`CONTRIBUTING.md`](CONTRIBUTING.md) § Acceptance-klassen); `--fast` är en
medveten nedskalning för iteration, aldrig en ersättning för fullständig
täckning. Full mekanik (UNDANTAGEN, SUITE-YTAN, exit-koder): skriptets eget
huvud, `scripts/verify-ci-parity.mjs`.

**Sedan `TASK-142` (2026-08-05) är "fullständigt" villkorat av DIFFEN, inte
längre alltid varenda jobb** — skriptet läser samma D0-glob ur ci.yml:s
`changed`-jobb som CI självt gör och skippar test-fast/acceptance/
webblasarbeteende när VARJE ändrad fil matchar den. Minsta osäkerhet i
klassningen faller till fullt läge (`--full` tvingar det oavsett diff) —
**osäkerhet eskalerar alltid uppåt, aldrig till en gissad delmängd.** Detta
är en ANNAN axel än `--fast` (en medveten nedskalning; diff-klassningen är
i stället härledd ur CI:s egen gating) — härledningen är avsikten, inte en
garanti: paritetsvakten fäller fail-closed på strukturella avvikelser, men
en logikbugg i klassningen själv ligger utanför vad den kan se (en tidigare
formulering påstod att skriptet *"kan bara köra MER än CI, aldrig mindre"*
— ett löfte ingen implementation kan hålla). Full algoritm (diff-bas,
micromatch, exit-koder): `scripts/verify-ci-parity.mjs` § DIFF-KLASSNINGEN.

**Klassningen läser SÖKVÄG, inte filändelse.** D0 är en positiv allowlist
(disk-verifierad mot `ci.yml`s `paritet:start klassning-d0`-block, TASK-161.2
2026-08-08 — kopian nedan var tidigare ofullständig, saknade 9 av 17
positiv-poster och 1 av 12 undantag): `**/*.md`, `LICENSE`, `docs/**`,
`tasks/**`, `tests/vale-regression/**`, `scripts/test-vale-regression.sh`,
`.github/ISSUE_TEMPLATE/**`, `.github/PULL_REQUEST_TEMPLATE.md`,
`.github/CODEOWNERS`, `.vscode/extensions.json`, `.editorconfig`,
`.lycheeignore`, `.vale.ini`, `.vale/**`, `.markdownlint-cli2.jsonc`,
`.claude/**`, `.claude/**/.*`) med explicita undantag (`.github/workflows/**`,
`.github/dependabot.yml`, `package.json`, `package-lock.json`,
`audit-ci.jsonc`, `tsconfig*.json`, `biome.json`, `vite.config.ts`,
`playwright.config.ts`, `tsr.config.json`, `.nvmrc`, `.gitignore`). Formen är
avsiktlig: **allt som inte uttryckligen står i allowlisten hamnar i full
klass**, så en ny filtyp kräver ingen uppdatering av regeln för att behandlas
säkert. Denna prosa-kopia är ett underhållet UNDANTAG från den regeln (skriptet
självt härleder listan live ur `ci.yml`, se ovan) — hålls för hand, kan därför
återigen glida; `scripts/check-listparitet.sh` bevakar INTE denna kopia (den
bevakar `paritet:start/slut`-parningen inom `ci.yml` självt, inte denna fil).

**Känd kant, medvetet ej undantagen:** `.claude/**` ligger i allowlisten, så
en ändring i `.claude/settings.json` (hook-mekanismen) klassas som docs-only.
För CI är det korrekt — CI kör inte våra lokala hooks. För oss är det inte
harmlöst: en trasig hook-config stoppar varje agent i repot. Att handplocka
undantag ur den härledda globen vore däremot exakt den drift härledningen
finns för att förhindra, så kanten bokförs i stället för att lappas.

**Varför raden står här och inte bara i skriptets egen header:** samma
mönster som `seed:review` och `metrics:flake` nedan — fyra mätta instanser i
EN session (2026-08-05, S97) visade att var och en som verifierar för hand
plockar ihop sin egen ofullständiga delmängd (fel jobb, fel flagga, fel
scope) och missar olika delar, och ett verktyg utanför sessionsstartens
läs-ordning hittas inte när det behövs.

### Granskningsdata i staging — bygg den ALDRIG för hand

Ska Marcus granska en yta som kräver data staging inte har (ett kommande event
med anmälningar i båda tillstånden, en fylld kö, en lång lista):

```bash
npm run seed:review -- --ort ZZ-GRANSKNING-SNN --bekraftade 8 --obekraftade 8 --dagar 8
npm run seed:review:clean -- --ort ZZ-GRANSKNING-SNN
```

Skriptet bär de fällor som kostade tid när jobbet gjordes för hand: bas-guard mot
prod, korsläsning mot `.purge-staging-policy.json` så granskningsdata inte städas
bort mitt i en pågående granskning, förbud mot att röra de permanenta
rollup-fixturerna, och ett datumval utanför sentinel-klustret. Detaljer +
`localStorage`-fällan: [`docs/reference/staging-verifiering-runbook.md`](docs/reference/staging-verifiering-runbook.md)
§ Granskningsfixtur.

**Fixturen har en livstid sedan `TASK-95`.** Skapandet stämplar ett utgångsdatum
i eventets `Notering` (14 dagar som default, `--livstid N`), och förfallo-svepet
städar det som passerat — automatiskt i båda lägena, eller ensamt med
`npm run seed:review -- --sweep`. En fixtur vars stämpel INTE passerat rörs
aldrig: det är "granskningen pågår". Svepet är ingen tidsdriven automat — det
körs när skriptet körs.

**`ZZ-GRANSKNING-*` får ALDRIG bli purge-bar.** Att lösa en kvarlämnad fixtur med
en target i `.purge-staging-policy.json` river skyddsräcke 2 i stället för att
laga något — setup-purgen kör före varje staging-CI-jobb och hade raderat datan
mitt under granskningen. Restlistan bokförde en gång `ZZ-GRANSKNING-*` och
`app-segment-test` som samma klass av lucka; de har **motsatta** rätta svar
(`app-segment-test` fick sin target i `TASK-87`). Gör inte analogin.

**Varför raden står här och inte bara i runbooken:** samma jobb gjordes för hand
två gånger (2026-07-22 och 2026-07-26) innan skriptet fanns, och ett verktyg som
inte ligger i sessionsstartens läs-ordning hittas inte när det behövs.

### Flakighet mäts med riggen — bygg ALDRIG en egen mätserie

Ska ett test bedömas som flakigt, eller en ändring mätas mot en flake-rat:

```bash
npm run metrics:flake            # scripts/flake-matserie.mjs
```

Riggen kodar de egenskaper som gjorde `TASK-74`:s mätning ärlig: **interfolierad**
A/B (`A,B,A,B,…`, aldrig blockad — blockade armar mäter tidsfönstret lika mycket
som ändringen), **loadavg per körning** i rådatan så ett utfall kan deflateras i
efterhand, `--retries=0` (retries döljer flaken inuti ett grönt jobb), och
**rådata per testresultat** så en efterhandsanalys inte kräver omkörning. Den
mäter — den dömer inte, och bär medvetet ingen tröskel för "acceptabel" flakighet.

**Varför raden står här:** fyra kort (`TASK-77`–`80`) behöver riggen, och bygger
var och en sin egen variant blir talen ojämförbara — vilket är precis det fel
riggen finns för att förhindra. Samma skäl som `seed:review` ovan: ett verktyg
utanför läs-ordningen hittas inte när det behövs.

**Läs alltid ut n innan ett noll-resultat tolkas.** `TASK-74` mätte 1 fällning av
14 CI-*jobb*; noll fällningar på sex lokala körningar är förenligt med den raten
och bevisar ingenting. Och klass B är övervägande **lokal** — för en flake som
bara CI ser kan en lokal serie vara fel instrument helt och hållet.

### Prod-EF-deploy körs via SKRIPTET — handkörning har fällt tre gånger

Ska Edge Functions till prod (fas 4-klassen) kör Marcus, i sin egen terminal
eller via `!`-prefixet:

```bash
bash scripts/fas4-prod-deploy.sh --kontrollera <prod-ref>   # läser prod-läget, ändrar inget
bash scripts/fas4-prod-deploy.sh --deploya     <prod-ref>   # länka → deploya → verifiera → länka tillbaka
```

Skriptet kodar bort de tre fel som mätts när sekvensen kördes för hand:
`supabase link` utan styrd stdin **hänger** på databas-lösenordsprompten (en
hängning är inget felmeddelande); **fel projekt länkat** vid en skarp operation
— fem EF:er deployades oavsiktligt till prod 2026-08-10 16:47 på exakt det
felet; och **återlänkningen till staging glöms** — `link`-tillståndet är sticky
och osynligt, så nästa `db push` i samma katalog går mot prod. Skriptet styr
stdin överallt, verifierar `supabase/.temp/project-ref` före varje skarp
operation, och återlänkar i en EXIT-trap som körs även när något fallerar
halvvägs.

**Project-refen anges som ARGUMENT, aldrig ur config — och det är avsiktligt.**
`scripts/deny-prod-ref.sh` matchar refens närvaro i Bash-kommandosträngen, så
ett bekvämt anrop som läste refen ur `.prod-ref-policy.conf` hade gjort hela
prod-låset verkningslöst för varje agent som läser repot. Argument-formen
bevarar låset: Marcus anrop bär refen och passerar hans kanal, en agents anrop
bär den också och **fälls**. Prövat skarpt — ett agent-anrop med prod-refen
avvisades av låset med korrekt skäl. Testsviten
(`scripts/test-fas4-prod-deploy.sh`, CI-wirad) vaktar invarianten i båda
riktningar.

**Läs `UPDATED_AT`, inte `VERSION`, i verifieringen.** En deploy bumpar
`VERSION` +1 på ALLA funktioner medan `UPDATED_AT` står stilla för dem som inte
rördes — plattforms-artefakt, inte ett fel.

**Och: en driftkarta härledd ur git är en HYPOTES om prod, aldrig en mätning.**
Fas 4-underlaget beskrev tre EF:er som "aldrig deployade" — de hade deployats
kl 06:59 samma dag underlaget skrevs. Mät artefakten (`functions list`), härled
den inte. Full historik: `TASK-272`, `TASK-268`, `TASK-269`.

**Varför raden står här:** samma skäl som `seed:review` och `metrics:flake`
ovan — ett verktyg utanför sessionsstartens läs-ordning hittas inte när det
behövs, och nästa prod-deploy sker i en session som inte var med när skriptet
byggdes.

### En ny hooks skarpbevis kan inte FÖRLITAS på i sessionen som byggde den

Hookar registrerade i `.claude/settings.json` mitt i en session **kan inte
förlitas på att tas i bruk i den sessionen** — men "tas ALDRIG i bruk", som
denna rad påstod fram till 2026-08-09, är falsifierat av en mätning.
Förstapartskällan
([hooks-guide](https://code.claude.com/docs/en/hooks-guide)) beskriver en
MÖJLIGHET, inte en visshet: *"the file watcher **may have missed** the
change: restart your session to force a reload."* Det finns ingen manuell
reload-väg — `/reload-hooks` existerar inte och `/hooks`-menyn är read-only
— men watchern KAN plocka upp ändringen själv: mätt 2026-08-08 (S93,
`task-167`-kortets notes) laddades en nyregistrerad deny-hook mitt i sin
egen byggsession när settings-ändringen anlände via git-merge
(main-ff-synken) och fällde skarpt ett verkligt agent-kommando. Den gamla
absoluta formen var exakt felklassen den själv varnar för: ett "aldrig"
byggt på en källa som säger "may".

**Planera för utebliven laddning — och ta emot en tidig fällning som bevis:**

1. Bevisa **logiken** i byggsessionen — tvåsidig testsvit + manuell körning av
   skriptet mot verkligt tillstånd. Båda går utmärkt.
2. Bokför **skarpbeviset som öppen skuld i handoffen**, aldrig som gjort.
3. Betala skulden som en av **nästa sessions första handlingar** — ELLER
   stäng den i förtid: fäller hooken skarpt redan i byggsessionen (t.ex.
   efter att settings-ändringen återvänt via en main-synk) är det ett
   GILTIGT skarpbevis och skulden bokförs som betald med instansen som
   belägg (`task-167`-precedentet). Tidig laddning är en bonus att ta emot,
   aldrig en plan att räkna med.

Skilj alltid "hooken är fel" från "hooken är inte laddad" med en
**differentialmätning**: kör skriptet manuellt med identisk hook-JSON (ska
fälla), och provocera samtidigt en BEFINTLIG hook via harnesset (ska fälla).
Faller den befintliga men inte den nya är det registreringen, inte logiken.

Samma strukturella klass som MCP-verktygsytan (S97 Del 2): båda bestäms vid
sessionsstart, och en mitt-i-sessionen-ändring kan inte FÖRLITAS på att slå
igenom retroaktivt — för hookar KAN den göra det (mätningen ovan), men bara
som bonus. **Fråga "bestäms detta vid sessionsstart?" innan du planerar ett
bevis som förutsätter motsatsen.**
Underlag: `tasks/lessons.md` L450 (konsoliderad ur det tidigare fragmentet
`tasks/lessons.d/hook-registrerad-mitt-i-sessionen-laddas-inte.md`);
ALDRIG-formen falsifierad och mildrad 2026-08-09 (S93 tionde resumen;
instansen i `task-167`-kortets notes, skarpbeviset betalt i förtid
2026-08-08).

### Worktree-isoleringens gräns går vid EGET REPOS huvudkatalog — inte vid cross-repo

**Gränsen är EN sak och bara en:** en worktree-isolerad agent kan inte rikta
**git-kommandon via Bash** mot **sitt eget repos huvudkatalog** (den delade
checkouten som äger `.git`-common-dir för alla dess worktrees). Allt annat är
fritt — inklusive andra repon på disken.

Harnessets avvisningstext, verbatim (mätt 2026-08-04, S97; känn igen den, den
är engelsk och generisk till skillnad från våra egna svenska hook-skäl):

```text
This agent is isolated in the worktree <path>, but this command redirects git
to the shared checkout via -C. Refusing to run it — a worktree-isolated agent's
git operations must target its own worktree.
```

Nyckelordet är **`shared checkout`**, inte "annat repo". Förstaparten säger
samma sak — `code.claude.com/docs/en/sub-agents.md`: *"a command that redirects
git into **the main checkout** fails with an error, whether it uses `git -C`,
`--git-dir`, a `GIT_DIR` or `GIT_WORK_TREE` variable, or a `cd` into the main
checkout first. **A command too complex to check also fails**"*.

**Den fullständiga matrisen, mätt cell för cell (S97, 2026-08-04):**

| Mål | Isolerad agent | Oisolerad agent |
|---|---|---|
| Egen worktree, allt | OK | — |
| **Eget repos huvudkatalog — git via Bash** (`status`, `log`, `-C`, `cd &&`) | **AVVISAS** — även ren LÄSNING | OK |
| Eget repos huvudkatalog — **Read-verktyget** | **OK** — spärren gäller Bash-git, inte filläsning | OK |
| Annat repo (hubben) — läsning | OK | OK |
| Annat repo — skrivning, `git add`, `git commit` | **OK** | OK |

Två celler är kontraintuitiva och värda att minnas: **läsning** mot eget repos
huvudkatalog avvisas (spärren skiljer inte på läs/skriv), medan
**Read-verktyget** mot samma katalog går igenom (spärren sitter på Bash-git,
inte på filsystemet).

**Konsekvensen är operativ:** hub-ändringar — plugin-skills, `SYSTEMET.md`,
hubbens lessons-volymer — **kan delegeras**, till en agent som kör
**oisolerat**. Kör den i egen worktree fungerar hub-arbetet fortfarande, men
den kan inte röra spokens huvudkatalog under tiden.

**OPRÖVAT, anta ingenting:** `EnterWorktree` mot ett syskonrepo. Den är en
annan mekanism än `git -C` och kan mycket väl avvisas — den ingick i S97:s
ursprungliga påstående men har aldrig mätts isolerat.

**Varför raden stod fel i tre veckor, och vad det lär:** den sade tidigare att
"agenter kan INTE arbeta cross-repo" och att hub-arbete aldrig får delegeras.
Påståendet vilade på **en** mätning — en worktree-isolerad bygg-agent mot
hub-repot — vars avvisning tolkades som en cross-repo-spärr utan att texten
lästes. Den troliga verkliga orsaken står i förstapartscitatet ovan: `cd
~/annat-repo && git status` matchar både `cd`-mönstret och "too complex to
check", och fälls därför **utan att målet spelar roll**. Slutsatsen
generaliserades sedan från en agenttyp till alla, och från ett kommandomönster
till hela cross-repo-klassen. Rättat 2026-08-04 efter en fyra-cellsmätning där
en isolerad agent både läste hubben och **committade i ett främmande repo**
(commit `c3a9eb5` i ett kastbart testrepo). En avvisning berättar VAD som
stoppades — den berättar inte VARFÖR förrän man läser den.

**Varje worktree-skapelse har dessutom en mätt bieffekt.** Claude Code skriver om
huvudrepots `core.hooksPath` till en ABSOLUT path i den DELADE `.git/config` vid
varje ny worktree — belagt i `anthropics/claude-code` `#27474`, `#66993`,
`#72714` (öppen) och verifierat i vår egen binär (S97). Följden: alla worktrees
kör huvudkatalogens hook-kopia i stället för sin egen, tills `.githooks/pre-commit`
självläker värdet vid nästa commit (`T121`).

Det går inte att laga hos oss. **Men exponeringen är vår:** en session som
spawnar tolv worktree-isolerade agenter triggar buggen tolv gånger. Isolering är
rätt när en agent skriver kod som kan kollidera vid merge — den är onödig för ett
research-pass som läser och skriver en enda fil under `docs/research/`. **Isolera
efter behov, inte som default.**

### Landning sker via MERGE QUEUE — maskinen äger ordningen sedan 2026-07-29

All landning går via branch + PR (direktpush till `main` avvisas av ruleset,
[ADR-076](docs/decisions/ADR-076-merge-grinden-ruleset-pr-flode.md)). Armera med
`gh pr merge --auto`; **kön sköter sekvenseringen**. Den bygger varje
post mot `main` plus posterna före den, så `BEHIND` uppstår inte längre av att
två PR:er landar nära varandra.

**Strategiflaggan anges INTE** — kön äger strategin, och `gh` avvisar formen
med `! The merge strategy for main is set by the merge queue`.
**Exitkoden beror på PR:ens läge, meddelandet gör det inte** — samma
avvisningstext kan ge `exit 1` (oarmerad PR) eller `exit 0` (redan armerad PR,
armeringen orörd). **Läs texten, inte bara `$?`.** Mätningarna (`#705`,
`#796`) och strict-avstängningens historik (`#747`/`#748`, den upphävda
manuella sekvenseringsregeln): [`CONTRIBUTING.md`](CONTRIBUTING.md) §
Landnings-ordningen · [ADR-076](docs/decisions/ADR-076-merge-grinden-ruleset-pr-flode.md)
§ Amendering 2026-08-05.

**Vad som fortfarande gäller:** armera aldrig en PR vars bygg-agent fortfarande
arbetar, och kör aldrig `update-branch` mot en sådan gren.

**Svep vid varje väckning — passiv väntan är avskaffad som arbetsläge
(`T112`, Marcus GO 2026-08-01).** Orkestreraren äger landnings- och
merge_group-verifikaten: agenters vakter väcker ingen över turgränsen
(`T112` § Mätt), och agenter parkerar inte längre på landnings-vakter
(`.claude/agents/bygg-agent.md` § Parkera aldrig på en landnings-vakt).
Stående form: `scripts/heartbeat-svep.sh` (mekaniserad ur `TASK-119`, config-driven
via `.heartbeat-svep-policy.conf`) — en persistent heartbeat-monitor som var
~90:e sekund (branschbelagt intervall,
`docs/research/orkestrerar-vackning-polling-vs-event-driven-2026-08-02.md`)
tar en TREVÄGS-snapshot — main-SHA · röda check-rollups · DIRTY-mängd — plus
en fjärde väg (armerings-kandidater, se tabellen nedan). RÖTT och DIRTY
rapporteras level-triggered: varje svep tillståndet håller, inte bara vid
övergången (`L443`) — samma familj som Kubernetes' watch+resync-mönster,
immun mot exakt den envägs-blindhet som missade PR #572. Oberoende av
agenternas vakter, och varje väckning — notifikation ELLER heartbeat-event —
utlöser samma svep: verifiera faktiskt läge mot git/REST → armera det som
står oarmerat → väck ägar-agenter → starta nästa post.
Vakt-event är väckarklocka, aldrig fakta: förgrundsverifiera före varje
handling — fem falska terminal-signaler i ett enda pass är belagda
(S91 Del 39.5), inklusive ett "MERGED med SHA" vars SHA aldrig nådde `main`.

**Namnet på mönstret: subagent = Activity, orkestrerare = Workflow** —
Temporal-mönstret som förebild för namngivningen: en subagent utför sitt
avgränsade jobb och returnerar, den äger aldrig väntan, eftersom den saknar en
framtida tur att vakna i; orkestreraren är den durabla parten och äger all
väntan, inklusive svepet ovan. Fullt kontrakt:
[ADR-096](docs/decisions/ADR-096-subagentens-vantekontrakt.md).

**Push-ekonomins princip: commit är gratis, push kostar**
([ADR-097](docs/decisions/ADR-097-arbetsformens-tillstandsbarare.md)).
Undantagslistan — vad som pushas direkt kontra väntar till en färdig enhet
— och gransknings-regeln (verifiera mot dev-server/staging, aldrig mot en
väntad landning) bor i [`CONTRIBUTING.md`](CONTRIBUTING.md) §
Landnings-ordningen, inte här — samma budget-skäl som `ADR-097` § `(d)`
avvisar för hela arbetsformens regelmängd.

**`autoMergeRequest: null` betyder INTE "ej armerad".** Fältet beror på PR:ens
tillstånd i armerings-ögonblicket. `gh pr merge --help` säger det rakt ut:
*"If required checks have not yet passed, auto-merge will be enabled. If
required checks have passed, the pull request will be added to the merge queue."*

| Läge vid armering | Fältet | Vad det betyder |
|---|---|---|
| Checks körs — nypushad PR, normalfallet | **satt** | fältet ÄR signalen |
| PR:en redan `CLEAN` | `null` | köades direkt; inget `autoMergeRequest` skapas någonsin |
| Efter merge | `null` | nollas oavsett — säger ingenting om armeringen |
| PR:en sparkas ur kön (`failed_checks`-utsparkning) | `null` | **KONSUMERAD armering** — PR:en ser identisk ut med en aldrig armerad; kräver ett NYTT `gh pr merge --auto` |

Disambiguera med ett andra `gh pr merge --auto`: svaret
`already queued to merge` betyder köad.

**Automatiserad klassning ska fråga `isInMergeQueue` i SAMMA GraphQL-query,
inte bara `autoMergeRequest`.** Tabellrad 2 ovan — en PR som var `CLEAN` vid
armeringen köas direkt utan att `autoMergeRequest` någonsin sätts — är den
VANLIGA vägen genom kön, inte ett undantag. Ett skript som bara läser
`autoMergeRequest == null` kan därför inte skilja "korrekt köad" (tyst) från
"aldrig armerad"/"utsparkad med konsumerad armering" (larma) —
`isInMergeQueue` skiljer dem åt: `isInMergeQueue: true` ⇒ tyst, `false` ⇒
larma (kan fortfarande vara ANTINGEN aldrig-armerad ELLER utsparkad — den
skillnaden kräver fortfarande det andra `gh pr merge --auto`).

**"GraphQL" ovan är bokstavligt — `gh pr view --json isInMergeQueue` finns
INTE.** Anropet faller med `Unknown JSON field: "isInMergeQueue"` plus en
fältlista där namnet saknas (mätt i `gh` 2.96.0, två gånger oberoende
2026-08-24). Fältet nås bara via `gh api graphql`. Raden är alltså korrekt som
den står, men den är lätt att läsa som "fråga båda fälten" utan att märka
vilket API som avses — och `gh pr view --json` är den form man når först.
Skriver du ett svep som klassar armering: bygg det på `gh api graphql`, inte
på `--json`. Fixad i
`TASK-128` (falsklarmade sju gånger på en enda natt innan fixen — full
instansdata på kortet).

**Det fjärde läget (tabellraden ovan) är dyrast, inte bara ett fjärde
alternativ:** en `failed_checks`-dequeue konsumerar armeringen tyst — ingen
signal skiljer PR:en från en som aldrig armerats. Utan ett svep som armerar om
står en färdig PR still på obestämd tid (`T108`-klassen: ett tillstånd utan
bevakare). Mätt fyra gånger 2026-08-01, samtliga en G0-transient (inte ett
verkligt trädfel): `backlog/tasks/task-115` +
`tasks/sessions/archive/2026-07/2026-07-26-session-91.md` rad ~7908–7909.

**Åtgärdsregeln för en armerings-kandidat: draft eller armera i samma
andetag, aldrig vilande.** En PR skapas som draft ELLER armeras när den
öppnas — `gh pr create --draft` eller `gh pr merge --auto` — CLEAN+oarmerad
är aldrig ett vilande tillstånd. Svepet kan inte ur ett statiskt API-svar
skilja en medvetet parkerad PR från en glömd
(`L485` i [`tasks/lessons/vol-06.md`](tasks/lessons/vol-06.md), mätt
två gånger — `#838` 2026-08-06 och `#862` 2026-08-07, den andra gången av
lärdomens egen författare, i samma session som skrev den). Ett svep-larm om
armerings-kandidat är därför en ORDER till PR:ens ägare, inte enbart
information: armera den, eller sätt den till draft (`gh pr ready <nr>
--undo`) — i SAMMA svep larmet upptäcks. En främmande, AKTIV sessions PR
rörs aldrig av någon annan än ägaren — det är ägarens eget svep som bär den.

**En köad gren kan inte uppdateras via `gh`.** Push avvisas med `GH006` så
länge PR:en står i kön, och `--disable-auto` släpper inte låset — `gh` 2.96.0
har ingen dequeue-flagga.

**Men CLI:ts yta är smalare än plattformens — en väg ur finns.** GraphQL-
mutationen `dequeuePullRequest` tar bort en köad post direkt utan att kräva
rättigheter utöver ett vanligt repo-admin-token; `enqueuePullRequest(jump:
true)` kan hoppa i kön men kräver att PR:ens egna required checks redan är
gröna. Skarpt prövat och tidsatt (armerad → dequeued → kö bekräftat tom, 11
sekunder totalt, `main` opåverkad):
[`docs/research/task-99-dequeue-enqueue-live-test-2026-08-01.md`](docs/research/task-99-dequeue-enqueue-live-test-2026-08-01.md).

**Den operativa regeln kvarstår ändå: köa inte förrän diffen är den du vill
landa.** Den enda vägen ur en köad gren går via en handskriven
GraphQL-mutation utanför `gh`, vår vanliga verktygsyta — att förlita sig på
den som daglig rutin (i stället för ett medvetet, mätt undantag) är en väg
dit vi inte har anledning att gå.

**Om kön går sönder:** vägen tillbaka är att ta bort `merge_queue`-regeln ur
rulesetet via `gh api` — den kräver ingen landning och är därför oberoende av
felläget. Den är prövad skarpt (på → verifierad → av → verifierad) före
aktiveringen, inte efter. Formerna och kö-parametrarna:
[`CONTRIBUTING.md`](CONTRIBUTING.md) § Landnings-ordningen.

**Varför raden står här och inte bara i CONTRIBUTING:** regeln gäller i
armerings-ögonblicket, och `CONTRIBUTING.md` auto-laddas inte i en
Code-session — bara denna fil gör det. Historiken är värd att minnas: `L328`
var nedskriven sedan S81 och beskrev mekanismen korrekt, ändå gick
orkestreraren i fällan två gånger under en och samma resume 2026-07-28. Det
var beviset för att en regel utan mekanism inte efterlevs — och skälet till att
den nu har en.

### Review-grinden — spawn efter push, före armering ([ADR-105](docs/decisions/ADR-105-review-grinden-fyra-deltan-byggs-inte-adopteras.md))

**ORKESTRERAR-REGEL, från och med `TASK-173.1`:** efter en bygg-agents push,
och INNAN du armerar (`gh pr merge --auto`), spawna `review-agent`
(`.claude/agents/review-agent.md`) i FÄRSK kontext mot den pushade PR:en.
Färsk kontext betyder ett NYTT agent-anrop — aldrig ett meddelande till
bygg-agentens egen session. Driv-agent och granskare är strukturellt olika
agenter, alltid (ADR-105 beslut 2; motiv: en granskare som delar kontext med
utföraren kan godkänna sin egen förskrivning,
`docs/research/k1-no-mistakes-anatomi-2026-08-09.md` § 3).

**HÖG risknivå blockerar formellt** (ADR-105 beslut 5): returnerar
granskaren `risk.niva: 'hog'` — armera INTE. Eskalera till Marcus med
utlåtandets fynd; armering sker först efter hans explicita granskning. `lag`/
`medel` är i detta skede (`TASK-173.1`, innan `173.3`s PR-sektion och `173.4`s
CI-backstopp) informativt underlag för din egen bedömning — ingen mekanisk
spärr hindrar armering vid `lag`/`medel` än.

**Vad som ÄR byggt i denna skiva, och vad som INTE är det (progressiv
härdning, ADR-105 beslut 3):** `review-agent`-kontraktet och utlåtande-
schemat (`scripts/lib/review-utlatande.mjs`,
`scripts/validera-review-utlatande.mjs`) existerar och är skarpbevisade. **Vad
som SAKNAS än:** path-scopade regler ur main (`TASK-173.2`), den fasta
Riskbedömnings-sektionen i PR-kroppen (`TASK-173.3`), den deterministiska
CI-backstoppen som fäller en PR utan giltigt utlåtande (`TASK-173.4`),
rundtaks-loopen med konvergensregel (`TASK-173.5`), och
fångstrate-instrumenteringen (`TASK-173.6`). Fram tills dess är grinden ett
**orkestrerar-åtagande**, inte en mekanisk spärr — en PR kan i praktiken
armeras utan granskning så länge `173.4` inte finns. Skriv aldrig om detta
stycke till att låta grinden vara mekaniskt otvingbar innan `173.4` faktiskt
landat (samma `ADR-083`-disciplin som resten av denna fil: prosa som påstår
en mekanism som inte finns är värre än att inte skriva något alls).

**Skarpbevis-skuld, öppet bokförd (`CLAUDE.md` § En ny hooks skarpbevis,
samma strukturella klass generaliserad från hookar till agent-definitioner):**
`.claude/agents/review-agent.md` skapades i samma session som denna rad
skrevs. `subagent_type: "review-agent"` känns **BEVISLIGEN INTE** igen av
`Agent`-verktyget i DEN SESSIONEN (mätt: ett direkt anrop med den
`subagent_type` gav `Agent type 'review-agent' not found` — listan över
kända typer omfattade inte namnet, trots att filen redan låg på disk). Den
manuella skarpkörningen mot en verklig PR (AC #1/#5/#6) gjordes därför via
`general-purpose` med kontraktets fulla text inklistrad i uppdraget, inte via
`subagent_type: "review-agent"` — logiken är skarpbevisad, REGISTRERINGEN är
det inte. Om `subagent_type: "review-agent"` känns igen i en **framtida**
session (efter att filen synkats via en ny sessionsstart) är OPRÖVAT. Betala
skulden som en av nästa berörda sessions första handlingar: ett enkelt
`Agent`-anrop med `subagent_type: "review-agent"` mot en trivial uppgift —
lyckas det, är skulden betald; misslyckas det på nytt, eskalera till Marcus
(agent-definitioner kan kräva en mekanism utöver filnärvaro för att
registreras, vilket i så fall är ett nytt fynd, inte bara en väntan).

### Kortnummer — verktyget skyddar, men bara halva vägen

`backlog/config.yml` har `check_active_branches: true` sedan `TASK-93`
(2026-07-30). CLI:t läser andra aktiva grenar före det allokerar ett kort-ID och
hoppar över nummer som redan är tagna där.

**Det är en riskMINSKNING, inte en garanti.** Skyddet ser bara **committat**
arbete. Tre hål är mätta och kända:

| Läge | Skyddar flaggan? |
|---|---|
| Kortet är committat på en annan gren | **Ja** — numret hoppas över |
| Kortet är skapat men **inte committat** i ett systerträd | **Nej** — osynligt |
| Kortet ligger **ospårat i huvudträdet** medan en agent räknar från `main` | **Nej** |
| Grenen är äldre än `active_branch_days` (30) | **Nej** |

Praktiskt, i den ordningen:

1. **`git fetch` + fast-forwarda före `task create`.** En föråldrad worktree ger
   dig ett nummer som redan är taget i merge-kön.
2. **Committa kortet i samma andetag som du skapar det.** Uppskjuten bokföring är
   inte neutral väntan — den är en osynlig reservation av en delad resurs.
3. **Krockar det ändå: rätta via CLI:t, aldrig för hand.** Parkera kortet utanför
   registret och återskapa det med `task create` när den andra posten landat. En
   handredigerad `id:`-rad löser symptomet och bryter den regel som gör registret
   trovärdigt.

**Kostnaden är mätt — och "view är opåverkad" var FALSKT i en vecka:**
`task list` ~0,52→6,50 s och `task create` ~0,69→7,09 s (ursprungsmätningen
2026-07-30), men raden här påstod att `task <id>` (view) var opåverkad
(~0,52→0,55 s). Falsifierat av `task-238` (2026-08-16, ren A/B):
**28,5 → 1,96 s per view-anrop** med flaggan på respektive av — dussintals
gren-skannande barnprocesser mot noll. Det, inte list-anropet, är varför
`check-backlog-closure.sh` tog 164,60 s. Grindens CI-körning kör sedan
`task-238` via ROOT_CONFIG-mekanismen (temporär config med flaggan AV för
grind-processen; riktiga TASK-93-flaggan orörd). Kvarstående regel, nu med
skärpt bevis: multiplicera inte per-anropstal — MÄT, och lita aldrig på en
frikännande mätning som inte gjorts i den kontext där kostnaden gör ont
(`backlog config set` är dessutom bevisat FÖRLUSTFULLT vid round-trip —
skriv aldrig config via CLI:t; belägg: task-238-kortet).

**Varför raden står här:** den gäller i `task create`-ögonblicket, och en agent
som ska minta ett kort läser inte en ADR först. `ADR-081` påstod i tre månader att
kortnumren *"redan är lösta"* — det var falskt hela tiden, och kostade en skarp
kollision 2026-07-30 innan någon mätte efter. Rättelsen: `ADR-081` § Updates.

**Betala inte skanningen där den inte skyddar något — använd `npm run bl`.**
Flaggan skyddar EXAKT EN sak: ID-allokeringen i `task create`. Varje annat
anrop betalar ändå. Mätt 2026-08-17 (lugn last, 43 git-refs varav 24 remote):

```bash
npm run bl -- task 250 --plain        # scripts/backlog-cli.sh
npm run bl -- task edit 250 --check-ac 1
npx backlog task create "…"            # create: OFÖRÄNDRAT, aldrig via wrappern
```

| anrop | rakt (skanning på) | via `npm run bl` |
|---|---|---|
| `task list --json` | 6,61 s | **1,59 s** |
| `task <id> --plain` | 7,63 s | **2,10 s** |

Utdatan är **byte-identisk** i båda fallen (verifierat med `diff`). Wrappern
skickar allokerande anrop (`create` någonstans i argumenten) rakt igenom med
full gren-skanning, och kör allt annat mot en isolerad projektrot via CLI:ts
`BACKLOG_CWD` — egen `backlog.config.yml`, symlänk till de riktiga korten.
**`backlog/config.yml` muteras aldrig** (till skillnad från `backlog config
set`, som är MÄTT förlustfull vid round-trip), och **ingen delad fil lämnas i
projektroten**, så två samtidiga agenter i samma träd kan inte trampa på
varandra. Beslut och mätserie: [ADR-117](docs/decisions/ADR-117-backlog-grindens-faktainsamling-bulk-och-korsvalidering.md).

**Detta är en KONVENTION, inte en spärr** — inget hindrar ett direktanrop, och
den enda mekaniska bevakningen är wrapperns egen testsvit
(`scripts/test-backlog-cli.sh`, 16 fall, CI-wirad). Skrivs raden om till att
påstå en spärr är det exakt den `ADR-083`-felklass repot städat bort två
gånger.

**Under fleet-drift är kostnaden värre än multiplikatorn ovan.** `TASK-238`:s
grind betalade 164,60 s i en körning, och en orkestrator-`task edit` dog mot
ett 2-minuterstak medan en parallell agents anrop malde. Kostnaden växer med
antalet grenar — och en fleet av agenter PRODUCERAR grenar.

**`TASK-310` (2026-08-24): grenskulden hann växa till 289 lokala / 345 totalt
grenar** (`git branch` / `git branch -a`) innan någon städade — elva
`task create` i rad hade dött mot 10-minuterstaket dagen innan (S108 resume 8,
2026-08-23, källa: kortets egen beskrivning). Mätt rakt mot
`node_modules/.bin/backlog` (ej `npm run bl`-wrappern — den kör `list`/`view`
mot en isolerad `check_active_branches: false`-config och hade dolt precis
det denna mätning skulle visa; se § ovan):

| Läge | grenar (lokala / totalt) | `task list --plain` | `task create` |
|---|---|---|---|
| Före städning | 289 / 345 | 39,20 s | — |
| Efter lokal gren-städning (235× `git branch -d`, 0 fel) | 54 / 110 | 18,57 s | — |
| + fjärr-tracking-refs prunade (`git remote prune origin`, 37 st) | 54 / 72 | 18,51 s | 21,08 s |

Loadavg steg 5,15→15,71 (1 min) UNDER mätfönstret — annan fleet-aktivitet
samtidigt, så talen är INTE en ren branch-count-till-tid-funktion. Riktningen
är ändå entydig: lokal gren-städning gav ~2× (39,2 s→18,6 s); den efterföljande
fjärr-ref-pruningen gav ~0 (18,57 s→18,51 s, brus). **Rotorsaken är LOKALA
grenar, inte fjärrgrenar.** `remote_operations: false` i `backlog/config.yml`
utesluter nätverksanrop, men inte att skanningen läser redan cachade
`refs/remotes/origin/*` lokalt — ändå syns ingen mätbar effekt av att ta bort
dem. Ingen av mätpunkterna når kortets eget mål (`task create` under ~10 s) —
kvarvarande 54 lokala grenar (plus stigande fleet-last) räcker för att hålla
kostnaden en bit över det, så 10 s-målet kräver antingen ett lägre stabilt
gren-golv eller en omprövning av målet självt.

`delete_branch_on_merge` var redan `true` (satt av `TASK-70.6`, 2026-07-29,
bevisat med kontrastgrupp PR #418 vs #417 — grenen från PR:en efter
inställningen var borta på fjärren, grenen från PR:en före fanns kvar) —
verifierat oförändrat 2026-08-24 via `gh repo view --json
deleteBranchOnMerge`. De 37 prunade fjärr-tracking-refsen var alltså redan
raderade PÅ GITHUB (auto-delete fungerar som avsett); pruningen tog bara bort
de LOKALA cache-pekarna i denna klon och rörde aldrig fjärren.

**Vägen framåt, obetald skuld:** ingen mekanism raderar en lokal gren efter
att en worktree-isolerad agent landat sin PR — `git worktree remove` tar bort
arbetskatalogen men rör aldrig grenen, så den ligger kvar för evigt tills
någon kör `git branch -d` för hand (vilket denna städning gjorde, en gång, se
`TASK-310`). Ett återkommande lokalt gren-svep (t.ex. vid worktree-borttagning,
eller periodiskt à la `heartbeat-svep.sh`) är flaggat men INTE byggt i detta
pass — se `TASK-310` § Final Summary för fullständig mätserie och motivering.

---

## Verktygsfakta som lätt gissas fel

Inte regler — fakta som kostat tid när de antagits. Slå upp, gissa aldrig.

- **Åtkomster och nycklar (Supabase PAT vs projektnyckel, macOS TCC per
  värdapp, nyckelringsposter) har ett eget register:**
  [`docs/reference/atkomst-och-nycklar.md`](docs/reference/atkomst-och-nycklar.md).
  Mät ÅTKOMSTEN, aldrig omgivningen — kör bevis-kommandot innan du
  deklarerar att något saknas. Mekaniserad självdiagnos:
  `npm run atkomst:diagnos` (`scripts/atkomst-diagnos.sh`). Etablerat
  TASK-202 efter att Marcus två gånger blivit ombedd att skapa åtkomster
  han redan hade.

---

## Filstruktur

För aktuell struktur, kör `tree -L 3 -I 'node_modules|dist|.git|coverage|test-results|playwright/.auth'`.

---

## Synk-horisont och arkiv-åtkomst

claude.ai-projektkunskapen synkar INTE: `tasks/sessions/archive/`,
`docs/archive/` (+ `package-lock.json` om fil-urval stöds). Allt finns
kvar i git — exkluderingen gäller endast claude.ai-projektkunskapens synk (ADR-048).

Regel vid claude.ai-läsning: noll träffar i projektkunskapen på historiskt material
(arkiverade sessionsdok, superceded specs, frusna analyser) betyder INTE
att det saknas. Historik utanför synk-horisonten hämtas VIA CODE
(LÄS→RAPPORTERA mot lokal disk/git) eller genom att Marcus klistrar
innehållet — anta aldrig att materialet inte existerar.

`docs/research/` ligger kvar i synken tills Fas 6 är avslutad
(konsumeras aktivt av Fas 6) och exkluderas därefter (ADR-048 punkt 3).

---

## Design-system

**FK-inspirerat 3-lagers token-system** (DESIGN-SYSTEM-SPEC.md §1):

1. **Primitiv** (`src/styles/tokens/primitives.css`) — råa värden, prefix **`--p-`** (ej `--mm-`,
   sedan tolvstegsskale-migreringen, commit `13582077`): `--p-gold-500: #d4960a`,
   `--p-blue-700: #1b4965`, etc.
2. **Semantisk** (`src/styles/tokens/semantic.css`) — roller, prefix `--mm-`: `--mm-primary`,
   `--mm-focus-ring`, `--mm-text`.
3. **Komponent** (`src/styles/tokens/components.css`) — komponentspecifikt: `--mm-button-primary-bg`, `--mm-dialog-overlay-bg`.

> Räkningen ovan är disk-verifierad (TASK-161.2, 2026-08-08, `da654409`) — de tre
> primitiv-/semantik-exemplen som stod här tidigare (`--mm-amber-500`,
> `--mm-blue-900`, `--mm-color-primary`, `--mm-color-focus-ring`,
> `--mm-color-text-default`) existerar INTE i `src/styles/tokens/` (5 av de 7
> ursprungliga exemplen). `--mm-color-primary` var dessutom en LEVANDE bugg tills
> S100 varv 14 (commit `9d1875ea`, 2026-08-07): en checkbox konsumerade den
> odefinierade variabeln och föll tyst till webbläsarens `accent-color: auto`
> (se `components.css` § Kryssruta för hela historiken).

**Regler:**

- Inga hårdkodade färger i komponenter — allt via CSS custom properties
- Inga komponentspecifika tokens utanför components.css
- Foundation: `~/Repon/marcus-system/design-system/DESIGN-FOUNDATION-v1.md` (4px spacing-bas, Inter, FK-inspirerat)
- Varje komponent ska klara prefers-contrast: more, prefers-reduced-motion, print

Fullständig spec: [`docs/specs/DESIGN-SYSTEM-SPEC.md`](docs/specs/DESIGN-SYSTEM-SPEC.md) (lokalt sedan ADR-021, ursprungligen i Vue-referensens `docs/react-migration/`).

---

## Arbetsflöde

**Verktyg:**

| Verktyg | Används för |
|---|---|
| Claude Code (terminal) | Planering, arkitektur, FK-research, kodning, git, filhantering, verifiering |
| Vite dev-server | Lokal utveckling med hot reload |
| Playwright | Visuell QA, screenshots, accessibility-tester |
| Airtable MCP | Verifiera fält, records, relationer live |

**Metod:** Marcus och Code planerar → Code bygger fas för fas → Marcus verifierar i browsern → feedback → nästa steg.

**Fasordning och fas-status:** se `docs/byggplan.md` §2 (Fas-tabell, styrande).

---

## Kvalitetsribba

| Typ | Tillgänglighet | Teknik | Återanvändbarhet |
|---|---|---|---|
| **Bibliotek** (komponenter, hooks) | **11** | **11** | **11** |
| **Vyer** (produktspecifika) | **11** | **10** | **10** |

Tillgänglighet är alltid 11 — inga undantag. Bibliotekskod ska bära flera produkter.

Fullständiga checklistor: [`docs/specs/KVALITETSDEFINITIONER-11-REACT.md`](docs/specs/KVALITETSDEFINITIONER-11-REACT.md) (lokalt sedan ADR-021; React-versionen ersätter Vue-eran per ADR-027 stack-skifte 2026-05-11). **Öppen deferral:** det dokumentet är INTE komplett — §3 (Komplett 11/10-checklista) och §4–§5 (Källor / Vad vi INTE tar med) är TBD, fylls progressivt vid Fas 3.5 resp. Fas 6 per dokumentets egen § Status. Tabellen ovan i DENNA fil är därför bärare av kvalitetsribban tills dess, inte en kopia som ska elimineras (ADR-100 § Updates 2026-08-08).

---

## Vision: Dubbel output

1. **Miranon Media Admin** — produkten Lotta använder dagligen. Event, anmälningar, betalningar, personer, leads, närvaro, mail.
2. **Mm Component Library** — komponentbiblioteket som bär framtida produkter (Passionslyftet, Maxat Event, kommande SaaS). Hooks, primitiver och komponenter byggda för återanvändning utan ändringar.

Allt som byggs bedöms utifrån båda perspektiven:

- Löser det Lottas behov? (produkt)
- Kan det återanvändas i nästa produkt utan ändringar? (bibliotek)

---

## Operativ procedur

Operativa rutiner — sessionsstart, sessionsavslut, fas-avslut — bor i
`marcus-system`-pluginets disciplin-skills och triggas automatiskt via sin
`description`. Pluginet aktiveras via **user-scope install-record**
(`~/.claude/plugins/installed_plugins.json`) som kanonisk mekanism och laddas
därmed i varje Code-session oavsett repo — se
[ADR-035](docs/decisions/ADR-035-plugin-aktivering-user-scope.md). Spoke
`.claude/settings.json` (`extraKnownMarketplaces.marcus-hub` +
`enabledPlugins`) behålls som sekundär portabilitets-deklaration, inte primär
källa. Saknas pluginet (`claude plugin list` visar inte
`marcus-system@marcus-hub`, eller färre än 4 skills aktiva) — flagga det;
scope-migrering görs inte via plugin-CLI:t (#38271). Konstitutionen ovan slår
fast PROJEKT-SPECIFIKA regler; generella sessions-HUR-steg bor i pluginet.
