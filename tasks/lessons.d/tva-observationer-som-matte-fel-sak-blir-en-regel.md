# Två observationer som mätte fel sak blir en regel utan att någon märker det

**Innan du generaliserar ur N observationer: fråga vad var och en faktiskt
mätte. Ett par avläsningar som råkar peka åt samma håll av olika skäl bär ingen
regel — och om verktyget har en egen dokumentation som besvarar frågan är det
den som ska läsas först, inte dina egna stickprov.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-30):** påståendet *"`autoMergeRequest` är alltid `null`
under en aktiv merge queue"* skrevs in i `CLAUDE.md` som en regel. Underlaget var
två avläsningar:

- **`#474`** lästes medan PR:en låg köad — fältet `null`.
- **`#473`** lästes **efter merge** — fältet `null`.

Den andra mätte ingenting relevant: fältet nollas post-merge oavsett hur
armeringen gick till. Ett stickprov och en icke-mätning blev en generell regel,
och det motsatta fallet söktes aldrig.

**Det motsatta fallet dök upp av sig självt, i värsta tänkbara form:** `#475` —
PR:en som **bar den felaktiga texten** — hade ett satt `autoMergeRequest` medan
dess checks kördes. Regeln motbevisades av sin egen leverans.

Svaret fanns dessutom i `gh pr merge --help` hela tiden:

> *"If required checks have not yet passed, auto-merge will be enabled. If
> required checks have passed, the pull request will be added to the merge
> queue."*

Två lägen, inte ett. Hjälptexten lästes efteråt, inte före.

**Varför en fel regel är dyrare än ingen regel:** utan regel läser nästa läsare
fältet och funderar. Med den felaktiga regeln lär hen sig att **ignorera ett
fält som i normalfallet är korrekt** — alltså att avfärda rätt signal.
Skadan skalar med hur auktoritativ filen är, och den här landade i den fil som
auto-laddas varje session.

**Formen:** innan en observation blir en regel — skriv ut vad varje enskild
avläsning mätte, och sök aktivt det fall som skulle falsifiera regeln. Hittas
inget sådant fall: säg att det inte söktes. Och för varje regel *om ett verktyg*:
läs verktygets egen dokumentation före, inte efter.

**Skärpningen mot närliggande:** detta är inte samma sak som en overifierad
gissning — varje enskild avläsning här var äkta och korrekt utförd. Felet låg i
att **slutsatsen sträckte sig längre än vad avläsningarna kunde bära**, vilket
är svårare att se just för att underlaget ser empiriskt ut.
