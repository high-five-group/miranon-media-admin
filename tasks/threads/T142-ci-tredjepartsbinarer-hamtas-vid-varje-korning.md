---
owner: marcus803
updated: 2026-08-12
review_by: 2026-11-12
status: stable
lifecycle: paused
---

# T142 — CI hämtar sina grindverktyg från nätet vid varje körning, och nätet svek fem gånger på en eftermiddag

> Uppstod i S105 2026-08-12 när fem CI-körningar föll på rad utan att en
> enda rad kod var fel. Triagerad enligt `ADR-053`: blockerar inte —
> omkörning fungerar varje gång — men kostar dequeue- och
> omarmerings-cykler och gör röd-signalen otillförlitlig. Parkerad för
> senare; ingen åtgärd vidtagen.

## Vad som är MÄTT

Fem fällningar 2026-08-12 mellan ca 16:44 och 17:20, samtliga i
**nedladdningssteget** för ett tredjeparts-verktyg, ingen i vår kod:

| Verktyg | Var | Felutskrift verbatim |
|---|---|---|
| shellcheck (pinnad 0.11.0) | PR-körning `#1215` | steget `Install shellcheck (pinned v0.11.0)` föll |
| lychee | PR-körning `#1216` | exit 22 i hämtningen, 0,12 s efter stegstart |
| actionlint 1.7.12 | **merge_group** `#1215` | `curl: (56) Connection died, tried 5 times before giving up` |
| Vale | **merge_group** `#1218` | `curl: (22) The requested URL returned error: 503` |
| shellcheck | PR-körning `#1215`, andra instansen | samma steg som rad 1 |

Samtliga hämtar från `github.com/<projekt>/releases/download/...` med
`curl -fsSL --retry 5 --retry-all-errors --retry-max-time 60`. **Fem
retries räckte inte** i minst två av fallen — felet är alltså inte en
enstaka blipp utan ett fönster där ursprunget svarade 503 eller bröt
anslutningen upprepat.

Alla gick igenom vid omkörning. Ingen av dem indikerade ett verkligt
trädfel.

## Varför det kostar mer än en omkörning

De två som föll i **merge_group** är de dyra. En `failed_checks`-dequeue
konsumerar armeringen tyst (`CLAUDE.md` § Landning, tabellrad 4): PR:en
ser efteråt identisk ut med en som aldrig armerats, och står still tills
någon armerar om. `#1215` sparkades ut **två gånger** av detta skäl under
eftermiddagen och krävde manuell omarmering båda gångerna — den hade
stått stilla på obestämd tid utan heartbeat-svepets kandidat-larm.

Andrahandseffekten är värre än tidsförlusten: när rött regelbundet
betyder "nätet svek" tränas läsaren att avfärda rött. Det är precis den
avtrubbning en grind inte får orsaka.

## Vad som INTE är utrett

- Om detta var en avgränsad störning hos GitHubs release-CDN denna
  eftermiddag, eller ett återkommande mönster. **En eftermiddags data
  räcker inte** för att skilja dem åt — `npm run metrics:ci` bär
  röd-orsak per jobb och är rätt instrument om frågan ska avgöras.
- Om `--retry 5 --retry-all-errors --retry-max-time 60` är rätt
  parametrar. Taket på 60 s kan vara det bindande villkoret snarare än
  antalet försök; omätt.
- Hur många av repots grindsteg som har samma beroende. Fyra distinkta
  verktyg är belagda; det finns sannolikt fler.

## Möjliga vägar, ingen prövad

1. **`actions/cache` på de nedladdade binärerna**, nycklade på version.
   Billigast, rör inte pinningen, men första körningen efter en
   cache-miss har kvar problemet.
2. **Vendorera binärerna i repot.** Tar bort nätberoendet helt men lägger
   binärer i git och flyttar uppdateringsbördan till oss.
3. **Container-image med verktygen förinstallerade.** Branschmönstret för
   detta problem, men en betydligt större ändring av CI-arkitekturen —
   och den bör i så fall vägas mot `T137` (CI-systemet som central
   hub-tjänst), eftersom en image hör hemma i den diskussionen.
4. **Höj `--retry-max-time`.** Enradsändring, men behandlar symptomet och
   förlänger den röda vägen när ursprunget verkligen är nere.

Ingen av dem ska väljas på en eftermiddags data. Väg 1 är den enda som är
billig nog att göra utan mer underlag, om frågan blir akut igen.

## Besläktat

- `T137` — CI-systemet som central hub-tjänst; en container-image-lösning
  hör hemma där, inte som en isolerad patch här.
- `CLAUDE.md` § Landning, tabellrad 4 — dequeue-mekaniken som gör de två
  merge_group-fällningarna dyrare än de ser ut.
