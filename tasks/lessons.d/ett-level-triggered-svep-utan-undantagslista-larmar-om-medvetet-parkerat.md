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

**Det generella:** en vakt som inte kan skilja "detta är nytt" från "detta är
känt och accepterat" har bara ett larmläge, och det läget slits ut. Två
oberoende sessioner har nu betalat för samma lucka — det gör den till en
designskuld med belägg, inte en irritation.
