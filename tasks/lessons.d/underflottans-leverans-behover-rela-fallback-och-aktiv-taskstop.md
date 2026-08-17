# En underflotta behöver relä-fallback åt föräldern och aktiv `TaskStop` på den som redan levererat

**En agent som startar egna underagenter är ingen durabel förälder — når
underagentens leverans inte hela vägen upp finns ingen mekanism som
återförsöker. Två former som mättes rädda arbetet: (1) relä-fallback, där
orkestreraren själv hämtar hem en underflottas resultat när mellanledet
tappar det, och (2) `TaskStop` på en agent som ÄR leverans-klar men fortsätter
snurra — en förvirrad agent med färdigt arbete stannar inte av sig själv.**
`[UNIVERSAL]`

Instans (S102, 2026-08-16): 40-listans forensik
(`docs/research/40-listan-proveniens-relevans-2026-08-16.md`, PR **#1436**,
`59795b35`) kördes som underflotta. Grupp B:s resultat räddades via
relä-fallback, och huvudagenten — förvirrad men med färdig leverans — stoppades
med `TaskStop`. Bokfört i sessionsdokets Del 14 och buret som carry-kandidat
genom tre pauser.

**Det generella:** samma kontrakt som `ADR-096` slår fast för en enskild
subagent gäller ett helt led djupare. Väntan ägs av den durabla parten; ett
mellanled som självt är en Activity kan inte äga sin underflottas väntan. Den
som orkestrerar en underflotta måste därför ha en egen väg att hämta hem
resultatet, och ett aktivt sätt att avsluta en agent vars arbete redan är i
hamn.
