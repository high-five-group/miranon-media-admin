# Ett lokalt test med en äkta assertion-mismatch, medan CI är grönt på samma kod, är inte automatiskt flake

En lokal körning av `tests/acceptance/hem.acceptance.test.ts:313`
("dagar-kvar-formens tre exakta") reproducerade ett VERKLIGT
assertion-fel, inte bara ett anslutningsfel, mot en exklusiv lokal
dev-server, medan CI förblev grönt på exakt samma kod. Mätt 2026-09-02
(S113 resume 9,
`/private/tmp/claude-501/-Users-marcus-Repon-miranon-media-admin/36910b85-3a39-48d5-b59f-5effc4f483d2/scratchpad/lessons-kandidater-resume9.md`
kandidat (z)). Frågan lämnades ÖPPEN och outredd, trolig klass är
datumberoende (fryst klocka i testet mot verklig kalender) eller en lokal
miljöskillnad, men rotorsaken är inte fastställd. Regel: skilj alltid en
äkta assertion-mismatch (fel VÄRDE, inte ett infrastrukturfel som
`ERR_CONNECTION_REFUSED`) från brus innan den avfärdas som flake, särskilt
när CI och lokal körning divergerar på identisk kod, och undersök
datum-/klockberoende som första hypotes för en sådan divergens. Om detta
mönster återkommer i CI eller nightly-körningar bör det mintas som ett
eget kort.
