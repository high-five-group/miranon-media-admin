# En moträttelse måste mäta samma sak som påståendet

**En rättelse bär auktoriteten hos en kontroll — därför är en moträttelse som
mäter fel sak värre än felet den rättar. Innan du skickar en rättelse: skriv ut
vad påståendet faktiskt hävdar, och kontrollera att din mätnings ENHET är samma
enhet.** `[UNIVERSAL]`

Två instanser mätta i **en och samma session** (S111, 2026-08-22), båda gånger
av den som rättade — inte av den som blev rättad.

**Instans 1 — grillningen (Del 2 § A).** Kortet `TASK-292` påstod att
personlistan bar en inline initialcirkel på `PersonsList.tsx:582`. Jag "rättade"
det med en grep som gav *"noll `rounded-full`"* och drog slutsatsen att kortet
hade fel. Grepen var trasig. Cirkeln fanns — på rad `1060`. Kortets **radnummer**
var föråldrat; dess **sakuppgift** höll. Jag rättade rätt sak på fel grund och
hade nästan rivit en korrekt uppgift.

**Instans 2 — resumen, samma session.** Som orkestrerare mätte jag
`grep -rln "InitialAvatar" src/` → sju filer, och skickade till bygg-agenten att
`TASK-299.1` AC #2:s *"Hems två konsumenter"* var mätt ofullständig. Agenten
mätte i stället **importraderna** och fann att fyra av de sju bara matchade på
NAMNET: `dev/hem-prototyp/`-filerna importerar en egen, separat komponent ur sin
lokala `./ui` — annan signatur, egen `initialer()`-kopia, eget
throwaway-docblock. Kortet hade rätt. Det fanns två konsumenter.

## Vad som skiljer de två mätningarna

`grep -rln "InitialAvatar" src/` besvarar *"i vilka filer förekommer den här
strängen"*. Påståendet handlade om *"vilka filer beror på den här symbolen"*.
Det är två olika frågor, och den första kan inte falsifiera ett svar på den
andra. Samma fel i instans 1: `rounded-full` som sökterm besvarar inte *"finns
en initialcirkel"* när cirkeln kan byggas av andra klasser.

## Den operativa regeln

1. **Formulera påståendets enhet innan du mäter.** Beroende? Förekomst?
   Beteende? Radnummer? En rättelse som byter enhet på vägen är ogiltig oavsett
   hur ren dess utdata ser ut.
2. **Föredra den mätning som skulle FALLA om du hade fel.** Agenten körde
   `npm run typecheck` (`tsc -b`, äkta över project references) **efter** att
   filen redan var raderad — exit 0 bevisade frånvaron av beroenden på ett sätt
   ingen grep kan. En mätning som bara producerar en lista bekräftar; en mätning
   som kan falla prövar. Välj den senare när den finns.
3. **Skilj radnummer från sakuppgift.** Ett föråldrat radnummer i ett kort är
   drift, inte ett faktafel. Riv aldrig sakuppgiften på radnumrets grund.

## Varför den är [UNIVERSAL]

Den gäller varje yta där en part granskar en annans faktapåstående — agent mot
kort, orkestrerare mot agent, människa mot dokument. Instans 2 är dessutom
belägg för att `ADR-086`:s riktning håller **i båda riktningarna**: mottagaren
prövade avsändarens premiss, och avsändaren var orkestreraren. Ett uppdrag från
den som styr passet är inte immunt mot mätning — det är exakt lika mycket en
hypotes som kortet det rättar.
