# Strukturella kontroller kan vara gröna medan ett människo-synligt fel består

**En kontroll som prövar STRUKTUR — kolumnantal, radform, fältkonsistens — säger
ingenting om ORDNING, och ordning är ofta det enda en läsare faktiskt använder.
Ett register kan vara formellt felfritt och ändå obrukbart.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-29):** trådregistret bar två omkastade rad-par — `T74`
före `T73`, `T79` före `T78`. Samtidigt var **samtliga** strukturella kontroller
gröna: pipe-antal per rad korrekt, ingen rad utan avslutande pipe, inga
tabellbrytande tomrader, `check-lifecycle.sh` grön på fält↔index-konsistensen.

Felet upptäcktes av **Marcus, vid läsning**. Registret läses i nummerordning —
det är hela dess bruk — så felet var omedelbart synligt för ett öga och osynligt
för varje maskin vi hade.

**Kontrollen som saknades var trivial:** ett svep som prövar att numret på varje
rad är större än föregående. Tre rader awk.

**Regeln:** när en artefakt har en BRUKSORDNING, pröva ordningen — inte bara
formen. Frågan att ställa om varje register är *"hur läses det här, och prövar
någon kontroll den egenskapen?"*

Besläktad: [[mekanisk-verifiering-fangar-eftertanke-fangar-inte]] — den beskriver
det omvända fallet, och tillsammans avgränsar de vad respektive mekanism duger
till. [[tre-samstammiga-kopior-ar-osynliga-for-lasning]] är den tredje sidan:
läsning missar det maskinen ser.
