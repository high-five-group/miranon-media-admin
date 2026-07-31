# En self-test i CI är inte grinden i CI

**"Inkopplad" betyder tre olika saker, och att ett av dem stämmer läses som att
alla gör det.** En grind kan (a) ingå i det lokala samlingskommandot, (b) ha sin
self-test körd i CI, och (c) själv köras som grind i CI. Bara (c) skyddar repot.
`[UNIVERSAL]`

**Empiri (S91, TASK-98, 2026-07-31):** `ADR-083` byggde
`check-permissions-claims.sh` mot prosa som påstår sig vara mekanism. ADR:ns egen
text var korrekt — den skrev att grinden var *"inkopplad som tionde kontroll i
`check:docs`"* och att *"dess self-test körs i `ci.yml`"*, alltså (a) och (b).
`check-docs.sh` räknade däremot upp grinden under rubriken *"ci.yml lint-jobbet
(kör alltid)"*, alltså (c). Mätt: de fem syskongrindarna kördes 1 gång var i
`ci.yml`, denna 0. Grinden mot falska mekanism-påståenden var själv ett falskt
mekanism-påstående i tre månader — fångat först när `TASK-85`:s agent räknade
förekomster i stället för att läsa.

**Varför formen är svår att se:** varje enskild mening är sann. Self-testen
*körs* i CI, och den nämner grindens namn i workflow-filen — så en `grep` på
grindnamnet i `.github/workflows/` ger träff. Läsaren ser träffen och slutar
leta. Skillnaden mot det närliggande fragmentet
`valideringsverktyg-som-inte-kors-ar-franvarande.md` är att verktyget här
*körs* — men på fel sätt, och det felet ser ut som rätt.

**Motmedlet är att räkna anropet, inte namnet.** `grep -c 'bash scripts/<grind>.sh'`
mot workflow-filen skiljer grinden från dess self-test, eftersom testet heter
`test-<grind>.sh`. Ett omnämnande i en kommentar eller ett shellcheck-scope är
inte en körning. Samma disciplin som ADR-039 § lesson→grind kräver ett steg
tidigare: verifiera att grinden avfyras innan du verifierar att den fäller.
