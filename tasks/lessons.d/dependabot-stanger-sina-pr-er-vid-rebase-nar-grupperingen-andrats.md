# Dependabot stänger sina egna PR:er vid rebase när grupperingen ändrats — granska dem inte före basen är färsk

**En `@dependabot rebase` på en PR vars grupp inte längre matchar efter
egna `package.json`-ändringar (overrides, caret) stänger PR:en med "Looks
like these dependencies are updatable in another way" i stället för att
rebasa. Granskningar gjorda på den gamla headen är då bortkastade.** Mätt
2026-09-17 (S125): #2480 stängdes av Dependabot 11:08Z direkt efter att
PR #2491 landat, #2482/#2483 stängdes 11:21Z på rebase-kommentaren — två
review-agent-utlåtanden (risk medel/låg) blev överspelade. Regel: landa egna
beroendefixar först, låt Dependabot öppna nya PR:er mot färsk `main`, och
granska först då. Stäng/ersätt-flödet: en egen rotorsaks-PR som ERSÄTTER
Dependabot-PR:en (#2495 för #2481, #2498 för #2484) stängs av orkestreraren
som superseded efter landning.
