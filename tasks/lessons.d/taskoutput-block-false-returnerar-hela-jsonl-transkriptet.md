# `TaskOutput` med `block=false` mot en agent returnerar hela JSONL-transkriptet till orkestrerarens kontext

**[UNIVERSAL] Ett icke-blockerande statusanrop mot en pågående agent kan i
praktiken returnera agentens FULLA JSONL-transkript, inte bara en kort
statusrad, vilket fyller orkestrerarens kontextfönster med brus i stället
för den lilla liveness-signal anropet var tänkt att ge.** Mätt 2026-09-02
(S113 resume 9,
`/private/tmp/claude-501/-Users-marcus-Repon-miranon-media-admin/36910b85-3a39-48d5-b59f-5effc4f483d2/scratchpad/lessons-kandidater-resume9.md`
kandidat (w)). Regel: använd inte `TaskOutput` med `block=false` som
liveness-koll mot en pågående agent. Använd i stället fjärr-signaler som
inte drar in agentens interna transkript, `git fetch` mot agentens gren,
`gh`-anrop mot dess PR, eller en fil agenten själv skriver till sin
scratchpad-katalog.
