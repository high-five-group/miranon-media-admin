# Ett level-triggered svep utan undantagslista larmar om medvetet parkerade poster vid VARJE varv

**Level-triggered rapportering — larma varje svep tillståndet håller, inte
bara vid övergången — är rätt design; den är immun mot den envägs-blindhet
som missar ett rött läge som redan stod rött när vakten startade. Men utan en
undantagslista blir varje MEDVETET parkerad post ett larm per varv. Varje
sådant larm är en modell-tur utan handling, och bruset gör att äkta larm
drunknar. Level-triggered och undantagslista är två halvor av samma design,
inte ett val mellan dem.**

Instans (S102, 2026-08-17, åttonde pausen): Dependabot-PR **#1488** stod
RÖD och PARKERAD i väntan på Marcus review, och larmade i varje
heartbeat-svep. Bokfört som carry-tråd med noteringen "undantagslista saknas".

**Andra instansen av samma tråd, tidigare mätt:** `T144` i
`tasks/threads/README.md` (status `paused`) — S106 väcktes **~35 gånger** av
SAMMA röda syskon-PR (`#1343`, S102:s), som den sessionen per regel aldrig
rör. Kandidatåtgärden står redan formulerad där: filtrera röda-rapporten på
egna grenar/PR:er, alternativt en undantagslista.

**Tredje instansen — FEM handjusteringar i ETT pass (S108, 2026-08-23/24):**
orkestrerarens monitor-filter justerades för hand **fem gånger** för främmande
PR:er (`#1883`, `#1896`, `#1905`, `#1917`, `#1921`) — en visual-baseline-PR
som Marcus äger, S111:s draft och S112:s löpande poster, alla RÖTT eller DIRTY
och ingen av dem sessionens att röra. Handgreppet var varje gång ett `grep -v`
på PR-numren i monitor-kommandot, eftersom `.heartbeat-svep-policy.conf` bara
bär ett FÖRFATTAR-undantag och saknar per-PR-lista. Sessionsdoket bokförde
antalet som fyra vid Del 18 § I och som fem vid pausen — kandidaten stod alltså
formulerad sedan Del 15 § C och fick fem instanser till innan någon byggde den.

**Det generella:** en vakt som inte kan skilja "detta är nytt" från "detta är
känt och accepterat" har bara ett larmläge, och det läget slits ut. Tre
oberoende sessioner har nu betalat för samma lucka — det gör den till en
designskuld med belägg, inte en irritation. Den tredje instansen lägger till
två saker de två första inte visade: (1) fem handgrepp för samma sak i ETT
pass är en mekanism-skuld, inte otur — upprepningsfrekvensen är själva
mätvärdet; (2) workarounden är FLYKTIG, eftersom filtret lever i
monitor-kommandot och inte i config — det försvinner vid varje omstart av
svepet, så kostnaden återkommer även för poster som redan filtrerats bort en
gång.
