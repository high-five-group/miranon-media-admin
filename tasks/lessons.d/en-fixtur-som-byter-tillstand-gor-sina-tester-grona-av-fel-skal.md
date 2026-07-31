# En fixtur som byter tillstånd gör sina egna tester gröna av fel skäl [UNIVERSAL]

**När testdatan får en ny egenskap som kortsluter kodvägen, slutar testerna som
använder den att pröva det de påstår — utan att bli röda. De blir gröna på en
genväg, och grönt utan rödhet ser exakt likadant ut som grönt med den.**

**Empiri (S91, 2026-07-31, `TASK-101`):** legacy-registret i
`scripts/seed-review-fixture.mjs` fick ett `stadad`-fält som ger en avslutad post
en tom raderingsplan per konstruktion. Båda registerposterna märktes som
avslutade i samma ändring — och de var precis de två posterna hela `DEL B`-sviten
använder som indata.

Fem befintliga tester prövade registrets bärande ankare mot dem, bland annat det
som kortet som byggde registret kallade *"registrets enskilt viktigaste guard"*:
att ett verkligt `Skövde`-event skyddas av record-ID-ankaret, eftersom `Skövde`
är ett riktigt ortsnamn. Efter ändringen var den planen tom — men nu för att
posten var avslutad, inte för att ankaret höll. Testet var grönt. Assertionen
`assert.deepEqual(plan.events, [])` var uppfylld. Ankaret prövades inte längre
alls, och hade det varit trasigt hade ingenting sagt ifrån.

Åtgärden var en `somAktiv(post)`-hjälpare som strippar det nya fältet, så
ankar-testerna kör mot den form de faktiskt beskriver. **Att den var nödvändig
och inte kosmetisk är mätt, inte antaget:** en mutation som gjorde `somAktiv` till
identitetsfunktionen fällde 8 tester — däribland de två ankar-testerna. Utan
mutationen hade omskrivningen sett ut som en stilfråga.

**Varför den vanliga vaksamheten inte räcker:** en ändring som gör tester RÖDA
anmäler sig själv. Denna klass gör motsatsen — den tar bort täckning och lämnar
sviten grön, så den passerar varje grind som mäter rödhet. Antalet tester är
oförändrat, körningen är grön, diffen ser ut som en ren utökning.

**Motmedlet:** när delad testdata får en ny egenskap som *kortsluter* en kodväg
— ett tillstånd, en flagga, ett tidigt returvillkor — inventera varje test som
använder den datan och fråga per test: *prövar det fortfarande sin egen orsak,
eller är det grönt på genvägen?* Mekaniskt svar: mutera bort genvägen och kräv
att de fäller. Fäller de inte, mätte de redan ingenting.

**Släkting, andra riktningen:** *En grind som inte prövar orsaken tar emot fel
bevis* — den handlar om fällningar med fel orsak, denna om godkännanden med fel
orsak. Samma grundfråga (*kom utfallet från rätt mekanism?*), spegelvänd.
