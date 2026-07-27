# Ett valideringsverktyg som finns men inte körs är funktionellt frånvarande

**Samma utfall som en artefakt som aldrig levereras: noll. Ett verktyg räknas
först när något tvingar fram körningen.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-27):** `/to-prd`-skillens frontmatter parsade aldrig, och
skillen auto-upptäcktes därför **aldrig**. Verktyget som hade fångat det —
skill-valideringen — **fanns i repot** men kördes inte. Fyndet är T100:s klass i
miniatyr, med skärpningen att här saknades inte instrumentet, bara dess
avfyrning.

Skillnaden mot en ren lucka är att den här formen är **osynlig**: en inventering
av vilka verktyg som finns ser komplett ut, och ingen rapport är röd, eftersom
inget kördes. Frånvaron av rött läses som grönt.

**Motmedlet är mekanisering, inte påminnelse.** En grind i CI, en hook eller ett
steg i `check:docs` — något som avfyrar utan att någon minns det. Detta är samma
princip som ADR-039 § lesson→grind: *en grind är inte en grind förrän dess
fyrning fortlöpande verifieras.* Här gäller det verktyget före grinden.
