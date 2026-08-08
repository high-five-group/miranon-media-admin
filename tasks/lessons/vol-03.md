---
owner: marcus803
updated: 2026-08-08
review_by: 2026-11-15
status: stable
---

<!-- vale Miranon.VueToReact = NO -->
<!-- DEFERRED: Session 6.6.6 — Miranon.VueToReact Vue→React-drift fix -->
<!-- vale Vale.Terms = NO -->
<!-- Per ADR-032 (Session 6.6.6 K3.5 2026-05-20): helfil-disable mot L_X.2 Vale 3.14.1-upstream-quirk, ärvd från tasks/lessons.md vid volym-splitten (TASK-161.9, ADR-085-formen). Brand-rule-aktivering bevarad — endast Vale.Terms täcks. Lift vid upstream-fix per ADR-032 § Lift-protokoll. -->

# tasks/lessons/vol-03.md — Universella lärdomar, volym 3

> **STÄNGD volym** · 2026-06-13 → 2026-07-07: Session 17 → Session 58 (repo-hygien, Fas 5.5–6h, MIGRERINGS-HUB-SESSION 1–3); L-numrering etableras (L1 vid Session 6.6.5) och löper vidare nästlad i H2-sessionsblock t.o.m. L251.
>
> Ingång, uppslags- och append-regler: [`tasks/lessons.md`](../lessons.md) (indexet).
> Innehållet nedan är bevarat verbatim från uppdelningen 2026-08-08 (ADR-085,
> precedent-tillämpning av hubbens volym-split). Nya block tillkommer aldrig i en stängd volym.

---

## 2026-06-13 — Session 17 (repo-hygien + synk-horisont)

Mellanfas-session utan byggfas: projektkunskaps-synkens 91 %-tak drev
struktur-flyttar, ADR-048-synk-horisonten och en struktur-audit. Två grindar
betalade sig per design under sessionen: ADR-039-räknaren fångade
README-driften vid ADR-048-registreringen, och ADR-028-flödet hanterade en
färsk esbuild-advisory friktionsfritt (STOPPA → diagnostik → Marcus-val →
allowlist med expiry).

- [UNIVERSAL] **L103 — Chat-prompts åtgärdslistor ska korsläsas mot den egna beställda kartläggningen före leverans.**
  Symptom: K3-rapporten flaggade explicit att Fas-2-verifierings-flytten krävde todo.md-länkuppdatering i samma commit; K4-promptens pekar-lista tog ändå bara byggplan.md + Status.ts → lychee röd i fyra runs tills rättning. Generaliserbar regel: när en exekverings-prompt bygger på en tidigare LÄS-rapport ska promptens åtgärdslista diffas mot rapportens SAMTLIGA flaggor som explicit self-review-steg före leverans; Code korsläser å sin sida exekveringslistan mot sina egna tidigare fynd — dubbel fångst, ingen ensam felkälla. Källa: 2026-06-13 Session 17 K4 (rotorsak 1), sessionsdok Del 2.

- [UNIVERSAL] **L104 — Pipe-/kedje-exit äter grind-exit-koder även lokalt.**
  Symptom: `| tail` åt markdownlints exit-kod i en lokal grind-körning, och en `&&`-kedja gateade inte på lint-steget — två lint-fel committades före fångst, båda i samma session. Generaliserbar regel: lokala grind-kommandon körs ENSAMMA och exit-koden läses direkt; aldrig pipe eller kommando-kedja runt det kommando vars exit-kod ÄR grinden. CI-sidan av felklassen var redan etablerad (ADR-043-disciplinen); nu empiriskt demonstrerad lokalt. Källa: 2026-06-13 Session 17 K4 (oväntade fynd), sessionsdok Del 2.

- [UNIVERSAL] **L105 — Arkivmoget material som ligger kvar i grind-scope kostar löpande underhåll.**
  Symptom: frusna analys-leveranser (vars trail-disciplin är att INTE redigeras) krävde länk-lagning så sent som Session 16 enbart för att de låg kvar i lychee-/markdownlint-scope. Generaliserbar regel: när ett dokument klassas fruset/konsumerat ska det flyttas till scope-exkluderad arkivkatalog — annars tvingar framtida grind- och path-ändringar redigering av material vars disciplin är immutabilitet, en inbyggd motsägelse. Källa: 2026-06-13 Session 17 K3 (oväntat fynd 1) + K4 commit 1.

- [UNIVERSAL] **L106 — Index-/synk-exkludering utan pekare i det synkade materialet är tyst minnesförlust.**
  Symptom/lösning: Session 17 exkluderade arkivkataloger ur claude.ai-projektkunskapen (91 % → 64 % av synk-kapaciteten); utan motåtgärd hade framtida Chat-sessioner tolkat noll sökträffar som "finns inte". Pekar-arkitektur lades därför på tre SYNKADE ytor (spoke-CLAUDE.md § Synk-horisont, PI-deltat, ADR-048) + README:er i arkivrötterna, med åtkomstregeln: noll träffar ≠ saknas — hämta via Code mot lokal disk/git. Generaliserbar regel: varje medveten exkludering ur ett agent-index ska bära en pekare i det material som FÖRBLIR indexerat, placerad där agenten orienterar sig. Källa: 2026-06-13 Session 17 K4–K5, ADR-048.

- [UNIVERSAL] **L107 — Grindvakternas egna testsviter behöver samma körnings-kadens som grindarna de vaktar.**
  Symptom: 3 av 6 grindvakts-testsviter kördes inte i CI (endast doc-refererade) — regression i själva grind-skripten skulle ha upptäckts först vid manuell körning. Detta är ADR-039-felklassen (kadens-missmatch) återfunnen i grind-infrastrukturens eget lager. Generaliserbar regel: när en grind får en testsvit ska sviten wiras in i CI i samma beslut — en svit utan CI-kadens är capture utan enforcement (K8.2-mönstret). Källa: 2026-06-13 Session 17 K6 Del 3 + K7 commit 2 (run 27449167933).

- **L108 — markdownlint-cli2:s ignores vinner över explicita CLI-filargument.**
  Symptom: ignored paths kan inte lintas ens med direkta filargument; arkiv-skuldmätningen krävde temp-config utanför trädet, och K4:s arkiv-README:er hamnade "automatiskt" utanför scope av samma mekanism. Regel: för scope-experiment mot ignored kataloger, använd temp-config — inte CLI-args; och vid grind-design, kom ihåg att ignores är absolut. Källa: 2026-06-13 Session 17 K6 (oväntat fynd 2) + transparens-rapport.

- [UNIVERSAL] **L109 — Steg-namn och scope-kommentarer får inte ljuga om sitt innehåll.**
  Symptom: två instanser samma session — ci.yml-scope-kommentaren påstod att hela tasks/sessions/** var utelämnat (blev osant vid glob-utvidgningen; omskreven), och STOPPA-valet B motiverades av att det befintliga CI-stegets namn beskriver en annan svit-familj än de nya sviterna. Generaliserbar regel: när innehåll ändras, uppdatera namn/kommentar i samma commit; vid inplacering av nytt innehåll, välj strukturen som håller namnen sanna — kosmetik som ljuger är drift-frö. Källa: 2026-06-13 Session 17 K7 commit 1 + STOPPA-beslut B.

## 2026-06-13 — Session 18 (Fas 5.5 vertikal write-slice — PAUSAD)

Server-kontraktet för "markera anmälningsavgift som betald" levererades
(operation registrerad, ADR-049, ADR-016-erratum), men test-aktiveringen
avslöjade två lager av falska antaganden: källändring påverkar inte staging
utan EF-redeploy, och det finns ingen isolerad staging-miljö alls. Fas 5.5
pausades för att bygga riktig staging först (Session 19, research-gated).

- [UNIVERSAL] **L110 — Test-infra som antar en miljö måste verifiera att miljön existerar; dokumentation om infra-tillstånd ≠ bevis på infra-tillstånd.**
  Symptom: `helpers.ts`, `.env.test.example` och 6 CI-secrets var skrivna som om ett separat staging-Supabase-projekt fanns; en `supabase projects list` vid deploy-kapacitets-verifieringen visade **ett enda** projekt — "staging" testerna träffar är den levande miljön + samma Airtable-bas. Infra-defekten hade legat dold bakom dokumentation som beskrev ett önskat, inte faktiskt, tillstånd. Generaliserbar regel: innan kod/tester förlitar sig på en miljös existens eller isolering, verifiera den empiriskt mot källan (CLI/API), inte mot konfig-filer eller dokumentation som BESKRIVER den — beskrivning är intention, inte bevis. Källa: 2026-06-13 Session 18 deploy-kapacitets-verifiering, sessionsdok Del 2 Öppen tråd 3.

- [UNIVERSAL] **L111 — Källändring ≠ körtidstillstånd: en registrerad operation är inte live utan deploy.**
  Symptom: att lägga `mark-registration-fee-paid` i `field-allowlists.ts` och pusha gjorde inte operationen känd i staging — den deployade EF:en svarade fortfarande `"Unknown operation"` (CI-run 27463508240), eftersom CI saknar deploy-steg och staging-testerna kör mot senast manuellt deployade version. Fält-deny-testet föll och `recordId-prefix`-testet passerade för fel anledning. Generaliserbar regel: när en testbar effekt bor i deployad artefakt (EF, lambda, container), gäller en push av källan ingenting förrän artefakten omdeployas; verifiera deploy-kadensen mot test-kadensen innan tester aktiveras, annars testar gröna körningar gammal kod. Källa: 2026-06-13 Session 18 STEG 2 + CI-run 27463508240, ADR-049 Öppen tråd 1.

- [UNIVERSAL] **L112 — Pre-fas-ADR kan bära ett falsifierat antagande som tyst ärvs; korsverifiera gammal ADR:s konkreta antaganden mot aktuell datamodell vid implementation.**
  Symptom: ADR-016:s kodexempel skrev fältet `Status` för "markera som betald", men `RegistrationStatus` saknar betald-värde — betalstatus bor i `Anmälningsavgift`/`Slutbetalning`/psionautics-fältet. Antagandet var pre-Fas-2.5-drift och hade följt med till byggplanens DoD. Fångades i sessionsstartens datamodell-korsläsning, inte av ADR:n själv. Generaliserbar regel: ett låst beslut är inte immunt mot evidens — vid implementation av en gammal ADR, korsläs dess KONKRETA antaganden (fältnamn, värden, ID:n) mot aktuell datamodell/källa, och riv falsifierat öppet med erratum (ej tyst patch). Källa: 2026-06-13 Session 18 STEG 0/STEG 3, ADR-049 + ADR-016-erratum.

- [UNIVERSAL] **L113 — Kringgående vs grundorsaks-fix: fixa orsaken när kostnaden att göra rätt är låg; kringgå bara när den är prohibitivt hög.**
  Symptom: allow-testet behövde ett muterbart record utan att skada live-data. Två vägar fanns — kringgå (self-create/delete-record i testet) eller fixa orsaken (riktig isolerad staging). Eftersom Airtable-bas-duplicering är "ett knapptryck" (låg kostnad), valdes grundorsaks-fixen (bygg staging) framför self-create/delete-kringgåendet. Generaliserbar regel: när ett test/flow tvingar fram en workaround, värdera kostnaden att i stället eliminera grundorsaken; är den låg är workarounden teknisk skuld utan motivering. Endast prohibitiv åtgärds-kostnad rättfärdigar kringgående. Källa: 2026-06-13 Session 18, ADR-049 Öppen tråd 1+2 → staging-beslut.

## 2026-06-13 — Session 19 (Staging-miljö designsession — ADR-050 + förarbete steg 1+2)

Research-gated designsession: empirisk miljö-verifiering bekräftade L110
(ett Supabase-projekt, Postgres nära tomt), ADR-050 beslutade isolerad staging
(Pro + dedikerad Airtable-bas), förarbete steg 1 (env-driven `AIRTABLE_BASE_ID` +
tabell per namn) + steg 2 (fail-closed prod-deploy-allowlist) landades. Marcus
skapade båda miljöerna. Fas 5.5 förblir PÅGÅENDE.

- **L114 — ADR-katalog-/frontmatter-fält är ENGELSKA i detta repo även med svensk brödtext.**
  Symptom: ADR-050:s prompt-värde var `Status: Accepterad`, men alla 49 befintliga ADR:er + katalogen använder `Accepted`. Code överred prompten och skrev `Accepted` för konvention-konsistens. Generaliserbar regel: en etablerad konvention i ett stort bestånd (49 ADR:er) slår en enskild prompts bokstav på format-fält (Status, fält-namn) — skriv konventionsvärdet direkt och flagga override:n. Källa: 2026-06-13 Session 19, ADR-050-landning (commit `8445f75`).

- [UNIVERSAL] **L115 — Generisk plattforms-research kan vilseleda i en arkitektur där datan bor någon annanstans; verifiera lokalt arkitektur-tillstånd empiriskt INNAN ett steg sekvenseras runt en generisk mekanism.**
  Symptom: `db pull`/migrations-steget antog ett Postgres-app-schema värt att fånga; empirisk introspektion via fyra oberoende kanaler (`supabase inspect db` table/index/vacuum-stats + PostgREST OpenAPI-rot) visade NOLL app-tabeller — all data bor i Airtable, Postgres bär bara managed Auth. Steget hade sekvenserats runt en generisk "staging-DB sås från migrations"-mekanism som inte gäller denna arkitektur. Marcus "varför?" på det sekvenserade steget tvingade fram introspektionen. Generaliserbar regel: innan ett förarbets-steg byggs runt en bransch-generisk mekanism (migrations, schema-dump, ORM-sync), verifiera empiriskt att den lokala arkitekturen faktiskt har det tillstånd mekanismen förutsätter — annars löser steget ett problem som inte finns. Reinforcerar L110. Källa: 2026-06-13 Session 19, schema-introspektions-pass.

- [UNIVERSAL] **L116 — Installera verktyg när en uppgift kräver dem, inte preventivt; välj det lättaste verktyget som stänger det faktiska gapet.**
  Symptom: schema-introspektionens residual (funktioner/triggers cross-schema) kunde inte SQL-enumereras lokalt — Docker (för `db dump`) och psql saknades. Den billigaste boten var inte att installera en Docker-daemon utan en Supabase-PAT mot Management-API:t (information_schema-SELECT). Fyra read-only-kanaler räckte ändå för slutsatsen. Generaliserbar regel: när ett verktyg saknas, fråga "vad är det lättaste som stänger DETTA gap?" före tung infra-installation — ofta finns en API-/CLI-väg som undviker daemon/runtime helt. Källa: 2026-06-13 Session 19, schema-introspektions-pass.

- **L117 [Chat-self-review] — Verifiera att en föreslagen secret/config-punkt faktiskt LÄSES innan den läggs till; oläst CI-secret = vilseledande konsistens-teater.**
  Symptom: Chat-prompten antog att `AIRTABLE_BASE_ID` skulle in i `.env.test.example` + `ci.yml`, men steg-4-research visade att testerna kör EF-koden över HTTP (deployade EF:er), aldrig lokalt — ingen testväg läser secreten, och `AIRTABLE_TOKEN` (samma klass) finns inte heller där. Att lägga till den hade skapat en GitHub-secret som CI aldrig läser. Generaliserbar regel: innan en secret/env/config-punkt läggs till en pipeline, spåra att någon kod-väg faktiskt LÄSER den i den kontexten; annars är tillägget konsistens-teater som vilseleder framtida läsare. Code:s steg-4-research fångade det (extern fångst > self-review). Källa: 2026-06-13 Session 19, förarbete steg 1.

- [UNIVERSAL] **L118 — Airtable-miljö-isolering kommer från distinkt bas-ID + env-driven config, INTE från workspace-separation.**
  Symptom: ett alternativ var en separat staging-workspace, men Airtable Team-plan prissätts per-workspace → separat staging-workspace = onödig andra prenumeration. Olika bas-ID i samma workspace ger den isolering som faktiskt spelar roll (skilda data, skild access via PAT-scope), styrt av env-driven `AIRTABLE_BASE_ID`. Generaliserbar regel: isolera på den axel som bär den faktiska gränsen (bas-ID + credential-scope), inte på en dyrare organisatorisk axel (workspace/org) som inte tillför isolering men dubblerar kostnad. Källa: 2026-06-13 Session 19, Marcus miljö-moment + ADR-050.

- [UNIVERSAL] **L119 — En lifecycle-verb-uppsättning med en asymmetrisk axel (läs utan skriv, eller tvärtom) är en latent drift-källa: den saknade riktningen tvingas uttryckas via fel verb.** session-resume fanns som LÄS-sidan av kontinuitets-axeln men saknade sin SKRIV-motpart (paus). Utan paus ramades oavslutade sessioner in mot nästa-session-N+1-fortsättning via session-end — ett completion-verb för en icke-completion — vilket gav premature-close-drift och tvetydig återupptagning (fortsätter N eller startar N+1?). Generaliserbart: när du designar ett verb-par (start/end, resume/paus), verifiera att BÅDA riktningarna av varje axel är inkodade; en halv axel fylls annars av närmaste grannverb och bär dess semantik som b-effekt. Research namnger haveriet (premature completion) och mönstret (context reset + strukturerad handoff, skilt från completion). Fix: ADR-051 (paus som fjärde verb, skriv-motpart till resume).

## 2026-06-14 — Session 20 (lifecycle-fält + systemkonsolidering)

Process-fundament-session (ingen byggfas): byggde `lifecycle:`-fältet (enum
active/paused/closed) ortogonalt mot `status:`, i sex inkrement — ADR-052 →
lifecycle-grind + 9-test-svit → skill-ägarskap (paus/resume/end) →
create-session-doc-födelse → applicering på dok 18/19/20 → PI-bas-pekare. Fältet
gör sessions-/fas-tillstånd O(1)-läsbart i frontmatter i stället för ad-hoc-prosa.

### L120 [UNIVERSAL] — Single-source rubrik-lås: grind-regex ↔ producerande skill ↔ testsvit-fixtur

Datum: 2026-06-14 | Källa: Session 20 inkr 3a→3b (klass: grind/skill-konsistens)

När en grind validerar genom att nyckla på en sträng-form (regex mot en rubrik/markör),
måste den skill som PRODUCERAR strängen och testsvitens fixtur låsas mot exakt samma
form. Tre ytor, en sanning. Driftar de isär uppstår en latent grind-fälla (skillen
skriver en form grinden inte känner igen → falsk röd, eller tvärtom). Disciplin: när du
bygger en sträng-nycklande grind, gör samma sträng till single source som skillen citerar
och testet fixturerar. Empiri: lifecycle-grindens ^## PAUSLÄGE — Session N pausad var
ad-hoc i session-19-doket, oprescriberad i paus-skillen — driften fångad och stängd (inkr 3a→3b).

### L121 [UNIVERSAL] — En prefix-förankrad tillstånds-markör BRYTS vid övergång, appendas inte

Datum: 2026-06-14 | Källa: Session 20 inkr 3b (klass: tillstånds-modellering)

En rubrik/markör som signalerar tillstånd ("är pausat nu") och valideras av en
prefix-förankrad regex kan inte neutraliseras genom att APPENDA text — prefixet matchar
ändå. Tillstånds-övergången måste BRYTA prefixet (omvandla formen), inte lägga till efter
den. Empiri: resume omvandlar ## PAUSLÄGE — Session N pausad → ## Paushistorik — Session N
(pausad…, återupptagen…); ett appenderat "(återupptagen)" hade lämnat prefixet matchande
→ grinden hade fällt det återupptagna doket (T6). En tillstånds-markör muteras vid
övergång; händelsen bevaras separat i prosa (öppen historik, ej tyst radering).

### L122 [UNIVERSAL] — Pasted-instruktion vs disk-instruktion är en latent drift-källa; designa mot disk

Datum: 2026-06-14 | Källa: Session 20 inkr 6 (klass: projektion ≠ live-HEAD)

När en instruktions-yta projiceras manuellt (claude.ai Project Instructions klistras in
från en repo-fil) och re-paste är ett deferrat moment, är den synliga instruktionen ≠
disk-sanningen tills projektionen uppdateras. Edits mot den ytan måste designas mot
DISK-versionen (verifierad av Code), aldrig mot den potentiellt stale projektionen Chat
råkar se. Speglar L18/projektkunskap-färskhet, tillämpad på instruktions-ytan själv.
Empiri: PI-basen i projektrutan saknade /session-paus; disk-basen (post-87acfdd) hade den
— editsen designades mot disk-rapporten (inkr 6).

### L123 [UNIVERSAL] — Verifiera-sedan-edit mot fler-versioner-i-spel: återge OLD från disk, formulera ej ur minnet

Datum: 2026-06-14 | Källa: Session 20 inkr 6 (klass: edit-disciplin)

En str_replace-OLD formulerad ur minnet/projektion kan missa disk-realiteter (t.ex. en
radbrytning där minnet antog blanksteg). När en mall existerar i flera former (radbruten
vs enradig, olika whitespace), MÅSTE OLD återges från faktisk disk före edit. Code:s
vägran-att-gissa + STOPPA är rätt respons, inte en reflow på eget bevåg. Empiri: inkr
6:s enradiga OLD missade disk-radbrytningen start⏎och end; Code stoppade, väg A löste det.
Specialisering av L31 (verifiera repo-egenskaper per prompt) på edit-OLD-matchning.

### L124 [UNIVERSAL] — Ett ortogonalt tillstånds-fält avslöjar implicit axel-sammanblandning i sin egen styr-dokumentation

Datum: 2026-06-14 | Källa: Session 20 inkr 5 + avslut (klass: tillstånds-modellering / system-läsbarhet)

När ett fält tvingar isär två tidigare implicita axlar (här: sessions-axeln closed/paused
vs fas-axeln pågående/klar), exponerar det sammanblandningar som tidigare gömdes i lös
prosa. "Resume session 18" var fas-återupptagning förklädd till sessions-resume — synlig
som fel först när 18 fick lifecycle: closed (en closed session resume:as inte; fasen
fortsätter via en NY session/start). Ett ortogonalitets-fält fångar sin egen styr-dok:s
axel-fel första gången det möter ett skarpt fall. Empiri: scope-fröet var internt
motsägande (klassade 18 closed MEN sa "resume 18") — fältet gjorde motsägelsen läsbar.

### L125 [UNIVERSAL] — En karaktärisering av disk-tillstånd ärver verifieringsplikten; en fix på en overifierad flagg kan vara värre än ingen fix

Datum: 2026-06-14 | Källa: Session 20 konsistensfix-STOPPA (klass: verifierings-disciplin / flagg-arv)

När en aktör — Code-transparens, Chat-flagg, Marcus-observation — karaktäriserar
disk-tillstånd ("filen är bullet-formaterad", "X saknas", "Y är konventionen") är den
karaktäriseringen ett PÅSTÅENDE, inte verifierad sanning — även när den kommer från den
aktör som normalt är ground-truth för domänen (Code för disk). Att ärva en sådan flagg
som PREMISS för en åtgärd utan att verifiera flaggen mot disk riskerar en fix som inför
ett fel: är flaggen fel riktar fixen mot fel mål. En flagg som ska MOTIVERA en edit måste
disk-verifieras med samma stränghet som edit:en själv — bygg verifiering i flaggen, inte
bara i edit:en. Empiri: en avslutsflagg ("lessons-filen är bullet-konvention, L1–L119")
byggde på svans-inspektion (L112–L119, lokalt bullets) generaliserad till hela filen;
helfils-verifiering visade 107 ### : 17 bullets — ### är dominerande/ursprunglig, bullets
(L103–L119) är driften. Flaggen ärvdes och en "miss" ägdes som inte fanns; den föreslagna
fixen hade bulletat redan-konventionsenliga lessons och tappat klass-fältet. Fångad av att
fix-prompten krävde disk-verifiering (återge föregångare + file-mixedness + content-loss-
STOPPA) FÖRE edit. Syskon till L31/L123: dessa verifierar edit-INPUTS mot disk; L125 utökar
plikten till den DIAGNOS som motiverar åtgärden. Ground-truth-status gör en aktörs
karaktäriseringar mer trovärdiga, inte immuna.

## 2026-06-14 — Session 21 (tråd-arkitektur: forensisk läsbarhet + triage)

Process-fundament-session (ingen byggfas): byggde tråd-arkitekturen (ADR-053) i fem
inkrement — ADR-053 → tråd-register `tasks/threads/` + T01-dogfood-migration →
lifecycle-grind-utvidgning till tråd-kort + CI-täckning → alltid-på triage-mikroregel
(två ytor) → konventions-formalisering (`[T<NN>]`-tagg + Tråd:-rad + tråd:-fält).
Tråden blir förstaklass-organisationsenhet parallell med sessionen; det oväntade får
ett inkodat hem. L126–L129 är hub-lyft-kandidater (lyfts via lessons-hub-sync senare).

### L126 [UNIVERSAL] — git rename-bevarande och fullständigt innehållsbyte är oförenliga i samma commit

Datum: 2026-06-14 | Källa: Session 21 K2 (klass: git-mekanik/historik-bevarande)

Git lagrar inte renames — de DETEKTERAS vid diff-tid via innehålls-similarity. En
`git mv` följd av fullständigt innehållsbyte i SAMMA commit sjunker under
similarity-tröskeln (empiriskt D+A även vid `-M10%`) → `git log --follow` tappar
historiken. Migrera-och-transformera måste därför delas i TVÅ commits: ren rename
(R100, original-blob) → transform. Förfining: en IDE-linter kan mutera filen vid
skrivning, så en byte-exakt rename kräver `git mv` (inte `git show > fil` + `git add`,
vars staged blob blir linter-muterad) och commit FÖRE working-tree re-stageas. Verifiera
historiken med `git log --follow` mot födelse-committen, anta den inte.

### L127 [UNIVERSAL] — CI-täckning är per-glob; en ny dok-katalog är osynlig för varje grind vars glob ej uppdaterats

Datum: 2026-06-14 | Källa: Session 21 K3+K4 (klass: grind-täckning/glob-disciplin)

När en ny dok-katalog tillkommer är den osynlig för varje grind vars glob/scope inte
explicit utvidgas — och grindar delar inte glob, så en katalog kräver att ALLA relevanta
globbar utvidgas samtidigt, inte bara en. Disciplin: vid ny katalog, inventera SAMTLIGA
grindar (lint, länk, prosa, konsistens, frontmatter, trigger) och avgör täckning per
grind mot faktisk config — gissa inte. Empiriskt bevisad två gånger samma session:
`tasks/threads/` (K3 — markdownlint + lychee + check-lifecycle behövde edit; Vale +
docs_changed-trigger täckte redan via rekursion/`**`) och `project-instructions/`
(K4 → deferrad som T02). Att samma felklass dök upp två gånger är stark generalisering.

### L128 [UNIVERSAL] — olika dok-typer har olika drift-ytor; porta inte konsistens-mekanismen — identifiera typens egen drift-dimension

Datum: 2026-06-14 | Källa: Session 21 K3 (klass: konsistens-modellering)

En konsistens-grind nycklar mot en dok-typs specifika drift-yta. När grinden utvidgas
till en NY dok-typ, porta inte den gamla mekanismen rakt av — identifiera den nya typens
egen drift-dimension. Empiri: sessioner driftar fält↔KROPP (lifecycle vs förankrad
PAUSLÄGE-rubrik), så sessions-vakten nycklar mot den rubriken. Tråd-kort har ingen
prosa-tillståndsmarkör; deras drift-yta är fält↔INDEX (kortets lifecycle vs dess
index-rad). Sessions-ankaret portades därför MEDVETET INTE till trådar (dokumenterat i
koden som kategori-skillnad, ej glömd kontroll); tråd-vakten fick en egen fält↔index-check.

### L129 [UNIVERSAL] — en konsistens-grind ska vara passiv (detektera + fäll), aldrig aktiv (auto-rätta) på verbatim-dok

Datum: 2026-06-14 | Källa: Session 21 K3 (klass: grind-design)

En konsistens-grind som upptäcker drift ska FÄLLA (STOPPA-signal för människa), aldrig
auto-rätta. På verbatim-/människo-ägda dok är auto-rättning farlig: grinden kan inte veta
vilken sida av driften som är sann (kortets fält eller index-raden), och en tyst
"rättning" mot fel sida inför ett fel i stället för att flagga det. Passiv detektering
bevarar människans/Marcus beslut om vilken sida som korrigeras. Empiri: tråd-vaktens
fält↔index-check fäller med actionable fix-text men ändrar aldrig dok.

### L130 — dogfood: triage-regeln fångade ett oväntat utanför-scope-fynd och defererade det durabelt på sitt första skarpa prov

Datum: 2026-06-14 | Källa: Session 21 K5 (klass: process-validering)

K4:s alltid-på triage-mikroregel fick sitt första skarpa test omedelbart: ett oväntat
utanför-scope-fynd (project-instructions/ ligger utanför alla CI-grind-globbar) uppstod
mitt i bygget. I stället för att hanteras ad-hoc i fel tråd klassades det (blockerar ej +
värdefullt) och defererades till tråd-registret som T02 (paused index-rad utan kort).
Process-validering att det oväntade nu får ett durabelt, navigerbart hem — det andra
dogfood-beviset (det första: T01-frö-migrationen som föder registret med sin egen
skapelse-tråd). Tråden bevisar sin egen tes.

### L131 — dogfood #3 + evidens för gap-tesen: triage fångade Session 20:s BUILD-LOG-glapp

Datum: 2026-06-14 | Källa: Session 21 K-sista (klass: process-validering/disk-forensik)

K-sista-skörden avtäckte ett tredje oväntat fynd: Session 20 saknar post i `docs/BUILD-LOG.md`
trots att den stängdes (`lifecycle: closed`, do-confirm) — BUILD-LOG är en session-end killer
item (ADR-051 beslut 3), så avslutet har ett glapp. Triage-regeln (K4) klassade det (blockerar
ej + värdefullt) och defererade det till registret som **T03** (Session 20 BUILD-LOG-backfill)
i stället för ad-hoc-backfill mitt i en annan sessions K-sista. Tre dogfood-bevis samma session
(T01-födelse, T02-defer, T03-defer). Fyndet är dessutom EVIDENS för seed:ets gap-2-tes: paus/end-
BUILD-LOG-disciplinen har ett verkligt glapp — vilket stärker att tråd-indexet, som svarar "var i
tidslinjen är vi nu, inklusive hål", var rätt lösning. Hålet görs synligt där det finns (not i
Session 21:s BUILD-LOG-post med pekare till T03), ej tyst.

## 2026-06-15 — Session 19 (resume — staging-färdigställande)

### L132 [UNIVERSAL] — Ett förkravs-/verifieringssteg byggt runt ett redan-etablerat faktum löser ett icke-existerande problem

Symptom: Resume-19 reste två läs-/STOPP-pass mot redan fastställda fakta — (a) migrations re-litigerades trots L115:s fyra-kanals-introspektion (noll app-tabeller); (b) ett Airtable-schema-mini-läspass mot ett schema redan känt via prod-duplicering (ADR-050 beslut 2) + bygg-steg 3:s T4-schemacheck. Varje förbrukade en runda på att verifiera det disk/lessons redan bevisat. Regel: innan ett verifierings-/förkravssteg läggs in, kontrollera om det som steget verifierar redan är etablerat (tidigare lesson, dokumenterat beslut, arkitektur-faktum) — annars löser steget ett icke-problem. Generaliserar [[L115]]. Källa: 2026-06-15 Session 19 (resume).

### L133 [UNIVERSAL] — "Stängt i Chat-analys" ≠ "stängt i externminnet"; bara committad artefakt är durabel

Symptom: Chat deklarerade prod-secret-carryn (AIRTABLE_BASE_ID) "stängd" i resonemang flera pass innan värdet nådde todo:n; Code fångade en känt-falsk "ej satt"-rad mot disk. Stängningen levde bara i efemär Chat-trail. Regel: ett tillstånds-byte som bara uttrycks i Chat-analys finns inte förrän skrivet till durabel artefakt (todo/sessionsdok/BUILD-LOG); behandla Chat-"klart/löst" som ogiltigt tills committat. Reinforcerar [[L67]]/[[L69]]. Källa: 2026-06-15 Session 19 (resume).

### L134 [UNIVERSAL] — Skilj konto-nivå-åtgärder (endast människan) från API-nivå-åtgärder (agenten med token); default:a ej människan till arbete agenten bemyndigats för

Symptom: Chat default:ade upprepat "Marcus gör Airtable-grejer" (seed) från att TIDIGARE uppgifter (skapa bas, skapa PAT) krävde människan — men de var konto-nivå. En record-insert med befintlig token är API-nivå, görs av Code. Marcus fångade det. Regel: klassa varje åtgärd konto-nivå (skapa konto/bas/token/dashboard-config) vs API-nivå (skapa/läs/skriv records med befintlig token); överför ej ett människo-steg till ett API-steg agenten kan göra. Källa: 2026-06-15 Session 19 (resume).

### L135 [UNIVERSAL] — En isolerad miljö agentens tooling ej når direkt (bara via app-lagret) är halv-provisionerad; verifiera tooling-access symmetriskt med prod

Symptom: Staging-Airtable nåddes av deployade EF:er (secret-token) men EJ av Code:s Airtable-MCP (prod-scopead) → blockerade direkt schema-läsning/seed/felsökning. Marcus fångade "en staging-bas Code ej når = halv staging-miljö". Löst via utökat token-scope (symmetrisk access). Regel: vid miljö-provisionering, verifiera att agentens DIREKTA tooling (MCP/token-scope) når miljön symmetriskt med prod — ej bara app-lagret. Källa: 2026-06-15 Session 19 (resume).

### L136 [UNIVERSAL] — En regel kalibrerad för en feltyp över-applicerar på en annan om bokstaven följs; följ rationalen, riv bokstaven öppet

Symptom: ADR-028 §2 (full lock-regen) är en MALWARE-PURGE-mekanism; på en icke-malware dev-server-advisory (fx2h) gav den noll säkerhetsvärde + drog in 140 orelaterade bumpar (biome 2.5.0 bröt CI). Kirurgisk bump (trogen §2:s intent) löste det. Regel: när en regels bokstav importerar kostnad utan nytta i ett fall den ej kalibrerades för, följ rationalen och avvik öppet/kvitterat (ej tyst) + kodifiera distinktionen. Captured: T07 + ADR-028 ## Updates 2026-06-15. Källa: 2026-06-15 Session 19 (resume).

## 2026-06-17 — Session 22 (Fas 5.5 K2 — klient-UI write-slice + landningar)

### L137 — markdownlint-cli2 hör till pre-push-grindsviten vid docs-ändringar

Symptom: Landning 2:s foundation-push gick rött i CI på markdownlint MD028 (blank-rad inuti blockquote — två intilliggande blockquotes i ADR-016) — en grind som en lokal körning hade fångat, men som inte ingick i den lokala pre-push-sviten. En andra CI-cykel + fix-commit krävdes. Regel: vid docs-ändringar (`.md`) ingår `npx markdownlint-cli2 <filer>` i den lokala pre-push-sviten bredvid tsc/biome/vale/lychee/frontmatter — CI:s "Docs link check"-jobb kör både lychee OCH markdownlint, så lokal lychee-grön är inte tillräckligt. [Arbetsflöde]. Källa: 2026-06-17 Session 22 Landning 2 (CI-run 27706634831 röd → fix `bfc6cf1`).

### L138 [UNIVERSAL] — `role="alert"` är redan implicit `aria-live="assertive"`; stapla aldrig en separat assertiv announcer ovanpå samma fel-text

Symptom: K2-prompten specificerade BÅDE MessageBox `role="alert"` (prompt D) OCH `alertScreenReader(feltext, { assertive: true })` (prompt F) för samma fel — vilket ger dubbel assertiv uppläsning (role=alert ÄR en implicit aria-live=assertive-region). Löst: fel surfas via MessageBox `role="alert"` enbart (en assertiv yta räcker); `alertScreenReader` reserveras för den lyckade status-flippen, som saknar visuell indikator och därför behöver en announcer. Regel: en fel-yta med `role="alert"` (eller `aria-live="assertive"`) ska aldrig dubbleras med en separat assertiv announcer av samma innehåll; ett utfall utan egen visuell yta (t.ex. en lyckad optimistisk flip) är däremot just var en explicit announcer behövs. Kategori: A11y. Källa: 2026-06-17 Session 22 K2.

### L139 [UNIVERSAL] — Chat-prompter ska be Code verifiera exakta fil-sökvägar mot disk (index ≠ byggd struktur; ADR-kodexempel kan vara drift)

Symptom: Tre gånger under Session 22 pekade prompten/dokumenten på en sökväg/symbol som inte matchade disken: `field-allowlists.ts` antogs i `src/` men låg i `supabase/functions/_shared/`; hook-kommentaren pekades till `dataSource.ts` men hooken bor i `useDataSource.ts`; ADR-016:s kodexempel använde `executeOperation(...)` men det faktiska adapter-API:t är `updateRecord(...)`. Varje fångades av att Code verifierade mot disk i LÄS-passet i stället för att bygga på det antagna. Regel: Chat-prompter ska kräva att Code VERIFIERAR exakta fil-sökvägar, symbolnamn och API-signaturer mot faktisk disk (grep/läs) före användning — ett index, en byggplan-fillista eller ett ADR-kodexempel kan vara drift mot den byggda strukturen. Kategori: Arbetsflöde. Källa: 2026-06-17 Session 22 (LÄS-passets fångster).

## 2026-06-18–19 — Session 23 (Fas 6a Persons-domän: cursor-port → Anteckningar-write, Fas 6a KLAR)

### L140 — Permanent syntetisk conformance-fixtur seedas via skrivbara käll-fält, inte härledda formelfält; verifiera fält-skrivbarhet mot data-model FÖRE fixtur-design

Symptom: Landning 4 steg 3:s seed-prompt instruerade `create_record` med `Namn` satt direkt — men Personer-tabellens `Namn` är ett **formelfält** (`TRIM(Förnamn & " " & Efternamn)`), ej skrivbart; ett direkt write hade 422:at. FAS A:s de-risk-pass (schema-läsning före write) fångade det → väg A: seeda via de skrivbara käll-fälten `Förnamn`/`Efternamn`, låt basen beräkna `Namn`. Identiskt observerbart utfall, isolering + sort-ordning intakt. Regel: innan en conformance-/test-fixtur designas mot en datakälla, verifiera varje måls-fälts skrivbarhet (formel/rollup/lookup = ej skrivbart) mot schema/data-model FÖRST; seeda derivat-värden via deras käll-fält. En permanent syntetisk fixtur (namngiven, ingen PII) är en operativ följd av ADR-056:s kanoniska kontrakts-harness — den bor durabelt i staging och städas ej. Kategori: Test/Data. Källa: 2026-06-18 Session 23 Landning 4 (FAS A de-risk-fångst).

Tråd-kandidat (ej registrerad än): pageSize-klamp-boundary `>100` (EF klampar till `MAX_PAGE_SIZE=100`) kan inte bevisas av den lilla 5-records-fixturen — verifieras lämpligen av en isolerad Deno-enhetstest i CI snarare än ännu fler staging-records.

### L141 — Env-överridbar gräns-parameter = testbarhets-mönster för att bevisa chunk-/sid-gräns med liten fixtur; skarp conformance avslöjar det mock inte kan

Symptom: get-person:s noll-trunkering (chunk-merge över Deltaganden-batchen) kunde inte bevisas av en liten fixtur så länge `HISTORY_BATCH_SIZE` var hårdkodad 50 — 3 records ryms i en chunk och chunk-gräns-vägen exerceras aldrig. Lösning: gör gräns-parametern env-överridbar (default = prod-beteende; staging-secret `=2`), så en 3-records-fixtur tvingar fram merge (2+1) och bevisar att den 3:e aldrig tappas. Dessutom: den SKARPA conformance-körningen (ej mock) avslöjade två buggar mock dolde — Airtable returnerar `403 INVALID_PERMISSIONS_OR_MODEL_NOT_FOUND` (ej 404) för okänt record-ID, och record-endpointen levererar tomma rollups som `[]` (list-endpointen utelämnar dem). Regel: (a) för att bevisa en gräns-/paginerings-väg med liten fixtur, gör gränsen env-överridbar (testbarhet utan prod-påverkan; 6b/6c-arv); (b) kör conformance mot SKARP datakälla, inte bara mock — mock speglar dina antaganden, skarp data speglar verkligheten (403≠404, rollup-array-form). Kategori: Test/EF. Källa: 2026-06-19 Session 23 Landning 5b (3 conformance-fall rött → fix → grönt).

### L142 [UNIVERSAL] — En fixtur som lämnar närliggande fält tomma kan dölja en bugg i precis de fälten; fixturer ska populera VARJE fält operationen rör

Symptom: L5b:s conformance-fixtur (ZZ-History-personen) bevisade noll-trunkering men hade tom `Ort` och inga hämtningar — exakt de fält där L5b-fixen (`firstString`) tyst tappade data. Conformance gick grön medan en data-förlust-regression låg aktiv i deployad kod, osynlig tills en fixtur med MULTI-värd ort skapades (2 anmälningar i olika orter → `Ort=['ZZ-Skövde','ZZ-Göteborg']`). Regel: en fixtur som ska bevisa en operation måste populera VARJE fält operationen läser/mappar — särskilt fält vars coercion/aggregering är icke-trivial (rollup/lookup/fler-värt). Ett tomt fält bevisar bara tom-vägen; "grön conformance" mot en gles fixtur är falsk trygghet för de tomma fälten. Kategori: Test/Data. Källa: 2026-06-19 Session 23 ("Ort"-klassen — L5b-fixturen dolde data-förlusten).

### L143 [UNIVERSAL] — Gräns-coercion namnges efter ARITET (scalarString/stringArray), aldrig en tyst-droppande generisk "first"; ett fler-värt fält får aldrig tappa data

Symptom: en generisk `firstString`-hjälpare (array → första elementet) applicerades på fält oavsett aritet — harmlös på 1→1-lookups, men tyst data-förlust på genuint fler-värda rollups (`Ort` över många anmälningar, `Alla hämtningar` över många touchpoints). Den generiska namngivningen dolde aritets-skillnaden vid anropsstället. Lösning: namnge coercion efter fältets aritet så avsikten syns i anropet — `scalarString` (skalärt; >1 element = data-form-avvikelse → logga, aldrig tyst svälj) vs `stringArray` (fler-värt → bevara ALLA). Regel: vid gräns-coercion (extern datakälla → domän), välj funktion efter fältets aritet, inte efter "vad som råkar funka"; en fler-värd-bevarande funktion är default vid minsta osäkerhet — att tappa data är värre än en array med ett element. Kanonisk delad coercion (en källa) framför inline-dubbletter. Kategori: Arkitektur/Data. Källa: 2026-06-19 Session 23 ("Ort"-klassen, kanonisk `_shared/coerce`).

### L144 [UNIVERSAL] — Rika/happy-path-mocks döljer empty-state-/edge-case-buggar; a11y- och beteende-svitar måste exercera glesa/null-fixturer

Symptom: ett axe-test med rikt mock (alla fält ifyllda) passerade grönt medan en a11y-strukturbugg låg dold — empty-state-`<p>` som direkt barn i `<dl>` (axe `definition-list`/`only-dlitems`) i de villkorade tom-grenarna. Buggen renderades bara när fälten var tomma, vilket happy-path-mocket aldrig triggade; den avslöjades först av en annan vys glesa mock (många null-fält). Lösning: a11y- OCH beteende-svitar måste medvetet köra GLESA/null-fixturer, inte bara fyllda — varje villkorad empty-state är en egen renderingsväg som behöver sin egen täckning. Invers-komplement till L142 (en fixtur som lämnar närliggande fält tomma kan dölja en bugg i precis de fälten): L142 säger populera VARJE fält operationen rör; L144 säger exercera även den TOMMA vägen. Tillsammans: testa både full och gles fixtur. Regel: för varje villkorad gren (data finns / data saknas), ha en fixtur som når den. Kategori: Testning/A11y. Källa: 2026-06-19 Session 23 (L6c — L5a `<p>`-i-`<dl>`-bugg dold av rikt person-detail-mock, avslöjad av L6c:s glesa mock; gles-axe-test adderat som permanent täckning).

### L145 [UNIVERSAL] — Deploy-grind utanför CI tvingar källa-först commit-ordning

Symptom: en staging-svit (deny/allow för en ny write-operation) kan inte bli CI-grön förrän den manuella out-of-CI-redeployen av Edge Function körts — CI har inget deploy-steg (ADR-049 Öppen tråd 1). Att bunta grind-beroende arbete (testerna) med dess källa (operations-registret) i en commit gör den committen RÖD tills det manuella steget körts. Lösning: dela på arkitektur-/grind-gränsen — källa-först (vilande, CI-grön: opåverkar befintliga tester) → manuellt out-of-CI-steg (redeploy) → grind-sen (testerna, nu nåbara mot den redeployade miljön). Regel: när en grind beror på ett miljö-tillstånd som CI inte själv etablerar, committa källan separat FÖRE grinden och kör mellansteget mellan dem; bunta aldrig en grind med arbete den ännu inte kan verifiera. Kategori: Process/CI. Källa: 2026-06-19 Session 23 (L6a server-op → redeploy update-record v4→v5 → L6b staging-svit).

### L146 [UNIVERSAL] — Beteendemässig test-isolation slår schema-isolation vid samtidighets-bedömning

Symptom: frågan "kan ett muterande test (write→läs→restore mot en delad fixtur) köra parallellt med ett läsande conformance-test utan interferens?" besvarades först via schema-medlemskap (ligger fältet i list- vs detalj-schemat?). Det är fel axel: schema-medlemskap isolerar inte — ett parallellt test som PARSAR hela schemat men inte ASSERTERAR det muterade fältets värde påverkas aldrig av mutationen. Lösning: bedöm isolation beteendemässigt — grep alla samtidiga tester efter assertions på det muterade fältet; noll assertions = rent oavsett schema-form. Regel: vid samtidighets-/interferens-bedömning, verifiera vad tester ASSERTERAR, inte vad de råkar deserialisera. Kategori: Testning. Källa: 2026-06-19 Session 23 (L6b allow-test — `anteckningar` ∈ både Person- och PersonDetail-schemat, men noll anteckningar-assertions i `*.staging.test` → write/restore rent mot parallell get-person-conformance).

### L147 [UNIVERSAL] — CI-grindar kan överstiga DoD-kommandolistan; kör den faktiska grind-uppsättningen lokalt på den rörda fil-klassen

Symptom: en docs-only-commit passerade alla DoD-kommandon (typecheck/biome/build/test) lokalt men föll i CI på markdownlint (MD004/MD032 — radbrutet "+ " tolkat som list-item). DoD-listan i CLAUDE.md ("Bygg, testa, linta") täcker kod-grindarna men inte alla docs-grindar (markdownlint, vale, frontmatter, lifecycle, link-check). Lösning: identifiera den fil-KLASS en commit rör (kod / docs / config) och kör den klassens FAKTISKA CI-grindar lokalt före push — inte bara den generiska DoD-listan. För docs: markdownlint-cli2 + vale + frontmatter/lifecycle-skripten. Regel: matcha lokal pre-push-verifiering mot den rörda fil-klassens CI-grindar, inte mot en fast kommandolista. Kategori: Process/CI. Källa: 2026-06-19 Session 23 (docs-commit `9c9c671` → markdownlint-fix `e1034ee`).

### L148 [UNIVERSAL] — Chat-direktiv som presumerar en exekverings-miljö Code saknar är en latent defekt; STOPPA fångar den vid gränsen

Symptom: ett direktiv förutsatte att L6b kunde "bevisas lokalt mot staging" — men de enda lokala staging-test-credsen (`.env.test`) pekade på PROD, så en lokal körning hade muterat prod. Direktivets miljö-antagande (lokal staging-åtkomst finns) höll inte mot disk-verkligheten. Detta är en distinkt defekt-klass från L19 (extern fångst slår intern självkontroll, [[L19]] — VEM som fångar): här handlar det om VAD som brister — ett direktiv kodar ett antagande om exekverings-miljön som mottagaren måste verifiera, inte anta. Lösning: STOPPA-OCH-FRÅGA är den fångande mekanismen — verifiera miljö-antaganden (cred-mål, deploy-ref, åtkomst) mot faktiskt tillstånd FÖRE exekvering; vid avvikelse, eskalera väg-beslut (väg B: CI:s isolerade secrets blev bevis-harnesset i stället). Registrera den latenta foot-gunen durabelt (T12). Regel: behandla varje miljö-presumtion i ett direktiv som en hypotes att verifiera mot disk, aldrig som ett faktum. Kategori: Process/Säkerhet. Källa: 2026-06-19 Session 23 (`.env.test`→prod-fyndet vid L6b-grinden; väg B + T12). Föreslagen som eget nummer (distinkt axel mot L19) — Marcus kan folda till L19 om han föredrar.

## 2026-06-20 — Session 24 (Institutionalisera kvalitetsstandard + arkitektur-fitness-audit, hub-nivå)

### L149 [UNIVERSAL] — Docs-grind måste vara ett SEPARAT gate-steg före commit/push, inte batchat i samma kedja

Symptom: ett MD004-fel (radstart-`+` tolkat som list-item) slank förbi till CI och gjorde main kort röd (Inc 3b, `21601a8`→forward-fix `86e16be`) — TROTS att markdownlint kördes. Orsaken var inte att grinden saknades (jfr [[L147]]) utan att grind + commit + push låg i EN `&&`-kedja där grind-utfallet (`| tail`) blev INFORMATIVT, inte STOPPANDE: `git commit` beror inte på grindens exit, så kedjan committade och pushade trots "1 error". Samma MD004-klass fångades däremot i Inc 2 — skillnaden var att grinden där kördes som ett separat steg FÖRE commit. Lösning: kör docs-grind som ett eget gate-steg, läs utfallet (0 errors) och committa/pusha FÖRST därefter — aldrig batcha grind+commit+push så att lint-utfallet inte kan stoppa pushen. Pre-commit-hooken gatar bara frontmatter, ej markdownlint, så markdownlint måste gatas manuellt. Regel: en verifiering som inte kan STOPPA nästa steg är ingen grind, bara en utskrift; separera gate från handling. Kategori: Process/CI. Relaterad: [[L147]] (kör rätt grindar) + [[L137]] (markdownlint hör till pre-push) — L149 adresserar HUR de körs (gate, ej batch). Källa: 2026-06-20 Session 24 Inc 3b.

### L150 [UNIVERSAL] — En arkitektur-fitness-/lint-check måste koda arkitekturens FAKTISKA distinktioner, inte substräng-matcha; falska positiv eroderar checkens värde

Symptom: `arch-fitness-check.sh` (Inc 3a) flaggade först `AuthProvider`:s import av `supabase`-auth-klienten + `create-admin-user` som lager-oberoende-kringgångar — falska positiv. Orsaken var bred substräng-match (`config/supabase-client`) som inte skilde legitim åtkomst (auth-klienten är en SEPARAT axel, auth ≠ domän-data per ADR-037) från faktisk överträdelse (UI som kallar `callEdgeFunction` förbi datalagret). Lösning: kalibrera checken mot arkitekturens verkliga gränser — matcha `callEdgeFunction`-import-rader specifikt; behandla auth-klienten som tillåten. Regel: en fitness-/lint-check som tjuter varg (falska positiv) är värre än ingen — den lär mottagaren att ignorera den; koda distinktionen mellan legitim och överträdande mönster, inte den bekväma substrängen. Kategori: Arkitektur/Verktyg. Relaterad: [[L136]] (följ rationalen, inte bokstaven). Källa: 2026-06-20 Session 24 Inc 3a (arch-audit fitness-skript-kalibrering).

## 2026-06-20 — Session 25 (Inc 4 kall arch-audit mot Fas 6a + Fas 6b Events-domän)

### L151 [UNIVERSAL] — Ett fast mekaniskt audit-kontrakt eliminerar fritext-drift-klassen

Symptom: Session 23:s ad hoc-6a-audit räknade fritext "14 metoder" där disken bar 15 (iface + båda adaptrar). En arkitektur-audit utan fast kontrakt mäter mot omdöme-i-stunden (empiriskt ~9% fångst) och driftar — räkningen blir en lös siffra i pausdok, inte en verifierbar mätning. Inc 4:s kalla `/arch-audit` ([[L150]]-skriptet, ADR-058) räknade iface-metoder mekaniskt + jämförde per adapter (15==15==15) → "14" avslöjat som ett räknefel, inte en verklig drift som åtgärdades efteråt. Regel: en arkitektur-audit utan fast mekaniskt kontrakt mäter mot omdöme och driftar; ett deterministiskt fem-områdes-kontrakt med skript-buren mekanisk kärna (i–iii) + do-confirm-omdöme (iv–v) gör samma drift-klass omöjlig och är repeterbart över körningar. Det fasta kontraktet flyttar fångsten från ~9%-omdöme till deterministisk mätning. Empirisk grund: Inc 4 kall körning 2026-06-20, fem områden rena, dogfood-validerad. Kategori: Arbetsflöde/Audit-mekanism. Relaterad: [[L150]] (checken måste koda faktiska distinktioner) + [[L136]] (följ rationalen, inte bokstaven). Källa: 2026-06-20 Session 25 Inc 4.

### L152 [UNIVERSAL] — Airtable levererar NaN-formelfält som OBJEKT (specialValue); en list-EF-smoke-test som inte .parse():ar skarp data döljer klassen latent

Symptom: Fas 6b L2:s get-event-conformance mot skarp staging-data avslöjade att `EventSchema.parse` föll — Airtable returnerar formel-/procent-fält som beräknas till NaN/Infinity (0/0, osatt maxPlatser) som OBJEKT `{specialValue:"NaN"}`, INTE som tal. EF-mappningens råa `f[...] ?? null`/`?? 0` släppte objektet rakt genom (objektet är inte null) → `z.number()`-parse avvisade det → ETT sådant event sänkte hela `z.array(EventSchema).parse` → list-laddningen kraschade. Buggen var LATENT i den redan deployade get-events eftersom dess enda conformance var en smoke-test (endpoint svarar 200) som ALDRIG `.parse():ade` riktig data, och L1:s e2e använde mockad data. Samma klass som [[L140]]/"Ort" (Session 23 L5b): Airtable levererar ett fält i en form domänen inte väntar, och coercion måste vara konsekvent över EF:er. Lösning: `scalarNumber` i den aritets-namngivna coerce-familjen (specialValue/icke-ändligt → null; non-nullable-fält: `scalarNumber(v) ?? 0`), applicerad i BÅDA mappningarna (get-event + get-events). Två regler: (1) Airtable-number-fält som är formler MÅSTE coercas (specialValue-klassen), aldrig rå `?? null`; (2) en list-EF vars conformance bara smoke-testar (svarar 200) och aldrig `.parse()`:ar skarp produktionsnära data döljer latenta coercion-klasser — skarp `.parse()`-conformance mot riktig data är det som fångar dem. Kategori: Arkitektur/Gräns-coercion. Relaterad: [[L140]] (samma Airtable-form-klass, "Ort") + [[L142]] (testet måste exercera fältet operationen rör) + [[L139]] (verifiera mot faktisk data, ej anta). Källa: 2026-06-20 Session 25 Fas 6b L2.

### L153 [UNIVERSAL] — buildLinkedRecordFilter matchar länkens primär-display, ej record-ID; enhetstest av formel-syntax bevisar ej match-semantik mot skarp data

Symptom: Fas 6b L3:s get-attendance-conformance mot skarp staging-data returnerade noll rader. Grundorsak (verifierad via direkt formel-test mot prod OCH staging): `buildLinkedRecordFilter('Event', eventId)` ger `FIND(recordId, ARRAYJOIN({Event}))` — men `ARRAYJOIN` av ett LÄNKFÄLT exponerar länkens PRIMÄR-DISPLAY (eventlabel-strängen), inte record-ID → `FIND(recordId, …)` matchar ALDRIG. KLASS-bugg, inte instans: trasigt var helst ett länk-ID-filter byggs — verifierat tomt för BÅDE `Deltaganden.Event` och `Anmälningar.Event`, alltså **latent även i deployade get-registrations** (vars `eventId`-filter saknar staging-test → aldrig kört mot skarp länk-data; smäller i 6c "Anmälda per event"). Sido-fynd: Deltaganden `Event (ID)`-formelfältet (`RECORD_ID({Event})`) ger radens EGNA id, ej eventets (data-model §3.4-claim fel) → inget ID-exakt formelfält att filtrera på. Luckan som dolde det: enhetstesterna (`airtable-filter.test.ts`) verifierar formel-SYNTAX (round-trip-escape, AND-kombinering), aldrig match-SEMANTIK mot riktig data. Regel: ett filter-/formel-bygge måste conformance-testas mot SKARP datakälla, aldrig bara enhetstestas på sin sträng-output — syntax-grön ≠ semantik-korrekt; och record-ID = enda tillförlitliga matchnyckeln mot Airtable-länkar (display/label/formel/lookup är alla sköra: label-formel-släp, Eventkey-substräng-kollision, RECORD_ID-egen-id-fälla). Registrerad som T15 (paused; get-registrations-fix i 6c). Kategori: Arkitektur/Airtable-filter. Relaterad: [[L152]] + [[L140]] (samma "skarp conformance fångar latent EF-klass") + [[L139]] (verifiera mot faktisk data) + [[L142]] (testet måste exercera det operationen rör). Källa: 2026-06-20 Session 25 Fas 6b L3 (conformance rött → root-cause → väg D).

### L154 [UNIVERSAL] — Record-ID-batch från BÅDA hållen av en relation kringgår länk-display-filter-klassen och återanvänder en certifierad mall

Symptom: med [[L153]] bekräftad behövde get-attendance filtrera Deltaganden per event UTAN den trasiga länk-display-helpern. Lösning: spegla get-person:s record-ID-batch men FRÅN EVENT-HÅLLET — `fetchAirtableRecord('Eventplanering', eventId)` → eventradens `Närvaro (records)`-länk (Deltaganden-record-ID:n, live-verifierat populerat + symmetriskt med `Deltaganden.Event`) → chunkad `OR(RECORD_ID()=…)`-batch (env-styrd storlek, ceil(N/50), noll N+1/trunkering). Samma mall som get-person bär ÅT ANDRA HÅLLET (person → dess Deltaganden); en relation har två symmetriska länkfält och record-ID-batchen fungerar från vilket håll som helst. Två batch-steg i get-attendance (event→Deltaganden-ID→rader, sedan Person-ID→namn) är båda samma get-person-mönster. Regel: när ett display/formel-filter är skört (L153), hämta via record-ID:n från relationens motsatta länkfält — det är den tillförlitliga, lättviktiga (bara relationens rader, ej hela tabellen) och redan certifierade vägen; uppfinn inte ett nytt filter. Kategori: Arkitektur/Airtable-hämtning. Relaterad: [[L153]] (klass-buggen detta kringgår) + get-person record-ID-batch-mallen. Källa: 2026-06-20 Session 25 Fas 6b L3 (väg D).

## 2026-06-21 — Session 27 (T16 data-model reconciliation + dok-synk-rutin)

### L155 [UNIVERSAL] — Ny chatt mot en PAUSAD session ⇒ /session-resume, inte /session-start; Chat ska flagga lifecycle-tillståndet FÖRE arbete

Symptom: Session 27 öppnades genom att Chat orienterade och drev vidare utan att formellt köra `/session-start` eller `/session-resume`. Föregående session (26) var `lifecycle: paused` (ADR-051, nr bevarat). Tvetydigheten "är detta Session 26-resume eller en ny Session 27?" avgjordes inte vid start — den exploderade mitt i ett tråd-bygge (T19-registreringens STOPPA-grind på sessionsnummer) och tvingade fram en separat Session 27-dok-födelse flera turer in. Regel: vid orientering MÅSTE Chat läsa föregående sessionsdoks `lifecycle:`-fält (ADR-052) och avgöra start vs resume FÖRE något arbete — en pausad session resume:as, en stängd ger ny session. Tillståndet är O(1)-läsbart i fält, inte i prosa. Kategori: Process/sessionslivscykel. Relaterad: [[L67]] + [[L68]] (landnings-kadens) + ADR-051/052. Källa: 2026-06-21 Session 27-öppning.

### L156 [UNIVERSAL] — Chat ska leverera create-session-doc-födelseprompten som FÖRSTA Code-handling vid ny session, inte orientera och driva vidare

Symptom: Session 27-doket föddes sent — Chat orienterade, levererade en PI-fix och en tråd-registrering FÖRST, och födde sessionsdoket flera turer in. Doket är externminnet (kontinuitet-arkitektur): det ska födas vid start så att allt efterföljande arbete har en durabel landningsyta från första landningen. Regel: när en ny session deklareras är Chats FÖRSTA Code-prompt create-session-doc-födelsen (session-start-skillens skapande-gren), inte orientering följt av drift. Kategori: Process/sessionslivscykel. Relaterad: [[L155]] + [[L67]]/[[L68]]. Källa: 2026-06-21 Session 27 (doket föddes sent; PI-fix kom emellan).

### L157 [UNIVERSAL] — "Verbatim" skyddar INNEHÅLL, inte MARKUP; Code får markup-normalisera men ska rapportera det som sådant

Symptom: en Chat-levererad "verbatim" not (T19-not) failade Vale.Terms eftersom källtexten bar gemena filsökvägar utanför backticks. Code:s rätta drag: backtick:a sökvägarna (markup-normalisering mot grind-konvention) UTAN att röra ord/ordning/betydelse, och rapportera det explicit som markup-normalisering — inte innehållsändring. Regel: "verbatim" skyddar tecken-INNEHÅLLET (orden, analysen), inte markup-FORMEN; Code får normalisera markup för att passera en grind men ska (a) inte ändra innehåll och (b) rapportera normaliseringen transparent. Korollarium: Chat ska leverera grind-grön text från början så normaliseringen aldrig behövs. Kategori: Process/roll-disciplin. Relaterad: [[L158]] (den konkreta Vale-fällan) + [[L139]]. Källa: 2026-06-21 Session 27 (T19-not Vale.Terms-fångst).

### L158 [UNIVERSAL] — Chat-levererad not-/dok-text måste backtick:a filsökvägar i källan — gemena airtable-*/supabase-*-filnamn triggar annars Vale.Terms

Symptom: bara-skrivna (icke-backtick:ade) sökvägar som `airtable-constraints.md`, `supabase/functions/`, `06b-supabase-target.md` triggar Vale.Terms-regeln som kräver versal `Airtable`/`Supabase` — men filnamnen MÅSTE vara gemena (de är riktiga paths). Lösningen är inte att versalisera (bryter pathen) utan att backtick:a (inline-kod → Vale hoppar över). Regel: all Chat-levererad text som ska in i ett Vale-grindat dok måste backtick:a sina filsökvägar/-namn i källan; den som skriver kontrollerar mot grinden FÖRE leverans. Syskon till [[L139]] (verifiera mot faktiskt grind-beteende, gissa inte). Kategori: Process/grind-disciplin. Relaterad: [[L157]] (verbatim↔markup) + [[L139]]. Källa: 2026-06-21 Session 27 (T19-not; återkom i Pass 2-paths).

### L159 [UNIVERSAL] — Chat-prompter ska aldrig anta fil-mekanismer; Code verifierar mot disk (förstärker L139)

Symptom: tre prompt-antaganden föll mot disk i Session 27 — (1) "frontmatter-hooken auto-bumpar threads/sessionsdok" (FALSKT: exakt-path-match, dessa står ej i FRONTMATTER_GOVERNING_DOCS → T20); (2) "psionautics-synk-kopian finns ej / stryk synk-claimen" (FALSKT: kopian fanns på annan path, `~/Repon/psionautics/docs/data-model.md`, ej `.../reference/...` → path-fix, ej strykning); (3) "stryk §Luckor 7" (skulle ha renumrerat §Luckor 8–11 och brutit fälla 26/F.2:s korsrefs → STÄNGD inline istället). Regel: Chat-prompter ska aldrig anta fil-mekanismer (hook-scope, fält-skrivbarhet, fil-existens/path, list-renumrerings-konsekvenser) — Code verifierar varje mot disk FÖRE edit och korrigerar mot faktiskt tillstånd utan att gissa. Detta är extern fångst i rätt roll (instruktion byggd på antagande → Code fångar mot disk). Kategori: Process/verifiering. Relaterad: [[L139]] (samma klass, fler instanser) + [[L157]]. Källa: 2026-06-21 Session 27 (T16 Pass 2 A8/hook/Lucka 7).

### L160 [UNIVERSAL] — Senior-rollen är en MOTIVERAD DOM, inte en meny av vägar

Symptom: vid EF-sektions-beslutet bollade Chat tre alternativ förklädda till "din riktning" i stället för att döma; Marcus: "va SENIOR". Senior-rollen (PI: Claude är seniorutvecklare/arkitekt, Marcus vilar på rekommendationen) innebär att när Marcus ber om en rekommendation ska Chat LEVERERA EN DOM — belagd med web-research för arkitektur-/strategi-beslut (PI research-före-arkitektur) — inte returnera en options-meny som tvingar Marcus att själv väga. Att presentera optionsrymden är förarbete; domen är leveransen. Kategori: Process/roll-disciplin. Relaterad: [[L161]] (research belägger domen) + PI Roll-arkitektur. Källa: 2026-06-21 Session 27 (EF-sektions-beslut).

### L161 — Web-research kan VÄNDA en Chat-rekommendation; belägg FÖRE rekommendation, inte efter

Symptom: Chat rekommenderade från magkänsla "reconcilera hela doket" + "bygg T19 efter 6c"; web-research mot SSOT-/dok-arkitektur-praxis vände BÅDA — till "kritisk väg / kontrakts-djup först" respektive "T19 FÖRE 6c" (kartan behövs av det första write-flödet). Regel: för arkitektur-/strategi-/ordnings-beslut ska web-belägg komma FÖRE rekommendationen formuleras (PI research-före-arkitektur), inte som efterhandsbekräftelse — ett orefererat magkänslo-råd är inte leveransklart och kan vara rakt fel. Kategori: Process/research-disciplin. Relaterad: [[L160]] (domen ska vara belagd) + PI research-sektionen. Källa: 2026-06-21 Session 27 (reconciliation-bredd + T19-ordning).

## 2026-06-21 — Session 28 (T19 app↔Airtable-interaktions-dok — författning, granskning, rättelse)

### L162 [UNIVERSAL] — En overifierad sido-watch får INTE hårdna till föreskrivet kontrakt utan korsläsning mot senast reconcilerad auktoritet + ev. live

Symptom: Session 26 noterade som "sido-watch" att `Väntelista.Event` (`fldC01Nf3lVWrOgdw`) "är också länkfält → samma T15-klass". T19-doket ärvde den hypotesen och skrev den som FÖRESKRIVET kontrakt ("filtrerad per event … måste byggas via väg D"). Pass 2 + live-MCP falsifierade den: fältet är `singleLineText`-konstant (data-model:221, Session 27 T16-reconciliation, bekräftad live 2026-06-21). En text-konstant bär varken T15-klassen eller kan vara per-event-diskriminator. Regel: en icke-verifierad watch-/sido-hypotes i ett pausat sessionsdok är INTE en kontrakts-källa — innan den skrivs som mekanik i ett governing-dok måste den korsläsas mot den senast reconcilerade auktoriteten (data-model) + verifieras live när den är verifierbar. Författar-arvet "annan session sa X" är en hypotes, inte ett belägg. Kategori: Process/verifiering. Relaterad: [[L153]]/[[L154]] (T15-klassen) + [[L159]] (anta ej fil-mekanismer; verifiera mot disk) + [[L161]] (belägg före påstående). Källa: 2026-06-21 Session 28 (T19 §9 get-waitlist, Pass 2 fynd 1).

### L163 [UNIVERSAL] — Kod-/schema-härledda dok måste granskas EXTERNT mot auktoritets-källan, inte bara self-review:as

Symptom: T19-doket författades fil:rad-belagt och kändes komplett; Chat-self-review i författnings-ögonblicket missade att §9 get-waitlist motsade schema-auktoriteten (länkfält vs singleLineText). En separat kall granskningsrunda (Pass 2), riktad mot data-model + live-MCP, fångade det direkt. Detta är den etablerade fångst-asymmetrin i praktiken (Chat-self ~9 % / Code-transparens ~64 % / Marcus-pushback ~27 %): författaren ser inte sitt eget antagande. Regel: ett dok som härleder påståenden ur kod/schema får inte stängas på self-review — det kräver ett externt VERIFIERA-pass mot auktoritets-källan (källkod fil:rad + reconcilerad schema-doc + live där tillämpligt), kört av en granskare som inte också var författaren i samma rörelse. Kategori: Process/roll-disciplin. Relaterad: [[L160]] (extern fångst > intern) + PI self-review-disciplin (bygg för extern fångst). Källa: 2026-06-21 Session 28 (Pass 2 kall granskning).

### L164 [UNIVERSAL] — Reconciliation är en daterad ögonblicksbild, inte en permanent korrekthets-garanti; live-verifiering vid faktisk användning slår en daterad reconciliation

Symptom: data-model.md reconcilerades mot live i Session 27 (T16) och är den auktoritativa schema-källan — ändå bar `:221` en punkt-drift på en verifierbar konstant ("Medveten Kontakt" medan live = "Psionautics", en event/brand-förväxling). Reconciliation rättade fält-TYPEN korrekt men konstant-VÄRDET halkade. Regel: även en nyligen reconcilerad auktoritet är sann-per-datum, inte sann-för-alltid; när en konsument faktiskt RÖR ett fält (write-design, filter-bygge) ska värdet/typen live-verifieras mot basen — den daterade reconciliationen är startpunkt, inte slutbevis. Markera live-verifierade påståenden med pull-datum så de åldras synligt. Kategori: Process/färskhets-disciplin. Relaterad: [[L162]] (korsläs auktoritet + live) + "index ≠ live-HEAD"-principen. Källa: 2026-06-21 Session 28 (data-model:221-fix, Landning D).

## 2026-06-21 — Session 29 (T17 — systemet.md: körande Chat/Code/Marcus-systemets karta)

### L165 [UNIVERSAL] — Relativa markdown-länkar till filer utanför spokens CI-checkout bryter lychee; hub-referenser bär som inline kod

Symptom: T17-dokets ritning specificerade "inline fil:rad-länkar" och Code författade först hub-referenser som relativa markdown-länkar (`../../../marcus-system/...`). Docs link check (lychee, `fail:true`, scope `./docs/**/*.md`) följer lokala fil-länkar, och hub-repot checkas INTE ut i CI → 26 länkar hade brutit jobbet, CI rött. Etablerad precedent (CLAUDE.md `:112/:165`, ADR-042/043) refererar hub-filer som INLINE KOD, aldrig relativa länkar — just för att undvika detta. Regel: referenser till filer utanför spokens egen CI-checkout (hub-repot) skrivs som inline kod (behåller fil:rad som läsbar evidens, ingen länk-check); endast spoke-interna mål får vara klickbara relativa länkar. Code:s self-review fångade det vid författning FÖRE push (körde lychee lokalt). Kategori: Process/repo-egenskaps-verifiering. Relaterad: [[L159]] (anta ej fil-mekanismer; verifiera mot disk). Källa: 2026-06-21 Session 29 (T17 Pass 2-författning).

### L166 [UNIVERSAL] — Att lägga ett dok i .frontmatter-policy.conf kräver samtidig bump av test-fixturen som hårdkodar docs-antalet

Symptom: governing-tillägget systemet.md (`.frontmatter-policy.conf` 11→12) bröt `test-check-frontmatter.sh` — fixturen `write_all_valid` skrev 11 docs och T1/T12 assertade "alla 11", medan `setup_repo` kopierar den RIKTIGA `.conf` (nu 12) → systemet.md saknades i fixtur-repot. Samma koppling manifesterad TVÅ sessioner i rad (T19: 10→11, `cd46bee`; T17: 11→12, denna). Fångad lokalt FÖRE push båda gångerna genom att köra frontmatter-testsviten lokalt (14/14 PASS efter fixtur-bump). Regel: vid varje governing-tillägg, förvänta config↔test-fixtur-kopplingen — uppdatera `write_all_valid` + count-assertions samtidigt och kör sviten lokalt före push. Två manifestationer = moget att mekanisera (tråd T23). Kategori: Process/config↔test-fixtur-koppling. Relaterad: [[L165]] (samma session, repo-egenskaps-klass) + tråd T23. Källa: 2026-06-21 Session 29 (T17 governing-wiring).

### L167 [UNIVERSAL] — Den som bygger en disciplin är inte immun mot att bryta den; extern granskning krävs även då (den farliga färskhets-riktningen)

Symptom: T17-doket, vars HELA tes är att skilja [STABIL MEKANIK] från [AKTUELLT TILLSTÅND], märkte SJÄLVT fångst-raterna (9/64/27 %, en empirisk mätning från Session 8) som [STABIL MEKANIK] — ett tillstånd maskerat som evig sanning, i färskhets-dokumentet självt. Self-review i författnings-ögonblicket missade det; en kall extern granskningsrunda (Pass 2-granskning, fynd F5) fångade det direkt. Regel: explicit disciplin i prompt/dok garanterar inte korrekt tillämpning — den farliga riktningen (tillstånd maskerat som mekanik) ruttnar tyst och måste fångas externt, även när författaren "vet bättre" och själv predikar disciplinen. Kategori: Process/färskhets-markör-integritet. Relaterad: [[L163]] (kod-/schema-härlett kräver externt VERIFIERA-pass) + [[L164]] (sann-per-datum ej för-alltid). Källa: 2026-06-21 Session 29 (T17 Pass 2-granskning F5).

### L168 [UNIVERSAL] — Återkommande premiss-falsifiering bevisar att Chat-self-review-svagheten är strukturell, inte slarv

Symptom: tre antaganden Chat förde vidare i Session 29 falsifierades alla av Code mot disk: (a) "`hur-systemet-funkar.md` är arbetssätt" → var domän/affärslogik (Scenario-sektioner, à la data-model); (b) "de fyra hub-rot-doken är ej i drift, teoretisk kvarleva" → alla fyra I DRIFT (hub-konstitutionen + den körande session-start-skillen pekar på dem som auktoritativa); (c) "kapabilitets-skills är Chat-sidans" → disk: `SKILLS-INVENTORY.md` titulerar dem "Claude Code-skills" (`~/.claude/skills/`, Code-reachable). Var och en korrigerad mot disk innan den hårdnade i fil. Regel: premiss-falsifiering är inte slarv att skämmas för utan den strukturella fångst-arkitekturen i drift (Chat-self ~9 %, extern fångst ~91 %) — den validerar EMPIRISKT själva modellen systemet.md beskriver. Bygg prompter så Code KAN fånga premissen mot disk; lita inte på att Chat fångar sin egen. Kategori: Process/roll-arkitektur-validering. Relaterad: [[L159]] (anta ej fil-mekanismer) + [[L160]] (extern fångst > intern). Källa: 2026-06-21 Session 29 (T17 kartläggning Pass 0/1a/1b + rättelse #2).

## 2026-06-22 — Session 26 (Fas 6c build-complete-cykeln — skörd vid SESSIONSGRÄNS-session-end; hub-lyft PENDING efter 6d)

> Lessons L169–L175 skördade vid 6c:s SESSIONSGRÄNS-session-end (ADR-051). HUB-LYFT PENDING:
> de `[UNIVERSAL]`-flaggade lyfts vid FULLT Fas 6 fas-avslut EFTER 6d, ej här. Kandidaterna
> capturades löpande i sessionsdokets paushistorik-block (7 st) och numreras nu disk-verifierat.

### L169 [UNIVERSAL] — En Chat-prompt får aldrig bära en intern fil-/jobb-destinations-motsägelse

Symptom: under Fas 6c-bygget bar en Code-prompt motstridiga destinationer för samma artefakt (var en fil/ett jobb skulle landa angavs på två sätt som inte kunde vara sanna samtidigt). Motsägelsen var INTERN i prompten — den kunde fångas av promptförfattaren mot promptens egen text, utan disk-åtkomst. Regel: en prompt är en specifikation; en intern destinations-motsägelse gör specifikationen osatisfierbar och tvingar utföraren att gissa (~9 %-zonen). Korsläs varje prompt för att varje fil-/jobb-destination är entydig och inbördes konsistent FÖRE leverans — self-review-disciplinens "verifiera flytt-destinationer mot faktiskt tillstånd" gäller även prompten mot sig själv. Kategori: Process/prompt-intern-konsistens. Relaterad: [[L159]] (anta ej fil-mekanismer) + [[L168]] (bygg så extern fångst KAN ske). Källa: 2026-06-22 Session 26 (Fas 6c, build-complete-cykeln).

### L170 [UNIVERSAL] — Väntan är ingen spak när en rate-limit är strukturell, inte transient

Symptom: T24:s CI-429-burst behandlades först som transient (vänta ut cooldown-fönstret, rerun:a). En enda tyst rerun efter 40 min cooldown nådde ändå inte grön — gaten var icke-passerbar för VILKEN commit som helst vid svitens login-volym (44 logins/körning mättade GoTrue-fönstret), och reruns FÖRVÄRRADE genom att pumpa in fler logins. Problemet var strukturellt (burst-ORSAKEN), inte tidsmässigt. Regel: skilj transient (självläker med tid) från strukturell (återkommer deterministiskt oavsett väntan) FÖRE du väljer väntan som åtgärd. Om samma gate fäller obesläktade commits är orsaken strukturell → fixa orsaken, vänta inte. "EJ nu"-deferralen revs öppet mot blockad-evidensen (fixen blev enabling, ej spekulativ). Kategori: Process/transient-vs-strukturell-diagnos. Relaterad: [[L171]] (den strukturella fixen) + [[L110]] (staging==prod strukturell-klass). Källa: 2026-06-22 Session 26 (T24, Fas 6c Leverabel 2).

### L171 [UNIVERSAL] — CI-auth-burst löses vid orsaken: en delad token, inte höjt tak

Symptom: CI:s `Test + Build`-jobb loggade in mot staging-GoTrue på TVÅ ställen per körning (e2e `auth.setup.ts` + api-staging-svitens egen login-helper), 44 logins/körning → 429-burst. Lösningsrymden hade tre kandidater: (a) CI-side token-återanvändning, (b) serialiserad/strypt login, (c) höjd GoTrue rate-limit. Vald: (a) — ett `api-setup`-projekt loggar in user+admin EN gång var, persisterar tokens (`playwright/.auth/api-tokens.json`), svit-testerna läser dem (44→2 logins, 66 passed/0 429). (c) valdes medvetet BORT: höjt tak är säkerhets-adjacent (sänker skyddet mot credential-stuffing) och behandlar symptomet, inte burst-orsaken. Regel: när en delad resurs strypts av egen burst, eliminera burst-ORSAKEN (dela/återanvänd auth-artefakten, idiomatiskt setup+dependency) framför att höja taket; säkerhets-adjacenta tak-höjningar är sista utväg, ej första. Kategori: Process/rate-limit-rotorsaks-fix. Relaterad: [[L170]] (strukturell-diagnosen som ledde hit) + [[L160]] (eliminera orsak > maskera symptom). Källa: 2026-06-22 Session 26 (T24-b, `2f4443c`).

### L172 — Airtables `createdTime` är metadata, inte ett sorterbart fält → sortera klient-/JS-side

Symptom: get-waitlist skulle returnera väntelistan i `createdTime desc`, men Airtables `createdTime` är post-METADATA, inte ett vanligt fält → det går inte att `sort`:a på via list-API:ts `sort`-parameter som ett fält. Lösning: hämta posterna och sortera på `createdTime` JS-side i EF:en. Regel (Airtable-flavored): verifiera att ett fält FAKTISKT är sorterbart via API:t innan du designar en server-sort på det — Airtable-metadata (`createdTime`, `RECORD_ID()`) exponeras inte alltid som sort-bara fält; faller det utanför, gör en deterministisk JS-sort efter hämtning. Kategori: Airtable/sort-mekanik. Relaterad: [[L152]] (Airtable-formel/fält-fällor mot skarp data). Källa: 2026-06-22 Session 26 (Fas 6c Leverabel 3, get-waitlist).

### L173 [UNIVERSAL] — Verifiera värd-identiteten före deploy: ett repo länkat mot PROD kräver explicit `--project-ref`

Symptom: staging-deploy av 6c-EF:erna kördes från ett repo vars Supabase-länk pekar på PROD — en bare `supabase functions deploy` hade träffat PROD. Fixen: explicit `--project-ref pqtshyierkdgwdnxuirz` (staging) vid varje deploy; PROD förblev orörd. Regel: anta aldrig att den länkade/default-värden är den avsedda — verifiera mål-projektets identitet explicit FÖRE en mutations-/deploy-operation, särskilt när repot är länkat mot PROD och staging är det avsedda målet. Gör värd-valet explicit i kommandot, inte beroende på ambient länk-state. Kategori: Process/deploy-värd-verifiering. Relaterad: [[L110]] (staging==prod-klass) + [[L159]] (anta ej; verifiera mot faktiskt tillstånd) + tråd T12 (`.env.test`→PROD-yta). Källa: 2026-06-22 Session 26 (Fas 6c Leverabel 4, staging-deploy).

### L174 [UNIVERSAL] — En "planerad→byggd"-doksektions-övergång är en koherent multi-sektions-operation, inte en ensam-edit

Symptom: när create-registration/get-waitlist/get-registrations väg-D gick från planerade till byggda redigerades §9 i `airtable-interaction.md` ensamt (de tre `[AKTUELLT TILLSTÅND]`-markörerna → STABIL MEKANIK), men §5 sa fortfarande "get-registrations bär T15-buggen" → §5↔§9-koherensen bröts. Self-review fångade det; full väg-X-fix re-belade ALLA berörda sektioner (§5 EF-katalog 9→11, §6 bug→väg-D, §7 allowlist 2→3, §8 helper-API, §9 tömd) mot HEAD. Regel: en status-övergång i ett dok som beskriver samma sak från flera vinklar (katalog, bug-status, allowlist, helper, planerat-vs-byggt) är EN operation över alla de sektionerna — identifiera först git-exakt vad som ändrades, re-belägg sedan varje berörd sektion mot samma HEAD. Ensam-edit av en vy lämnar de andra vyerna lögnaktiga. Kategori: Process/dok-koherens-multi-sektion. Relaterad: [[L175]] (stämpel-sanning är holistisk) + [[L167]] (färskhets-integritet fångas externt). Källa: 2026-06-22 Session 26 (6c-completion, airtable-interaction väg X).

### L175 [UNIVERSAL] — En commit-stämpels "sann vid HEAD" är HOLISTISK, inte per-rad

Symptom: §9-ensam-editen (L174) var per-rad korrekt men gjorde dokumentets stämpel ("sant vid HEAD `e499a89`") som HELHET falsk — §5 motsade §9. En stämpel som påstår dok-färskhet vid en commit garanterar inte att enskilda rader är färska, utan att HELA dokumentets påståenden är inbördes konsistenta och belagda mot den commiten. Regel: innan du stämplar ett dok "sant vid HEAD X", verifiera holistiskt — git-diffa vad X faktiskt ändrade och korsläs ALLA sektioner som rör de ändringarna mot varandra, inte bara den du nyss rörde. En holistiskt osann stämpel är värre än ingen stämpel (falsk trygghet). Kategori: Process/stämpel-sanning-holism. Relaterad: [[L174]] (multi-sektions-operationen) + [[L164]] (sann-per-datum ej för-alltid) + [[L163]] (kod-/schema-härlett kräver VERIFIERA-pass). Källa: 2026-06-22 Session 26 (6c-completion, stamp-honest reconciliation `9063f0c`).

### L176 [UNIVERSAL] — Ett test som pinnar en bestående invariant via ett tillfälligt sido-tillstånd är en tidsbomb

Symptom: auth-flow Test 5 asserterade en BESTÅENDE arkitektur-invariant ("ingen anon-key-läcka — guard redirectar före datafetch", Del 5.0) genom att kräva noll functions/v1/*-anrop på inloggat /hem. Men den valde inloggat /hem enbart för att routen DÅ var en inert placeholder (K3-state) — ett TILLFÄLLIGT sido-tillstånd. När 6d gjorde /hem till en datafetchande aggregeringsvy brast testet by design, trots att invarianten var helt orörd. Rotorsak: assertionen var pinnad till sido-tillståndet (route råkar vara tom), inte till invariantens natur (oautentiserad → ingen läcka). Generaliserbar regel: när du skriver ett regression-test för en bestående invariant, assertera mot invariantens NATUR i dess SANNA KONTEXT (här: oautentiserad väg → noll EF-anrop före redirect), aldrig via ett sido-tillstånd som råkar gälla nu. Annars blir testet en tidsbomb som smäller när sido-tillståndet legitimt ändras — och den som rör sido-tillståndet tvingas felsöka en invariant som aldrig var i fara. Praktisk följd: en ny vy på en default-landningsyta måste korsläsa skal-/auth-svitens inert-antaganden FÖRE första push (L1:s röda första-push var precis detta). Kategori: Process/test-design-invariant-vs-sido-tillstånd. Relaterad: [[L175]] (stämpel-sanning) + [[L167]] (färskhets-integritet fångas externt). Källa: Session 30, Fas 6d L1 — Test 5-flytt (beslut A), se sessionsdok Del 2.

## 2026-06-23 — Session 31 (T26 e2e-flakiness — 2 landningar + miljö-kluster-dok T30; hub-lyft PENDING efter Fas 6)

### L177 [UNIVERSAL] — När repro är blockerad och måltesterna är miljö-oberoende: härda PREVENTIVT mot rotorsak via statisk analys, stämpla "ej trace-belagd"

Symptom: T26:s tre timing-flaky-tester skulle härdas, men repro-path mot staging blockerades av en credential-mismatch (lokala creds = de facto prod-creds; kör ej mot prod per prod-guard) → ingen empirisk trace gick att fånga. Nyckelobservation som löste låsningen: de tre måltesterna är fullt `page.route`-mockade → deras racer är MILJÖ-OBEROENDE render-/fokus-timing, inte backend-beroende → en empirisk trace var aldrig nödvändig, bara önskvärd. Härdningen designades mot de rotorsaks-riktningar den statiska analysen (STEG 1 DEL 2) redan kartlagt: transient loading-fönster → manuell route-release (deterministiskt); `toBeFocused`-race → stabil `aria-live`-data-gate före assertionen; axe-pre-render → `toHaveCount(n)` före `analyze()`. Regel: när en flake inte kan reproduceras men måltesterna är bevisat miljö-oberoende (mockade), är preventiv rotorsaks-härdning mot statisk analys ett giltigt och ärligt utfall — INTE en blockerare. Stämpla den explicit "PREVENTIV, ej trace-belagd" i commit + sessionsdok så framtida läsare vet att fixen vilar på analys, inte fångad repro (undvik falsk "bevisad mot trace"-trygghet). Kategori: Process/test-härdning-utan-repro. Relaterad: [[L176]] (test-design mot invariantens natur) + [[L167]] (färskhets-/bevis-integritet ärlig). Källa: Session 31, T26 Landning B (`69a89f4`), CI grön 78 passed noll flaky.

### L178 [UNIVERSAL] — Chat-tillhandahållna fil:rad-citat i ett auktoritativt dok belägges mot disk av Code FÖRE de får stå

Symptom: T30-kluster-kortet skulle författas ur en "forensisk rapport" vars citat (`conversion-plan:1157-1159`, commit `fca8bfd`-datum, ADR-050:s scope/datum, `session-26:320`, Airtable-frånvaron) prompten attribuerade till Code — men flera av dem hade Code aldrig själv verifierat; de kom från Chat-ledet. Att transkribera dem rakt in i ett auktoritativt, governing-adjacent kort vore att tvätta en obekräftad hypotes till "fakta". Code stannade och belade VARJE citat mot disk först: conversion-plan-raden lästes (rykande pistol), commit-datumet `git show`:ades, ADR-050:s lokal-yt-frånvaro `grep -c`:ades (= 0), session-26-doket lokaliserades i arkivet och raden lästes, Airtable-frånvaron grep:ades. Två citat-nyanser rättades mot disk (ADR-050 BESLUT 2026-06-13 vs BYGGE 2026-06-15 — båda korrekta men distinkta; `.env.test` gitignored → ingen git-historik, provenansen är sessionsdoket ej git). Regel: ett citat i ett auktoritativt dok är en HYPOTES tills Code belagt det mot disk, oavsett vem som tillhandahöll det — verifiera före det får stå, rätta drift öppet, flagga luckor (gissa aldrig). Self-confirm tvättar; do-confirm/Code-transparens fångar. Kategori: Process/citat-verifiering-mot-disk. Relaterad: [[L159]] (anta ej; verifiera mot faktiskt tillstånd) + [[L175]] (stämpel-sanning holistisk) + [[L163]] (härlett kräver VERIFIERA-pass). Källa: Session 31, T30-kort-författning (`5e5914b`).

### L179 — Doc-födelse-hoppet fångas av do-confirm, inte av self-confirm (sent fött sessionsdok)

Symptom: Session 31:s sessionsdok föddes aldrig vid `/session-start` (steget hoppades, samma L156-klass som tidigare doc-födelse-/stämpel-hopp). Self-confirm under sessionen märkte det aldrig (~9%-zonen); `/session-end` do-confirm-passets POST 0 fångade det explicit och födde doket sent (lifecycle: active vid födelse, Del 1 rekonstruerad ur faktisk scope, Del 2+ efter-hands-bakade). Regel: doc-födelse vid sessionsstart är en killer-item-klass som inte tillförlitligt auto-upptäcks i flow — do-confirm-passet måste ha en explicit FÖRSTA post som verifierar sessionsdokets existens mot disk före allt annat, så ett hoppat födelse-steg fångas och åtgärdas vid gränsen i stället för att tyst sakna doket. Kategori: Process/sessionsdok-födelse-do-confirm. Relaterad: [[L67]] (levande artefakter landnings-kadens) + [[L176]] (do-confirm fångar det self-confirm missar). Källa: Session 31, `/session-end` POST 0 (detta dok, sent fött).

## 2026-06-23 — Session 32 (lokal miljö-isolation, ADR-061 / T30-klustret)

### L180 [UNIVERSAL] — Enumerera ALLA filer en CI-grind läser, inte bara den uppenbara

Datum: 2026-06-23 | Källa: Session 32 (ADR-061-landning, klass: grind-design)
ADR-count-grinden (ADR-039) läser den kanoniska räkne-raden i rot-`README.md`, INTE index-tabellen i
`docs/decisions/README.md`. En prompt som la till ADR-fil + index-rad men inte bumpade räkne-raden fällde
CI tills Code fångade divergensen mot faktisk grind. Regel: när en prompt kräver att grind X är grön,
enumerera VARJE fil grind X faktiskt läser (läs grind-skriptet), inte bara den semantiskt uppenbara.
Chat-self-review missade det; Code-transparens mot faktisk disk fångade det. Relaterad: [[L159]] (anta ej; verifiera mot faktiskt tillstånd).

### L181 [UNIVERSAL] — En runtime-grind validerar inte build-artefakten; build-tid är en egen yta

Datum: 2026-06-23 | Källa: Session 32 (Pelare 2→2.5, klass: defense-in-depth)
`src/env.ts`-grinden (`import.meta.env`) kör vid runtime — den exekveras inte under `vite build`, som bara
buntar. En inkoherent build gick därför grön på runtime-grinden ensam; felet hade smällt först vid
användarens load-tid. Build-tids-vägran (`loadEnv` + samma rena regel i `vite.config.ts`, Pelare 2.5) fångar
felet vid tidigast möjliga punkt. Regel: en runtime-validering bevisar inte build-korrekthet — validera
build-ytan separat. Verifieringssteget (visa att inkoherent tillstånd VÄGRAS, ej bara att koherent
bootar) avslöjade gapet.

### L182 [UNIVERSAL] — Vilken miljö creds autentiserar mot är inte fil-läsbart; bara en auth-körning bevisar det

Datum: 2026-06-23 | Källa: Session 32 (T12, klass: verifierings-disciplin)
En fil-läsning av `.env.test` visar att en e-post är satt och vilken URL den paras med — men INTE vilket
projekt creds:en validerar mot. "URL=staging + cred satt" → "autar mot staging" är en inferens, ej ett
faktum. Auth-körningen gav 400 invalid_credentials: e-posten var en prod-era-adress som inte finns i
staging. Regel: cred↔miljö-koherens bevisas av en auth-körning, aldrig av att läsa konfigfilen.
Förstärker husets "testa mot faktiska värden, ej spec".

### L183 [UNIVERSAL] — Avvikelse triagas och rotorsaks-spåras FÖRE varje fix-förslag

Datum: 2026-06-23 | Källa: Session 32 (`.env.test`-forensik, klass: metod — Chat-glidning fångad av Marcus)
Chat föreslog en snabb e-post-fix på en avvikelse innan "varför uppstod den" var besvarat — och påstod
adressens innehåll utan att ha läst filen. Marcus-pushback stoppade det två gånger; forensiken
(disk-belagd) visade att adressen var en kvarlämnad prod-era-artefakt (2026-05-04) genom två
halv-migreringar (S19 secrets-only, S26 URL-only), och att den blinda fixen hade gett fel resultat (även
lösenordet var stale). Regel: en avvikelse triagas och rotorsaks-spåras mot faktisk data INNAN något
fix-förslag formuleras; "rätta snabbt" är aldrig giltigt före "varför uppstod det". Samma klass som T30
själv — skärper "rekommendation är inte beslut när gate är öppen" till Chats egna mellansteg.

### L184 [UNIVERSAL] — Least-privilege gäller även "för att få jobbet gjort"

Datum: 2026-06-23 | Källa: Session 32 (staging-admin-åtkomst, klass: säkerhets-arkitektur)
När admin-API:t inte var nåbart lokalt erbjöds genvägen att lägga staging `service_role`-nyckeln på
laptopen. Branschstandard (Supabase + least-privilege): den högst privilegierade nyckeln (kringgår RLS)
hör endast hemma i betrodda backend-/CI-miljöer, aldrig på en utvecklar-laptop. Regel: sänk aldrig
säkerhetsribban för att kringgå ett åtkomsthinder — routa via rätt yta (här: dashboard där admin-åtkomst
redan finns). Avtäckte dessutom att CLI:t var länkat mot prod → registrerat som T34.

## 2026-06-25 — Session 33 (Fas 6e Mer-flikens läs-ytor + L3-rescope → Segment-yta 6g/6h via ADR-062)

> Skördade vid SESSIONSGRÄNS-`/session-end`. L185–L189 = paushandoff-kandidater (L1 paus 1 + L2 paus 2); L190–L192 = design-fas-lessons ur L3-rescopen. Hub-lyft pending efter Fas 6 (Session 26+-konvention).

### L185 [UNIVERSAL] — Skarp filter-conformance kräver seedad fixtur; syntax-grön ≠ semantik-korrekt

Datum: 2026-06-25 | Källa: Session 33 (L1 Intresserade / get-leads, klass: test-disciplin)
En global läs-EF:s inklusions-/exklusions-filter kan inte bevisas mot en tom källa — en syntetisk lead
(Person + länkad Engagemang) gör en annars-tom syntetisk staging-bas filter-bevisbar. `COUNTA(Engagemang)`
uppdaterades rent 0→1 vid länk (ingen automation-kaskad). Regel: skarp conformance-bevisning kräver seedad
data som faktiskt träffar OCH missar filtret; en grön parse mot `[]` bevisar wrapper/schema, inte
filter-semantik. Samma klass som L154 (testa mot faktiska värden, ej spec).

### L186 [UNIVERSAL] — En filterklausul kan bevisas redundant ur datamodellens kardinalitet i stället för att läggas till defensivt

Datum: 2026-06-25 | Källa: Session 33 (L1 Intresserade-filter, klass: design-/modelleringsdisciplin)
`{Antal anmälningar (totalt)} = 0 ⟹ Totala deltaganden = 0` eftersom ett Deltagande per definition är "en
rad per Anmälan × Session" (A3 kräver `Anmälan.Person`). En andra klausul som filtrerar bort deltagare var
därför redundant — kardinaliteten garanterar implikationen. Regel: innan en defensiv klausul läggs till,
fråga om datamodellens kardinalitet redan garanterar den; en bevisat-redundant klausul är brus som döljer
det verkliga villkoret. Bevisa ur relationen, lägg inte till "för säkerhets skull".

### L187 [UNIVERSAL] — Vid låst domän-omtolkning som föräldralös-gör en typ: grep konsumenter FÖRST, radera rent — böj inte

Datum: 2026-06-25 | Källa: Session 33 (L1 Lead→Intresserad-omtolkning, klass: refaktor-disciplin)
När en låst domän-omtolkning (Lead → Intresserad) gjorde den befintliga `Lead`-typen föräldralös var
frestelsen att böja den gamla typen till den nya betydelsen. Konsument-grep visade 0 referenser utanför
adapter-trion → ren radering + egen `Intresserad`-typ var rätt, inte omtolkning av den gamla. Regel: när
domänerna faktiskt skiljer sig slår en egen typ en böjd typ; verifiera föräldralöshet med konsument-grep
FÖRST, radera sedan rent i stället för att låta en stale-namnad typ bära ny semantik.

### L188 [UNIVERSAL] — När en läs-EF saknar conformance-egenskap att bevisa mot tom källa är kontrakt-mot-tom den ärliga gaten

Datum: 2026-06-25 | Källa: Session 33 (L2 Maillogg / get-mail-log mot tom Utskickslogg, klass: test-disciplin)
Maillogg-EF:en läste en tabell som var TOM i både prod och staging (fylls först av L3:s skrivare). En seedad
fixtur här vore FALSK utskickshistorik. Den ärliga gaten är då kontrakt-mot-tom: auth + wrapper + schema-parse
mot `[]`. Skarp conformance landar när skrivaren finns. Regel: matcha gatens ambition till vad källan ärligt
kan bära — fabricera inte data bara för att få en "rikare" grön gate; en ärlig svag gate slår en falsk stark.
Komplement till L185 (seedad fixtur när källan KAN bära den; kontrakt-mot-tom när den inte kan).

### L189 [UNIVERSAL] — Ett förbyggt repo-schema är en hypotes, inte en källa, tills det korsats mot live

Datum: 2026-06-25 | Källa: Session 33 (L2 `MailLogEntrySchema` live-rättning, klass: verifierings-disciplin)
Det förbyggda `MailLogEntrySchema` bar 2 hårda typfel (skalär där fältet är länk-array; heltal-procent där
Airtable-API ger percent-decimal 0–1) som BARA live-introspektion avslöjade — data-model.md var tyst om båda.
Regel: ett schema skrivet före live-verifiering är ett antagande om formen, inte en sanning om den; kör en
live-introspektion mot faktisk API-respons innan schemat aktiveras vid en datagräns. Generaliserar
data-model-disciplinen (PI "gissa aldrig — verifiera") till repo-egna scheman.

### L190 [UNIVERSAL] — En governing count-grind kan validera en token på en ANNAN yta än den du redigerar — pre-passen måste söka alla grindade räknartoken

Datum: 2026-06-25 | Källa: Session 33 (L-doc ADR-062-landning, `423c440` fälld → `dc07a34`, klass: grind-/landnings-disciplin)
ADR-landningen uppdaterade docs/decisions/README-tabellen men missade rotens README `<N> arkitekturbeslut`-token
— en separat yta som `check-adr-count.sh` (ADR-039) grindar. Första pushen (`423c440`) föll på count-driften;
fix i `dc07a34` (61→62). Regel: en governing count-grind kan nyckla mot en kanonisk token på en HELT annan fil
än den ändringen rör — en ADR-FÖRBEREDELSE (och varje count-rörande landning) måste söka ALLA grindade
räknartoken mot disk före commit, inte bara den uppenbara indexytan. (I detta repo är ADR-count enda grindade
count-token; lessons/fällor/fas-antal grindas ej — men regeln gäller generellt.) Tidigare empiri samma session:
samma lärdom återanvändes proaktivt i Landningar 2–4 ("count-token: ingen berörd" verifierat explicit).

### L191 [UNIVERSAL] — Före bygge av en yta som ärver en inramning: kör forensisk pre-pass mot FAKTISK live-data, ej mot inramningens egna premisser

Datum: 2026-06-25 | Källa: Session 33 (L3-rescope → Segment-yta, ADR-062, klass: metod / verify-don't-guess)
Inramningen "L3 = Skicka mail" bar ett overifierat antagande som såg ut som sanning: att send-email var den
app-nativa kärnan. En forensisk pre-pass mot live-data (MCP-taxonomi + läsning av Make-blueprinten) falsifierade
det — segment-byggandet (VEM utskick går till) låg i Make, och ADR-015:s send-kontrakt motsade landad
`MailPayloadSchema`. Det vände hela L3 till en Segment-yta (Fas 6g, ADR-062) FÖRE en rad app-kod skrevs. Regel:
innan en yta byggs på en ärvd inramning, verifiera inramningens egna premisser mot FAKTISK live-data — inte mot
inramningens utsaga om sig själv. Kopplar PI "gissa aldrig — verifiera" + "ett låst beslut är inte immunt mot
evidens" till själva scope-inramningen, inte bara dess detaljer.

### L192 [UNIVERSAL] — Beräkna-från-källan + registret som committad förbättrings-kravspec (ej deferra-och-glöm)

Datum: 2026-06-25 (Session 33) | förfinad Session 34 (ADR-063) | Källa: Session 33 (Segment-yta vs Personers rollups, ADR-062 + data-model §Kända fällor 31–33, klass: arkitektur-/skuld-disciplin)
När datakällan är en lossy/inkonsistent projektion finns två icke-krockande spår: (1) beräkna korrekthet från
källan-av-sanning → leverans + korrekthet NU, migrations-överlevande; (2) registrera projektionens brister (aldrig
tyst förbi, ADR-053 ledstjärna). AVGÖRANDE FÖRFINING: "registrera" är INTE notera-och-gå-vidare — det är ett
COMMITTAT åtagande att lösa, med ägare och konkret resolutions-väg. Registret blir KRAVSPECEN för källans
förbättring/maximering, inte en deferra-och-glöm-lista. Enbart beräkna-runt utan committad resolution tappar
förbättringen; enbart vänta på källfix blockerar leverans. Registret-med-resolutions-väg är det som gör spår (1) till
leverans-NU i stället för permanent kringgående.
Projekt-applikation (exempel, ej avsmalning): källan är Airtable-basen — en FÖRSTKLASSIG LEVERABEL som maxas I BASEN
([ADR-063](../../docs/decisions/ADR-063-airtable-bas-som-forstklassig-leverabel.md)); registret (data-model §Kända
fällor + T16) är kravspecen för den post-Fas-6-maximeringen. App-sidan beräknar från Deltaganden (ADR-062 Beslut 2)
som leverans nu; resolution sker i basen vid maximeringen.
Empiri: Personers förberäknade rollups är lossy (Luckor A/B/C) → segment-ytan läser källan (Deltaganden, ADR-062
Beslut 2) MEN bristerna registreras (§Kända fällor 31–33 + T16).
Kvitto (öppen revidering): L192:s ursprungs-rubrik "route-around-but-register" bar en felpremiss-ton — register som
undvikande/uppskjutning, källan som dödsdömd. Förfinad per ADR-063: register = committad kravspec; källan maxas, ej
överges. Regeln är universell — exemplet (Airtable) är bara dess instans.

## 2026-06-25 — Session 35 (Fas 6g L1+L2 — segment-beräknings-motor + byggar-yta)

### L193 [UNIVERSAL] — Assertera mot kontraktet, aldrig mot fixturens incidentella rikedom

Datum: 2026-06-25 | Källa: Session 35 (L1 api-staging email-assertion, klass: test-disciplin)
En integration-assertion krävde icke-tom email; staging-personen saknade email → EF returnerade korrekt null
(nullable per ADR-064) → testet föll fast EF:n var kontrakts-korrekt. Felet: assertionen kodade en EGENSKAP HOS
FIXTUREN (denna person råkar ha email) som ett KONTRAKTS-KRAV. Regel: assertera mot kontraktets form (här:
nullbarhet), aldrig mot vad en specifik fixtur råkar bära — en ifylld fält-instans är ingen kontrakts-garanti.
Namn-present bevisar att berikningen körde; email-present är fixtur-tur. Samma klass som L154/L185.

### L194 [UNIVERSAL] — Join-nyckel-alignment mellan byggar-yta och nedströms exakt-match verifieras som STOPPA-grind, ej hoppas i runtime

Datum: 2026-06-25 | Källa: Session 35 (L2 STEG-0 Event(source)↔Kursnamn(lookup), klass: integritets-/verify-disciplin)
Byggar-ytans valbara nyckel (Event source) matas till compute-segments exakta sträng-match (Kursnamn lookup); en
stavnings-/värde-divergens ger TYST TOTAL-FAIL (inga segment matchar, inget fel kastas). Regel: innan en yta byggs
vars val matar en nedströms exakt-sträng-match, verifiera by-construction-alignment som STOPPA-grind FÖRE bygget
(varje konsumerat värde har exakt producent-match). Superset-riktningen (fler producent- än konsument-värden) är
väntad/OK; STOPP-villkoret är ett konsument-värde UTAN producent-match. Tyst total-fail mot en korrekthets-yta är
värsta klassen — gör den omöjlig by construction, övervaka den ej.

### L195 [UNIVERSAL] — En lossy datakällas brister kan TVINGA FRAM den bättre arkitekturen; läs källan, lappa inte projektionen

Datum: 2026-06-25 | Källa: Session 35 (segment-motorn vs Personers rollups, klass: arkitektur-disciplin) | companion till L192
När datakällan är en lossy projektion med strukturella luckor finns två vägar: lappa projektionen (fler fält,
fördubblad lossiness, korrekthet på sträng-match) eller läsa källan-av-sanning (stänger luckorna by construction).
Den senare är branschledar-svaret OCH enklare att bevisa. AVGÖRANDE INSIKT (Marcus surfade): basens brister tvingade
fram den BÄTTRE arkitekturen, inte en sämre — "kompromissade vi p.g.a. dålig datamodell?" → "nej, datamodellens
brister pekade på rätt väg". Regel: behandla en lossy projektions luckor som SIGNAL att routa till källan, inte som
skäl att kompromissa/lappa. Companion till L192 (beräkna-från-källan + register som kravspec); ny vinkel = framing:en,
constraint som forcing-function mot kvalitet.

### L196 [UNIVERSAL] — Tvetydig default på en outward-facing-operation görs säker via explicit mål + maskin-grind, ej operatörens minne

Datum: 2026-06-25 | Källa: Session 35 (L1 staging-deploy mot prod-länkad CLI, T34, klass: deploy-/säkerhets-disciplin)
CLI:t var länkat mot PROD (T34) → `supabase functions deploy` default-träffar prod. I stället för att förlita sig på
att operatören minns rätt flagga: explicit `--project-ref <staging>` + STOPPA-grind som LÄSER TILLBAKA målrefen och
asserterar == staging ≠ prod-ankaret FÖRE körning. Regel: när en irreversibel/outward-facing operation har en
tvetydig/farlig default, gör den säkra vägen (a) explicit i kommandot OCH (b) maskin-verifierad (läs tillbaka målet,
jämför mot disk-ankare) — flytta grinden från mänskligt minnessteg till disk-verifierad assertion. Outward-facing-
grind = "gör handlingen oåterkalleligt säker", ej "undvik den". (Durabla CLI-re-länk-fixen kvarstår som T34.)

## 2026-06-26 — Session 36 (Fas 6g L3 — segment-regel-persistens + write-vertikal)

### L197 [UNIVERSAL] — CI-conclusion hör till BÅDE orienterings-passet och avsluts-verifieringen; git-tillstånd (HEAD/clean/branch) räcker inte

Datum: 2026-06-26 | Källa: Session 36 (orientering missade rött main; Session 35 stängd ovanpå rött CI, klass: arbetsflöde / orientering + avslut)
Session 36:s orienterings-pass verifierade HEAD + ren tree + gren men INTE CI-conclusion. main hade varit rött sedan
Session 35 (4 markdownlint-fel — MD028/MD029/MD032 — fällda av docs-jobbet) och Session 35 stängdes (`lifecycle: closed`)
ovanpå rött CI; skulden ärvdes TYST till Session 36 och ytade först när första dok-commit skulle landa grönt. git-
tillstånd (commit/tree/branch) och CI-tillstånd (conclusion) är ORTOGONALA axlar — den ena läst grön implicerar inte den
andra. Regel: ett orienterings-pass inkluderar `gh run`-conclusion ("är main grönt NU?"), inte bara HEAD/clean/branch; och
session-end do-confirm verifierar CI grön mot faktisk `gh run` FÖRE lifecycle-flipp. Annars kan en session stängas ovanpå
rött CI och blockera nästa sessions första landning.

### L198 [UNIVERSAL] — En obeprövad write-kodväg ärver INTE en bevisad läs-vägs isolations-/routnings-egenskap; bevisa write-isolation empiriskt + reverserbart FÖRE prod-mutation

Datum: 2026-06-26 | Källa: Session 36 (pass 2 — staging/prod delade ID:n + create_field-routning, klass: verifiering / prod-säkerhet)
Session 36 pass 2: staging- och prod-baserna delar IDENTISKA tabell/fält-ID:n (falsifierar ADR-050 T2:s "nya ID:n"-
antagande) + `describe_table`-by-namn quirky i Airtable-MCP:n. Läs-routningen (list/describe/list_records) respekterade
`baseId` empiriskt — MEN `create_field`:s write-routning är en DISTINKT kodväg utan eget bevis, så en "staging"-skrivning
kunde ha landat i prod. Lösning: skapa fältet riktat mot staging, verifiera OMEDELBART på BÅDA baser att det landade
staging-only (auto-reversering vid fel-landning) FÖRE prod-touch. Regel: när en prod-närliggande operation går via en
kodväg vars isolations-/routnings-egenskap inte är empiriskt bevisad — även om en NÄRLIGGANDE väg (läs) är det — bevisa
DEN vägens egenskap reverserbart mot live FÖRE prod-mutation. Read-bevis täcker inte write.

## 2026-06-27 — Session 37 (Fas 6g L4 SKOOL-export + 6g arch-audit ren; hub-lyft PENDING efter Fas 6)

### L199 [UNIVERSAL] — Doc-commits måste köra `npm run lint:prose` (Vale) lokalt FÖRE push — markdownlint + frontmatter är en DELMÄNGD av prose-grindarna

Datum: 2026-06-27 | Källa: Session 37 (housekeeping-landning — T37-tabellrad föll på Vale i CI efter lokalt grön markdownlint, klass: verifiering / grind-täckning)
Session 37: en tråd-registrerings-commit verifierades lokalt med markdownlint + frontmatter-grind (båda gröna) och
pushades — men föll i CI på en SEPARAT grind, `Docs link check` → Vale prose (`Vale.Terms`: okapitaliserad compound
"dependabot" i stället för "Dependabot"). Vale körs aldrig av markdownlint eller frontmatter-grinden; att köra en
DELMÄNGD av de lokala grindarna gav falskt grön-förtroende. Regel: en doc-commit kör ALLA prose-/docs-grindar som CI kör
— minst `npm run lint:prose` (Vale) + markdownlint + frontmatter — lokalt FÖRE push. En grön delmängd implicerar inte en
grön helhet; varje CI-grind har en lokal motsvarighet som måste köras, annars fäller skillnaden i CI. (Samma ortogonala-
axlar-klass som L197: en axel läst grön implicerar inte en annan.) Hub-lyft pending — synkas vid FULLT Fas 6 fas-avslut,
konsekvent med L193–L198.

### L200 [UNIVERSAL] — Per-subfas-audit-status måste vara O(1)-läsbar i byggplanen (en matris) — annars deklareras en slice klar utan sin audit och luckan göms spridd över sessionsposter

Datum: 2026-06-27 | Källa: Session 37 (6g fas-avslut-bedömning — upptäckte att 6e aldrig auditerades, klass: legibility / process)
Session 37: inför en "Fas 6g KLAR"-bedömning behövdes en bild av per-subfas arch-audit-status (ADR-058). Den fanns INTE
samlad någonstans — statusen låg spridd över enskilda sessionsdok, och det krävde tre sökningar att upptäcka att 6e
(Mer) byggts men aldrig auditerats. Regel: status som grindar ett fas-avslut (per-subfas-audit, per-subfas-DoD) ska vara
O(1)-läsbar på ETT ställe (en matris i byggplanen), inte rekonstruerbar ur N sessionsposter. Spridd status är en
gömställe-yta: en slice kan deklareras klar utan sin audit och ingen ser luckan förrän någon råkar leta. Hub-lyft pending
— synkas vid FULLT Fas 6 fas-avslut, konsekvent med L149–L199.

### L201 [UNIVERSAL] — En sessions-close-justifiering måste korsläsas mot vad som FAKTISKT landade — en felaktig justifiering hoppar tyst över en grind

Datum: 2026-06-27 | Källa: Session 37 (S33-retrospektiv — 6e:s arch-audit uteblev på felaktig grund, klass: verifiering / do-confirm)
Session 33 stängde 6e med justifieringen "/arch-audit EJ körd (ingen app-kod)" — men 6e L1+L2 hade landat RIKTIG app-kod
(`get-leads`- + `get-mail-log`-EF:er + Intresserade- + Maillogg-vyer). Den felaktiga justifieringen lät en grind
(per-subfas arch-audit, ADR-058) tyst utebli; luckan upptäcktes först två sessioner senare. Regel: en close-/skip-
justifiering ("ingen app-kod", "inga schema-ändringar", "docs-only") är en HYPOTES som måste korsläsas mot vad som
faktiskt landade (commits/diff) FÖRE den får motivera att en grind hoppas över. En grind som uteblir på fel grund är
osynlig tills någon rekonstruerar historiken. (Knyter L200: O(1)-läsbar status hade fångat det direkt.) Hub-lyft pending
— synkas vid FULLT Fas 6 fas-avslut, konsekvent med L149–L199.

### L202 [UNIVERSAL] — En write-vertikal vars KRÄVDA länk-mål saknar fixtur-data i staging blockerar sitt eget conformance-test — seeda fixturen, anta inte att ett "riktigt ID finns"

Datum: 2026-06-27 | Källa: Session 38 (Fas 6f create-event L1 STEG 3, klass: test-infrastruktur / staging-isolation)
create-event KRÄVER en `Eventtyp`-länk (→ Eventformat, GREN A) vid skapande. Staging-tasken antog att ett "RIKTIGT
staging Eventformat-record-ID" fanns att referera — men staging Eventformat var TOMT (prod har 3, staging 0; data-
isolationen, ADR-050, gäller records ej bara schema). En länk-skrivning med `typecast:false` mot ett icke-existerande
rec-ID hade felat → ALLOW-/idempotens-testet kunde inte köras. Regel: innan ett conformance-test för en write-vertikal
med ett KRÄVT länk-mål skrivs, verifiera att länk-målet HAR data i staging; om inte, SEEDA en dokumenterad sentinel-
fixtur (ZZ-prefix, ADR-060-tolerans) och referera den via env-override + hårdkodad fallback (ingen ny CI-secret krävs,
till skillnad mot env-only-vägen som hård-failar tills secreten sätts). Anta aldrig att prod:s data-form finns i
staging — staging-isolation tömmer ofta länk-tabeller som prod fyller. Bonus-fynd: staging-test-EF:er kan inte själva
skapa fixturer i en annan tabell (ingen Airtable-cred i test-kontexten, ADR-060) → fixtur-seeding är ett Code/MCP-
moment, inte ett test-moment. Hub-lyft pending — synkas vid FULLT Fas 6 fas-avslut, konsekvent med L149–L201.

### L203 [UNIVERSAL] — Substring-kollision i e2e-selektorer + route-mock-regexar när EF-/fält-namn delar prefix/affix — ankra alltid

Datum: 2026-06-27 | Källa: Session 38 (Fas 6f create-event L2 STEG 3, klass: test-craft / determinism)
Två separata e2e-fel i samma bygge, BÅDA samma rot — default-substring/icke-ankrad matchning kolliderar när namn delar
text: (1) `getByRole('button', { name: 'Typ' })` matchade BÅDE Typ-selecten OCH Eventformat-selecten (vars label bar
"Event**typ**") — Playwrights name-matchning är default substring + case-insensitiv; (2) `page.route(/get-event/)`
för detalj-mocken klobbade `get-events` + `get-event-formats` (delad prefix `get-event`) → beforeEach-mockarna
överskuggades, queries felade, fokus-effekten uteblev. Regel: i e2e/mock-lager där namn delar prefix/affix, ANTA
substring-matchning och ankra explicit — `getByRole(..., { exact: true })` eller en label utan den delade biten;
`page.route`-regexar med `(?![s-])`/`($|\?)`-ankare så `/get-event/` inte fångar `get-event*`. Sido-regel (samma bygge):
react-aria `<Button type="submit">` submittar inte ett vanligt `<form>` tillförlitligt (usePress äter default) → använd
`onPress` (kodbas-idiom, jfr SegmentBuilder), behåll `<form onSubmit>` enbart för Enter-tangenten. Hub-lyft pending —
synkas vid FULLT Fas 6 fas-avslut, konsekvent med L149–L202.

### L204 [UNIVERSAL] — Prod-deploy-prompt-design måste verifiera deploy-vägens FAKTISKA beteende mot repots kanoniska procedur, ej anta

Datum: 2026-06-27 | Källa: Session 38 (Fas 6f create-event prod-deploy, klass: deploy-disciplin / prompt-design)
TVÅ instanser samma klass i EN session, båda upptäckta av Code-STOPPA mot disk, ingen i prompten: **(1)** prompten antog
att prod-deploy gick "via explicit `--project-ref`" (bare CLI-mental modell), men repots kanoniska väg var
`scripts/deploy-prod-functions.sh` + fail-closed `.prod-functions-allowlist.conf` (todo.md:319 KRITISK, L115) — de 2 nya
EF:erna fanns inte i allowlisten → deployen vägrades tills ett medvetet allowlist-tillägg gjordes (enabling-detour, egen
commit FÖRE prod-mutation). **(2)** prompten antog att skriptet träffade "de 2", men skriptet deployar HELA allowlist-setet
(7) per design — en rak körning hade redeployat 5 redan-live funktioner från drivet disk-tillstånd (16 `_shared`-commits
sedan deploy-datumet), oscopead prod-mutation. Lösning: `ALLOWLIST_FILE`-env-override (legitim skript-feature) med en
temporär 2-rads-fil → smalna KÖRNINGEN utan att röra den committade DEKLARATIONEN (de 5 hör hemma i prod, bara ej
redeployade nu). REGEL: före en prod-deploy-prompt skrivs/körs — verifiera mot disk (a) VILKEN väg som är kanonisk
(skript vs bare CLI vs CI), (b) VILKET set den vägen faktiskt träffar (delmängd vs hela allowlisten), (c) om de nya
artefakterna är registrerade i den vägens grind. "Deploya X" är inte en atomär operation förrän deploy-vägens mekanik är
disk-belagd. Generaliserbart till varje fail-closed-grindad operation (deploy, release, publish). Hub-lyft pending —
synkas vid FULLT Fas 6 fas-avslut.

### L205 [UNIVERSAL] — Prod-smoke-design måste planera AUTH-credential-tillgången mot prod FÖRE den antar en autentiserad prod-write kan köras

Datum: 2026-06-27 | Källa: Session 38 (Fas 6f create-event prod-deploy STEG 4, klass: smoke-strategi / prod-auth)
En prod-smoke av en auth-skyddad write-EF (`requireUser`) kräver en äkta prod-user-JWT — och det är INTE samma sak som
att ha staging-testinfrastruktur: prod-GoTrue är en SEPARAT auth-databas → staging-test-usrarna (`.env.test`) existerar
inte i prod, och test-harnessens prod-skydd (`assertTestSurfaceNotProd`, ADR-061) vägrar dessutom peka sviten mot prod.
Vid grinden återstod bara improviserade vägar — alla avvisade som ej tillåtna: programmatisk prod-auth-kontoskapelse via
GoTrue admin-API (skapar prod-auth-state) och prod-lösenord-i-chatt-kanalen (cred-exponering). Beslut: deferra den
autentiserade smoken till en tråd med precondition "prod-test-user via rätt kanal", och bevisa i stället deploy-hälsa +
auth-grind READ-only (anon→401, fel metod→405, anon-Bearer→401; write-mål-existens via direkt Airtable-läsning) — vilket
bevisar att EF:en lever, är rätt artefakt (exakt 405-sträng) och att grinden inte läcker, UTAN en write. REGEL: när en
plan innehåller en autentiserad prod-mutation, lös credential-FRÅGAN i planeringen (finns en sanktionerad prod-test-
identitet? via vilken kanal etableras den?) — improvisera den inte vid grinden, där enda kvarvarande vägar ofta är just de
otillåtna (kontoskapelse / lösenord-i-kanal). Ärlig landning: "deployad + grind-bevisad" ≠ "full-prod-smoke-bevisad";
skriv skillnaden synligt (§Kända fällor + tråd), maskera den inte. Hub-lyft pending — synkas vid FULLT Fas 6 fas-avslut.

## 2026-06-28 — Session 39 (Fas 6h L0–L2c — bulk-mail send-email + segment-resolution-extraktion)

### L206 [UNIVERSAL] — En strukturell säkerhets-spärr för en oåterkallelig handling ska vara OBEROENDE av data-källans identitet och fail-closed på en explicit positiv-flagga

Datum: 2026-06-28 | Källa: Session 39 (Fas 6h L2b, icke-prod-mail-spärren, ADR-067 D5)
Bulk-mail är en oåterkallelig extern sidoeffekt; i icke-prod får den bara nå Resend-test-adresser. Den naturliga
gissningen — härled prod-vs-icke-prod ur `AIRTABLE_BASE_ID` — avvisades: projektets DOKUMENTERADE felläge ÄR
bas-förväxling (T34 = CLI prod-länkad; ADR-050 T2 = staging/prod delar tabell-ID:n). En spärr bunden till samma signal som
redan kan vara förväxlad är ingen spärr. Lösningen: en ORTOGONAL `ENVIRONMENT`-flagga, **fail-closed** — `isProd` är sant
ENBART vid explicit `ENVIRONMENT==='production'`; frånvarande, feltypad eller okänd → icke-prod → vägra riktiga mottagare.
Den enda vägen till den farliga handlingen är ett explicit, medvetet positivt värde; en glömd/felaktig flagga failar mot
TYSTNAD (ingen riktig sändning), aldrig mot fel-utförande. REGEL: bind aldrig en irreversibel-handlings-grind till en signal
som delar felläge med det den ska skydda mot; använd en oberoende positiv-flagga, fail-closed. Hub-lyft pending — Fas 6.

### L207 [UNIVERSAL] — Vid oåterkallelig extern sidoeffekt: bevisa kärnan med NOLL I/O först, mocka den oåterkalleliga gränsen tills sist, låt första-riktiga-utförandet stå ensamt

Datum: 2026-06-28 | Källa: Session 39 (Fas 6h L1→L2d-splitten, risk-isolation)
send-email-bygget delades så att risken steg monotont och sent: **L1** ren `prepareBulkSend` (consent/dedup/chunk/status,
NOLL I/O, 18 enhetstester) → **L2b** EF + orkestrator med Resend MOCKAD via injicerad `BatchSender` (14 kontraktstester,
noll riktiga anrop) → **L2c** deploy + nyckel-OBEROENDE HTTP-kontrakt (401/405/400, gate live, ingen send) → **L2d** den
RIKTIGA gränsen (Resend mot test-adresser) ensam, grindad på nyckel. Varje lager bevisade mesta möjliga med minsta möjliga
oåterkallelighet; den oåterkalleliga gränsen mockades tills allt RUNT den var bevisat, och dess första skarpa körning
isolerades till en egen landning. REGEL: för irreversibla effekter (mail/betalning/extern-write), strukturera bygget som
en risk-trappa — pur kärna → mockad gräns → deploy utan effekt → ensam skarp gräns — så att en bugg fångas i ett lager utan
oåterkallelig effekt. Generaliserar EF-bygge-vs-deploy-splitten (create-event L1/L2/deploy) till en risk-ordnings-disciplin.
Hub-lyft pending — Fas 6.

> **Not (ej ny lesson — re-applicering av L189/L_J):** ett säkerhets-relevant "vi kan inte"-antagande verifieras mot
> faktisk data och görs aldrig lastbärande overifierat. "Inget Resend-konto" separerades i VERIFIERAT (ingen send-kod på
> disk / L1 noll-I/O / Resend-domän-spärr) vs ANTAGET (ingen nyckel); antagandet vägrades som garanti (spärren byggdes
> nyckel-oberoende, L206), sedan verifierat empiriskt (L2a `secrets list` → läge 1). Samma princip som L189 (förbyggt
> schema = hypotes tills korsat mot live), applicerat på en kapabilitets-/state-frånvaro i stället för ett schema.
>
> **Not (reinforce T34):** CLI:t var prod-länkat igen i L2c (`projects list` ● = prod); explicit `--project-ref` +
> target-verifiering före varje deploy höll (L115). Mönstret upprepar sig → T34 förblir levande tråd tills CLI-länk-vanan
> ersätts strukturellt.

## 2026-06-28 — Session 40 (Fas 6h L2d — riktig Resend-gräns: svar-parsning + staging-live-verifiering)

> Hub-lyft EJ nu — L193–L210 lyfts samlat efter FULLT Fas 6 (pending).

### L208 [UNIVERSAL] — Permissive-batch-svar: `errors` är FRÅNVARANDE (ej tom array) vid noll rad-fel, och accepted härleds via index-KOMPLEMENT (ej via de giltigas ordning)

Datum: 2026-06-28 | Källa: Session 40 (Fas 6h L2d, Resend permissive-parsning + STEG-0 strukturobservation)
Resends permissive-batch-svar (`CreateBatchSuccessResponse`) är `{ data: { id }[], errors?: { index, message }[] }`: `data.data`
bär de GILTIGA raderna KOMPAKTERAT (bara id, ingen e-post), `errors` bär de ogiltiga med NOLLBASERAT index + skäl. Två fällor
STEG-0-observationen avtäckte mot resolverad `resend@4`: (1) `errors` är **FRÅNVARANDE (undefined)**, inte en tom array, när inget
rad-fel finns — naiv `data.errors.forEach` kraschar → måste `Array.isArray`-grindas; (2) eftersom `data.data` är kompakterat och
id-only kan accepted INTE mappas via dess ordning till e-post — accepted måste härledas som **index-komplementet** till
`errors[].index` över originalbatchen (rejected = `batch[index].email`, accepted = resten). En `data.data.length`-cross-check
fångar struktur-drift men index-komplementet är auktoritativt. REGEL: vid partial-svar från en extern batch-gräns, härled utfallet
ur FEL-indexen mot din egen kända input — lita aldrig på att framgångs-listan är ordnings-parallell med requesten, och behandla ett
frånvarande fel-fält som "noll fel", inte som en bugg. Hub-lyft pending — Fas 6.

### L209 [UNIVERSAL] — Live-isolera ett resolutions-baserat write-vertikal-test genom ett TOMT nyckel-par + EF:ens egen räkning som bekräftelse — inte genom schema-mutation eller unik testdata

Datum: 2026-06-28 | Källa: Session 40 (Fas 6h L2d, staging-fixtur för segment→send)
send-emails happy-path-test krävde ett segment som löser upp till exakt seedade test-adresser. Resolutionsnyckeln (Deltagandens
`Kursnamn`) är en LOOKUP av ett CONSTRAINED singleSelect (`Event (source)`) → en unik "testkurs" kunde inte fabriceras, och
schema-mutation (ny option) var utanför L2d:s gränser. Lösning: välj ett `(kurs × modalitet)`-par som live har NOLL kvalificerade
medlemmar (staging hade bara 3 RIM/Utbildning-rader → `Psionautics/Utbildning` + `Fjärrskådning/Utbildning` var tomma), seeda ENBART
test-personerna i det paret, och låt EF:ens egna `requested`-räkning i svaret bekräfta att segmentet löste upp till EXAKT seed-mängden
(requested=2 = de två seedade → inget annat matchade). REGEL: när du inte kan göra testdatan unik, gör KONTEXTEN tom och verifiera
isoleringen via systemets egen räkning, inte via antagande; och riv den efemära fixturen efter (basen är leverabel). Hub-lyft pending — Fas 6.

### L210 [UNIVERSAL] — När en svarsform bara kan observeras där en server-only secret lever (deployad EF) och CLI saknar logg-läsning: en engångs throwaway-probe (struktur-only, no-verify-jwt, raderas direkt) är den rena observations-kanalen

Datum: 2026-06-28 | Källa: Session 40 (Fas 6h L2d STEG 0, Resend-svarsform mot resolverad version)
L2d behövde observera den FAKTISKA `resend@4`-svarsformen FÖRE parsningen designades hårt — men staging-`RESEND_API_KEY` finns BARA i
en deployad EF (aldrig lokalt, läses/echo:as aldrig) och den installerade Supabase-CLI:n saknade `functions logs`. Lösningen var en
engångs throwaway-funktion (`--no-verify-jwt`, skickar bara till `@resend.dev`-test-adresser, returnerar ENBART struktur — `Object.keys`,
`Array.isArray`, längder, `typeof id`, errors-närvaro — aldrig content/id-värden/nyckel), deployad mot staging, anropad en gång, sedan
raderad (staging + disk) och ALDRIG committad. Den bekräftade `{data:{data:[{id}]}}` + frånvarande `errors` → grön STOPPA-grind innan
STEG 1. REGEL: en empirisk observation som kräver en server-only-hemlighet görs där hemligheten redan lever, via en minimal struktur-only
sond som inte exponerar något och inte överlever observationen — inte genom att flytta hemligheten eller bygga parsningen blint. Hub-lyft pending — Fas 6.

## 2026-06-28 — Session 41 (Fas 6h L3 — klient: compose-UI + adapter + e2e)

> Hub-lyft EJ nu — L193–L211 lyfts samlat efter FULLT Fas 6 (pending).

### L211 [UNIVERSAL] — Verbatim Chat-text i en lint-governad fil ärver filens lint-governance; handoffen delegerar normalisering + lokal lint till Code

Datum: 2026-06-28 | Källa: Session 41 (Fas 6h sessionsstart, doc-birth markdownlint-miss, klass: handoff-disciplin / governed-file)

När Chat lämnar verbatim text (sessionsdok-scope, ADR-utkast) som Code transkriberar in i en markdownlint-governad fil, blir Chat:s
formatering det som grindas. Chat:s naturliga formatering (t.ex. `-`-bullets, lös blankrads-disciplin) matchar inte nödvändigtvis
repo-konventionen (här: MD004 `+`-bullets, MD022/MD032 blankrads-omgärdade headings/listor). Fixen hör hemma hos Code (som äger
linter:n), inte hos Chat: doc-birth-/transkriptions-handoffen ska EXPLICIT kräva att Code normaliserar till repo-markdownlint-
konventionen + kör linter:n lokalt FÖRE commit (skill steg 10 som HÅRD handoff-grind, ej valfritt skill-steg). Annars fångar CI det
efteråt — icke-blockerande men en extra fix-commit. Generaliserar: när Chat:s output blir Code:s commit-artefakt i en governad fil,
bär handoffen normaliserings-kravet — anta aldrig att ad-hoc-formatering passerar grinden. Hub-lyft pending — Fas 6.

### L212 [UNIVERSAL] — En framgångs-status på en noll-effekt-operation är en ärlighetslucka; en operation som kan no-op:a behöver ett distinkt utfall och får aldrig skriva en fantom-rad

Datum: 2026-06-28 | Källa: Session 41 (Fas 6h L3 + arch-audit, klass: korrekthet / utfalls-ärlighet)

En operation vars normala svar är "lyckades" kan ha ett gräns-fall där den inte gjorde någonting — tomt indata, alla mottagare
bortfiltrerade av en grind (consent/e-post), belopp noll. Att klumpa det fallet med framgång ger två defekter: (1) UI:t visar grön
framgång för en handling som aldrig hände — aktivt vilseledande, särskilt för en icke-teknisk användare på en oåterkallelig handling;
(2) operationen skriver en logg-/historik-rad för något som aldrig skedde (fantom-rad som förorenar nedströms-läsvyer). Regel: en
operation som KAN no-op:a behöver ett DISTINKT utfall i sin status-taxonomi (t.ex. 'skipped' ⊥ 'sent'/'partial'/'failed'), klienten
renderar det icke-som-framgång, och noll-effekt skriver INGEN biverknings-rad. Generaliserar "partial-failure aldrig binär" (ADR-067
D3) nedåt: "inget hände" är ett tredje utfall, inte en undertyp av framgång. Process-not: fångades av arch-auditens edge-case-honesty-
check (område iv, omdöme), inte av de mekaniska områdena — och Chat omklassade avvikelsen från auditens försiktiga "ovanför golvet"
till golv (falsk framgång + fantom-rad på oåterkallelig handling = golv, ej finish). Hub-lyft pending — Fas 6.

## 2026-06-29 — Session 42 (Fas 6e retro-audit T38 — golv-gap stängt, 6e förstklassigt klar)

> Hub-lyft EJ nu — L193–L214 lyfts samlat efter FULLT Fas 6 (pending).

### L213 [UNIVERSAL] — Session-end do-confirm bör korsläsa deklarerad-vs-levererad scope vid mid-session-rescope

Datum: 2026-06-29 | Källa: Session 42 (Fas 6e retro-audit, klass: avslut-disciplin / scope-kontinuitet)

När en sub-landning rescopas mitt i en session kan en syskon-scope-post tyst föräldralös-göras. Empiri: Session 33 stängde
"6e levererad" men 6e:s deklarerade skal-post (d) "Inställningar + logga ut" byggdes aldrig — den föll mellan stolarna när L3
("Skicka mail") rescopades till 6g/6h och sessionen stängdes. Luckan fångades först av 6e:s arch-audit (Session 42), nio sessioner
senare. Regel: session-end do-confirm bör EXPLICIT korsläsa fasens/sessionens deklarerade scope-poster mot levererade artefakter,
särskilt när en landning rescopats mid-session — en rescope flyttar fokus och kan lämna en deklarerad post obyggd utan att någon
markerar den som de-scopad eller deferred. Generaliserar do-confirm-passets killer-item-logik: "levererade vi det vi sa att vi
skulle?" är inte samma fråga som "är det vi byggde korrekt?". Hub-lyft pending — Fas 6.

### L214 [UNIVERSAL] — Chats forensiska pre-pass bör validera inlinade specifika mot disk-konventioner FÖRE leverans

Datum: 2026-06-29 | Källa: Session 42 (doc-birth markdownlint-miss + testfilnamns-miss, klass: handoff-disciplin / drift-vid-källan)

Chat-self-fångst är empiriskt ~9 %; två drifter i Session 42 nådde Code (fångade där, ~64 %): (i) inlinat Del-1-innehåll bröt
markdownlint (MD032 tomrad-runt-listor ×2 + MD004 listmarkör-fortsättningsrad); (ii) inlinat testfilnamn `mer.spec.ts` matchade ej
projektets testMatch `**/*.staging.test.ts` → ett dött test som aldrig körts. Regel: före leverans av en Code-prompt med inlinade
specifika (verbatim filinnehåll, fil-paths/namn), validera mot projektets faktiska disk-konventioner — markdown-lint (tomrad runt
listor; ingen fortsättningsrad som börjar med en listmarkör) + fil-path/namn mot projektets test-match-glob (`*.staging.test.ts`, ej
`*.spec.ts`). Bygg fortsatt för extern fångst (Code/Marcus), men skär driftfrekvensen vid källan — en drift som aldrig levereras
kostar noll fix-cykler. Speglar L211 (verbatim-text ärver fil-governance) en nivå upp: inte bara linta efter transkription, utan
validera specifikan FÖRE den lämnar Chat. Hub-lyft pending — Fas 6.

## 2026-06-29 — Session 43 (Fas 6g Skool-export prod-deploy — risk-trappa STEG 0–4')

### L215 [UNIVERSAL] — För irreversibel mål-bindning: verifiera mot live-källan i handlings-ögonblicket, inte mot en lokal state-fils timestamp

Datum: 2026-06-29 | Källa: Session 43 (STEG 0, prod-deploy-ref-bindning; förfining av T34/L115)

STEG 0 fann en divergens: `supabase/.temp/linked-project.json` (timestamp 28 jun, nyare) sa CLI länkad mot STAGING, men live
`supabase projects list` ● = PROD (`lvjsfnphlauldxqlncpl`). En nyare cache-/state-fils timestamp bevisar INTE aktuell länkning —
state-filer kan skrivas av sido-operationer och driva isär från den auktoritativa live-källan. Regel: för en IRREVERSIBEL
mål-bindning (deploy-ref, env-target, prod-vs-staging) verifiera mot LIVE-källan (`projects list` ●, ej `.temp`-fil) i samma
handlings-ögonblick som mutationen — och passa målet EXPLICIT (`--project-ref <ref>`) så ingen ambient länk-state avgör vart
mutationen går. En lokal recency är ett svagt indicium, aldrig ett bevis. Förfining av T34 (CLI prod-länkad foot-gun) + L115:
verifiera mot live, anta aldrig från lokal fil. Hub-lyft pending — Fas 6.

### L216 [UNIVERSAL] — När en deklarativ allowlist växer men medlemmars deployade aktualitet divergerar är smal override ett KRAV, inte en optimering

Datum: 2026-06-29 | Källa: Session 43 (STEG 1+3, allowlist 7→10 mot 5 stale prod-EF:er; skärper T39)

6g lade 3 EF:er i `.prod-functions-allowlist.conf` (7→10). Allowlisten deklarerar nu 10 prod-AVSEDDA funktioner — men 5 av dem
(T39) ligger på prod i versioner äldre än staging-testad HEAD. En blind kanonisk `deploy-prod-functions.sh --project-ref <prod>`
deployar HELA allowlisten → skulle föra de 5 stale förbi sin verifierade version i en oscopead svep. 6g-deployen höll genom
`ALLOWLIST_FILE`-engångsoverride (endast de 3) + untouched-proof (de 8 pre-existerande oförändrade, live-verifierat). Regel: när
en deklarativ allowlist (deploy/feature-flagg/release-manifest) växer men medlemmarnas deployade AKTUALITET divergerar från
deklarationen, är smal override per-handling ett KRAV tills aktualiteten synkats — och divergensen måste spåras durabelt (T39),
inte bäras i minne. "Deklarerad-avsedd" ≠ "säker-att-blint-redeploya". Hub-lyft pending — Fas 6.

### L217 [UNIVERSAL] — Deploy-tids deny-grind bevisar nekan, inte korrekthet; deklarera vilken nivå ett grind-bevis når

Datum: 2026-06-29 | Källa: Session 43 (STEG 4', 6g deny-grind vs deferrad happy-path-smoke = T40)

STEG 3 bevisade de 3 prod-EF:ernas NEKA-vägar (anon→401, fel metod→405, anon-Bearer→401) read-only — noll oautentiserad åtkomst,
utan att smutsa prod-data. Men deny-grinden bevisar INTE att save-segment SKRIVER rätt mot prod-basen: den autentiserade
201-happy-path kördes aldrig (skulle skapa en riktig Segment-rad → kräver prod-test-user via rätt kanal = T40). Regel: skilj
"grinden nekar" (read-only, vid deploy, säkert utan prod-data-mutation) från "featuren fungerar" (autentiserad körning mot prod,
separat verifiering) — och deklarera EXPLICIT vilken nivå ett deploy-grind-bevis når, så `ACTIVE`-status + grön deny-grind ej
förväxlas med verifierad skriv-korrekthet. En prod-deployad write-EF med grön deny-grind är säkrad mot obehörig åtkomst men
overifierad på sin write-väg tills happy-path-smoken körs. Hub-lyft pending — Fas 6. Speglar T40-vidgningen (6g-instansen).

### L218 [UNIVERSAL] — En yta som tillgängliga verktyg ej kan enumerera är OVERIFIERAD tills den stängs av auktoritativ källa (bunden av sitt datum) + människo-bekräftelse för resten

Datum: 2026-06-29 | Källa: Session 44 (Grind D, auto-trigger-verifiering före skarp prod-deploy)

Före att en oåterkallelig spärr öppnas (här: send-email mot riktiga mottagare) måste varje väg-in uteslutas. Kod-vägar är
verktygs-verifierbara (grep/läs); Airtable-automationer är det INTE (MCP kan ej enumerera dem — projekt-guard). Fällan: läsa
"MCP visar inga" som "inga finns". Regel: behandla en verktygs-overifierbar yta som OVERIFIERAD och stäng den i tre lager —
(1) auktoritativ doc-källa (`data-model.md` A1–A11) som UTESLUTER, ej bara listar, MEN bunden av sitt export-datum (2026-03-16 →
kan ej täcka senare tillägg); (2) explicit människo-bekräftelse för post-datum-slivern (Marcus bekräftade tom); (3) strukturell
defense-in-depth som gör ytan ofarlig oavsett (JWT-barriär: `requireUser`→401 → en automation kan ändå inte autentisera). Deklarera
EXPLICIT vilket lager som bär vilken del; anta aldrig att en stale-bunden källa är uttömmande som-av-nu. Generaliserar bortom
Airtable: gäller varje verifiering där verktyget har en blind fläck (interfaces/vyer/extensions, externa konton, manuell config).
Hub-lyft pending — Fas 6. Besläktad L215 (live-källa vid handlingsögonblick) + L217 (deklarera grind-bevisets nivå).

## 2026-06-29 — Session 45 (T50 UI-härdning — accident-proof sänd-grind)

### L219 [UNIVERSAL] — Ett stale "BESLUTAT" i en active tråds bygg-ingång rättas FÖRE bygg-substansen, ej efter

Datum: 2026-06-29 | Källa: Session 45 (T50, Commit 0 före bygg-commit; klass: handoff-/ingångs-disciplin)

En "BESLUTAT"-rad i en `active` tråds bygg-ingång är inte bara dok-hygien: tråd-kortet ÄR bygg-promptens ingång, så ett stale
beslut där är aktivt vilseledande för bygget (bygget läser ingången som sann). När nästa sessions forensik reviderar beslutet,
rätta tråd-ingången (en egen Commit 0) FÖRE bygg-substansen — så ingången är sann i samma ögonblick bygget läser den, inte
städad i efterhand. Empiri: Code flaggade T50-kortets stale "BESLUTAT: med" (test-till-sig-själv) mot reviderat scope; rättat
som Commit 0 `e62c695` FÖRE bygg-commit `86835f9`. Generaliserar L211 (verbatim-text ärver fil-governance) + L214 (validera
inlinade specifika mot disk FÖRE leverans) till tråd-ingångens SANNINGSHALT: en ingång som en framtida läsare/bygge förlitar
sig på rättas före, inte efter, den handling som läser den. Hub-lyft pending — Fas 6 (L193–L219 ej hub-lyfta).

## 2026-06-30 — Session 46 (Fas 6h Mail skarpt — pivot till UI-spår)

### L220 [UNIVERSAL] — Korrekthets-grindar fångar inte presentationslager-skuld; ett byggflöde behöver en design-/UX-review-loop som förstklassig disciplin

Datum: 2026-06-30 | Källa: Session 46 (Steg 1, första UI-granskningen på 40+ sessioner; klass: process-gap)

Backend-korrekthets-disciplinerna (ADR:er, grindar, tester, a11y-baseline) var rigorösa, men ingen UI-/design-review-loop
fanns → presentationslager-skuld ackumulerades osynligt över 40+ sessioner och syntes först vid första UI-granskningen.
"Tillgängligt + funktionellt korrekt" ≠ "användbart/presentabelt": a11y-baseline (axe-0) och funktionell korrekthet bevisar
att en yta FUNGERAR, inte att den ser bra ut eller känns proffsig — de är ortogonala axlar, och bara den första var grindad.
Ett byggflöde behöver en design-/UX-review-disciplin som förstklassig loop, inte bara korrekthets-grindar. Backend-först-
sekvensen var sund (datakällan måste avtäckas före ytan) — luckan var avsaknaden av yt-review, INTE ordningen; en sund
sekvens utan en review-loop för det sist-byggda lagret ackumulerar tyst skuld i det lagret. Korrigerande arbetssätt definieras
i Session 47. Hub-lyft pending — Fas 6 (L193–L220 ej hub-lyfta).

## 2026-07-02 — Session 47 (Arbetssätt-spår: Pocock-integration — Del 6-landningen)

### L221 [UNIVERSAL] — Frontmatter-hooken bumpar INTE sessionsdok; updated: sätts manuellt

Datum: 2026-07-02 | Källa: Session 47 Del 6-landningen (manuell bump `5c125f8`; klass: prompt-premiss)

Pre-commit-hooken (`.githooks/pre-commit`) auto-bumpar `updated:` ENDAST på filer i exakt-path-allowlistan
`FRONTMATTER_GOVERNING_DOCS` (`.frontmatter-policy.conf`) — sessionsdok står medvetet utanför (bekräftat i
check-lifecycle-kommentaren: sessionsdok dras EJ in i frontmatter-checkarna). En prompt som förväntar hook-bump
på ett sessionsdok bär alltså en falsk premiss: bumpen sker inte, och `updated:` blir tyst stale. Regel:
framtida prompts SPECAR manuell `updated:`-bump för sessionsdok (och andra icke-listade filer), förväntar
aldrig hook. Detta är en instans av prompt-premiss-klassen [[L54]] (verifiera prompt-premisser mot faktiskt
disk-tillstånd — här: hookens faktiska allowlist, inte dess antagna räckvidd). Empiri: Del 6-landningen
förväntade hook-bump per prompt; `updated:` stod kvar på 2026-07-01 efter commit och rättades manuellt i
`5c125f8`.

### L222 [UNIVERSAL] — Radstarta aldrig wrapped markdown-prosa med listmarkör (+/-/*) — MD004 tolkar den som lista

Datum: 2026-07-02 | Källa: Session 47 Del 6-landningen (`ac606d7` röd → om-radbrytning `161d43a`; klass: docs-grind)

När löpande prosa radbryts så att en fortsättningsrad börjar med `+`, `-` eller `*` (t.ex. "grilling-kärna
[radbrytning] + tunn ingång") parsar markdownlint raden som ett list-item och fäller MD004/ul-style (repo-stil:
dash). Tredje bekräftade förekomsten i repo-historiken: todo (`e2b4a3b`), Del 5-eran (`86e16be`, Inc 3b) och
Del 6 (`ac606d7` → fix `161d43a`) — en etablerad felklass, inte en engångare. Regel vid radbrytning av prosa:
lägg tecknet sist på föregående rad, aldrig först på nästa. Chat-sidans motsvarighet: inlinat promptinnehåll
(verbatim-text som ska committas) valideras mot kända docs-grindar FÖRE leverans — verbatim-status skyddar inte
mot repo-grindar ([[L149]]: docs-grind som separat gate-steg fångar den lokalt; denna lesson adresserar att inte
INTRODUCERA klassen alls).

## 2026-07-03 — Session 47 (session-end-skörd: paus-kadens + intervju-fångstytor + L147-datapunkt)

### L223 [UNIVERSAL] — Paus-skrivningen ÄR en landning — todo-kadensen (L67) gäller även vid paus

Datum: 2026-07-03 | Källa: Session 47 paus 1–3 (todo-kadens-reparationen vid paus 3; klass: landnings-kadens)

S47 paus 1+2 pausade sessionsdoket men lämnade todo-huvudet oaktuellt; resume-rekonstruktionen korsläser
båda ytorna, så en osynkad todo ljuger för nästa session om aktuellt läge. Reparerad vid paus 3 och
mekaniserad i session-paus-skillen; klassen kvarstår: varje durabel tillståndsskrivning synkar ALLA
tillståndsytor den berör. Relaterad: [[L67]].

### L224 [UNIVERSAL] — Agent-ledda designintervjuer ska bära DESIGNADE fångstytor — extern fångst uppstår inte av sig själv

Datum: 2026-07-03 | Källa: Session 47 prövotids-datapunkterna 5–7 (Del 14/15/16; klass: intervju-mekanism)

Tre mekanismer, alla empiriskt utlösta i S47:s prövotid: disk-pass FÖRE första frågan prövar uppdragets
egna antaganden (dp7: avfyrningens kandidatlista korrigerad före intervjun; brasklappen "index-grundad,
inte facit" är en fångstyta, inte artighet), utforska-hellre-än-fråga kan riva EGNA tidigare hypoteser
(dp6: Del 12 vii riven med disk-evidens), och summerings-steget vid slutkvittens är människans fångstyta
(dp5: DECLINE→DEFER-korrigering i sista turen). Bygg alla tre in i intervju-avfyrningar.

### L225 [UNIVERSAL] — Fil-klassen "grind-config" inkluderar grindens TESTSVIT — en governing-set-ändring bär sin fixtur i samma commit

Datum: 2026-07-03 | Källa: Session 47 Del 9-addendum (fixtur-incidenten, fix `19db2a5`; daterad förstärkande datapunkt till [[L147]])

Symptom: ORDLISTA.md lades i `FRONTMATTER_GOVERNING_DOCS` (Del 9, `4047605`) med lokal verifiering av
`check-frontmatter.sh` (grön) — men grind-SVITEN `test-check-frontmatter.sh` speglar allowlistan i egen
fixtur och hårdkodar räkningen, och föll i CI (två röda runs) tills fixtur-raden + räkningen 13→14
landade (`19db2a5`). [[L147]]:s regel (kör den rörda fil-klassens FAKTISKA grinduppsättning lokalt)
förstärks med klass-precisering: när den rörda filen är grind-config ingår grindens testsvit i
fil-klassen — verifiera sviten, inte bara skriptet, före push.

## 2026-07-04 — Session 48 (T57-landningen: issues-substrat — grillning dp8 + minimal-test)

### L226 [UNIVERSAL] — Grind-klassen "verktygsägd yta": medvetet exkluderad ≠ ogovernad

Datum: 2026-07-04 | Källa: Session 48 Del 2 gren C + Del 3 kriterium iv (klass: grind-arkitektur; generaliserar pocock-korpus-precedensen till namngiven klass)

Filer som ägs och muteras av ett externt verktyg (Backlog.md-korten: verktygsägt frontmatter-schema,
CLI-muterad metadata, agent-redigerbar kropp) ska inte prosa-lintas — att köra markdownlint/Vale på dem
vore att grinda ett annat verktygs output, med lint-rött mitt i arbetsloopen som pris. Klassens riktiga
grindar: verktygets egen validering (frontmatter-schemat), git-historik per commit genom repots hooks,
CI-klassning av commits, och mall-/DoD-nivåns semantiska grind. Skiljelinjen är MEDVETENHET: dokumenterad
exkludering med rationale där beslutet bor (L30-durabelt) är governance — en tyst lucka är det inte.
Prövning vid varje ny fil-yta: vilken klass tillhör ytan (vår prosa / extern korpus / verktygsägd yta),
och är exkluderingen BESLUTAD eller bara ohanterad? Relaterad: [[L225]] (grind-config-klassen).

### L227 [UNIVERSAL] — Ett förtroende-formulerat lås ("jag litar på dig") är inte samsyn — konvertera till genuin förståelse FÖRE låset bokförs

Datum: 2026-07-04 | Källa: Session 48 gren A (dp8) + Session 47 Del 12 gren B (dp3) — andra instansen mintar klassen (klass: intervju-mekanism; komplement till [[L224]] — fångstytan vid själva LÅSET)

Två gånger i prövotiden har ett gren-lås formulerats som förtroende i stället för förståelse ("jag litar
på att du har koll", dp3; "litar ändå på det du säger", dp8). Ett sådant svar är en
FÖRSTÅELSE-LUCKA-SIGNAL, inte en kvittens: låset ser ut som samsyn men bär ingen. Regeln: agenten
konverterar FÖRE bokfört lås — via konkretisering på Gunilla-nivå (dp3) eller fullständig
trade-off-redovisning åt BÅDA håll inklusive vad rekommendationen KOSTAR + förstaparts-bevis (dp8) — och
ställer sedan lås-checken igen. Båda instanserna konverterade utan defekt efteråt; [[L224]]:s tre
fångstytor täcker avfyrning/utforskning/slutkvittens, denna täcker lås-ögonblicket.

## 2026-07-04 — Session 49 (fork 4-bygget: PRD-/skiv-mekaniken levererad hub + spoke)

### L228 [UNIVERSAL] — Mekaniskt atomiska fil-kluster enumereras som KLUSTER i prompter, aldrig som fil-lista

Datum: 2026-07-04 | Källa: S49 p.2 (marketplace.json utanför promptens C5-lista; Code-utökning per trail,
code-role-discipline §1.3) (klass: prompt-design/handoff; syskonklass till [[L225]] på grind-sidan)

Chat-promptens fil-enumeration bar plugin.json solo trots att version-bumpen mekaniskt kräver BÅDA
manifesten atomiskt (S47-trail + L55-ritualen — utan marketplace-bumpen hittar ritualen ingen ny
version). Code planerade mot rapporten/trailen, inte bokstaven, och utökade ÖPPET — extern fångst i
Code-riktningen. Regeln: när en prompt räknar upp filer i en mekaniskt sammanhängande operation
(manifest-par, grind+fixtur, config+testsvit) anges KLUSTRET och dess invariant — fil-listan är
re-deriverbar ur trail, invarianten är det som bär.

> **Rättelse (2026-07-31, S91 nittonde pausen):** instansens bärande premiss — att version-bumpen
> *mekaniskt* kräver båda manifesten atomiskt ("utan marketplace-bumpen hittar ritualen ingen ny
> version") — är mätt falsk. Hubbens `marketplace.json` har stått still på `1.12.0` sedan
> 2026-07-07 (hub `1f45767`) medan `plugin.json` gått `1.12.0` → `1.24.0` (tolv minor-steg);
> plugin-uppdateringen fungerade skarpt genom hela driften, senast 2026-07-31
> (`installed_plugins.json`: version `1.24.0`, installPath `…/cache/marcus-hub/marcus-system/1.24.0`,
> `lastUpdated 08:41Z`). Marketplace-bumpen är alltså konvention, inte mekanism. Regeln ovan står —
> kluster + invariant, inte fil-lista — men manifest-paret är ett falsifierat exempel på mekanisk
> atomicitet. Samma premiss bärs av [[L79]] här och av hub-kopiorna K49.1/K12.3 — denna not rättar
> endast L228.

### L229 [UNIVERSAL] — Form som ska överleva ett externt verktygs round-trip bevisas i sandbox FÖRE bygget

Datum: 2026-07-04 | Källa: S49 p.2 sandbox-grind B (###-mallformen genom Backlog.md create→fil→edit)
(klass: designad fångstyta; [[L224]]-släkt, [[L226]]-granne)

PRD-mallens ###-form var en hypotes om ett externt verktygs round-trip-beteende. Grinden lades som
FÖRKRAV före första repo-skrivningen: engångs-sandbox med tre kriterier (agent-vyn läsbar;
fil-sektionen tecken-intakt; efterföljande edit förstör inte), FAIL ⇒ STOPPA för omdesign. Utfallet
var grönt — men regeln är ordningen: verktygsberoende form-antaganden bevisas empiriskt innan de
hårdkodas i mekanik (skills, mallar, configar).

### L230 [UNIVERSAL] — Ett rivet vägval korrigerar PÅGÅENDE durabla skrivpass före landning — NÄSTA-rader och kandidatordningar är tillståndsytor

Datum: 2026-07-04 | Källa: S49 end-passet (UI-först riven av Marcus-pushback medan end-blocket
exekverade; landade ändå i todo/BUILD-LOG/sessionsdok → rättelse-landning samma dag) (klass:
landnings-kadens; [[L223]]-syskon, [[L30]]-granne)

När ett vägval rivs medan ett durabelt skrivpass som bär det redan exekverar, korrigeras passets
text FÖRE landning — intercept, eller omedelbar följd-rättelse i samma flöde. Rationalet "det är
bara en kandidatlista, verkligt val sker vid nästa start" är exakt den deferred-sync-lögn [[L223]]
förbjuder: nästa session orienterar på NÄSTA-raden, så en superseded ordning där ÄR
feldokumentation. Rot-regeln för själva ordningsfelet: dokumenterad beroendekedja slår
värde-argument när de kolliderar — sekvensbeslut mellan sessioner härleds ur kedjan, inte ur
närmsta värde-case.

## 2026-07-05 — Session 50 (do-work-landningen: grillning dp9 + hub-plugin 1.8.0)

### L231 [UNIVERSAL] — Exekverings-tids-värden i prompter bär derivations-regel, inte förhandsvärde — även i direktiv-delen

Datum: 2026-07-05 | Källa: S50 dok-födelse (Chat-promptens filnamn `2026-07-04-session-50.md`
författat pre-midnatt, exekverat post-midnatt; create-session-doc steg 5:s `date +%F`-mekanism
styrde → 2026-07-05-namnet, öppet flaggat i rapporten) (klass: prompt-design/handoff;
[[L228]]-syskon på värde-axeln tid; fångst-topologi: Chat-lucka → Code-MEKANISM, ej Code-omdöme)

En prompt författas FÖRE sin exekvering — varje inbakat värde som är en funktion av
exekverings-tillstånd (klocka/datum, HEAD, counts, aktiv version) kan stalea i gapet.
S50-promptens FÖRVÄNTNINGAR bar korrekt brasklapp ("index-antagna, DISK ÄR FACIT") men filnamnet
stod i DIREKTIV-delen och gick stale över midnatt — direktiv-klädd tillståndsdata undgår
brasklapp-disciplinen. Regeln: exekverings-tids-värden anges som derivations-regel (`date +%F`;
"nästa efter sista på disk"; "aktiv version per install-record"), aldrig som förhandsberäknat
värde — [[L228]]:s invariant-princip generaliserad från fil-kluster till tids-/tillståndsaxeln.
Fångsten var MEKANISK (create-session-doc steg 5, byggd på Session 12-empirin), inte omdöme i
stunden — lesson→mekanism-kedjan betalade sig vid första verkliga midnatts-driften.

## 2026-07-05 — Session 51 (övnings-ramverkets inramnings-landning: dp10 + ADR-068 + restlista-reparationen)

### L232 [UNIVERSAL] — "Dokumenterad" bevisas med orienterings-test, inte existens-test — en klumprad bär bara namngivna poster

Datum: 2026-07-05 | Källa: S51 restlista-passet (AFK/Ralph-loopen: routad S47, trigger armerad
S50, dokumenterad i fyra stängda ytor — och OSYNLIG från alla levande ingångar;
klumprad-degraderingen S49→todo tappade 3 av 5 migrerings-bunts-poster) (klass:
kontinuitet/orienterbarhet; [[L26]]-förfining, [[L223]]-granne)

Existens-testet ("finns X i någon fil?") och orienterings-testet ("hittar nästa session X från
levande ingångar — todo-huvud, tråd-register, README?") ger olika svar så fort bäraren är ett
stängt dok — stängda sessionsdok är inte bärare. Svaret på "är X dokumenterat?" ska därför ange
vilket test som körts. Operativ regel för samlingsrader: en klumprad ("bunt X (inkl. A + B)")
bär ENDAST de poster som är NAMNGIVNA i radtexten — osynliga medlemmar dör vid nästa omskrivning
(S49→todo: fem poster blev två; tre dog med sessionsstängningen och återfanns först av ett
riktat orienterings-test).

### L233 [UNIVERSAL] — Post-close-beslutsfönstret säkras med omedelbart säkringspass — beslut mellan close och nästa start har ingen egen kadens

Datum: 2026-07-05 | Källa: S49-korrigeringsnoten + S50→S51-säkringspasset (två datapunkter:
NÄSTA-ordning riven/supersederad i chatt EFTER session-close; båda krävde ad hoc-commit före
nästa session-start) (klass: landnings-kadens; [[L26]]-komplement på tidsaxeln,
[[L230]]-syskon)

Session-end har redan kört och nästa session-start har inte börjat — beslut fattade i det
fönstret ägs av INGET pass och dör med chatten om de inte säkras aktivt. Mönstret (nu 2/2):
omedelbart säkringspass i spoken — levande bärare (todo-huvud/scope-sektion) uppdateras + öppna
korrigeringsnoter på de stängda dokens NÄSTA-ytor ([[L230]]-disciplinen, öppen supersedering,
aldrig tyst) — INNAN nästa session-start orienterar. Vänta-till-nästa-start är exakt den
deferred-sync-lögn [[L223]] förbjuder: starten orienterar på NÄSTA-raderna, som då ljuger.

## 2026-07-05 — Session 53 (T62: lifecycle-verbens Code-körbarhet — ADR-069 + plugin 1.10.0)

### L234 [UNIVERSAL] — slash-only-skills avfyras via manuell cache-läsning när användaren klistrar slash-prompten som meddelande-text

Datum: 2026-07-05 | Källa: S53 grillnings-avfyrningen (/grill-with-docs klistrad som text →
Skill-verktyget vägrade: "cannot be used with Skill tool due to disable-model-invocation")
(klass: skill-mekanik/invokering; [[L55]]-granne)

`disable-model-invocation: true` blockerar Skill-VERKTYGET oavsett vem som initierade — även
när användaren själv skrivit slash-kommandot i sitt meddelande (i stället för att CLI:t fångat
det som äkta slash-anrop). Rätt hantering: läs SKILL.md direkt ur den AKTIVA versionens
plugin-cache-katalog och exekvera proceduren manuellt — flaggans SYFTE (agenten auto-startar
aldrig) är inte hotat när initiativet bevisligen är användarens; notera avvikelsen öppet i
trailen. Fel hantering: be användaren skriva om kommandot (friktion utan vinst) eller tolka
verktygs-vägran som att skillen är otillgänglig (den ligger läsbar på disk).

## 2026-07-06 — Session 52 (UI-spårets start: första skarpa hel-kedje-körningen /to-prd → /to-issues → /do-work)

### L235 [UNIVERSAL] — Grind-exit får aldrig pipe-maskeras — separera körning från presentation

Datum: 2026-07-06 | Källa: 4 empiripunkter S51–S52 (S51-trailen; S52 Del 3-grindpasset
[motexemplet: OPIPAD exit fångade MD004 före commit]; Del 7 CI-watchen [`gh run watch | tail`
åt röd run-exit — run:en var röd trots "exit 0"]; Del 10-stängningen [`markdownlint | tail -1`
åt MD032-felet → grön-maskerad lokal grind → CI-röd push `aa3434a`, fix `76785b5`])
(klass: grind-disciplin/shell; [[L147]]-granne)

`<grindkommando> | tail/grep/head` returnerar PIPENS exit-kod, inte grindens — rött blir tyst
grönt och upptäcks först i CI (symptomklass: "lokalt grönt, CI rött på samma check"). Regeln:
kör grinden NAKEN så dess exit äger raden; presentera utdata i ett SEPARAT kommando/steg.
`set -o pipefail` är golv i skript, men separationen är regeln — presentation och verdikt är
olika ansvar.

### L236 [UNIVERSAL] — Final-summaryns commit-SHA/CI-run är själv-referentiella — kort med efter-grindar stängs i uppföljnings-commit

Datum: 2026-07-06 | Källa: Del 7 first-run-processfyndet (task-1.1); mönstret bekräftat på
samtliga S52-kort (task-1.1/1.3/1.4/1.2 + TASK-2: kod-commit → CI per jobb/design-review →
stängnings-commit) (klass: issue-substrat/leverans-kadens)

"Stäng kortet i SAMMA commit som koden" är onåbar när final-summary ska bära kodens SHA +
CI-run-ID (kända först EFTER push) och DoD bär efter-commit-grindar (CI grön per jobb,
design-review i browsern). Normen för sådana kort: kod-commit (kort-token i meddelandet) →
grindar/review → stängnings-commit med kort + final-summary + dok-kadens. Avvikelsen från
EN-commit-normen deklareras öppet — den är strukturell, inte slarv.

### L237 [UNIVERSAL] — Prototyp-svaret är grillningen; justeringar = byggkrav; helhets-missnöje = nytt konvergens-pass

Datum: 2026-07-06 | Källa: Del 4 (svar-fångsten: A-vinnaren + byggkrav, prototypen raderad —
aldrig itererad i valet); Del 8 (T65: kvitterad AC-match MEN helhets-missnöje → klassad NY
designinput, inte granskningsfailure); T66 (Marcus-kvitterad stående tvåfas-form: divergens
3 varianter → val → konvergens-iteration till nöjdhet [befintlig yta startar som EXAKT kopia
av faktiska vyn] → skarpt genom leverans-grindarna; återkommande vid senare ändringsbehov)
(klass: design-process; HUR:et migreras till prototype-skillen via [[T66]])

Små justeringar vid svar-fångsten blir BYGGKRAV på kort — prototypen itereras inte i
valfasen. Men helhets-missnöje med det VALDA är en annan signal: det öppnar ett
KONVERGENS-pass (iterera prototypen tills nöjd, sedan skarpt bygge). Granskningsgrinden
prövar leverans-mot-beslut; beslutet självt omprövas i prototyp-passet — två olika loopar,
båda legitima, aldrig sammanblandade.

### L238 [UNIVERSAL] — Klassnings-praxis: kort = kan bli en commit; tråd = behöver bli ett beslut först

Datum: 2026-07-06 | Källa: Del 7-efterspel 2 (Marcus-kvitterad, Pocock-grundad; TASK-2
omscopad till byggbar spec + purge-cred-vägvalet utbrutet → T64); tillämpad på T65
(designbeslut → tråd) + T66 (skill-design → tråd) + TASK-3 (byggbar härdning → kort)
(klass: issue-substrat/triage; ADR-053-komplement)

Fynd med byggbar spec (exakt symptom + förväntat beteende) → KORT, fött oetiketterat
("Fynd:"-titelprefix; oplockbart tills människan klassar). Allt som kräver ett väg-, design-
eller arkitekturbeslut först → TRÅD; kortet föds ur tråden när beslutet är taget. Testet är
en fråga: "kan detta bli en commit utan att någon först beslutar något?"

### L239 [UNIVERSAL] — CLI-write-flaggor: aldrig oavsiktliga värden; läs-tillbaka direkt efter skrivning

Datum: 2026-07-06 | Källa: Del 8 (kortstängningen task-1.3: slarvig command-substitution gav
`--notes "keep"` → Implementation Notes TYST ÖVERSKRIVNA; direkt `task view` efter skrivningen
fångade förlusten → reparation ur sessions-kontextens originalläsning) (klass:
verktygs-disciplin; [[L191]]-släkt [skriv-verifiering])

Fält-flaggor i verktygs-CLI:er skriver destruktivt utan diff-preview — en flagga med
icke-avsett värde är tyst dataförlust. Två regler: (1) bygg aldrig write-anrop med "smarta"
substitutioner/uttryck i flagg-värden — skriv värdet explicit eller utelämna flaggan; (2) läs
tillbaka det skrivna objektet OMEDELBART efter varje CLI-skrivning — läs-tillbaka-passet är
fångstnätet som bevisligen fungerade.

### L240 [UNIVERSAL] — Stash-forensik avgör pre-existing vs diff-orsakad testfailure före åtgärd

Datum: 2026-07-06 | Källa: Del 8 (narvaro/vantelista-loading 3/6 röda på STASHAD main →
TASK-3 född med bevis) + Del 10 (person-detail-loading 3/3 röd på main under last → tredje
fil-instansen bokförd, tabbar-diffen friad) (klass: test-forensik; [[L176]]/T26-släkt)

När ett till synes orelaterat test faller under kort-arbete: klassa INNAN åtgärd via
`git stash push` → kör testet `--repeat-each` mot oförändrad main → `git stash pop`.
Pre-existing → fynd-kort med beviset inbakat; diff-orsakad → egen defekt, fixa i skivan.
"Det är nog en flake" utan motbevis är gissning — forensiken tar två minuter och ger
klassningen evidens i stället för hopp.

### L241 [UNIVERSAL] — Vilande/WIP-beslut refereras nummer-neutralt — ADR-nummer binds vid minting

Datum: 2026-07-06 | Källa: Del 1 G3-noten (scope-punktens verbatim "ADR-068 p.8" pekade på
disk mot FEL beslut — 068 hade förbrukats av övnings-ramverket; referenten var två-aktörs-ADR:n
[WIP]); S51 beslut 3 hade redan låst nummer-neutral benämning — glidningen kom ändå via
direktiv-verbatim (klass: doc-integritet; [[L230]]-släkt)

Ett onumrerat beslut (WIP/vilande) refereras med NAMN ("två-aktörs-ADR:n"), aldrig med
antaget nummer — nummer binds först vid minting mot disk (nästa lediga re-verifieras då).
Verbatim-nummer i inkommande direktiv/scope-texter disk-verifieras vid ingång och noteras
öppet vid divergens (G3-klassen) i stället för att propagera.

### L242 — Migrerad akter återinför sig via erbjudanden — förkasta explicit med routing

Datum: 2026-07-06 | Källa: Chat-trail-kandidaten (paus 1-handoffen, förmedlad 2026-07-05):
två S52-instanser samma riktning (Chat föreslog UI-berättelse före grillningen; Chat erbjöd
avfyrnings-prompt för /grill-with-docs trots S47-migreringen) — båda fångade av
Marcus-pushback (klass: aktör-modell/migreringsperioden; prövas igen vid migrerings-hub-
sessionerna)

Under en yt-migrering glider den lämnande ytan tillbaka in i redan-migrerade steg via
hjälpsamma ERBJUDANDEN — erbjudandet är glidningen, oavsett kvalitet. Hanteringen är
mekanisk: pröva erbjudandet mot roll-arkitekturen/migrerings-bärarna, och förkasta i så fall
EXPLICIT med routing till rätt yta ("det steget bor nu i X") — tyst accept återetablerar
reläet som migreringen just avvecklade.

## 2026-07-06 — Session 54 (MIGRERINGS-HUB-SESSION 1: rigor-migreringen + backlogg-lyftet + plugin 1.11.0 + T60)

### L243 [UNIVERSAL] — Över-engineering-vakten skär spekulation, aldrig beprövade ribbor — särskilt i migreringsfönster

Datum: 2026-07-06 | Källa: S54 Del 2 prövnings-trail (3+-branschledar-kvantifieraren föreslogs
"avstå" med vakten som skäl; Marcus-pushback rev klassningen före kvittens — ~27 %-mekanismen)
(klass: kvalitetshållning/klassning; dubbelriktade vaktens golv-sida)

Vaktens skärsida gäller SPEKULATIV komplexitet — abstraktioner utan nuvarande användare,
"ifall"-byggen. En beprövad ribba med empirisk grund (L_JJ: bevisvärdet BOR i antalet oberoende
källor) och faktiska framtida användare (varje kommande ADR) är GOLV, inte spekulation — och
golvet skärs aldrig i enkelhetens namn. Skärpning i migreringsfönster: när en artefakt ska
arkiveras är "principen finns redan, detaljen är överflödig" exakt mekanismen som stryker rigor
på köpet — operationaliseringen (kvantifierare, checkbar ribba) ÄR ofta lärdomen, inte en detalj.

### L244 [UNIVERSAL] — Agent-delegerad masstransformation appenderas aldrig utan skript-buren fidelitets-verifiering mot källan

Datum: 2026-07-06 | Källa: S54 Del 3 (backlogg-lyftet: 38 poster agent-transformerade;
verifieringsskript verbatim-substräng + titel-/mängd-/svans-ankare FÖRE append — 0 innehållsfel;
agentens 5 själv-rapporterade avvikelser triageade explicit, varav 2 krävde beslut
[pending-svansarna + L203-fragmentet]) (klass: delegerings-disciplin; [[L239]]-släkt
[läs-tillbaka], [[L191]]-klass)

Delegera gärna mekanisk masstransformation till en agent — men behandla utdatat som HYPOTES
tills mekanisk verifiering mot källan passerat: verbatim-substräng-kontroll,
mängd-/räknekontroller och ankar-jämförelser är skriptbara på minuter och ger fidelitetsbevis i
stället för stickprovshopp. Kräv att agenten själv-rapporterar avvikelser/oklarheter i sitt
slutsvar och triagea VARJE flagga explicit — flaggorna är där besluten bor (transform vs
korruption vs medveten trim).

### L245 [UNIVERSAL] — Punktvis feedback är en checklista — varje rad avprickas mot åtgärd före leverans

Datum: 2026-07-07 | Källa: S55 Del 4 (K2-missarna: aktivitetsrutans mobil-krav stod ordagrant
i dumpen men föll bort; "menyn vertikal till vänster" tolkades tyst som konventionell sidebar
när Marcus menade egna tabbaren flippad) (klass: leverans-disciplin; [[L67]]-släkt
[do-confirm], Gunilla-principens leverantörssida)

Rå-dumpar och punktvis feedback är KRAV-listor, inte prosa: behandla varje rad som ett eget
verifierbart krav och kör ett do-confirm-pass rad-för-rad mot leveransen INNAN den presenteras
— en klassad-men-obyggd punkt är fortfarande en miss. Tvetydig designtolkning ställs som
FRÅGA i stället för att väljas tyst; mottagarens egen formulering ("flippad vertikalt") slår
närmaste konventionella mönster.

### L246 [UNIVERSAL] — Visuell egenskap verifieras mot det RENDERADE, aldrig mot källkoden

Datum: 2026-07-07 | Källa: S55 Del 6 (tre varv "ingen färgskillnad": kortrubrikernas
färgklasser besegrades tyst av en OLAGRAD base.css h1–h6-regel — utilities-lagret förlorar mot
olagrad author-CSS; upptäckt först när computed-style asserterades) + Del 9/Del 11-mätnoterna
(klass: verifierings-disciplin; [[L239]]-klass [läs-tillbaka för UI], [[L189]]-släkt
[hypotes tills belagt])

"Ändrad i koden" är en HYPOTES tills den renderade ytan bevisar den: vid feedback på visuella
egenskaper asserteras computed-style/skärmdump — aldrig enbart klassnamn i källan (CSS-kaskadens
lager, specificitet och olagrade regler kan tyst nollställa ändringen). Mätfällor i samma klass:
jämför TEXT-kanter, inte border-boxar (padding ger falsk diff); neutralisera muspekaren före
skärmdumps-jämförelser (hover-tillstånd ger falsk diff).

### L247 [UNIVERSAL] — Beteende-krav i designinput är prototyp-materia — "byggkrav"-klassning får inte gömma granskningsbar känsla

Datum: 2026-07-07 | Källa: S55 Del 10 (dumpens omladdnings-krav klassades "byggkrav, ej
design" och demonstrerades aldrig — Marcus-fångst två varv senare; laddnings-/
uppdaterings-känslan visade sig vara ett designbeslut som itererades i två varv [blur →
helt osynlig]) (klass: prototyp-disciplin; T66-processens scope-sida)

Interaktions- och tillståndskänsla (laddning, uppdatering, övergångar) ÄR design och hör
hemma i prototypens granskningsyta när designinputen nämner den — klassningen "byggkrav till
kortet" är rätt för DATAVÄGAR men fel för BETEENDEN som mottagaren kan bedöma visuellt. Testet:
kan personen framför skärmen ha en åsikt om det? Då ska prototypen visa det.

### L248 [UNIVERSAL] — Parallella agenter i delad checkout: de säkra git-formerna

Datum: 2026-07-07 | Källa: S57 parallell-piloten (S57 ∥ S56, systemets första
samtidigt-aktiva parallellkörning; empiri #1–#4 i S57 Del 1–4; tråd T67 bär
arbetssätts-designen) (klass: parallell-arbetssätt / git-disciplin;
[[L239]]-släkt [verifiera mot faktiskt tillstånd])

Två samtidiga agenter i SAMMA working tree delar branch-state, git-index och
append-ytor — kollisionsskyddet är formval, inte tur: (i) committa via
pathspec (`git commit <paths>`), aldrig index-commit — den andres samtidiga
staging sveps annars med i din commit; (ii) `git pull --ff-only`, aldrig
`--rebase` — rebase kräver rent träd och tvingar stash av den andres pågående
arbete (stash-pop-race); (iii) dirty tree är FÖRVÄNTAT normaltillstånd —
STOPPA-signal endast när smutsen INTE matchar parallell-sessionens aktiva
kort (förklarad vs oförklarad smuts); (iv) delade filer (todo, register,
lessons) omläses i skriv-ögonblicket och seriella räknare om-deriveras mot
färsk disk per skrivning, aldrig ur minnesbild.

## 2026-07-07 — Session 58 (MIGRERINGS-HUB-SESSION 3: kartans steg 4a — Chat-ytan avvecklad ur operativa artefakter)

### L249 [UNIVERSAL] — Arkivering/flytt kräver grep efter INKOMMANDE länkar, inte bara utgående referenser

Datum: 2026-07-07 | Källa: S58 steg 4a C-passet (spoke-delta-arkiveringen bröt en markdown-länk
i systemet.md r173 → Docs link check-röd, run 28893152630; enabling-fix `74f29b4`) (klass:
git/länk-disciplin; [[L239]]-släkt [verifiera mot faktiskt tillstånd])

När en fil `git mv`:as eller arkiveras: grep efter INKOMMANDE markdown-länkar `](...<filnamn>)`
i hela repot FÖRE flytten, inte bara utgående referenser FRÅN filen. Utgående-referens-grep (vad
filen pekar på) och inkommande-länk-grep (vad som pekar på filen) är två skilda sökningar —
arkivering bryter den senare. En länk-CI-grind (lychee) fångar det, men grep-passet före flytten
sparar en röd runda. Fixen på en inkommande länk till en retirerad yta är att spegla
retireringen (markör + avlänka), inte att peka en "stabil mekanik"-referens på arkivet.

### L250 [UNIVERSAL] — Yt-migration: retirera artefakter utan nuvarande användare, omskriv dem inte "ifall"

Datum: 2026-07-07 | Källa: S58 steg 4a (bas-PI + spoke-delta-PI + retrospektiv-mallen RETIRERADE
i stället för omskrivna — Chat-ytan avvecklad → ingen nuvarande användare; Marcus rev kartans
"omskriv"-klassning öppet efter evidens) (klass: över-engineering-vakt / migreringsbeslut;
[[L243]]-släkt [vakten skär spekulation, aldrig beprövad ribba])

När en yt-migration möter en artefakt vars enda syfte var den avvecklade ytan: den har ingen
nuvarande användare, så att skriva om den för en osäker framtida återkomst är "bygga ifall" —
exakt vad dubbelriktade över-engineering-vakten skär. Retirera (arkivera-inte-radera): billigt,
ärligt, reversibelt (återuppliva + skriv om DÅ, med facit om återkomstens form i stället för en
gissning nu). GRIND före retirering: artefaktens substans måste vara verifierad dubblett av en
levande bärare (ej antagen) — då stryks noll rigor. En kartas ursprungsklassning ("omskriv") är
inte immun mot evidens; falsifieras den, rivs den öppet med kvittens.

### L251 [UNIVERSAL] — Mass-omskrivning: kalibrera formuleringen på kärntexten EN gång, applicera sedan konsekvent

Datum: 2026-07-07 | Källa: S58 steg 4a (två-aktörs-språket kalibrerat på §Roll-arkitektur +
IDENTITET via diff-STOPPA innan det applicerades på 20+ ytor; Marcus justerade "relä-etapp till
tredje agent" bort + omformade empiri-raden FÖRE bred applicering) (klass:
mass-transformations-process; [[L245]]-släkt [punktvis feedback som checklista])

Innan samma nya formulering appliceras på många ytor: kalibrera den på den mest konstitutionella
kärntexten FÖRST — visa exakt diff, få kvittens på ordval OCH gränsfall — och applicera sedan
konsekvent. Fel ton fångad på 2 kärntexter kostar 2 omskrivningar; fångad efter 20 ytor kostar
20. Kalibrerings-ögonblicket är där mottagaren väger in nyanserna (vad som INTE ska sägas
kategoriskt, hur empiri och härkomst bevaras) — inte efter att mönstret redan hårdnat brett.
