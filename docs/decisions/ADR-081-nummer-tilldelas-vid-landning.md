# ADR-081: Nummer tilldelas vid landning, inte vid skrivning — lesson-fragment

- Status: Accepted (Session 91 — 2026-07-27)
- Datum: 2026-07-27
- Fas: Session 91, CI-/grind-arkitekturspåret (mekaniseringens punkt 6)

> **Om beslutsvägen — bokförd öppet.** Fattat av Code på Marcus stående
> delegering 2026-07-27 (*"Allt det här ska lösas ut! […] Kör på det du
> rekommenderar"*), inom restlistans spår A2 som Marcus godkänt. Noteras av
> samma skäl som i [ADR-080](ADR-080-acceptance-klassen-hermetisk-utbrytning.md):
> en framtida läsare ska kunna se vilka beslut som inte passerade Marcus-grinden.

## Kontext

2026-07-26 mintade två parallella agenter båda `L354` och `L355`, var och en
omedveten om den andra. Kollisionen upptäcktes först vid landningen och löstes
för hand — hover-grenens fyra poster numrerades om till `L356–L359`.

**Grundfelet är inte slarv.** Formen kräver att varje skribent *antar* nästa
lediga nummer genom att läsa `tasks/lessons.md` — 5 693 rader, 342 poster — som
någon annan samtidigt skriver i. Antagandet är osäkert per konstruktion så snart
mer än en aktör arbetar, och sedan multi-agent-landning blev normalformen är
kollisionen **garanterad, inte osannolik**. Samma klass gäller ADR-, tråd- och
kortnummer.

Sessionsdok S91 Del 4 punkt 6 registrerade detta som mekaniserings-post. Den har
spärrat hela lesson-skörden sedan dess: elva kandidater ligger omintade eftersom
numren inte kan tilldelas säkert.

**En observation som styrde valet:** vårt eget backlog-substrat har redan rätt
mönster utan att det kallats så. Kort-ID:n kolliderar aldrig, eftersom
`backlog`-CLI:t **äger allokeringen**. Lessons hade ingen motsvarande ägare — och
frågan blev därför inte "vilken allokator ska vi bygga" utan "kan vi undvika att
allokera innan serialiseringen ändå skett".

## Beslut

### 1. Numret tilldelas vid landning, aldrig vid skrivning

En lärdom skördas som **nummerlöst fragment** i `tasks/lessons.d/`, med
beskrivande slug och utan numrerad rubrik. Numret sätts när posten konsolideras
in i `tasks/lessons.md`.

Det ögonblicket är seriellt **utan att vi bygger något för det**: merge-grinden
([ADR-076](ADR-076-merge-grinden-ruleset-pr-flode.md)) släpper in en PR i taget
på `main`. Serialiseringen finns redan; beslutet är bara att lägga
nummertilldelningen där i stället för i den parallella fasen.

Ett fragment är en **fullgod leverans** — lärdomen är säkrad i fil, vilket är
kontinuitets-kravet. Konsolideringen är bokföring, inte räddning.

### 2. Grinden håller två invarianter, båda fail-closed

`scripts/check-lesson-numbers.sh` (config: `.lesson-policy.conf`, per husets
config-driven-konvention):

- **Ingen duplicerad numrerad rubrik** i `tasks/lessons.md`. En dubblett *är*
  beviset att två aktörer antog samma nummer.
- **Inget fragment bär ett nummer.** Skrivs `### L400` i ett fragment fälls
  grinden — numret är inte skribentens att välja.

**Frånvarande fragment-katalog är grönt, inte rött.** Vägen är tillgänglig, inte
obligatorisk; en session som inte skördar något ska inte behöva skapa en tom
katalog. Fragment-katalogens egen `README.md` är undantagen den andra kontrollen
så den får citera rubrik-former i förklarande syfte.

### 3. Grinden bevisas tvåsidigt och fortlöpande

Rött-först-beviset kördes före landning: rent tillstånd grönt · duplicerat
nummer rött med radnummer · numrerat fragment rött · nummerlöst fragment grönt ·
saknad katalog grönt. Därtill en **self-test-svit med sex fall**
(`scripts/test-check-lesson-numbers.sh`, 6/6 PASS), inkopplad i `ci.yml` bredvid
husets övriga grindvakts-sviter — per [ADR-039](ADR-039-konsistens-grindar-kadens.md)
§ lesson→grind: *en grind är inte en grind förrän dess fyrning fortlöpande
verifieras*.

### 4. Räckvidden är lessons — de tre andra serierna åtgärdas inte här

- **Kort:** redan löst. `backlog`-CLI:t äger allokeringen.
- **ADR och tråd:** mintas nästan uteslutande av orkestreraren, alltså redan
  seriellt i praktiken, och ADR-räknings-grinden fäller på drift. Risken är reell
  men obeprövad. Att bygga fragment-vägar för dem nu vore spekulativ komplexitet
  ovanför golvet. **Omprövas om en kollision faktiskt inträffar** — det är
  villkoret, inte en känsla.

## Alternativ som övervägdes

- **Lås-fil med senaste numret.** Föreslagen i
  [MADR issue #28](https://github.com/adr/madr/issues/28) för exakt vårt problem.
  Förkastad av den svaghet issuen själv namnger: *"The con of this solution is
  that a Dev may forget to modify the lock file."* Den flyttar antagandet, tar
  inte bort det — och en agent som glömmer filen får samma kollision, nu med ett
  extra steg.
- **Grind mot kollision, utan fragment-väg.** Ett skript som fäller på dubblett
  och inget mer. Förkastad som halvmesyr: den säger nej *efter* att arbetet
  gjorts, vilket är precis vad som hände manuellt 2026-07-26 — grinden gör
  kollisionen synlig, inte billigare. [ADR-079](ADR-079-instruktionsleverans-barare-per-lager.md)
  mätte samma klass: en skriven regel hade ~0 % efterlevnad, medan att ta bort
  möjligheten att göra fel gav 75 %. Dubblett-kontrollen behålls däremot som
  **backstop** för den som skriver direkt i `lessons.md`.
- **Datum-baserade ID:n** (`2026-07-27-slug.md`), också ur MADR #28: *"The
  combination of date and title should never conflict."* Förkastad för lessons —
  våra 342 poster är korsrefererade i löpande prosa (`[[L347]]`, "L322-klassen",
  "samma klass som L328"). Ett ID-byte river referensnätet utan att lösa något
  fragment-vägen inte redan löser.
- **Numret ÄR PR-numret** (Rust RFC 0002: *"don't assign an RFC number yet; this
  is going to be the PR number"*). Principen adopteras — allokatorn ska vara
  något som inte kan kollidera — men inte den konkreta formen: PR-nummer är inte
  monotona i lesson-ordning, och samma referensnät-argument gäller.

## Verktygsvalet: towncrier som VERKTYG — retroaktiv redovisning

> **Tillagt 2026-07-30 (`TASK-86`), inte skrivet vid beslutet.** Ingenting ovan
> ändras; ett hål fylls. Verktygsvals-prövningen blev ett **stående** krav först
> 2026-07-27 (restlistans § A3b): innan ett nytt skript byggs ska prövningen göras
> och **utfallet redovisas** — även när domen blir "bygg eget". ADR-081 byggdes
> samma dag, före kravet.

Prövningen gjordes **delvis**. towncrier lästes, och dess *mönster* lånades — det
står i § Ärlighet om underlaget nedan. Vad som aldrig skrevs ned var domen i den
andra frågan: varför towncrier inte togs som **verktyg**. Två skilda frågor, en
besvarad.

**Skälen nedan är ett RESONEMANG, inte en mätning.** De rekonstruerades i
efterhand; ingen av dem prövades empiriskt 2026-07-27. Det skrivs ut hellre än att
formen kläs som en prövning som inte gjordes:

- **Körtidsberoendet.** towncrier är ett Python-verktyg; detta är ett
  Node-projekt. Att dra in en Python-körtid i grind-kedjan för vad som i vårt fall
  är en filnamnskonvention är en kostnad utan motsvarande vinst.
- **Livscykeln matchar inte.** towncrier bygger en changelog-sektion ur fragmenten
  vid **release** och tömmer katalogen. `tasks/lessons.md` har inga releaser — den
  är en löpande fil som konsolideras när en post landar, inte när en version
  klipps.
- **Verktyget gör inte vårt jobb.** towncrier tilldelar inget nummer; det undviker
  numret. Undvikandet *är* mönstret vi lånade — och ett mönster är gratis att låna.
  Tilldelningssteget, som är hela beslut 1 ovan, har towncrier inget stöd för.

**Vad som senare faktiskt mättes — av någon annan, i efterhand.** Den tredje
punkten fick empiriskt stöd först två dagar senare:
[nummerallokerings-passet 2026-07-29](../research/nummerallokering-parallella-aktorer-2026-07-29.md)
§ Fynd 1b körde towncrier `24.8.0` och fann att ett orphan-fragment renderas
**nummerlöst** vid `build` — verktyget tilldelar aldrig ett nummer. Det bekräftar
domen ovan. Det gör den **inte** till en mätning: passet hade ett annat syfte, kom
efter beslutet, och 2026-07-27 fanns bara resonemanget.

Samma pass bär också en korrigering av **precedent-anspråket** i § Ärlighet om
underlaget — att towncriers `+`-form är *"vår form exakt"* håller bara för halva
formen. Den korrigeringen rör mönster-lånet, inte verktygsvalet, och ligger utanför
denna amendering.

## Konsekvenser

**Positiva:** kollisionen blir strukturellt omöjlig för nya lessons, inte bara
upptäckbar · den delade 5 693-radersfilen slutar vara en skrivkonflikt-yta i den
parallella fasen · **spärren på lesson-skörden lyfts** — elva väntande kandidater
kan landas som fragment omedelbart · en agent kan skörda utan att känna
numreringstillståndet, vilket tar bort ett skäl att läsa en 549 KB-fil.

**Negativa / skuld:** ett extra steg i konsolideringen, som måste utföras av
någon — glöms det ligger lärdomen kvar som fragment och syns inte i `lessons.md`
(mildrat av att grinden räknar upp antalet fragment vid varje körning, så antalet
är synligt i varje grön körning) · `lessons-hub-sync`-skillen i hub-repot känner
ännu inte fragment-vägen och behöver uppdateras med ett konsolideringssteg
(plugin-bump; **öppen post**) · två platser att leta på tills ett fragment
konsoliderats.

## Ärlighet om underlaget

**Precedent-rymden för just ADR-/lesson-numrering är tunn**, och det fejkas inte:
MADR issue #28 är **öppen och obesvarad** — ADR-communityn har problemet utan
etablerat svar. Vad som däremot är väl belagt är det generella mönstret:

- **towncrier** (Twisted, pytest, pip, BuildBot, attrs) löser samma
  delade-fil-konflikt för changelogs. Dokumentationen: *"the filename consists of
  the issue/ticket ID (or some other unique identifier)"*, och verktyget stödjer
  uttryckligen fragment **utan** ID via `+`-prefix — vår form exakt.
- **Rust RFC 0002** flyttar nummertilldelningen till en allokator som inte kan
  kollidera.

Alltså: **tre solida precedenter för principen, noll för vår exakta domän.** Det
är läget, och det skrivs ut hellre än att räknas upp.

**Vad som inte är mätt:** att fragment-vägen faktiskt följs av agenter. Grinden
gör den felaktiga vägen omöjlig, men den kan inte tvinga någon att skörda alls.
Efterlevnaden bör läsas av i praktiken innan formen utsträcks till fler serier.

## Uppföljning

- **`lessons-hub-sync`-skillen** (hub) uppdateras med konsolideringssteget —
  öppen post, kräver plugin-bump.
- **De elva väntande kandidaterna** landas som fragment och konsolideras därefter
  seriellt.
- **Ompröva räckvidden** om en ADR-, tråd- eller kortnummer-kollision faktiskt
  inträffar.

## Relaterat

- [ADR-076](ADR-076-merge-grinden-ruleset-pr-flode.md) — merge-grinden som
  tillhandahåller serialiseringen detta beslut lutar sig mot
- [ADR-039](ADR-039-konsistens-grindar-kadens.md) — kadens-principen och
  lesson→grind-kravet på fortlöpande verifiering
- [ADR-079](ADR-079-instruktionsleverans-barare-per-lager.md) — mätningen som
  motiverar mekanism före skriven regel
- [ADR-080](ADR-080-acceptance-klassen-hermetisk-utbrytning.md) — samma
  delegerings-bokföring, samma spår
- [`tasks/lessons.d/README.md`](../../tasks/lessons.d/README.md) — konventionen i
  bruksform
