# Dokument-ytan — prototyp (S100, 2026-08-07)

Mer-ytan där bilagor förvaltas (`T131`; ORDLISTA § Bilaga: *"Dokument är YTAN i
Mer där bilagor hanteras"*). Byggd i samma session som åtgärds-sidan på
Marcus-beslut — bilageväljaren där visar det den här ytan förvaltar, och
designas väljaren utan biblioteket designas den baklänges (underlaget § 9).

Route: `/mer/dokument`. Bilder mot dev-server på `4173`, viewport 430×932
respektive 1280×1000; prototyp-växlarens rail bortdöljd.

| Fil | Visar |
|---|---|
| `v5-dokument.png` | Hela ytan — tre grupper, en per dokumentklass |
| `v5-dokument-desktop.png` | Samma i 1280 px |
| `v5-mer-index.png` | Mer-landningen med den nya Dokument-raden |

## Formen: tre grupper, en per klass — inte en lista med klass-märken

Klasserna är **strukturellt** olika, inte olika etiketter på samma sak:

| Klass | Vad den är | Har den en fil? |
|---|---|---|
| **A — uppladdad** | en PDF Lotta valt från datorn | ja, med storlek |
| **B — event-mallad** | ett brev som fylls med eventets uppgifter | nej, inte förrän ett event valts |
| **C — person-genererad** | byggs ur personens egna uppgifter | nej — och då **en per mottagare** |

En platt lista med ett klass-märke per rad påstår att skillnaden är en etikett.
Två av tre klasser har ingen storlek att visa, och klass C har inget bestämt
antal förrän mottagarlistan är känd. Just den missuppfattningen är vad som gör
bilageväljaren svår — så om biblioteket lär henne skillnaden behöver väljaren
inte göra det igen.

Grupptexterna är skrivna mot Gunilla-principen, utan domänord: *"Byggs på plats
ur personens egna uppgifter. Skickar du till sex personer skapas sex olika filer
— en åt var och en."*

## Avvägningen, öppet

Tre grupper där två har en enda post ser tunna ut, och **fördelningen mellan
klasserna är okänd** — ingen datakälla finns (`TASK-146` är inte byggd), så
innehållet är antaganden, inte mätning. Visar det sig att klass A rymmer tjugo
filer och B/C en var, är en lista med klass-filter (den avvisade formen)
rimligare. Det avgörs när ytan har data.

## Grammatiken är ärvd

Mer-undersidornas skal (`AnmalningarList`: `p-4`-sektion, "← Tillbaka till Mer",
`h1 font-semibold text-2xl` med antalsrad under) och eventsidans
grupp-grammatik (`DetaljGrupp` — rubriken utanför den tonala kortytan).
Mer-radens ikon är `Paperclip` = bilaga; `FileText` hade läst som "dokument i
allmänhet", vilket är precis det ORDLISTA varnar för.

## Mätt

`h1` 24 px (Mer-undersidornas grad, samma som Maillogg och Anmälningar) · tre
grupper renderade · 3 filrader, 1 mallrad, 1 generatorrad · sidhöjd 1240 px ·
noll sidfel, noll konsolfel.

**Vad som INTE är byggt:** ingenting skriver. Uppladdning, Ersätt och Visa är
stubbar — bilage-fundamentet (`TASK-146`) finns inte. Ytan ger fundamentet
tillbaka sin UI-konsument, vilket var utbrytningens öppna kostnad.
