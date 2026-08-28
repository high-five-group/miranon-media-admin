# ADR-098: Trådregistrets tunna radform — radlängds-tak, narrativ i kort, växt-väg till genererat index

- Status: Accepted (grillad samsyn S99 Del 4, Marcus-kvitterad 2026-08-07)
- Datum: 2026-08-07
- Fas: Session 99, PRD `TASK-157`

## Kontext

`tasks/threads/README.md` är registrets navigerbara ryggrad (ADR-053 beslut
2): en tabellrad per tråd, ID · titel · tillstånd · ingång. Formen har aldrig
haft en radlängds-invariant — bara radFORM (pipe-antal, enum-giltigt
tillstånd, stigande numrering, index↔fil-konsistens, `besläktad`-referentiell
integritet) grindas mekaniskt av `scripts/check-thread-index.sh` (sex
invarianter, senast utökad `TASK-141`/`ADR-095`). Tillväxten har därför bott
fritt i RADLÄNGDEN: när en tråd saknar eget kort bor hela dess narrativ
(stängningsskäl, carry-texter, commit-hashar, flerstegs-resolutioner) i
indexraden, och ingenting har någonsin krympt den.

**Ommätning vid detta ADR:s byggtillfälle (2026-08-07), disk-verifierad —
källa: `wc -l`/`wc -c` + `awk '{print length}'` mot
`tasks/threads/README.md`:**

- **269 fysiska rader, 221 337 byte (216,1 KB).**
- **132 trådrader** (`grep -cE '^\| \`T[0-9]+\`' tasks/threads/README.md`),
  inte 131. Radlängds-fördelning över dessa 132 rader: min 96 tecken · p50
  299 · p75 1 360 · p90 2 328 · p95 3 101 · p99 4 834 · max **8 410** (`T121`,
  hela narrativet i Titel-kolumnen — inte bara Ingång-kolumnen, som en
  äldre, snävare hypotes om var fetman bor hade antagit).
- **Divergens mot uppdragets utgångshypotes, öppet bokförd (ADR-086):**
  `tasks/sessions/archive/2026-08/2026-08-07-session-99.md` § Del 4 och research-passet
  (`docs/research/register-index-skalning-branschmonster-2026-08-07.md`)
  angav **268 rader / 214 KB / 131 trådar** som mätgrund — skrivet samma
  session, några timmar tidigare. Ommätningen visar en marginell,
  FÖRVÄNTAD drift uppåt: `T132` föddes i samma session, EFTER research-passet
  skrevs (registret är levande under hela byggfönstret). Divergensen är
  icke-blockerande — riktningen och storleksordningen (269 mot 268, 132 mot
  131) håller, och den underliggande diagnosen (radlängden, inte radantalet,
  är tillväxtaxeln) är opåverkad. Registrerad här i stället för att tyst
  ärvas som facit.
- **Byte-taket är verkligt, om avlägset just nu.** Filen ligger på 84 % av
  Read-verktygets 256 KB-tak (`docs/byggplan.md`-klassens felyta; samma
  gräns som gjorde `todo.md` oläsbar innan `TASK-106`). Ingen akut kris —
  men fyllnadsgraden är hög nog att en fortsatt fri tillväxt i dagens form
  (ingen mätt övre gräns, `T121`s 8 410-teckensrad som prejudikat) skulle nå
  taket inom ett antal fetlyft, inte ett antal år.

**Branschforskningen** (`docs/research/register-index-skalning-branschmonster-2026-08-07.md`,
sju primärkällor + tre lokala precedent) konvergerar på två ortogonala
mönster beroende på registrets fysiska form: (1) fil-per-post-register
(ADR/RFC/PEP/KEP) håller sitt index navigerbart genom MEKANISK GENERERING ur
post-metadata, aldrig genom att krympa en handskriven tabell; (2)
enfils-append-only-register (changelog-klassen, `ADR-085`s `lessons.md`)
löser tillväxt genom STORLEKSTRIGGAD ROTATION — tunt index + frysta
arkivvolymer. Ingen primärkälla i de sju studerade stöder
STATUSPARTITIONERING (att flytta `paused`/`closed`-rader ur huvudregistret):
Kubernetes KEP-processen säger uttryckligen om sin `Rejected`-status *"kept
around as a historical document"*, och `paused` motsvarar närmast KEP:ens
`Deferred` (*"not actively being worked on"*) — som stannar synlig i sin
katalog. Forskningens DOM: rotation är mätbart för tidigt (269 rader ligger
en storleksordning under varje uppmätt branschtröskel — GitLab 258 KB,
`ADR-085` 3 000 rader), registrets EGNA arkitektur (progressiv disclosure,
rad → eget kort) matchar redan branschmönstret i grunden, och den enda
verifierade skillnaden mot branschens toppskikt är GENERERINGS-axeln, inte
rotations-axeln.

**Detta beslut appliceras på en enskild, avgränsad fråga uppdraget ställer:**
formen NU (tunn radform + radlängds-tak + narrativ-i-kort, en engångsmigration
utan radering) och en explicit, skriven väg TILL generering (steg B), utan att
bygga rotation eller partitionering — i linje med forskningens dom.

## Beslut

### 1. Tunna radformen, med ett mekaniskt radlängds-tak: 500 tecken per rad

Varje trådrad — hela den råa Markdown-tabellraden, pipe-tecken och
formatering inräknat, radbrytningen exkluderad (samma `length`-mått
`check-thread-index.sh` redan använder för pipe-räkningen) — får inte
överstiga **500 tecken**. Kolumnerna förblir `Tråd-ID | Titel | Tillstånd |
Ingång` (ADR-053 beslut 2, oförändrad struktur); det som ändras är att
INNEHÅLLET i Titel och Ingång inte längre får bära narrativ som spränger
detta tak.

**Härledning av talet, ur dagens ommätning (inte en gissning):**

- Det längsta redan-legitimt-tunna raden (utan eget kort, utan inbäddat
  narrativ) är `T08` på **362 tecken**. 500 ger ~38 % marginal ovanför den.
- Den längsta legitima RENA titeln bland korta rader (`T32`, radlängd 353) är
  **251 tecken**. Ett titel-budget på ~250 tecken + ett Ingång-budget på
  ~150 tecken (länk + kompakt `besläktad`-lista, se beslut 4) + fast
  formaterings-overhead (bakåtcitat/pipe/mellanslag kring ID och tillstånd,
  ~50–70 tecken) summerar till ~450–470 — avrundat till en tydlig, lätt
  ihågkommen gräns.
- Taket är INTE en formalitet: av dagens 132 trådrader klarar bara **45
  (34,1 %)** gränsen som den står idag. De återstående 87 (65,9 %) bär
  narrativ som måste flytta till kort (`TASK-157.2`). Ett tak som redan idag
  fäller två tredjedelar av registret är en äkta, load-bearing gräns — inte
  en gummistämpel.

**Mätmetoden är bindande för grindbygget (`TASK-157.3`):** rå radlängd
(`${#line}` i Bash, motsvarande `awk '{print length}'`), inte en
tolkad/kolumnvis summa. Talet 500 är formens golv från och med denna ADR;
`TASK-157.3` implementerar kontrollen, `TASK-157.2` migrerar registret till
att hålla den.

### 2. Narrativ-i-kort-principen — ADR-053 beslut 2 skärps från discretionär till MEKANISK

ADR-053 beslut 2 sade *"blir [tråden] substantiell får den ett eget kort"* —
en discretionär progressiv disclosure utan mekanisk framtvingning, vilket är
exakt varför 87 rader idag bär fri narrativ. Detta beslut behåller principen
oförändrad i sak men gör den OBLIGATORISK via radlängds-taket: en tråd vars
narrativ inte får plats inom 500 tecken MÅSTE flytta narrativet till sitt
tråd-kort (`T<NN>-<slug>.md`) — det finns inte längre ett läge där en fet rad
är ett giltigt slutläge. Detta är samma princip `check-thread-index.sh`s
sex invarianter redan följer: formen är mekaniskt grindad, innehållets
SANNING är det inte (grindens § "medvetet utanför scope", punkt c) — den
distinktionen ändras inte här.

### 3. Migrationsbeslutet — hela registret migreras NU, inget raderas

Per PRD `TASK-157` § Lösning och § Implementationsbeslut, låst av detta
beslut (inte omprövat av `TASK-157.2`, bara utfört):

- **Hela registret migreras i en enda omgång** — inte en framåtriktad regel
  som bara gäller nya rader. En delvis migrerad fil (vissa rader tunna,
  andra feta enligt gammal konvention) är svårare att läsa och att grinda
  konsekvent än antingen ytterlighet.
- **Kort föds vid migrationen för varje tråd vars rad idag bär narrativ och
  saknar ett kort.** De 25 trådar som redan har ett tråd-kort (barn-fält-
  designbeslutets mätning, 2026-08-04) får sitt narrativ FLYTTAT dit om
  kortet inte redan bär det; trådar vars rad redan är tunn (som `T01`–`T09`
  i urvalet ovan) får inget tomt kort skapat.
- **Inget innehåll raderas.** Allt narrativ överlever antingen i det nya/
  utökade kortet eller i git-historiken för `README.md` (`git log -p --
  tasks/threads/README.md` förblir den fullständiga, oförkortade
  ursprungstexten för alltid, oavsett vad indexraden säger efter migrationen)
  — samma disciplin branschforskningens samtliga sju källor bekräftar
  (superseded/rejected/deferred: flagga, aldrig radera).
- **Innehålls-bevarande verifieras mekaniskt** vid migrationen: flyttat
  narrativ ska återfinnas i kortfilen (diff-baserad kontroll per rad,
  `TASK-157`s eget testbeslut), inte bara antas.

### 4. `besläktad`-hemvisten avgjord mot ADR-095: relationell metadata stannar i indexet, oförändrad mekanism

`ADR-095` beslut 2–3 och `check-thread-index.sh` Inv 5 etablerade redan att
`besläktad` (symmetrisk peer-relation) valideras genom att skanna INDEXETS
egna innehållskolumner (Titel eller Ingång, vilken som helst) efter
backtick-citerade tråd-ID:n. **Denna migration flyttar NARRATIV, inte
RELATIONELL METADATA** — `besläktad`-deklarationer är per definition inte
narrativ (de bär inget stängningsskäl, ingen carry-text, bara en pekare till
en annan tråd) och rör sig därför INTE till kort. De stannar i indexraden,
i sin nuvarande kompakta form.

Detta är ingen förhoppning utan en mätt egenskap hos registret som det ser
ut idag: samtliga observerade `besläktad`-annoteringar
(`grep besläktad tasks/threads/README.md`, `T13`/`T77`/`T87`/`T90`/`T98`
m.fl.) är **20–90 tecken** i sin kompakta form (exempel:
``· besläktad `T87` `` och ``· besläktad `T71` `T85` `T56` `T84` ``) — långt
under radlängds-taket även när de samexisterar med en tunn titel och en
länk. `ADR-095`s Inv 5 kräver därmed **ingen ändring** för att fortsätta
gälla efter migrationen: mekanismen (skanna innehållskolumner, kräv
existens i registret) och platsen (indexraden) är identiska före och efter.
Det enda som förändras är att `besläktad`-annoteringar som idag råkar sitta
inbäddade i en LÅNG narrativ-rad (`T71`, `T76`, `T86`, `T98`) extraheras och
bevaras som en egen kompakt svans på den tunnade raden när narrativet runt
dem flyttar till kort (`TASK-157.2`:s ansvar att utföra, inte att besluta
om).

### 5. Rotation avrådd — decline-rationale

Byggs INTE nu. Forskningens dom är entydig på två separata grunder:

1. **Mätbart för tidigt.** 269 rader/216 KB ligger en storleksordning under
   varje uppmätt branschtröskel (GitLab 258 KB, `ADR-085` 3 000 rader). En
   arkivvolym-mekanism byggd idag löser inget existerande problem — samma
   avvägning som den dubbelriktade över-engineering-vakten (hub-CLAUDE.md)
   redan kodar: ingen abstraktion utan en faktisk nuvarande användare.
2. **Statuspartitionering saknar stöd i samtliga sju studerade
   primärkällor**, och den närmaste namngivna precedenten säger uttryckligen
   emot: Kubernetes håller `Rejected`/`Deferred`-KEP:ar synliga i sin
   ordinarie katalog för alltid. `paused` (63 % av registret vid
   research-passets mätning) är, per den analogin, den NORMALA fördelningen
   för ett levande designregister — inte ett tecken på att formen är fel.

Detta beslut river inte dörren för rotation FÖR ALLTID — bara för NU. Om
registret en dag når en branschmässigt jämförbar tröskel (`ADR-085`s
Node.js-modell, tunt index + `vol-NN`-arkiv, är den direkt återanvändbara
mallen) är det ett EGET beslut, fattat när mätningen motiverar det —
proaktivt satt tröskel-VÄRDE snarare än upptäckt vid krisen (samma lucka
`ADR-085` stängde för `lessons.md` INNAN den sprack). Inget tal sätts för
den tröskeln här, eftersom radlängds-taket redan gör radantal — inte
byte-storlek — den mer sannolikt begränsande resursen efter migrationen (se
beslut 6).

### 6. Växt-vägen — explicit trigger till steg B (genererat index)

**Steg A (detta beslut, effektiv från `TASK-157.2`):** handskriven tunn
tabell, mekaniskt formgrindad. **Steg B:** `check-thread-index.sh` (eller en
efterträdande grind) HÄRLEDER tabellraderna mekaniskt ur strukturerad
metadata i varje tråd-korts frontmatter (`lifecycle:`-fältet finns redan för
de kort som har ett; steg B förutsätter att ALLA 132+ trådar bär det, inte
bara de idag ~25 med kort) — PEP 0-mönstret (`pep_sphinx_extensions`
genererar `pep-0000.rst` ur varje PEP-fils header vid byggtid) applicerat på
detta register. Ingen människa handskriver en rad i steg B; indexet blir per
konstruktion oförmöget att drifta från sina källor.

Steg B byggs INTE nu — forskningens dom (§ "Den investering som faktiskt
skulle flytta detta register till branschens toppskikt är generering, inte
rotation") identifierar den som en distinkt, större investering som förtjänar
ett eget beslut när triggern slår till, inte en spekulativ förskottsbetalning
idag.

**Explicit trigger, någon av två, disk-mätbar:**

- **(a) Kvantitativ — registret passerar 300 trådrader.** Härledning:
  registret startade `T01` 2026-06-14 och bär 132 trådar vid detta ADR:s
  byggtillfälle (2026-08-07), 54 dagar — en snitt-takt på ≈2,44 trådar/dag
  över hela livslängden (den senaste 3-dagarsperioden var betydligt
  snabbare, 11 trådar, ett tecken på att takten är ryckig snarare än
  linjär — talet nedan är därför en grov, inte en exakt, prognos). Vid
  snitt-takten nås 300 trådar om ≈69 dagar (≈2,3 månader): varken "för
  tidigt" (300 ligger fortfarande långt under varje bytestorlekströskel
  branschen mätt) eller reaktivt (satt nu, inte vid krisen). **Notera
  explicit varför talet är radANTAL och inte byte-storlek:** en tunn rad på
  ≈193 byte (T01–T09-urvalets snitt) × 300 rader ≈ 56 KB — en bråkdel av
  256 KB-taket. Radlängds-taket (beslut 1) har redan gjort byte-storlek till
  en icke-begränsande resurs för överskådlig framtid; navigerbarhet
  (kan en människa fortfarande skumma 300+ rader med bibehållen överblick?)
  är den faktiska gränsen steg B löser, inte filstorlek.
- **(b) Kvalitativ — en observerad instans av index-drift EFTER denna
  migration.** Definierad som: registrets grind är grön (radform, radlängd,
  `besläktad`-referens) men innehållet är sakligt fel — en omkastad
  radordning (`T74`/`T73`-klassen, `L413`), en tillstånds-kolumn som inte
  matchar kortets faktiska `lifecycle:`, eller ett kort-påstående som blivit
  falskt (`TASK-108`s fyra funna instanser). Denna trigger väger tyngre än
  (a) om den slår till FÖRST, eftersom steg B genom sin konstruktion (indexet
  härlett, aldrig handskrivet) strukturellt ELIMINERAR just denna felklass —
  precis det en formgrind (oavsett hur många invarianter den bär) aldrig kan
  göra för INNEHÅLLETS sanning.

Vilkendera triggern som slår till FÖRST öppnar steg B som ett eget
arbets-kort — den kräver ett människo-omdöme-pass (per `ADR-095` § Avgränsningar,
samma klass av öppen semantisk fråga som `barn`-manifestets "vad räknas som
barn") eftersom ALLA trådar först måste bära strukturerad, härledningsbar
metadata, inte bara de som redan har kort.

## ADR-baren — prövad

1. **Svårt att återställa?** Ja, i båda meningarna. I kod: en gång
   `TASK-157.2`/`.3` landat är hela registret + grinden format kring
   500-teckensgränsen och narrativ-i-kort; att riva formen och återgå till
   fri radlängd innebär att migrera bakåt, inte bara att stänga av en flagga.
   I koherens: utan denna ADR ser en framtida sammanslagning av narrativ
   TILLBAKA in i indexraden (en välmenande "gör raden mer självförklarande"-
   ändring) ut som en lokal förbättring snarare än en regression mot en
   medvetet vald form.
2. **Överraskande utan kontext?** Ja — en grind som fäller en till synes
   rimlig, informativ tabellrad (`T121`s 8 410 tecken var läsbar prosa, inte
   trasig data) är obegriplig utan att känna till att radlängd är den
   medvetna, mätta tillväxtaxeln och att narrativ hör hemma i kortet, inte
   i indexet.
3. **Verklig avvägning?** Ja: talet 500 handlar om en genuin kompromiss
   (generöst nog för legitima titlar + länkar + besläktad-listor, snävt nog
   för att fälla 65,9 % av dagens rader); rotation avvisas MOT en
   branschforskning som pekade åt båda hållen beroende på registerform;
   steg B:s trigger vägs mellan en kvantitativ prognos (osäker, ryckig takt)
   och en kvalitativ signal (mätbar men inte schemalagd).

Alla tre håller ⇒ ADR mintas.

## Alternativ som övervägdes

| Alternativ | Status | Skäl |
|---|---|---|
| **Tunn radform + radlängds-tak + narrativ-i-kort** (denna ADR) | **Vald** | Matchar branschens fil-per-post-familj i miniatyr (ADR-053 gör redan detta); mekaniskt grindbart; inget raderas |
| **Storlekstriggad rotation nu** (`ADR-085`-modellen, tunt index + `vol-NN`) | Avvisad, för tidigt | 269 rader/216 KB en storleksordning under varje mätt branschtröskel; löser inget existerande problem |
| **Statuspartitionering** (flytta `paused`/`closed`-rader ur huvudregistret) | Avvisad | Noll primärkälls-stöd i sju studerade källor; Kubernetes KEP säger uttryckligen emot (`Deferred` stannar synlig) |
| **Filtrerad vy** (skript som listar bara `active`-rader on demand) | Ej avgjord här | Forskningens egen brasklapp: branschmässigt belagd OM läsbarhet för aktivt arbete (inte filstorlek) visar sig vara det faktiska problemet — utanför detta uppdrags fråga |
| **Genererat index NU** (steg B utan trigger) | Avvisad, för tidigt | Kräver strukturerad metadata på ALLA 132+ trådar (bara ~25 har kort idag); distinkt, större investering utan mätt behov ännu |
| **Ingen radlängds-gräns, bara fortsatt discretionär progressiv disclosure** | Avvisad | Redan bevisat otillräckligt — 65,9 % av dagens rader bär narrativ trots att ADR-053 beslut 2 alltid tillåtit kort |

## Konsekvenser

**Positiva:** registret får en mekanisk, disk-verifierbar gräns mot precis
den tillväxtaxel (radlängd) som drivit det mot Read-taket; narrativ
koncentreras till kort där det redan hörde hemma per ADR-053; `besläktad`-
mekanismen (`ADR-095` Inv 5) förblir helt oförändrad; en skriven, tvåvägs
trigger (kvantitativ + kvalitativ) gör steg B en medveten, framtida
avvägning i stället för en obesvarad fråga som återkommer varje gång
registret känns stort.

**Negativa/skuld, öppet burna:** detta beslut bygger INGEN mekanism —
migrationen är `TASK-157.2`, grinden är `TASK-157.3`, och ordningen mellan
dem är bindande (grinden byggd före migrationen skulle fälla varje PR mot
dagens feta rader; dess rött-först-bevis tas därför mot en fixtur, inte mot
det levande registret). Fram till `TASK-157.2` landar är registret
FORTFARANDE i sin gamla, feta form — denna ADR beskriver målformen, inte
nuläget. 500-teckensgränsen är kalibrerad mot dagens observerade
titel-/länklängder; en framtida tråd med ett genuint längre men ändå
legitimt behov (en mycket lång, oundviklig titel) kan komma att pressa
gränsen — det hanteras då som en enskild avvikelse, inte som bevis att
talet var fel. Steg B:s radantals-trigger (300) vilar på en ryckig,
icke-linjär historisk takt och är uttryckligen en grov uppskattning, inte
ett löfte om exakt datum.

## Relaterat

- [ADR-053](ADR-053-trad-arkitektur-forensisk-lasbarhet-triage.md) —
  grundbeslutet; beslut 2 (progressiv disclosure) skärps här från
  discretionär till mekanisk, texten i ADR-053 rörs inte.
- [ADR-085](ADR-085-hubbens-lessons-i-volymer.md) — samma problemklass löst
  för `tasks/lessons.md` via rotation; förlagan för den tröskel-form som
  INTE byggs nu (beslut 5) men som är den återanvändbara mallen OM
  registret en dag når en branschmässig tröskel.
- [ADR-095](ADR-095-relationsmodellen-dokumentationssubstratet.md) —
  `besläktad`-mekanismen (Inv 5) vars hemvist avgörs oförändrad i beslut 4;
  samma paraply som förbjuder manuell dubbelbokförd spegling.
- [`docs/research/register-index-skalning-branschmonster-2026-08-07.md`](../research/register-index-skalning-branschmonster-2026-08-07.md)
  — sju primärkällor + tre lokala precedent, dom och rekommendation denna
  ADR verkställer.
- `tasks/sessions/archive/2026-08/2026-08-07-session-99.md` § Del 4 — grillad samsyn,
  formvalet (A) och paketet (migration nu, växt-väg, leveransform)
  kvitterade.
- `tasks/lessons.md` `L413` (strukturellt grönt kan dölja människo-synligt
  fel) + `L405` (formellt korrekt kan vara sakligt osant) — ribban för vad
  "navigerbart" måste betyda, och grunden för steg B:s kvalitativa trigger
  (beslut 6b).
- `backlog/tasks/task-157*` — PRD + skivor (`TASK-157.1`–`.4`); denna ADR är
  `.1`, migrationen `.2`, radlängds-grinden `.3`, QA `.4`.

## Källor

Fullständig källförteckning i research-passet
([`register-index-skalning-branschmonster-2026-08-07.md`](../research/register-index-skalning-branschmonster-2026-08-07.md)
§ Källförteckning, sju primärkällor hämtade direkt + tre lokala precedent).
Sammanfattat här:

- [adr/adr-log](https://github.com/adr/adr-log) — mekanisk generering av
  ADR-index ur post-metadata (adr-ekosystemets svar på samma problemklass).
- [Kubernetes KEP-processen](https://github.com/kubernetes/enhancements/blob/master/keps/README.md) —
  fil-per-post + katalog-buren navigering; `Deferred`/`Rejected` stannar
  synliga för alltid (negativ precedent mot statuspartitionering).
- [peps.python.org/docs/rendering_system](https://peps.python.org/docs/rendering_system/) —
  PEP 0 genererat vid byggtid ur varje PEP-fils header (mallen för steg B).
- [gitlab-org/gitlab#18526](https://gitlab.com/gitlab-org/gitlab/-/issues/18526) —
  mätt, storleksbaserad splittringströskel (258 KB) för handskrivna
  changelog-register.
