# En vakt vars villkor matchar noll objekt är fail-open, inte tom

**Formen `until [ -z "$(fråga)" ]; do sleep …; done` avslutas omedelbart när
frågan returnerar tomt — och den returnerar tomt av två helt olika skäl: allt är
klart, eller frågan pekar på ingenting. Utifrån ser de identiska ut, och vakten
rapporterar "klart" i båda fallen.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-30):** en CI-vakt sattes mot merge-commiten för `#473`
med villkoret *"vänta så länge det finns körningar på detta SHA som inte är
klara"*. Vakten avslutades på sekunder och rapporterade tillbaka med tomma
utfall. Två av tre körningar pågick fortfarande.

Orsaken var att SHA:t var **påhittat**. Prefixet `afcb6fd` lästes ur `git log`,
och de återstående 33 hex-tecknen fylldes på ur ingenting:

    använd:   afcb6fd45e2d0a3e9d21fb1e6a4b46bb01d09b7f
    faktisk:  afcb6fd35a73b8e20b66323f849e62f53e07aa11

Noll körningar matchade det påhittade SHA:t, alltså var väntevillkoret uppfyllt
direkt. Felet fångades bara för att `gh run list --commit <SHA>` gav tom output
mot ett SHA som `gh run list --branch main` samtidigt visade tre körningar för —
**motsägelsen mellan två läsningar av samma sak var enda signalen.**

**Varför det är värre än en vakt som inte startar:** en vakt som kraschar syns.
En vakt som avslutas snyggt med tomt resultat *ser ut som ett grönt besked*, och
nästa steg fattas på den grunden. Klassen är samma som `L322`:s skippbara
required check — en mekanism som fallerar åt det tillåtande hållet.

**Två åtgärder, båda behövs.**

1. **Låt värdet aldrig passera genom din egen text.** Läs det i samma anrop som
   använder det: `SHA=$(git rev-parse origin/main)` i vaktens eget kommando,
   aldrig ett SHA du skrivit av eller fyllt på.
2. **Skilj "inget kvar att vänta på" från "inget att vänta på".** Ett villkor som
   bara mäter frånvaro kan inte se skillnaden. Kräv att frågan först returnerar
   minst ett objekt, eller verifiera träffmängden innan loopen startar.

**Skärpningen mot närliggande:**
[[bakgrundsprocess-utan-harness-sparning-notifierar-aldrig]] handlar om en vakt
som aldrig rapporterar. Denna handlar om en vakt som rapporterar **fel**, vilket
är dyrare — tystnad väcker till slut misstanke, ett grönt besked gör det inte.
