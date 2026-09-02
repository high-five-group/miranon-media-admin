# Prod-ref-låset fäller även en dok-skrivning vars text nämner refen

`scripts/deny-prod-ref.sh` matchar prod-referensens närvaro var som helst i
en Bash-kommandosträng, inklusive en ren dokumentations-skrivning vars text
råkar citera eller nämna refen, inte bara skarpa databas-/deploy-kommandon.
Mätt 2026-09-02 (S113 Del 16, `tasks/sessions/2026-08-29-session-113.md`
rad 1665 till 1667): fyndet gjorde att sessionsdoket medvetet skrev
prod-refen förkortad i stället för i fulltext, för att inte trigga låset
vid varje efterföljande dok-uppdatering i samma pass. Regel: skriv aldrig
en prod-projektrefs fulltext i sessionsdok eller annan löpande
dokumentation, förkorta den; fulltexten hör hemma i runbooken där låsets
avsikt (skarpa operationer) faktiskt gäller.
