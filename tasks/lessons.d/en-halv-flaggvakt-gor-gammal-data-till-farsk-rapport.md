# En halv flagg-vakt gör gammal data till en färsk rapport

**[UNIVERSAL]** Bärs ett mätläge av en env-flagga måste **varje** led i
instrumentet pröva samma flagga — skrivaren, nollställaren OCH läsaren. Vaktas
bara en del blir artefakten från en tidigare körning läst som den nuvarandes,
och utdata ser lika trovärdigt ut som riktig mätdata.

**Symptom.** `tests/global-setup.ts` nollställde `.hermetik/rapport.jsonl`
endast när `PLAYWRIGHT_HERMETIK_RAPPORT=1`; `tests/global-teardown.ts` läste och
skrev ut samma fil UTAN att pröva flaggan, och dess `catch` fångade bara att
filen SAKNADES. En hermetisk körning skrev därför ut anrop mot den skarpa
staging-värden — strukturellt omöjligt i en hermetisk körning.

**Varför det är värre än det ser ut.** Utskriften inbjöd till fel slutsats åt
BÅDA håll: att hermetiken läckte (den gjorde inte det) eller att en färsk
mätning fanns (den fanns inte). Reproducerat i sin renaste form: ett `--grep`
utan träff gav `Error: No tests found` och därefter en fullständig rapport.
**Noll tester kördes; rapporten skrevs ändå ut.**

**Regel.** Villkoret för att RAPPORTERA ska vara flaggan, aldrig artefaktens
existens. "Filen saknas" är ett svagare villkor än "mätläget var på", och
skillnaden mellan dem är exakt storleken på den tysta felklassen. Prövningen är
tvåsidig och båda leden måste köras: att utskriften UTEBLIR när flaggan är av
(med artefakten plantad), och att den fortfarande KOMMER när flaggan är på.

**Kategori:** Test-infrastruktur / mätinstrument.
**Källa:** 2026-07-28 Session 91, tråd `T105`, åtgärdad i `TASK-59.7`.
