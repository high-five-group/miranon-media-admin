# En defekt i en VERKTYGSFORM sitter aldrig på ett anropsställe — svep hela anropsytan före fixen, och räkna träffarna

**Föll ett anrop på HUR verktyget anropas — obundet namn, ostyrd version, fel
flagga — är formen med största sannolikhet kopierad. Svep `scripts/`,
workflows, `package.json` och hookarna efter samma form INNAN du fixar, och
räkna träffarna: antalet är en mätning, inte en gissning. En rapport som säger
"ett ställe" har oftast bara läst det ställe som råkade fälla.**
`[UNIVERSAL]`

Instans (S108, 2026-08-24, Del 18 § D): fällningen låg i
`deploy-prod-functions.sh:192` (bart `supabase`). Sveppasset över `scripts/`,
`.github/workflows/`, `package.json` och `.githooks/` fann **sju**
anropsställen (A1–A7), varav **inget** var versionspinnat — CLI:t var
verifierat frånvarande ur både `package.json` och `package-lock.json`.
Dessutom lärde två kommentarer i `provision-attachments-bucket.mjs` aktivt ut
den bara formen, den ena märkt *"Exempel (Marcus, prod)"*: nästa copy-paste
hade återskapat defekten.

**Det generella:** två egenskaper gör svepet obligatoriskt snarare än
ambitiöst. (1) En verktygsform sprids genom kopiering, så förekomsterna är
KORRELERADE — hittar du en finns nästan alltid fler, och de ligger i filer
ingen läser förrän de fäller. (2) Dokumentation och kommentarer är en del av
anropsytan: en kommentar som visar den defekta formen är en framtida instans,
inte prosa, och den är osynlig för varje grind som bara läser kod. En vakt kan
dessutom göra ytan värre än den ser ut: A6 var ett `command -v npx`-test, som
prövar NÄRVARO när defekten var VERSION — alltså en vakt som svarar grönt på
exakt det fall den ser ut att skydda mot. Pröva alltid vad en befintlig guard
faktiskt mäter innan den räknas som mitigering.
