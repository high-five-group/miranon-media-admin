---
owner: marcus803
updated: 2026-08-01
review_by: 2026-10-27
status: stable
lifecycle: closed
---

# T100 — Instruktionsleveransen: fyra artefakter konstitutionen bygger på men aldrig får

> Tråd-kort (ADR-053). Född 2026-07-27 i S91 ur ett research-pass om
> agent-instruktionsfilers branschpraxis — passet rapporterade en avvikelse
> ("cache-sökvägen finns inte") som vid verifiering visade sig vara ett
> strukturfel med mycket bredare räckvidd än den fil passet granskade.
> Commit-tagg: `[T100]`.
>
> ADR-053-triage: **blockerar ej + högt värde → tråd.** Blockerar inte pågående
> arbete, men urholkar tyst varje beslut som konstitutionen förutsätter ska
> filtreras genom artefakterna.

## Ursprung

Marcus fråga i S91: *"Du har ju också ändrat/lagt till saker i CLAUDE.md. Det vet
jag inte heller om det var branschledarmässigt, var det inte det så ska det
utredas."*

Passet som beställdes granskade hubbens nyskrivna §6 i
`templates/code-role-discipline.md`. Det rapporterade i förbigående att filen
inte fanns på den cache-sökväg det fått. Verifieringen av den avvikelsen
avtäckte fyndet nedan.

Marcus efterföljande fråga — *"har du dokumenterat det ordentligt, alltså riktigt
ordentligt så vi kan lösa det branschledarmässigt?"* — besvarades med **nej**,
och detta kort är åtgärden.

## Fyndet

**Fyra artefakter som hub-`CLAUDE.md` refererar levereras aldrig till en
Claude Code-session.**

|Fil|Rader|Vad konstitutionen säger om den|
|---|--:|---|
|**`IDENTITET.md`**|312|*"IDENTITET.md är filtret vid tvivel. När du är osäker på om något bör byggas, elimineras eller bevaras — konsultera de tre motorerna, grundfundamenten och Fem Kvaliteter. **Utan identitetsfilter blir Kaizen drift.**"* (rad 190)|
|`profile.md`|307|*"Komplett profil: Se `profile.md` i marcus-system för djup profilkarta (identitet, drivkrafter, kompetensmatris 1–5, beslutsfilter, vision)."* (rad 16)|
|`templates/code-role-discipline.md`|249|*"Full code-roll-disciplin (handover-protokoll, transparens-rapport-format, STOPPA-grindar som procedursteg) bor i `templates/code-role-discipline.md`; denna sektion bär principen, templaten bär stegen (ADR-042)."* (rad 53)|
|`schema_reference.md`|—|*"Formler och fält → läs `schema_reference.md` + `field_lookup.json` innan du säger 'fältet verkar bruten'"*. **Ligger dessutom i det FRYSTA Vue-repot** (`~/Repon/miranon-media-os/docs/`), inte i marcus-system.|

Samtliga filer **existerade vid registreringen** — det var inte döda referenser.
De nådde bara aldrig fram av sig själva.

> **RÄTTAT 2026-07-31 (`TASK-108`, verifierat mot båda repona):** tre av fyra finns
> kvar (`IDENTITET.md` · `profile.md` · Vue-repots `schema_reference.md`). Den
> fjärde, `templates/code-role-discipline.md`, finns **inte längre** — den
> arkiverades till `archive/code-roll-disciplinen/` av **denna tråds eget arbete**
> (hub `32db353`, commit-taggad `[T100]`) när
> [ADR-079](../../docs/decisions/ADR-079-instruktionsleverans-barare-per-lager.md)
> supersederade ADR-042 helt och flyttade roll-disciplinen till en output style.
> Tabellraden ovan står kvar som registreringens ögonblicksbild; den är inte
> längre en beskrivning av disken.

## Verifieringsmetod (reproducerbar)

Tre oberoende kontroller, körda 2026-07-27:

```bash
# 1. Levereras filen med pluginet?
find ~/.claude/plugins/cache/marcus-hub -name "code-role-discipline.md"
#    → noll träffar över SAMTLIGA cachade versioner

# 2. Vad levererar pluginet faktiskt?
find ~/.claude/plugins/cache/marcus-hub/marcus-system/1.20.2 -maxdepth 2 -type d
#    → endast .claude-plugin/ + skills/ (19 skills). Ingen templates/, inga rot-md.

# 3. Importerar hub-CLAUDE.md dem?
grep -nE "^@|@templates|@/" ~/Repon/marcus-system/CLAUDE.md
#    → ingen @-import. Referenserna är ren prosa.
```

Svep över alla `.md`-referenser i hub-`CLAUDE.md` mot plugin-cachen ger de fyra
filerna ovan som ej levererade.

## Konsekvens

**ADR-042:s konstruktion är bruten i praktiken.** Uppdelningen "konstitutionen
bär principen, templaten bär stegen" förutsätter att båda når fram. Stegen gör
det aldrig. Filen har underhållits `v1.0 → v1.3` utan att läsas.

**Allvarligast: identitetsfiltret är frånvarande.** Konstitutionen kräver att
`IDENTITET.md` konsulteras vid varje tvivel om något bör byggas, elimineras eller
bevaras — och varnar uttryckligen att frånvaron ger drift. I S91 fattades ett
dussin sådana beslut utan att filen någonsin öppnades, därför att den för agenten
bara var ett namn i en mening.

**Detta är en skarpare form av vad §6-passet fann.** Passet konstaterade att §6
låg i *fel lager* — prosa-regler som borde mekaniserats, med mätdata på ~0 %
efterlevnad av skriven processregel mot 75 % när verktyget faktiskt togs bort.
Här är det ett steg värre: regeln är inte svag kontext, den är **ingen kontext
alls**.

## Vad som INTE är utrett — och ska vara det före åtgärd

**Ett research-pass ska köras FÖRE alternativen värderas.** Att lista lösningar
ur eget huvud var precis felet som avtäcktes två gånger tidigare i S91
(verktygsvalen, §6:s tillkomst). Passets fråga:

> Hur levererar branschledare instruktionskontext till kodagenter — vad hör hemma
> i en alltid-laddad fil, vad i en on-demand-läst artefakt, vad i
> verktygskonfiguration, och vad i agentdefinitioner?

Vad passet måste besvara:

1. **Anthropics egen mekanik för Claude Code:** `@`-import i `CLAUDE.md`, plugin-
   distribution, `.claude/agents/`-definitioner, skills, `settings.json`. Vad är
   avsett för vad?
2. **Konfiguration kontra kunskap kontra självdisciplin** — den distinktion som
   framkom i S91: regler om *vem som får göra vad* bör mekaniseras
   (`disallowedTools`, `permissions.deny`, `PreToolUse`-hook, `isolation`,
   `maxTurns`); *kunskap* (vad en bra brief innehåller) kan bo i fil; ren
   *självdisciplin i prosa* har nära noll effekt. Var går gränserna i praktiken?
3. **Kontextbudget:** fyra filer à ~870 rader kan inte alla alltid-laddas. Vad
   säger praxis om progressiv disclosure och on-demand-hämtning?
4. **Identitets-/profilkontext specifikt:** hur bär andra långlivade agent-
   uppsättningar användarprofil och värdefilter? Tunn precedent deklareras öppet.

## Åtgärdsalternativ — passet är kört, värderingen finns i det

> **Status 2026-07-27 (S91-resumen):** passet nedan är **KÖRT** och landat i
> [`instruktionsleverans-branschpraxis-2026-07-27.md`](../../docs/research/instruktionsleverans-branschpraxis-2026-07-27.md).
> Villkoret "ingen åtgärd innan passet är läst" är därmed uppfyllt. Alternativen
> står kvar oredigerade nedan som historik; deras värdering mot belägget bor i
> passet, inte här. **Beslutet är Marcus och är ännu inte taget.**
>
> **Premiss-korrigering (verifierad på disk):** `~/.claude/CLAUDE.md` är en
> **symlänk** till `~/Repon/marcus-system/CLAUDE.md`. "Hub-`CLAUDE.md`" och
> användar-scope-filen är alltså samma fil, och den laddas varje session.
> Fyndet står oförändrat — de fyra refererade artefakterna når fortfarande
> aldrig fram — men åtgärdsrymden är en annan än kortet antog.

Antecknade för att inte tappas, uttryckligen **inte** en rekommendation:

- lägg `templates/` och rot-`.md` i plugin-distributionen så de når cachen;
- `@`-importera från hub-`CLAUDE.md` så de alltid laddas (kostar kontextbudget);
- flytta reglerna till **agentdefinitioner** som bär dem som systemprompt;
- mekanisera det mekaniserbara och behåll bara kunskapen i fil;
- avveckla artefakter som ingen läser och flytta innehållet dit det faktiskt når.

**Ingen åtgärd tas innan passet är läst.** Det gäller även den till synes
självklara `@`-import-vägen.

## Bredare fråga tråden bär

Marcus formulerade den i S91: använder frontier-utvecklare instruktionsfiler på
det här sättet över huvud taget, eller är de i stället skickliga *operatörer* som
vet vilka kommandon, lägen och delegerings-former som finns och väljer rätt i
stunden?

Passets fynd stödjer delvis skepsisen. Och Code:s eget erkännande hör till
tråden: under S91 kördes sex sekventiella research-agenter, medan `/work-batch`,
ultracode, `Workflow` och plan mode aldrig användes — verktyg som fanns
tillgängliga hela tiden. Arbetet utfördes som regelföljning, inte som
verktygsbehärskning.

Om slutsatsen blir att operatörsskicklighet väger tyngre än skrivna regler, är
konsekvensen för hela konstitutionen större än denna tråds fyra filer.

## Nästa steg

> **AVSTÄMT 2026-07-31 (`TASK-108`).** Punkt 1 och 2 var redan gjorda när listan
> lästes — den motsade avsnittet "Åtgärdsalternativ" tolv rader upp, som sedan
> 2026-07-27 säger att passet är KÖRT. Listan bar alltså trådens födelseläge
> medan resten av filen bar dess nuläge. Strukna punkter står kvar överstrukna,
> inte borttagna: vad som var nästa steg är en del av trådens historik.

1. ~~Kör research-passet enligt frågan ovan.~~ **KLART** — tre pass plus en mätt
   regelinventering, samtliga i `docs/research/` daterade 2026-07-27.
2. ~~Värdera alternativen mot passets fynd.~~ **KLART** —
   [ADR-079](../../docs/decisions/ADR-079-instruktionsleverans-barare-per-lager.md)
   beslut 1 väljer bärare per innehållsklass, och river alternativ 1 explicit.
3. Åtgärda **de tre kvarvarande artefakterna** (den fjärde är avvecklad per
   ADR-079), och verifiera **mekaniskt** att de faktiskt når en session — samma
   tre kontroller som i verifieringsmetoden ovan, som grind eller manuell
   checklista. `InstructionsLoaded`-hooken är landad och är bäraren av det beviset.
   — **AVGJORD I DELAR 2026-08-01 (se § Steg 4):** `schema_reference.md`
   levererad projektnära; `IDENTITET.md` + `profile.md` medvetet parkerade tills
   beskrivningarna gjorts om.
4. ~~Väg in om `IDENTITET.md` bör vara alltid-laddad (den är ett beslutsfilter, inte
   uppslagsverk) medan övriga blir on-demand.~~ **AVGJORT 2026-08-01 — inget
   destillat nu (se § Steg 4).**

## Steg 3 utfört — mätningen (2026-08-01)

> READ-ONLY-mätning körd 2026-08-01 av separat agent mot
> `~/.claude/logs/instructions-loaded.jsonl` — hookens logg, den bevisbärare
> steg 3 pekade ut. Ingen fil rördes; detta avsnitt är landningen av utfallet.

**Huvudfyndet: de tre kvarvarande artefakterna (`IDENTITET.md` · `profile.md` ·
`schema_reference.md`) når fortfarande ALDRIG en session — nu mekaniskt bevisat,
inte härlett.** Loggen bär 132 händelser över 24 sessioner, tidsspann
2026-07-27T11:39:29Z → 2026-08-01T10:48:02Z (~5 dygn); första raden är sessionen
direkt efter 1.21.0-landningen — "fires efter omstart" höll. Grep mot loggen på
de tre filnamnen: **0 träffar.** Det enda som levereras är CLAUDE.md-klassen:
användar-scope 24 (symlänken till hub-`CLAUDE.md` verifierad), projektets 21,
worktree-kopior 87.

Steg 3:s tre kontroller — anpassade från den avvecklade fjärde artefakten per
[ADR-079](../../docs/decisions/ADR-079-instruktionsleverans-barare-per-lager.md)
— utföll så här:

|#|Kontroll|Utfall|
|--:|---|---|
|1|Levereras filerna med pluginet? `find` över cachen på de tre filnamnen|**FALLER** för steg 3:s mål — noll träffar över samtliga 14 cachade versioner, inkl. 1.24.0|
|2|Vad levererar pluginet faktiskt?|**FALLER** — 1.24.0 levererar `.claude-plugin/`, `skills/`, `hooks/`, `output-styles/`, `scripts/`; trådens egna leveranser nådde alltså cachen, men fortfarande ingen `templates/`, inga rot-md|
|3|Importerar hub-`CLAUDE.md` dem?|**FALLER** — ingen `@`-import, referenserna är prosa; korroborerat av loggen: 0 `include`-händelser av 132, trots att hookens matchers täcker alla fem load_reasons|

`reason`-fördelningen i sin helhet: `nested_traversal` 84 · `session_start` 46 ·
`compact` 2 · `include` 0 · `path_glob_match` 0 — den sista är en **verklig
nolla, inte en blind fläck**: `~/.claude/rules/` existerar inte.

**Bäraren fungerar.** Välformad JSONL, fälten `ts,file,reason,cwd,session` på
alla 132 rader, samtliga observerade reason-klasser rimliga. Mätningen etablerar
därmed BASLINJEN som steg 4-beslutet — Marcus: vad kärnan/destillatet är — ska
värderas mot. Per kortets egen ram är det fallande utfallet ett **FYND, inte ett
misstag**.

Två bifynd, antecknade utan åtgärdsförslag:

- **`nested_traversal` dominerar** (84/132, 64 %): varje agent-worktrees
  CLAUDE.md-kopia bokförs under FÖRÄLDRA-sessionens id, så per-session-tal
  överskattar huvudsessioners leverans om de läses ofiltrerat.
- **`compact` om-levererar båda CLAUDE.md-filerna** (2 händelser, ett par):
  kontexten efter compact får konstitutionen igen — vilket hittills bara varit
  antaget.

## Steg 4 avgjort (2026-08-01)

> Marcus-beslut 2026-08-01, ordagrant: *"Jag är inte nöjd med hur identitet.md
> och profile.md beskriver mig och de känns inte så relevant just nu i detta
> projekt. schema_reference.md är dock ett dokument med värde för det här
> projektet, så vore ju bra om det refereras eller finns tillgängligt på samma
> sätt som data-model.md."*

Beslutet värderades mot baslinjen ovan (Steg 3: 132 händelser, 0 träffar på de
tre filnamnen) och landar per artefakt:

- **`IDENTITET.md` · `profile.md` — inget destillat nu.** De är inte relevanta
  för detta projekt, och beskrivningen ska göras om innan den destilleras.
  Leverans-frågan för de två är därmed **medvetet parkerad, inte löst** — den
  återupptas när beskrivningarna är omgjorda.
- **`schema_reference.md` — projektnära tillgång enligt data-model-mönstret.**
  Kopierad ur frysta Vue-repot till `docs/reference/schema_reference.md` med
  proveniens-banner och auktoritets-gräns (fält-data ägs av `data-model.md`;
  kopians värde är interfaces/vyer/formulär/Zapier/Make/automations-
  genomgångarna), refererad ur `data-model.md` §Karta + auktoritets-noten och
  en rad i projektets `CLAUDE.md`. Landning: **PR #533** (head-commit
  `6e301d3`). Not: hub-`CLAUDE.md` refererar sedan tidigare inte längre
  `schema_reference.md` (grep verifierad 2026-08-01, noll träffar) —
  leveransfrågan för den artefakten var alltså redan projekt-sidig, och det är
  där den nu är löst.

**Trådens enda "väntar på Marcus"-post är därmed löst.** Ingen aktiv rest
återstår; kvarvarande fråga (IDENTITET/profile-leveransen) väntar på att Marcus
gör om beskrivningarna. Tråden sätts **`paused`** (durabelt parkerad) — inte
`closed`: fyndets kärna står för två av tre artefakter medvetet oåtgärdad tills
omskrivningen är gjord, och baslinjen ovan är måttet en framtida leverans
verifieras mot.

## Stängd (2026-08-01)

Marcus-beslut 2026-08-01 (rekommendation a): **tråden stängs permanent i detta
repo.** Grunden, per led:

- **Trådens fråga är besvarad och mätt.** Når instruktionerna en session? —
  mekaniskt avgjort av steg 3-baslinjen ovan (132 händelser över 24 sessioner,
  0 träffar på de tre filnamnen).
- **Projekthalvan är löst.** `schema_reference.md` är levererad per
  data-model-mönstret (`docs/reference/schema_reference.md`, PR #533), och
  destillat av `IDENTITET.md`/`profile.md` är inte relevant för detta projekt
  (Marcus 2026-08-01).
- **Resten är inte detta repos tråd.** Omgörningen av
  `IDENTITET.md`/`profile.md` är ett hub-/personspår som Marcus initierar i
  marcus-system när han vill. Steg 4-sektionens avslut ("`paused` tills
  beskrivningarna är omgjorda") supersederas därmed öppet: väntposten hör
  hemma hos hubben, inte i detta register, och en stängd tråd här tappar
  ingenting — steg 3-baslinjen förblir måttet en framtida leverans verifieras
  mot, var den än utförs.

- **2026-07-31 (`TASK-108`): TRÅDEN HADE DRIFTAT IFRÅN SIN EGEN LEVERANS.** En
  integritetskontroll av trådregistret fann tre poster där kortet och indexraden
  beskrev ett läge trådens eget arbete redan passerat: (a)
  [ADR-079](../../docs/decisions/ADR-079-instruktionsleverans-barare-per-lager.md)
  är `Accepted` sedan 2026-07-27 ur detta spår men nämndes varken i kortet eller i
  indexraden; (b) `templates/code-role-discipline.md` är **avvecklad och arkiverad**
  av trådens eget hub-arbete (`32db353`, taggad `[T100]`) medan båda ytorna
  fortsatte påstå att alla fyra artefakter existerar; (c) "Nästa steg" bad om ett
  research-pass som avsnittet tolv rader ovanför redan bokfört som kört — en
  motsägelse inuti samma fil. Ingen av posterna var dold; ingen hade lästs efter.
  **Klassen är trådens egen i miniatyr:** en artefakt som inte når fram gör ingen
  skada förrän någon handlar på den, och en tråd-rad läses som nuläge.
- **2026-07-27 (S91-resumen): ÅTGÄRD 1 LEVERERAD — `InstructionsLoaded`-hooken.**
  Marcus-kvitterad som första punkt av fyra ("vi tar en i taget"). Hub-PR #5,
  **plugin 1.21.0**, reinstall körd i samma landning (S76-praxisen).
  - **Formen:** plugin-hook (`hooks/hooks.json` + `hooks/log-instructions-loaded.sh`),
    inte `~/.claude/settings.json` — versionshanterad i git, och hooks är en av de
    tre mekanismer ett plugin *kan* bidra med kontext genom. Att använda den
    mekanism som fungerar för att verifiera att mekanismerna fungerar.
  - **Ren observation, aldrig en spärr.** Eventet saknar decision control; varje
    felväg i skriptet är en tyst no-op. En trasig logg får aldrig bli en trasig
    session.
  - **Verifierat med kortets EGEN metod:** `find` över plugin-cachen ger nu träff
    på hook-skriptet, och `hooks/` ligger bredvid `skills/` i 1.21.0 — exakt det
    `templates/` aldrig gjorde. Den *distribuerade* artefakten kördes skarpt
    (exit 0, korrekt JSONL-rad). Fem funktionstest före landning, alla exit 0.
  - **Öppen rest:** hooken fires först efter omstart. `~/.claude/logs/instructions-loaded.jsonl`
    är tom tills nästa sessionsstart — **det är där steg 3:s bevis landar.**
    Första kommandot nästa session:
    `tail -20 ~/.claude/logs/instructions-loaded.jsonl | jq -r '"\(.reason)\t\(.file)"'`
  - **SIDOFYND (egen landning, hub-commit `9304773`):** `claude plugin validate`
    avslöjade att **`/to-prd`:s frontmatter aldrig parsat** — kolon+mellanslag i en
    ociterad YAML-sträng ⇒ *"loads with empty metadata (all frontmatter fields
    silently dropped)"*. Utan `description` auto-upptäcks skillen aldrig; den har
    bara fungerat när Marcus skrivit `/to-prd` explicit. Klass-svep kört över alla
    19 skills — enda träffen. **Detta är T100:s klass i miniatyr**, med en skärpning:
    här *fanns* verktyget som hade fångat det, det kördes bara aldrig.
    → **Lesson-kandidat, EJ mintad** (numren låsta tills mekaniseringens punkt 6):
    *ett valideringsverktyg som finns men inte körs är funktionellt frånvarande —
    samma utfall som en artefakt som inte levereras.*
- **2026-07-27 (S91-resumen):** **research-passet KÖRT** och landat i
  [`instruktionsleverans-branschpraxis-2026-07-27.md`](../../docs/research/instruktionsleverans-branschpraxis-2026-07-27.md)
  (641 rader). Passets bärande claims **efterverifierade av Code** mot
  förstapartskällan innan de fördes vidare — samtliga höll:
  - *"A `CLAUDE.md` file at the plugin root is not loaded as project context.
    Plugins contribute context through skills, agents, and hooks rather than
    CLAUDE.md."* + *"Installed plugins cannot reference files outside their
    directory."* (`code.claude.com/docs/en/plugins-reference`) — **river
    alternativ 1**: filen i cachen är inte filen i sessionen.
  - *"imported files load at launch"* → `@`-import **sparar ingen kontext**;
    *"CLAUDE.md content is delivered as a user message after the system prompt"*
    → agentdefinitionens kropp är ett starkare lager än CLAUDE.md
    (`docs/en/memory`).
  - `~/.claude/rules/` finns som mekanism och laddas **ovillkorligt** utan
    `paths`-frontmatter — en väg kortet inte kände till. Katalogen finns **inte**
    på maskinen (verifierat), liksom `~/.claude/agents/`.
  - `InstructionsLoaded`-hooken finns och är **exakt** den mekaniska
    verifierings-grind steg 3 nedan efterlyser (`docs/en/hooks`); dokumentationen
    rekommenderar den uttryckligen för detta.
  - 200-raders-riktvärdet är **publicerat** förstaparts (*"target under 200 lines
    per CLAUDE.md file"*) — men dess empiriska grund är fortsatt odokumenterad,
    och faktorstudien som finner noll effekt av filstorlek står kvar.
  Ingen åtgärd vald — **beslutet är Marcus**.
- **2026-07-27 (S91):** tråden född. Fyndet verifierat i tre kontroller,
  omfattningen utvidgad från en fil till fyra efter Marcus fråga om
  dokumentationens kvalitet. Research-passet formulerat men **ej kört** — Marcus
  beslut: hela paketet tas som första punkt i nästa resume.
  Kontext: sessionsdok S91 Del 7 + PAUSLÄGE §
  "KRITISKT FYND", och
  [`agent-instruktionsfiler-branschpraxis-2026-07-27.md`](../../docs/research/agent-instruktionsfiler-branschpraxis-2026-07-27.md).

## Migrerat ur indexraden (`TASK-157.2`, 2026-08-07)

> Ordagrann text som tidigare bodde i `tasks/threads/README.md`s Titel-
> och/eller Ingång-kolumn för denna tråd, flyttad hit av registrets
> tunna radform-migration (ADR-098). Inget härunder är omskrivet —
> emfas-markörernas STIL (*...* vs *...*) normaliseras separat av
> `npx markdownlint-cli2 --fix` mot filens egen etablerade MD049-stil,
> inte av denna migration.

**Titel (fullständig, ursprunglig):**
**Instruktionsleveransen — fyra artefakter konstitutionen bygger på men aldrig får.** Född 2026-07-27 (S91) ur ett research-pass om agent-instruktionsfilers branschpraxis; passet rapporterade i förbigående att en cache-sökväg saknades, och verifieringen avtäckte ett strukturfel med bredare räckvidd än den granskade filen. **Hub-`CLAUDE.md` refererar fyra artefakter som ALDRIG levereras till en Claude Code-session:** `IDENTITET.md` (312 rader — konstitutionens *"filtret vid tvivel … utan identitetsfilter blir Kaizen drift"*) · `profile.md` (307 rader — Marcus djupa profilkarta) · `templates/code-role-discipline.md` (249 rader — Code-loopen §1–§5, transparens-rapport-formatet, STOPPA-grindarna, den nya §6) · `schema_reference.md` (ligger dessutom i det FRYSTA Vue-repot). Filerna EXISTERAR — referenserna är inte döda, artefakterna når bara aldrig fram. **Verifierat i tre oberoende kontroller (vid registreringen):** `find` över samtliga plugin-cachar ger noll träffar; pluginet levererar endast `.claude-plugin/` + `skills/`; hub-`CLAUDE.md` saknar `@`-import och refererar i ren prosa. **Konsekvens:** ADR-042:s konstruktion ("konstitutionen bär principen, templaten bär stegen") är bruten — stegen levereras aldrig, och filen har underhållits v1.0 → v1.3 utan att läsas. Allvarligast är att identitetsfiltret är frånvarande: S91 fattade ett dussin beslut som konstitutionen kräver ska filtreras genom `IDENTITET.md`, utan att filen någonsin öppnades. **Skarpare form av §6-passets huvudkritik** (regeln låg i fel lager; ~0 % efterlevnad av skriven processregel mot 75 % när verktyget faktiskt togs bort) — här är regeln inte svag kontext utan ingen kontext alls. ~~**Research-pass formulerat men EJ kört:**~~ **KÖRT OCH LANDAT — raden var stale, rättad 2026-07-31 (`TASK-108`).** Frågan (hur levererar branschledare instruktionskontext — vad hör hemma i alltid-laddad fil, on-demand-artefakt, verktygskonfiguration respektive agentdefinition?) besvarades av **tre research-pass plus en mätt regelinventering**, samtliga på disk i `docs/research/` daterade 2026-07-27 och citerade i [ADR-079](../../docs/decisions/ADR-079-instruktionsleverans-barare-per-lager.md): `instruktionsleverans-branschpraxis` · `roll-disciplin-dokumentklass` · `mekaniserbara-regler-branschpraxis` · `regelinventering-dubbletter` (158 regelpunkter klassade). Även åtgärdsalternativen är därmed värderade — ADR-079 beslut 1 väljer bärare per innehållsklass. **Bär även Marcus bredare fråga:** använder frontier-utvecklare instruktionsfiler så här alls, eller är de skickliga OPERATÖRER som väljer rätt läge i stunden? Codes eget erkännande hör till tråden — S91 körde sex sekventiella research-agenter medan `/work-batch`, ultracode, `Workflow` och plan mode aldrig användes. **TRÅDEN HAR RÖRT SIG IFRÅN SIN EGEN REGISTRERING (funnet 2026-07-31, `TASK-108`):** [ADR-079](../../docs/decisions/ADR-079-instruktionsleverans-barare-per-lager.md) är mintad och `Accepted` 2026-07-27 ur detta spår, supersederar ADR-042 HELT, och `templates/code-role-discipline.md` är därmed **avvecklad** — arkiverad till `archive/code-roll-disciplinen/` av trådens eget arbete (hub `32db353`, taggad `[T100]`). Av de fyra artefakterna finns alltså tre kvar (`IDENTITET.md` · `profile.md` · Vue-repots `schema_reference.md`); den fjärde är medvetet borta, ersatt av en output style. Varken raden eller trådfilen bar ADR-079 innan denna kontroll läste efter. Vad som ÄTERSTÅR i tråden är därmed leveransen av de tre kvarvarande, inte hela den ursprungliga fyran. **STEG 3 MÄTT + STEG 4 AVGJORT (2026-08-01):** hook-loggen bevisar mekaniskt att de tre kvarvarande aldrig når en session (132 händelser över 24 sessioner, 0 träffar på filnamnen — baslinjen, kortets § Steg 3); Marcus-beslutet därpå: **inget destillat av `IDENTITET.md`/`profile.md` nu** (inte relevanta för detta projekt; beskrivningen görs om innan den destilleras — medvetet parkerat), medan **`schema_reference.md` fått projektnära tillgång enligt data-model-mönstret** (`docs/reference/schema_reference.md`, kopia ur frysta Vue-repot, PR #533). Trådens enda väntar-på-Marcus-post löst. **STÄNGD 2026-08-01 (Marcus-beslut, rekommendation a):** frågan besvarad och mätt (steg 3-baslinjen), projekthalvan löst — omgörningen av `IDENTITET.md`/`profile.md` är ett hub-/personspår som Marcus initierar i marcus-system när han vill, inte detta repos tråd (kortets § Stängd). Besläktad: `T99` (natt-bygge-skillen, samma orkestrerings-tema)

**Ingång (fullständig, ursprunglig):**
[T100-instruktionsleveransen.md](T100-instruktionsleveransen.md) · [ADR-079](../../docs/decisions/ADR-079-instruktionsleverans-barare-per-lager.md) · sessionsdok S91 Del 7 + PAUSLÄGE
