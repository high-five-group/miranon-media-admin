# Granskaren tappar JSON-blocket när noten kommer sist — begär blocket sist och verifiera innan nästa steg

**[UNIVERSAL] En review-agent som skriver sitt JSON-utlåtande FÖRE sin prosa-not
till orkestreraren riskerar att bara noten når fram: notifikationens
resultattext bar i tre fall av elva enbart "Not till orkestreraren", och
utlåtandet fick begäras i en extra runda via `SendMessage`.** Mätt 2026-09-07
(S123 resume 1): PR #2439 r1, #2442 r1 och #2442 r2 kom utan JSON; alla tre
levererade blocket korrekt när de ombads returnera ENBART det. Efter att
uppdragstexten bytt till "hela JSON-blocket SIST i svaret, efter noten" kom
PR #2444, #2445, #2452 och #2453 kompletta i första svaret. Regel för
granskar-uppdrag: kräv JSON-blocket sist och ensamt, och behandla en
notifikation utan block som ofullständig — kör aldrig
`uppdatera-review-sektion.mjs` på en handskriven rekonstruktion av det du
tror granskaren menade.
