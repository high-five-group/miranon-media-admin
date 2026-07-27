# En lesson-kandidat som bokförs som stikkord överlever pausen som ord, inte som innehåll

**Ett par ord i ett HANDOFF-block räcker för att minnas *att* något fanns, men
inte *vad* det var. Kandidaten ska skrivas som fragment när den uppstår — inte
listas för att skrivas senare.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-27, fjärde resumen):** PAUSLÄGE bokförde tre nya
lesson-kandidater som stikkord: *autofix förvärrar en falsk-positiv* · *husets
`>`-separerade blockquote-stapling* · *`.claude/**`-luckan*. Vid skörden kunde
den tredje beläggas fullt ur restlistan och `ci.yml`. **De två första kunde det
inte** — de fanns ingenstans annat än som dessa ord. Sessionsdokets Del-text,
commit-meddelandena och configdiffarna för dagen genomsöktes utan träff.

Det som gick förlorat är exakt den del som gör en lärdom användbar: empirin,
motmedlet och avgränsningen. Kvar blev en rubrik ingen kan handla på.

**Skärpningen mot [[ADR-081]]:** nummerspärren är borta, så kostnaden för att
skriva ett fragment direkt är nu **noll** — ingen behöver välja ett nummer, och
en katalogfil är en fullgod leverans. Argumentet "jag skriver ihop dem vid
skörden" var svagt redan när numren var låsta; efter ADR-081 finns det inte alls.

**Motmedlet:** skriv fragmentet i samma landning som arbetet som gav lärdomen.
En handoff får peka på fragment — den ska inte bära kandidater som ännu inte
finns i fil. Detta är kontinuitets-arkitekturens grundregel tillämpad på sig
själv: *filartefakter är enda sanningskällan.*
