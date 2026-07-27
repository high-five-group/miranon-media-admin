# ADR-079: Instruktionsleverans väljs per lager — roll-disciplin-filen avvecklas

- Status: Accepted (Session 91 — 2026-07-27)
- Datum: 2026-07-27
- Fas: Session 91, T100-spåret (processarbete, ej byggfas)
- Superseder: [ADR-042](ADR-042-code-roll-disciplin-alltid-pa.md) (helt)

## Kontext

[T100](../../tasks/threads/T100-instruktionsleveransen.md) avtäckte att fyra artefakter
som konstitutionen bygger på aldrig når en Claude Code-session: `IDENTITET.md`,
`profile.md`, `templates/code-role-discipline.md` och `schema_reference.md`. Filerna
existerar; referenserna är inte döda. De levereras bara aldrig av sig själva.

ADR-042 etablerade roll-disciplin-filen som "alltid-på" med en pekare från
konstitutionen. Dess rad 35 formulerade kostnaden korrekt — *"en alltid-på template
auto-upptäcks inte som en skill — den pekas på från konstitutionen … och refereras i
arbetet"* — och antog att pekaren räcker. Filen underhölls v1.0 → v1.3 utan att läsas.

Tre research-pass mot primärkällor ligger till grund, samtliga med efterverifierade
citat:

- [`instruktionsleverans-branschpraxis`](../research/instruktionsleverans-branschpraxis-2026-07-27.md)
  — vilket lager bär vad
- [`roll-disciplin-dokumentklass`](../research/roll-disciplin-dokumentklass-2026-07-27.md)
  — finns dokumentklassen, och hur struktureras omdömesregler
- [`mekaniserbara-regler-branschpraxis`](../research/mekaniserbara-regler-branschpraxis-2026-07-27.md)
  — vilka regler bör bli spärrar

Plus en mätt inventering:
[`regelinventering-dubbletter`](../research/regelinventering-dubbletter-2026-07-27.md)
— 158 regelpunkter, klassade TVINGANDE 65 / KUNSKAP 48 / OMDÖME 41 / DÖD 4.

## Beslut

**1. Leveransbärare väljs per innehållsklass, inte per bekvämlighet.**

|Innehållsklass|Bärare|Varför|
|---|---|---|
|Tvingande regel (vem får göra vad)|`PreToolUse`-hook / `permissions`|*"To block an action regardless of what Claude decides, use a PreToolUse hook"*; enda lagret med kvantitativt stöd|
|Roll, rapportformat, svarsform|Output style i pluginet|Enda bäraren i systemprompten MED inbyggd påminnelse|
|Fakta som annars gissas (datum, gren)|`SessionStart`-hook som faktapåstående|Ett faktum kan inte glömmas; en uppmaning kan|
|Princip och omdöme|`CLAUDE.md`|Förstapartens uttalade hemvist|
|Procedur med trigger-ögonblick|Skill|Laddas när den behövs, kostar noll däremellan|
|Subagent-begränsning|Agentdefinition (`tools`, `isolation`, `maxTurns`)|Strukturell, inte turbaserad|
|Uppslagskunskap|Fil som läses on-demand|Behöver vara sökbar, inte närvarande|

**2. `templates/code-role-discipline.md` avvecklas som dokumentklass** och arkiveras i
`archive/code-roll-disciplinen/` (ARKIVERA-INTE-RADERA). §1–§5 → output stylen
`code-rollen`; det tvingande → spärrar; §6 → agentdefinitioner och delegerings-skills;
empirisk grund och versionshistorik → lessons och ADR-lagret.

**3. Två regler rivs i flytten, öppet.**

- **§3.3 (kvittens före varje commit och push) — DÖD.** Motsäger konstitutionens egen
  rad om att Code utför `git add/commit/push`, och `/do-work`:s kvitto-söm. Hade filen
  börjat levereras hade grinden stoppat arbetsflödet. Den var ofarlig enbart för att
  den aldrig lästes.
- **§6.4:s "det finns ingen löpande insyn" — FAKTAFEL.** Motsagt av de två bulletarna
  intill och av harnessets faktiska verktyg. Rätt formulering: insynen är pull-baserad
  och kostar kontext.

**4. Konstitutionen saneras till under 200 rader** (217 → 192): elva snitt per
inventeringen, tre döda pekare bort, två regler omformulerade mot branschpraxis
(`git pull` → `fetch`; meddelanderäkning → kontextfyllnad).

**5. Plugin-distribution är bäraren, inte user-`settings.json`.** Ett plugin kan bidra
med kontext genom skills, agenter, output styles och hooks — men inte genom filer
(*"A `CLAUDE.md` file at the plugin root is not loaded as project context"*) och inte
genom permissions (plugin-`settings.json` stödjer bara `agent` och
`subagentStatusLine`). Spärrar blir därför hooks, som dessutom tar precedens över
`permissions.allow`.

## Alternativ som övervägdes

**A — Lägg `templates/` i plugin-distributionen.** Förkastat: river sig självt.
Förstaparten är kategorisk om att filer i plugin-roten inte laddas som kontext, och att
installerade plugins inte kan referera filer utanför sin katalog. Fixar symptomet
(filen finns) men inte problemet (den levereras inte).

**B — `@`-importera filerna från konstitutionen.** Förkastat som huvudväg: fungerar
tekniskt men är dyrast av alla — *"imported files load at launch"* och *"doesn't reduce
context"*. Alla fyra artefakterna = +868 rader varje session, ~5× leverantörens
uttalade mål för alltid-på-lagret.

**C — `SessionStart`-hook som injicerar filen.** Förkastat: `additionalContext` har en
gräns på 10 000 tecken; filen är uppmätt **15 464**. Hooken hade degraderat till sökväg
plus förhandsvisning — exakt den pekare-som-aldrig-öppnas som är problemet. Hooken
levererar dessutom som system reminder, samma viktklass som `CLAUDE.md`: noll
efterlevnadsvinst. Formen behålls däremot för **fakta** (beslut 1).

**D — `~/.claude/rules/code-roll.md`.** Förkastat som huvudväg men noterat som
fallback: laddas ovillkorligt i varje projekt, men ligger i samma viktklass som
`CLAUDE.md`. Om filformen ändå önskas gäller ≤ 40 rader, imperativ, och som
**ersättning** för motsvarande konstitutionsrader — aldrig som dubblett.

**E — Behåll som är.** Förkastat: 34 % av regelmassan levereras aldrig, och den
osynliga filen bär 33 av systemets 65 tvingande regler.

## Konsekvenser

Regler hamnar i det lager som faktiskt bär dem. Konstitutionen kommer under
leverantörens 200-radersriktvärde för första gången. Tre tvingande regler blir
omöjliga att bryta i stället för lätta att glömma, och det som var prosa om datum blir
ett faktum i kontexten.

Kostnaden: output stylen betalar systemprompt-tokens i varje session — därav
radbudgeten 40–60. Output styles gäller dessutom **bara huvudtråden**; subagenter kör
egen systemprompt, så agentsidans disciplin måste bäras av agentdefinitioner i
`.claude/agents/`, inte av pluginet (*"For security reasons, `hooks`, `mcpServers`, and
`permissionMode` are not supported for plugin-shipped agents"*).

Leveransen spänner över båda repona: ADR + research + tråd i spoken, output style,
hooks, konstitution och `SYSTEMET.md` i hubben; separata commits per repo.

## Ärlighet om underlaget

**Precedent-rymden för dokumentklassen är belagd men formen saknar precedent.** Nio
undersökta uppsättningar bär ett agent-processdokument; fem anropar det i ögonblicket,
tre lägger det i systemprompten, en har alltid-på-filer med konventioner som innehåll.
**Noll** har den avvecklade formen.

**Precedensen för `git add -A`-förbudet är tom.** Ingen branschaktör förbjuder det.
Spärren är vår egen, av ett repo-specifikt skäl: `Bash(git add:*)` ligger i vår
allow-lista, så permission-prompten som annars fångat ett svep är avstängd.

**Det kunde inte beläggas att ett roll-/processdokument alls förbättrar beteende** —
vilket gäller även den rekommendation som ledde hit. Den enda kontrollerade mätningen
av repo-kontextfilers effekt finner noll förbättring av lösningsgrad och +20 %
inferenskostnad. Faktorstudien som finner noll effekt av filstorlek står också kvar
oemotsagd. Valet av output style framför fil vilar på lagerargument och förstapartens
uttalade hemvist — **inte på mätt efterlevnad**.

## Uppföljning

Skiljedomaren är mätning, inte resonemang. Två grindar:

1. **`InstructionsLoaded`-hooken** (levererad 2026-07-27) loggar vad som faktiskt når
   varje session. Första kontrollen efter denna ADR: står de förväntade filerna i
   `~/.claude/logs/instructions-loaded.jsonl`?
2. **Beteendemätning.** Tre representativa uppgifter körda med och utan output style,
   med mätbart utfall: levererades transparens-rapporten i rätt form, stannade agenten
   vid divergens? Utan den mätningen är valet mellan output style, rules och prosa
   fortfarande en smaksak flyttad till ett bättre lager.
