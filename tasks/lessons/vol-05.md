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

# tasks/lessons/vol-05.md — Universella lärdomar, volym 5

> **STÄNGD volym** · 2026-07-27 → 2026-07-30 (L360–L421): Session 91:s huvuddel — CI-paritet, upphävande-räckvidd, m.fl. Flat L-nummer-form.
>
> Ingång, uppslags- och append-regler: [`tasks/lessons.md`](../lessons.md) (indexet).
> Innehållet nedan är bevarat verbatim från uppdelningen 2026-08-08 (ADR-085,
> precedent-tillämpning av hubbens volym-split). Nya block tillkommer aldrig i en stängd volym.

---

## Fortsättning: flat L-numrering (ingen ny H2 per session i källan)

> Redaktionell rubrik, tillagd vid delningen (TASK-161.9) enbart för att
> hålla giltig rubrik-hierarki (H1 → H2 → H3) — källfilen hade ingen
> `## <datum> — Session N`-omslutning för denna sträcka (se indexets not om
> konventionsskiftet). Posterna nedan är verbatim.

### L360 — Verifiera med CI:s exakta kommando, inte en svagare lokal variant

**En lokal grind-körning bevisar ingenting om den kör en svagare variant än CI —
och "jag körde verktyget" räcker inte som verifiering, bara "jag körde CI:s
exakta kommando".** `[UNIVERSAL]`

**Empiri (S91, 2026-07-27, PR #273 — två instanser i samma PR):**

1. **Biome.** Jag körde aldrig Biome före commit, trots att commiten införde tre
   nya filer och ändrade JSONC. Sub-disciplinen som föreskriver
   `biome check --write` före `git add` finns skriven i `session-start`-skillen —
   den lästes inte. CI föll på steg 6.
2. **shellcheck.** Jag körde `shellcheck <filer>` och fick **exit 0**. CI kör
   `shellcheck --severity=style --enable=all` (ADR-033, kravet är 0/0/0/0) och
   fick **SC2312 × 6**. Samma binär, samma filer, motsatt utfall — skillnaden var
   två flaggor jag inte visste att grinden bar.

Instans 2 är den intressanta, eftersom den ser ut som verifiering. Jag hade ett
grönt exit att peka på. Det gröna gällde bara en annan fråga än den grinden
ställer.

**Motmedlet är inte att komma ihåg flaggorna** utan att läsa dem ur grinden och
köra dem verbatim: `grep -A12 '<grind-namn>' .github/workflows/ci.yml`, kopiera
kommandot, kör det. Det tar en tool-call och ersätter en gissning.

Kostnaden när det inte görs är inte bara ett rött jobb: PR #273 körde full svit
med skarp staging **tre gånger** innan den var grön, vilket är ~30 minuter genom
den globala mutexen — samma flaskhals sessionen ägnats åt att mäta.

**Skärpningen mot närliggande lärdomar:** [[L322]]-klassen handlar om grindar som
är fail-open; detta handlar om *verifieringen* av dem. Och där CLAUDE.md redan
säger "lokal exit 0 garanterar inte grön CI" om Biome specifikt, är den generella
formen bredare: **varje grind vars lokala anrop skiljer sig från CI:s är en
grind du inte har kört.**

### L361 — Agentkonfig utanför docs-klassningen kostar en full staging-svit

**`.claude/**` står inte i docs-allowlisten. En URL-ändring i agentkonfig utlöser
därför hela testsviten genom den globala staging-mutexen — för en fil som inte
kan påverka en enda test.**

**Empiri (S91, 2026-07-27):** mätt skarpt. Ägarbytets städning ändrade en URL i
`.claude/settings.json`, och den ändringen ensam klassades som kod och drog full
svit. Kostnaden är ~10 minuter genom mutexen plus kön bakom.

Klassningen är **allowlist, aldrig blocklist** — vilket är rätt design, eftersom
en glömd post då blir *för mycket* CI i stället för *för lite*. Men det gör också
att varje ny konfigyta måste läggas till medvetet, annars faller den till
default-fallet.

**Åtgärden är en rad i `ci.yml`:s docs-klassning** (restlistan A4). Den bredare
lärdomen är att **klassningslistan är en tillståndsyta som åldras**: nya
kataloger tillkommer löpande, och ingen grind säger till när en av dem hamnat i
fel hink. Samma klass som listparitets-problemet — invarianten står i prosa i
stället för i en grind.

### L362 — En CI-diagnos som ställs före loggen läses pekar reflexmässigt på det egna arbetet

**Den första hypotesen vid ett rött jobb är nästan alltid "det är något jag just
ändrade". Loggen är den enda källan som kan avgöra det — och den kostar en
tool-call.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-27, PR #273):** `Docs link check` föll och jag antog kort
att mitt nya innehåll var orsaken. Loggen sa något annat: **`0 Errors,
1 Timeout`** på en `cs.umd.edu`-PDF i `hallplats-modellen`-passet — en
**förbefintlig fil PR:en inte rör**. En timeout ger exit 2. Körningen därefter gav
`Docs link check: success`, alltså transient.

Hade hypotesen fått stå hade fel sak åtgärdats: mitt innehåll hade granskats,
kanske ändrats, och den verkliga orsaken — att en extern akademisk server styr
vår leveranstakt — hade förblivit osedd. Fyndet gav i stället länkgrindens
**tredje empiriska instans samma dag**, alla med samma form: extern yta fäller en
PR som inte rör den.

**Motmedlet:** läs loggen **före** första hypotesen, inte som verifiering av den.
Och klassa fyndet — tysta det inte. Add-only-policyn i `.lycheeignore` kräver
bevisad flakiness av just det skälet: en tystad grind ser grön ut utan att vara
det.

### L363 — En slutsats som bara vilar på egen empiri räcker inte när ADR-baren nås

**Egen mätning är stark grund för ett arbetssteg och otillräcklig grund för ett
ADR-permanent beslut. När baren nås ska branschprecedent hämtas — och en tom
precedent-rymd deklareras öppet i stället för att fyllas ut.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-27):** en rekommendation formulerades på vår egen mätning
av staging-flaskhalsen. Marcus fråga *"om du rekommenderar B så antar jag att det
är på väl underbyggda grunder"* träffade en verklig lucka: konstitutionen kräver
3+ branschledar-precedent vid arkitekturbeslut med ADR-permanens, och den hade
inte hämtats. Grillningen **pausades** och passet kördes.

**Svaret ändrade ramen, inte bara underlaget.** Branschen väger determinism
högst — men köper den genom att göra backend **efemär**, inte genom att mocka
bort den. Vår delade muterbara staging är lägst rankad i Googles SUT-ranking och
HOLD-listad hos Thoughtworks, så att komma därifrån har brett stöd; det är
**formen** som avviker. Ghost är vår manöver exakt (81 hermetiska acceptance-filer
i eget jobb + 82 skarpa i docker-stack, med en 418-vakt).

**Och där precedenten faktiskt tog slut sades det rakt ut:** Ghost, Supabase och
cal.com kan alla duplicera sin backend gratis. Precedent för efemär backend mot
**icke-självhostbar SaaS** är genuint tomt. Den tomheten skrevs in i ADR:n i
stället för att räkningen fejkades — vilket är hela poängen med kravet.

### L364 — `git commit` committar hela indexet, inte det du senast lade till

**Ett tidigare svepande `git add` förorenar en senare, till synes path-scopad,
commit. Scopet sitter i indexet — inte i den sista `add`-raden.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-27):** ett svepande tillägg låg kvar i indexet när en
senare commit gjordes med en noggrant path-scopad `git add`. Commiten tog med
allt som låg i indexet, inklusive det tidigare svepet. Kommandoraden såg
disciplinerad ut; resultatet var det inte.

Detta är varför husets regel är **path-scopad `git add`, hub och spoke i separata
commits** — och varför `git add -A` är mekaniskt spärrad i `settings.json`
`permissions.deny`. Spärren tar det vanligaste fallet, men inte ett svep som
redan hunnit landa i indexet.

**Motmedlet är `git status --short` före `git commit`, varje gång.** Inte
`git diff` — den visar arbetsträdet, inte indexet. En rad output som inte hör
till commiten är hela signalen, och den kostar en tool-call.

### L365 — En grön stubbsvit bevisar logiken, inte att den möter verkligheten

**En svit som passerar mot stubbar har bevisat att koden gör vad stubben
beskriver — inte att stubben beskriver verkligheten. Varje ändring i en stubbad
svit ska följas av skarpa körningar mot verkliga ID:n innan den anses bevisad.**
`[UNIVERSAL]`

**Empiri (S91, 2026-07-27):** `ci-wait`-fixens v1 passerade **alla** stubbfall
och föll **direkt** mot skarpt API. Stubben speglade inte det som var själva
poängen: att en aggregator failar som *följd* av det tillstånd testet skulle
klassa. Felet låg alltså inte i koden mot stubben, utan i att stubben var en
förenklad modell av precis den mekanik som skulle testas.

Formen är lömsk eftersom den ser ut som verifiering och ger ett grönt utfall att
peka på. Samma klass som [[L360]]:
det gröna gällde en annan fråga än den som ställdes.

**Motmedlet** är inte att sluta stubba — stubbar är rätt för snabb iteration —
utan att aldrig låta en stubbad svit vara *sista* beviset. Ett skarpt anrop mot
ett verkligt ID är en tool-call och stänger frågan.

### L366 — `#` i en YAML literal block scalar är literal text, inte kommentar

**Inuti ett `files: |`-block är `#` en helt vanlig tecken. En "kommentar" där
blir en glob-post som tyst matchar ingenting — eller fel saker.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-27):** kommentarsrader skrevs in i ett `files: |`-block i
`ci.yml` med antagandet att YAML-kommentarsyntaxen gällde. Literal block scalars
(`|`) bevarar allt innehåll ordagrant — kommentarer finns inte i den kontexten.
Posterna blev därmed globar som aldrig kunde matcha.

Felet är osynligt vid läsning: filen *ser* korrekt kommenterad ut, och grinden
säger inget eftersom en glob som matchar noll filer inte är ett fel.

**Motmedlet är att parsa filen, aldrig att läsa den.** Formen verifieras genom
att köra parsern och inspektera det tolkade värdet — `yq`, `actionlint` eller en
`js-yaml`-rad. Ögat kan inte skilja en literal `#`-rad från en kommentar; parsern
kan inget annat.

### L367 — En lesson-kandidat som bokförs som stikkord överlever pausen som ord, inte som innehåll

**Ett par ord i ett HANDOFF-block räcker för att minnas *att* något fanns, men
inte *vad* det var. Kandidaten ska skrivas som fragment när den uppstår — inte
listas för att skrivas senare.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-27, fjärde resumen):** PAUSLÄGE bokförde tre nya
lesson-kandidater som stikkord: *autofix förvärrar en falsk-positiv* · *husets
`>`-separerade blockquote-stapling* · *`.claude/**`-luckan*. Vid skörden kunde
den tredje beläggas fullt ur restlistan och `ci.yml`. **De två första kunde det
inte** — de fanns ingenstans annat än som dessa ord. Sessionsdokets Del-text,
commit-meddelandena och configdiffarna för dagen genomsöktes utan träff.

Det som gick förlorat är exakt den del som gör en lärdom användbar: empirin,
motmedlet och avgränsningen. Kvar blev en rubrik ingen kan handla på.

**Skärpningen mot [[ADR-081]]:** nummerspärren är borta, så kostnaden för att
skriva ett fragment direkt är nu **noll** — ingen behöver välja ett nummer, och
en katalogfil är en fullgod leverans. Argumentet "jag skriver ihop dem vid
skörden" var svagt redan när numren var låsta; efter ADR-081 finns det inte alls.

**Motmedlet:** skriv fragmentet i samma landning som arbetet som gav lärdomen.
En handoff får peka på fragment — den ska inte bära kandidater som ännu inte
finns i fil. Detta är kontinuitets-arkitekturens grundregel tillämpad på sig
själv: *filartefakter är enda sanningskällan.*

### L368 — Mekanisk verifiering fångar felen; granskning av egen kod gör det inte

**Fyra av fem fel i ett arbetspass fångades av parsning, skarp körning, negativt
self-test och empirisk kartläggning. Noll fångades av att läsa igenom det egna
arbetet.**

**Empiri (S91, 2026-07-27, Del 6):** fördelningen mättes i efterhand över ett
pass med fem fel. Varje fångst hade ett *instrument* bakom sig — aldrig en
genomläsning.

Detta är inte en observation om en enskild dag utan stöd för den etablerade
fångst-fördelningen (self-review ~9 %, transparens-rapport ~64 %,
Marcus-pushback ~27 %). Den praktiska konsekvensen är att tiden ska läggas på att
**bygga instrumentet**, inte på att granska hårdare: ett negativt self-test som
tar fem minuter att skriva fångar mer än trettio minuters läsning.

**Motmedlet i praktiken:** när ett arbete känns färdigt, fråga inte *"har jag
missat något?"* utan *"vilket kommando skulle avslöja att jag missat något?"* —
och kör det. Den första frågan har empiriskt svarsfrekvens nära noll.

### L369 — En partition som glömmer LÄSANDE agenter är ofullständig

**Läsning av en fil under ändring ger samma inkonsistens som en skrivkonflikt.
En partitionsdeklaration som bara listar skrivande resurser skyddar halva
problemet.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-27):** partitionerings-regeln formulerades kring
skrivande resurser — filer, grenar, nummerserier, portar, delade testmiljöer,
main. Luckan är att en agent som *läser* `lessons.md` eller `todo.md` mitt under
en annan agents skrivning bygger sitt arbete på ett tillstånd som aldrig
existerade som helhet.

Skrivkonflikten är dessutom den **snällare** av de två: den syns som en konflikt
eller ett rött jobb. Den inkonsistenta läsningen syns inte alls — agenten
levererar tryggt ett resultat grundat på en halv fil.

**Motmedlet är att deklarera partitionen över *åtkomst*, inte över mutation:**
vilka resurser en agent rör alls. Det gäller särskilt de stora ackumulerande
statusfilerna, som per konstruktion läses av alla och skrivs av många. Samma
grundproblem som [[L364]] i en annan skala —
tillståndet är bredare än den operation man tänker på.

### L370 — Plugin-levererade agenter stödjer inte `hooks`, `mcpServers` eller `permissionMode`

**En agentdefinition som distribueras via ett plugin tappar tyst dessa tre
nycklar. Ska en agent bära en spärr måste definitionen bo i `.claude/agents/`.**

**Empiri (S91, 2026-07-27):** verifierat vid arbetet med agent-partitionering.
Fältet accepteras i plugin-formen utan felmeddelande, men laddas inte — vilket
gör att en spärr man tror är på plats i praktiken saknas.

Konsekvensen är riktningsgivande, inte bara en detalj: **distributionsvägen
bestämmer vilka garantier en agent kan bära.** Plugin-vägen är rätt för
kapabilitet (skills, prompt, verktygsurval) och fel för tvingande spärrar.

**Motmedlet:** bestäm hemvist utifrån vad definitionen ska *garantera*, inte
utifrån var det är bekvämast att lägga den. Behöver agenten en hook eller ett
`permissionMode` — `.claude/agents/`, per repo. Övrigt kan gå via plugin.

### L371 — `SessionStart`-hookens `additionalContext` har en gräns på 10 000 tecken

**Över gränsen degraderar injektionen tyst till sökväg + förhandsvisning. En hook
som "levererar" en stor fil levererar då en referens till den, inte innehållet.**

**Empiri (S91, 2026-07-27):** mätt vid bygget av `InstructionsLoaded`-hooken
(plugin 1.21.0). Gränsen är inte ett fel utan ett designval i harnesset — men den
är osynlig från hookens sida: skriptet lyckas, exit 0, och ingenting säger att
innehållet ersattes.

Detta träffar precis den klass av mekanismer som ska garantera **leverans av
instruktioner**, vilket är T100:s hela ämne. En hook som tror sig leverera en
konstitution men levererar en sökväg har samma utfall som ingen hook alls —
[[L373]] i en annan skepnad.

**Motmedlet:** håll injicerat innehåll under gränsen med marginal, och
**verifiera i mottagaränden** — att hooken kördes bevisar inte att innehållet
kom fram. Loggraden ska spegla vad som faktiskt injicerades, inte vad som
avsågs.

### L372 — Ett uppdrag kan peka på fel adress — verifiera mot koden före implementation

**Ett uppdrag skrivet i en tidigare session bär den sessionens förståelse, inte
kodens. Läs målet på disk innan du utför uppdraget — annars implementerar du en
gammal karta.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-27):** mekaniseringens punkt 1 (sessionsdok Del 4) sa
*"en rad i docs-allowlisten"*. Sanningen på disk var **fyra filer i en annan
lista**, plus ett befintligt **fail-open** i den första — alltså både fel adress
och ett fynd uppdraget inte kände till.

Detta är inte slarv hos den som skrev uppdraget. Det är en normal konsekvens av
att disk ändras mellan sessioner medan uppdraget ligger stilla. Ett uppdrag är
därför en **hypotes om var arbetet ska göras**, inte en adress.

**Motmedlet** är LÄS-steget före PLANERA, tillämpat även när uppdraget låter
exakt: ju mer preciserat ett gammalt uppdrag är, desto lättare är det att utföra
det bokstavligt mot fel ställe. Vid divergens styr avsikten, inte bokstaven.

### L373 — Ett valideringsverktyg som finns men inte körs är funktionellt frånvarande

**Samma utfall som en artefakt som aldrig levereras: noll. Ett verktyg räknas
först när något tvingar fram körningen.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-27):** `/to-prd`-skillens frontmatter parsade aldrig, och
skillen auto-upptäcktes därför **aldrig**. Verktyget som hade fångat det —
skill-valideringen — **fanns i repot** men kördes inte. Fyndet är T100:s klass i
miniatyr, med skärpningen att här saknades inte instrumentet, bara dess
avfyrning.

Skillnaden mot en ren lucka är att den här formen är **osynlig**: en inventering
av vilka verktyg som finns ser komplett ut, och ingen rapport är röd, eftersom
inget kördes. Frånvaron av rött läses som grönt.

**Motmedlet är mekanisering, inte påminnelse.** En grind i CI, en hook eller ett
steg i `check:docs` — något som avfyrar utan att någon minns det. Detta är samma
princip som ADR-039 § lesson→grind: *en grind är inte en grind förrän dess
fyrning fortlöpande verifieras.* Här gäller det verktyget före grinden.

### L374 — Verktygsval researchas inte med samma disciplin som arkitekturval

**Web-research-disciplinen tillämpas reflexmässigt på arkitekturfrågor men hoppas
över för verktygsval — trots att konstitutionen inte gör den skillnaden. Frågan
"finns det redan?" ska ställas innan ett skript skrivs, inte efter.**
`[UNIVERSAL]`

**Empiri (S91, 2026-07-27):** Marcus fråga *"det du gjort i KOD i denna session —
är det verkligen så proffsen konfigurerar?"* avtäckte mönstret. **Fem
research-pass på ett dygn** hade körts för arkitekturfrågor. **Noll** för
verktygsval, och fyra egenbyggen hade landat där mogna verktyg fanns:
`check-docs.sh` · `ci-wait.sh` · hermetik-vakten · två handsynkade
`changed-files`-listor. Verifierat: inget av `npm-run-all`, `concurrently`,
`msw`, `turbo` eller `nx` fanns i `package.json`.

**Skärpningen — och den är viktig:** research-passet som beställdes **rev tre av
fyra anklagelser**. `check-docs.sh` och `ci-wait.sh` är motiverade egenbyggen
(inget verktyg ger tri-state grön/röd/**skippad**; `gh run watch` fäller på
topp-nivåns conclusion och `gh pr checks --watch` är fail-open på `CANCELLED`
och `SKIPPED`), och `changed-files`-uppställningen satt redan på den säkra raden
— ett byte hade gått **in** i fällan, inte ur den. Endast MSW var ett äkta
försummat verktygsval.

**Lärdomen är därför inte "egenbyggen är fel" utan "valet gjordes utan belägg".**
Att tre av fyra visade sig försvarbara i efterhand ändrar inte att de valdes utan
att frågan ställdes. Utfallet ska redovisas **även när domen blir "bygg eget"** —
annars kan nästa läsare inte skilja ett prövat val från ett oprövat.

### L375 — Staplade blockquotes separeras med en `>`-rad, aldrig med en tom rad

**Två blockquote-block åtskilda av en HELT tom rad fäller `markdownlint` MD028.
Husets form är en `>`-rad emellan — alltså ett block med flera stycken, inte två
block.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-27):** ADR-063 skulle få en andra additiv not bredvid den
befintliga S81-noten. Den skrevs som ett eget blockquote-block med en tom rad
emellan, och `check:docs` föll:

```text
ADR-063-airtable-bas-som-forstklassig-leverabel.md:17
error MD028/no-blanks-blockquote Blank line inside blockquote
```

Markdown ser inte två block där skribenten ser två block — den ser **ett** block
med en tom rad inuti, vilket är tvetydigt nog för att regeln ska fälla.

**Husets form fanns redan och var lätt att verifiera:** ADR-073 bär tre
amenderingar staplade i EN blockquote, separerade med rader som innehåller
enbart `>`. En blick i den filen hade räckt.

**Förhistorien är själva poängen.** Denna lärdom stod i S91:s fjärde
PAUSLÄGE som stikkordet *"husets `>`-separerade blockquote-stapling"* — utan
empiri, utan motmedel. Vid skörden gick den inte att belägga: sessionsdokets
Del-text, fem commit-meddelanden och configdiffarna genomsöktes utan träff, och
den lämnades hängande som öppen post. **Den återuppstod två timmar senare genom
att exakt samma fel gjordes igen** — nu med logg, radnummer och regel-ID.

Det är den skarpaste möjliga bekräftelsen på
[[L367]]: en kandidat utan empiri
är inte en sparad lärdom, den är en anteckning om att man en gång visste något.
Kostnaden blev att felet fick begås en andra gång för att kunna skrivas ned.

**Motmedlet:** när ett dokument ska få ytterligare en not-, amenderings- eller
varningsruta — läs hur den befintliga är avgränsad innan den nya skrivs. Formen
är redan bestämd i filen du håller på att ändra.

### L376 — En radbrytning i löptext kan skapa markdown-struktur du inte menade

**Markdown tolkar `#`, `+`, `-`, `>` och siffra-punkt strukturellt när de står
FÖRST på en rad. En radbrytning som råkar placera ett sådant tecken i
radbörjan förvandlar löptext till rubrik eller lista — och grinden fäller på
en rad du upplevde som en mening.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-27) — tre instanser samma dag, i tre olika filer:**

1. `todo.md` — `#273 mergat …` bröts så att `#273` hamnade först ⇒
   **MD018/no-missing-space-atx**, läst som ATX-rubrik.
2. `s91-restlistan.md` — samma sak, samma PR-nummer, samma regel. Jag hade
   redan sett felet en gång och gjorde om det två timmar senare.
3. `session-91.md` — `~60 lokala\n+ 109 fjärrgrenar` ⇒ **MD004/ul-style** och
   **MD032/blanks-around-lists**, läst som listpunkt.

Klassen är lömsk av två skäl. **Källtexten ser rätt ut** — meningen är
grammatiskt hel och tecknet är korrekt i sitt sammanhang. Och **felet är
positionsberoende**: samma mening med annan radlängd är grön, vilket gör att
det uppstår vid till synes ovidkommande redigeringar.

**Motmedlet är inte att undvika tecknen** utan att flytta dem från radbörjan:
bryt raden på annat ställe, eller skriv ut ordet — "PR 273" i stället för
`#273`, "cirka 60 lokala och 109 fjärrgrenar" i stället för `~60 lokala` +
radbrytning + `+ 109`. Båda formerna läser dessutom bättre.

**Skärpningen mot [[L360]]:**
detta är en klass där lokal grind och CI ger samma svar — problemet är inte
verifieringens form utan att man inte kör den alls före commit på prosa-ändringar,
eftersom prosa "inte kan gå sönder". Den känslan är fel: markdown ÄR kod.

### L377 — Ett glob-mönster i en blockkommentar kan stänga kommentaren

**`*/` inuti en `/* … */`-kommentar avslutar kommentaren där — även när tecknen
är en del av ett citerat glob-mönster. Citattecken, backticks och kodstil i
JSDoc skyddar ingenting; parsern ser bara teckenparet.** `[UNIVERSAL]`

Fångat 2026-07-27 i `task-54.2`: en JSDoc-rad dokumenterade formen på MSW:s
`info.header` genom att citera ett handler-mönster som börjar med `*/`. Filen
såg korrekt ut i editorn — syntaxfärgningen visade en obruten kommentar — men
Playwright avvisade den med `SyntaxError: Unterminated string constant (53:35)`,
alltså med en position långt efter den verkliga orsaken och med en felklass som
pekar på strängar snarare än kommentarer.

Klassen är bredare än JSDoc: **exempel som citerar syntax kan kollidera med
syntaxen de bor i.** Samma form finns i regex i kommentarer, i `-->` inuti
HTML-kommentarer, och i ` ``` ` inuti markdown-kodblock.

Motmedlet är inte att undvika exempel — de bär förklaringen. Det är att
formulera exemplet så att teckenparet inte uppstår: beskriv mönstret i ord
(*"metod plus handlerns path-mönster"*), eller bryt paret. Att en fil parsas är
dessutom billigare att verifiera än att läsa: kör den, lita inte på färgningen.

### L378 — En repo-inställning kan vara låst tre nivåer upp

**En GitHub-inställning som presenteras som repo-lokal kan i själva verket vara
en kedja enterprise → org → repo, där varje nivå ärver nedåt och en restriktiv
nivå låser de lägre. Mutad kryssruta i repot betyder därför inte "saknar
rättighet" utan "värdet ägs högre upp" — och felsöker man på fel nivå letar man
efter något som inte finns där.** `[UNIVERSAL]`

Fångat 2026-07-27 (S91): baseline-workflowen failade på
`GitHub Actions is not permitted to create or approve pull requests`.
Workflowens eget filhuvud kallade förutsättningen en *repo-inställning* — och
det var fel, men bara märkbart efter att repot flyttats till en org på
Enterprise. Före flytten var repot personligt ägt och nivån sammanföll med
repot; flytten gjorde värdet ärvt, och kryssrutan mutades utan att något i
repot ändrats.

**Det som avgjorde frågan var ett skrivförsök, inte dokumentationen.** GitHub
Docs beskriver *ärvning* för denna inställning men stavar inte ut *låsningen* —
den meningen finns bara för grannsettingen. Två webbsidor lästa gav alltså en
stark hypotes men inget bevis. Ett `PUT` mot org-nivån gav svaret ordagrant:
`409 Conflict: "The enterprise does not allow GitHub Actions to approve pull
requests"`. Anropet avvisades i sin helhet — fail-closed, inget delvis satt
tillstånd.

**Generalisering:** när dokumentationen är tyst om huruvida en policy låser
nedåt, är ett avvisat skrivförsök mot den lägre nivån ett billigare och
ärligare svar än fler sidor dokumentation. Felmeddelandet namnger den nivå som
äger värdet.

**Praktisk följd:** sätt sådana kedjor uppifrån och ned med verifiering mellan
varje steg, och verifiera den lägsta nivån i stället för att sätta den — den
ärver. Läsning kan kräva ett scope (`admin:org`), skrivning på toppnivån ett
annat (`admin:enterprise`); att sakna scopet ger 403, vilket är en helt annan
signal än 409 och inte får läsas som "inställningen finns inte".

**Klassen är bredare än GitHub.** Samma form finns i molnplattformars
organisationspolicyer, MDM-profiler och koncernstyrda IdP-inställningar: en
lokal växel som ser tillgänglig ut men vars värde ägs av en nivå den lokala
administratören inte ser.

### L379 — `gh run list --commit` matchar inte förkortade SHA:n — den ger tom lista utan felkod

**En förkortad SHA till `gh run list --commit` returnerar `[]` med exit 0. Inget
fel, ingen varning. Varje vakt som pollar på det svaret läser tomheten som
"körningen har inte startat än" och pollar hela sin budget innan den rapporterar
timeout — alltså ett CI-problem som inte finns.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-27):** en orkestrerad CI-vakt startades med
`--commit d52d6c8` mot en PR vars körning bevisligen fanns och var `in_progress`
(`gh run list --branch` visade den, `gh pr checks` visade sju gröna jobb). Vakten
rapporterade ändå `ingen körning ännu för commit=d52d6c8` i cykel efter cykel.
Skillnaden mättes direkt:

```text
gh run list --commit d52d6c8                                   → []
gh run list --commit d52d6c8b30b76f229e407057e9aff16677faeac2  → [{...}, {...}]
```

**Varför det är värre än ett vanligt argumentfel:** felet uppträder som ett
tillstånd i det system man övervakar, inte som ett fel i anropet. Läsaren
skickas att felsöka CI, GitHub eller workflow-triggern — allt utom den plats
felet faktiskt sitter. Ett mätinstrument som tystnar vid felanvändning är värre
än inget instrument alls; se
[[live-jsonl-ar-ogonblicksbild]] för samma klass av tyst felläsning.

**En gren i samma skript var immun och visade vägen:** `--pr`-läget slår upp
`headRefOid`, som alltid är full SHA. Bara `--commit`-läget bar fällan, eftersom
det skickar sitt värde rakt vidare. Att en syskon-kodväg är immun är en signal
om att den osäkra vägen saknar en validering, inte att den är korrekt.

**Motmedlet, mekaniserat:** `scripts/ci-wait.sh` avvisar sedan 2026-07-27 allt
som inte är 40 hexadecimala tecken på `--commit`, med exit 3 (användningsfel)
och en text som pekar på `git rev-parse HEAD` respektive `--pr`. Skillnaden
mellan exit 2 (timeout) och exit 3 är hela poängen: 2 skickar läsaren till CI,
3 till anropet.

**Valideringen bevisade sig i samma andetag den skrevs.** Den fällde omedelbart
`T8` och `T9` i skriptets egen självtest-svit, som båda anropade
`--commit deadbeef`. De hade fungerat enbart därför att ingen validering fanns —
stubben brydde sig inte om värdet. En härdning som fångar två befintliga
anropare direkt är belagd, inte förhoppad.

**Sidofynd i samma pass:** svitens filhuvud påstod "15 testfall" medan den körde
17 redan före ändringen. En räkning i prosa som ingen kontrollerar driftar; den
är nu 19 och stämmer mot `grep -c '^run_case'` minus funktionsdefinitionen.

### L380 — En efterföljande `echo` maskerar kommandots exit-kod för allt som läser sammansatta anropet

**`cmd; echo "EXIT: $?" >> logg` gör det SAMMANSATTA kommandots exit-kod till
`echo`:s, alltså 0 — oavsett vad `cmd` gjorde. Varje lager som läser den yttre
exit-koden (bakgrundsjobbets notifiering, en CI-step, en wrapper) ser grönt
medan det mätta kommandot föll.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-27, orkestreringen av `TASK-59`):** en CI-vakt startades
i bakgrunden med formen

```bash
scripts/ci-wait.sh --commit <sha> > logg 2>&1; echo "VAKT-EXIT: $?" >> logg
```

Vakten föll på timeout efter 1800 s och skrev korrekt `VAKT-EXIT: 2` i loggen.
**Bakgrundsjobbets notifiering rapporterade ändå "exit code 0"** — den läste
`echo`:s utfall, inte skriptets.

Utfallet blev harmlöst bara därför att loggen lästes ändå. Hade orkestreraren
litat på notifieringens exit-kod — vilket är hela poängen med att ha en — hade
en 30-minuters timeout passerat som en grön vakt.

**Varför det är lömskt:** mönstret ser ut som extra omsorg. Man skriver ut
exit-koden *för att* göra den synlig, och gör den därmed osynlig ett lager upp.
Ju mer ambitiös loggningen är, desto tystare blir felet.

**Motmedlet:** fånga exit-koden utan att lägga ett nytt kommando sist.

```bash
cmd > logg 2>&1; rc=$?; echo "EXIT: $rc" >> logg; exit "$rc"
```

Det avslutande `exit "$rc"` är hela skillnaden: det ger tillbaka det mätta
kommandots kod till lagret ovanför, samtidigt som loggen behåller den i klartext.

**Samma felklass som fyndet den upptäcktes under:**
[[L379]] — ett instrument som svarar tyst i stället
för att säga ifrån. Här är det inte biblioteket som tystnar utan anroparens egen
loggnings-form, vilket gör den svårare att se: koden som döljer felet är den man
skrev för att avslöja det.

**Registrerad som kandidat i scratchpad först** (en agent arbetade i repot och
en ostagead fil hade kunnat svepas med i fel commit), landad tillsammans med
nästa stängning. Se [[L367]] för
varför den skrevs ned direkt i stället för att bäras som minnesbild.

### L381 — Länkgrind röd LOKALT och röd i CI är olika diagnoser — bara den ena motiverar ett undantag

**Innan en URL läggs i `.lycheeignore`: kontrollera VAR den faller. Faller den i
CI men svarar lokalt är värden som avvisar CI-nätet, och undantaget är rätt.
Faller den lokalt men är grön i CI är det din egen körning, och undantaget är
FEL — det döljer framtida länkröta för att tysta ett artefakt.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-27) — båda riktningarna inom samma timme:**

| Värd | CI | Lokalt (curl) | Diagnos | Åtgärd |
|---|---|---|---|---|
| `danger.systems` | ❌ `Connection reset by peer` i **två** oberoende körningar 13 min isär | ✅ 200 på 0,5 s | värden avvisar GitHub-runners | undantag **rätt** |
| `martinfowler.com` | ✅ `Docs link check: success` | ❌ **10** URL:er `Request timed out` | lycheens parallellism mot en strypande värd | undantag **fel** |

Curl mot `martinfowler.com` gav 200 på 0,99 s **samtidigt** som lychee timade ut
på tio URL:er från samma värd. Skillnaden är inte nåbarhet utan samtidighet:
lychee fyrar många parallella anrop mot samma host, och värden stryper. Ett
enskilt anrop går igenom.

**Varför den felaktiga åtgärden är frestande:** båda ser identiska ut i
terminalen — en röd grind med en lista URL:er. Reflexen är att tysta den, och
`.lycheeignore` ligger nära till hands. Men ett undantag är permanent och
rensas aldrig av sig självt (filen bär redan en not om det), medan ett lokalt
artefakt försvinner av sig självt.

**Kostnaden för fel åtgärd är osynlig:** `martinfowler.com` är en tungt citerad
källa i repots research-dokument. Ett undantag där hade betytt att den dagen
länkarna faktiskt ruttnar säger ingenting ifrån.

**Regeln:** CI är auktoritet för länkgrinden, inte den lokala körningen. Ett
lokalt rött som CI inte reproducerar bokförs som lokalt och åtgärdas inte i
repot. Vill man ändå slippa bruset är rätt spår grindens FORM — externa länkar
i en nattlig icke-blockerande kontroll — inte fler undantag. Se
[[L360]] för den
näraliggande men motsatta fällan: att lita på en SVAGARE lokal körning än CI:s.

### L382 — En nedskriven lärdom utan mekanisk grind tillämpas inkonsekvent — och glappet syns först när det tänder

**`L264` var skriven, förstådd och tillämpad på SEX av sviten sju
tidsformaterande platser. Den sjunde saknade den, och ingenting sa ifrån förrän
felet tände i ett tvåtimmarsfönster ett halvår senare.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-27):** `events-list.staging.test.ts` föll 3/3 i två
oberoende CI-körningar (`30308783847` 22:05Z, `30309427472` 22:13Z). Testet
byggde sin förväntade datumsträng med `Intl.DateTimeFormat` **utan** `timeZone`,
alltså i runnerns zon (UTC), medan sidan renderar i Playwright-configens
`timezoneId: Europe/Stockholm`. Mellan 22:00 och 24:00 UTC ligger runnern ett
dygn efter — sidan skrev *"28 juli"*, testet letade efter *"27 juli"*.

Felet är **deterministiskt inom fönstret och grönt alla andra timmar**. Den
schemalagda natten går 03:00 UTC och träffar det aldrig; bara sena
PR-körningar gör det.

**Det intressanta är inte buggen utan att lärdomen redan fanns.** `L264` säger
ordagrant att tidsformaterande tester ska byggas i SUT:ens tidszon, inte i
runnerns. `hem.staging.test.ts` bär till och med en kommentar som namnger
22–24Z-fönstret och de run-ID:n som avslöjade det. En inventering gav sju
platser: **sex hade `timeZone`, en hade det inte** — den som lades till senare,
av ett annat arbete, av någon som inte råkade läsa just den lärdomen.

**Slutsatsen:** en lärdom i prosa skyddar bara den som läser den vid rätt
tillfälle. Den skalar inte till nästa fil, nästa vecka eller nästa agent. Det
enda som skalar är en grind — en lint-regel, ett self-test, en CI-kontroll —
som gör avvikelsen omöjlig att landa i stället för olämplig att skriva.

**Diagnostiskt värde:** när ett fel visar sig vara en känd klass, räkna
förekomsterna innan du lagar instansen. Hittar du sex korrekta och en felaktig
har du inte hittat en bugg — du har hittat att lärdomen saknar mekanisering.
Frågan blir då om instansen ska lagas eller om klassen ska grindas.

**Vad som INTE gjordes här, öppet noterat:** instansen lagades, klassen
grindades inte. En sådan grind (lint-regel mot `Intl.DateTimeFormat` utan
`timeZone` i `tests/`) är billig men är sitt eget arbete, och den hörde inte
till skivan som blockerades. Registrerad som iakttagelse hellre än tyst
förbigången — se [[L360]]
för samma tema: det som inte körs mekaniskt är i praktiken frånvarande.

### L383 — En grind som inte prövar orsaken tar emot fel bevis [UNIVERSAL]

**Ett negativt bevis måste kräva att fällningen kom från rätt mekanism. Kräver
det bara att något föll, godkänner det varje trasig assertion, timeout och
syntaxfel som bevis för det som skulle bevisas.**

**Empiri (S91, 2026-07-28, `TASK-60`):** hermetikens andra led — att fixturens
svar faktiskt bär testerna — skulle mekaniseras. Den självklara formen var
Playwrights `test.fail()`, och tråden som beställde arbetet pekade dit. Den
förkastades: annotationen kontrollerar **att** ett test fälls, aldrig **varför**.
Ett test som gick sönder av ett stavfel i en selektor hade passerat grinden och
räknats som bevis för att appen hänger på fixturvärlden.

Grinden kräver i stället `OmockadRequestError` — vaktens egen felklass — i vart
och ett av de 51 testerna. Skillnaden är inte teoretisk: mätningen som föregick
beslutet visade 51 fällda **och** 51 med vakten som primär orsak, noll timeouts.
Först den andra siffran gör utfallet till ett hermetik-bevis.

**Samma form finns redan i repot:** `gate-proof.yml` bevisar merge-grindens
FAIL-gren genom att göra grindens utfall till leveransen — och bär en negativ
kontroll, eftersom ett grönt besked från en grind som inte kan fälla är
oskiljbart från ett äkta.

**Två följdregler som föll ur samma arbete:**

- **Fail-closed på tomhet.** Villkoret *"alla tester fälldes"* är vakuöst sant
  för noll tester. Ett felstavat projektnamn eller en flyttad testkatalog hade
  gett grönt utan att ett enda test kört. Tomhet ska vara rött.
- **Mät före du väljer form.** Att *alla* tester fälls var inte en förhoppning
  utan ett mätt utfall. Hade något test överlevt legitimt vore villkoret fel
  form från början — och det hade upptäckts först när grinden var byggd.

**Motmedlet:** när ett negativt bevis konstrueras, fråga inte *"blev det rött?"*
utan *"kan detta bli rött av fel skäl och ändå passera?"*

### L384 — En tråds föreslagna form är en hypotes, inte en spec [UNIVERSAL]

**Ett tråd-kort skrivs i stunden då problemet upptäcks, av någon som ännu inte
läst koden lösningen ska sitta i. Dess "föreslagen form" bär problemets diagnos
troget — men lösningens form är en gissning som ska prövas, inte ett beslut som
ska verkställas.**

**Empiri (S91, 2026-07-28, `T104` → `TASK-60`):** tråden föreslog en flagga som
*tömmer normalläget* för att bevisa att acceptance-testerna hänger på
fixturvärlden. Vid implementation visade läsningen av testfilerna att formen
lämnar en hel klass av tester obevisade: en fil som överskuggar allt den behöver
får sina svar ur sina egna `network.use()`-handlers oavsett vad normalläget
innehåller — och `persons-list` gör precis det, avsiktligt, för att kunna
assertera exakta sidstorlekar. Regimen behövde **båda** leden.

Samma tråd pekade på `test.fail()` som bevisform. Även den föll vid prövning, av
två skäl som bara syns i koden: annotationen kontrollerar aldrig fällningens
orsak, och lagd i en delad söm körs den en enda gång eftersom ESM-cachen kör
modulkroppen för den först importerande spec-filen.

**Diagnosen höll däremot exakt.** *"Beviset finns bara i agentens rapporttext;
inget i repot kan köra om det"* var korrekt och var det som motiverade arbetet.
Det är fördelningen värd att internalisera: **trådar är starka på problem, svaga
på lösning** — de skrivs när problemet är färskt och lösningen ännu ohypotesprövad.

**Motmedlet:** läs kodvägen innan trådens föreslagna form kodas, och skriv ut i
leveransen vad som INTE höll och varför. Ett tyst avsteg från kortets föreslagna
form läser nästa gång som att kortet aldrig lästes.

### L385 — En lokal mätning projicerad till CI är inte en mätning [UNIVERSAL]

**Att ha mätt ena ledet ger inte rätt att kalla slutsatsen mätt. Ordet "mätt"
måste täcka det led som bär slutsatsen — annars är det en extrapolering med ett
starkare ord på sig, och den formuleringen gör siffran oantastlig för varje
läsare efteråt.**

**Empiri (S91, 2026-07-28, `TASK-60`):** ett nytt CI-steg skulle kostnadsbedömas.
Jobbets nuvarande längd mättes i CI över fem körningar — 1,2–1,4 min, korrekt.
Det nya stegets kostnad mättes **lokalt** till ~50 s och projicerades till CI.
Slutsatsen skrevs som *"kostnaden är MÄTT mot jobbets timeout-tak, inte
antagen"* — i PR, i kortets acceptanskriterium och i sessionsdoket.

Skarpt utfall: **289 s**, alltså 5,8× fel, och jobbet landade på 6,5 min mot ett
tak på 8. Marginalen var 1,5 min i stället för 5,8.

**Rotorsaken var en miljöskillnad som lokal körning per konstruktion inte kan
visa:** `retries: process.env.CI ? 2 : 0`. Lokalt körs varje test en gång; i CI
körs ett rött test tre gånger. Steget var ett självtest där rött är det
FÖRVÄNTADE utfallet för varje test — alltså 153 körningar i stället för 51, var
och en med video av en fällning som beställts med flit.

**Orsaken bands, den gissades inte:** samma skript kördes lokalt med `CI=1` och
tog 297 s mot CI:s 289 s. Det uteslöt runner-hastighet och pekade på retries.
Fixen (`--retries=0` + artefakter av i regimen) gav 297 s → 73 s i samma
uppställning.

**Varför det är svårfångat:** ingen grind kan fälla ett felaktigt "mätt". CI var
grön hela vägen — jobbet klarade sig på 1,5 minuters marginal. Felet syntes först
när jobbets faktiska **steg-tider** lästes efter mergen, i stället för att
grönt-läget togs som facit.

**Motmedlet, två delar:**

- **Kör med CI:s egna miljövariabler lokalt** (`CI=1`, samma flaggor) innan en
  CI-kostnad påstås. Det är billigt och hade fångat detta på första försöket.
- **Läs steg-tiderna efter första skarpa körningen** av allt nytt som läggs i en
  CI-kedja. Grönt jobb säger att taket höll, aldrig med hur mycket.

### L386 — Flera aktörer i samma arbetsträd kräver rutin, inte uppmärksamhet [UNIVERSAL]

**När en orkestrerare och en subagent delar arbetsträd och PR-kö uppstår en
felklass som inte är kunskapsbrist: rätt sak görs vid fel tidpunkt, eller på fel
gren. Den löses av en rutin som gör felet omöjligt — aldrig av att försöka minnas
bättre i stunden.**

**Empiri (S91, 2026-07-28):** samma orkestrerare gjorde två fel av samma klass
inom två timmar, med lärdomen för det ena redan nedskriven sedan S81.

1. **Kort skapat på agentens gren.** Ett backlog-kort skapades medan en subagent
   arbetade i huvudkatalogen — alltså på DERAS uppcheckade gren. Hade agenten
   kört `git add backlog/tasks/` för sitt eget kort hade det främmande kortet
   följt med in i deras PR och brutit deras DoD *"inga orelaterade filer i
   diffen"*.
2. **Två PR:er som köade mot varandra.** En docs-PR landades medan en tyngre PR
   låg i luften. Repot kör `strict` required checks, så den senare hamnade i
   `BEHIND` och kunde inte auto-mergas trots grön CI och armerad auto-merge.
   Detta är `L328`:s BEHIND-svält — redan dokumenterad, ändå upprepad.

**Att lärdomen fanns nedskriven hjälpte inte**, och det är poängen. Båda felen
uppstod i ögonblick där uppmärksamheten låg på arbetets innehåll, inte på var
det landade. Den sortens fel går inte att läsa sig ur.

**Rutinen som gör dem omöjliga:**

- **Landa ur egen worktree så länge en agent arbetar i huvudkatalogen.**
  `git worktree add -b <gren> <sökväg> origin/main` kostar sekunder och gör
  branch-kollision strukturellt omöjlig. Städa med `git worktree remove --force`.
- **Armera en PR i taget.** Ligger flera i kön: låt den tyngre landa först, eller
  kör `gh pr update-branch` på nästa FÖRE armering i stället för att laga
  `BEHIND` efteråt.
- **`git status --short` före varje `git add`**, och ta bara egna sökvägar. Gäller
  även den som skrev instruktionen om path-scopad add till någon annan.

**Bikostnad värd att känna till:** en CI-vakt som startats mot en SHA blir
felaktig i samma stund grenen uppdateras. Stoppa den och starta om mot den nya
SHA:n — annars rapporterar den om en commit som inte längre är HEAD, vilket
läser som ett svar på en fråga ingen längre ställer.

### L387 — En halv flagg-vakt gör gammal data till en färsk rapport

**[UNIVERSAL]** Bärs ett mätläge av en env-flagga måste **varje** led i
instrumentet pröva samma flagga — skrivaren, nollställaren OCH läsaren. Vaktas
bara en del blir artefakten från en tidigare körning läst som den nuvarandes,
och utdata ser lika trovärdigt ut som riktig mätdata.

**Symptom.** `tests/global-setup.ts` nollställde `.hermetik/rapport.jsonl`
endast när `PLAYWRIGHT_HERMETIK_RAPPORT=1`; `tests/global-teardown.ts` läste och
skrev ut samma fil UTAN att pröva flaggan, och dess `catch` fångade bara att
filen SAKNADES. En hermetisk körning skrev därför ut anrop mot den skarpa
staging-värden — strukturellt omöjligt i en hermetisk körning.

**Varför det är värre än det ser ut.** Utskriften inbjöd till fel slutsats åt
BÅDA håll: att hermetiken läckte (den gjorde inte det) eller att en färsk
mätning fanns (den fanns inte). Reproducerat i sin renaste form: ett `--grep`
utan träff gav `Error: No tests found` och därefter en fullständig rapport.
**Noll tester kördes; rapporten skrevs ändå ut.**

**Regel.** Villkoret för att RAPPORTERA ska vara flaggan, aldrig artefaktens
existens. "Filen saknas" är ett svagare villkor än "mätläget var på", och
skillnaden mellan dem är exakt storleken på den tysta felklassen. Prövningen är
tvåsidig och båda leden måste köras: att utskriften UTEBLIR när flaggan är av
(med artefakten plantad), och att den fortfarande KOMMER när flaggan är på.

**Kategori:** Test-infrastruktur / mätinstrument.
**Källa:** 2026-07-28 Session 91, tråd `T105`, åtgärdad i `TASK-59.7`.

### L388 — Två mätningar som svarar på olika frågor får aldrig multipliceras ihop utan att skärningen räknas

**[UNIVERSAL]** Bär en plan två mätningar — en som avgör VILKA enheter som kan
flyttas och en som avgör HUR MYCKET en mängd enheter är värd — så är produkten
av dem inte en prognos förrän skärningen mellan populationerna är räknad. Görs
den inte, är felet inte en osäkerhet utan en aritmetisk garanti.

**Symptom.** ADR-080 projicerade att staging-mutexen skulle falla `9,25 → ~2,4
min` (faktor 3,8). Utfallet blev `9,77 → 6,55 min` (faktor 1,49) — hälften av
den lovade vinsten, och avvikelsen såg först ut som ett mätfel eller en
modellsvaghet.

**Rotorsak.** Två research-pass kombinerades utan skärning. Anrops-mätningen
(863 anrop över 32 filer) avgjorde vilka FILER som kunde hermetiseras; svaret
blev 18 filer med 152 tester. Tidsbudget-passet avgjorde hur mycket TID som
fanns i sviten; dess `410 s` byggde på **296 TESTER** som mockar sitt nätverk.
Ingen räknade snittet: **147 av de 296 mockande testerna bor i filer som också
innehåller minst ett live-test**, och kriteriet är fil-nivå — hela filen stannar.
Den största enskilda posten var en fil med 56 tester varav 50 mockande, som
stannade för att 6 gick live.

**Beviset att modellen inte var problemet.** Samma fördelningsmodell (1,384
s/test) tillämpad på den population som FAKTISKT flyttades förutsäger 251 s för
det kvarvarande steget; uppmätt blev 271 s — inom 8 %. Modellen höll.
Populationen gjorde inte det.

**Regel.** Innan två mätningar multipliceras: skriv ut vilken ENHET vardera
räknar (fil? test? anrop?) och räkna skärningen explicit. Skiljer sig enheterna
måste den ena översättas till den andras, med talet utskrivet — aldrig antaget
lika. Och när en projektion sedan visar sig felaktig: leta populationsfelet
FÖRE modellfelet. Det förra är räknebart och därmed lärbart; det senare är oftast
en efterhandsförklaring.

**Kategori:** Process / mätning.
**Källa:** 2026-07-28 Session 91, `TASK-59.7` — mätningen i
`docs/research/acceptance-utbrytningens-utfall-2026-07-28.md` § 4.

### L389 — Grönt på första försöket säger ingenting om marginalen [UNIVERSAL]

**Ett grönt test visar att gränsen inte överskreds — aldrig hur nära den låg.
Där ett tidsvärde eller ett tak är ärvt från en precedent måste marginalen
räknas, inte antas.**

**Empiri (S91, 2026-07-28, `TASK-59.8` steg 4):** en agent skrev ett test mot en
felyta och satte `timeout: 12_000` genom att härma närmaste befintliga rad.
Testet blev grönt på **första körningen**. Där hade arbetet kunnat sluta.

I stället mättes det: fem isolerade körningar gav 7901 · 7904 · 7916 · 7941 ·
8401 ms. Sedan räknades kedjan ur källan — fyra HTTP-försök med jitter plus
QueryClientens tre retries — och gav ett konstruerat värsta fall på **9800 ms**.
Marginalen mot 12 s var alltså **2,2 sekunder**, före CI:s långsammare runner och
parallell workerlast. Det gröna utfallet dolde det fullständigt.

Samma klass hade träffat repot en gång tidigare samma vecka: acceptance-jobbets
tak låg på 480 s medan den värsta observationen var 452 s — **28 sekunders
marginal**, upptäckt först när körningarna mättes per steg.

**Varför precedent-härmning förvärrar det:** raden man kopierar var grön när den
skrevs, så den bär inget varningstecken. Marginalen ärvs osynligt tillsammans med
värdet, och sprids till varje ny rad som härmar den.

**Motmedlet:** när ett tak vaktar något räknebart — retrykedjor, timeouts,
jobb-budgetar — räkna det konstruerade värsta fallet ur källan och skriv ut
räkningen vid värdet. Mät hellre fem gånger än lita på en grön körning; talet du
får är underlaget, inte utfallet.

### L390 — Ett sabotage som inte fäller har inte bevisat att vakten är svag [UNIVERSAL]

**När du saboterar för att pröva en grind och den förblir grön — misstänk först
att du missade målet, inte att grinden är trasig.**

**Empiri (S91, 2026-07-28, `TASK-59.8` steg 3):** hermetik-vakten skulle prövas
genom att en handler togs bort ur normalläget. Två försök i rad gav grönt, och
båda gångerna var slutsatsen "vakten fäller inte" **fel**:

1. `get-persons` togs bort — men filen överskuggar den handlern lokalt, så
   normalläget den saknade användes aldrig. Sabotaget träffade en yta filen inte
   rörde.
2. `get-event-formats` togs bort — men den funktionen hör till event-*skapande*,
   inte till anmälan. Filen anropade den aldrig.

Först när **både** den delade handlern och filens egen överskuggning togs bort
blev anropet genuint omockat, och då fällde vakten omedelbart, med adressen
namngiven och rätt granne föreslagen.

**Varför felslutet är lätt att göra:** grönt utfall efter ett sabotage *ser ut*
som ett svar. Men det är ett svar på frågan "nåddes vakten?", inte på frågan
"fungerar vakten?". Skillnaden syns bara om man först belägger att saboterade
kodvägen faktiskt körs.

**Motmedlet:** belägg att målet används innan du sätter tilltro till utfallet.
Konkret — spåra att den borttagna vägen faktiskt anropas av det du kör (grep
efter anroparen, eller kör med instrumentering först). Ett negativt bevis kräver
samma stränghet som ett positivt.

### L391 — Samma etikett kan bära två olika planer i två dokument [UNIVERSAL]

**När ett arbetsnamn lever i flera dokument driver innebörden isär utan att
namnet gör det. Läs alla bärare innan du planerar mot etiketten — inte den du
råkar öppna.**

**Empiri (S91, 2026-07-28):** repot beskrev "T85 våg 3" på två ställen:

- **design-doket** (2026-07-23): run-ID-scoping **i Airtable**, samdesignad med
  bas-maximeringen — *"därefter avvecklas mutexen helt"*
- **`airtable-constraints.md` P26** (2026-07-27): per-körning-instansierad
  **Postgres**, vid Fas E — *"När det är på plats avvecklas den globala mutexen
  (T85 våg 3)"*

Samma etikett, två mekanismer, två tidpunkter. Och ett **tredje** dokument hade
sedan avgjort sakfrågan mot båda: `P4`:s andra manifestation slår fast att
Airtables 5 req/s-tak är delat per bas, vilket gör parallellisering verkningslös
*"även med perfekt dataområdes-isolering"*. Run-scoping löser alltså
kollisionerna men köper ingen genomströmning — vilket ingen av de två planerna
hade tagit höjd för.

**Hur det upptäcktes:** inte genom läsning, utan genom att Marcus invände mot en
mening i ett svar (*"vad har basmaximeringen med klonbarheten att göra?"*).
Invändningen var riktad mot formuleringen; den avslöjade att sammanblandningen
fanns i repots egna dokument.

**Varför det uppstår:** ett arbetsnamn mintas i ett designdokument och citeras
sedan i ett annat, av en annan författare vid en annan tidpunkt. Citatet ärver
etiketten men inte innehållet, och ingen grind jämför dem — en länkkontroll ser
att referensen finns, aldrig att den betyder samma sak.

**Motmedlet:** vid planering mot ett arbetsnamn, `grep` efter etiketten i hela
repot och läs **varje** träff innan arbetet formas. Divergerar bärarna: skriv om
den styrande så att den blir entydig, och lämna en pekare från de övriga.

### L392 — Två rimliga instruktioner kan bli oförenliga i samma stund fyndet görs [UNIVERSAL]

**"Tysta ingenting" och "öppna PR" är båda riktiga var för sig. Tillsammans
tvingar de fram ett regelbrott så snart uppdraget faktiskt hittar något.**

**Empiri (S91, 2026-07-28, `TASK-62`):** en byggagent fick bygga en vakt, med
den uttryckliga skärpningen att den inte fick tysta fällningar på befintliga
filer — de vore ju fyndet. Samma uppdrag sa också "öppna PR".

Vakten fällde 36 tester i 8 filer. Agenten följde **båda** instruktionerna
korrekt, och resultatet blev en avsiktligt röd PR i den delade kön — vilket
`CONTRIBUTING.md` förbjuder rakt ut: *"rött i CI ska betyda EN sak: oväntad
regression."*

Felet var orkestrerarens, inte agentens. Instruktionerna var oförenliga endast i
det tillstånd där uppdraget lyckas — och det tillståndet var det *förväntade*.

**Varför det är lätt att missa:** vid formuleringen läses instruktionerna mot
lyckat-utan-fynd. "Tysta ingenting" känns som en försiktighetsåtgärd för ett
osannolikt fall, inte som en styrning av huvudspåret. Konflikten uppstår först i
utfallsläget, och då är agenten redan igång.

**Motmedlet:** formulera uppdraget mot det utfall där det *lyckas*. Fråga
konkret: om jobbet hittar exakt det vi hoppas — vad ska då hända med
leveransen? Här hade rätt instruktion varit *"hitta fällningarna, rapportera
dem, pusha inte rött"*, alltså att skilja **fyndet** från **landningen**.

### L393 — En dokumenterad väg är inte en övad väg — och skillnaden mäts i storleksordningar

**En instruktion som aldrig körts hela vägen är en hypotes, oavsett hur noggrant
den är skriven. Öva den skarpt, och mät varje led — inte bara det led som är
lätt att mäta.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-28, `TASK-70.5`):** revert-vägen skrevs av en bygg-agent
som körde git-mekaniken i sin egen worktree och mätte **66 s** från beslut till
landningsklar revert-PR. Talet var korrekt. Men agenten fick inte armera mergen
— det är orkestrerarens knapp — så mätningen slutade **precis före** det led där
problemet fanns.

Orkestreraren körde sedan samma kedja skarpt mot `main`. Utfallet:

| Led | Mätt |
|---|---|
| No-op påbörjad → revert-commit | 118 s |
| Revert-commit → **landad** merge-commit | **25 min 16 s** |

Skillnaden mellan *dokumenterad* och *övad* var alltså skillnaden mellan 66
sekunder och 25 minuter. Orsaken var inte revert-vägen utan en flaskhals ingen
mätning på det korta ledet kunde se: post-merge-lagret tog staging-mutexen på
no-op:ens egen landning — en ändring om åtta rader markdown — och revert-PR:n
stod i kö bakom den.

**Fyndet fanns bara därför att övningen kördes.** Ingen kodläsning hade avslöjat
det, eftersom båda delarna var korrekta var för sig. Det var deras möte i skarpt
läge som brast, och det mötet uppstår bara när kedjan körs hela vägen.

**Motmedlet är att skriva ut vilket led som INTE är mätt, i stället för att låta
en delmätning representera helheten.** Agenten gjorde det korrekt — den bokförde
öppet att armering → landad merge återstod. Den ärligheten är vad som gjorde att
ledet faktiskt kördes efteråt i stället för att antas.

Besläktad: [[frånvaro-av-bevis-är-inte-bevis]] · [[L362]]

### L394 — Härled ur källan — skriv aldrig av ett tal som en annan artefakt påstår

**Ett tal i ett kort, ett uppdrag eller en kommentar är någons uträkning, inte
en mätning. Räkna om det ur koden innan du bygger på det — den som skriver av
ärver felet och ger det ett andra liv.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-28):** `TASK-66`:s bygg-agent skulle dokumentera
retrykedjans tidskostnad. Kortet angav *"~8–10 s"*. Agenten vägrade skriva av
talet och härledde det ur `src/data/utils.ts` och `src/router.ts` i stället.
Uträkningen gav **7,0–8,2 s**, vilket avtäckte att ett **annat** korts räkning
var fel: `TASK-65` angav konstruerat värsta fall `4 × 2100 + 1400 = 9800 ms`,
byggt på antagandet att jittret skalar med den exponentiella delayen.

Källan säger något annat:

```js
const delay = baseDelay * 2 ** attempt + Math.random() * (baseDelay / 2);
```

`baseDelay / 2` är **konstant 0–100 ms** per sleep. Rätt tak är `4 × 1700 +
1400 = 8200 ms`, och marginalen mot timeouten var 3,8 s — inte 2,2 s som kortet
påstod. Två av kortets bärande påståenden föll med rättelsen.

**Beviset låg i kortet hela tiden, oläst:** dess egna fem mätningar
(7901/7904/7916/7941/8401 ms) ligger i 8200-modellens spann och hade varit svåra
att förklara under 9800-modellen. Empirin och räkningen motsade varandra i samma
dokument, och ingen hade jämfört dem.

**Motmedlet är att rätta VID KÄLLAN** — kortets beskrivning i samma commit som
koden — så att nästa läsare inte ärver felet. En rättelse som bara lever i en
agentrapport eller i chatten dör med sessionen.

Besläktad: [[L372]]

### L395 — Ett kontrastbevis kräver en diff som rör ENBART den klassade ytan

**En ändring av klassningslogiken kan aldrig vara sitt eget kontrastbevis:
själva ändringen faller ur klassen den inför. Beviset måste tas av en
efterföljande diff som rör enbart den nya ytan — och den diffen får inte bära
en enda fil till.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-28, `TASK-71`):** skivan gjorde `.claude/**` docs-klassad
i `ci.yml` och täckt av de tre docs-grindarna. Två av kortets sju
acceptanskriterier krävde ett run-ID där en PR som rör **enbart** `.claude/`
klassas som docs — och de kunde strukturellt inte tas av kortets egen PR, som
ändrar `ci.yml` och därmed per definition faller ur klassningen
(`!.github/workflows/**`).

Bygg-agenten identifierade det själv och **bockade dem inte**, utan skrev i
rapporten att de var utestående och varför. Beviset togs efteråt av en separat
PR som bytte namn på en agentfil och inget annat:

| Check | Utfall |
|---|---|
| `Test suite` | **skipped** |
| `Docs link check` | **success** |

**Den PR:n fick därför inte bära namnbytets fyra referenser** (`CONTRIBUTING.md`,
`tasks/todo.md`, två skript). En enda fil utanför `.claude/` hade upphävt beviset
— referenserna landade i en egen PR direkt efter.

**Mönstret generaliserar:** varje allowlist-, klassnings- eller dedup-ändring har
samma egenskap. Planera in beviset som ett eget, senare steg redan när skivan
speccas, annars upptäcks omöjligheten först när kortet ska stängas — och
frestelsen blir då att bocka kriteriet på ett svagare underlag.

Besläktad: [[frånvaro-av-bevis-är-inte-bevis]]

### L396 — Orkestreraren anger riktning, inte färdig kod — och säger det i uppdraget

**En orkestrerare som skriver färdig kod i uppdraget flyttar sitt eget
overifierade antagande in i agentens hand, där det ser ut som ett krav. Ange
riktningen, kräv kontroll mot dokumentation och kod, och säg uttryckligen att
riktningen får rivas.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-28, `TASK-64` klass A):** orkestreraren hade diagnosticerat
ett race korrekt — icke-auto-väntande query följd av icke-retrying assertion —
och föreslog fixen `await expect(sok).toHaveAttribute('aria-activedescendant',
/.+/)` före hämtningen av värdet.

**Förslaget var en no-op.** Bygg-agenten mätte att attributet är satt **redan
före** första `ArrowDown` (det pekar då på djuplänkens eget alternativ), så
närvaro-kollen hade passerat på det gamla värdet utan att vänta på uppdateringen.
Agenten gick i stället mot det väntade alternativets faktiska DOM-id.

Diagnosen var alltså rätt och fixen fel. Det är den farliga kombinationen: en
korrekt analys ger färdigkoden auktoritet den inte förtjänar, och en agent som
litar på orkestreraren bygger in felet med gröna grindar.

**Det som räddade fixen var en enda mening i uppdraget:** *"Riktningen är
Playwrights web-first assertions. Kontrollera formen mot Playwrights egen
dokumentation innan du skriver; jag anger riktning, inte färdig kod."* Utan den
hade agenten haft skäl att implementera förslaget bokstavligt.

**Samma uppdrag bar också spärren** *"radnumren är från före `TASK-65` landade —
verifiera mot faktisk fil, peka aldrig på en rad du inte läst"*, vilket är samma
disciplin i en annan riktning: orkestrerarens karta är alltid något föråldrad.

Besläktad: [[L372]] ·
[[L393]]

### L397 — En bakgrundsprocess som harnesset inte spårar notifierar aldrig

**Startar du en väntan med `nohup … &` inuti ett vanligt verktygsanrop blir
processen osynlig för harnesset — ingen notifiering kommer när den är klar, och
agenten blir sittande tills en människa knuffar den.** Använd verktygets egen
bakgrunds-flagga i stället. `[UNIVERSAL]`

**Empiri (S91, 2026-07-29):** samma session, samma skript, två anropsformer och
två helt olika utfall.

- **Med `run_in_background: true`** (verktygets flagga): fem CI-vakter startades
  så. Alla fem gav en `task-notification` när de blev klara, och arbetet
  fortsatte inom sekunder utan att någon behövde säga till.
- **Med `nohup bash -c "…" &`** inuti ett vanligt kommando-anrop: sex vakter
  startades så. **Noll notifieringar.** Varje gång rapporterades "vakten kör",
  varefter turen tog slut och sessionen stannade — tills Marcus skrev *"Ser du
  inte att #402 är klar?"* och senare *"Varför måste jag påminna dig hela tiden
  om att körningarna är klara, du märker det ju inte."*

Bytet av anropsform skedde mitt i sessionen och var oreflekterat: `nohup`-formen
såg ut att göra samma sak, och gjorde det också — för processen. Skillnaden låg
helt utanför processen, i om harnesset kände till den.

**Varför det är värre än en långsam loop:** en agent som pollar för ofta är
ineffektiv men gör framsteg. En agent som väntar på en notifiering som aldrig
kommer gör noll framsteg och *tror sig vänta korrekt*. Felet har ingen intern
signal — det syns bara utifrån, som tystnad. Det är därför människan blir
detektorn, vilket är precis fel aktör för uppgiften.

**Formen:** starta väntan med verktygets bakgrunds-flagga, en gång per väntan.
Behövs kommandokedjor (`vakt; echo exit=$?`) läggs de i flaggans kommando — inte
i en egen `nohup`-wrapper.

**Skärpningen mot närliggande:** detta är inte
[[L380]] (som handlar om att läsa fel
exitkod). Här läses ingen kod alls, för ingen läsare finns. Släktskapet är att
båda ser ut som fungerande mekanik och båda ger tyst fel — men denna kostar
mänsklig uppmärksamhet i stället för en felaktig slutsats, och det är den dyrare
valutan.

### L398 — Ett fynd måste säga VAR felet sitter, annars larmar det om fel yta

**En korrekt observation som utelämnar vilket lager den gäller läses som om det
mest synliga lagret är trasigt. Det leder prioriteringen fel och skickar
läsaren till fel fil.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-29):** efter merge queue-aktiveringen skrevs fyndet som
*"#405 rörde en backlog-kortfil och drog ändå full staging-svit"*. Sant — men
utan att säga var.

<!-- vale Vale.Terms = NO -->
Marcus svarade: *"Vad jag kan se på Github så körde inte #405 full svit i alla
fall."*
<!-- vale Vale.Terms = YES -->

Han hade rätt om ytan han såg. Tre ytor, och bara den tredje var drabbad:

| Yta | Körning | Utfall |
|---|---|---|
| PR-grinden | `30410841005` (`pull_request`) | `Test suite` **skipped** ✅ |
| Merge queue | `30410912068` (`merge_group`) | `Test suite` **skipped** ✅ |
| Post-merge på `main` | `30410980946` (`push`) | `Staging (API + E2E)` success ← fyndet |

Formuleringen läste som om PR-grinden vore trasig. Den var orörd. Det som
faktiskt blev dyrare var efterkontrollen på `main` — ett långsammare och
mindre akut problem, som dessutom ligger i en helt annan fil.

**Konsekvensen av utelämnandet är inte kosmetisk.** Ett kort som antyder att
PR-grinden är trasig prioriteras som akut, och den som plockar det öppnar
`ci.yml` i stället för `scripts/classify-post-merge.sh`. Felaktig
allvarlighetsgrad och felaktig startpunkt, ur en observation som var korrekt i
sak.

**Formen:** ett fynd bär alltid tre delar — **vad**, **var**, och **vad som
INTE påverkas**. Den tredje delen är den som oftast utelämnas och den som
oftast avgör prioriteringen. Skriv den även när den känns självklar; den är
självklar bara för den som just gjort mätningen.

Släkt med [[L394]]: båda handlar om att
ett sant delpåstående kan bära en falsk helhet.

### L399 — Ett skydd som fungerar av en slump tas bort av nästa refaktor

**Att en farlig konfiguration råkar vara ofarlig i dag är inte samma sak som att
den är säker. Skriv ut skälet explicit, annars är skyddet osynligt för den som
ändrar nästa gång.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-29, merge queue-aktiveringen):** `ci.yml` bar

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.event.number || github.sha }}
  cancel-in-progress: true
```

`cancel-in-progress: true` tillsammans med merge queue är en **dokumenterad
fälla**: avbryts en kö-körning rapporteras dess required check aldrig, PR:en
faller ur kön, och i värsta fall fälls hela kön (community-discussion #137976).

Vi var skyddade — men av en slump. På `merge_group`-ytan saknas
`github.event.number`, så uttrycket faller till `github.sha`, som är unik per
merge group. Varje kö-körning fick därmed sin egen concurrency-grupp och kunde
inte avbryta någon annan.

**Ingen hade skrivit det.** Skyddet vilade på en fallback som fanns där av ett
helt annat skäl (PR-nummer för PR-ytan), och på en egenskap hos ett event som
inte existerade när raden skrevs. En framtida refaktor som "städar" uttrycket —
eller som lägger till en till fallback — hade tagit bort skyddet utan att någon
märkt det förrän kön gick sönder.

Åtgärden blev att göra båda leden explicita:

```yaml
group: ${{ github.workflow }}-${{ github.event.number || github.event.merge_group.head_sha || github.sha }}
cancel-in-progress: ${{ github.event_name != 'merge_group' }}
```

Det andra ledet ändrar faktiskt beteendet — men första ledet ändrar ingenting
alls i dag. Det skrevs ändå, eftersom **en rad som dokumenterar varför den finns
överlever en refaktor; en tyst fallback gör det inte.**

**Formen:** när research visar att en känd fälla inte träffar oss — fråga alltid
*varför inte*, och om svaret är "av en slump" eller "för att ett fält råkar vara
tomt": skriv ut det. Kostnaden är en rad. Alternativet är ett skydd som ingen
kan se att de tar bort.

### L400 — Rättelsearbete producerar egna fel i ungefär samma takt som det tar bort dem

**Ett pass som rättar en artefakt inför nya fel i den. Utan en extern läsning
efteråt byts en känd feluppsättning mot en okänd — och den nya ser färsk ut,
alltså trovärdig.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-29):** restlistans audit fann ~20 fynd. **Fem av dem var
skapade samma kväll, av rättelsearbetet självt:**

1. `TASK-76` lades i en sektion kartan bara når via steg 7 — trots att kortets
   egen text säger att det ska tas i steg 3.
2. Omnumreringen av kartans steg gjorde ett stycke i § A7 (*"steg 4 är förkrav
   för steg 5–6"*) **falskt i en andra giltig läsning**.
3. `A3 ×3` i kartan blev stale av min egen A3-landning två timmar tidigare.
4. Två `[x]`-poster lämnades i kroppen, mot filens egen underhållsregel att
   kroppen bara bär öppna poster.
5. Ett nytt tabellhuvud öppnades i avbockningsloggen i stället för att fortsätta
   den befintliga — loggen blev tre tabeller där texten förutsätter en.

Ingen av de fem var slarv i stunden. Var och en var en lokalt korrekt ändring
vars **följdverkan på filens helhet** inte gick att se från den plats ändringen
gjordes.

**Varför raten är hög just vid rättelse:** den som rättar arbetar per fynd, inte
per helhet. Varje fix är liten och uppenbart riktig lokalt. Samtidigt rör
rättelsepasset många ställen i samma artefakt under kort tid, vilket är precis
den betingelse där tvärkopplingar hinner brytas snabbare än de hinner läsas om.

**Formen:** låt aldrig samma aktör vara både rättare och slutkontroll på en
artefakt av koherens-klass. Kör en separat läsning efteråt — och räkna med att
den hittar något, för gör den inte det är det ett tecken på att den var för
ytlig, inte att passet var perfekt.

**Kostnadsjämförelsen som avgör:** tre parallella läsagenter kostade en bråkdel
av ett pass, och fyra av de allvarligaste fynden hade annars landat som
"rättade". Se [[L368]] — här är
det samma slutsats med extern läsning i stället för mekanik som bärare.

### L401 — Tre samstämmiga kopior är osynliga för läsning — bara registret avslöjar dem

**När samma påstående står i flera dokument och alla säger samma sak, kan ingen
mängd korsläsning *mellan dokumenten* avslöja att det är fel. Felet syns bara
mot den auktoritativa källan.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-29):** `PAUSLÄGE`-blocket, `todo.md`-kadensen och
`s91-restlistan.md` påstod alla **"NIO KORT STÄNGDA … `63`"**. Backlog-CLI:t
sade `○ To Do`.

Vad som faktiskt gällde: PR #385 var mergad, alla AC bockade, tre av fyra DoD
bockade — och **DoD #3 (CI grön per jobb) obockad**, eftersom den kräver en
signal som inte finns när bygg-agenten lämnar ifrån sig arbetet. Stängningen är
orkestrerarens svans, och den tappades i en paus mitt i vågen.

Felet överlevde **en paus, en resume och en full genomläsning av samtliga tre
dokument.** Det upptäcktes först när kortets status slogs upp mot registret av
ett annat skäl.

**Varför samstämmighet är farligare än motsägelse:** två dokument som säger emot
varandra tvingar fram en kontroll. Tre som säger samma sak *bekräftar varandra*
för läsaren och släcker impulsen att verifiera. Antalet kopior ökar
trovärdigheten utan att öka sanningshalten — de härstammar ju alla från samma
ursprungliga påstående.

**Formen som fångar det:** vid varje läge där ett dokument påstår en STATUS
(stängd, landad, klar, avblockerad), slå upp den mot registret som äger den —
backlog-CLI:t för kort, `threads/README.md` för trådar, `git`/`gh` för
landningar. Räkna aldrig statusen ur prosa, hur många ställen den än står på.

**Detta är skälet bakom restlistans egen formregel** — *"kopior driftar; pekare
gör det inte"* — och beviset för att regeln behöver gälla handoff-blocken också,
inte bara den fil där den råkar stå skriven. Se
[[L382]] för samma mönster på en annan yta.

### L402 — Verifiera stödet i den PINNADE versionen, inte i dokumentationen

**Att ett bibliotek stödjer något säger inget om att *vår* version gör det.
Läs koden vid den SHA vi faktiskt kör.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-29, merge queue-aktiveringen):** hela vår
risk-klassning — docs-klassen, D1-klassen, dedupen — vilar på
`tj-actions/changed-files`, SHA-pinnad till v47.0.6. Kortet för merge
queue-aktiveringen nämnde den **inte alls**, trots att en klassning som faller
ut fel i kön hade gjort varje kö-landning antingen otestad eller onödigt dyr.

Kedjan som gjordes, i den ordningen:

1. **Dokumentationen** sade att actionen stödjer `merge_group`. Otillräckligt —
   den beskriver senaste versionen.
2. **PR #1404** visade att stödet mergades 2023-07-24. Bättre, men fortfarande
   ett datum mot ett annat datum.
3. **Koden vid vår exakta pin** avgjorde saken. `src/commitSha.ts`:

   ```js
   } else if (github.context.eventName === 'merge_group') {
     currentSha = github.context.payload.merge_group?.head_sha
   ...
     previousSha = github.context.payload.merge_group?.base_sha
   ```

Steg 3 gav dessutom mer än ett ja: det visade **vilken diff-bas** som används
(`base_sha → head_sha`), vilket är den egenskap som avgör om klassningen blir
rätt. Dokumentationen hade aldrig kunnat ge det svaret.

Beviset höll skarpt: kvällens första kö-körning klassade `Test suite` som
`skipped` för en docs-landning på `merge_group`-ytan.

**Varför datum-resonemanget inte räcker som slutbevis:** "stödet kom tre år före
vår pin" är ett starkt indicium, men det förutsätter att stödet aldrig
regredierat, att vår pin är den tag vi tror, och att funktionen inte flyttats
bakom en flagga. Alla tre antagandena kostar en tool-call att pröva och en
felsökningsrunda att missa.

**Formen:** vid varje beroende som bär en grind — läs den funktion du förlitar
dig på, i koden, vid den ref som står i workflow-filen. `gh api
repos/OWNER/REPO/contents/PATH?ref=<vår-sha>` gör det på ett anrop.

Släkt med [[L360]]:
samma disciplin, ett lager längre ut — där gäller det grindens flaggor, här dess
beroenden.

### L403 — En kontroll som aldrig prövats mot ett känt fel är inte bevisad — den är hoppfull

**En mekaniserad kontroll ärver tyst antagandena i sitt mönster. Prövas den bara
mot ett rent tillstånd bevisar det ingenting: grönt betyder då antingen "inga fel"
eller "kan inte se fel", och de två går inte att skilja åt utifrån. Varje ny
kontroll ska därför köras mot ett KÄNT fel innan den skrivs in — annars levereras
en täckning som inte finns.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-29, femtonde resumen — `tasks/s91-restlistan.md`):**

Restlistan hade trettonde resumen fått en mekanisk statuskontroll i filhuvudet,
införd just för att ersätta ett auditpass efter att en audit lämnat kvar två fel.
Kontrollen fungerade — den fångade fel samma kväll den skrevs. Den matchade

```text
^- \[ \] \*\*`TASK-N`
```

alltså kort-ID:t **först** på raden. Det var sant för de flesta poster i filen.
Men A7-spårets rader bär sitt ID **sist**, efter en pil. För dem var kontrollen
strukturellt blind, och det syntes inte, eftersom utfallet var tomt — vilket lästes
som "inga fel".

Tre fel låg och väntade i kroppen, samtliga redan korrekt bokförda i filens egen
Avbockningslogg:

| Post | Kort | Stod som | Faktisk status |
|---|---|---|---|
| `A7:3` | `TASK-70.1` | öppen | Done |
| `A7:5` | `TASK-70.3` | öppen | Done |
| `A7:6` | `TASK-70.4` | avbockad **i kroppen** | Done |

`A7:6` är det skarpaste fallet: raden bröt filens uttryckliga regel att kroppen
bara bär öppna poster, låg synlig mitt i filen, och passerade både kontrollen och
varje mänsklig genomläsning under ett dygn.

**Felet var inte i regexen utan i leveransen av den.** Mönstret skrevs mot de
rader som råkade ligga närmast när det skrevs, och kördes sedan mot en fil som var
nyss städad. Ett grönt utfall mot ett rent tillstånd var hela beviset.

**Motmedlet är billigt och tar en tool-call:** kör den nya kontrollen mot en
version av filen där felet bevisligen finns — `git show <sha>:<fil>` räcker.
Formen som ersatte den prövades trefaldigt före den skrevs in: **tre FEL** mot
filen vid `02a9517` (där den gamla gav noll), **tomt** mot den rättade, och
**ingen falsk positiv** på den rad som nämner ett `Done`-kort som beroende utan
att bära det. Först då var täckningen ett påstående med belägg.

**Skärpningen mot närliggande lärdomar:** [[L322]] handlar om grindar som är
fail-open — de släpper igenom fel de *ser*. Denna klass är tystare och värre: en
grind som aldrig ser felklassen alls, och därför aldrig ens får chansen att vara
fail-open. Och där lärdomen om CI:s exakta kommando säger att en lokal körning med
andra flaggor är en grind du inte kört, säger denna att **en grind du kört men
aldrig sett fällas är en grind du inte vet något om.**

**Generaliseringen:** det gäller varje mekanisering som ersätter ett mänskligt
pass — grindvakter, statuskontroller, lint-regler, self-tests. Rött-först är
redan repots kontrakt för kod (ADR-071 § Rött-först). Denna lärdom säger att
kontraktet gäller lika mycket för de kontroller vi skriver åt oss själva i
prosa-artefakter, där ingen CI påminner om det.

### L404 — PAUSLÄGE-blockets HEAD-rad är alltid en commit efter — det är formen, inte ett slarv

**Ett paus-block som bokför sitt eget `HEAD` skriver ner ett värde som paus-commiten
själv omedelbart gör inaktuellt. Avvikelsen är därför inbyggd i formen och ska
läsas som förväntad, inte utredas som divergens vid varje resume.** `[UNIVERSAL]`

**Empiri (S91, fem förekomster under tre dygn):** sjunde, åttonde, nionde,
trettonde och femtonde resumen fann alla samma sak — `PAUSLÄGE`-blockets
`main @ <sha>` pekade en commit före faktiskt `HEAD`. Femtonde resumen: blocket
sade `f3a2a11`, disk sade `02a9517` — och `02a9517` var merge-commiten för
*pausens egen PR*.

Mekanismen är trivial när den väl är utskriven: paus-blocket författas, commitas,
pushas och mergas. Raden som beskriver `HEAD` skrivs alltså **före** den commit som
landar raden. Den kan per konstruktion aldrig vara aktuell i det ögonblick nästa
resume läser den.

**Den trettonde resumen formulerade det redan rätt** — *"mönstret är nu så stabilt
att det är en egenskap hos paus-formen, inte ett misstag per gång"* — och lämnade
det som lesson-kandidat. Detta är den posten, med en femte datapunkt.

**Vad lärdomen ändrar i praktiken:**

1. **Disk vinner, alltid.** Det är redan resume-rutinens regel; det som saknats är
   att veta att just *denna* avvikelse är väntad och inte behöver undersökas.
2. **Rapportera den som bekräftad form, inte som fynd.** En förväntad avvikelse som
   varje gång rapporteras som ⚠️ tränar läsaren att ignorera ⚠️ — och då kostar den
   mer än den upplyser.
3. **Fixa den inte genom att skriva om paus-formen.** Att låta paus-blocket utelämna
   `HEAD` vore att ta bort information som ÄR användbar (den säger vad som var landat
   när pausen skrevs). Rätt åtgärd är att formen bär sin egen begränsning i klartext.

**Den generella klassen:** varje artefakt som bokför sitt eget tillstånd i samma
skrivning som ändrar tillståndet lider av detta. Sessionsdokets `updated:`-fält,
en CHANGELOG:s "senast ändrad", ett kort som noterar sin egen commit — alla är
samma form. **Frågan att ställa är inte "stämmer värdet?" utan "kunde värdet ha
stämt när det skrevs?"** Är svaret nej är avvikelsen formens, inte författarens.

### L405 — Registret mot disk är den obevakade axeln — två register som är eniga kan båda ha fel

**När arbete landar utan att kortet flippas blir registret osant, och varje karta
som pekar på registret ärver osanningen utan att bli inkonsekvent. Kontroller som
jämför karta mot register kan därför aldrig fånga klassen: de två är eniga, och
båda har fel mot disken. Den enda källan som kan falsifiera ett kort är
KODEN.** `[UNIVERSAL]`

**Empiri — två observationer i samma session (S91, 2026-07-29):**

1. **`TASK-63`** stod `To Do` medan **tre dokument** påstod motsatsen. Det var
   korsläsning mot registret som avslöjade det, och slutsatsen blev "lita på
   registret, inte på kartor".
2. **`TASK-72`** stod `To Do` med **samtliga sex AC bockade** och DoD obockad —
   medan disken bar hela lösningen sedan dagen innan (PR `#383`, `a264a16`,
   `.ci-wait-policy.conf` på plats, `test-ci-wait.sh` 27/27 grön). Här hade
   registret fel, och restlistan höll med det.

Observation 2 vänder alltså slutsatsen från observation 1 på huvudet. Registret är
auktoritativt **relativt kartor**, men det är inte auktoritativt relativt disk.

**Varför den mekaniska kontrollen inte kunde hjälpa.** Restlistans statuskontroll
— lagad samma dag efter att ha visat sig blind för en hel radklass — jämför
`karta ↔ register`. I `TASK-72`:s fall var de **eniga** (båda sade öppen). Ingen
avvikelse fanns att fånga. Kontrollen var korrekt, körd, och grön — och ändå stod
ett färdigbyggt arbete som oöppnat.

**Kostnaden var nära att bli konkret:** kortet lästes bara för att det stod på tur
att spawnas. Hade det spawnats hade en bygg-agent byggt om en lösning som redan
låg i `main` — och sannolikt landat en konkurrerande variant.

**Signalen som faktiskt bar fyndet** var inte statusraden utan formen: *alla AC
bockade + DoD obockad + status `To Do`* är ett internt inkonsistent kort. Ett kort
vars AC är avbockade har per definition haft någon som gjorde arbetet.

**Motmedlen, i stigande kostnad:**

1. **Läs alltid kortet i sin helhet före spawn** — inte bara status och etikett.
   Det är gratis och hade fångat båda observationerna.
2. **Behandla `alla AC bockade + status ≠ Done` som ett larm**, inte som ett
   normaltillstånd. Det är mekaniserbart mot backlog-CLI:t utan att röra disken.
3. **Sök disken innan ett kort spawnas** — `git log --grep="TASK-N"` kostar en
   tool-call och besvarar frågan direkt.

**Den generella formen:** varje gång ett tillstånd bokförs på ett ställe och
verkställs på ett annat uppstår axeln. Kartor mot register är den lätta riktningen
att vakta, och därför den enda som blivit vaktad. **Fråga inte bara "är mina
register eniga?" utan "vad skulle falsifiera dem båda?"**

### L406 — Parallella agenter delar scratchpad — filnamn är en delad namnrymd, inte en privat

**Bygg-agenter får var sin git-worktree, men INTE var sin scratchpad. Två agenter
som väljer samma självklara filnamn skriver över varandras arbete, och den som
skriver sist vinner tyst. Isolering av arbetskopian är inte isolering av
temporärfiler.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-29, femtonde resumen):** tre bygg-agenter kördes parallellt,
var och en i egen worktree. `TASK-75`:s agent rapporterade oombett:

> *"scratchpad-katalogen delas mellan oss agenter (jag höll på att skriva över
> `TASK-76`-agentens PR-text — bytte till eget filnamn)"*

Båda hade nått samma naturliga val — en fil för PR-texten, med ett generiskt namn.
Ingen av dem gjorde något fel; formen bjuder in till kollisionen.

**Varför det är värre än det låter.** En överskriven PR-text upptäcks direkt, för
den läses innan den används. Men samma namnrymd bär också mätdata, loggar,
mellanresultat och extraherade skript. En agent som skriver `matning.json` och
läser tillbaka den efter att en annan agent skrivit sin egen `matning.json`
**får fel data utan något felmeddelande** — och rapporterar tal som ser rimliga
ut. Det är den tysta varianten, och den hade ingen fångat.

Kollisionen fångades här bara för att en agent råkade se den andras fil och
**rapporterade den i stället för att tyst byta namn**. Hade den bara bytt namn
hade formen stått kvar orörd till nästa gång.

**Motmedlet, i stigande kostnad:**

1. **Namnge varje scratchpad-fil med sitt kort-ID eller agent-ID** —
   `pr-text-task-76.md`, inte `pr-text.md`. Gratis, och räcker.
2. **Orkestreraren säger det i uppdraget** när fler än en agent körs samtidigt.
   Agenten kan inte veta att den har sällskap; bara den som spawnar vet.
3. **Egen underkatalog per agent** om volymen växer.

#### Skärpt 2026-07-30 — framkallat i kontrollerat försök

Fragmentet skrevs på ett andrahandsvittne. Felläget är sedan dess **framkallat**:
två agenter med identiskt uppdrag fick samma sökväg och den ena skrev över den
andra. Tre saker blev skarpare, och de ändrar var motmedlet ska sitta.

**Sökvägen är härledd ur sessions-ID:t.** `CLAUDE_CODE_SESSION_ID` är exakt
scratchpad-katalogens namn, och en subagent ärver den — *"Subagents run in the
same process as the parent session"* (`code.claude.com/docs/en/sandboxing.md`).
Delningen är alltså **strukturell design, inte en bugg**. Worktree-sidans sektion
om delat tillstånd räknar upp `.git`, project-scope-plugins och
permission-approvals; **temp-kataloger nämns inte alls**.

**`Write` är skyddat — skalet är inte.** Harnessets read-before-write-spärr är
**per agent-kontext**, alltså ett reellt cross-agent-skydd: en agent nekas skriva
en fil den inte själv läst, även om en annan agent läst och skrivit den. Men
`echo … > fil` från Bash går rakt igenom, exit 0, ingen varning. **Den tysta
varianten kan bara uppstå via skalet** — och det är precis kanalen mätdata skrivs
i (`flake-matserie.mjs`, `ci-metrics.mjs` tar alla `--utdir` från anroparen).

**Punkt 3 ovan är prosa, inte mekanism.** Vi äger inte katalogen och kan inte
konfigurera den; en egen underkatalog kräver att agenten skapar den, alltså att
den följer en instruktion. Att kalla det mekanism är felklassen
[[L409]].

**Vad som DÄREMOT är mekanism, och var den biter:** `tools` som allowlist i
agent-frontmatter tar bort verktyg helt (`sub-agents.md` rad 279–280, 340).
Två fällor mätta: `disallowedTools: Edit` tar **inte** bort `NotebookEdit`, så
använd allowlist aldrig denylist; och en agent utan Bash kan **spawna** en agent
med Bash så länge den behåller `Agent`. Mekanismen hjälper alltså läsande
agenttyper — men inte `bygg-agent` eller `research-pass`, som båda behöver Bash
för att göra sitt jobb. Där är konventionen allt vi har, och den ska heta
konvention.

Belägg: `docs/research/harness-namnrymd-agenter-2026-07-30.md`.

**Den generella formen:** när en isoleringsmekanism införs, fråga vad den
FAKTISKT isolerar. Worktree-isoleringen löser filkonflikter i repot och läser
därför som "agenterna är isolerade". Den säger ingenting om `/tmp`, om
miljövariabler, om delade portar, om externa system eller om databaser — och
varje sådan yta är en delad namnrymd tills någon visar motsatsen. **Isolering är
alltid isolering av något bestämt, aldrig isolering i allmänhet.**

Jfr [[L323]] (subagent bär inte asynkron CI-svans — orkestreraren äger den):
samma klass av gränsdragningsfel mellan agent och orkestrerare, åt andra hållet.

### L407 — En hermetisk svit mot en dev-server öppnar ALLTID en WebSocket — och `page.route` fångar den inte

**En hermetik-vakt som fäller på "all WebSocket-trafik" fäller hela sviten, för
Vites HMR-socket är en förutsättning för att dev-servern alls fungerar.
Localhost-undantaget är därför inte en artighet utan villkoret för att vakten går
att införa. Och HTTP-vakten skyddar inte WS: `page.route` fångar aldrig
WebSocket-uppgraderingar.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-29, `TASK-56`):** den hermetiska fixturvärlden hade sedan
`task-54.2` en vakt som fällde varje omockat HTTP-anrop med adressen namngiven.
WebSocket saknade motsvarighet — bindningen `@msw/playwright` registrerar
`context.routeWebSocket` med match-all och anropar `route.connectToServer()` när
ingen handler matchar, alltså en **verklig uppkoppling mot den riktiga adressen**.

Fyndet var latent: appen har inga realtime-funktioner, så ingen kod öppnar en
WebSocket. Men mätningen visade att **varje visuellt test redan öppnade en** —
Vites HMR-socket mot `ws://localhost:<port>`.

**En naiv "fäll alla WS"-vakt hade alltså fällt samtliga tolv baseline-tester.**
Det upptäcktes bara för att vakten mättes mot den verkliga sviten innan den
skrevs färdig.

**Formen som fungerade:** localhost-grenen anropar `server.connect()` och bevarar
dagens beteende exakt, vilket bevisades genom att alla tolv baselines förblev
**bitidentiska (sha1)**. Allt annat fälls med adressen namngiven och en egen
felklass.

**Två saker att bära vidare:**

1. **`page.route` fångar inte WebSocket.** En sid-vakt som ser heltäckande ut för
   HTTP lämnar WS orörd — och det syns inte, eftersom frånvaron av trafik ser
   likadan ut som frånvaron av en vakt. Klassen är repots återkommande: partiell
   täckning som inte är utskriven läses som fullständig.
2. **Mät vad sviten FAKTISKT gör innan du skriver en vakt mot den.** Vakten här
   var korrekt i sin idé och hade ändå fällt allt, eftersom idén byggde på en
   antagen trafikbild. Den positiva läckagemätningen — en egen lyssnare på
   IPv6-loopback, utanför localhost-undantaget — var det som gjorde bilden
   verklig: den fick `GET /realtime upgrade=websocket` **medan testet var grönt**.

**Jfr [[L322]]:** där handlade det om en grind som är fail-open; här om en grind
som inte finns för en hel trafikklass. Den senare är tystare — en fail-open grind
syns åtminstone i jobblistan.

### L408 — En retry-flagga täcker en uppräknad felmängd — läs den, anta den inte

**En mitigering kan vara rimlig, landa grön och ändå inte täcka felet den skrevs
för. Verifiera fixen mot den uppmätta fel*koden*, inte mot felets kategori.**
`[UNIVERSAL]`

**Empiri (S91, 2026-07-29, `TASK-83`):** lint-jobbets `curl`-hämtning av
shellcheck föll på **exit 35** (`CURLE_SSL_CONNECT_ERROR`) efter 0,13 s. Kortet
föreslog som minsta-ändrings-alternativ:

```bash
curl --retry N --retry-connrefused --retry-delay S
```

Den formen hade inte fixat någonting.

`curl --retry` definierar "transient" som en **uppräknad mängd**: *a timeout, an
FTP 4xx response code or an HTTP 408, 429, 500, 502, 503, 504, 522 or 524
response code*. Ett TLS-connect-fel finns inte i den mängden.
`--retry-connrefused` adderar **enbart** `ECONNREFUSED`. Flaggan som faktiskt
täcker exit 35 är `--retry-all-errors` (curl 7.71.0+).

Det farliga är inte att förslaget var fel — det är att det hade **sett rätt ut i
efterhand**. En PR med `--retry` landar grön, kortet stängs, och nästa fällning
läses som "det där fixade vi ju, alltså är detta något annat". En verkningslös
mitigering är dyrare än ingen mitigering, eftersom den tar bort frågan.

**Beviset som skilde formerna åt** var en lokal harness med en TLS-server som
bryter handskakningen för de N första anslutningarna — alltså samma felkod, inte
samma felkategori:

| form | utfall |
|---|---|
| `-sL` (dåvarande) | exit 35 |
| `-sL --retry 5 --retry-connrefused` (kortets förslag) | exit 35 |
| `-fsSL --retry 5 --retry-all-errors` (valdes) | exit 0, efter 2 återförsök |

Först den tredje raden är ett bevis. De två första hade båda passerat en
verifiering som bara frågade "fungerar nedladdningen i normalfallet?".

**Formen:** när en fix riktas mot ett *uppmätt* fel — reproducera den exakta
felkoden och kör fixen mot den. "Nätverksfel" är en kategori; `35` är felet. En
flaggas räckvidd läses i dess manual, aldrig ur dess namn: `--retry` låter som
"försök igen vid fel" och betyder något smalare.

Släkt med
[[L402]] — samma
disciplin, en nivå in: där gäller det om beroendet har funktionen, här om
flaggan täcker vårt fall.

### L409 — En regel som felaktigt påstås mekaniserad granskas inte — det är värre än ingen mekanism

**En nedskriven regel utan mekanism efterlevs inkonsekvent. En regel som PÅSTÅR
sig ha en mekanism den saknar efterlevs kanske lika bra — men den granskas inte,
för filen säger att saken är löst. Falsk tillit är dyrare än erkänd svaghet.**
`[UNIVERSAL]`

**Empiri (S91, 2026-07-29):** hub-konstitutionen sade på två ställen
*"Mekaniserad som spärr — se `settings.json` `permissions.deny`"*. Sökt i spoken,
i user-scope och i båda `settings.local.json`: **noll `deny`-regler, noll
`ask`-regler, överallt.** Den enda spärr som faktiskt fungerade var byggd som en
`PreToolUse`-hook — alltså inte ens där konstitutionen sade att spärrar bor.

**Reglerna bröts aldrig.** STOPPA kördes som text hela sessionen, korten enbart
via CLI:t. Prosan fungerade. Det som gick sönder var att ingen letade — i
månader — eftersom filen redan svarade på frågan.

**Regeln som blev kvar är skarpare än "mekanisera mer":**

> Synden är inte prosa. Synden är **prosa som påstår sig vara mekanism**.

En regel får vara prosa. Ett påstående om att regeln är mekaniserad får det inte
— då ska mekanismen finnas, och något ska kunna kontrollera att den gör det.
Åtgärden blev därför en grind som verifierar att `permissions`-referenser i
styrande filer resolverar, inte en spärr till.

Besläktad: [[L382]] (regeln utan mekanism) ·
[[L373]] (verktyget som inte körs)

### L410 — Fyr-frekvens mäts mot KORREKT arbete, inte mot total aktivitet — det avgör grindens form

**En grind ska mätas på hur ofta den fyrar när arbetet görs RÄTT, inte på hur ofta
den rörda ytan i övrigt berörs. De två talen kan skilja sig med hela intervallet,
och det är det första som avgör formen.** `[UNIVERSAL]`

**Formen följer talet, och det är inte en smaksak:**

| Fyrar på korrekt arbete | Form | Varför |
|---|---|---|
| 0 % | `deny` | Gratis. Ingen bedömning, ingen friktion, fångar bara felläget |
| Sällan | `ask` | Kalibrerad. Bedömningen är värd sitt pris |
| Ofta | **ingen grind** | Blir brus → gummistämpel. Approval fatigue, precomputerad |

**Empiri (S91, 2026-07-29):** `backlog/tasks/**` rördes av **11 %** av commitarna
— vilket läser som "för brusigt att grinda". Men alla legitima skrivningar går via
`Bash(backlog task …)`, aldrig via `Edit`/`Write`. Mot KORREKT arbete är talet
alltså **0 %**, och en `deny` på `Edit`/`Write` mot den sökvägen kostar exakt
ingenting samtidigt som den fångar hundra procent av felläget.

Samma mätning gav motsatt svar för prejudikat-filerna: korrekt arbete skriver
där, 8,5 % av commitarna, så `deny` vore fel och `ask` rätt.

**Konsekvens:** en grind vars fyr-frekvens mot korrekt arbete inte är mätt har
inte fått sin form vald — den har fått en gissad.

Besläktad: [[L412]] — låg fyr-frekvens gör
formen billig, men gör den inte motiverad.

### L411 — `git log -N -- <path>` svarar på en annan fråga än den man tror — och svaret ser rimligt ut

**`git log -200 -- <sökväg>` betyder "de senaste 200 commits SOM RÖRDE sökvägen",
inte "av de senaste 200 commits, hur många rörde den". Skillnaden är osynlig i
utdatan: båda ger ett tal, och det felaktiga talet är alltid för högt. Vill man
mäta hur ofta en sökväg rörs måste populationen fixeras först, och varje commit
prövas mot den.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-29):** en mätning av hur ofta prejudikat-filerna skrivs
gav först `docs/decisions/ 80 %` och `backlog/tasks/ 100 %`. Talen var orimliga
men inte uppenbart fel — 100 % såg ut som "varje commit rör kort", vilket nästan
stämmer i ett kort-drivet repo.

Rätt form gav `2,5 %`, `4,0 %` och `3,0 %`. Alltså **en trettiondel** av det
första talet på en axel.

**Rätt form:** hämta populationen en gång
(`git log --no-merges -n 200 --format=@@%H --name-only`), gruppera per commit och
räkna hur många av dem som matchar. Det är en pass, inte N frågor.

**Varför det spelade roll:** talet skulle avgöra om en grind blev `deny`, `ask`
eller ingenting. Med det felaktiga talet hade slutsatsen blivit "för brusigt att
grinda" på en yta som i själva verket är kalibrerad.

Besläktad: [[L388]] ·
[[L394]]

### L412 — "Gratis" är inte ett skäl att bygga en grind — belagt felläge är det

**En grind som fyrar noll gånger på korrekt arbete kostar ingenting, och den
frestelsen är precis vad över-engineering-vakten finns för att stoppa. Kostnaden
är inte skälet; felläget är. Saknas ett belagt fel — eller ett första fel som
vore oacceptabelt — ska grinden inte byggas, hur billig den än är.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-29):** Code föreslog fyra poster på en neka-lista och
motiverade två av dem med att de var **gratis** — de fyrar noll gånger när
arbetet görs rätt. Marcus fällde dem: *"AskUser-grejen har inte varit ett problem
på flera månader."*

Det är empiri, och den säger att prosan **fungerar** för just den regeln. Att
bygga en spärr mot ett fel som inte inträffar är att bygga "ifall".

**Testet som blev kvar, i två led:** mekanisera när felet **har inträffat** —
eller när det **första** felet vore oacceptabelt. Ett av leden räcker; noll gör
det inte. Varje mekanism som byggdes under S91 klarar det första ledet.

En tredje grund finns och ska användas sparsamt: när felläget är **osynligt**.
GitLab 2017-01-31 är primärkällan — fyra återställningsmekanismer på papperet,
noll i verkligheten, och felrapporteringen var också trasig. Den grunden bär
`TASK-91`, och den är utskriven i kortet just för att nästa läsare ska se att
den inte byggdes "ifall".

Besläktad: [[L382]] — den pekar åt andra
hållet och måste vägas mot denna, inte tillämpas ensam.

### L413 — Strukturella kontroller kan vara gröna medan ett människo-synligt fel består

**En kontroll som prövar STRUKTUR — kolumnantal, radform, fältkonsistens — säger
ingenting om ORDNING, och ordning är ofta det enda en läsare faktiskt använder.
Ett register kan vara formellt felfritt och ändå obrukbart.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-29):** trådregistret bar två omkastade rad-par — `T74`
före `T73`, `T79` före `T78`. Samtidigt var **samtliga** strukturella kontroller
gröna: pipe-antal per rad korrekt, ingen rad utan avslutande pipe, inga
tabellbrytande tomrader, `check-lifecycle.sh` grön på fält↔index-konsistensen.

Felet upptäcktes av **Marcus, vid läsning**. Registret läses i nummerordning —
det är hela dess bruk — så felet var omedelbart synligt för ett öga och osynligt
för varje maskin vi hade.

**Kontrollen som saknades var trivial:** ett svep som prövar att numret på varje
rad är större än föregående. Tre rader awk.

**Regeln:** när en artefakt har en BRUKSORDNING, pröva ordningen — inte bara
formen. Frågan att ställa om varje register är *"hur läses det här, och prövar
någon kontroll den egenskapen?"*

Besläktad: [[L368]] — den beskriver
det omvända fallet, och tillsammans avgränsar de vad respektive mekanism duger
till. [[L401]] är den tredje sidan:
läsning missar det maskinen ser.

### L414 — Ett SHA skrivet före sin egen landning är alltid föråldrat vid läsning

[UNIVERSAL]

#### Vad som hände

Paus-blocket i ett sessionsdok bär raden *"Spoke `main` @ `<SHA>`"* som
tillståndsuppgift. Vid nästa resume stämmer den aldrig — blocket skrivs,
commit:as, PR:as och mergas, och **mergen ändrar HEAD efter att raden skrevs**.

Vid sextonde pausen stod `43b601b`; vid läsning var HEAD `e04be38`, alltså
mergen av paus-dokets egen PR. Det är **sjätte förekomsten** av exakt samma
mönster i samma session (femte bokfördes i Del 24.1). Varje gång har den
rapporterats som divergens, utretts, och avfärdats som ofarlig — och varje gång
har nästa paus skrivit raden på nytt.

#### Varför det inte går att städa bort

De fem föregående förekomsterna behandlades som slarv: *skriv rätt SHA nästa
gång.* Men raden kan inte skrivas rätt. Den beskriver ett tillstånd som
**garanterat ändras av den handling som publicerar raden**. En text kan inte
citera SHA:t på den commit som ännu inte finns när texten skrivs.

Det gör detta till en formfråga, inte en noggrannhetsfråga. En rättelse är ingen
lösning när felet är inbyggt i formen.

#### Regeln

**Skriv aldrig ett värde som den egna landningen kommer att ändra.** Antingen:

- utelämna det (`git log -1` svarar bättre än en fryst rad), eller
- skriv det med sin egen horisont utsatt: *"föräldern till denna pausens egen
  merge"* — då är raden sann vid läsning i stället för falsk.

#### Generaliseringen

Klassen är bredare än SHA:n: **varje tillståndsyta som skrivs före sin egen
publicering bär samma fel.** Räkningar av öppna PR:er, "noll öppna ärenden",
pool-storlekar — allt som ändras av landningen som publicerar påståendet.

Testet är en fråga: *ändrar handlingen som publicerar denna text något som
texten påstår?* Är svaret ja ska värdet peka, inte kopieras.

Relaterat: [[L413]] —
båda handlar om påståenden vars sanning ingen mekanism prövar.

### L415 — En vakt vars villkor matchar noll objekt är fail-open, inte tom

**Formen `until [ -z "$(fråga)" ]; do sleep …; done` avslutas omedelbart när
frågan returnerar tomt — och den returnerar tomt av två helt olika skäl: allt är
klart, eller frågan pekar på ingenting. Utifrån ser de identiska ut, och vakten
rapporterar "klart" i båda fallen.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-30):** en CI-vakt sattes mot merge-commiten för `#473`
med villkoret *"vänta så länge det finns körningar på detta SHA som inte är
klara"*. Vakten avslutades på sekunder och rapporterade tillbaka med tomma
utfall. Två av tre körningar pågick fortfarande.

Orsaken var att SHA:t var **påhittat**. Prefixet `afcb6fd` lästes ur `git log`,
och de återstående 33 hex-tecknen fylldes på ur ingenting:

```text
använd:   afcb6fd45e2d0a3e9d21fb1e6a4b46bb01d09b7f
faktisk:  afcb6fd35a73b8e20b66323f849e62f53e07aa11
```

Noll körningar matchade det påhittade SHA:t, alltså var väntevillkoret uppfyllt
direkt. Felet fångades bara för att `gh run list --commit <SHA>` gav tom output
mot ett SHA som `gh run list --branch main` samtidigt visade tre körningar för —
**motsägelsen mellan två läsningar av samma sak var enda signalen.**

**Varför det är värre än en vakt som inte startar:** en vakt som kraschar syns.
En vakt som avslutas snyggt med tomt resultat *ser ut som ett grönt besked*, och
nästa steg fattas på den grunden. Klassen är samma som `L322`:s skippbara
required check — en mekanism som fallerar åt det tillåtande hållet.

**Två åtgärder, båda behövs.**

1. **Låt värdet aldrig passera genom din egen text.** Läs det i samma anrop som
   använder det: `SHA=$(git rev-parse origin/main)` i vaktens eget kommando,
   aldrig ett SHA du skrivit av eller fyllt på.
2. **Skilj "inget kvar att vänta på" från "inget att vänta på".** Ett villkor som
   bara mäter frånvaro kan inte se skillnaden. Kräv att frågan först returnerar
   minst ett objekt, eller verifiera träffmängden innan loopen startar.

**Skärpningen mot närliggande:**
[[L397]] handlar om en vakt
som aldrig rapporterar. Denna handlar om en vakt som rapporterar **fel**, vilket
är dyrare — tystnad väcker till slut misstanke, ett grönt besked gör det inte.

### L416 — Ospårad bokföring är en delad tillståndsyta — den är osynlig för alla utom dig

**Ett kort, en post eller ett nummer som ligger ospårat i ditt arbetsträd finns
inte för någon annan aktör. Räknar de från `main` och du från din disk, allokerar
ni samma nummer — och ingen mekanism ser det förrän båda försöker landa.**
`[UNIVERSAL]`

**Empiri (S91, 2026-07-30):** orkestreraren mintade `TASK-95` och `TASK-96` och
sköt upp deras commit till en samlad bokförings-landning. Under tiden behövde en
bygg-agent minta ett kort för sitt eget AC #4.

Agenten gjorde **allt rätt**: den upptäckte att dess worktree var föråldrad, att
CLI:t därför hade gett den `task-94` (upptaget av en post i merge-kön), och
ff:ade till färsk `main` före `create`. CLI:t gav den då `95`.

**Men `95` var upptaget — av orkestrerarens ospårade fil.** Agenten räknade från
`main`, orkestreraren från sin egen disk, och ingen av dem kunde se den andres
tillstånd. Kollisionen var alltså inte agentens fel; den var orkestrerarens
uppskjutna commit.

**Nästan-instans i samma andetag:** en landad commit hänvisade till `TASK-96`,
ett kort som inte fanns i `main`. Ett pass som räknat från `main` hade gett det
numret till något annat.

**Varför det inte fångas:** allokatorn är monoton och läser disk. Den kan inte
se en fil som inte finns, och den kan inte se en fil som finns bara hos dig.
Verktygets eget skydd mot parallella arbetsträd stod dessutom av sedan
instansens födelse — men även påslaget hade det inte hjälpt här, eftersom
konflikten låg mellan huvudträdet och en gren, inte mellan två grenar.

**Formen:** bokföring som tilldelar ett nummer ur en delad serie **committas i
samma andetag som den skapas**. Ska den landa senare av andra skäl, är det ett
skäl att skapa den senare — inte att låta den ligga. Uppskjuten bokföring är inte
en neutral väntan; den är en osynlig reservation av en delad resurs.

**Rättningen görs via verktyget, inte för hand.** Kortet parkerades utanför
registret och återskapades med CLI:t efter att den andra posten landat, så
allokeringen förblev verktygets. En handredigerad ID-rad hade löst symptomet och
brutit den regel som gör registret trovärdigt.

### L417 — Två observationer som mätte fel sak blir en regel utan att någon märker det

**Innan du generaliserar ur N observationer: fråga vad var och en faktiskt
mätte. Ett par avläsningar som råkar peka åt samma håll av olika skäl bär ingen
regel — och om verktyget har en egen dokumentation som besvarar frågan är det
den som ska läsas först, inte dina egna stickprov.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-30):** påståendet *"`autoMergeRequest` är alltid `null`
under en aktiv merge queue"* skrevs in i `CLAUDE.md` som en regel. Underlaget var
två avläsningar:

- **`#474`** lästes medan PR:en låg köad — fältet `null`.
- **`#473`** lästes **efter merge** — fältet `null`.

Den andra mätte ingenting relevant: fältet nollas post-merge oavsett hur
armeringen gick till. Ett stickprov och en icke-mätning blev en generell regel,
och det motsatta fallet söktes aldrig.

**Det motsatta fallet dök upp av sig självt, i värsta tänkbara form:** `#475` —
PR:en som **bar den felaktiga texten** — hade ett satt `autoMergeRequest` medan
dess checks kördes. Regeln motbevisades av sin egen leverans.

Svaret fanns dessutom i `gh pr merge --help` hela tiden:

> *"If required checks have not yet passed, auto-merge will be enabled. If
> required checks have passed, the pull request will be added to the merge
> queue."*

Två lägen, inte ett. Hjälptexten lästes efteråt, inte före.

**Varför en fel regel är dyrare än ingen regel:** utan regel läser nästa läsare
fältet och funderar. Med den felaktiga regeln lär hen sig att **ignorera ett
fält som i normalfallet är korrekt** — alltså att avfärda rätt signal.
Skadan skalar med hur auktoritativ filen är, och den här landade i den fil som
auto-laddas varje session.

**Formen:** innan en observation blir en regel — skriv ut vad varje enskild
avläsning mätte, och sök aktivt det fall som skulle falsifiera regeln. Hittas
inget sådant fall: säg att det inte söktes. Och för varje regel *om ett verktyg*:
läs verktygets egen dokumentation före, inte efter.

**Skärpningen mot närliggande:** detta är inte samma sak som en overifierad
gissning — varje enskild avläsning här var äkta och korrekt utförd. Felet låg i
att **slutsatsen sträckte sig längre än vad avläsningarna kunde bära**, vilket
är svårare att se just för att underlaget ser empiriskt ut.

### L418 — En isolerings-spärr som upphör med det den skyddar är fail-open

**En agents worktree tas bort av harnesset när den är oförändrad — och i samma
stund slutar isolerings-spärren fälla. Skyddet försvinner alltså precis när
felet blir möjligt.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-30/31):** `TASK-94`:s bygg-agent checkade ut en gren och
committade i **huvudkatalogen**, vilket dess kontrakt uttryckligen förbjuder.
Agenten utredde det själv och kedjan är belagd led för led:

1. **Mätt:** allt filarbete skedde i *hub-repot*. Det enda agenten skapade i sin
   spoke-worktree var en `node_modules`-symlänk, som är gitignorerad. Dess
   `git status --porcelain` i worktreen gav tom utdata.
2. **Slutsats:** worktreen var därmed oförändrad hela sin livstid och
   kvalificerade för automatisk borttagning. Både katalogen och
   platshållargrenen försvann.
3. **Mätt:** när sessionen bröts av en API-gräns och återupptogs föll
   Bash-verktygets `cwd` tillbaka till sessionens arbetskatalog — huvudträdet.
4. **Mätt:** isolerings-spärren slutade fyra. Tidigare samma session hade den
   vägrat kommandon med *"This agent is isolated in the worktree …"*. Efter
   återupptagningen gick `git switch -c` mot huvudträdet igenom utan invändning.

Exponeringsfönstret var **4 min 13 s**, mätt ur reflogen. Under det stod
huvudträdet på agentens gren i stället för `main` — och reflogen visar att
orkestreraren landar via `checkout main → gren → commit → checkout main` i just
det trädet. Hade sekvenserna överlappat hade nästa gren grenat av från fel bas.

**Tre egenskaper som gör klassen värre än den ser ut.**

- **Spärren är fail-open.** Den skyddade medan worktreen fanns och slutade
  skydda i samma ögonblick worktreen försvann. En spärr som upphör tillsammans
  med det den skyddar ger starkast falskt lugn precis i felläget.
- **En agent vars kod bor i ett ANNAT repo smutsar aldrig ned sin egen
  worktree** och är därför maximalt utsatt för auto-borttagning. Det är
  kortets egen premiss inverterad: uppdraget byggde på att levererande agenter
  *inte* städas automatiskt — vilket inte gäller den som levererar någon
  annanstans.
- **Efter en borttagen worktree finns ingen signal.** `cwd` faller tyst tillbaka
  till den delade checkouten. Inget felmeddelande, inget varningsläge.

**Formen:** mät `git rev-parse --show-toplevel` **före varje git-skrivning**, inte
en gång per session. Agentens egen diagnos av sitt fel är den skarpaste
formuleringen: *"'Verifiera, gissa aldrig' tillämpat på fel tidshorisont — jag
verifierade en gång i stället för vid det tillfälle det gällde."*

**Skärpningen mot närliggande:**
[[L416]] handlar om tillstånd som är
osynligt för andra. Denna handlar om ett skydd som är osynligt frånvarande för
den det skyddar — och upptäcktes av en syskonagent, inte av den som föll.

### L419 — En subagents returväg dör med sin förälder

**Dör den agent som spawnade en subagent innan barnet blir klart, har barnets
rapport ingen mottagare. Den landar hos orkestreraren — eller ingenstans.
Arbetet är utfört, resultatet är hemlöst.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-30/31):** ett research-pass med mandat att fan-outa
spawnade fem subagenter. Passets egen tur dödades av en API-gräns **två gånger**.
Samtliga fem barnrapporter — tillsammans ~500 000 tokens arbete, inklusive
passets enskilt viktigaste fynd — levererades till **orkestreraren** i stället
för till föräldern som beställt dem.

En av dem sade det rakt ut i sin egen rapport: *"SendMessage kunde inte nå
`research-pass` ('No agent named research-pass is reachable'). Rapporten
levereras därför här, i mitt textutdata."* Kanalen var alltså mätbart bruten,
inte tyst.

Orkestreraren fick vidarebefordra allt fem gånger för hand. Hade den inte råkat
läsa notifieringarna vore fynden förlorade trots att arbetet var utfört och
korrekt.

**Varför det är samma klass som väntan på en signal som aldrig kommer:** en
väntande part antar att ett resultat ska levereras längs en kanal som inte
överlever. Skillnaden är riktningen — här är det *avsändaren* som blir hemlös
i stället för mottagaren som väntar förgäves. Passet som drabbades utredde
just den klassen, och konstaterade om sig självt att felet inträffade **en nivå
ned, under själva utredningen**.

**Formen, i två led.**

1. **Låt barnet skriva till disk när resultatet är dyrt att återskapa.** En fil
   överlever att både förälder och barn dör; ett returvärde gör det inte.
   Scratchpad räcker för ren relä — men filen ska namnges så att den går att
   hitta utan barnets rapport.
2. **Som orkestrerare: läs varje föräldralös rapport som om den vore beställd av
   dig.** Notifieringen är den enda kvarvarande kanalen, och den passerar bara
   en gång.

**Motsatsen till åtgärden är inte att avstå från fan-out.** Parallell sökning är
rätt form för breda frågor; det som saknas är att leveransen inte får hänga på
att beställaren fortfarande lever.

**Skärpningen mot närliggande:**
[[L397]] handlar om en
process harnesset aldrig kände till. Här kände harnesset till barnet, körde det
till slut, och levererade — men adressaten fanns inte längre.

### L420 — En self-test i CI är inte grinden i CI

**"Inkopplad" betyder tre olika saker, och att ett av dem stämmer läses som att
alla gör det.** En grind kan (a) ingå i det lokala samlingskommandot, (b) ha sin
self-test körd i CI, och (c) själv köras som grind i CI. Bara (c) skyddar repot.
`[UNIVERSAL]`

**Empiri (S91, TASK-98, 2026-07-31):** `ADR-083` byggde
`check-permissions-claims.sh` mot prosa som påstår sig vara mekanism. ADR:ns egen
text var korrekt — den skrev att grinden var *"inkopplad som tionde kontroll i
`check:docs`"* och att *"dess self-test körs i `ci.yml`"*, alltså (a) och (b).
`check-docs.sh` räknade däremot upp grinden under rubriken *"ci.yml lint-jobbet
(kör alltid)"*, alltså (c). Mätt: de fem syskongrindarna kördes 1 gång var i
`ci.yml`, denna 0. Grinden mot falska mekanism-påståenden var själv ett falskt
mekanism-påstående i tre månader — fångat först när `TASK-85`:s agent räknade
förekomster i stället för att läsa.

**Varför formen är svår att se:** varje enskild mening är sann. Self-testen
*körs* i CI, och den nämner grindens namn i workflow-filen — så en `grep` på
grindnamnet i `.github/workflows/` ger träff. Läsaren ser träffen och slutar
leta. Skillnaden mot det närliggande fragmentet
`valideringsverktyg-som-inte-kors-ar-franvarande.md` är att verktyget här
*körs* — men på fel sätt, och det felet ser ut som rätt.

**Motmedlet är att räkna anropet, inte namnet.** `grep -c 'bash scripts/<grind>.sh'`
mot workflow-filen skiljer grinden från dess self-test, eftersom testet heter
`test-<grind>.sh`. Ett omnämnande i en kommentar eller ett shellcheck-scope är
inte en körning. Samma disciplin som ADR-039 § lesson→grind kräver ett steg
tidigare: verifiera att grinden avfyras innan du verifierar att den fäller.

### L421 — Ett upphävande gäller bara stycket det står i — citaten instruerar vidare [UNIVERSAL]

**En regel som förklaras UPPHÄVD dör i sitt eget stycke. Varje annan sektion som
citerar regeln fortsätter instruera enligt den, eftersom citatet ligger där
regeln ANVÄNDS och är osynligt från platsen där beslutet fattades.** `[UNIVERSAL]`

**Empiri (S91, `TASK-96`, 2026-07-30).** `TASK-70.1` mekaniserade
landnings-ordningen till en merge queue 2026-07-29 och skrev det med versaler i
`CONTRIBUTING.md` § Landnings-ordningen: *"den manuella sekvenseringen nedan är
UPPHÄVD"*. Ett dygn senare instruerade **fyra** andra ställen i samma fil
fortfarande enligt de upphävda formerna A och B:

| Ställe | Vad det sade efter upphävandet |
|---|---|
| § Revert-vägen, köordningen | revert-PR:n armeras FÖRST, andra PR:er får vänta — *"det är form B i sektionen ovan"* |
| § Revert-vägen, steg 3 | *"Blir revert-PR:n `BEHIND` gäller § Landnings-ordningens form B"* |
| § Landnings-ordningen, CI-vakten | *"Bikostnad som hör till form B"* |
| § Landnings-ordningen, avgränsningen | merge queue *"är en egen öppen post … tills den finns är ordningen en aktörs ansvar"* — 24 h efter att kön aktiverats |

Samma klass fanns i `.claude/agents/bygg-agent.md`, där instruktionen *"armera
inte"* var riktig men motiveringen (`BEHIND`) var falsifierad av mekaniseringen.
Den rättades separat 2026-07-30.

**Varför upphävandet inte räcker.** Beslutet skrivs där regeln BESLUTAS.
Citaten står där regeln TILLÄMPAS — i en runbook, i en roll-tabell, i en
agentdefinition — och de är formulerade i regelns egna termer, inte i sektionens.
Den som skriver upphävandet läser sin egen sektion och ser att den nu stämmer.
Ingen läsning av den sektionen kan avslöja de andra fyra.

**Motmedlet är en sökning, inte en genomläsning.** Vid varje upphävande: grep
efter regelns EGENNAMN (*"form A"*, *"form B"*) och efter dess MOTIVERING
(*"BEHIND"*) över hela repot — inklusive agentdefinitioner och runbooks — och
gör svepet till en del av upphävandets egen landning. Ett citat som blir kvar är
inte inaktuell text: det är en gällande instruktion som säger emot den nya, och
den som följer den gör fel utan att bryta mot något.

**Skilj instruktion från motivering när citatet rättas.** I tre av fem fall ovan
var instruktionen fortfarande rätt och bara skälet fel. Att stryka hela stycket
hade tagit bort en regel som gäller; att lämna det orört hade lämnat kvar ett
skäl som är falskt. Rätt operation är att byta motiveringen och behålla
instruktionen — och skriva ut att det är vad som gjordes.

Besläktad: [[L409]] (påståendet om
mekanism) · [[L401]] (kopior som
bekräftar varandra).
