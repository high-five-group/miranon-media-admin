# Verifiera låsartefakten före en omstämplingsinstruktion

**[UNIVERSAL] En omstämplingsinstruktion ("gå och godkänn X i staging/prod")
måste peka på RÄTT lås-yta INNAN kommandot formuleras — manifest med eget
`facit.json` och sidofil-klass (ADR-102 klass c, ingen `facit.json`) är två
olika mekanismer med olika kommandon.** Mätt 2026-09-04 (S119): orkestreraren
skickade Marcus till s111-manifestet (anmälnings-LISTAN) för en
avboka/boka-om-kvittens som i själva verket bor på anmälans DETALJSIDA —
en S83-låst sidofil UTAN egen `facit.json`. ADR-102-grinden fällde korrekt
(prototypkällan fanns inte vid den stämpel-SHA agenten angav), PR `#2294`
stängdes; den faktiska kvittensen ("Avboka och boka om, godkänt i staging
2026-09-04.") fick i stället bokföras i s83:s två AMENDERING-sidofiler
(PR `#2309`, ADR-102 § A3 klass c). Regel: läs vilken låsklass ytan faktiskt
har — manifest-med-facit.json eller sidofil klass c — INNAN
omstämplingskommandot skrivs, inte efter att grinden redan fällt det.
