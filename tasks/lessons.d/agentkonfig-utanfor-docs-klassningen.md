# Agentkonfig utanför docs-klassningen kostar en full staging-svit

**`.claude/**` står inte i docs-allowlisten. En URL-ändring i agentkonfig utlöser
därför hela testsviten genom den globala staging-mutexen — för en fil som inte
kan påverka en enda test.**

**Empiri (S91, 2026-07-27):** mätt skarpt. Ägarbytets städning ändrade en URL i
`.claude/settings.json`, och den ändringen ensam klassades som kod och drog full
svit. Kostnaden är ~10 minuter genom mutexen plus kön bakom.

Klassningen är **allowlist, aldrig blocklist** — vilket är rätt design, eftersom
en glömd post då blir *för mycket* CI i stället för *för lite*. Men det gör också
att varje ny konfigyta måste läggas till medvetet, annars faller den till
default-fallet.

**Åtgärden är en rad i `ci.yml`:s docs-klassning** (restlistan A4). Den bredare
lärdomen är att **klassningslistan är en tillståndsyta som åldras**: nya
kataloger tillkommer löpande, och ingen grind säger till när en av dem hamnat i
fel hink. Samma klass som listparitets-problemet — invarianten står i prosa i
stället för i en grind.
