# En dyr skyddsflagga stängs av där den inte skyddar något — via isolerad config, aldrig genom att mutera den riktiga

**En flagga som skyddar EN operation kostar i alla andra. Rätt svar är
varken att leva med kostnaden eller att slå av flaggan globalt, utan att köra
den icke-skyddade vägen mot en ISOLERAD config där flaggan är av — den
riktiga configen orörd, den skyddade operationen orörd.**

Instans (S102, 2026-08-16/17): `backlog/config.yml`s
`check_active_branches: true` skyddar exakt ID-allokeringen i `task create`.
Varje annat anrop betalade en full gren-skanning. ROOT_CONFIG-mönstret —
en temporär config med flaggan AV för grind-processen — mättes skarpt:
**>120 s → 3,4 s** för grindens faktainsamling. Vidareutvecklat i `TASK-250`
till `scripts/backlog-cli.sh` (`npm run bl`) med `BACKLOG_CWD`-isolering:
**7,63 s → 2,10 s**, utdata byte-identisk (verifierad med `diff`),
`create`-skanningen orörd. Landat i PR **#1505**; beslut och mätserie i
`ADR-117`.

**De två hårda kanterna, båda mätta:**

- **ALDRIG för `create`.** Det är den enda operation flaggan faktiskt
  skyddar; går den genom isoleringen är skyddet borta utan att någon märker
  det.
- **Muteras aldrig via CLI:t.** `backlog config set` är bevisat FÖRLUSTFULL
  vid round-trip (belägg: `task-238`-kortet) — isoleringen ska skapa en EGEN
  config, inte skriva om den riktiga.

**Det generella:** när en säkerhetsflagga är dyr, mät VAD den skyddar innan
du betalar för den överallt. Skyddsytan är nästan alltid smalare än
kostnadsytan, och skillnaden går att isolera bort utan att röra skyddet.
