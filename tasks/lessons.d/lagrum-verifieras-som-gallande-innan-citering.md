# Ett lagrum verifieras som GÄLLANDE innan det citeras — en upphävd lag ser likadan ut på lagen.nu

**[UNIVERSAL] Ett research-pass citerade "kassaregisterlagen (2007:592) 3 §"
ordagrant ur lagen.nu som stöd för ett produktbeslut — lagen är upphävd
sedan 2012, reglerna bor i skatteförfarandelagen (2011:1244) 39 kap.
4–5 §§.** Mätt 2026-08-30 (S113 resume 4, research-passet om kvitton).
Substansen råkade hålla (undantaget för distansavtal finns kvar i SFL
39 kap. 5 § 1 st 4 p, i sak oförändrat) men citeringen var fel, och ett
beslutsunderlag som pekar på en upphävd lag faller vid första
juristkontakt. lagen.nu visar upphävda författningar med samma layout som
gällande; markören är rubriken "Upphäver"/"Upphävd av" på sidan, och den
syns inte i ett citat. Regel: före ett lagrum citeras (a) slå upp om
SFS-numret är upphävt och vilken lag som ersatte det, (b) hämta den
gällande paragrafen verbatim, (c) bokför båda — det gamla numret som
historik, det nya som källa. Praktiskt: lagtext-sidor är megabyte-stora och
WebFetch trunkerar tyst ("hittar inte ordet") — `curl` + lokal
textextraktion (`grep`/Python) mot den exakta strängen är vägen, samma
form som fragmentet om WebFetch-citat.
