---
owner: marcus803
updated: 2026-08-06
review_by: 2026-11-06
status: stable
lifecycle: paused
---

# T130 — Appens pillar har tre storlekar, två av dem oavsiktliga

> **Registrerad** 2026-08-06 (S93, iterationsvåg 16) på Marcus order:
> *"samma sak med pillar som med knappar. Vi måste inventera alla pillar vi har
> i appen och sätta en standard på storlekar färg och allt sånt. […] Jag vill ju
> att alla pills håller en konsekvent utseendemönster i de olika 'miljöerna'."*

## Hur den upptäcktes

Betalningsvyns personkort kom att visa tre pillar bredvid varandra —
`Obekräftad` (`StatusBadge`), `Manuellt tillagd` (kategori) och
`Mottagen 25 juli` (datum). Marcus såg direkt att de inte hörde ihop:

> *"'Obekräftad' är störst och har fetstilt, den är ju hämtad från
> anmälan-detaljsidan där det passar bra i det utförandet. Den passar inte lika
> bra i denna miljö."*

Diagnosen höll: `StatusBadge` skrevs för anmälnings-detaljsidans **header** och
användes sedan i betalningsvyns **lista**, bredvid pillar i ett mindre steg.

## Inventeringen (grep över `src/`, 2026-08-06)

23 status-/metadata-pillar (`rounded-full` + padding). Knappar (`px-3.5 py-2`
med `hover:`) och räknar-badges (`h-4 min-w-4`) är bortsorterade — knapparna är
`T125`:s domän.

**Skalan fanns redan de facto. Den saknade bara namn, och därför drev den.**

| Form | Antal | Var |
|---|---|---|
| `px-2 py-0.5 text-caption` | 9 | `Deltagare` 1017/1040/1259 · `Gruppdynamik` 112 · `PersonsListPrototyp` 144 · `PersonDetailPrototyp` 113 · `DeltagareHallplatsPrototyp` 71 · `Betalningar` 859/864 |
| `px-2.5 py-1 text-small` | 6 | `StatusBadge` 22 · `AnmalanDetail` 343 · `Deltagare` 1779/1880 · `Betalningar` 1060 · (+ `EventDetail` 255 i `px-3`-variant) |
| `px-2.5 py-0.5 text-caption` | 3 | `NastaEventCard` 131 · `EventCard` 191 · `AnmalanDetail` 475 |

Plus fyra avvikare som inte passar någon form:

- `AnmalanDetail` 329 och `EventDetail` 255 — `px-3 py-1` (bredare än `md`)
- `CheckinPrototyp` 365 och 689 — `px-1.5 py-0.5` **utan `font-medium`**

**Den tredje formen är den intressanta.** `px-2.5 py-0.5 text-caption` sitter
mellan de två andra — `md`:s bredd med `sm`:s höjd — och alla tre förekomsterna
är status-slottar på kort. Frågan tråden måste svara på är om den är ett
LEGITIMT tredje steg (kort-miljö, skild från både lista och detaljsida) eller
en drift som ska absorberas. Den avgörs inte här.

## Vad som redan är gjort (S93 våg 16 — ENDAST betalningsvyn)

1. **`StatusBadge` fick `storlek?: 'sm' | 'md'`**, default `'md'`.
   Anmälnings-detaljsidan (facit-låst 2026-07-24, *"Lås den"*) renderar därmed
   identiskt — verifierat i browsern efteråt: `Obekräftad` 31 px / 14 px font /
   `py-1`, som förut.
2. **En tredje regel upptäcktes genom mätning:** varje pill måste bära
   `border border-transparent`. Kanten ritas aldrig normalt men reserverar sin
   px, så `contrast-more` kan tändas utan layouthopp OCH en pill med kant får
   identisk ytterhöjd som en utan. Utan regeln mättes `StatusBadge` till 24 px
   bredvid två kantlösa pillar på 22 px — på samma kort.
3. **Resultat, mätt** (Maria Holms kort, `?variant=a&data=proto`, 430 px):
   `Obekräftad` · `Manuellt tillagd` · `Mottagen 25 juli` — samtliga **24 px
   höjd, 12 px font, 8 px padX, 1 px transparent kontur**.

## Färgfrågan, delvis besvarad

En neutral pill kan inte fyllas så att den syns mot `bg-bg-muted`: palettens
neutraler ligger på 245/237/250/255, vilket mot muted botten ger `bg-surface`
1.09, `bg-bg-emphasized` 1.07, `bg-bg-subtle` 1.04. Marcus avvisade kontur som
lösning (*"Jag vill inte ha kontur på pillen"*).

Svaret blev `bg-surface` — appens etablerade neutrala pill mot muted underlag
(`EventCard` 191, `NastaEventCard` 131, `AnmalanDetail` 475 kör alla exakt den,
och ingen har rapporterats osynlig). **Det som var trasigt var 1.00** — muted på
muted, noll kontrast — inte 1.09.

Kvar att avgöra: om paletten ska få en neutral fyllningston avsedd för pillar på
muted underlag, eller om regeln *"neutral pill = `bg-surface`, och den står
aldrig på vitt"* räcker. Den andra vägen är billigare och kräver ingen ny token.

## Vad som INTE är gjort

Standarden är kodad i `StatusBadge` men **inte utrullad**. De övriga ~20
förekomsterna i tabellen ovan är orörda och bär fortfarande sina handrullade
klass-strängar.

## Nästa steg

1. **Avgör den tredje formens status** (`px-2.5 py-0.5`) — legitimt kort-steg
   eller drift? Frågan styr om skalan blir två eller tre steg.
2. **Avgör färgregeln** — ny token, eller `bg-surface` + placeringsregel.
3. **Promovera `StatusBadge` till `primitives/`.** Den är märkt
   `[BIBLIOTEKS-KANDIDAT]` med promovering *"vid andra konsumenten"*, och
   betalningsvyn ÄR den andra. Promoveringen är alltså redan förfallen,
   oberoende av denna tråd. `Tidslinje` är i exakt samma läge av samma skäl
   (S93 våg 11).
4. **Migrera förekomsterna** — mekanisk, en fil i taget, mot den beslutade
   skalan.
5. **Överväg en grind** som fäller på handrullad `rounded-full`+padding utanför
   primitiven, annars driver skalan isär igen. Samma resonemang som `T125`.

## Besläktad

`T125` (**samma klass, för knappar** — `Button`-primitiven mot handrullade
piller; registrerad ur samma prototyp-pass fyra dagar tidigare, och dess
"jobbet är mindre än det låter"-analys gäller ordagrant även här: primitiven
finns, uppgiften är migrering, inte design) · `T119` (mekaniserings-programmet
— steg 5 hör dit) · `ADR-021`/`DESIGN-SYSTEM-SPEC` §1 (3-lagers token-systemet
— en ny pill-token hör i `components.css`, aldrig i en komponent).
