# En identitet härledd ur en POSITION i en föränderlig lista bär både ett tak och ett race — och taket har ingen bevakare

**[UNIVERSAL] Härleds en unik resurs (en port, ett slot, ett ID) ur ett
objekts PLATS i en lista, ärver den två egenskaper listan har och identiteten
inte borde ha: listan har en längd, alltså finns ett tak — och listan kan
ändras under dig, alltså finns ett race. Båda måste bokföras när formen väljs,
och taket behöver en bevakare som larmar FÖRE det nås, inte en `throw` i det
ögonblick någon råkar behöva resursen.**

Instansen är vårt eget portschema (`tests/support/dev-portar.ts`, `TASK-251`).
Formen är i övrigt bra vald och alternativen är öppet avfärdade i filens
docblock — detta är inte kritik av valet, utan en bokföring av vad valet
kostar när flottan växer.

## Mekaniken, läst ur källan (2026-08-23)

```text
port = klassens basport + worktree-index * 1000
```

`worktree-index` är checkoutens plats i `git worktree list --porcelain`:
huvudkatalogen alltid `0`, de länkade sorterade och numrerade därefter.
Basportarna är `a11y 5199`, `visual 5299`, `acceptance 5399`,
`webblasarbeteende 5499`. Taket är `MAX_INDEX = 26`, valt så att
`5499 + 26 * 1000 = 31499` håller sig under Linux efemära portintervall
(`32768–60999`). Över taket kastar `devPort()` — fail-closed, med
anvisningen att köra `git worktree prune` eller `git worktree remove`.

## De två egenskaperna, mätta

**Taket är närmare än det ser ut.** Mätt i detta träd 2026-08-23:
`git worktree list` ger **25 checkouts** (huvudkatalogen + 24 länkade), varav
**19** är agent-worktrees (`agent-<hash>`). Högsta index i bruk är alltså
**24** mot taket **26** — **två platser kvar**. Ingen mekanism räknar detta;
ingen larmar vid 24 av 26. Den första signalen är en `throw` i en testkörning
hos den agent som råkar få det 28:e blocket, och felmeddelandet ber DEN agenten
städa upp efter alla andra.

**Racet är känt och öppet bokfört i källan:** index är en position i en lista
som ändras när en worktree skapas eller tas bort. Tas en worktree bort medan
en körning i en sorterat senare worktree pågår, flyttar den senares index — och
en ny körning kan då landa på en port som redan används. Utfallet är högt
(`--strictPort` + `reuseExistingServer: false` ⇒ `Port NNNN is already in
use`), aldrig en tyst delning. Det är rätt avvägning, men det betyder att
STÄDNING under pågående flottdrift är en operation med sidoeffekter, inte en
neutral hygienåtgärd.

**Två portar står helt utanför schemat, med avsikt:** e2e (`5173`) och
staging-preview (`4173`) är portlåsta av staging-EF:ernas
`CORS_ALLOWED_ORIGINS`-allowlist och kan därför inte deriveras.
Fleet-kollisionen på just dem kvarstår och kan inte lösas i portschemat.
S111 träffade exakt det hålet: en bakgrundskörning föll därför att `5173` var
upptagen av orkestrerarens egen dev-server.

## Det operativa

1. **Städa färdiga agent-worktrees som en del av flottans drift**, inte som
   efterarbete. Varje kvarlämnad worktree är en förbrukad plats i ett schema
   med 27 platser totalt.
2. **Städa när inget kör**, inte mitt i ett pass — se racet ovan.
3. **`git worktree remove` från en isolerad worktree måste ta en RELATIV
   sökväg.** En absolut sökväg bär huvudkatalogen som prefix (worktrees bor
   under `.claude/worktrees/`) och fälls därför av den textmatchande
   ägarskapsvakten. Mekanismen och dess fyra mätta instanser bor i
   `nastlade-worktree-sokvagar-faller-textmatchande-katalogvakter.md` — den
   nämns här bara för att den är förkravet för att kunna FÖLJA punkt 1.

## Den generella formen

**Ett tak som bara märks när det nås är inget tak — det är en fälla.** Varje
härledd-ur-position-schema (portblock, färgindex, shard-nummer, slot-tilldelning
i en fast rymd) bör bära en räkning av använda platser bredvid sin gräns, och
den räkningen hör hemma där kapaciteten FÖRBRUKAS (worktree-skapandet), inte
där den konsumeras (testkörningen). Konsumenten kan bara kasta; producenten
kan välja att inte skapa.
