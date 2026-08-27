# Verifiera vad en PR faktiskt innehåller — mot fjärren, inte mot din avsikt

**Kontext:** S108, 2026-08-27, PR #2024.

Ett bakgrundsjobb körde `git checkout main` medan arbete pågick i
arbetsträdet. Nästa commit hamnade därför på **lokal main** i stället för på
grenen. Grenen pushades oförändrad, och PR:ens titel och kropp — som jag skrev
utifrån vad jag *hade gjort* — påstod en säkerhetsfix (`fetMarkera`, ny fil,
12 tester) som inte fanns i diffen.

Review-agenten fångade det och satte `risk: hog` med rätt motivering: en
olöst regression hade annars bokförts som åtgärdad, via titel och
commit-historik. Den verifierade via tre oberoende källor (`gh pr diff`,
`gh api pulls/files`, `gh api compare`) plus `git grep` mot både `origin/main`
och PR-huvudet.

**Två lärdomar:**

1. **Låt aldrig ett bakgrundsjobb byta gren medan arbete pågår.** Jobbet var
   välmenande — det skulle förbereda en prod-deploy genom att checka ut `main`
   när en PR landat. Men det körde mitt i en redigering. Ett väntejobb får
   observera; det får inte mutera arbetsträdets tillstånd.

2. **PR-beskrivningen ska skrivas mot diffen, inte mot minnet av arbetet.**
   Efter push: `gh api repos/.../pulls/<nr>/files --jq '.[].filename'` och
   jämför med vad du påstår. Det är två sekunder och fångar hela felklassen.
   Samma `ADR-083`-disciplin som gäller prosa i repot gäller PR-kroppar: en
   beskrivning som påstår något som inte finns är värre än ingen beskrivning.

**Formen som räddade oss** var att granskningen kördes i FÄRSK kontext av en
agent som inte litade på min beskrivning (`ADR-105` beslut 2). En granskare som
delat kontext med mig hade sannolikt läst PR-kroppen som sanning.
