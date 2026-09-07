# Bang-prefixet ärver Bash-verktygets arbetskatalog — Marcus kommando kördes i orkestrerarens worktree

**[UNIVERSAL] Ett kommando Marcus skriver med `!`-prefixet körs i samma
shell-arbetskatalog som orkestrerarens senaste Bash-anrop lämnade — en
`cd` till en worktree i ett verktygsanrop flyttar alltså också Marcus
kommandon dit, tyst.** Mätt 2026-09-07 (S123 resume 1), två gånger: `bash
scripts/fas4-prod-deploy.sh --kontrollera <ref>` via `!` föll först på
"Arbetsträdet är smutsigt" (orkestrerarens worktree bar en ospårad temp-fil
och en ocommittad logg) och sedan på "Du står på grenen
'docs/s123-resume-1'. Prod-deploy sker från main." — båda gånger stod
huvudkatalogen på `main` och ren, men shellen stod i worktreen. Lösningen
var ett rent `cd <huvudkatalog>` i ett eget Bash-anrop innan Marcus bad
köra om. Regel: innan Marcus ska köra något via `!`, sätt shellens
arbetskatalog uttryckligen till den katalog kommandot ska köras i, och säg
vilken det är; ett skript som kontrollerar gren och renhet är den bästa
vakten mot felklassen, och deploy-skriptet hade båda.
