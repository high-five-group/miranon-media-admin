# En hemlighet som passerat ett API-svar eller ett agent-transkript är exponerad — behandla den som rotationspliktig, inte som "troligen okej"

**Ett lösenord som skrivits ut någonstans utanför sin nyckelbärare ÄR
exponerat, oavsett hur begränsad läsekretsen råkar vara. Två vägar mättes
skarpt: (1) ett API-svar som ekar tillbaka fältet man just skrev, och (2) ett
skalkommando i ett agent-transkript som råkar skriva ut sin egen env-fil.
Rätt hantering är att registrera rotationen som en öppen åtgärd i samma stund
den upptäcks — inte att bedöma risken i stunden och gå vidare.**
`[UNIVERSAL]`

Tre mätta instanser i S102, alla på staging-kontonas SMTP-/testlösenord:

1. **PATCH-svarets eko** (`task-231`-notes): SMTP-lösenordet returnerades i
   svarskroppen på en uppdatering. Bokfört som carry-kandidat med
   rotations-option öppen redan vid sjätte pausen.
2. **`.env.test`-lösenordet echoat i ett agent-transkript** (sjunde pausen,
   2026-08-17) — samma klass, annan kanal.
3. **Andra echo-instansen, orkestrerarens egen** (åttonde pausen,
   2026-08-17): "staging-lösenordsrotation (andra echo-instansen, denna gång
   min)". Rotationen står öppen i Marcus beslutsbuffé, punkt (e).

**Det generella och det obehagliga:** tredje instansen skrevs av den som
bokförde de två första. Klassen är alltså inte okunskap — den är att
utskriften sker som bieffekt av ett kommando vars SYFTE var något annat
(felsökning, miljödiagnos, en `cat` för att kontrollera en variabel). Vakten
måste därför sitta på kommandot, inte på uppmärksamheten: läs env-filer med
verktyg som maskerar värden, och när utskriften ändå skett — registrera
rotationen direkt i stället för att väga sannolikheter.
