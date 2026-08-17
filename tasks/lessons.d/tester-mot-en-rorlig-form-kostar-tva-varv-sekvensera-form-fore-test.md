# Tester skrivna mot en form som fortfarande rör sig kostar två varv — sekvensera test-PR:en EFTER form-PR:en

**När en skiva ÄNDRAR en yta och en annan skiva TESTAR samma yta är de inte
oberoende, hur väl de än mergar. Merge-kön löser textkonflikten och lämnar
kvar den semantiska: testerna beskriver formen som gällde när de skrevs.
Släpp form-PR:en först, låt den landa, och starta test-skivan mot den landade
formen — parallellisera dem inte.**

Instans (S102, 2026-08-16/17): `task-243.3` (hem-sviterna) och `task-241.2`
(svep-skalet, PR **#1464**) korsade varandras semantik. 243.3 fick rebasas till
`44649e54` och kördes i **två varv** innan sviterna matchade den form som
faktiskt landat. Bokfört som "kö-semantikkorsningen" i sjunde pausens
carry-block, med den uttryckliga slutsatsen "sekvensera test-PR efter
form-PR".

**Det generella:** merge-kön bygger varje post mot `main` plus posterna före
den, så MEKANISKA konflikter mellan parallella landningar är lösta. Vad kön
inte ser är två diffar som mergar rent och ändå är fel tillsammans — och en
testsvit mot en yta som just skrivits om är den vanligaste formen av det.
Beroendet är en ORDNING, inte en konflikt, och ordningar måste sättas av den
som ser båda skivorna.
