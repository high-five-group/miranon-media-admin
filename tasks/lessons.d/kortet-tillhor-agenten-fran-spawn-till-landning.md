# Kortet tillhör agenten från spawn till landning

**Ett arbetskort är en delad fil med två skribenter: orkestreraren som
förbereder det och agenten som bockar av det. Ändrar båda efter att agenten
grenat blir det en merge-konflikt varje gång. Landa kortändringen FÖRE
spawn — eller rör inte kortet förrän agenten landat.** `[UNIVERSAL]`

Mätt 2026-08-22 (S111), och det intressanta är att regeln tillämpades korrekt
en gång och glömdes tre kort senare i **samma session**.

**Rätt, tidigt i passet:** en scope-ändring skulle bokföras medan `TASK-291`:s
agent arbetade. Jag skrev den på `TASK-303` i stället och noterade uttryckligen
skälet: *"på TASK-303, inte på 291, eftersom dess agent redigerar det kortet
just nu"*.

**Fel, en timme senare:** jag redigerade `TASK-299.7`, `299.8` och `299.9`
(beroende-omsättning + notes), landade dem i en PR, och spawnade tre agenter
mot samma kort. Agenterna hade redan grenat från en tidigare `main`. Första
PR:en (`#1840`) gick `DIRTY` på exakt den filen; de två andra var på väg mot
samma sak och fick förvarning.

## Varför det inte känns som en risk i stunden

Ändringarna rör **olika delar** av kortet — orkestreraren skriver
`Dependencies:` och en notes-post, agenten bockar av AC. Semantiskt kolliderar
de inte alls, och det är just därför konflikten känns orimlig. Men git ser en
fil, inte två sektioner, och backlog-CLI:t skriver om filen i sin helhet vid
varje `task edit`. Två skribenter i samma fil ger konflikt oavsett hur väl
avgränsade avsikterna är.

## Regeln, i den ordning den ska tänkas

1. **Ska kortet ändras? Gör det och LANDA det innan agenten spawnas.** En
   spawn mot ett kort som håller på att ändras är en konflikt du beställt.
2. **Är agenten redan igång? Rör inte kortet.** Skriv någon annanstans — ett
   relaterat kort, en tråd, sessionsdoket — och bokför på kortet när agenten
   landat.
3. **Blev det ändå konflikt: lös den via CLI:t, inte i en texteditor.** Ta
   main-versionen av filen och sätt om AC med `task edit --check-ac`.
   Handredigering under en rebase är det enklaste sättet att förstöra metadata
   som verktyget äger.

## Den generella formen

**Delat tillstånd behöver en ägare per tidsfönster, inte per fält.** Att två
parter skriver till olika fält i samma fil är inte "ingen konflikt" — det är
en konflikt som råkar vara lätt att lösa. Frågan vid varje spawn är: *vilka
filer kommer den här agenten att skriva i, och tänker jag röra någon av dem
under tiden?*
