# Oskopat `getByText` efter uppladdning/radering kolliderar med skärmläsar-announcern

**Ett Playwright-`getByText(FILNAMN)` direkt efter en upload-/radera-åtgärd
matchar BÅDE listraden och `alertScreenReader`s SR-only-nod
("FILNAMN har laddats upp/raderats", synlig 100–1100 ms) — strict mode
kastar då i stället för att polla vidare, och testet flakar 10–20 %.** Mätt
2026-08-29 (S113, `TASK-309.40`): två tester i `dokument-lista-hojdlas`
sparkade en PR ur kön; nollhypotesen bevisad mot rent `main` (1/10 föll utan
PR:ens ändring). Fix: skopa lokatorn till listans `data-testid`
(`page.getByTestId('dokument-lista').getByText(...)`) — announcern ligger i
`document.body`, aldrig under listan. Regel: efter varje åtgärd som
annonserar till skärmläsare skopas textlokatorer till den yta som prövas.
