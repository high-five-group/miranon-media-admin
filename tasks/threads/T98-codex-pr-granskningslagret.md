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

**Timing är en FJÄRDE orsak — och den strukturellt värsta.** Skärpt 2026-07-25 mot
30 mergade PR:er efter att den första formuleringen ("timing var inte orsaken",
grundad på sex kod-PR:er) inte höll mot bredare data. Bilden är tvådelad:

| PR-klass | Livslängd | Codex vs merge |
|---|---|---|
| **Kod-PR** (full testsvit) | ~10–45 min | Review hinner **före** merge — låg där oläst |
| **Docs-PR** (Test suite skippad) | **~57–75 s** | Review kommer **67–99 s EFTER** merge |

Verifierat efter-merge på PR #221 (+95 s), #219 (+73 s), #212 (+67 s), #186 (+99 s) —
fyra av fyra snabba PR:er. Före-merge på #189 (−2367 s) och #187 (−1435 s).

Konsekvensen är hård: **på vår vanligaste PR-typ kan ingen grind fånga fyndet,
eftersom mergen redan skett när reviewn föds.** Docs-only-klassningen (ADR-077) som
ger oss snabbhet är samma mekanism som gör granskningslagret verkningslöst där.
Detta är inte ett läsdisciplin-problem utan ett arkitekturproblem i skarven mellan
auto-merge och en asynkron granskare.

Egen empiri: **denna tråds egen PR #222 levde i 72 sekunder och fick ingen review
alls** — varken före eller efter.

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
- **Auto-merge-fönstret — nu den svåraste mekaniska frågan** (uppgraderad efter
  30-PR-mätningen ovan). Docs-PR:er lever ~60–75 s och Codex svarar 67–99 s efter
  merge. Ingen CI-check kan gata det som föds efter mergen. Kandidater, alla med
  kostnad: (a) minsta-livslängd på PR före auto-merge — betalar med den snabbhet
  T85 byggde · (b) efterhands-svep som läser mergade PR:ers reviews och registrerar
  fynd som kort — fångar allt men blockerar inget · (c) `@codex review` synkront
  före merge på valda klasser · (d) acceptera att docs-PR:er är ogranskade och
  säga det öppet. **(b) är enda formen som fångar det strukturella fallet** —
  men den är per definition rådgivande, vilket kolliderar med L321/L322-frågan ovan.
- **Relation till T86:s review-pilot** — den mäter en subagent-review i
  do-work-skarven. Codex-lagret är en andra, oberoende granskningskälla på samma yta.
  Överlappar de? Ska de mätas i samma vågskål?

## Vad som INTE gjordes

- Inga fynd empiriskt framkallade — kodvägar följda, ej körda.
- PR #163, #165, #166 har reviews som inte öppnats i detalj; **totalen 19 fynd är ett
  golv, inte ett tak.**
- Codex-inställningarna på chatgpt.com ej inspekterade (kräver Marcus inloggning).
- Inga kort skapade — åtgärdspaketet ovan är förslag, ej publicerade skivor.

## Migrerat ur indexraden (`TASK-157.2`, 2026-08-07)

> Ordagrann text som tidigare bodde i `tasks/threads/README.md`s Titel-
> och/eller Ingång-kolumn för denna tråd, flyttad hit av registrets
> tunna radform-migration (ADR-098). Inget härunder är omskrivet —
> emfas-markörernas STIL (*...* vs *...*) normaliseras separat av
> `npx markdownlint-cli2 --fix` mot filens egen etablerade MD049-stil,
> inte av denna migration.

**Titel (fullständig, ursprunglig):**
Codex PR-granskningslagret — `chatgpt-codex-connector[bot]` kommenterar på PR:er sedan 2026-07-24 (konfig på chatgpt.com, UTANFÖR repot) och INGEN har läst en enda kommentar: noll reaktioner, noll svar, noll omnämnanden. 16 PR:er med skarpa reviews (#163–#189, 19 inventerade fynd), sedan tyst kvot-vägg #190–#211 (18 PR:er fick bara "usage limits" — samma klass som TASK-51:s larm: frånvaro presenterad som ingenting). FYRA orsaker: konfig osynlig för LÄS-fasen · ingen skill föreskriver PR-kommentarsläsning (CI-begreppet = checks, ej reviews; `gh pr merge --auto` ignorerar COMMENTED) · namnkollision med de BESTÄLLDA Codex-rapporterna (T85/T86) som lästs rigoröst · **TIMING, den strukturellt värsta** (skärpt mot 30 mergade PR:er 2026-07-25, efter att första formuleringen "timing var inte orsaken" föll på bredare data): docs-PR:er lever ~57–75 s medan Codex svarar 67–99 s EFTER merge (#221/#219/#212/#186 fyra av fyra) — på vår vanligaste PR-typ kan INGEN grind fånga fyndet eftersom mergen redan skett när reviewn föds; ADR-077:s docs-klassning som ger snabbhet är samma mekanism som gör granskningslagret verkningslöst där. Fem fynd kvarstår i koden, kodvägs-verifierade mot HEAD `c7e3eeb`: EventValjare `isError` saknas helt (API-fel visas som "Inga event matchar sökningen" — blockerar manuell anmälan, ALLVARLIGAST) · AnmalanDetail `announceRef` återställs ej vid param-byte (route utan `key`) · EventsList "Visar 0 av 0" vid fel · print-knapp utan spärr · EventDetail rAF-race (svag). Ingen ändrar utseendet i normalläget. RESEARCH KLAR 2026-07-25: bot-reviews räknas INTE mot branch protection (avsiktligt) → mekanisering kräver egen CI-check mot API:t, danger/reviewdog-mönstret; branschens felläge är exakt vårt (volym tränar bort läsning) → severity-triage i tre nivåer, mätare "<30 % åtgärdade ⇒ konfig behöver arbete"; `AGENTS.md ## Code Review Rules` är styrfilen vi saknar (finns ej i repot ⇒ boten kör okonfigurerad). Processfixen värd mer än de fem kodfixarna. Grillnings-kandidat: blockerande vs rådgivande (branschmönstret vs vårt L321/L322-kyrkogårdsarv, samma resonemang som parkerade T87)

**Ingång (fullständig, ursprunglig):**
[T98-codex-pr-granskningslagret.md](T98-codex-pr-granskningslagret.md) · besläktad `T85` `T86`
