# Skrivverktyg som kräver fält-ID + datamodell utan prod-ID:n = en schema-dump per prod-skrivning

**Skrivverktyg som kräver fält-ID + en datamodell som bara bär staging-ID:n
= en schema-dump per prod-skrivning. Prod-ID:n hör hemma i
`data-model.md`.** Mätt (S127, 2026-09-18): en skrivning till Eventinnehållets
`Anmälningsavgift (kr)`-fält via namn avvisades av verktyget (inget
skrevs); ID:t (`fldbs7hqkvuad1XfK`) fanns inte i `data-model.md` och fick
hämtas ur basens schema live, mitt i en skarp prod-skrivning.

Inte `[UNIVERSAL]`: specifik för detta repos Airtable-integration
(PAT-servern kräver fält-ID, inte namn, för skriv-operationer) — men
mönstret ("ett skrivverktyg som kräver ID + en referens som bara
dokumenterar en ANNAN miljös ID:n") kan återkomma i andra Airtable-baserade
spokes.

Källa: `tasks/sessions/2026-09-18-session-127.md` Del 4, Lesson-kandidat 8
(docs-skuld: prod-fält-ID:n för `Anmälningsavgift (kr)`/`Pris (kr)` saknas
fortfarande i `data-model.md`, se Del 4 § "Dokumentationslucka").
