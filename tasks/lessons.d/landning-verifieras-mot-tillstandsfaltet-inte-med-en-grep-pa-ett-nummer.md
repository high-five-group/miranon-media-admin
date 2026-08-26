# Landning verifieras mot TILLSTÅNDSFÄLTET — en grep på ett PR-nummer träffar inuti SHA:n, datum och räkneverk

**`git log | grep -c "<nummer>"` är inget landningsbevis. Ett fyrsiffrigt
PR-nummer förekommer som delsträng i 40-teckens SHA:n, i datum och i
sifferkolumner, så sökningen ger träff utan att PR:en landat — och en träff
läses som ja. Landning verifieras mot det auktoritativa tillståndsfältet
(`gh pr view --json state,mergedAt`) PLUS commiten i `origin/main`, aldrig med
en textsökning på ett nummer.**
`[UNIVERSAL]`

Instans (S108, 2026-08-24, Del 18 § H punkt 1): orkestreraren rapporterade
`#1900` som landad medan den stod köad. Kontrollen var
`git log | grep -c "1900"`, som matchade ett SHA-fragment. Marcus fick ett
klartecken som inte höll; rättat i samma pass.

**Det generella:** felriktningen är det farliga. En textsökning på en kort
numerisk token har hög falsk-POSITIV-benägenhet, och falska positiver i en
landningskontroll är den enda riktning som inte upptäcker sig själv — ett
falskt "nej" leder till en extra kontroll, ett falskt "ja" leder vidare in i
nästa beslut. Klassen är redan bokförd en gång i huset (`[[L336]]`: en vakts
utdata är en signal, aldrig facit — verifiera mot `gh pr view --json
state,mergedAt`); den här instansen lägger till att INSTRUMENTET kan vara fel
även när ingen vakt är inblandad. Regeln generaliserar bortom PR:er: sök
aldrig efter en IDENTITET med delsträngsmatchning när ett fält bär den exakt.
