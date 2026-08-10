# Ett kvitto som själv härleder "aktuellt läge" ur en lokal ref dokumenterar var refen står — inte vad som granskades

**Ett verktyg som stämplar "aktuell main-SHA" i ett kvitto måste härleda den ur
en FÄRSK källa (origin efter fetch) eller fälla vid divergens. En lokal
`main`-ref i en orkestrerar-checkout står stilla i dagar — och kvittot ser
exakt lika giltigt ut med fel träd som med rätt.** `[UNIVERSAL]`

Mätt 2026-08-10 (S93 stängningen). Marcus första omgodkännande-stämpel för
`s93-hallplats-prototyp` bokförde `sha: f7360100` — ett träd FÖRE
15-strecks-svepet — medan granskningen skedde mot dev-servern som serverade
`e25efd05`-trädet (post-svep). `resolveMainSha` i `scripts/facit-godkann.mjs`
läser lokala `main`-refen, som senast fast-forwardats kvällen innan, före
svepets merge. Kvittots hela poäng är att dokumentera VAD som godkändes
(ADR-104 beslut 4: *"SHA dokumenterar"*) — och just det värdet blev fel, i
mekanismen som byggdes för dokumentations-integritet.

**Fångsten:** orkestreraren läste kvittots SHA mot merge-kronologin i stället
för att bara läsa ✅-raden — `f7360100` låg FÖRE `#1064`:s merge. Rättningen:
ref-synk (`git branch -f main origin/main`) + omstämpling via Marcus kanal
(`--ersatt`), båda stämplarna öppet bokförda. Mekanism-fixen: `task-175`.

**Det generella:** varje verktyg som bakar in "nuläget" i en durabel artefakt
(SHA, version, timestamp härledd ur en ref) måste antingen hämta det färskt
från källan eller verifiera att den lokala projektionen inte divergerar. En
lyckad utskrift med fel innehåll är farligare än ett fel — den konsumeras som
kvitto. Släkt med `[[L499]]` (grön grind mot föråldrat träd) — samma rotklass,
här i BOKFÖRINGS-ledet i stället för verifierings-ledet.
