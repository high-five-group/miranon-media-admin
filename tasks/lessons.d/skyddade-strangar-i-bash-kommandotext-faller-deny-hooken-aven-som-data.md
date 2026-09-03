# Skyddade strängar i Bash-kommandotext faller deny-hooken även som DATA, aldrig som avsikt

**[UNIVERSAL] En substräng-matchande deny-hook (facit-manifestsökväg,
stämpel-kommandot `facit:godkann`) fäller på NÄRVARO i kommandotexten —
den kan inte skilja en verklig operation från texten som bara omtalar
eller citerar den.** Mätt 2026-09-03 (S114, Del 6, promoveringen av
TASK-374): tre Bash-kommandon fälldes av facit-deny-hooken trots att
ingen av dem faktiskt mutera de skyddade manifesten — manifestets
sökväg eller stämpelfrasen förekom bara som DATA i kommandotexten (en
PR-kropp skriven via heredoc som citerade sökvägen i sin egen
beskrivning, ett `--help`-anrop mot ett skript vars hjälptext nämner
`facit:godkann`, och en `jq`-läsning med redirects mot en fil vars namn
matchade mönstret). Samma felklass som `L588`s bifynd i
`tasks/lessons/vol-07.md` (dokumentation av ett stämplat kommando i en
markdown-heredoc fällde stämpel-hooken) — generaliserad hit till en
annan hook och tre nya konkreta instanstyper.

**Regel:** håll skyddade manifest-/stämpelsträngar HELT ute ur
Bash-kommandotexten. Skriv filer (PR-kroppar, dokumentation, kod som
citerar sökvägen) med Write-verktyget i stället för heredoc/`cat <<EOF`
— Write prövas bara mot faktiska filsökvägar, inte mot en hooks
segmenterade kommandotext. Ett `--help`-anrop eller en `jq`-läsning som
råkar nämna den skyddade strängen fälls på samma sätt — ingen genväg
finns förutom att inte skriva strängen i Bash-anropet.

**Sensmoral, samma som L588:** hooken är inte fel — § HELLRE FÖR BRETT
gäller, en falsk fällning kostar ett verktygsbyte medan en missad
förfalskning kostar hela mekanikens syfte. Men klassen träffar var och
en som skriver, dokumenterar eller läser om den skyddade mekaniken,
inte bara den som försöker kringgå den.
