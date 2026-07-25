# S90 — Persondetaljen, DIVERGENS-pass

**Frågan som prototypen besvarar:**

> "Hur ska persondetalj-sidan arrangeras — vad är sidans huvudsak?"

TRE strukturellt olika arrangemang, `?variant=a` · `?variant=b` · `?variant=c`.
**Du väljer EN.** Prototypkoden bor i
`src/components/persons/PersonDetailPrototyp.tsx` + prototyp-grenen i
`src/routes/_authenticated/personer/$personId.tsx` — kastbar, DEV-grindad,
aldrig befordrad (throwaway-kontraktet klausul iv).

Justeringar du vill ha på den valda varianten blir **byggkrav på kortet** —
prototypen itereras inte i valfasen. Är du missnöjd med hela skelettet du valt
är det i stället ett konvergens-pass.

---

## Så här läser du bilderna

| Filnamn | Vad |
|---|---|
| `<v>-rik-mobil.png` · `<v>-tunn-mobil.png` | **430 px**, hela sidan. Lottas verkliga arbetsläge. |
| `<v>-rik-desktop.png` · `<v>-tunn-desktop.png` | **1440 px**, hela sidan. (Appens innehållsspalt är låst till 600 px — desktop är samma spalt centrerad, inte en bredare layout.) |
| `<v>-rik-mobil-topp.png` | Endast **det som syns utan att scrolla** på 430 px. Tre bilder, en per variant. Frågan "vad är sidans huvudsak?" avgörs i praktiken här. |

**Två personer, båda ur den frusna fixturvärlden** (live-verifierade fältformer
ur prod 2026-07-26):

- **RIK** — Ingrid Isaksson: 10 deltaganden över 5 event (varav ett kommande),
  3 lead-hämtningar, lång motivering, lång anteckning, AI-flagga, båda
  community-flaggorna, 3 orter.
- **TUNN** — namnlös lead med **enbart e-post**. Tomtillståndet är en del av
  designen, inte ett specialfall: det är så en färsk lead ser ut, och det är där
  varianterna skiljer sig mest.

**Bortmaskat i bilderna:** tab-baren och prototyp-railen (båda `fixed`, ritas
mitt i en helsidesbild) samt devtools-knapparna. Dessutom är fokusringen på
`<h1>` bortblinkad före bilden — vyn flyttar fokus dit när data anlänt (WCAG),
beteendet är identiskt i alla tre och i skarpa vyn, men ringen drar hela
blicken i en helsidesbild.

---

## De tre varianterna

### A — HISTORIK-FÖRST · "vem är detta för oss?"

`a-rik-mobil.png` · `a-rik-mobil-topp.png` · `a-tunn-mobil.png`

**Arrangemang:** identitet → **engagemangs-summering** (tre tal + kursmixen som
mätarspår) → **kurshistoriken som sidans huvudyta** → kontakt → nuläge → leads →
anteckningar.

Historiken är grupperad **per EVENT**, inte per session. Det är inte kosmetika:
ett tvådagars-event ger två deltagande-rader, så dagens vy visar Ingrid som tio
poster när hon i verkligheten varit på fem event. Varje event bär sina sessioner
som pillar (`Dag 1 · Närvarande`, `Dag 2 · Frånvarande`).

**Optimerar för:** att förstå en person. Kursmixen (Psionautics · Fjärrskådning ·
RIM 2 · RIM 1) syns på en sekund, liksom att hon har ett kommande event.

**Offrar:** snabbheten. Vill du bara mejla henne måste du scrolla förbi hela
historiken. Och `a-tunn-mobil.png` visar priset: för en lead är sidans huvudyta
ett tomtillstånd, och sidan öppnar med tre nollor.

---

### B — KONTAKT-FÖRST · "hur når jag hen och vad behöver jag veta nu?"

`b-rik-mobil.png` · `b-rik-mobil-topp.png` · `b-tunn-mobil.png`

**Arrangemang:** tät identitetszon (namn, ort, nivå) → **kontakt som HANDLINGAR**
(Skicka mail · Ring, med chevron eftersom raden leder vidare) → **"Just nu"** i
tintat kort → "Att känna till" (flaggorna) → kurshistoriken komprimerad till tre
rader → leads → anteckningar.

**Optimerar för:** handling. På 430 px ryms hela kontakten, hela nuläget och
flaggorna ovanför vecket (`b-rik-mobil-topp.png`) — Lotta kan ringa utan att
scrolla en enda gång.

**Offrar:** djupet. "Vem är detta för oss" besvaras inte, bara "vad gör jag nu".
Varianten är dessutom **hårt beroende av fält som saknas** — se
[Vad som saknades](#vad-som-saknades-i-datat) nedan: `Nästa event` är i praktiken
alltid tomt i drift, och betalstatusen — det som skulle göra kortet verkligt
handlingsbart — bor på Anmälningar och finns inte i persondetaljens svar. Kortet
är alltså **byggt på sin bästa dag**; i drift är det tunnare än bilden visar.

**Men:** `b-tunn-mobil.png` är den enda av de sex tunna bilderna som ser
*meningsfull* ut. En lead har en e-post, och B gör den till en knapp.

---

### C — TIDSLINJE · "vad har hänt med den här personen?"

`c-rik-mobil.png` · `c-rik-mobil-topp.png` · `c-tunn-mobil.png`

**Arrangemang:** identiteten krymper till en remsa → den **odaterade
anteckningen** fastnålad → **strömmen**: allt daterbart i en kronologisk lista,
nyast överst, "Kommande" som egen grupp överst och därefter årsrubriker →
**"Utanför tidslinjen"**: allt som inte går att datera, ärligt samlat i stället
för insmuget på fel plats.

Prickarna bär kursfärgerna (§17-tokens) för event, dämpad ton för hämtningar och
touchpoints, ihålig ring för kommande. Färgen är förstärkning — texten bär
alltid.

**Optimerar för:** berättelsen. `c-rik-mobil.png` visar hela relationen från
"Kom in i registret 14 aug. 2024" till det kommande eventet i september 2026 —
inklusive att hon hämtade Pyramidernas Vajrar två gånger med två års mellanrum.
Det ser ingen annan variant.

**Offrar:** överblicken över tal och status (de hamnar i botten-kortet), och
kontaktvägen ligger som en textremsa utan handlingar.

**C:s ärliga svaghet:** EF:en levererar bara **en av fyra** strömtyper som
riktiga poster. Se nedan.

---

## Vad som saknades i datat

Uppdraget var att fylla alla tre med **verkligt** data. Det gick — men fyra
luckor styrde vad som gick att bygga, och de påverkar varianterna olika:

| Lucka | Vad den betyder | Drabbar |
|---|---|---|
| **Anmälningarna har inga datum** i persondetaljens svar. Ingrid har sex — vi vet bara antalet. | Sex av personens viktigaste händelser kan aldrig stå i en tidslinje utan EF-utökning. | **C hårt** (posterna hamnar i "Utanför tidslinjen"), A/B knappt. |
| **Hämtningarna är en text-rollup**, inte poster. Datumen ligger inuti strängen: `"Pyramidernas Vajrar (2026-06-09)"`. | Prototypen plockar isär strängen med regex för att FORMEN ska gå att pröva. Det är ett medvetet begånget anti-mönster, loud-kommenterat i koden — **inte** något som får följa med till skarpt bygge. I prod är rollupen dessutom en ARRAYJOIN-klump i ETT element. | **C** (två av tio strömposter). |
| **`senasteInteraktion` är en färdigformaterad klump** som bär sitt eget datum i texten. | I strömmen dubbleras datumet ("12 sep." på rälsen, "2026-09-12 18:04 – Inskickad anmälan" som rubrik). Det är inte slarv i bilden — det är beviset för att fältet aldrig designats för en tidslinje. | **C** synligt, A/B osynligt. |
| **`Nästa event` är i praktiken alltid tomt.** EF:en läser `Nästa event (text)`; basen bär `Nästa event (rad)`. | Fixturens värde är **medveten fiktion** så formen går att pröva. I drift försvinner raden. | **B** — "Just nu"-kortet tappar sin mittersta rad. |

Ingen variant fejkar innehåll för att fylla ut. Det som inte fanns står som
tomtillstånd eller i "Utanför tidslinjen".

---

## Anteckningen (task-43-klassen)

Fältet är **EN odelad multilineText utan författare och utan tidpunkt** — "vem
skrev detta, när?" går inte att besvara. Det är visat som det är i alla tre.
Konsekvensen om fältet får författare + tidpunkt (ADR-075-mönstret utvidgat):

- **A** — nästan opåverkad. Anteckningarna blir en kort-lista i sista sektionen;
  arrangemanget står kvar.
- **B** — vinner mest per rad. En daterad anteckning ("Roger, 12 sep: ringde om
  platserna") hör hemma i **"Just nu"**-kortet, inte i botten. Sektionen längst
  ned kan då bli en historik-lista och det senaste lyfts upp.
- **C** — **förändras strukturellt.** Anteckningarna slutar vara fastnålade
  utanför rälsen och blir strömposter som vilka andra som helst. C är den enda
  variant där task-43 inte är en förbättring utan en förutsättning: så länge
  anteckningen är odaterad ljuger tidslinjen om att den innehåller "allt som
  hänt".

---

## Delat problem, inte en variant-skillnad

Den tunna personens `<h1>` lyder **"Ej tillgängligt"** i alla tre. Det är inte en
platshållare vi hittat på: basens `Namn` är en formel som skriver just den
strängen när båda namnfälten är tomma, så vyns fallback ("Namnlös person —
e-post") når aldrig fram i drift. Syns i `a-tunn-*`, `b-tunn-*`, `c-tunn-*`.
**Rätta det oavsett vilken variant som vinner** — det är en rad kod, och en
sidrubrik som säger "Ej tillgängligt" är en av de fulaste sakerna i appen.

Tre defekter är däremot **redan dödade** i alla tre varianterna, och det är
byggkrav oavsett vinnare:

1. **"Ej närvaro" på framtida event.** Dagens vy skriver `narvaro ? 'Närvarande'
   : 'Ej närvaro'`, och `narvaro` är alltid falskt för kurser som inte hänt än.
   Alla tre härleder ett tredje läge — **Kommande** — ur datumet.
2. **`Aktiv anmälan: Ingen aktiv anmälan`.** Fältet är en formel som ger "Aktiv"
   ELLER "Ingen aktiv anmälan" och är aldrig tomt. B jämför mot strängvärdet.
3. **Dubbelräkningen av tvådagars-event.** A och C grupperar per event; B visar
   "5 event totalt · 4 genomförda".

---

## Min rekommendation

**B — kontakt-först — som skelett, med A:s historik-yta inbyggd som sektion 4.**

Motiv, i den ordning jag tror de väger:

1. **Ovanför vecket avgör.** Jämför de tre `-topp`-bilderna. B ger Lotta hela
   kontakten, hela nuläget och flaggorna utan en enda scroll. A ger tre siffror
   och en färgstapel; C ger en anteckning och rubriken "Historik". Persondetaljen
   nås oftast som ett *uppslag mitt i något annat* — "vem är det som ringer",
   "vad hette hens mejl" — och då vinner den variant som svarar först.
2. **B är den enda som håller för en lead.** Ungefär hälften av Personer-basen är
   leads utan historik. `b-tunn-mobil.png` mot `a-tunn-mobil.png` är den
   tydligaste bilden i hela bilagan: A öppnar med tre nollor och ett tomt kort,
   B öppnar med en knapp som gör något.
3. **A:s starkaste del är en SEKTION, inte ett skelett.** Kursmixen och den
   event-grupperade historiken är det bästa som byggdes i det här passet — men
   de förlorar ingenting på att ligga som sidans fjärde block i stället för dess
   andra. B:s komprimerade tre rader är i så fall det som ska bytas ut.
4. **C är för tidigt.** Den är den vackraste av de tre och den enda som visar
   relationen som en berättelse — men tre av fyra strömtyper kräver EF-arbete
   innan den är sann, och den fjärde (anteckningarna) kräver task-43. Att välja C
   nu är att välja en vy som blir riktig först om två datavertikaler. **Registrera
   den som en tråd i stället för att kasta den** — den dag touchpoints levereras
   som poster är C den självklara persondetaljen.

**Om du inte håller med om 1:** då är A rätt val, inte C. A och B är oense om
*ordningen*; C är oense om *vad datat är*, och den oenigheten kan inte lösas i
en designfråga.

---

## Så kör du dem själv

Dev-servern, sedan:

```
/personer/recVisualPers00009?variant=a   ← rik person
/personer/recVisualPers00017?variant=b   ← tunn lead
```

Prototyp-railen (höger kant) växlar mellan a/b/c och tillbaka till skarpa vyn.
ID:na ovan finns bara i fixturvärlden — mot staging använder du valfri riktig
person, men då gäller luckorna i tabellen ovan på riktigt (och `motivering`
kraschar vyn, se nedan).

**Varning inför skarp verifiering mot staging:** persondetaljen kraschar i dag
för varje person som har en motivering — `Motivering (text)` är en **array** i
prod medan schemat kräver en sträng (ZodError → "Kunde inte hämta
persondetaljer"). Fixturen är medvetet schema-trogen så vyn går att rita. Buggen
är oförändrad och ligger utanför det här passet.
