# En partition som glömmer LÄSANDE agenter är ofullständig

**Läsning av en fil under ändring ger samma inkonsistens som en skrivkonflikt.
En partitionsdeklaration som bara listar skrivande resurser skyddar halva
problemet.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-27):** partitionerings-regeln formulerades kring
skrivande resurser — filer, grenar, nummerserier, portar, delade testmiljöer,
main. Luckan är att en agent som *läser* `lessons.md` eller `todo.md` mitt under
en annan agents skrivning bygger sitt arbete på ett tillstånd som aldrig
existerade som helhet.

Skrivkonflikten är dessutom den **snällare** av de två: den syns som en konflikt
eller ett rött jobb. Den inkonsistenta läsningen syns inte alls — agenten
levererar tryggt ett resultat grundat på en halv fil.

**Motmedlet är att deklarera partitionen över *åtkomst*, inte över mutation:**
vilka resurser en agent rör alls. Det gäller särskilt de stora ackumulerande
statusfilerna, som per konstruktion läses av alla och skrivs av många. Samma
grundproblem som [[git-commit-committar-hela-indexet]] i en annan skala —
tillståndet är bredare än den operation man tänker på.
