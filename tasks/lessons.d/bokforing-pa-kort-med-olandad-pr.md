# Fragment — bokföring på ett kort vars ändringar ligger olandade

**Fångad:** 2026-08-02, Session 96 (AFK-natten), orkestreraren.

**Vad som hände:** `TASK-126.2` stoppade i CI och PR #628 lämnades öppen med
agentens AC/DoD-bockningar ocommittade mot `main`. Orkestreraren skrev då en
parkerings-not på samma kortfil **på main**. Efter 27 landningar var PR #628
`DIRTY`, och den enda konfliktande filen var kortet — grenen bar bockningarna,
`main` bar noten.

**Lärdomen:** bokföring som skrivs till ett kort vars ändringar ligger
olandade i en öppen PR skapar garanterat en konflikt i exakt den filen. Båda
sidor kan vara rena tillägg och ändå kräva handpåläggning.

**Formen i stället:** lägg noten på ytor som INTE finns på grenen — ett eget
fyndkort, sessionsdokets Del, eller trådregistret. Kortets egen fil rörs först
när dess PR är landad eller stängd.

**Sekundärt:** varje ytterligare redigering av den konfliktande filen
fördjupar konflikten. Upptäcks det i efterhand är rätt drag att sluta röra
filen, inte att "rätta" i den.

**Kandidat för `[UNIVERSAL]`** — gäller varje repo med issue-substrat där kort
och kod landar i samma commit.
