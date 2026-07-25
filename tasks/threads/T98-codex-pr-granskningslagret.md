---
owner: marcus803
updated: 2026-07-25
review_by: 2026-10-25
status: stable
lifecycle: active
---

# T98 — Codex PR-granskningslagret: boten ingen läste

> Tråd-kort (ADR-053). Född 2026-07-25 ur Marcus-fråga i en parallell
> utforsknings-session bredvid aktiva S89 — **utanför sessionsnumreringen**
> (ingen egen session öppnades; utredningen kördes läs-only medan S89 ägde
> arbetsträdet). Commit-tagg: `[T98]`.
>
> **Numrerings-not:** S89:s stängningsrad anger `nästa tråd T98`. Denna tråd
> förbrukar T98 → **nästa lediga är T99**. Samma klass som S82:s öppna
> korrigering ("T86 FÖRBRUKAD → nästa tråd T87") när en parallell session
> tog ett nummer efter att kadens-raden skrivits.

## Ursprung

Marcus observerade att `chatgpt-codex-connector[bot]` kommenterar på PR:er, och
att Code aldrig påtalat en enda kommentar. Utforskningen bekräftade observationen
och avtäckte att lagret körts skarpt sedan 2026-07-24 utan att någon del av
systemet vet om det.

ADR-053-triage: **blockerar ej + värdefullt → defer till tråd-registret.**

## Fynd 1 — Vad som är uppsatt (verifierat mot GitHub-API)

OpenAI:s Codex code review via GitHub-app. Konfigurationen bor på
`chatgpt.com/codex/cloud/settings/general` — **utanför repot**. Botens egen text:

> "Your team has set up Codex to review pull requests in this repo. Reviews are
> triggered when you: Open a pull request for review · Mark a draft as ready ·
> Comment `@codex review`."

Aktivitetskarta (API-inventering över PR #150–#214):

| Intervall | Utfall |
|---|---|
| PR #163–#189 | **16 PR:er med skarpa reviews**, 19 inventerade line-comments |
| PR #190–#211 | 18 PR:er fick endast *"You have reached your Codex usage limits"* |
| PR #212 | Fungerade igen — ett P2-fynd |
| PR #213–#214 | Ingen aktivitet |

**Kvot-väggen är tyst.** Ingen signal någonstans i systemet när granskningslagret
slutade fungera mitt i S88. Samma klass som TASK-51:s larm — frånvaro av data
presenterad som ingenting alls. Enligt OpenAI:s dokumentation räknas
GitHub-triggade reviews mot en separat "Code Review"-mätare, skild från generell
Codex-användning.

**Ingen `AGENTS.md` finns i repot** (verifierat: `find . -name AGENTS.md` → tomt).
Codex kör alltså helt okonfigurerad — utan kännedom om kvalitetsribban,
ADR-disciplinen, svenska som arbetsspråk eller repots konventioner. Det förklarar
dels att fynden är generiska och engelska, dels att den ibland flaggar medvetna
designval.

## Fynd 2 — Varför den aldrig lästes (tre orsaker)

1. **Konfigurationen bor utanför repot.** Inget i `.github/`, ingen workflow, inget
   i CONTRIBUTING. Grep på "codex" i repot ger noll träffar på boten. LÄS-fasen kan
   strukturellt inte upptäcka den.

2. **Ingen process föreskriver det.** Genomsökning av marcus-system-pluginets
   samtliga skills (`do-work`, `session-end`, `session-start`, `arch-audit`) ger noll
   träffar på PR-kommentarsläsning. Vårt CI-begrepp är *checks* (röd/grön), inte
   *reviews*. Och `gh pr merge --auto --merge` ignorerar en `COMMENTED`-review.

3. **Namnkollisionen — den giftiga.** "Codex" i repot betyder de *beställda*
   rapporterna (processgranskningen 2026-07-23, eftergranskningen 2026-07-24),
   citerade i T85, T86, CONTRIBUTING och flera sessionsdok. Systemet ser överallt ut
   som att Codex-input hanteras rigoröst. Boten delar namn med sin homonym och
   drunknar i den.

**Timing var inte orsaken.** Codex svarar på 2,5–4,5 min; merge sker 5–10 min efter
öppning. I 5 av 6 kontrollerade fall låg kommentaren där före merge. Fönstret fanns.

**Kvitto på att ingen läst:** noll reaktioner, noll svar, noll mänskliga
line-comments på samtliga inventerade PR:er.

## Fynd 3 — De fem kvarstående kodfynden

Verifieringsgrad: **kodvägen följd i sin helhet**, inte bara den rad Codex pekade på.
Ej empiriskt framkallade — rött-först-test återstår som bevisform. Re-verifierade
mot HEAD `c7e3eeb` (efter S89:s stängning) — samtliga oförändrade.

| # | Fil | Fynd | Status |
|---|---|---|---|
| 1 | `src/components/events/EventValjare.tsx:129` | `useQuery` destrukturerar `{ data, isPending }` — `isError` plockas aldrig ut. Vid API-fel visas rad 286 *"Inga event matchar sökningen"*. `ManuellAnmalanForm.tsx` har `eventQuery.isPending` (rad 344) men ingen `isError`-gren; alla felrutor där gäller mutationen, ej hämtningen. | **BEVISAD — allvarligast** |
| 2 | `src/components/registrations/AnmalanDetail.tsx:210, 243` | Routen (`$registrationId.tsx`) renderar utan `key` → TanStack Router återanvänder komponenten vid param-byte. `announceRef` sätts en gång, återställs aldrig. Raderna 503–513 innehåller länkarna som utlöser det. → fokus flyttas ej, `document.title` uppdateras ej. | **BEVISAD** |
| 3 | `src/components/events/EventsList.tsx:405` | Yttre strukturen renderar `filterRad` alltid i listläge, oberoende av `isError`; endast `body` byter till felrutan. Vid fel står *"Kunde inte hämta event"* och *"Visar 0 av 0 event"* samtidigt. | **BEVISAD** |
| 4 | `src/components/events/EventsList.tsx:427` | `onPress={() => window.print()}` utan spärr, i samma alltid-renderade panel. Utskrift av skelettplatshållare möjlig under `isPending`. | **BEVISAD** |
| 5 | `src/components/events/EventDetail.tsx:118` | `titelNu` + pathname-kontroll läses före `requestAnimationFrame`, titeln skrivs inne i den. Genuin kapplöpning, fönster ~16 ms. | **SVAG — låg prioritet** |

Löst sedan tidigare: PR #168 (ADR-078 saknades i ADR-katalogen) — finns nu i
`docs/decisions/README.md:131`.

**Ingen av dem ändrar utseendet i normalläget.** Samtliga rör fellägen och kantfall.
Visuella baselines bör inte falla. Funktionsändringen gäller där appen idag är
missvisande: skillnaden mellan "det finns inget" och "vi kunde inte hämta".

**Kalibreringsbedömning:** Codex satte P1 på det korrekta katalogfyndet och P2 på
resten. Av 19 fynd är endast #5 svagt. Den överdrev inte.

## Research — branschpraxis för att mekanisera läsningen (2026-07-25)

### Det mekaniska nyckelfyndet

**Bot-reviews räknas inte mot branch protection.** GitHub räknar endast riktiga
användar-approvals mot merge-krav; automatiska reviews från appar/bots gör det inte,
avsiktligt — för att hindra automation från att kringgå review-policy.
Bypass-behörighet hoppar över kravet helt i stället för att uppfylla det.

Konsekvens: **Codex-fynd kan inte göras blockerande via required reviews.** Codex
postar dessutom `COMMENTED`, inte `REQUEST_CHANGES`. Mekaniseringen måste därför
bygga på en egen CI-check som läser GitHubs API och failar vid oadresserade fynd —
`danger-js`/`reviewdog`-mönstret (båda stödjer `fail-on-error`/`fail-level`).

### Det processuella nyckelfyndet

Branschens dokumenterade huvudsakliga felläge är exakt vårt: **volym tränar
granskare att ignorera boten.** En bot som postar 18 kommentarer per PR lär teamet
att sluta titta. Motmedlet som återkommer är severity-driven triage i tre nivåer:

| Nivå | Regel |
|---|---|
| **Action Required** | Blockerar merge |
| **Recommended** | Bör åtgärdas; merge kan ske med explicit kvittens |
| **Minor** | Nits, stil, framtida refaktor — rådgivande |

Rekommendationen är att gata CI på en liten uppsättning högkonfidens-regler och låta
resten vara rådgivande. Mätaren som föreslås: **under 30 % av AI-kommentarer som
leder till ändring ⇒ konfigurationen behöver arbete; över 50 % ⇒ god uppsättning.**
Vår nuvarande siffra är 0 % — men av icke-läsning, inte av dålig kvalitet, vilket
gör måttet meningsfullt först efter mekaniseringen.

Noterbar spänning mot vårt L321/L322-arv: vi har redan förkastat rådgivande lägen
som kyrkogårds-klass (samma resonemang parkerade T87:s visuella grind helt hellre än
i rådgivande läge). Branschmönstret föreslår *delvis* rådgivande. Det är en genuin
designfråga för grillningen, inte något att avgöra i förbifarten.

### Styrfilen vi saknar

Codex customiseras via **`AGENTS.md` med en `## Code Review Rules`-sektion** —
repo-breda regler i rotfilen, tjänstespecifika i nästlade. Det är det billigaste
handtaget för att höja precisionen och få fynden på svenska och mot vår ribba.

### Källor

- [Codex code review i GitHub — OpenAI](https://learn.chatgpt.com/use-cases/github-code-reviews)
- [GitHub Docs — About protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub community #181487 — bot-reviews uppfyller inte merge-krav](https://github.com/orgs/community/discussions/181487)
- [Sourcegraph — AI Code Review in 2026](https://sourcegraph.com/blog/ai-code-review)
- [Qodo — 5 AI Code Review Pattern Predictions in 2026](https://www.qodo.ai/blog/5-ai-code-review-pattern-predictions-in-2026/)
- [dev.to — Return on Attention: Why AI Code Reviews Are Wearing Us Out](https://dev.to/cseeman/return-on-attention-why-ai-code-reviews-are-wearing-us-out-2hh0)
- [Danger JS](https://danger.systems/js/) · [reviewdog](https://github.com/reviewdog/reviewdog)
- [OpenAI Codex usage limits — discussion #8503](https://github.com/openai/codex/discussions/8503)

## Föreslaget åtgärdspaket

Ordningen är avsiktlig: processfixen är värd mer än de fem kodfixarna, eftersom den
fångar de nästa nitton fynden också.

1. **Kort A — EventValjare `isError`** (eget kort, snarast). Det enda fyndet som
   stoppar arbete: Lotta kan inte lägga in manuell anmälan och får veta att det inte
   finns några event. Rött-först-test som bevisform.
2. **Kort B — Fellägespaketet**: EventsList-räknaren, print-knappen,
   AnmalanDetail-announcern.
3. **Processbeslutet — grillnings-kandidat.** Hur läsningen mekaniseras. Öppna frågor
   nedan. Detta är den bärande delen.
4. **`AGENTS.md` med `## Code Review Rules`** — billigast möjliga precisionshöjning.
5. EventDetail-rAF-fyndet noteras här och lämnas lågt.

## Öppna frågor (för grillningen)

- **Blockerande eller rådgivande?** Branschmönstret säger severity-delat; vårt
  L321/L322-arv säger att rådgivande lägen blir kyrkogårdar. Vilken vinner, och
  varför? Detta är trådens svåraste fråga.
- **Var bor läsningen?** Steg i `do-work`:s stängning · egen CI-check som läser
  API:t · moment i `session-end`. Skill-materia (hub) eller repo-materia (spoke)?
- **Kvot-blindheten** — hur upptäcks nästa tysta vägg? Samma klass som TASK-51.
- **Auto-merge-fönstret** — 5–10 min räcker för Codex (2,5–4,5 min), men marginalen
  är tunn. PR #212 mergades 67 sekunder innan reviewn kom.
- **Relation till T86:s review-pilot** — den mäter en subagent-review i
  do-work-skarven. Codex-lagret är en andra, oberoende granskningskälla på samma yta.
  Överlappar de? Ska de mätas i samma vågskål?

## Vad som INTE gjordes

- Inga fynd empiriskt framkallade — kodvägar följda, ej körda.
- PR #163, #165, #166 har reviews som inte öppnats i detalj; **totalen 19 fynd är ett
  golv, inte ett tak.**
- Codex-inställningarna på chatgpt.com ej inspekterade (kräver Marcus inloggning).
- Inga kort skapade — åtgärdspaketet ovan är förslag, ej publicerade skivor.
