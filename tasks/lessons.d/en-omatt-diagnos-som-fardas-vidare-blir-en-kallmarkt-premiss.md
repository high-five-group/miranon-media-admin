# En omätt diagnos som färdas vidare blir en källmärkt premiss

En bygg-agent fällde ett test lokalt och klassade orsaken som en CORS-/portartefakt.
Rimligt, men **omätt**. Jag förde vidare klassningen till nästa uppdrag som en
källmärkt premiss — komplett med radnummer.

Nästa agent körde på rätt port, föll ändå, och mätte då den verkliga orsaken:
warmup-gaten (`ADR-112`), en helt annan mekanism.

**Felklassen:** en hypotes som passerar genom ett uppdrag får källmärkningens
auktoritet utan att ha förtjänat den. Mottagaren behandlar den som belagd,
eftersom formen säger att den är det.

**Regeln:** märk vidarefört material med dess faktiska evidensgrad, inte med
den grad det ärvde av att stå i en rapport. "Föregående agent klassade detta
som X, **ej mätt**" är en mening som kostar tre ord och räddar ett arbetspass.

Samma dag falsifierades två av mina egna källmärkta premisser av agenter som
prövade dem: safe zone-marginalen (0,912 hörde till en förkastad padding) och
att A11y-felen såg olika ut natt till natt (de gjorde inte det).

Att uppdragen bad agenterna PRÖVA premisserna, inte lyda dem, var enda skälet
att felen fångades.

Instans: S107 2026-08-20, `T150`.
