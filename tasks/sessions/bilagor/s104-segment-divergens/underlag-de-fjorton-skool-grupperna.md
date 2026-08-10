# Underlag — de fjorton Skool-grupperna (konvergensens verkliga målsegment)

> **Källa:** `~/Downloads/Inbjudningar-till-communityt.docx` (Marcus lathund
> till Roger/Lotta, juli 2026; fil-datum 2026-07-11). Extraherad med
> `textutil` 2026-08-10 vid S104-resume och landad här per PAUSLÄGE-ordern —
> `~/Downloads` är inte en durabel yta. Tabellen är återgiven VERBATIM;
> semantik-avsnittet är S104:s härledning och källmärks separat.

---

## Grupptabellen (verbatim ur dokumentet)

| Grupp | Antal | Kurskombination |
|---|---|---|
| 1 | 188 | RIM1 |
| 2 | 59 | Fjärrskådning |
| 3 | 39 | Psionautics |
| 4 | 34 | RIM1 + RIM2 |
| 5 | 30 | Fjärrskådning + RIM1 |
| 6 | 24 | Fjärrskådning + RIM1 + RIM2 |
| 7 | 14 | Alla fyra kurserna/eventen |
| 8 | 9 | RIM1 + Psionautics |
| 9 | 8 | RIM1 + RIM2 + Psionautics |
| 10 | 3 | Fjärrskådning + RIM1 + Psionautics |
| 11 | 3 | Fjärrskådning + Psionautics |
| 12 | 3 | RIM2 |
| 13 | 1 | RIM2 + Psionautics |
| 14 | 1 | Fjärrskådning + RIM2 |
| **Σ** | **416** | Totalt antal inbjudningar |

Dokumentets egna semantik-meningar, verbatim:

> *"Varje person ligger i den grupp som motsvarar exakt hens kombination av
> kurser."*

> *"Varje person förekommer i exakt EN grupp, så ingen får dubbla
> inbjudningsmail (jag har testat: Skool skickar ett mail per uppladdning man
> är med i)."*

> *"Totalt har 417 personer gått en eller flera utbildningar hos er (inklusive
> Psionautics), och 416 av dem har en e-postadress — så 416 inbjudningar går
> ut."*

## Semantiken — vad "exakt kombination" betyder för grammatiken (S104-härledning)

- En grupp är **snittet av sina kurser MINUS alla övriga**: grupp 5
  (Fjärrskådning + RIM1) = `med` FS **OCH** RIM1 · `utan` RIM2, Psionautics.
  Grupp 1 (RIM1) = `med` RIM1 · `utan` FS, RIM2, Psionautics — "RIM1" i
  tabellen betyder *enbart* RIM1.
- Grupperna är därmed **disjunkta per konstruktion** — en äkta partition av
  populationen "≥1 av de fyra kurserna".
- Fyra kurser ger **15 icke-tomma kombinationer**; dokumentet listar 14.
  Den saknade är **Fjärrskådning + RIM2 + Psionautics** — obefolkad (0
  personer). En partition-generator över dimensionerna
  {RIM1, RIM2, Fjärrskådning, Psionautics} × modalitet Utbildning ska alltså
  ge exakt de fjorton när tomma grupper utelämnas.
- **AND-behovet** (Del 3-fyndet): grupperna 4–11, 13, 14 — 10 av 14, 127 av
  416 personer — kräver konjunktion i `med`. `utan`-sidan (exklusiviteten)
  bärs redan av dagens grammatik.
- Modalitet: dokumentet utelämnar föreläsning helt; de fjorton är
  **Utbildning** rakt igenom (Del 3 § Modalitets-frågan).

## Övrigt ur dokumentet med relevans för bygget

- Skool-uppladdningen sker som **en CSV-fil per grupp** (Skools bulkformat),
  en åt gången, med gruppens "mentala ankare" ibockade per uppladdning.
- Utskickssekvensen var: Instagram-video → personligt mail via Resend →
  Skools "Join"-mail. Resend-spåret ägde utskicket i juli; admin-appens
  segment-yta är arvtagaren — det är därför de fjorton är konvergensens
  verkliga innehåll.
