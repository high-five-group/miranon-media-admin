# En stämpel-instruktion till Marcus skrivs aldrig utan att manifestet lästs först — `godkand` kan redan vara satt

**Att be Marcus stämpla ett facit är ett anspråk på hans tid. Anspråket måste
vila på en läsning av manifestet i samma stund instruktionen skrivs: är
`godkand` redan satt är stämpeln redan gjord, och begäran är ren friktion.
Läs `facit.json` → kontrollera `godkand` → skriv instruktionen först om
fältet är `null`.**

Instans (S102, 2026-08-17, QA 241.6): Marcus ombads stämpla svep-facitet i
onödan — `godkand` var satt sedan 241.1-låset (`10dff531`). Felet är öppet
bokfört som ORKESTRERAR-FEL på kortet, och kortet stängdes i PR **#1533**.

**Det generella:** varje instruktion som riktas mot Marcus bär en implicit
premiss om systemets tillstånd ("detta är ogjort"). Premissen är billig att
pröva och dyr att anta fel — precis den asymmetri `ADR-086` kodar för
uppdrag till agenter. Samma disciplin gäller åt andra hållet: orkestreraren
prövar sina egna premisser mot disk innan de blir en begäran uppåt.
