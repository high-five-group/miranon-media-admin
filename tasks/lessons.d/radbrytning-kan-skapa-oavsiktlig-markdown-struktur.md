# En radbrytning i löptext kan skapa markdown-struktur du inte menade

**Markdown tolkar `#`, `+`, `-`, `>` och siffra-punkt strukturellt när de står
FÖRST på en rad. En radbrytning som råkar placera ett sådant tecken i
radbörjan förvandlar löptext till rubrik eller lista — och grinden fäller på
en rad du upplevde som en mening.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-27) — tre instanser samma dag, i tre olika filer:**

1. `todo.md` — `#273 mergat …` bröts så att `#273` hamnade först ⇒
   **MD018/no-missing-space-atx**, läst som ATX-rubrik.
2. `s91-restlistan.md` — samma sak, samma PR-nummer, samma regel. Jag hade
   redan sett felet en gång och gjorde om det två timmar senare.
3. `session-91.md` — `~60 lokala\n+ 109 fjärrgrenar` ⇒ **MD004/ul-style** och
   **MD032/blanks-around-lists**, läst som listpunkt.

Klassen är lömsk av två skäl. **Källtexten ser rätt ut** — meningen är
grammatiskt hel och tecknet är korrekt i sitt sammanhang. Och **felet är
positionsberoende**: samma mening med annan radlängd är grön, vilket gör att
det uppstår vid till synes ovidkommande redigeringar.

**Motmedlet är inte att undvika tecknen** utan att flytta dem från radbörjan:
bryt raden på annat ställe, eller skriv ut ordet — "PR 273" i stället för
`#273`, "cirka 60 lokala och 109 fjärrgrenar" i stället för `~60 lokala` +
radbrytning + `+ 109`. Båda formerna läser dessutom bättre.

**Skärpningen mot [[verifiera-med-cis-exakta-kommando-inte-svagare-lokal-variant]]:**
detta är en klass där lokal grind och CI ger samma svar — problemet är inte
verifieringens form utan att man inte kör den alls före commit på prosa-ändringar,
eftersom prosa "inte kan gå sönder". Den känslan är fel: markdown ÄR kod.
