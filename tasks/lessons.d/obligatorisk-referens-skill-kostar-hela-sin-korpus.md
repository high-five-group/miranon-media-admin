# En obligatorisk referens-skill kostar hela sin korpus, inte delen man behöver

**En skill med ett brett, alltid-på-triggerkontrakt (t.ex. "läs detta INNAN du
öppnar målfilen, oavsett hur trivialt ärendet ser ut") laddar sin fulla korpus
vid triggning — inte den delsektion som faktiskt var relevant för uppgiften.
Bredden i triggerkontraktet köper täckning, men priset betalas i kontext på
varje enskild triggning, även de där en rad hade räckt.** `[UNIVERSAL]`

**Empiri (S91, tjugoförsta resumen, 2026-08-01):** en `claude-api`-referens-
skill triggade obligatoriskt under en session vars kontextförbrukning redan
närmade sig taket ("kontext-42-%-episoden"). Skillens eget triggerkontrakt är
medvetet brett — det fyrar på namnet "Claude/Anthropic" i nästan vilken form
som helst, på LLM-formade uppgifter utan angiven leverantör, och uttryckligen
"även om det ser ut som en enrading". Bredden är ett designval för att inte
missa den uppgift som verkligen behöver referensen — men konsekvensen är att
varje triggning injicerar hela skillens korpus i kontexten, oavsett om
uppgiften bara behövde en enda prisuppgift eller modellbeteckning.

**Detta är inte skillens fel** — bredden är en avsiktlig avvägning mot att
missa den sällsynta men dyra bugg-klassen (fel modell-ID, föråldrad prissättning,
en refuserad ton feltolkad som produktbegränsning). Lärdomen är att kostnaden
är strukturell och förutsägbar: en obligatorisk referens-skill med brett
triggerkontrakt är ett medvetet val mellan två kostnader — missad täckning
kontra kontext-förbrukning per triggning — och det valet syns först i
kontexttrycket, inte i skillens egen dokumentation.

**Motmedlet är inte att smalna triggerkontraktet** (det skulle återinföra
missad-täckning-risken skillen finns för att stänga), utan att räkna in
korpus-kostnaden när kontexttak och skill-triggrar designas tillsammans —
särskilt i sessioner som redan närmar sig ett kontexttak, där en obligatorisk
skill-triggning kan vara den marginal som tvingar en paus.
