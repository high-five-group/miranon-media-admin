# Fragment — visual-riggen fällde en bugg CI:s övriga jobb släppte igenom (T87-omprövningsargument)

**[UNIVERSAL]**

**Fångad:** 2026-08-02–2026-08-03, Session 93, hållplats-prototypens kedja.

**Vad som hände:** nattens röda körning (run `30784851472`) hade två
rotorsaker, båda fixade i PR #639. Den ena — en K6-regression ur #613s
Beläggning-omstrukturering (null-rader läckte) — fångades av testsviten
(rött-först: 1 failed → 12/12). Den andra felet fångades INTE av typecheck,
lint, build eller de vanliga testerna: en rail-gatings-bugg där ett
UI-element läckte mellan varianter i stället för att vara gatat bakom
`?variant`-parametern. Enbart visual-regressionsriggen (skärmdumps-diffning)
fällde den — 2 fällda jämförelser — och efter fixen gick riggen till 94/94.
Samma PR rättade även ett dataväxlar-kontrakt (se syskonfragmentet om att
läsa dev-verktygs kontrakt före spec).

**Varför det spelar roll utöver den enskilda fixen:** tråden `T87` (visual-
grindens CI-aktivering som BLOCKERANDE grind) står `paused` sedan S81 —
Marcus-beslut A: under en tidig UI-fas med många AVSIKTLIGA
utseendeändringar hade en aktiv blockerande visuell grind stoppat
auto-merge på varje medveten designändring, så grinden kördes rådgivande i
stället. Detta S93-fyndet river inte det beslutet — det var korrekt då —
men är en EMPIRISK datapunkt för omprövning när triggervillkoret (`UI-takten
lugnar`) inträffar: visual-riggen fångar en felklass (element som läcker
över tillstånd/varianter) som ingen av de andra jobben i CI-svansen
(typecheck/lint/build/API-tester) ens KAN fånga, eftersom de aldrig renderar
DOM:en.

**Lärdomen:** instrumentval avgör vilken felklass som är synlig.
Typkontroll, lint och enhetstester verifierar KOD; endast ett verktyg som
faktiskt renderar och jämför pixlar kan fånga att något SER fel ut eller
LÄCKER visuellt mellan tillstånd. En CI-svit utan visuell regressionstest
har ett blint fält som inget av de andra jobben täcker in — oavsett hur
många de är.

**Vad som INTE är belagt:** att slutsatsen bör vara "aktivera `T87` nu" —
det beslutet ligger hos Marcus och tråden `T87` själv (aktiveringsjobbet
ligger redan färdigbyggt i kortet; endast triggern saknas). Detta fragment
bokför enbart EMPIRIN som talar för omprövning när triggervillkoret
inträffar, inte ett beslut om aktivering.

**Varför `[UNIVERSAL]`:** gäller all mjukvaruutveckling med visuell yta —
samma princip som varför visuell regressionstestning (Chromatic, Percy,
Playwright-skärmdumpar) existerar som EGEN testklass i branschen, skild
från enhetstester: den mäter något enhetstester strukturellt inte kan mäta.
