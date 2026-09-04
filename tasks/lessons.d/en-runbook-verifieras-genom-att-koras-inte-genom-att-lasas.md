# En runbook verifieras genom att köras (mot en isolerad kopia), aldrig genom att läsas

**[UNIVERSAL] Tre granskningsrundor i rad fann tre olika fel i samma
kommandoföljd — fel flagga, gammal flagga efter en split, saknad
guard-variabel på läs-stegen — och alla tre hade träffat Marcus i hans
prod-terminal.** Mätt 2026-08-29 (S113, `TASK-338.6`/`#2097`). Runbooken
skrevs och lästes av bygg-agenten; felen fångades först när granskaren
KÖRDE varje rad mot en isolerad kopia av skriptet med injicerad fetch.
Regel: en kommandoföljd som en människa ska klistra in verifieras genom att
exekveras rad för rad i en hermetisk kopia (guard-vägran räknas som utfall),
och uppdras med den formen från början. Bieffekt att bokföra: en granskare
råkade göra ett skarpt 401-anrop mot prod-endpointen med dummy-token — ingen
skada, men "kör aldrig skriptet mot någon bas" betyder injicerad fetch,
inte ogiltig nyckel.
