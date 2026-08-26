# Ett DIRTY-larm ska bära konfliktens FIL-KLASS innan en kandidat-PR pekas ut

**Ett svep som larmar DIRTY (konflikt i kön eller på en gren) ska bära
VILKEN FILKLASS som konfliktar innan orkestreraren pekar ut en
kandidat-PR som orsak. Att peka ut en kandidat på enbart larmets
tidpunkt/närhet, utan att först läsa filklassen, ger en gissning som
kan träffa fel PR.**

Instans (S112, 2026-08-24, Paushistorik 1 § Lesson-KANDIDATER punkt 3):
en hypotes om att `#1915` var konflikt-orsaken visade sig vara fel PR
och fel filklass — bakläxa given av "paket-agenten" som faktiskt löste
konflikten. Rätt orsak var paketborttagningen (`#1921`, `@tanstack/react-table` +
`motion` bort) och filklassen `package.json`/`package-lock.json`; de
DIRTY-larmade posterna var Dependabot `#1487`/`#1826` (S112 Del 2 +
Paushistorik 1 § Öppna PR:er).

**Det generella:** ett level-triggered svep (se CLAUDE.md § Svep vid
varje väckning) berättar ATT något är fel, inte VAD. Att hoppa direkt
till "vilken PR" utan att först läsa "vilken FIL" byter en mekanisk
verifiering mot en gissning grundad i tidsmässig närhet — och
tidsmässig närhet är svagt bevis i en kö med flera samtidiga
landningar.
