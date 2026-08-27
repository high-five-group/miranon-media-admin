# En tät återkopplingsslinga är fas 1 — även när "det bara är en PDF"

**Kontext:** S108, 2026-08-27, TASK-309.27.

En mall-ändring i bekräftelsebilagan kostade ~45 minuter per varv. Kedjan gick
`ändra CSS → synka till EF-lagret → supabase functions deploy → anropa →
hämta PDF → mät`. Mätt utfall av den formen: `generate-event-attachment` gick
**v37 → v49 under EN mätserie** — tolv deploys av en molnfunktion för att
titta på tolv PDF:er.

Marcus ifrågasatte hela arbetssättet: *"VARFÖR tar det sådan tid att fixa
PDF:er? Håller proffs också på så här där varje liten trivial ändring i en PDF
ska ta 30-45 min?"* Svaret var nej.

DocRaptor är ett vanligt HTTP-API. Alla bitar fanns redan i repot
(`render-bilage-mall.mjs` fyllde mallen, `docraptor-sjalvbarande.mjs` bakade in
CSS/typsnitt/bilder, nyckeln låg i `.env.docraptor`) — det som saknades var
~40 rader lim. `docraptor-sjalvbarande.mjs` hänvisade till och med i sin egen
filkommentar till en `docraptor-minimaltest.mjs` som **aldrig byggdes**.

Med loopen (`npm run mall:pdf`, ~5 s) föll fyra hypoteser på tjugo minuter och
avslöjade rotorsaken: Prince saknar `align-self: stretch` för flex-items i
row-containers, och mallen låg mitt i luckan. Bilagan hade blivit **två sidor
oavsett innehåll** — 141 ord på sida 1 med 161 mm tomt under.

**Lärdomen:** `diagnosing-bugs` § fas 1 säger "bygg en tät, röd-kapabel
återkopplingsslinga FÖRE du försöker lösa något". Det steget hoppades över för
PDF-spåret därför att problemet lät litet — "bara en marginal". Kostnaden blev
synlig först när någon räknade deployarna.

Fråga vid varje spår som känns segt: **hur lång är slingan, och vad kostar ett
varv?** Är svaret minuter i stället för sekunder är det slingan som ska byggas
först, inte nästa hypotes.

Sidofynd som gjorde tolv deploys till en mätserie i stället för en insikt: den
mätserien mätte en flexbox-bugg. "Knivseggen" (varje 0,25 mm knuffar till två
sidor) och den icke-monotona padding→sidantal-kurvan var **symptom**, inte
egenskaper hos dokumentet.
