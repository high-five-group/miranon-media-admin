# Orkestreraren anger riktning, inte färdig kod — och säger det i uppdraget

**En orkestrerare som skriver färdig kod i uppdraget flyttar sitt eget
overifierade antagande in i agentens hand, där det ser ut som ett krav. Ange
riktningen, kräv kontroll mot dokumentation och kod, och säg uttryckligen att
riktningen får rivas.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-28, `TASK-64` klass A):** orkestreraren hade diagnosticerat
ett race korrekt — icke-auto-väntande query följd av icke-retrying assertion —
och föreslog fixen `await expect(sok).toHaveAttribute('aria-activedescendant',
/.+/)` före hämtningen av värdet.

**Förslaget var en no-op.** Bygg-agenten mätte att attributet är satt **redan
före** första `ArrowDown` (det pekar då på djuplänkens eget alternativ), så
närvaro-kollen hade passerat på det gamla värdet utan att vänta på uppdateringen.
Agenten gick i stället mot det väntade alternativets faktiska DOM-id.

Diagnosen var alltså rätt och fixen fel. Det är den farliga kombinationen: en
korrekt analys ger färdigkoden auktoritet den inte förtjänar, och en agent som
litar på orkestreraren bygger in felet med gröna grindar.

**Det som räddade fixen var en enda mening i uppdraget:** *"Riktningen är
Playwrights web-first assertions. Kontrollera formen mot Playwrights egen
dokumentation innan du skriver; jag anger riktning, inte färdig kod."* Utan den
hade agenten haft skäl att implementera förslaget bokstavligt.

**Samma uppdrag bar också spärren** *"radnumren är från före `TASK-65` landade —
verifiera mot faktisk fil, peka aldrig på en rad du inte läst"*, vilket är samma
disciplin i en annan riktning: orkestrerarens karta är alltid något föråldrad.

Besläktad: [[uppdrag-kan-peka-pa-fel-adress-verifiera-mot-koden]] ·
[[dokumenterad-vag-ar-inte-ovad-vag]]
