# Amendering 2026-09-01 — Betalningskortet prövat och RIVET, gamla blocket tillbaka

**Yta:** hem-vyn V1 "Lugna morgonen" i
`tasks/sessions/bilagor/s102-hem-konvergens/facit.json` (Marcus 2026-08-17:
*"Hem-vyn ser bra ut, precis som prototypen."*, stämpel-SHA `8044e5b6`).
Skarp källa i dag: `src/components/hem/Hem.tsx`,
`src/components/hem/Genvagar.tsx`,
`src/components/hem/KvittojobbBanderoll.tsx`.

**Klass:** *ny form* — Marcus egna domar i iterationsloopen 2026-09-01
(grenen `fix/hem-betalningskort-marcus-iteration`), inte ett förhandsmandat.
Denna sidofil **överspelar** två tidigare i samma katalog; se § Vad som
händer med de tidigare sidofilerna.

---

## FÖRST: samma icke-innehållslåsta läge som sibling-posterna

Ytan **saknar `referenser`-nyckeln**, och manifestets `kallor` pekar på det
rivna prototyp-substratet (`src/routes/dev/hem-prototyp.tsx`,
`src/components/dev/hem-prototyp/*`) — alltså inte på `Hem.tsx`.
`scripts/check-facit.sh` kan därför inte fälla denna diff, med eller utan
sidofil. Mekanik-belägget står i
`AMENDERING-2026-08-31-betalningar-kortet.md` § FÖRST och upprepas inte här;
det är omätt oförändrat på denna gren:

```bash
bash scripts/check-facit.sh   # exit 0, före och efter
```

Verifierat på nytt 2026-09-01: ingen fil under denna ytas `kallor` finns i
`git diff --name-only main...HEAD`. Detta dokument är **bokföring**, inte en
grind-tvingad sidofil.

---

## Vad som hände, i två pass — och varför pass 2 river pass 1

### Pass 1 (`01255446`) — kortet fick sektionsgrammatik

`TASK-346.14` hade gett `BetalningarKort` hero-kortets form i miniatyr
(overline + displaytal + eget grått kortskal). Marcus dom: formen passar inte
in i hem-vyns design, rubriken ska vara "Betalningar" och inte "5 öppna",
ordet *öppna* säger inte vad som är öppet, påminnelseknappen härmar "Bekräfta
alla" utan att vara den, och blocket är så litet att det går att scrolla
förbi.

Grundorsaken var **fel granne kopierad**: hero-formen tillhör Morgonkollens
enda hero-block. Kortet fick därför husets sektionsgrammatik
(`NyaAnmalningar`/`Genvagar`) — `h2` "Betalningar" direkt på sidans yta,
nyckeltalen i klartext, personrader i `NyaAnmalningar`s radgrammatik, och
"Skicka påminnelse till alla" i sektionsspalten.

Det passet motsäger öppet `AMENDERING-2026-08-31-betalningskortets-formsprak-346-14.md`
punkt 1 (kortyta) och punkt 4 (overline), på Marcus dom.

### Pass 2A (`42f1edd6`) — hela kortet rivet

Marcus dom över pass 1, ordagrant:

> *"Nej det här håller inte. Lotta kommer bli så sjukt förvirrad."*

**Grundfelet var inte typografin utan att blocket blandade två jobb:** listan
visade ALLA öppna betalningar medan dess enda knapp ("Skicka påminnelse till
alla") opererade på delmängden i "Att påminna"-läget. Listan och knappen
svarade på olika frågor under samma rubrik, och ingen omdesign av formen kunde
laga det. Det gamla blocket har inte den tvetydigheten: dess tre grupper ÄR
påminnelse-modellens tillstånd, och knappen sitter i den grupp den opererar på.

Följden i koden:

| Vad | Efter pass 2A |
|---|---|
| `ForfallnaBetalningar` | renderas **OVILLKORLIGT** — miljöflagg-växeln mellan de två korten är riven |
| `BetalningarKort.tsx` | **borttagen från disk**, inte parkerad |
| "Registrera betalning" | flyttad till `Genvagar` som en tredje `HandlingsRad`-rad (`Banknote` → `/mer/betalningar`), villkorad på `betalningarPa()` |
| Kvittojobbets banderoll | egen komponent `KvittojobbBanderoll`, synlig endast medan ett jobb arbetar, flagg-gatad inuti sig själv |
| "K kvitton att skicka" | utgår helt från Hem — talet bor i inkorgen |

**Komponenten togs bort i stället för att parkeras** därför att en oanvänd
komponent på disk är en inbjudan att återinföra ett underkänt beslut.

**Genvägs-radens flagg-villkor är inte försiktighet utan nödvändighet:**
`/mer/betalningar` kastar `redirect` till `/mer` med flaggan av, så en
ovillkorlig rad hade varit en synlig genväg som studsar tillbaka. Prod är
därmed oförändrad tills flaggan slås på.

## Vad som ÄNDRAS i själva facit-ytan

Två saker som en läsare av facit-bilderna faktiskt ser:

1. **Genvägar har tre rader med flaggan på**, inte två (manuell anmälan ·
   Åtgärds-sidan · Registrera betalning). Med flaggan av — prod i dag — är
   den två, exakt som facit visar.
2. **Blockordningen har en ny post**: hälsning → Nästa event → Bevakningsrad →
   Nya anmälningar → **Förfallna betalningar** → **Kvittojobbs-banderollen** →
   Genvägar → Senaste aktivitet. Banderollen är av samma klass som
   Bevakningsraden — en yta som inte finns när det inte finns något att säga
   — och renderar `null` både i prod och i fixturvärlden.

## Vad som INTE ändrats

- **`ForfallnaBetalningar.tsx` är byte för byte orörd.** Samma props, samma
  tre tillståndsgrupper ("Att påminna" / "Väntar" / "Dags att ringa"), samma
  telefonnummer-rad.
- **Påminnelsesvepet i sin helhet** — `paminnelseRader`, `paminnelsesvepUrval`,
  `paminnelseAvgiftstyperByRegId`, `SvepOverlay` och `nyligenPaminda`. Det är
  verifierat i pass 2A att de alltid beräknades UTANFÖR flagg-villkoret, så
  flagga-PÅ-vägen är nu identisk med flagga-AV-vägen.
- **Laddläget** (`role="status"` + `aria-busy` + exakt ett `.sr-only` som
  börjar med "Laddar") och tomläget.
- **Bulk-knappens villkor** `harPaminnelser` — invarianten
  `tests/acceptance/svep-paminnelse-send.acceptance.test.ts` bevisar
  mekaniskt.

## Vad som händer med de tidigare sidofilerna i denna katalog

- **`AMENDERING-2026-08-31-betalningskortets-formsprak-346-14.md` är HELT
  ÖVERSPELAD.** Den beskriver formspråket hos en komponent som inte längre
  finns på disk. Filen är **inte raderad** — den bär i stället en huvudnot som
  pekar hit, eftersom den är beviset för att formen prövades innan den revs.
- **`AMENDERING-2026-08-31-betalningar-kortet.md` är delvis överspelad.** Dess
  § FÖRST (grind-mekaniken) gäller ordagrant och refereras ovan. Dess § "Vad
  som FÖRSVINNER med det gamla kortet" — den öppna frågan om "Dags att
  ringa"-gruppen — är **besvarad av pass 2A**: gruppen försvinner inte, för
  kortet som skulle ha ersatt den är rivet. Frågan är stängd, inte kvarstående.

## Testerna

Fixturvärlden kör med flaggan **av** (`playwright.config.ts`), så
acceptance-sviternas Genvägar-räkning och `h2`-ordning ser prod-formen och är
oberörda. `KvittojobbBanderoll` är flagg-gatad inuti sig själv i samma form
som `JobbLyssnare` (`enabled: false` ⇒ inget nätverksanrop i prod och i
fixturvärlden).

## Omstämplings-läge

**Inget är omstämplat, och inget stämpel-fält är rört.** `godkand` står kvar
med Marcus 2026-08-17-kvittens och SHA `8044e5b6`.

`bash scripts/check-facit.sh` → **exit 0**, före och efter.
