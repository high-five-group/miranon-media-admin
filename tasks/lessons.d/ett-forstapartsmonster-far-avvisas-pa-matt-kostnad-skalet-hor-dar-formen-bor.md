# Ett förstapartsmönster får avvisas på MÄTT kostnad — men skälet hör i filen som bär avsteget, aldrig bara i sessionsdoket

**En förstapartskällas rekommendation är en default, inte en lag. Den får
avvisas — men bara mot ett MÄTT tal med sitt mätkommando, aldrig mot tycke, och
bara med skälet nedskrivet i den fil som bär avsteget. Ett avsteg är osynligt i
sin egen form: nästa läsare ser en lucka där det rekommenderade mönstret skulle
stått, och "lagar" den. Skälet på plats är det enda som skiljer ett beslut från
ett slarv — och det ska namnge vilken garanti som VÄXLADES BORT, inte bara
vilken kostnad som sparades.**
`[UNIVERSAL]`

Instans (S108, 2026-08-24, Supabase-CLI-pinningen): förstapartskällan
(`github.com/supabase/cli` README) rekommenderar `npm install -D supabase`.
Vägen mättes och förkastades på kostnad, inte princip —
`@supabase/cli-linux-x64` (CI:s plattform) är **159 079 541 B ≈ 159 MB**
unpacked, `@supabase/cli-darwin-arm64` **113 915 186 B ≈ 114 MB**
(`npm view <paket> dist.unpackedSize`; båda talen ombekräftade mot registret
2026-08-24). CLI:t anropas aldrig i CI — verifierat om: noll träffar på
CLI-underkommandon i `.github/workflows/*.yml`, och paketet är frånvarande ur
både `dependencies` och `devDependencies` (raden `"supabase"` i `package.json`
ligger i `keywords`). Avsteget står i `.supabase-cli-policy.conf` § VARFÖR
VERSIONEN INTE PINNAS I package.json — med båda talen, deras mätkommando och
datum — inte bara i sessionsdokets Del 18 § E. Landat i PR `#1915`.

**Vaktens två riktningar, och varför paret måste läsas ihop.** [[L412]] säger
att *"gratis"* aldrig är ett skäl att BYGGA något; denna post säger att ett mätt
tal får vara skäl att AVSTÅ. Samma dubbelriktade över-engineering-vakt, motsatt
tecken — och [[L243]] håller golvet: vakten skär SPEKULATIV komplexitet, aldrig
en beprövad ribba. 159 MB i varje CI-jobb för ett verktyg inget jobb kör är
spekulativ kostnad ovanför golvet; hade CI faktiskt anropat CLI:t vore samma tal
priset för golvet och inte förhandlingsbart. Det är därför "anropas aldrig i CI"
måste MÄTAS och inte antas — det är den mätningen som avgör vilken sida av
vakten kostnaden hamnar på. Jämför fragmentet
`root-config-isolering-tar-bort-en-flaggas-kostnad-dar-den-inte-skyddar.md`:
samma resonemangsform (skyddsytan är smalare än kostnadsytan), men där löstes
det med isolering i stället för avvisning.

**Spänningen mot [[L430]] — den ska skrivas ut, inte tigas ihjäl.** L430 säger
att `npx <namn>` frågar registret efter ett PAKET som heter `<namn>`, och att
åtgärden är *strukturell, inte disciplinär*: en lokal bin från en pinnad
`devDependency` slås upp i FILSYSTEMET och kan därför inte förväxlas med ett
registerpaket. Det är en strikt starkare garanti än den valda vägen. Här är
L430:s specifika felläge ändå stängt — paketnamnet ÄR binärnamnet
(`npm view supabase` ⇒ `name = 'supabase'`, `repository.url =
github.com/supabase/cli`, verifierat 2026-08-24) och versionen är exakt pinnad,
så varken *fel version av rätt kod* eller *rätt namn på fel kod* kan uppstå
tyst. Men garantin är svagare: den vilar på att registret fortsätter mappa
namnet till samma ägare, medan filsystems-uppslaget inte vilar på något alls.
**Och just den växlingen står i skrivande stund INTE i policyfilens huvud** —
det argumenterar bara byte-determinism via immutabla npm-versioner, inte
namn-axeln. Regeln ovan tillämpad på sig själv fäller alltså sitt eget
föredöme: skälet finns på plats, men det redovisar bara halva avvägningen.

**Avgränsning mot [[L337]].** L337 säger att kodkommentarer *"uttryckligen INTE"*
är konventionsbärare — *"en konvention utan hem är en konvention som kommer att
brytas"*. Det motsäger inte denna post, och skiljelinjen är värd att hålla: en
KONVENTION gäller många filer och behöver ett hem utanför dem alla, medan ett
BESLUTS rationale är bundet till exakt den artefakt det formar. [[L226]] slog
redan fast formen — *"dokumenterad exkludering med rationale där beslutet bor …
är governance — en tyst lucka är det inte"* — och denna post flyttar den
klausulen från grind-scope till en ny axel: avvisade förstapartsmönster.

**Det generella:** en förstapartsrekommendation bär auktoritet, så den som
avviker ärver bevisbördan, och den betalas i tre delar. Talet ("för stort" är
inte ett skäl, `159 079 541 B` med sitt mätkommando är). Platsen — och det är
den som glöms, eftersom ett avsteg inte lämnar något spår i formen det avviker
från: en config-fil ser ut som vilken config som helst, och frånvaron av en
devDependency ser likadan ut oavsett om den är övervägd eller förbisedd. Och
växlingen: vilken garanti gav vi upp? [[L374]] äger kravet att utfallet
redovisas *"även när domen blir 'bygg eget'"*, men lämnar öppet både VAR och
VAD; utan den tredje delen läser nästa granskare en avvägning som ett faktum,
och kan inte pröva om priset fortfarande är rätt när förutsättningarna ändrats.
