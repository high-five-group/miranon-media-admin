# Flera aktörer i samma arbetsträd kräver rutin, inte uppmärksamhet [UNIVERSAL]

**När en orkestrerare och en subagent delar arbetsträd och PR-kö uppstår en
felklass som inte är kunskapsbrist: rätt sak görs vid fel tidpunkt, eller på fel
gren. Den löses av en rutin som gör felet omöjligt — aldrig av att försöka minnas
bättre i stunden.**

**Empiri (S91, 2026-07-28):** samma orkestrerare gjorde två fel av samma klass
inom två timmar, med lärdomen för det ena redan nedskriven sedan S81.

1. **Kort skapat på agentens gren.** Ett backlog-kort skapades medan en subagent
   arbetade i huvudkatalogen — alltså på DERAS uppcheckade gren. Hade agenten
   kört `git add backlog/tasks/` för sitt eget kort hade det främmande kortet
   följt med in i deras PR och brutit deras DoD *"inga orelaterade filer i
   diffen"*.
2. **Två PR:er som köade mot varandra.** En docs-PR landades medan en tyngre PR
   låg i luften. Repot kör `strict` required checks, så den senare hamnade i
   `BEHIND` och kunde inte auto-mergas trots grön CI och armerad auto-merge.
   Detta är `L328`:s BEHIND-svält — redan dokumenterad, ändå upprepad.

**Att lärdomen fanns nedskriven hjälpte inte**, och det är poängen. Båda felen
uppstod i ögonblick där uppmärksamheten låg på arbetets innehåll, inte på var
det landade. Den sortens fel går inte att läsa sig ur.

**Rutinen som gör dem omöjliga:**

- **Landa ur egen worktree så länge en agent arbetar i huvudkatalogen.**
  `git worktree add -b <gren> <sökväg> origin/main` kostar sekunder och gör
  branch-kollision strukturellt omöjlig. Städa med `git worktree remove --force`.
- **Armera en PR i taget.** Ligger flera i kön: låt den tyngre landa först, eller
  kör `gh pr update-branch` på nästa FÖRE armering i stället för att laga
  `BEHIND` efteråt.
- **`git status --short` före varje `git add`**, och ta bara egna sökvägar. Gäller
  även den som skrev instruktionen om path-scopad add till någon annan.

**Bikostnad värd att känna till:** en CI-vakt som startats mot en SHA blir
felaktig i samma stund grenen uppdateras. Stoppa den och starta om mot den nya
SHA:n — annars rapporterar den om en commit som inte längre är HEAD, vilket
läser som ett svar på en fråga ingen längre ställer.
