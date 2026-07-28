# ADR-082: Länkgrindens form — extern yta lämnar presubmit, och ADR-029:s add-only-policy rivs

- Status: Accepted (Session 91 — 2026-07-28)
- Datum: 2026-07-28
- Fas: Session 91, CI-/grind-arkitekturspåret (restlistans spår A4)

> **Om beslutsvägen — bokförd öppet.** Fattat av Code på Marcus explicita
> delegering 2026-07-28 (*"du är den som sitter på kompetensen, jag vill att du
> tar branschledande seniora beslut åt mig där och fixar de där"*). Noteras av
> samma skäl som i [ADR-080](ADR-080-acceptance-klassen-hermetisk-utbrytning.md)
> och [ADR-081](ADR-081-nummer-tilldelas-vid-landning.md): en läsare ska kunna
> se vem som vägde, inte bara vad som beslutades.

## Kontext

Länkgrinden (`lychee`) etablerades av [ADR-029](ADR-029-ci-architektur-changed-files-pattern.md)
§1d som en **ny** kvalitets-check, uttryckligen som "höjer kvaliten"-delen av
Marcus regel att docs-optimeringen inte fick sänka kvaliteten. Den kontrollerar
markdown-länkar i `docs/`, `tasks/` och repo-roten, och den **blockerar PR:er**.

Samma ADR slog i § Medvetna utelämningar punkt 2 fast en **add-only-policy** för
`.lycheeignore`, med motiveringen att *"preventiv exklusion tystar K18-signal vi
inte vet om är problem"*, och i § Konsekvenser att *"broken links åtgärdas som
drift, inte tystas via preventiv `.lycheeignore`"*.

Den policyn har hållit i över två månader — och priset har blivit synligt.
Undantagslistan har vuxit till **22 mönster, varav 21 externa**, och den växer av
en anledning som inte är länkröta i vårt eget material: en extern värd som är
nere, strypande eller CI-fientlig fäller en PR som inte rör den. `danger.systems`
blev den senaste posten 2026-07-28.

**Sprängradien är mätt, inte uppskattad.** `lychee --dump` mot CI:s exakta scope
ger 903 unika länkar: **467 externa fördelade på 125 skilda värdar**, och 436
interna. Var och en av de 125 värdarna kan ensam rödmåla en PR.

Dagen 2026-07-28 gav tre länkfel med **tre olika rätta svar** — `danger.systems`
(värden avvisar CI-nätet → undantag) · `martinfowler.com` (lycheens parallellism
mot en strypande värd → **ingenting**, CI var grön) · en död intern pekare efter
en filflytt (→ **laga**). Grinden fäller likadant i alla tre fall. Det är
diagnosen: den behandlar "vår text pekar fel" och "någon annans server har en
dålig dag" som samma händelse, trots att bara det första är vårt att åtgärda.

[ADR-077](ADR-077-riskanpassad-ci-klassning-dedup-nightly.md) har redan etablerat
presubmit/postsubmit som arkitektur och placerade uttryckligen länkkontrollen i
nattnätet (*"länkkontroll utan cache — dagsviten cachar för fart; natten kör
kall"*). Båda halvorna finns alltså redan; frågan är var gränsen ska gå.

Underlaget är ett eget research-pass mot primärkällor:
[`docs/research/lankgrindens-form-2026-07-28.md`](../research/lankgrindens-form-2026-07-28.md)
— lychees källkod på taggen `lychee-v0.24.2`, och nio branschledande projekts
faktiska workflow-filer.

## Beslut

### 1. Extern länkyta lämnar den blockerande grinden

`ci.yml`:s `docs`-jobb kör med `--offline`. Interna länkar — relativa filpekare,
ankare, allt som är vårt eget att laga — fortsätter fälla PR:er. Externa
adresser klassas `Status::Excluded` och kan inte längre rödmåla en PR.

Mekanismen är verifierad i källkoden, inte antagen ur hjälptexten. `--offline`
byter ut schema-filtret:

```rust
// Offline mode overrides the scheme
let schemes = if cfg.offline() {
    vec!["file".to_string()]
} else {
    cfg.scheme.clone()
};
```

Mätt mot vårt eget repo med CI:s exakta scope-argument:
`1944 Total · 946 Unique · 1129 OK · 0 Errors · 815 Excluded` — **31 ms**, grön
idag.

**Grunden är branschpraxis, inte bekvämlighet.** Av nio undersökta projekt låter
**noll** externa länkar blockera en PR, och lychees egen dokumentation
rekommenderar schemalagd körning plus ärende.

### 2. Nattnätet behåller full kontroll och får `--accept-timeouts`

`nightly-links` fortsätter köra kallt över både intern och extern yta. Den får
`--accept-timeouts`, som kopplar om lyckat-villkoret:

```rust
let is_success = if accept_timeouts {
    stats.is_success_ignoring_timeouts()   // error_map.is_empty()
} else {
    stats.is_success()                      // error_map + timeout_map tomma
};
```

Flaggan är **inte** "stäng av grinden": mätt ger enbart-timeout exit 0 med
flaggan, medan timeout *plus* ett äkta trasigt filmål fortfarande ger exit 2.
Den degraderar timeout till rapport och håller kvar allt annat.

**Flaggan läggs INTE på presubmit-halvan.** Researchens rekommendation sa "båda
halvorna oavsett beslut", men den var skriven för fallet att uppdelningen inte
görs. Med `--offline` sker inga nätverksanrop, alltså finns inga timeouts, och
flaggan vore en no-op. Att lägga en bevisligen verkningslös flagga i en
workflow är brus i en fil som ska gå att läsa. Avvikelsen bokförs här hellre än
att göras tyst.

### 3. Cache-maskineriet rivs ur presubmit-halvan

`--cache`, `--max-cache-age 1d`, `--cache-exclude-status '429'` och de två
`actions/cache`-stegen tas bort ur `docs`-jobbet. En körning utan nätverk har
ingenting att cacha, och 31 ms behöver ingen cache. Kvar blir två rörliga delar
färre i en grind vars värde ligger i att vara förutsägbar.

Nattnätet cachar inte heller — det är dess hela poäng (ADR-077).

### 4. Larmkopplingen: `nightly-links` lämnar `alarm.needs` och får egen kanal

Står `nightly-links` kvar i `alarm.needs` flyttas bruset från PR:er till
nattnätet i stället för att försvinna, och det tilldelade nattärendet — som ska
betyda "något är akut fel" — devalveras av externa värdars dåliga dagar.

Men att bara ta ut jobbet vore **fail-open**, precis den klass som `L321` och
`L322` redan kostat oss två gånger: ett rött jobb som ingen kanal bär blir en
tyst permanent.

Därför får länkrötan en **egen, mildare kanal**: ett stående ärende med etikett
`lankrota` som **uppdateras** i stället för att skapas på nytt. Är ärendet redan
öppet läggs en kommentar; annars skapas det. En död länk som står i en vecka ger
alltså ett ärende, inte sju.

Kanalen byggs på repots **befintliga `gh issue`-mönster** från `alarm`-jobbet —
inte på en ny third-party Action. Lychees dokumenterade mönster använder
`peter-evans/create-issue-from-file`, men det vore en ny supply-chain-yta att
SHA-pinna och bevaka under [ADR-029](ADR-029-ci-architektur-changed-files-pattern.md) §6,
för en förmåga vi redan har i huset.

### 5. `.lycheeignore` byter roll, och add-only-policyn upphör

Filen var ett **grind-tystare**: varje rad tog bort en PR-blockerare, vilket är
precis varför add-only-policyn behövdes. Efter beslut 1 är den ett **brusfilter
för nattrapporten** — en rad tystar inte längre någon grind, den håller en
rapport läsbar.

Add-only-policyn ersätts därför av ett **motiveringskrav**: varje post bär en
rad om varför den finns och ett datum. Det är formen `github/docs` (155 rader)
och `nuxt` (31 poster) använder för sina icke-blockerande körningar.

**Detta river [ADR-029](ADR-029-ci-architektur-changed-files-pattern.md) § Medvetna
utelämningar punkt 2 öppet.** Rivningen — inte formen — är skälet till att denna
ADR finns.

### 6. Två faktafel i `.lycheeignore` rättas

- **Felcachningen togs bort i lychee v0.24.0.** Vi kör v0.24.2 sedan 2026-07-19.
  `sched.com`-postens motivering ("förgiftad cache") är därmed ogiltig, och
  `--cache-exclude-status '429'` var en **no-op** redan innan beslut 3 tog bort
  den.
- **Räkningskonventionen bakom "19" och "20"** går inte att rekonstruera. Per rad
  ger 21 externa mönster, per kommentarsblock 16. Varken 19 eller 20 faller ut ur
  någon konvention. Siffrorna tas bort i stället för att bevaras som fakta ingen
  kan härleda.

## Alternativ som övervägdes

**Behåll formen, lägg bara `--accept-timeouts`.** Fullt försvarbart för den
instans som utlöste frågan: `cs.umd.edu`-fallet hade inte behövt en uppdelning,
det hade behövt en flagga vi inte kände till. Men det löser bara timeout-klassen.
`danger.systems` (värden avvisar CI-nätet) och en strypande `martinfowler.com`
fäller fortfarande PR:er som inte rör dem. 125 värdars sprängradie kvarstår.

**`--scheme https --scheme http` i natten, `--offline` i dagen.** Spegelbilden
finns som en flagga och vore symmetrisk. Förkastad: natten ska köra **allt**
kallt, och en intern länk som ruttnar mellan två PR:er ska fångas där också.
Symmetrin vore prydlig och sämre.

**Konsolidera till en `lychee.toml`.** Noterad som YAGNI redan i `nightly.yml`:s
egen kommentar, och den bedömningen står: två workflow-jobb med olika avsikt är
inte duplicering, och en konfigfil till skulle dölja just den skillnad detta
beslut inför.

**Under-bar-maskineri i stället för ADR** — en `§`-not i ADR-077 plus en
"ersatt av"-rad i ADR-029. Täcker samma yta med mindre ceremoni och var ett
äkta val. Förkastad på att rivningen av en nedskriven policy i en *annan* ADR
behöver en egen record för att trailen inte ska bli självmotsägande; en läsare
som slår upp ADR-029 punkt 2 ska hitta vad som ersatte den.

## Konsekvenser

**Detektionsfördröjning på extern länkröta: upp till ett dygn**, och
best-effort. En död extern länk kan alltså landa i `main`. Det är priset, och
det är medvetet: en död extern länk i ett dokument är en olägenhet, medan en PR
som inte går att landa på grund av någon annans server är ett stopp i arbetet.

**Undantagslistan blir inte kortare.** Detta är den punkt där vår egen
motivering var fel och rättas här: restlistan sålde uppdelningen på att *"17 av
19 undantag blir onödiga"*. Faktiskt utfall är **22 mönster, 21 externa, och
noll blir onödiga** om nattrapporten ska vara läsbar. Både `github/docs` och
`nuxt` behåller sina listor just för icke-blockerande körningar. Säljs
uppdelningen på undantagslistan bygger man en nattrapport man sedan låter ruttna
— och då är nettot negativt.

**PR-grindens signal blir smalare och sannare.** Röd docs-grind betyder från och
med nu "vår text pekar fel", inte "internet hade en dålig dag".

**En framtida läsare kan bli förvirrad** av en grön docs-grind bredvid en
dokumenterat död extern länk. Därför står det här, och därför byter
`.lycheeignore`:s filhuvud roll-beskrivning i samma landning.

## Ärlighet om underlaget

- **Om `nightly-links` någonsin gått röd på en extern länk, och vad det kostade,
  är inte mätt.** Kostnadsargumentet vilar på konstruktion och på
  branschmaterialet — inte på vår egen mätserie. Körnings-API:t frågades aldrig.
- **`danger.systems`-felets exakta retry-gren är inte fastställd.** Om
  `Connection reset` kommer via connect-fasen (aldrig omtag) eller hypers
  request-väg (omtag) avgör klassificeringen, och felet har inte reproducerats.
- **En av de nio branschprecedenterna är delegerad och inte omverifierad**
  (`nodejs/node` — hämtningen gav 404 på den uppgivna sökvägen). Räkningen "nio"
  bär alltså en post av lägre bevisvärde än de övriga; den fejkas inte bort.
- **Paritet mellan lokal mätning och GitHub-runnern är inte bevisad.**
  Flagg-semantiken är identisk (samma binärversion), men nätvägen är det inte —
  och nätvägen är precis vad hela frågan handlar om. Talen ovan (31 ms, 1944
  länkar) är lokala.

## Uppföljning

- Efter första nattkörningen med den nya formen: kontrollera att `lankrota`-
  kanalen faktiskt fyrar och att den **uppdaterar** i stället för att duplicera.
  En kanal som inte prövats i sin röda riktning är inte en kanal — samma lärdom
  som `TASK-60` kostade.
- Vid nästa `.lycheeignore`-ändring: pröva om poster kan **tas bort** nu när
  filen inte längre tystar en grind. Add-only är upphävt åt båda håll.

## Relaterat

- [ADR-029](ADR-029-ci-architektur-changed-files-pattern.md) — etablerade grinden; dess
  § Medvetna utelämningar punkt 2 rivs av denna ADR.
- [ADR-077](ADR-077-riskanpassad-ci-klassning-dedup-nightly.md) — presubmit/
  postsubmit-arkitekturen som denna ADR tillämpar.
- [ADR-076](ADR-076-merge-grinden-ruleset-pr-flode.md) — merge-grinden som gör
  PR-blockering till ett faktiskt stopp i arbetet.
- [`docs/research/lankgrindens-form-2026-07-28.md`](../research/lankgrindens-form-2026-07-28.md)
  — underlaget: lychee-källkod på `lychee-v0.24.2` + nio projekts workflow-filer.
