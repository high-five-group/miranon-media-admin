# För en UI-yta är den renderade bilden källan — ett kodpass kan bekräfta att något finns, aldrig att det håller

**Att läsa koden till en UI-yta bevisar att element EXISTERAR — aldrig hur de
ser ut tillsammans. Bedöm aldrig en formfråga (val mellan varianter, "är detta
klart?") på läst kod: rendera, titta, jämför mot facit-bilder.** `[UNIVERSAL]`

Mätt 2026-08-10–13 (S103 Del 11): orkestreraren bedömde check-in-varianterna
A–D på LÄST KOD utan att ha sett dem renderade. Marcus fångade det i klartext
(*"har du ens tittat på hur det ser ut?"*) och pekade på facit-sidorna som
mått. Den efterföljande D-konvergensen ändrade sju punkter som kodläsningen
aldrig hade sett — bl.a. höjdlåset på framstegskortet (127 px konstant mätt
genom fem incheckningar) och tint-hörnens klippning, båda rena render-fenomen.

**Det generella:** koden är sanningskälla för BETEENDE (ADR-100); den
renderade ytan är sanningskälla för FORM. Ett omdöme om form grundat i kod är
en hypotes, inte en observation — och skillnaden syns först i pixlar.
Operativ konsekvens: varje form-bedömning i ett uppdrag ska bära en skärmdump
eller köras mot dev-servern; "jag läste komponenten" är inte belägg.
