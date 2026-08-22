# Räkningen mot ett förväntat tal är instrumentet, inte bara grinden

**[UNIVERSAL] Ett kontrollsvep som räknar mot ett FÖRVÄNTAT tal fångar
exakt den post som var bokförd som olokaliserad. "5 mot väntat 4" är inte
ett larm att bocka av — det är en pekare till den femte raden.**

Instansen (`TASK-284.6` AC #2, S110 Del 10, 2026-08-22): prod-svepet efter
att `Eventmatchning` skapats gav 5 `Avviker`; Del 2:s svep hade gett 4
(3 väntar Lotta + 1 harmlös). Den femte var ID 197 med `Datum` =
`14–15+maj+2026` — URL-kodade mellanslag ur kalenderlänken — och därmed
**Event-18:s falska positiv**, öppen som "ej lokaliserad" sedan `284.1`:s
underlag och genom fyra pausblock. Ingen letade efter den; räkningen
pekade på den.

Två följder:

1. Skriv alltid ut det förväntade talet INNAN svepet körs, med härledning.
   Ett svep utan förväntan kan bara säga "N", aldrig "en för mycket".
2. Förklara varje avvikande post individuellt innan grinden bockas —
   `284.6` AC #2:s ordalydelse (*"känt och förklarat"*, *"oväntad mängd är
   ett STOPP"*) är rätt form. Här ledde förklaringen till ett datafynd, ett
   nytt kort (`TASK-293`) och en prod-kö som gick 5 → 3 innan vakten slogs
   på.

**Andra instansen lägger till en AXEL: förväntan har en RIKTNING** (S109,
2026-08-22). Efter Marcus stämpling av två facit-manifest rapporterade grinden
**24** ytor utan `referenser`. Talet skulle ha gått NED från 22 — `#1751` hade
just lagt in fälten. Avvikelsen var alltså inte en oväntad mängd utan ett tal
som rörde sig åt fel håll, och den passerade ändå obemärkt i första läsningen.
Orsaken: stämplingen hade gjorts mot en checkout tio commits efter
`origin/main`, och 24 var det gamla trädets tal.

Skriv därför ut både det förväntade talet och åt vilket håll det ska röra sig.
Ett svep vars förväntan saknar riktning kan bara jämföra storlek — och en siffra
som växt när den skulle krympa läses då som brus i stället för som det larm den
är.
