# Sessionsstartens `limit: 120` på stora todo-filer slutar fungera tyst

`[UNIVERSAL]`

**`tasks/todo.md` gick inte längre att läsa med session-start-skillens
`limit: 120` (2026-09-18, S127): 32 891 tokens mot taket 25 000 — rad 7
(kadensraden) var ensam 24 952 tecken.** Skillens hårdkodade radgräns antar
implicit att 120 rader ryms inom tokentaket; en enda extremt lång rad
(en ackumulerande kadens-logg) bryter det antagandet utan felmeddelande —
läsningen ger bara ett trunkerat resultat som ser ut som "de första 120
raderna", inte som ett fel.

Varför `[UNIVERSAL]`: session-start-skillen körs i varje spoke oavsett
projekt, och antagandet "N rader ⇒ rimligt tokenantal" håller bara tills en
fil får en enda extremt lång rad. Alla spokes med en växande, aldrig
roterad logg-liknande fil (kadensrader, ackumulerande statusfält) är
exponerade.

Källa: `tasks/sessions/2026-09-18-session-127.md` Del 1, "Avvikelser mot
rutin, öppet bokförda".
