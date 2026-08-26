---
owner: marcus803
updated: 2026-08-26
review_by: 2027-02-26
status: draft
---

# Kortskapandets flaskhals under fleet-drift — varför `backlog task create` köar, och vilket substrat som löser det

> **Proveniens:** avgränsat research-pass 2026-08-26 (S112), beställt på Marcus formulering
> *"Kortskapandet tar en jävla tid, blir kö. Så kan inte proffsen jobba. Vad gör vi fel? Har vi fel
> verktyg? Är inte backlog.md rätt verktyg för oss?"* Passet mätte mot vår pinnade version
> (`backlog.md` **1.49.1**) i ett kastbart labbrepo, läste ID-allokeringen ur den kompilerade
> binären, och prövade uppströms-läget mot förstapartskällor. Ingen kod, ingen ADR och inget kort
> rört — enda leveransen är denna fil.

## Kort svar

**Vi har inte fel verktyg för det verktyget gör. Vi har fel verktyg för hur många vi är.**

Flaskhalsen är inte gren-skanningen ensam, vilket vår egen dokumentation hittills sagt. Den är
**produkten av två mekanismer som förstärker varandra**:

1. `backlog task create` tar ett **globalt exklusivt lås** i `<git-common-dir>/backlog.md/locks/create`
   — delat mellan **alla 15 worktrees** och därmed alla parallella agenter.
2. Låset hålls under **hela** create-operationen, inklusive gren-skanningen. Låsets timeout är
   **30 sekunder**, och en create med våra 156 grenar tar **12–35 sekunder**.

Följden är inte långsamhet. Den är **fällning**. Mätt i kastbart labb med 151 grenar, åtta samtidiga
`task create`: **två lyckades, sex fällde** med exitkod 1 och `Another task create/promote/demote
operation is already in progress`. Det är 75 % felfrekvens — inte en kö som går långsamt, utan en kö
som kastar av sig sina passagerare.

**Det som gör detta strukturellt och inte lappbart:** låsets budget är 30 s. Antalet agenter som kan
passera är ungefär `30 / T_create + 1`. Vid `T_create = 23 s` är taket **två agenter**. Vi kör 8–10.
Ingen inställning i Backlog.md flyttar den kvoten tillräckligt, eftersom ID-allokeringen är
`max + 1` över allt observerbart arbete — och uppströms har **uttryckligen avvisat** att ändra det
([#711](https://github.com/MrLesk/Backlog.md/issues/711), stängd 2026-07-10: *"A random or
collision-free ID mode is not planned"*).

**Rekommendationen, i två steg och tydligt märkt som rekommendation, inte beslut:** uppgradera till
**1.50.1** och sänk `active_branch_days` — det halverar kostnaden och köper oss månader — men börja
samtidigt grillningen om substratet, eftersom den kvoten återkommer så fort fleeten växer. Den
starkaste långsiktiga kandidaten är **GitHub Issues**, inte beads. Motiveringen står i § Dom.

**Ett sidofynd väger nästan lika tungt som huvudsvaret:** två av de tre raderna i `CLAUDE.md`
§ Kortnummer-tabellen är **falsifierade** — verktyget ser numera okommitterade kort i systerträd.
Se § Sidofynd.

---

## Vad jag hittade innan jag sökte vidare

`docs/research/` bär **139** filer. Fyra överlappar frågan, ingen besvarar den.

| Befintlig källa | Vad den redan täckte | Vad som var åldrat / saknades |
|---|---|---|
| [`nummerallokering-parallella-aktorer-2026-07-29.md`](nummerallokering-parallella-aktorer-2026-07-29.md) (1 060 rader, 84 URL:er) | Branschmönstret för löpnummer under parallellitet; mätte att två arbetsträd båda allokerade `task-4`; fann att `check_active_branches: true` löste det | Skrevs **innan** flaggan slogs på. Kände inte till create-låset, mätte aldrig create-latens, och dess slutsats *"den billigaste åtgärden är en config-rad"* är den åtgärd som **skapade** dagens flaskhals |
| [`ADR-081`](../decisions/ADR-081-nummer-tilldelas-vid-landning.md) | Nummer tilldelas vid landning; serialiseringen finns redan i merge-kön | Beslut 4 påstod att kort *"redan är lösta"* — falsifierat av `TASK-93`. Principen är dock direkt återanvändbar, se options-rymden alternativ 4 |
| [`ADR-117`](../decisions/ADR-117-backlog-grindens-faktainsamling-bulk-och-korsvalidering.md) | Wrappern `npm run bl`; att `task view` kostar **linjärt i katalogstorlek** (0,47 s vid 10 kort → 2,65 s vid 502) | Wrappern skickar `create` **orörd** igenom med full skanning, med avsikt. Den löser alltså allt utom det frågan gäller |
| `TASK-310` (Done 2026-08-24) | Mätte 287 grenar → ~3 min per kort; städade 289 → 54 lokala grenar | Städningen höll **inte**: idag är vi på 156. Se § Återväxten |

**Ett styrande beslut jag prövade frågan mot:** `ADR-081`:s princip — *lägg nummertilldelningen där
serialiseringen ändå sker* — är inte förkastad av detta pass. Den är tvärtom kärnan i det billigaste
alternativet i options-rymden. Skillnaden mot lessons är att ett kort **behöver sitt ID vid
skapandet** medan ett lesson-fragment kan leva nummerlöst; den skillnaden är vad som gör
återanvändningen icke-trivial.

**Vad som därför är nytt i detta pass:** create-låsets existens, dess konstanter, den mätta
felfrekvensen under samtidighet, kurvan mot grenantal, A/B mot 1.50.1, och falsifieringen av
`CLAUDE.md`-tabellen.

---

## Mekanismen — läst ur binären, inte gissad

`node_modules/backlog.md/cli.js` är en tunn Node-wrapper som startar en **kompilerad Bun-binär**
(`backlog.md-darwin-x64/backlog`, 76 MB). Källkoden är bundlad i binären och lästes med `strings`.
Citaten nedan är verbatim ur vår installerade 1.49.1, med minifierade variabelnamn.

### 1. Det globala create-låset — flaskhalsens kärna

```js
async getCreateLockTarget($){
  let J = await this.getGitCommonDir();
  if(J) return { targetPath: J, locksDir: K0(J,"backlog.md","locks") };
  return { targetPath: $, locksDir: K0($,".locks") };
}
async withCreateLock($, J={}){
  if(process.env.USE_GLOBAL_TASK_ID_LOCK?.toLowerCase()==="false") return await $();
  ...
  K = await HF.default.lock(Q.targetPath, {
        lockfilePath: G, realpath:!0, stale: Z,
        retries: { retries: H, factor: 1, minTimeout: U, maxTimeout: U, randomize: !1 }
      })
```

Konstanterna, verbatim ur samma binär:

```js
wd = 30000, Od = 100, jd = 1e4, KF = "ECREATELOCK",
Md = "Another task create/promote/demote operation is already in progress. Please try again."
```

Uttytt: **timeout 30 000 ms**, **retry-intervall 100 ms fast**, **stale-gräns 10 000 ms**,
`retries = ceil(30000/100) - 1 = 299` försök. `factor: 1` och `randomize: false` betyder **ingen
exponentiell backoff och ingen jitter** — alla väntande processer pollar i exakt samma takt. Det är
lärobokens thundering herd.

**Låset ligger i git-common-dir**, alltså huvudrepots `.git` — verifierat skarpt på vår maskin:

```text
/Users/marcus/Repon/miranon-media-admin/.git/backlog.md/locks/create
```

Katalogen `backlog.md/` skapades **2026-08-07**. Låset är alltså aktivt i skarp drift sedan dess och
delas av samtliga **15 worktrees**. Uppströms bekräftar avsikten
([PR #710](https://github.com/MrLesk/Backlog.md/pull/710), merged 2026-07-01): *"Move the
create/promote/demote lock to the git common directory when available so linked worktrees share the
same create lock."*

### 2. Vad låset skyddar — gren-skanningen, per gren

Grenurvalet är **ett enda** `for-each-ref`, filtrerat på tipets `committerdate`:

```js
async listRecentBranchTips($){
  let J = Date.now() - $*24*60*60*1000, Y = ["refs/heads"];
  if(this.config?.remoteOperations !== !1) Y.push("refs/remotes/origin");
  let {stdout:Q} = await this.execGit(["for-each-ref",
      "--format=%(HEAD)%00%(refname:short)%00%(objectname)%00%(committerdate:unix)", ...Y], ...)
```

Vår `remote_operations: false` gör att `refs/remotes/origin` aldrig läggs till — vi betalar bara för
lokala grenar. Därefter körs **per gren**, med concurrency-tak 4:

| Steg | Kommando |
|---|---|
| `resolveCommit` | `git rev-parse --verify --quiet --end-of-options <ref>^{commit}` |
| `listFilesInTree` | `git ls-tree -r --name-only -z <ref> -- backlog` |
| `getBranchLastModifiedMap` | `git log --pretty=format:%ct%x00 --name-only -z --since=30.days <ref> -- <dir>` |
| `showFile` (hydrering, per kort) | `git show <ref>:<path>` |

Och den dolda multiplikatorn i 1.49.1: **varje** git-metod inleds med `await this.isRepository()`,
som är en egen `git rev-parse --git-dir`-subprocess **utan memoisering**. Det fördubblar
processantalet.

---

## Mätningarna

**Miljö:** denna maskin, `backlog.md` 1.49.1, macOS x86_64 (äkta Intel — `uname -m` = `x86_64`,
`sysctl.proc_translated` tomt; **ingen Rosetta-fälla**, en hypotes jag prövade och förkastade).
Git-subprocesser räknades med en PATH-shim som loggar varje anrop och delegerar till `/usr/bin/git`.

> **Loadavg-varning, läs den innan talen tolkas.** Fleeten körde skarpt under hela passet och lasten
> varierade **mellan 15 och 500**. Absoluta sekundtal är därför inte jämförbara mellan tabeller.
> Varje tabell nedan anger sin egen loadavg, och **A/B-par kördes alltid inom sekunder från
> varandra** så att relationerna håller även när nivån inte gör det. Git-anropsräkningen är
> däremot **lastoberoende** och är passets hårdaste mätdata.

### Vårt riktiga repo — vad det kostar att bara läsa

`task list --plain` mot 656 kort, loadavg ~470–500:

| Läge | Tid | git-anrop |
|---|---|---|
| Ren binärstart (`--version`) | 2,4–2,7 s | 0 |
| `task list` med `check_active_branches: false` | 31,5–32,1 s | **1** |
| `task list` med `check_active_branches: true` | 39,4–49,5 s | **602** |

**Det första fyndet motsäger vår egen berättelse.** Skillnaden mellan 1 och 602 git-anrop är bara
~13 s, medan **~29 s** går åt till att läsa 656 markdown-kort. Under fleet-last dominerar
katalogläsningen — vilket är precis den `O(n)`-kostnad `ADR-117` mätte. Wrappern `npm run bl` tar
bort gren-skanningen men **inte** kortläsningen; den löser alltså ungefär en tredjedel av vad som gör
ont vid hög last.

### Kastbart labb — create isolerad

Labbet: eget git-repo, 200 kort, grenar med **unika** tips, vår config verbatim. Repots kort rördes
aldrig.

**A. Skanningens kostnad** (151 grenar, loadavg ~28):

| Läge | Tid | git-anrop | Fördelning |
|---|---|---|---|
| `check_active_branches: true` | **23,79 s** | **1 632** | 955 `rev-parse`, 350 `show`, 150 `ls-tree`, 150 `log` |
| `check_active_branches: false` | **6,51 s** | **5** | — |

**B. Kurvan mot grenantal** (samma körning, loadavg ~28 → ~29):

| Grenar | Tid | git-anrop |
|---|---|---|
| 151 | 23,79 s | 1 632 |
| 102 | 18,90 s | 1 240 |
| 52 | 14,04 s | 840 |
| 22 | 7,91 s | 600 |
| 7 | **6,91 s** | 480 |

Linjärt, ~8 git-anrop per gren. **Men notera bottenplattan:** även vid sju grenar tar create 6,91 s
och 480 anrop, eftersom hydreringen (`git show` per kort som finns på en gren) skalar med
kortmängden, inte grenmängden. Vårt repo har 3,3× fler kort än labbet.

**C. Låset under samtidighet — passets viktigaste mätning** (151 grenar, åtta samtidiga
`task create`, loadavg ~290):

| Konfiguration | Lyckade | Fällda (`ECREATELOCK`) | Totaltid | Unika ID |
|---|---|---|---|---|
| `check_active_branches: true` | **2 / 8** | **6 / 8** | 57,8 s | 2 |
| `check_active_branches: false` | **8 / 8** | 0 | 21,1 s | 8 |
| `true`, v1.50.1 | **3 / 8** | 5 / 8 | 42,3 s | 3 |
| `true`, `USE_GLOBAL_TASK_ID_LOCK=false` | 1 skrev "Created" | 7 varnade om kollision | 4,2 s | **1 — alla åtta allokerade `task-5002`** |

De sex fällda väntade 32,1–33,4 s vardera och gav **exitkod 1**. Det är inte en långsam kö — det är
sex agenter som fick ett fel att hantera.

Rad fyra är lika viktig som rad ett: **avstängning av låset är inte lösningen.** Alla åtta processer
allokerade samma ID, och **två filer med samma ID blev kvar på disk**
(`task-5002 - nolock-3.md` och `task-5002 - nolock-8.md`). Sju av åtta fällde med
*"Run 'backlog doctor' to preview a safe repair"*. Låset gör precis rätt jobb; det är dess
**hålltid** som är felet.

**D. Vad skanningen faktiskt skyddar** — ett rent tvåsidigt test. Ett kort `task-5000` lades
**committat på en gren**, inte i `main`:

| Konfiguration | Allokerat ID |
|---|---|
| `check_active_branches: false` | `TASK-201` — **ser inte** grenens kort |
| `check_active_branches: true` | `TASK-5001` — **ser** grenens kort |

Skyddet är alltså reellt och mätbart. Att slå av det är att återinföra `TASK-93`:s kollision.

**E. A/B mot 1.50.1** — rättvis mätning, 56 grenar med **unika** tips (loadavg ~19–23; två körningar
per version, interfolierade):

| Version | Tid | git-anrop |
|---|---|---|
| 1.49.1 | 15,59 s / 12,18 s | **908** |
| 1.50.1 | 7,19 s / 5,13 s | **402** |

1.50.1 halverar processantalet — memoiseringen av `isRepository()` tar bort 968 av 972 `rev-parse`
i den stora körningen. **Ett metodfel jag först gjorde och rättade:** i ett tidigare försök skapade
jag grenarna med identiska tips, vilket lät 1.50.1:s commit-dedupliceringen se ut att ge konstant
kostnad oavsett grenantal. Med unika tips — som i vårt riktiga repo, där 156 grenar har 118 unika
tips — är vinsten ~2,3×, inte ~10×.

### Återväxten — varför städning inte är en lösning

`TASK-310` städade **289 → 54** lokala grenar 2026-08-24 14:06. Mätt idag, 2026-08-26:

| Mått | Värde |
|---|---|
| Lokala grenar nu | **156** (var 152 när passet började — fyra nya under passets gång) |
| Grenar med tip efter städningen | 109 |
| Nettotillväxt | **~49 grenar/dygn** |
| Grenar äldre än 30 dygn | **0** |

Två slutsatser. **Städning har en halveringstid under ett dygn** när fleeten kör — den är
symptomlindring, inte åtgärd, om den inte mekaniseras till varje landning. Och
**`active_branch_days: 30` filtrerar bort exakt noll grenar** hos oss, eftersom hela vår
grenpopulation är yngre än så. Fördelningen: 34 grenar ≤1 dygn, 109 ≤3 dygn, 145 ≤7 dygn, 152
≤14 dygn.

Det gör `active_branch_days` till en **verklig men trubbig** spak: sänkning till 7 tar bort 7 grenar
(~5 %), till 3 tar bort 41 (~27 %), till 1 tar bort 122 (~80 %) — men vid 1 dygn skyddar den inte
längre mot gårdagens kort, vilket är precis den kollisionsklass `TASK-93` mätte.

---

## Uppströms-läget

Läst mot `github.com/MrLesk/Backlog.md` och npm 2026-08-26.

**Senaste version är 1.50.1** (2026-08-10). Vi kör 1.49.1. Release-noterna för 1.50.1, verbatim:

> Hotfix for the v1.50.0 performance regression: on repositories with many branches, common CLI task
> commands could take minutes or hang on remote fetches. […] `task view` 4.4s → 0.4s,
> `task list` 4.2s → 0.2s, no-op `task edit` 12.2s → 0.4s

**Men `task create` står inte i listan, och det är avsiktligt.**
[PR #898](https://github.com/MrLesk/Backlog.md/pull/898) säger rakt ut: *"Task-ID allocation still
consults other branches, so IDs stay collision-safe."*
[PR #899](https://github.com/MrLesk/Backlog.md/pull/899) gjorde allokeringen **striktare**:
*"Allocation now forces a fresh bounded remote snapshot."*

**Underhållarens position på kollisionsfria ID:n** —
[#711](https://github.com/MrLesk/Backlog.md/issues/711), stängd 2026-07-10, verbatim:

> We are keeping stable, incremental numeric task IDs. PR #749 shipped collision diagnosis and
> recovery, not collision prevention. A random or collision-free ID mode is **not planned**, so
> closing this proposal.

Rapportören i samma tråd beskrev vår topologi ordagrant och noterade blockeraren: **`task create`
har inget `--id`** (verifierat: `grep -c '"--id'` ger 0 i både 1.49.1 och 1.50.1), och det finns
ingen reserverings- eller blockmekanism.

**Vad underhållaren säger om multi-agent-drift.** README § "Working with AI agents", verbatim:

> **Step 2: One task at a time.** Work on a single task per agent session, one PR per task.

Det är hela vägledningen. Ingen dokumenterad multi-agent-konfiguration finns i README, `AGENTS.md`,
`CLI-INSTRUCTIONS.md` eller Discussions (tomt). **Verktyget är byggt för en agent i taget.** Vi kör
8–10 mot en delad låsfil. Det är inte ett fel i verktyget — det är en användning utanför dess
dokumenterade modell.

**Två öppna issues värda att känna till:**
[#937](https://github.com/MrLesk/Backlog.md/issues/937) (öppen 2026-08-24, utan underhållarsvar)
föreslår git-backad atomisk koordination via `refs/backlog/tasks/*` — exakt vår klass.
[#843](https://github.com/MrLesk/Backlog.md/issues/843) mätte att **samtidiga `task edit` tappar
skrivningar tyst** — 12 av 12 vid simultana anrop. Den fixades i **1.50.0**. **Vi kör 1.49.1 och har
alltså den buggen live**, med 8–10 agenter som redigerar kort.

---

## Options-rymden

Fem alternativ, prövade mot sex axlar. Latenstalen för alternativ 1–2 är mätta i detta pass; för
3–5 är de härledda eller citerade och märks som sådana.

| # | Alternativ | ID-kollisionsskydd | Latens create | Fleet-parallellitet | Migrationskostnad | Offline / lokal sanning | Lock-in |
|---|---|---|---|---|---|---|---|
| **0** | **Oförändrat** (1.49.1, skanning på) | Starkt inom repot | 12–35 s mätt | **2 av 8 lyckas** — trasigt | ingen | full | ingen |
| **1** | **1.50.1 + sänkt `active_branch_days` + mekaniserad grenstädning** | Oförändrat starkt | ~5–7 s mätt vid 56 grenar | ~4–6 agenter (härlett ur 30 s-budgeten) | låg: en version + en config-rad + wiring av befintligt `stada-grenar.sh` | full | ingen |
| **2** | **`check_active_branches: false` + kollisionsgrind i CI** | Flyttas från create-tid till landningstid | **6,5 s mätt**, 8/8 lyckas | **8/8 mätt** | medel: ny grind + `ADR-081`-principen utsträckt till kort | full | ingen |
| **3** | **GitHub Issues som substrat** | **Eliminerad klass** — server allokerar | ~0,9–1,3 s/anrop (mätt av parallellpasset) | begränsas av GitHubs *"make requests serially"* | **hög**: 656 kort, 29 skript, 2 workflows, 4 hub-skills | **förloras** — inget offline | GitHub (redan vår forge) |
| **4** | **beads** (`gastownhall/beads`) | Hash-ID:n, ingen grenskanning | mål `<10 ms` in-process; **end-to-end ej belagt** | server mode obligatorisk; två öppna buggar i vårt exakta mönster | **hög + arbetsformsskifte** | Dolt-DB **gitignorad**; sanning på `refs/dolt/data` | Dolt/beads |
| **5** | **Orkestrator-allokerade ID-block** | Starkt, om orkestreraren är enda allokator | ~0 s för agenten | obegränsad | medel-hög: bryter `CLAUDE.md` § ISSUE-SUBSTRAT:s CLI-regel | full | ingen |

### Kommentar per alternativ

**(1) Uppgradering + städning.** Billigast och omedelbart. Mätt vinst 2,3× i processantal, och
1.50.0 fixar den tysta `task edit`-dataförlusten vi har live. **Men den flyttar bara kvoten** — från
två agenter till kanske fem — och `stada-grenar.sh` finns redan i repot utan att vara wirat till
någon automatik. **En beteendeändring att granska:** 1.50.1 gör CLI-läsningar lokala, så ett kort som
bara finns på en annan gren blir osynligt för `task view`/`edit`. Det interagerar med wrappern
(`ADR-117`) och måste prövas innan uppgradering.

**(2) Skanning av + grind vid landning.** Detta är `ADR-081`:s princip tillämpad på kort:
*lägg kontrollen där serialiseringen ändå sker*. Merge-kön (`ADR-076`) släpper in en PR i taget på
`main` — en grind som fäller på duplicerade kort-ID:n får samma skydd som skanningen, utan att kosta
i create-vägen. Mätt: 8/8 lyckade, 6,5 s. **Priset är ärligt:** kollisionen upptäcks vid landning i
stället för att förhindras vid skapandet, och två agenter kan hinna bygga på samma ID innan grinden
säger ifrån. Det gör omtaget dyrare men inte katastrofalt — och `TASK-93`-instansen visar att vi
hanterat exakt det manuellt förr.

**(3) GitHub Issues.** Eliminerar hela kollisionsklassen genom att aldrig allokera lokalt. Strukturen
finns native: sub-issues (100 per förälder, 8 nivåer), `addBlockedBy`/`addSubIssue` i GraphQL, och
`gh issue create --parent/--blocked-by` i `gh 2.96.0` som vi redan kör. **Två egenskaper måste vägas
in:** GitHubs egen best-practice säger *"make requests serially instead of concurrently"* och
*"wait at least one second"* mellan skrivningar — vår allokering skulle alltså serialiseras hos
orkestreraren, vilket är samma form som idag men med 1 s i stället för 20 s per post. Och issue- och
PR-nummer **delar en sekvens** i vårt repo (högsta = #1983), så kort-ID:n blir glesa och
interfolierade med PR-trafiken. Det största priset är att lokal fil-sanning försvinner — vår
closure-grind, `backlog-kortfakta.mjs` och hela `deny-backlog-direct-edit`-disciplinen bygger på att
kortet är en fil i git.

**(4) beads.** Frestande på ytan — hash-ID:n är exakt rätt svar på kollisionsklassen, och
ekosystemet (Gas Town, 17 780 ★) kör dussintals parallella agenter i produktion. **Men tre fynd talar
emot det för oss just nu.** Sanningskällan är en **gitignorad Dolt-databas** som syncar på
`refs/dolt/data`, vilket river vår `do-work`-disciplin att kortändringen landar i samma commit som
koden. Embedded mode är *"single writer, file-locked"* — alltså exakt vår nuvarande smärta — så
server mode blir obligatorisk. Och de två öppna issues som beskriver **vårt exakta körmönster** är
oroande: [#4368](https://github.com/gastownhall/beads/issues/4368) om lås-convoys under
*"multi-agent orchestrators that exec `bd` per operation"*, och
[#4767](https://github.com/gastownhall/beads/issues/4767) där en 8-workers-körning i nästlade
worktrees **tyst förlorade 7 av 8 `bd close`**. Den senare är obekräftad på senaste versionen men
tyst när den slår till, vilket är den värsta felklassen. Dessutom: barn-ID:n (`bd-a3f8.1`) är en
**sekvensräknare per förälder** — samma mekanism som våra `task-N.M`, med samma kollisionsproblem
([#4796](https://github.com/gastownhall/beads/issues/4796), öppen).

**(5) Orkestrator-allokerade block.** Passar vår arkitektur väl — `ADR-096` gör redan orkestreraren
till den durabla parten som äger all väntan. En agent får sitt ID från orkestreraren utan att röra
git. **Men det bryter `CLAUDE.md` § ISSUE-SUBSTRAT:s regel** att kort skapas via CLI:t, och kräver
antingen att orkestreraren kör `task create` i förväg (och betalar kostnaden seriellt) eller att vi
skriver kortfiler direkt förbi `deny-backlog-direct-edit.sh`-hooken. Block-reservation hittades
dessutom i **noll av sju** flöden i vårt eget tidigare pass
([`nummerallokering-parallella-aktorer`](nummerallokering-parallella-aktorer-2026-07-29.md) § Delfråga 1).

---

## Dom

**Backlog.md är rätt verktyg för det vi använde det till, och fel verktyg för hur vi använder det nu.**
Det är inte trasigt och vi konfigurerade det inte fel — vi växte förbi dess dokumenterade modell
(*"one task at a time"*) utan att den gränsen någonsin var utskriven någonstans vi läste.

**Den avgörande delfrågan var inte gren-skanningen, som vi trodde, utan låset.** Vår egen
dokumentation har i månader beskrivit kostnaden som en latensfråga (*"0,69 → 7,09 s"*,
*"~3 min per kort"*). Den beskrivningen är sann men leder fel, eftersom den antyder att problemet är
väntan. Mätningen visar att problemet är **fällning**: sex av åtta agenter får exitkod 1. En kö som
går långsamt kan man vänta ut; en kö som kastar av sig sina passagerare måste hanteras i varje
anropande skript. Skillnaden avgör vilka alternativ som ens är relevanta — och den syntes bara när
samtidighet mättes, inte enstaka anrop.

**Kvoten är den storhet som styr allt:** `agenter ≈ 30 s / T_create + 1`. Varje alternativ ska bedömas
på om det flyttar `T_create` under ~3 s eller tar bort låset ur ekvationen. Alternativ 1 flyttar
`T_create` till ~5–7 s (fem agenter). Alternativ 2 till 6,5 s men med 8/8 lyckade, eftersom
serialiseringen då ryms i budgeten. Alternativ 3 och 4 tar bort ekvationen.

**Beads är inte svaret idag**, trots att dess ID-design är den teoretiskt riktiga. Skälet är inte
ID-schemat utan att substratet flyttar kortets sanning ut ur git-commiten och in i en gitignorad
databas — och att de två öppna buggar som beskriver vårt exakta mönster är obekräftade på senaste
version. Vi skulle byta en **mätt, förstådd** flaskhals mot en **oförstådd, tyst** felklass.

---

## Vad jag inte kunde belägga

- **Skarp create-mätning i vårt eget repo.** Jag gjorde den medvetet **inte**: create tar det globala
  låset i huvudrepots `.git`, så en mätning hade blockerat samtliga skarpt körande agenter i 20–40
  sekunder. Att mätningen är för dyr att utföra är i sig ett belägg för problemets natur. Alla
  create-tal kommer från labbet med 200 kort; vårt repo har 656, vilket gör hydreringsdelen **större**
  hos oss, inte mindre.
- **Att 1.50.1 faktiskt är säker att uppgradera till hos oss.** Jag mätte dess prestanda, inte dess
  interaktion med `npm run bl`-wrappern eller med kort som bara finns på andra grenar. Beteendet
  ändras (CLI-läsningar blir lokala) och det måste prövas.
- **beads end-to-end-latens.** Endast in-process-mål (`CreateIssue: <10ms`) är publicerade. `bd` är
  inte installerat på denna maskin och jag mätte det inte.
- **Om beads `#4767` (tyst förlorade writes) kvarstår på v1.2.2.** Issuen är öppen och orörd sedan
  2026-07-14; enda kommentaren rapporterar ingen repro vid N=6 på en äldre version.
- **Jira Cloud-priser från förstapartskälla** — pricing-sidan är JS-renderad.
- **Exakt hur många av våra 656 kort som hydreras vid varje create.** Labbet visade 350 `show`-anrop
  vid 200 kort; jag extrapolerade inte till vårt repo eftersom fördelningen av kort över grenar är
  okänd.
- **Migrationsarbetets faktiska storlek** för alternativ 3–5. Jag räknade ytan (29 skript, 2
  workflows, 4 substratbundna hub-skills, 656 kort) men uppskattade ingen tidsåtgång.

---

## Sidofynd — registrerade, inte tyst förkastade

**1. `CLAUDE.md` § Kortnummer-tabellen är delvis falsifierad.** Tabellen påstår att skyddet inte ser
okommitterade kort i systerträd. Jag prövade det tvåsidigt: ett okommitterat `task-9000` lades i ett
systerträd, `task create` kördes i huvudträdet.

| Version | Allokerat ID | Slutsats |
|---|---|---|
| 1.49.1 (vår) | `TASK-9001` | **ser** det okommitterade kortet |
| 1.50.1 | `TASK-9002` | **ser** det okommitterade kortet |

Rad 2 (*"Kortet är skapat men inte committat i ett systerträd → Nej — osynligt"*) och rad 3
(*"Kortet ligger ospårat i huvudträdet → Nej"*) är alltså **falska** i den version vi kör. Orsaken är
[PR #710](https://github.com/MrLesk/Backlog.md/pull/710), merged 2026-07-01, alltså före vår 1.49.1.
Disciplinen *"committa kortet i samma andetag"* vilar därmed på ett föråldrat antagande. Detta bör
rättas i `CLAUDE.md` oavsett vad som beslutas om substratet.

**2. `KATALOGÄGARSKAP`-hooken fällde tre gånger falskt under passet.** Den matchar huvudkatalogens
sökväg och git-underkommandon som **strängar i kommandoraden**, inte som faktiska mål. Fällda
kommandon: `git branch --merged` (ren läsning), ett `git add` i `/private/tmp` vars kommandorad råkade
innehålla en `cp` från huvudkatalogen, och ett `git checkout` i `/private/tmp` där binärsökvägen pekade
in i huvudkatalogen. Varje gång var arbetskatalogen en helt annan. Fällningarna kostade tre omtag och
loggas i `.claude/hook-fallningar.jsonl`. Värt ett eget kort — inte blockerande.

**3. `git rev-parse --git-common-dir` kan ge en felaktig relativ sökväg** när den anropas djupt inne i
en worktree. Från min mätkatalog gav den `../../../.git`, vilket resolverat pekade på worktreens
`.git`-**fil** i stället för huvudrepots `.git`-**katalog**, och gav `ENOTDIR` i CLI:t. Från
worktree-roten gav samma kommando en korrekt absolut sökväg. Det påverkar inte skarp drift (create
körs från trädrötter) men är en fälla för verktyg som anropar CLI:t från nästlade kataloger.

---

## Rekommendation

**Detta är en rekommendation, inte ett beslut.** Substratval är över ADR-baren
(`~/.claude/CLAUDE.md` § ADR-BAR: svårt att återställa i koherens · överraskande utan kontext ·
resultat av en verklig avvägning) och ska grillas.

**Steg 1 — nu, oberoende av substratbeslutet.** Tre åtgärder som är billiga och inte låser något:

1. **Rätta `CLAUDE.md` § Kortnummer-tabellen** mot § Sidofynd 1. Den styr agentdisciplin idag och två
   av tre rader är falska.
2. **Uppgradera till 1.50.1** — efter att interaktionen med `npm run bl` prövats. Den fixar den tysta
   `task edit`-dataförlusten (`#843`) som vi har live med 8–10 samtidiga agenter. Det är en
   korrekthetsfix, inte bara prestanda, och väger tyngre än latensvinsten.
3. **Wira `stada-grenar.sh` till en automatik** (post-merge eller nattlig). Skriptet finns och är
   testat; det saknar bara en trigger. Utan det växer grenpopulationen ~49/dygn och äter varje
   prestandavinst inom två dygn.

**Steg 2 — grilla substratet.** Min rangordning, med öppen motivering:

**Alternativ 2 (skanning av + kollisionsgrind vid landning) är den starkaste kandidaten för nästa
steg**, före ett substratbyte. Den är mätt till 8/8 lyckade och 6,5 s, den återanvänder ett beslut vi
redan fattat och lever med (`ADR-081`: nummer prövas där serialiseringen ändå sker), den kräver ingen
migration av 656 kort, och den är **reversibel med en config-rad**. Om den visar sig otillräcklig har
vi förlorat en grind, inte ett substrat.

**Alternativ 3 (GitHub Issues) är den starkaste långsiktiga kandidaten** om vi ska byta. Den
eliminerar kollisionsklassen i stället för att hantera den, forgen är redan vår, hierarkin finns
native, och `gh` är redan i varje agents verktygsyta. Priset — förlorad lokal fil-sanning — är
verkligt och ska vägas medvetet, inte glidas förbi.

**Alternativ 4 (beads) bör hållas under observation, inte väljas nu.** Om `#4767` och `#4368` stängs
och en Backlog.md-importör skrivs, ändras kalkylen.

**Vad grillningen behöver avgöra**, i den ordningen:

1. **Är kortets sanning tvungen att vara en fil i vår git-commit?** Hela `do-work`-disciplinen,
   closure-grinden och `deny-backlog-direct-edit`-hooken bygger på det. Svaret utesluter antingen
   alternativ 3 och 4, eller öppnar dem båda. Det är den enda frågan som verkligen förgrenar.
2. **Accepterar vi att en kollision upptäcks vid landning i stället för att förhindras vid
   skapandet?** Det är alternativ 2:s hela avvägning.
3. **Hur många parallella agenter ska substratet bära?** Kvoten `30 / T_create + 1` gör detta till en
   dimensioneringsfråga med ett tal, inte en smakfråga. Svaret "8–10 idag, mer sen" pekar mot
   alternativ 3.
4. **Vad kostar 656 kortidentiteter?** Varje `TASK-N`-referens i ADR:er, sessionsdok, lessons och
   commit-meddelanden blir en död länk vid byte. Ingen av oss har räknat den ytan.

---

## Källor

**Vår egen korpus (läst i detta pass):**

- [`docs/research/nummerallokering-parallella-aktorer-2026-07-29.md`](nummerallokering-parallella-aktorer-2026-07-29.md)
- [`docs/decisions/ADR-081-nummer-tilldelas-vid-landning.md`](../decisions/ADR-081-nummer-tilldelas-vid-landning.md)
- [`docs/decisions/ADR-117-backlog-grindens-faktainsamling-bulk-och-korsvalidering.md`](../decisions/ADR-117-backlog-grindens-faktainsamling-bulk-och-korsvalidering.md)
- `backlog/tasks/task-93 …`, `task-238 …`, `task-310 …`
- `scripts/backlog-cli.sh`, `scripts/stada-grenar.sh`, `backlog/config.yml`
- `node_modules/backlog.md-darwin-x64/backlog` (1.49.1, kompilerad binär — mekanismens citat)

**Backlog.md uppströms:**

- <https://github.com/MrLesk/Backlog.md> · <https://www.npmjs.com/package/backlog.md>
- <https://github.com/MrLesk/Backlog.md/blob/main/ADVANCED-CONFIG.md> (config-nycklar, prestandavarning)
- <https://github.com/MrLesk/Backlog.md/releases/tag/v1.50.1> (2026-08-10, hotfix-noterna)
- <https://github.com/MrLesk/Backlog.md/pull/898> · <https://github.com/MrLesk/Backlog.md/pull/899> (create undantaget)
- <https://github.com/MrLesk/Backlog.md/pull/710> (lås till git common dir; worktree-synlighet)
- <https://github.com/MrLesk/Backlog.md/issues/711> (kollisionsfria ID:n — avvisad 2026-07-10)
- <https://github.com/MrLesk/Backlog.md/issues/843> (samtidiga `task edit` tappar data; fix i 1.50.0)
- <https://github.com/MrLesk/Backlog.md/issues/937> (öppen: git-backad atomisk koordination)
- <https://github.com/MrLesk/Backlog.md/issues/183> (ursprunget till `checkActiveBranches`)

**Alternativa substrat:**

- <https://github.com/gastownhall/beads> · <https://beads.gascity.com/> · <https://yegge.ai/gastown>
- <https://beads.gascity.com/core-concepts/hash-ids.md> (ID-designens motivering)
- <https://github.com/gastownhall/beads/issues/4368> · [`/4767`](https://github.com/gastownhall/beads/issues/4767) · [`/4796`](https://github.com/gastownhall/beads/issues/4796)
- <https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api>
- <https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api> (*"make requests serially"*)
- <https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/adding-sub-issues> (100/förälder, 8 nivåer)
- <https://github.com/git-bug/git-bug> (operation-baserad CRDT; SHA-256-ID)
- <https://github.com/ulid/spec> · <https://www.rfc-editor.org/rfc/rfc9562> (UUIDv7) · <https://github.com/segmentio/ksuid>
- <https://linear.app/pricing>
