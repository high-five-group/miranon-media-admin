# Verifiera mot den axel ändringen rör — inte mot den tomhet befintliga fixturer råkar ha

**[UNIVERSAL] En rättning som verifieras mot BEFINTLIGA fixturer prövar den
tomhet som råkar finnas i dem, inte den axel ändringen rör. Fyra gröna
fixturer bevisar ingenting om ett fält ingen av dem har tomt.**

Instansen (`T168`, S110, 2026-08-22): datum-axelns årsblindhet rättades
först med `REGEX_EXTRACT` i Airtable-formeln, verifierades mot de fyra
permanenta fixturerna — alla gröna — och landade. Mätt på befintlig
staging-data gav samma form `#ERROR!` på **varje rad med Event-länk och
tomt `Datum`**, eftersom ingen av de fyra fixturerna hade tomt `Datum`.
Rättningen revs samma dag och ersattes; en femte permanent fixtur
(`ZZ-TASK-284.1 Fixtur Fel år`) bär nu regressionsfallet.

Regeln: innan en ändring verifieras, fråga *vilken axel rör den* — och se
till att minst en fixtur bär det **ogynnsamma** värdet på just den axeln
(tomt, fel år, fel form). `TASK-293` ärver kravet uttryckligen (en
`Fixtur Plus` för `+`-klassen) så att nästa normaliseringsändring inte
upprepar felet.
