# Ett nekat kommando körde INGENTING — omtaget måste upprepa hela kommandot, inte bara ledet efter det som fälldes

**När en PreToolUse-hook nekar ett sammansatt Bash-kommando körs inget av
leden — inte heller de som stod FÖRE det hooken reagerade på. Omtaget måste
därför upprepa allt, eller verifiera varje sidoeffekt mot disk innan nästa
steg. Antagandet "det tidiga ledet hann köras" är en osynlig dataförlust.**
`[UNIVERSAL]`

Instans (S109, 2026-08-21): ett landningskommando bestod av `cat >>`
(sessionsdokets Del 6) · markdownlint · `git add/commit` · `arbetsform rensa`
· `git push`. Push-spärren (ADR-097) fällde hela kommandot på `git push`. I
omtaget kördes bara lint + commit + rensa — appenden upprepades aldrig,
commiten innehöll tre bildfiler och ingen Del 6, och PR `#1682` landade utan
den. Upptäckt en timme senare av en slump (en grep efter `^## Del 6` vid en
rebase-konflikt gav noll). Texten fanns bara i sessionens trail och
återinfördes därifrån; hade sessionen kompakterats emellan hade den varit
borta.

**Det generella:** en nekad tool-call är atomär — allt eller inget. Samma
klass som `L440` (pipens exitkod) fast åt andra hållet: där döljer skalet ett
fel, här döljer hooken en utebliven körning. Bygg omtaget som ett fullständigt
kommando, och låt transparens-rapporten läsa resultatet från disk
(`git show --stat`), inte från minnet av vad som var tänkt att köras.
