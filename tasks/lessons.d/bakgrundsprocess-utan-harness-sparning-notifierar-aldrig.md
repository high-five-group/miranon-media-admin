# En bakgrundsprocess som harnesset inte spårar notifierar aldrig

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
[[echo-efter-kommando-maskerar-exitkoden]] (som handlar om att läsa fel
exitkod). Här läses ingen kod alls, för ingen läsare finns. Släktskapet är att
båda ser ut som fungerande mekanik och båda ger tyst fel — men denna kostar
mänsklig uppmärksamhet i stället för en felaktig slutsats, och det är den dyrare
valutan.
