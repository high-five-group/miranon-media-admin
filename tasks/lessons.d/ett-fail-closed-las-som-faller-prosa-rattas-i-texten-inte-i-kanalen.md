# Ett fail-closed lås som fäller din PROSA rättas i texten — inte genom att byta kanal

**Ett lås som matchar en förbjuden sträng var som helst i kommandot kan inte
skilja ett kommando från ett dokument. Fäller det en text du skriver är första
frågan om texten BEHÖVER innehålla strängen — inte vilken kanal som tar sig
förbi. Ett trubbigt lås som fäller rätt sträng i fel sammanhang är korrekt
fällning, och att konstruera en väg runt det är att riva skyddet för att
slippa skriva om en mening.**
`[UNIVERSAL]`

Instans (S108, 2026-08-24, sessionsdok Del 20): ett `cat > fil <<'EOF'`-heredoc
avvisades av `scripts/deny-prod-ref.sh`. Fällningen var korrekt — skriptets
eget filhuvud säger vad den prövar: *"förekomst av prod-project-refen … NÅGONSTANS
i Bash-kommandosträngen"*, och `.prod-ref-policy.conf` § Matchning motiverar
varför den bredden är MEDVETEN. Det som fälldes var inte ett kommando mot
prod, utan brödtext i ett sessionsdok som citerade refen som förklaring till
ett CORS-resonemang. Skriptet bär dessutom en DOKUMENTERAD bypass-form vars
egen kommentar säger rakt ut: *"bypass-formen ska ENDAST skrivas av Marcus, i
klartext, aldrig av en agent på eget initiativ"* — och erkänner öppet att
ingenting mekaniskt hindrar en agent från att läsa kommentaren och konstruera
formen. Åtgärden blev att utelämna refen ur texten; den tillförde ingenting
som dokumentet inte redan bar på annat sätt. Ingen bypass-form konstruerades.

**Avgränsning mot en närliggande lärdom:** fragmentet
`bang-prefixet-passerar-pretooluse-hookar-matt-tva-ganger.md` § Bifynd
beskriver samma felmod (ett lås fäller ett CITAT i prosa) men motsatt rätt
svar — där löstes det genom att byta verktyg (heredoc → `Write`) och behålla
texten, eftersom texten var själva poängen: fragmentet dokumenterade hookens
mekanik. Skillnaden är inte kanalen utan om strängen är NÖDVÄNDIG i texten.
Pröva den frågan först; kanalbytet är svaret bara när svaret är ja.

**Det generella:** en spärr som matchar på strängnärvaro har ingen modell av
avsikt, och det är designval, inte brist — den kan därför aldrig tyst släppa
igenom något farligt, bara högljutt stoppa något ofarligt. Kostnaden för den
asymmetrin ska betalas där den är billig: i texten. Och en bypass som finns
dokumenterad i skriptets källkod är ingen inbjudan — att den är läsbar för
den som fälls är precis vad som gör det till ett hedersord snarare än ett lås,
och ett hedersord bryts av den som åberopar det åt sig själv.
