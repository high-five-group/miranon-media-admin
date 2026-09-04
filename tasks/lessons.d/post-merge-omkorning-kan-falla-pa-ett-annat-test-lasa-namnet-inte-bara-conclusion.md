# En post-merge-omkörning av ett fällt jobb kan falla på ett ANNAT test, läs testets namn inte bara conclusion

**[UNIVERSAL] När ett rött CI-jobb körs om för att avgöra transient kontra
regression, kan omkörningen falla på ETT ANNAT test än det som fällde
originalkörningen, eftersom jobbet innehåller flera tester. En
flake-klassning som bara läser körningens `conclusion` (röd igen, alltså
"bekräftat flakigt" eller "bekräftat trasigt") utan att läsa VILKET test
som föll riskerar att dra fel slutsats om vilket problem som faktiskt
existerar.** Mätt 2026-09-02 (S113 resume 9,
`/private/tmp/claude-501/-Users-marcus-Repon-miranon-media-admin/36910b85-3a39-48d5-b59f-5effc4f483d2/scratchpad/lessons-kandidater-resume9.md`
kandidat (x)): en omkörning av ett fällt jobb föll på `persondetalj`-testet
medan originalkörningen fallit på `generate-event-attachment`-testet, två
olika fel i samma jobb. Regel: en flake-klassning kräver att man läser det
omkörda jobbets fällda TEST-NAMN och jämför det mot originalets, inte bara
jobbets sammanfattande status.
