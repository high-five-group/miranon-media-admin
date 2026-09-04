---
owner: marcus803
updated: 2026-09-04
review_by: 2027-03-04
status: draft
---

# Vem stänger ett issue, och vid vilket ögonblick — branschpraxis inför GitHub Issues-migreringen

> **Proveniens:** avgränsat, snävt research-pass 2026-09-04, beställt på Marcus
> fråga verbatim (Vale.Terms avstängd för raden — citatet återger Marcus
> egen stavning ordagrant):
>
> <!-- vale Vale.Terms = NO -->
> *"Hur gör proffsen? Hur gör Matt Pocock? Hur gör Github själva? Hur gör
> Antropic proffs?"*
> <!-- vale Vale.Terms = YES -->
>
> — utlöst av dagens beslut att flytta
> work-item-substratet från Backlog.md (kortfiler i git) till GitHub Issues.
> Målet var ett svar inom ~10 minuter, inte ett komplett dokument; passet drog
> över målet något för att hinna med Matt Pococks publika repo och GitLabs
> Definition of Done. Ingen kod, ingen ADR och inget kort rört — enda
> leveransen är denna fil.
>
> **Vad jag inventerade före sökningen:** `docs/decisions/ADR-127-backlog-stangningsformerna-harledd-dod-och-avstadda-krav.md`
> i sin helhet (styr redan HUR Backlog.md-korts "Done" härleds ur merge-kön
> och landnings-pekare — direkt släkt men svarar inte på GitHub Issues-frågan
> specifikt) och `docs/research/backlog-kortskapandets-flaskhals-2026-08-26.md`
> (identifierade redan 2026-08-26 GitHub Issues som starkaste substrat-
> kandidat, men tog inte ställning till stängningsformen). Ingen ADR fanns som
> redan avgjort just DENNA fråga — passet körde i full bredd.

## Kort svar

**Ingen av branschledarna kör ett rent formen-A ("Closes #N" i PR-kroppen,
inget mer") eller ett rent formen-B ("Refs #N", explicit stängning efter
verifiering") isolerat. Alla fyra vi kunde belägga (GitHub, Kubernetes,
Google, GitLab) kör en HYBRID: GitHubs native merge-stänger-issue-mekanik
används som den mekaniska handlingen (form A:s "vem trycker på knappen"),
men "stängt" behandlas som PROVISORISKT tills ett separat,
explicit senare signal bekräftar att det som stängdes verkligen höll — ett
eget tillstånd (Googles `Fixed (Verified)`), ett eget kriterium (GitLabs
"Done" kräver produktionsverifiering UTÖVER merge) eller en
återöppningsmekanism (Kubernetes `/reopen`).** Anthropics eget Claude
Code-flöde lägger till ett tredje lager: agenten stänger aldrig något
själv — den öppnar en PR, en människa mergar, och GitHubs native mekanik gör
resten.

Den avgörande delfrågan var **"hur hanterar de att stängt kan föregå
verifiering"** — svaret är att de flesta av dem INTE har det problemet i den
form vi har det, eftersom GitHub själva (och därmed även Kubernetes/GitLab
som ärver samma mekanik) antingen verifierar FÖRE merge (GitHub: branch-
deploy-modellen, historiskt) eller lägger verifieringen som ett SEPARAT,
efterföljande kriterium ovanpå den mekaniska stängningen (GitLab, Google) i
stället för att bygga om själva stängnings-ögonblicket.

## Tabell — per aktör

| Aktör | Vem stänger | När | Hur hanteras att stängt kan föregå verifiering |
|---|---|---|---|
| **GitHub (produktmekaniken)** | Ingen — automatiskt av plattformen | Vid **merge till default branch** (ej vid PR-öppning; ignoreras helt om PR:en riktas mot annan gren) | N/A på produktnivå — mekaniken själv gör ingen skillnad |
| **GitHub (som avsändare, egen deploy-praxis)** | Ingen — samma mekanik, men ordningen är omvänd | Historiskt: **deploy sker FÖRE merge** (branch-deploy/ChatOps — "changes never get merged to master until they have been verified to work in production from a branch"). I dag: merge queue är enda vägen in | Problemet uppstår inte för GitHub själva — vid merge-tillfället är koden redan produktionsverifierad, eftersom de mergar EFTER verifiering, inte före |
| **Kubernetes** | Automatiskt vid merge (`Fixes #`) för kod-PR:er; **manuellt av triager/bot** (Prow `/close`) för support-frågor, dubbletter, ej reproducerbara buggar; automatiskt av `k8s-triage-robot` efter 90+30+30 dagars inaktivitet | Vid merge för kodfixar; vid triage-beslut för övriga; `/reopen`-kommando finns för återöppning | PR-mallen instruerar UTTRYCKLIGEN att undvika `Fixes` för vissa PR-typer (t.ex. flaky-test-fixar) — en medveten broms mot förhastad auto-stängning. Permission-gated: att stänga någon annans issue kräver `/assign` till sig själv först, sedan `/close` |
| **Google (Issue Tracker / Buganizer-mönstret)** | **Två roller, två tillstånd:** koden som landar sätter `Fixed`; en **utsedd verifierare** sätter separat `Fixed (Verified)` | `Fixed` vid källträds-landning (kan vara innan formell release); `Verified` EFTER bekräftad release | Exakt vår fråga, löst med ett extra tillstånd: "stängt" (`Fixed`) och "verifierat" (`Fixed (Verified)`) hålls isär som TVÅ separata, explicita steg — inte en enda stängningshändelse |
| **GitLab (egen Definition of Done)** | Merge stänger issuet (automatiskt via nyckelord, eller manuellt) — **men det räknas bara som steg ETT** | Issue stängs vid merge till main; men featuren räknas inte "Done" förrän den är **"validerad i produktionsmiljö"** och presterar under produktionslast, separat kriterium | Samma mönster som Google: stängning (merge) och "Done" (produktionsverifierad) är **avsiktligt frikopplade** — "Done" är en bredare, senare, separat bedömning än att issuet råkar vara stängt |
| **Matt Pocock (skills-repo, `mattpocock/skills`)** | Verktygsnivå-konvention: `gh issue close <number> --comment "..."` | **Inte specificerat** i källmaterialet — varken vårt vendorade repo eller det publika repot (verifierat byte-identiskt via `gh search code`) kodar WHO/WHEN i PR-öppning-vs-merge-bemärkelse | Ingen belagd hantering hittad — se § Vad jag inte kunde belägga |
| **Anthropic (Claude Code GitHub Action / eget team-bruk)** | **Aldrig agenten själv genom merge** — agenten öppnar en (ofta draft-) PR; en **människa granskar och mergar**; GitHubs native mekanik sköter den faktiska stängningen | Agentens del: vid PR-öppning (kan bära `Closes #N`). Den FAKTISKA stängningen: vid mänskligt godkänd merge | Löser det genom ett tredje lager ovanpå GitHubs egen mekanik: obligatorisk mänsklig gate mellan "agent föreslår fix" och "merge som stänger issuet" — case-studien beskriver mönstret "hämta buggen kl 02, öppna en **draft**-PR innan någon vaknar" (människan mergar sedan) |

## Delfrågan som var avgörande

**"Hur hanterar de att stängt kan föregå verifiering?"** — svaret splittrar
aktörerna i två läger:

1. **De som eliminerar problemet genom ORDNING** (GitHub själva): mergar
   EFTER produktionsverifiering, inte före. Detta är inte överförbart till
   oss rakt av — vi har ingen deploy-brancher-modell, och vårt "verifiera på
   main" sker EFTER merge via merge-kön (`ADR-076`), inte före.
2. **De som accepterar att stängning föregår full verifiering och lägger på
   ett SEPARAT, senare signal** (Kubernetes delvis, Google tydligt, GitLab
   tydligt): stängningshändelsen är billig och mekanisk, men den bär inte
   hela sanningsvärdet ensam — ett extra tillstånd (`Verified`), ett extra
   kriterium (produktions-Done) eller en återöppningsväg (`/reopen`) gör
   jobbet stängningen inte kan göra ensam.

Vår egen arkitektur (tvåstegs-landning, `ADR-073` beslut 5; merge-kö-
verifiering EFTER merge, `ADR-076`; orkestrerarens svep som enda part med en
framtida tur att agera på verifieringsresultatet, `ADR-096`) ligger
strukturellt i läger 2, inte läger 1 — vi kan inte kopiera GitHubs egen
lösning (verifiera-före-merge) utan att bygga om hela landningsflödet. Läger
2:s mönster (Google/GitLab) är den branschprecedent som faktiskt matchar vår
form.

## Dom

**Ingen ren A eller ren B dominerar.** Den mekaniska stängningshandlingen
("Closes #N" → auto-stäng vid merge) ÄR branschstandarden som ett byggblock
— GitHub, Kubernetes och GitLab använder alla samma native mekanik som
default. Men **ingen av dem behandlar den mekaniska stängningen som sista
ordet**: alla tre lägger till ett separat verifieringssignal ovanpå den
(Verified-tillstånd, produktions-Done-kriterium, eller — Kubernetes —
uttrycklig försiktighet med `Fixes`-nyckelordet plus `/reopen`).

Läst mot Marcus ursprungliga A/B-uppdelning: detta är **närmast en hybrid**,
inte ett val mellan de två. Den branschmässigt bäst belagda formen för en
organisation vars "merge" INTE innebär "redan verifierat" (vilket är vårt
läge, till skillnad från GitHubs eget) är: **behåll GitHubs native
`Closes #N` för den mekaniska länken (issue-PR-koppling, stängningshändelse,
gratis UI-spårbarhet) — men behandla stängt som provisoriskt och lägg ett
eget, explicit verifieringssignal ovanpå**, i stället för att antingen (a)
lita blint på merge-stängning som "Done" (form A rakt av — det är precis
hålet `ADR-127` hål 1 redan stängde för Backlog.md, och att flytta substrat
utan att flytta med sig den lösningen återinför samma hål ett lager upp) eller
(b) undvika `Closes` helt till förmån för enbart `Refs` + en helt separat
manuell stängning (form B rakt av — det är den enda formen INGEN av de fyra
belagda aktörerna faktiskt kör; alla behåller den mekaniska close-händelsen,
de litar bara inte på att den ensam betyder färdigt).

## Kandidat för oss — INGET beslut, Marcus äger valet

Vägt mot `ADR-127` och post-merge-verifieringslagret (heartbeat-svep,
merge-kö-garantin):

**Ren form A (`Closes #N`, inget mer):**

- *Vinner:* Noll extra mekanism. Gratis PR-issue-länkning i GitHub-UI:t.
  Matchar GitHub/Kubernetes/GitLabs default rakt av.
- *Kostar:* Återinför exakt `ADR-127` hål 1 — "Done" (stängt) betyder
  återigen bara "mergat", inte "verifierat på main", och ingen äger steget
  däremellan. Vår merge-kö garanterar att required checks var gröna VID
  merge-tillfället (`ADR-076`), men den täcker inte allt post-merge-lagret
  redan verifierar i dag (t.ex. `review-backstopp`s egna gränser, eller
  framtida nightly-fynd). Byter man substrat utan att bära med sig
  härledningen riskerar man att bygga om samma strukturhål en nivå upp.

**Ren form B (`Refs #N`, explicit `gh issue close` av orkestreraren EFTER
post-merge-verifiering):**

- *Vinner:* Matchar redan kodifierade principer hos oss (`ADR-096`:
  subagenten är Activity och äger ingen väntan; orkestrerarens
  heartbeat-svep äger redan post-merge-sanningen). Är den branschmässiga
  ANALOGEN till Googles Fixed→Verified-split och GitLabs merge≠Done-split —
  inte en avvikelse från branschpraxis utan samma mönster, applicerat på
  stängningshandlingen i stället för på ett separat fält.
- *Kostar:* Förlorar GitHubs gratis "closed by #PR"-länkning om `Closes`
  aldrig används (går att återskapa manuellt med `gh issue close --comment`
  som refererar PR:et, men det blir då en KONVENTION, inte en mekanism —
  exakt den distinktion `ADR-083`/`ADR-100` redan är strikta om i vårt eget
  korpus). Kräver att stängningssteget wiras in i orkestrerarens svep på
  samma sätt armering redan är i dag — annars drifar öppna, klara issues
  precis som PR:er drev innan svepet fanns (`T112`-klassen).

**Hybriden (mekaniskt `Closes #N` KVAR, plus ett separat
verifieringssignal — t.ex. en etikett som `verifierad-pa-main` som
orkestrerarens svep sätter/tar bort, analogt med Googles `Fixed (Verified)`
eller GitLabs produktions-Done-kriterium):** starkast belagd mot faktisk
branschpraxis av de tre, eftersom det är den enda formen alla fyra belagda
aktörer faktiskt använder i någon variant. Kostar en extra etikett/state-
maskin att hålla synkad, men river inte GitHubs native UI-fördelar och river
inte `ADR-127`s härledningsprincip.

## Vad jag inte kunde belägga

- **Google eng-practices (`google/eng-practices`) bär INGEN egen text om
  Fixed/Verified-tillstånd** — det sökningen hittade var Googles publika
  Issue Tracker-dokumentation (`developers.google.com/issue-tracker`), inte
  boken *Software Engineering at Google* och inte `eng-practices`-repot. Jag
  kunde inte inom passets tidsram hitta ett bok-citat som bekräftar samma
  mönster internt för Buganizer specifikt (skiljt från det publika Issue
  Tracker-verktyget, som delar namn men kan skilja sig i detalj).
- **Kubernetes `Fixes #`-auto-stängning vid merge är belagd via PR-mallen,
  INTE via `contributors/guide/issue-triage.md`** — den sistnämnda nämner
  mekanismen inte alls explicit (verifierat genom direkt sökning i den
  hämtade texten). Jag hittade ingen sida som uttryckligen kopplar ihop
  triage-guidens process med `Fixes`-nyckelordets auto-stängning.
- **Vem exakt kör `/reopen` vid en Kubernetes-regression** är obelagt utöver
  att kommandot existerar (bekräftat via sökträff, inte via ett direkt citat
  ur en primärkälla med rollbeskrivning).
- **Matt Pocock: ingen precedent hittad för WHO/WHEN.** Både vårt vendorade
  korpus (`docs/reference/pocock/skills-svenska/`) och det publika repot
  (`github.com/mattpocock/skills`, verifierat **byte-identiskt** via
  `gh search code "gh issue close" repo:mattpocock/skills`) innehåller bara
  verktygskommandot (`gh issue close <n> --comment "..."`), aldrig en
  regel för OM det ska köras av agenten vid PR-öppning eller av en människa
  efter merge. `to-issues/SKILL.md` säger uttryckligen att man aldrig ska
  stänga ett ÖVERORDNAT issue, men det är en annan fråga (parent/child, inte
  timing). Detta är en genuin lucka i källmaterialet, inte en förbisedd
  detalj.
- **Anthropics exakta policy-formulering "agenten mergar aldrig sina egna
  PR:er" är INTE verbatim-bekräftad i förstapartskällan** jag hämtade i sin
  helhet (`code.claude.com/docs/en/github-actions`, 2026-09-04). Den
  formuleringen kom ur en WebSearch-sammanfattning av tredjepartsbloggar
  (matthewswong.com, systemprompt.io), inte ur ett direkt citat från
  Anthropics egen sida. Vad förstapartssidan FAKTISKT säger, verbatim:
  *"Claude Code then pushes a branch with the workflow files you select
  [...] and opens GitHub in your browser with a pull request ready to
  create. Create and merge that pull request, and `@claude` works in the
  repository"* (om installationsflödet) samt best-practice-raden *"review
  Claude's changes before merging"* — mänsklig merge är alltså rekommenderad
  och underförstådd, men jag har inget verbatim-citat som säger att
  mekanismen FÖRHINDRAR agenten från att själv mergande. Fallstudien *"How
  Anthropic teams use Claude Code"* (claude.com/blog) lästes bara via
  WebSearch-sammanfattning, inte via en direkt hämtning med exakt citat —
  citatet *"pull the top bug [...] at 2am [...] open a draft PR before
  anyone wakes up"* är alltså en sammanfattning, inte en verbatim-kontroll
  mot originalsidan.
- **GitHubs "How GitHub uses merge queue"-blogg** hämtades bara via
  WebSearch-sammanfattning, inte via en direkt `WebFetch` med exakt citat.
  Sakuppgiften (merge queue är i dag GitHubs enda ingång för att skeppa
  ändringar, 30 000+ PR:er/4,5M CI-körningar) är därför en sammanfattning av
  sekundär art, inte en primärkälla-verifiering rad för rad.
- **Ingen mätning gjordes** i detta pass — frågan är ett rent
  precedent-/dokumentations-spörsmål, inget beteende i vårt eget repo att
  testköra.

## Källförteckning

1. GitHub, ["Linking a pull request to an issue"](https://docs.github.com/en/issues/tracking-your-work-with-issues/linking-a-pull-request-to-an-issue) — hämtad 2026-09-04. Citat: *"When you merge a linked pull request into the default branch of a repository, its linked issue is automatically closed."* samt *"The special keywords in a pull request description are interpreted only when the pull request targets the repository's default branch."*
2. Kubernetes, [`kubernetes/kubernetes` `.github/PULL_REQUEST_TEMPLATE.md`](https://raw.githubusercontent.com/kubernetes/kubernetes/master/.github/PULL_REQUEST_TEMPLATE.md) — hämtad 2026-09-04. Citat: *"To automatically close the linked issue(s) when this PR is merged, add the word 'Fixes' before the issue number or link."*
3. Kubernetes-community, [`contributors/guide/issue-triage.md`](https://github.com/kubernetes/community/blob/master/contributors/guide/issue-triage.md) — hämtad 2026-09-04. Citat: *"If you have permission to close someone else's issue, first `/assign` the issue to yourself, then `/close` it."*
4. GitHub Blog, ["Deploying branches to GitHub.com"](https://github.blog/engineering/engineering-principles/deploying-branches-to-github-com/) och ["Improving how we deploy GitHub"](https://github.blog/enterprise-software/devops/improving-how-we-deploy-github/) — hämtade via WebSearch-sammanfattning 2026-09-04 (ej verbatim-verifierade rad för rad). Sakuppgift: branch-deploy-modellen verifierar i produktion FÖRE merge till master.
5. GitHub Blog, ["How GitHub uses merge queue to ship hundreds of changes every day"](https://github.blog/engineering/engineering-principles/how-github-uses-merge-queue-to-ship-hundreds-of-changes-every-day/) — WebSearch-sammanfattning, ej verbatim-hämtad.
6. Google Developers, [Issue Tracker-koncept](https://developers.google.com/issue-tracker/concepts/issues) — WebSearch-sammanfattning 2026-09-04. Sakuppgift: `Fixed` vs `Fixed (Verified)` som skilda tillstånd, det senare satt av en utsedd verifierare efter bekräftad release.
7. GitLab, ["Definition of Done"](https://docs.gitlab.com/development/definition_of_done/) — hämtad via `WebFetch` 2026-09-04. Citat (via sammanfattning av hämtningen): merge till `main` är steg ett; produktions-validering ("Featuren är validerad i produktionsmiljö") är ett separat, obligatoriskt kriterium; associerade issues stängs "antingen automatiskt eller manuellt" vid merge.
8. Matt Pocock, [`mattpocock/skills`](https://github.com/mattpocock/skills) — `skills/engineering/setup-matt-pocock-skills/issue-tracker-github.md`, verifierad byte-identisk mot vårt vendorade `docs/reference/pocock/skills-svenska/setup-matt-pocock-skills/issue-tracker-github.md` via `gh search code repo:mattpocock/skills` 2026-09-04. Citat: *"Close: `gh issue close <number> --comment "..."`"*.
9. Anthropic, [Claude Code GitHub Actions](https://code.claude.com/docs/en/github-actions) — hämtad i sin helhet via `WebFetch` 2026-09-04. Citat: *"Create and merge that pull request, and `@claude` works in the repository."* samt *"review Claude's changes before merging."*
10. Anthropic/Claude, ["How Anthropic teams use Claude Code"](https://claude.com/blog/how-anthropic-teams-use-claude-code) — läst via WebSearch-sammanfattning, ej verbatim-hämtad primärt. Sakuppgift (sammanfattad): en rutin kan hämta dagens topp-bugg kl 02 och öppna en draft-PR innan någon vaknar; människa mergar.
11. GitLab, [Issue closing pattern](https://docs.gitlab.com/administration/issue_closing_pattern/) — WebSearch-sammanfattning. Sakuppgift: issues stängs vid push/merge till default branch via konfigurerbara nyckelord.
12. Egen källa (redan i repot): [`ADR-127`](../decisions/ADR-127-backlog-stangningsformerna-harledd-dod-och-avstadda-krav.md) — Backlog.md-substratets nuvarande härledda-DoD-lösning på samma strukturella problem (merge ≠ av-bockningsbar av utföraren).
13. Egen källa (redan i repot): [`backlog-kortskapandets-flaskhals-2026-08-26.md`](backlog-kortskapandets-flaskhals-2026-08-26.md) — identifierade GitHub Issues som substrat-kandidat 2026-08-26, tog inte ställning till stängningsform.
