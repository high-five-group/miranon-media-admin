# ADR-113: Laddtrappan — yttrappa ersätter det ovillkorade indikator-förbudet

- **Status:** Accepted
- **Datum:** 2026-08-15
- **Fas:** Go-live (Lotta-vandringen, S102)

## Kontext

Designsystem-specens §15 bar regeln *"'Laddar…'-textrader och spinners
används inte"* som app-bred, ovillkorad norm. S102-forensiken
(sessionsdok S102 Del 7) spårade regelns kedja: Marcus S62-beslut
underkände "Laddar…"-textradernas LAYOUT-SKIFT; skeleton-formen
kvitterades i S63-grillningen (5/5 beslut); men spinner-FÖRBUDET
syntetiserades som implementationsbeslut 9 i PRD:n (scopat till Hem) och
utvidgades app-brett först i spec-skrivningen — utan explicit Marcus-GO.
Koden motsade dessutom redan regeln: sex auth-ytor bär knapp-interna
submit-spinners.

Research-passet
([`loading-indikator-branschpraxis-2026-08-15.md`](../research/loading-indikator-branschpraxis-2026-08-15.md))
gav delad dom: textrads-förbudet håller bortom branschgolvet (ingen källa
sanktionerar naken text som enda laddbesked), men "aldrig spinner,
skeleton överallt" är en övergeneralisering — NN/g, Material 3, Polaris,
Carbon och Apple HIG behandlar skeleton/spinner/bar som komplementära
verktyg per yttyp, och Carbon förbjuder uttryckligen skeleton i modaler,
toasts och menyer. Det starkaste försvaret för den strikta regeln
(enkelhet för underhållaren) prövades öppet i grillningen och föll:
trappan är fyra rader, och den beskriver vad koden redan gör.

## Beslut

Spec §15 nyanseras till en YTTRAPPA (Marcus-kvitterad S102 Del 7,
beslut 7–9):

1. **Skeleton** — vyer och moduler med känd geometri (Lugnt laddläge-
   principen orörd: slutlig geometri från första bildrutan).
2. **Spinner** — ENDAST knapp-internt i arbetande knappar (submit,
   mutation), levererad via Button-primitivens nya `isLoading`-prop:
   spinner + spärrat klickläge + skärmläsarbesked byggs in EN gång på
   biblioteksnivå. De sex handkodade auth-ställena migreras till propen.
3. **Determinate progress-bar** — längre kända flerstegsförlopp
   (Förberedelseskärmen, [ADR-112](ADR-112-forberedelseskarmen-blockerande-startvarmning.md),
   är appnivå-instansen).
4. **ALDRIG naken "Laddar…"-textrad** som enda laddbesked — Marcus
   S62-beslut är trappans orörda golv. Sr-only-besked parat med synlig
   indikator är fortsatt normformen.

En mekanisk fix-våg migrerar de 32 produktionsfiler som ännu bär
textrads-formen till trappans rätta steg.

## Konsekvenser

- Auth-ytornas knapp-spinners går från odokumenterat regelbrott till
  regelrätt trappsteg 2 — koden var branschkorrekt, spec-texten fel.
- Spec §15 och ORDLISTA-posten "Lugnt laddläge" (vars *Undvik:*-rad sade
  "spinner" ovillkorat) skrivs om i fix-vågens första skiva.
- ADR-078 (INSTANT-regeln) består orörd — trappan styr VAL av indikator
  när laddning syns, inte MÅLET att laddning helst inte ska synas.
- Regeln har nu ett spårbart beslutsunderlag (forensik + källbelagd
  research + kvitterad grillning) i stället för en ärvd generalisering —
  framtida omprövning ska ske mot dessa källor.
