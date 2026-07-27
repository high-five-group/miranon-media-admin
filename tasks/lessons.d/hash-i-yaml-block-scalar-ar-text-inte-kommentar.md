# `#` i en YAML literal block scalar är literal text, inte kommentar

**Inuti ett `files: |`-block är `#` en helt vanlig tecken. En "kommentar" där
blir en glob-post som tyst matchar ingenting — eller fel saker.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-27):** kommentarsrader skrevs in i ett `files: |`-block i
`ci.yml` med antagandet att YAML-kommentarsyntaxen gällde. Literal block scalars
(`|`) bevarar allt innehåll ordagrant — kommentarer finns inte i den kontexten.
Posterna blev därmed globar som aldrig kunde matcha.

Felet är osynligt vid läsning: filen *ser* korrekt kommenterad ut, och grinden
säger inget eftersom en glob som matchar noll filer inte är ett fel.

**Motmedlet är att parsa filen, aldrig att läsa den.** Formen verifieras genom
att köra parsern och inspektera det tolkade värdet — `yq`, `actionlint` eller en
`js-yaml`-rad. Ögat kan inte skilja en literal `#`-rad från en kommentar; parsern
kan inget annat.
