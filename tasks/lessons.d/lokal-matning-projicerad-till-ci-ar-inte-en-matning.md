# En lokal mätning projicerad till CI är inte en mätning [UNIVERSAL]

**Att ha mätt ena ledet ger inte rätt att kalla slutsatsen mätt. Ordet "mätt"
måste täcka det led som bär slutsatsen — annars är det en extrapolering med ett
starkare ord på sig, och den formuleringen gör siffran oantastlig för varje
läsare efteråt.**

**Empiri (S91, 2026-07-28, `TASK-60`):** ett nytt CI-steg skulle kostnadsbedömas.
Jobbets nuvarande längd mättes i CI över fem körningar — 1,2–1,4 min, korrekt.
Det nya stegets kostnad mättes **lokalt** till ~50 s och projicerades till CI.
Slutsatsen skrevs som *"kostnaden är MÄTT mot jobbets timeout-tak, inte
antagen"* — i PR, i kortets acceptanskriterium och i sessionsdoket.

Skarpt utfall: **289 s**, alltså 5,8× fel, och jobbet landade på 6,5 min mot ett
tak på 8. Marginalen var 1,5 min i stället för 5,8.

**Rotorsaken var en miljöskillnad som lokal körning per konstruktion inte kan
visa:** `retries: process.env.CI ? 2 : 0`. Lokalt körs varje test en gång; i CI
körs ett rött test tre gånger. Steget var ett självtest där rött är det
FÖRVÄNTADE utfallet för varje test — alltså 153 körningar i stället för 51, var
och en med video av en fällning som beställts med flit.

**Orsaken bands, den gissades inte:** samma skript kördes lokalt med `CI=1` och
tog 297 s mot CI:s 289 s. Det uteslöt runner-hastighet och pekade på retries.
Fixen (`--retries=0` + artefakter av i regimen) gav 297 s → 73 s i samma
uppställning.

**Varför det är svårfångat:** ingen grind kan fälla ett felaktigt "mätt". CI var
grön hela vägen — jobbet klarade sig på 1,5 minuters marginal. Felet syntes först
när jobbets faktiska **steg-tider** lästes efter mergen, i stället för att
grönt-läget togs som facit.

**Motmedlet, två delar:**

- **Kör med CI:s egna miljövariabler lokalt** (`CI=1`, samma flaggor) innan en
  CI-kostnad påstås. Det är billigt och hade fångat detta på första försöket.
- **Läs steg-tiderna efter första skarpa körningen** av allt nytt som läggs i en
  CI-kedja. Grönt jobb säger att taket höll, aldrig med hur mycket.
