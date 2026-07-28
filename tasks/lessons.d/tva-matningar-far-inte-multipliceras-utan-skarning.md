# Två mätningar som svarar på olika frågor får aldrig multipliceras ihop utan att skärningen räknas

**[UNIVERSAL]** Bär en plan två mätningar — en som avgör VILKA enheter som kan
flyttas och en som avgör HUR MYCKET en mängd enheter är värd — så är produkten
av dem inte en prognos förrän skärningen mellan populationerna är räknad. Görs
den inte, är felet inte en osäkerhet utan en aritmetisk garanti.

**Symptom.** ADR-080 projicerade att staging-mutexen skulle falla `9,25 → ~2,4
min` (faktor 3,8). Utfallet blev `9,77 → 6,55 min` (faktor 1,49) — hälften av
den lovade vinsten, och avvikelsen såg först ut som ett mätfel eller en
modellsvaghet.

**Rotorsak.** Två research-pass kombinerades utan skärning. Anrops-mätningen
(863 anrop över 32 filer) avgjorde vilka FILER som kunde hermetiseras; svaret
blev 18 filer med 152 tester. Tidsbudget-passet avgjorde hur mycket TID som
fanns i sviten; dess `410 s` byggde på **296 TESTER** som mockar sitt nätverk.
Ingen räknade snittet: **147 av de 296 mockande testerna bor i filer som också
innehåller minst ett live-test**, och kriteriet är fil-nivå — hela filen stannar.
Den största enskilda posten var en fil med 56 tester varav 50 mockande, som
stannade för att 6 gick live.

**Beviset att modellen inte var problemet.** Samma fördelningsmodell (1,384
s/test) tillämpad på den population som FAKTISKT flyttades förutsäger 251 s för
det kvarvarande steget; uppmätt blev 271 s — inom 8 %. Modellen höll.
Populationen gjorde inte det.

**Regel.** Innan två mätningar multipliceras: skriv ut vilken ENHET vardera
räknar (fil? test? anrop?) och räkna skärningen explicit. Skiljer sig enheterna
måste den ena översättas till den andras, med talet utskrivet — aldrig antaget
lika. Och när en projektion sedan visar sig felaktig: leta populationsfelet
FÖRE modellfelet. Det förra är räknebart och därmed lärbart; det senare är oftast
en efterhandsförklaring.

**Kategori:** Process / mätning.
**Källa:** 2026-07-28 Session 91, `TASK-59.7` — mätningen i
`docs/research/acceptance-utbrytningens-utfall-2026-07-28.md` § 4.
