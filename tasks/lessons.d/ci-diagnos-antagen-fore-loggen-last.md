# En CI-diagnos som ställs före loggen läses pekar reflexmässigt på det egna arbetet

**Den första hypotesen vid ett rött jobb är nästan alltid "det är något jag just
ändrade". Loggen är den enda källan som kan avgöra det — och den kostar en
tool-call.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-27, PR #273):** `Docs link check` föll och jag antog kort
att mitt nya innehåll var orsaken. Loggen sa något annat: **`0 Errors,
1 Timeout`** på en `cs.umd.edu`-PDF i `hallplats-modellen`-passet — en
**förbefintlig fil PR:en inte rör**. En timeout ger exit 2. Körningen därefter gav
`Docs link check: success`, alltså transient.

Hade hypotesen fått stå hade fel sak åtgärdats: mitt innehåll hade granskats,
kanske ändrats, och den verkliga orsaken — att en extern akademisk server styr
vår leveranstakt — hade förblivit osedd. Fyndet gav i stället länkgrindens
**tredje empiriska instans samma dag**, alla med samma form: extern yta fäller en
PR som inte rör den.

**Motmedlet:** läs loggen **före** första hypotesen, inte som verifiering av den.
Och klassa fyndet — tysta det inte. Add-only-policyn i `.lycheeignore` kräver
bevisad flakiness av just det skälet: en tystad grind ser grön ut utan att vara
det.
