# ADR-053: Tråd-arkitektur — forensisk läsbarhet + inkodad triage av det oväntade

- Status: Accepted (Session 21 — 2026-06-14; ratificerad av Marcus i direktion samma session, byggs omedelbart)
- Datum: 2026-06-14
- Fas: Session 21 — tråd-arkitektur (process-fundament, ingen byggfas)
- Tråd: T01-system-legibility

## Kontext

Organisationsenheten i Marcus-systemet är SESSIONEN — en chatt-avgränsad behållare. Men arbete
flödar i TRÅDAR (en fas, en feature, en utredning, en oväntad upptäckt) som skär TVÄRS igenom
sessioner: Fas 5.5 spänner sessionerna 18→19→20→19→18. Det oväntade är alltid en ny tråd. Eftersom
doken är organiserade efter behållaren (session), inte efter tråden (den kausala enheten), uppstår
två gap:

1. Det oväntade har inget förstaklass-hem. När en värdefull tråd uppstår utanför scope är systemets
   alternativ idag (a) den dör med chatten, (b) Marcus minns den — den empiriskt svagaste
   mekanismen (~9%), som ADR-043 redan underkände, eller (c) improvisera en fil. Ingen inkodad
   rutin "oväntat uppstår → klassa → hantera" finns.
2. Ingen kanonisk, navigerbar tidslinje. Historien lever utspridd över ADR / lessons / sessionsdok /
   BUILD-LOG / todo / git — var och en partiell, hopfogad för hand. En ny lucka skapades av ADR-051:
   paus skriver inte BUILD-LOG, så en pausad session saknar kronologisk händelsepost i mellanläget.
   En utomstående kan rekonstruera, men inte exakt och effektivt.

Per systemets EGEN standard är detta ett äkta gap. Hela ADR-043:s premiss var att "lita på
omdöme/konvention vid lifecycle-ögonblick" var empiriskt för svagt och därför kodades in. "Lita på
omdöme för det oväntade" är samma svaghetsklass, oåtgärdad. Denna ADR:s ursprung bevisar gapet:
tråd-fröet var en oväntad utanför-scope-tråd som krävde en improviserad fil för att överleva.

Lifecycle-fältet (ADR-052) landade i Session 20 och ger en byggsten: ett O(1)-läsbart tillstånds-fält,
skill-ägt, validerat av en separat lätt grind.

## Beslut

1. Tråden blir en förstaklass-organisationsenhet, parallell med sessionen. En tråd är en kausal
   arbetsenhet som spänner en eller flera sessioner. Sessionen förblir den chatt-avgränsade
   behållaren; tråden är den kausala tidslinjen tvärs behållare.

2. Tråd-register i tasks/threads/, två lager:
   - tasks/threads/README.md — ett index (Markdown-tabell) som ÄR den navigerbara ryggraden: varje
     tråd med ID, titel, lifecycle-tillstånd och ingång. Detta är systemets utomstående-ingång
     ("börja här, följ tråden") och den materialiserade vyn över den utspridda historien.
   - tasks/threads/`T<NN>-<slug>`.md — ett tunt tråd-kort per tråd som förtjänar det, med tråd-tillstånd,
     länkar (sessioner, ADR:er, commits) och kort narrativ.
   - Progressiv disclosure: en oväntad tråd börjar som EN RAD i indexet (billigt); blir den
     substantiell får den ett eget kort.

3. Tråd-ID-konvention `T<NN>-<slug>` (speglar ADR-fil-namngivningen), med commit-tagg `[T<NN>]`.
   Trådens commit-historik blir därmed HÄRLEDBAR ur git (git log --grep), inte handhållen — den
   event-sourcing-korrekta principen: härled vyn ur den append-only loggen, materialisera bara en
   tunn navigerbar yta ovanpå. ADR-headern får en Tråd:-rad och sessionsdok-frontmatter en
   tråd-referens. (Framåtriktat; retroaktiva trådar länkas manuellt i sina kort.)

4. Återanvänd lifecycle:-fältet (ADR-052) för tråd-tillstånd — active / paused / closed, samma enum
   och semantik som sessioner. check-lifecycle.sh utökas att läsa tasks/threads/*.md utöver
   tasks/sessions/*.md, med ett tråd-anpassat konsistens-ankare.

5. Inkodad triage-mikroprocess för det oväntade, levererad som alltid-på regel (PI-delta + CLAUDE.md,
   denna spoke), märkt [UNIVERSAL]. När något oväntat uppstår, klassa mot två axlar — närhet till
   nuvarande scope, och om det BLOCKERAR — och hantera:
   - Blockerar + i scope → hantera nu (enabling-detour, egen landning).
   - Blockerar + utanför scope → STOPPA, eskalera till Marcus (väg-beslut).
   - Blockerar ej + värdefullt → defer till tråd-registret (durabelt, för senare).
   - Blockerar ej + lågvärde → förkasta EXPLICIT (noteras kort, aldrig tyst).
   Kriteriet ny session vs detour = sessions-paus-distinktionen (ADR-051): samma scope → detour;
   distinkt scope → egen session. Levereras alltid-på (ej skill) av samma skäl som ADR-043:s
   meta-discipliner: det oväntade saknar kommando-ögonblick att upptäckas på. Register-skrivning är
   en Code-op per roll-arkitekturen; HUR-detaljen bor i registrets README, ej här.

6. Frontmatter-klassning. Tråd-kort beter sig som sessionsdok: lifecycle-grindade men EJ i
   frontmatter-governing-regimen (ingen review_by-grind — immutabilitets-skäl, ADR-023-klass).
   Index-README:n är ett rent index, EJ governing (ändras varje gång en tråd rörs, som BUILD-LOG/todo).

7. BUILD-LOG och tråd-index är komplementära lager, inte konkurrenter. BUILD-LOG förblir den
   stäng-bundna kronologiska journalen (ADR-051 orört). "Var ligger detta i tidslinjen nu, inklusive
   pausat" besvaras av tråd-indexet. Paus-luckan UPPLÖSES därmed snarare än lappas: pausat arbete syns
   i indexet via trådens lifecycle: paused, oberoende av BUILD-LOG-skrivning.

8. Dogfood. Första tråden T01 = system-legibility (denna tråd). Tråd-fröet migreras till
   tasks/threads/T01-system-legibility.md. Tråden bevisar sin egen tes.

## Alternativ som övervägdes

- MINIMAL (namngiven triage + tunn register-fil). Stänger båda gapen till lägst kostnad. Vald som
  grund — men utvidgad med tråd-ID + lifecycle-återanvändning (beslut 3–4) så tidslinjen blir
  git-härledbar, inte bara en manuell lista.
- MEDIUM (trådar som dok-typ med tillstånd + tidslinje-index) — VALD. Bygger på MINIMAL. Återanvänder
  lifecycle-fältet (redan på disk), ger tråd-ID och ett index som länkar trådar ↔ commits ↔
  ADR/lessons. Stänger båda gapen och gör historien navigerbar utan tung maskineri.
- TUNG (event-sourcad ombyggnad av hela dok-modellen) — FÖRKASTAD. Systemet HAR redan en append-only
  händelselogg (git + ADR-katalog + BUILD-LOG + sessionsdok) och följer redan
  supersede-aldrig-redigera-disciplinen. Att bygga om dok-modellen kring en händelselogg vore att
  återimplementera git, och riskerar exakt det överbygge branschpraxis varnar för (Linears
  anti-svall-filosofi; ADR-praxisens "inte för mycket detalj") och som bryter den sömlöshet målet
  kräver. Den materialiserade vyn (beslut 2) ger event-sourcingens navigerbarhets-vinst utan
  ombyggnaden.
- Lappa paus-luckan genom att låta paus skriva BUILD-LOG. FÖRKASTAD: bryter ADR-051 beslut 4:s
  paus/end-gräns (paus finaliserar inte). Beslut 7 upplöser luckan i rätt lager istället.

## Konsekvenser

Positivt. Systemets historia får en navigerbar ryggrad (en fil att börja i). Det oväntade får ett
inkodat hem och en namngiven triage-rutin — enforcement flyttas från Chat-omdöme (~9%) till en
alltid-på regel + register. Tråd-tillstånd blir O(1)-läsbart via återanvänt lifecycle-fält.
Trådhistorik blir git-härledbar via commit-tagg. Paus-luckan upplöses utan att röra ADR-051.

Kostnader/risker. Nya rörliga delar: ett register, en grind-utvidgning, en commit-tagg-konvention,
en alltid-på regel. Mitigeras genom att hålla allt tunt (index + tunt kort, liten fast taxonomi) och
återanvända befintlig mekanism (lifecycle-grind). Risk att tråd-disciplinen blir overhead om varje
småsak blir en tråd — taxonomin håller baren hög (förkasta-explicit-grenen). Triage-regeln pekar på
register-mekanismen i DENNA spoke; hub-templatisering är [UNIVERSAL]-horisont, ej denna sessions scope.

Reversibelt. Register, grind-tillägg, tagg-konvention och regel är repo-källade projektioner; kan
rivas och om-projiceras utan dataförlust.

## Forskningsgrund

Förstaparts först, sedan ≥3 distinkta branschledande mönster per seed:s research-checklista. Ingen
befintlig projekt-research täckte domänen (disk-verifierat K0) — körd färsk.

- Anthropic, effektiva harness för long-running agents (förstaparts). Strukturerade handoff-filer
  (nuläge, kända problem, nästa steg), progress-fil, git-commits som ett andra record. Kärngapet:
  "varför" går förlorat i summeringar (varför B över A). Tråd-register + ADR-länkar adresserar exakt
  detta. (anthropic.com/engineering/effective-harnesses-for-long-running-agents;
  anthropics/cwc-long-running-agents)
- Event sourcing (Fowler 2005; Microsoft Azure; EventStore). Append-only logg = sanning, tillstånd
  härlett via replay; råloggen lämpar sig ej för effektiv navigering → Materialized View-mönstret.
  Motiverar beslut 2+3 och att INTE bygga om loggen (TUNG förkastad).
- Distribuerad tracing (OpenTelemetry). Trace grupperar spans via propagerat trace-ID + parent-pekare;
  backenden rekonstruerar tidslinjen genom att följa pekaren; span links binder kausalt relaterat
  arbete. Analogi: tråd = trace, session = span, tråd-ID = trace-ID. Motiverar beslut 1+3.
- Issue-tracking (Linear). Work-item + tillståndsmaskin + labels + länkade issues;
  initiative-som-issue / sessioner-som-subissues; Triage som namngiven ingång. Filosofin motstår
  konfigurations-svall — stöder den minimala formen. Motiverar beslut 1+5.
- Oplanerat arbete (Kanban Classes of Service). Liten fast taxonomi, timeboxad triage, explicit
  Out-of-scope-tagg ("registrera, var medveten om påverkan"); ledstjärna "if you can't fix it, make
  it more visible". Motiverar beslut 5.
<!-- vale Vale.Terms = NO -->
- Besluts-/audit-logg (ADR-praxis: adr.github.io; AWS; Microsoft Azure). "Kod visar vad, inte varför";
  ADR = append-only why-logg; navigerbarhet via index-README + domän-taggar + kors-länkar; redigera
  aldrig accepterad ADR, ersätt. Motiverar beslut 2 och bekräftar systemets befintliga supersede-disciplin.
<!-- vale Vale.Terms = YES -->

## Relaterade ADR:er

- ADR-052 (lifecycle-fält) — tråd-tillstånd återanvänder fältet och dess grind (beslut 4).
- ADR-051 (session-paus) — paus/end-gränsen orörd; beslut 7 upplöser BUILD-LOG-luckan i rätt lager.
- ADR-043 (lifecycle-skill-arkitektur) — K8-precedenten bär triage-regelns alltid-på-leverans (beslut 5).
- ADR-048 (synk-horisont/arkiv) — läsbarhets-relevant; tråd-indexet kompletterar arkiv-gränsen.
- ADR-023 (sessions-arkivering) — immutabiliteten som motiverar frontmatter-klassningen (beslut 6).
- ADR-039 (ADR-räkning) — rot-README-räknaren bumpas 52→53.
- ADR-040 (sessions-numrering) — tråd-ID:t är en separat axel, parallell med sessions- och ADR-numreringen.
- L119 (asymmetrisk axel = drift) — tråd-lifecycle ärver lifecycle-fältets symmetri-disciplin.
