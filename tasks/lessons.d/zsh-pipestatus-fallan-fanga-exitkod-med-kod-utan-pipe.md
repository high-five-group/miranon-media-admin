# zsh-PIPESTATUS-fällan: arrayen heter `pipestatus` med gemener, `${PIPESTATUS[0]}` är tom

**[UNIVERSAL] I zsh heter den array som bär varje pipe-leds exitkod
`pipestatus`, med gemener, till skillnad från bash där `PIPESTATUS` med
versaler fungerar. Ett skript som läser `${PIPESTATUS[0]}` i zsh får en tom
sträng, inte kommandots exitkod, och en efterföljande jämförelse mot den
tomma strängen kan tolkas som att kommandot lyckades.** Mätt 2026-09-02
(S113 Del 16, `tasks/sessions/2026-08-29-session-113.md` rad 1756 till
1758): en befintlig grindvakt (L440-klassen, "läs exitkoden direkt, aldrig
via en pipe") fällde en gång på exakt detta, varefter formen `KOD=$?` utan
pipe användes i stället. Regel: fånga alltid en pipad kommandokedjas
exitkod med `KOD=$?` direkt efter kommandot, aldrig via
`PIPESTATUS`/`pipestatus`, om skriptet kan komma att köras i både bash och
zsh, eller skriv skriptet med en explicit shebang och testa mot den
faktiska interaktiva-skalets variant.
