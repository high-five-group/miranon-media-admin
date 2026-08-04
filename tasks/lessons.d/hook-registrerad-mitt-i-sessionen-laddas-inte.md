# Fragment — en hook som registreras mitt i en session kan inte skarpbevisas i den

**[UNIVERSAL]**

**Fångad:** 2026-08-04, Session 97, orkestreraren, under `T119` (a).

**Vad som hände:** katalogägarskaps-hooken byggdes, testsviten gick 23/23, och
skriptet gav korrekt `permissionDecision: "ask"` när det kördes manuellt mot
detta repo med en planterad ägarlapp. Sedan registrerades den i
`.claude/settings.json` och skulle skarpbevisas — och **fällde ingenting**. Två
provokationer gick rakt igenom.

**Vad som skilde hypotes från slutsats:** en differentialmätning, inte en
gissning. Tre mätpunkter i samma pass:

| Mätning | Utfall |
|---|---|
| ny hook, körd manuellt med identisk hook-JSON | fäller korrekt |
| ny hook, via harnesset (två provokationer) | fäller inte |
| befintlig hook (`deny-resend-send.sh`), via harnesset, samtidigt | **fäller** |

Den tredje raden är den som gör mätningen till ett svar: hooksystemet KÖR. Det
är registreringen som inte tagits i bruk, inte mekanismen som är trasig.

**Rotorsaken, belagd mot förstapartskällan:** `code.claude.com/docs/en/hooks-guide.md`
har ett dedikerat felsökningsavsnitt (§ `/hooks` shows no hooks configured):
*"File edits are normally picked up automatically. If they haven't appeared
after a few seconds, the file watcher may have missed the change: **restart your
session to force a reload**."* Samma dokument lovar på annan plats att ändringar
*"are normally picked up automatically by the file watcher"* — det är den
meningen som leder fel om man läser den ensam.

Community-rapporterna är starkare än dokumentationens "may": issue
[#22679](https://github.com/anthropics/claude-code/issues/22679) heter *"Hook
settings are cached and changes don't take effect until session restart"* och
beskriver exakt samma reproduktionsmönster (ny/ändrad registrering ignoreras
medan befintliga hooks fortsätter fyra). Både den och
[#55867](https://github.com/anthropics/claude-code/issues/55867) — en feature-
request om just mid-session reload — är stängda som dubbletter, och
originalärendet gick inte att spåra.

**Två hypoteser som mätningen AVFÄRDADE, och som annars hade kostat tid:**

- *Ett tyst godkännandesteg blockerar nya hooks.* Nej — den enda trust-grinden i
  dokumentationen gäller subagent-frontmatter-hooks, inte `settings.json`.
- *Det finns ett reload-kommando.* Nej — `/reload-hooks` existerar inte, och
  `/hooks`-menyn är uttryckligen read-only (*"The menu is read-only: to add,
  modify, or remove hooks, edit the settings JSON directly"*). Att `#55867`
  fortfarande efterfrågar funktionen är i sig beviset att den inte finns.

**Lärdomen:** en hook är inte bevisad förrän den har fällt via harnesset, och
det kan **per konstruktion inte ske i sessionen som byggde den**. Planera in det
från början i stället för att upptäcka det vid beviset:

1. Bygg hooken och bevisa LOGIKEN tvåsidigt med en testsvit + manuell körning
   mot verkligt tillstånd. Det är fullt möjligt i byggsessionen.
2. Bokför skarpbeviset som en **öppen skuld i handoffen**, inte som gjort.
3. Betala skulden **först i nästa session**, som en av dess första handlingar.

Detta är samma strukturella klass som MCP-verktygsytan i samma session (S97
Del 2): ytan bestäms vid sessionsstart och uppdateras inte retroaktivt efter
auth. Två olika delsystem, samma form — konfiguration som läses en gång vid
start. Att känna igen klassen är värt mer än de två instanserna var för sig:
**fråga alltid "bestäms detta vid sessionsstart?" innan du planerar ett bevis
som förutsätter motsatsen.**

**Vad som INTE är belagt, och därför inte påstås:** om skillnaden mellan att
LÄGGA TILL en ny matcher och att ÄNDRA en befintlig spelar roll. Ingen källa —
varken dokumentationen eller de granskade ärendena — gör den distinktionen.
