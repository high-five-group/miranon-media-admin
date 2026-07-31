# ADR-084: Granskningsfixturer blir aldrig purge-bara — livstiden bärs av fixturen själv

- Status: Accepted (Session 91 — 2026-07-31)
- Datum: 2026-07-31
- Fas: Session 91, restlistans spår E (`TASK-95`)

> **Om beslutsvägen — bokförd öppet.** `TASK-95`:s bygg-agent vägde sju former,
> valde ingen på eget bevåg och lämnade record-frågan uppåt i stället för att
> minta själv (kortets Final Summary: *"ADR-bar-frågan för beslutet att
> granskningsfixturer aldrig får purge-target eller raderande CI-vakt"*). Marcus
> beslutade mintningen 2026-07-31. Noteras av samma skäl som i
> [ADR-080](ADR-080-acceptance-klassen-hermetisk-utbrytning.md),
> [ADR-081](ADR-081-nummer-tilldelas-vid-landning.md) och
> [ADR-082](ADR-082-lankgrindens-form-presubmit-postsubmit.md): en läsare ska
> kunna se vem som vägde, inte bara vad som beslutades.

## Kontext

Granskningsfixturen är den data Marcus granskar en yta mot när staging saknar
den — ett kommande event med anmälningar i båda tillstånden, en fylld kö, en lång
lista. Den byggs numera av
[`scripts/seed-review-fixture.mjs`](../../scripts/seed-review-fixture.mjs)
(`npm run seed:review`). Innan skriptet fanns byggdes den för hand två gånger:
2026-07-22 (`Event-796`, Ort `Skövde`) och 2026-07-26 (`ZZ-GRANSKNING-S91`).

Skriptet bär sedan sin födelse ett skyddsräcke som är hela utgångspunkten för
detta beslut. **Skyddsräcke 2, purge-kollisionsvakten**, korsläser fixturens
markörer mot den *skarpa* `.purge-staging-policy.json` och **vägrar skapa
fixturen** om de skulle kunna matchas av setup-purgen:

```js
const kollisioner = purgeCollisions(samples, purgePolicy);
if (kollisioner.length > 0) {
  throw new GuardError(
    'purge-kollision: fixturens markörer skulle raderas av setup-purgen — ' +
      kollisioner.map((k) => `${k.value} ⇒ ${k.target}`).join('; '),
  );
}
```

Policyn **läses**; mönstren dupliceras aldrig in i skriptet, så vakten kan inte
drifta ifrån den purge som faktiskt körs.

### Varför en purge-target vore skarpt farlig — mätt mot filerna, inte uppskattat

Setup-purgen är ingen nattlig hygien-körning. Den kör **före staging-jobbet i
varje suite-körning**: `ci-suite.yml`:s `test-staging` deklarerar
`needs: [purge]` med kommentaren *"setup-purgen … ska ha kört FÖRE
staging-stegen"*, och purge-jobbet är villkorat på `inputs.run_staging` — samma
villkor som staging-jobbet självt.

Ålders-guarden i `.purge-staging-policy.json` är `minAgeMinutes: 60`. En
granskning pågår i **dagar**. En target som matchade `ZZ-GRANSKNING-*` hade
alltså raderat granskningsdatan under Marcus en timme efter att den skapats, vid
nästa PR som rörde staging. Det är inte ett kantfall — det är normalfallet.

### Felslutet är inte hypotetiskt: det gjordes, i ett styrande register

Restlistans verifieringspass 2026-07-27 bokförde `ZZ-GRANSKNING-S91` och
`app-segment-test` som **samma klass av lucka** — ordagrant *"saknas båda i
purge-policyn (0 förekomster vardera)"* (formuleringen bevarad i `TASK-88` och
`TASK-95`; restlistan bär numera en klassvarning i stället).

De har **motsatta rätta svar**. `app-segment-test` SKA ha en target och fick den
i `TASK-87`. `ZZ-GRANSKNING-*` ska aldrig ha en. Skillnaden är inte vilken lucka
som syns i policyfilen, utan **vad resursen är**: en sentinel-rad som ett test
lämnat efter sig är skräp i samma sekund den skapats, medan en granskningsfixtur
är data någon *använder* — och den skillnaden syns inte på raden i policyfilen.

Klassvarningen skrevs in i efterhand, men den bodde bara i restlistan. En varning
i en restlista läses inte av den som ett halvår senare ser en kvarlämnad fixtur i
staging och drar den naturliga slutsatsen.

### Vad som saknades, och som gjorde frågan svår

Skyddsräcke 2 svarar på *"vem får INTE radera fixturen medan granskningen
pågår"*. Ingenting svarade på *"vem raderar den när granskningen är slut"* — och
ingen mekanism KUNDE svara, eftersom **"granskningen pågår" inte var uttryckt
någonstans i datan**. Utan det uttrycket är varje automatisk städning en gissning.

Det enda som fanns var en rad prosa i skriptets sista utskrift: *"Städa efteråt:
`npm run seed:review:clean -- --ort <ort>`"*. Två fixturer bar två skrivna
uppmaningar och gav noll efterlevnad — `ZZ-GRANSKNING-S91` stod fyra dygn,
`Event-796` över en vecka. Det är exakt den mekanism-klass
[ADR-083](ADR-083-prosa-som-pastar-mekanism.md) dömer: en uppmaning till en
människa i slutet av en logg.

## Prövningen mot ADR-baren

Att en record som säger *"gör aldrig X"* alls hör hemma bland arkitekturbesluten
är inte självklart, så prövningen står utskriven i stället för att kvitteras.

**1. Svårt att återställa — HÅLLER, men bara på koherens-axeln.** Det står här
hellre än att slätas över: i **kod** är ändringen en rad i en JSON-fil och
trivialt reverterbar, och även datan är billig — fixturen återskapas med ett
kommando. Tre andra saker är det inte.

- *Tidsfönstret.* Raderingen sker i en delad bas mitt under en mänsklig
  granskning. 60 minuters ålders-guard mot ett dagslångt granskningsfönster gör
  träffen nära säker, inte hypotetisk.
- *Kaskaden — verifierad i kod, inte resonerad fram.* En target som matchar
  fixturens markörer får `seed:review` att kasta `GuardError` och **vägra skapa
  fixturen alls**. Symptom-fixen tar alltså sönder verktyget, och nästa naturliga
  fix på *det* är att försvaga skyddsräcke 2 — samma räcke som gör vakten
  drift-säker genom att läsa policyn i stället för att kopiera mönstren. En rad
  river två.
- *Kunskapen.* Det som gör targeten fel syns inte vid targeten. Den kunskapen har
  redan gått förlorad en gång, i ett register vars hela syfte är att inte tappa
  saker.

**2. Överraskande utan kontext — HÅLLER, empiriskt.** Fallet är inte konstruerat:
felslutet gjordes, av oss, och stod skarpt i restlistan. En ostädad fixtur i
staging *ser ut* som en lucka i purge-policyn, och fyra targets bredvid bevisar
att luckan brukar vara just det.

**3. Resultat av en verklig avvägning — HÅLLER.** Sju former vägdes i `TASK-95`
(fyra för livstiden, tre för de handbyggda), var och en med sitt skäl, och
kortets bygg-agent valde ingen på eget bevåg utan lämnade frågan uppåt.

Baren är alltså passerad på samtliga tre villkor. Det svagaste är villkor 1, och
det bär enbart på koherens — inte på kod.

## Beslut

### 1. Granskningsfixturer får aldrig en target i `.purge-staging-policy.json`

Regeln gäller **mönstret `ZZ-GRANSKNING-*` som klass**, inte den enskilda
instansen: ingen target får åberopa det i `filterByFormula` eller
`exactMatchPattern`, och ingen ny target får konstrueras så att en
granskningsfixturs markörer faller inom den.

En kvarlämnad fixtur i staging är **aldrig** ett bevis för att targeten saknas.
Den är ett bevis för att livstiden gått ut utan att någon kört svepet.

### 2. Ingen raderande CI-vakt som inte läser fixturens egen stämpel

Form (c) i `TASK-95` — en raderande vakt med lång TTL, exempelvis 14 dygn —
förkastas permanent. En vakt som raderar på **ålder** i stället för på fixturens
uttryckta livstid återinför precis den risk skyddsräcke 2 finns för att stänga:
en granskning som pågår längre än TTL:en får sin data raderad under sig, av en
aktör ingen ser innan den fyrar. Att TTL:en är lång ändrar sannolikheten, inte
felläget.

### 3. Den positiva hälften: städningen tas inte bort, den flyttas in i fixturen

Beslutet är inte "sluta städa". Städningen flyttas från en raderande vakt till en
**livstid som fixturen själv bär** (`TASK-95` form (a), landad i `#493`):

- Skapandet stämplar `[UTGÅR: YYYY-MM-DD]` i eventets `Notering` — 14 dagar som
  default, `--livstid N` för ett annat fönster.
- Ett **förfallo-svep** läser stämpeln och städar det som passerat, via exakt
  samma `planClean`-väg, raderings-ordning och skyddsräcken som en manuell clean.
- Svepet kör automatiskt i både create och clean (`--ingen-svep` stänger av) och
  ensamt med `npm run seed:review -- --sweep`.
- **En fixtur vars stämpel inte passerat rörs aldrig.** Det ÄR "granskningen
  pågår", och det är den halvan som gör mekanismen säker.

Tre fail-safe-riktningar, alla åt samma håll (hellre lämna kvar): saknad stämpel
⇒ rörs aldrig · framtida stämpel ⇒ rörs aldrig · oparsbar stämpel ⇒ rörs aldrig.

**Stämpeln kan inte backdoora beslut 1.** Ingen target i policyn läser fältet
`Notering`, vilket är mekaniskt verifierat i `TASK-95`:s testsvit mot den skarpa
policyfilen — utgångsdatumet kan alltså inte göra fixturen purge-bar.

### 4. Den ärliga gränsen, utskriven

Svepet är **ingen tidsdriven automat**. Det körs när skriptet körs. En förfallen
fixtur ligger kvar tills någon kör skriptet igen. Det är priset för att inte ha
en raderande aktör i staging, och det står i skriptets huvud, i
[`CLAUDE.md`](../../CLAUDE.md) § Granskningsdata i staging och här.

### 5. Vad beslutet INTE förbjuder

En record som säger "aldrig" måste säga hur långt aldrig sträcker sig, annars
förbjuder den mer än den vägde:

- **En rapporterande (icke-raderande) CI-vakt är inte förbjuden av denna ADR.**
  Form (b) förkastades i `TASK-95` på ett annat skäl — den avslutar ingenting,
  den flyttar uppmaningen från skriptets sista rad till en CI-logg, och
  rådgivande lägen efterlevs inte i det här huset (`L321`-klassen). Den är
  otillräcklig, inte farlig.
- **Legacy-registret för handbyggda fixturer** (`TASK-95` form (e)) raderar,
  men är inte en vakt: det är ett slutet register i config med fyra ankare per
  post, dry-run som default och `--bekrafta` som krav. Det står utanför denna
  ADR:s förbud och regleras av sina egna skyddsräcken.

## Precedent — fyra projekt, primärkälla per post, och gränsen deklarerad

Det verifierade mönstret är **inte** vår uppfinning: en städmekanism för delade
test-resurser lägger tillstånd om liv och död **på resursen**, och håller den
centrala destruktören blind för det som är i bruk.

| Projekt | Bärare av livstiden | Vad som skyddar det som används |
|---|---|---|
| **kube-janitor** (hjacobs) | annotationen `janitor/ttl` respektive `janitor/expires` **på objektet självt** | ingen central raderingslista; värdet `forever` som opt-out |
| **boskos** (kubernetes-sigs) | resursens `state` i tjänsten | janitorn hämtar **enbart** `dirty`-resurser; en `Reaper` måste först återställa övergiven ägd resurs till `dirty` |
| **Janitor Monkey** (Netflix Simian Army) | mark → notify → delete med schemalagd raderingstid | ägaren notifieras *"3 business days ahead of the termination date"* och kan flagga resursen som "not being cleaned" |
| **aws-nuke** (ekristen) | — | `blocklist` är **obligatorisk**: *"The blocklist must always be populated with at least one entry"* — konton som verktyget strukturellt inte får köra mot |

Källorna är projektens egen dokumentation, hämtad 2026-07-31 — inte
sekundärlitteratur: [kube-janitor](https://codeberg.org/hjacobs/kube-janitor) ·
[boskos](https://github.com/kubernetes-sigs/boskos) ·
[Janitor Monkey](https://github.com/Netflix/SimianArmy/wiki/Janitor-Home) ·
[aws-nuke](https://aws-nuke.ekristen.dev/config/).

Beslut 3 är kube-janitors form (utgången bor på resursen, inte i en central
lista). Beslut 1 är aws-nukes form (vissa ytor får aldrig hamna i destruktörens
målmängd). Boskos bär den precisa satsen: **det som är utlånat städas aldrig
direkt** — ett separat steg måste först förklara det övergivet.

**Precedent-rymdens gräns, deklarerad öppet.** Fyra projekt belägger *principen*.
Inget av dem belägger *vårt fall*, och det ska inte påstås:

- Alla fyra har **miljö-isolering** — konton, kluster, namespaces. Vi har det
  inte. [`docs/reference/airtable-constraints.md`](../reference/airtable-constraints.md)
  katalogiserar väggen: staging är en enda delad bas, och därför delar CI-jobbet
  och den mänskliga granskaren samma rader.
- Alla fyra har en **schemalagd daemon**. Vårt svep har medvetet ingen (beslut 4).
- Janitor Monkeys notifierings-fönster förutsätter en kanal till en ägare.
  Repot har ingen fungerande sådan — det är en känd öppen tråd (`T108`,
  notifieringar som aldrig kommer) — vilket är en del av skälet att "mark and
  notify" inte var en tillgänglig form för oss.
- Ingen av dem hanterar en **SaaS-postbutik där "resursen" är rader en människa
  tittar på i en webbläsare**. Den domänen saknar jämförbar precedent i det
  material som gicks igenom.

Räkningen fejkas inte: **fyra för principen, noll för domänen.**

## Alternativ som övervägdes

De sju formerna vägdes i `TASK-95` och redovisas i kortets implementation notes.
Det som hör hemma här är de som bär *detta* beslut.

**(b) Rapporterande CI-vakt.** Billig och fail-safe, men avslutar ingenting.
Repot har precedent för att rådgivande lägen inte efterlevs — samma skäl fällde
form (c) i `TASK-77`. Förkastad som *lösning*, inte som *möjlighet* (se beslut 5).

**(c) Raderande CI-vakt med lång TTL.** Den enda formen som är en faktisk
mekanism utan att kräva ett nytt uttryck i datan — och därför den frestande. Den
förkastas i beslut 2 på felläget, och den bär dessutom en kostnad som sällan
räknas in: ett nytt jobb med write-scopad `STAGING_AIRTABLE_TOKEN`, plus
semafor-koordinering mot purge-jobbet (`TASK-76`:s race). Fel proportion mot ett
ackumulerande skräpproblem.

**(d) Acceptera och skriv ned** — granskningsfixturer är långlivade med flit,
sluta bokföra dem som skuld. Vägd sist per kortets uttryckliga krav, och faller
på empirin: två fixturer hade två skrivna uppmaningar och noll efterlevnad. Att
skriva en tredje är samma sak igen.

**En purge-target med mycket hög `minAgeMinutes`.** Den formen stod inte i
kortets sju, och den vägs här eftersom den är det första en läsare kommer att
föreslå. Den faller på tre ben: ålders-guarden är **global** i policyfilen, inte
per target, så en höjning flyttar hela purgens beteende · targeten hade fällt
`seed:review` via skyddsräcke 2 och därmed gjort fixturer omöjliga att skapa ·
och ålder är fortfarande fel proxy för "granskningen är slut".

**Under-bar-maskineri i stället för ADR** — en lesson plus raden som redan står i
`CLAUDE.md`. Ett äkta val, och det som gällde fram till 2026-07-31. Förkastat på
villkor 2 i bar-prövningen: raden i `CLAUDE.md` säger *vad* som gäller men bär
inte avvägningen, och den som en dag vill lägga targeten kommer att läsa den som
en åsikt utan underlag. En permanent negativ regel behöver sin motivering på ett
ställe som överlever att `CLAUDE.md` skrivs om.

## Konsekvenser

**Positiva.** Granskningsdata kan inte längre raderas mitt under en granskning av
en mekanism vi själva byggt · den falska analogin mellan de två purge-luckorna är
durabelt avvisad, med **skillnadskriteriet** utskrivet (vad resursen är, inte var
luckan syns) · den som ser en kvarlämnad fixtur har nu en record att läsa i
stället för en naturlig slutsats att dra · städningen är fortfarande mekaniserad,
bara på fixturens egna villkor.

**Negativa och skuld.** Svepet är inte tidsdrivet, så en förfallen fixtur kan
ligga kvar godtyckligt länge — mekanismen flyttar felläget från "raderas för
tidigt" till "städas för sent", och det senare valdes medvetet · beslut 1 är
**prosa, inte mekanism** i denna ADR:s mening: ingen grind hindrar någon från att
lägga targeten i policyfilen. Det som fångar felet är att `seed:review` slutar
fungera vid nästa körning — en indirekt, fördröjd signal, inte en spärr ·
`Event-796` (10 poster, Ort `Skövde`) bar samma skuld och **städades 2026-07-31**,
medan denna ADR skrevs: Marcus utvidgade mandatet samma dag (*"I staging-basen
kan du göra vad du vill"*), och legacy-registrets väg raderade 6 anmälningar,
3 personer och 1 event med efter-verifiering **0 radera-bara rader kvar**. Den
skuld beslutet adresserar är inte att fixturen gick att städa — det gick den hela
tiden — utan att den låg kvar i **nio dygn** utan att någon mekanism kunde veta
att granskningen var slut.

## Ärlighet om underlaget

- **Effekten av en purge-target är resonerad ur filerna, aldrig kört skarpt.**
  `needs: [purge]`, `minAgeMinutes: 60` och `GuardError`-kastet är lästa i
  `ci-suite.yml`, `.purge-staging-policy.json` respektive
  `seed-review-fixture.mjs`. Ingen har lagt targeten och mätt raderingen — och
  ingen ska.
- **Fyra precedenter belägger principen, noll belägger domänen.** Se den
  deklarerade gränsen ovan. `blocklist`-analogin är särskilt sträckt: aws-nuke
  skyddar ett *konto* från ett verktyg som raderar allt, vi skyddar ett
  *radmönster* från en purge som raderar uppräknade targets.
- **Livstidens 14 dagar är ett antagande, inte en mätning.** Ingen mätserie finns
  över hur länge en granskning faktiskt pågår. Talet valdes med marginal mot de
  två observerade fallen (fyra dygn respektive över en vecka) och är därför
  åtminstone inte motsagt av dem.
- **Beslut 1:s räckvidd är namnprefixet `ZZ-GRANSKNING-*`.** En framtida
  granskningsfixtur som döps till något annat faller utanför regelns bokstav.
  Skyddsräcke 2 skyddar den ändå — det matchar markörerna, inte namnet — men
  denna ADR:s formulering gör det inte.

## Öppet — registrerat, inte beslutat (ADR-053)

**Ett schemalagt anrop av det stämpel-läsande svepet är varken förbjudet eller
tillåtet av denna ADR.** Det är en tredje sak än form (c): en scheduler som kör
`--sweep` raderar bara det vars stämpel passerat, alltså aldrig en pågående
granskning, och delar därför inte form (c):s felläge. Den bär däremot form (c):s
*kostnader* rakt av — write-scopad token i ett nytt jobb och semafor mot
purge-jobbet. Frågan lämnas öppen i stället för att avgöras i förbifarten; den
hör ihop med `T108` (kanaler som inte finns).

## Relaterat

- [ADR-083](ADR-083-prosa-som-pastar-mekanism.md) — klassen som dömer "städa
  efteråt"-utskriften; denna ADR är dess motsats i den meningen att beslut 1
  öppet deklareras som prosa
- [ADR-063](ADR-063-airtable-bas-som-forstklassig-leverabel.md) — varför staging
  är en delad bas utan miljö-isolering, vilket är hela skälet att precedenten
  bara bär principen
- [ADR-076](ADR-076-merge-grinden-ruleset-pr-flode.md) — landnings-grinden som gör
  en ändring i `.purge-staging-policy.json` till en granskad PR
- [ADR-053](ADR-053-trad-arkitektur-forensisk-lasbarhet-triage.md) — triagen som
  § Öppet lutar sig mot
- `TASK-95` (formvalet, sju former vägda) · `TASK-88` (mätningen) · `TASK-87`
  (targeten som SKA finnas, och som analogin förväxlade den med) · `#493`
- [`CLAUDE.md`](../../CLAUDE.md) § Granskningsdata i staging — regeln i sin
  operativa form, i den fil som faktiskt laddas varje session
