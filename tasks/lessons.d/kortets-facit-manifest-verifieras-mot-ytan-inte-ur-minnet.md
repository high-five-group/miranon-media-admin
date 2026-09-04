# Kortets facit-manifest måste verifieras mot ytan — namnge det efter `grep`, aldrig ur minnet

**Ett kort som pekar ut ett stämplat facit-manifest som sin AC kan peka fel
även när skrivaren är säker på minnet.** Mätt 2026-09-03 (S115,
`tasks/sessions/2026-09-03-session-115.md` Del 5–6, `368.3`/`368.5` AC #1):
korten pekade på `s111-anmalningslistan-konvergens` (S111 är
anmälningsLISTAN), men den yta som faktiskt är facit-stämplad och låst för
detaljsidans avbokning/ombokning är `s83-anmalningsvyn-konvergens` (S83).
Felet upptäcktes sent, amenderingen fick skrivas i rätt katalog i efterhand,
och omstämplingen fick eskaleras till Marcus. `grep -l <komponent>
tasks/sessions/bilagor/*/facit.json` hade avgjort frågan direkt. Regel för
`/to-issues` och liknande specifikation: namnge facit-manifestet FÖRST efter
att ha kört grep mot `tasks/sessions/bilagor/*/facit.json`, aldrig ur minnet
eller ur en tidigare sessions association mellan yta och sessionsnummer.
