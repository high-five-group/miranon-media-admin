# `git log -N -- <path>` svarar på en annan fråga än den man tror — och svaret ser rimligt ut

**`git log -200 -- <sökväg>` betyder "de senaste 200 commits SOM RÖRDE sökvägen",
inte "av de senaste 200 commits, hur många rörde den". Skillnaden är osynlig i
utdatan: båda ger ett tal, och det felaktiga talet är alltid för högt. Vill man
mäta hur ofta en sökväg rörs måste populationen fixeras först, och varje commit
prövas mot den.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-29):** en mätning av hur ofta prejudikat-filerna skrivs
gav först `docs/decisions/ 80 %` och `backlog/tasks/ 100 %`. Talen var orimliga
men inte uppenbart fel — 100 % såg ut som "varje commit rör kort", vilket nästan
stämmer i ett kort-drivet repo.

Rätt form gav `2,5 %`, `4,0 %` och `3,0 %`. Alltså **en trettiondel** av det
första talet på en axel.

**Rätt form:** hämta populationen en gång
(`git log --no-merges -n 200 --format=@@%H --name-only`), gruppera per commit och
räkna hur många av dem som matchar. Det är en pass, inte N frågor.

**Varför det spelade roll:** talet skulle avgöra om en grind blev `deny`, `ask`
eller ingenting. Med det felaktiga talet hade slutsatsen blivit "för brusigt att
grinda" på en yta som i själva verket är kalibrerad.

Besläktad: [[tva-matningar-far-inte-multipliceras-utan-skarning]] ·
[[harled-ur-kallan-skriv-aldrig-av-kortets-tal]]
