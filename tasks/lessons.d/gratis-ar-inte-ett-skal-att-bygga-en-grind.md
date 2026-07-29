# "Gratis" är inte ett skäl att bygga en grind — belagt felläge är det

**En grind som fyrar noll gånger på korrekt arbete kostar ingenting, och den
frestelsen är precis vad över-engineering-vakten finns för att stoppa. Kostnaden
är inte skälet; felläget är. Saknas ett belagt fel — eller ett första fel som
vore oacceptabelt — ska grinden inte byggas, hur billig den än är.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-29):** Code föreslog fyra poster på en neka-lista och
motiverade två av dem med att de var **gratis** — de fyrar noll gånger när
arbetet görs rätt. Marcus fällde dem: *"AskUser-grejen har inte varit ett problem
på flera månader."*

Det är empiri, och den säger att prosan **fungerar** för just den regeln. Att
bygga en spärr mot ett fel som inte inträffar är att bygga "ifall".

**Testet som blev kvar, i två led:** mekanisera när felet **har inträffat** —
eller när det **första** felet vore oacceptabelt. Ett av leden räcker; noll gör
det inte. Varje mekanism som byggdes under S91 klarar det första ledet.

En tredje grund finns och ska användas sparsamt: när felläget är **osynligt**.
GitLab 2017-01-31 är primärkällan — fyra återställningsmekanismer på papperet,
noll i verkligheten, och felrapporteringen var också trasig. Den grunden bär
`TASK-91`, och den är utskriven i kortet just för att nästa läsare ska se att
den inte byggdes "ifall".

Besläktad: [[lardom-utan-grind-tillampas-inkonsekvent]] — den pekar åt andra
hållet och måste vägas mot denna, inte tillämpas ensam.
