# En defekt som är byte-identisk med den godkända prototypen är en FACIT-nivå-defekt — bygget kan inte laga den

**Hittas ett fel i en promoverad yta ska första frågan vara om felet också
finns i det stämplade facitet. Är den skarpa ytan byte-identisk med
prototypen har bygget gjort exakt rätt — felet ligger i det som godkändes.
Då finns bara två giltiga vägar, båda Marcus: AMENDERA facitet (felet
accepteras som gällande form) eller KRÄV FIX (facitet ändras och ytan byggs
om). Att "bara laga det" i bygget bryter promoveringskontraktet och gör
facitet osant.**

Instans (S102): `task-243.1`:s Morgonkoll-promovering bar en defekt i
badge-formen vid 375 px bredd. Den mättes vara **byte-identisk med
prototypen** — alltså inte en byggmiss — och klassades som ADR-102 B2-beslut
hos Marcus. Buren som carry-kandidat genom sjätte och sjunde pausen, avgjord
vid QA 243.4 (2026-08-17): **B2 = AMENDERA** ("orkar inte ta tag i det just
nu"; omprövning uttryckligen fri), bokförd på `task-243.1` i PR **#1517**.

**Det generella:** promoveringskontraktet gör facitet till kravspec, inte till
inspiration. En avvikelse mellan yta och facit är ett byggfel; en
ÖVERENSSTÄMMELSE med facitet som ändå är fel är ett kravfel — och kravfel har
en annan ägare. Att skilja de två kostar en jämförelse och sparar en
tvist om vem som gjorde fel.
