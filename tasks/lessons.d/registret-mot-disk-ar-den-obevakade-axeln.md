# Registret mot disk är den obevakade axeln — två register som är eniga kan båda ha fel

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
