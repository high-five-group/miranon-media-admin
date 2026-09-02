# `verify:ci-parity` under hög systemlast kostar mycket mer än baseline-mätningen, och kan flaka orelaterat

CLAUDE.md dokumenterar `verify:ci-parity`s baseline-kostnad som 910,7
sekunder mot CI:s 401,0 sekunder parallellt. Mätt 2026-09-02 (S113
resume 9,
`/private/tmp/claude-501/-Users-marcus-Repon-miranon-media-admin/36910b85-3a39-48d5-b59f-5effc4f483d2/scratchpad/lessons-kandidater-resume9.md`
kandidat (v)): en full körning under hög fleet-last (loadavg ungefär 21)
tog 1711,8 sekunder, nästan dubbelt baseline, och flakade tre orelaterade
tester (`hem:313`, `mer-platser:68`, `forberedelseskarm:166`) medan CI var
grönt på samma kod. Regel: läs `uptime`/loadavg innan en full lokal
`verify:ci-parity`-körning startas under en fleet-session, och väg ett
enskilt info-fynd som "kräver full paritet" mot den förhöjda kostnaden och
flake-risken under hög last, i stället för att anta baseline-siffran gäller
oavsett systembelastning.
