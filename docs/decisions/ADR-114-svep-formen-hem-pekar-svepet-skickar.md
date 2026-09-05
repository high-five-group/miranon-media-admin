# ADR-114: Svep-formen — hem pekar, svepet skickar

- Status: Accepted (grillad samsyn S102 Del 8, 2026-08-15 — Marcus
  kvittens "Kvitterar." ×2; ADR-kandidaturen bokad i Del 8:s
  ADR-bedömning och inlöst vid svep-PRD:ns publicering 2026-08-16,
  skarv-kvittens "Kvitterar skarv-valet, publicera")
- Datum: 2026-08-16
- Fas: Session 102 — hem-vyns omdesign (ingen byggfas-status-ändring)

## Kontext

Hem-vyns omdesign (Morgonkollen) ger Lotta två bulk-ingångar: "Bekräfta
alla" (nya anmälningar) och "Skicka påminnelse till alla" (förfallna
betalningar). Båda spänner över FLERA event samtidigt — och massutskick
utan granskning är otänkbart i den här domänen: fel mail till fel person
skadar förtroendet för hela verktyget.

Åtgärds-sidan bär redan en beprövad trygghetstriad för sändningar
(adresslista · förhandsvisning · testmail), så den första
rekommendationen i grillningen var att låta hemmets knappar peka dit.
**Marcus UX-invändning fällde den vägen öppet:** Åtgärds-sidan är
per-event, så ett svep över sju event hade betytt sju separata
triad-genomgångar — ohållbart som morgonrutin. Alternativet "skicka
direkt utan granskning" prövades aldrig på allvar (triaden är
icke-förhandlingsbar i domänen).

Ett tredje alternativ — bulk-sändning per event inne i varje events yta
— hade bevarat triaden men splittrat morgonjobbet på N sidbyten; det
föll på samma invändning som Åtgärds-sids-vägen.

## Beslut

1. **Hem PEKAR, svepet SKICKAR.** Hem-vyn verkställer aldrig själv;
   dess bulk-knappar öppnar en dedikerad sändyta. Omvänt äger sändytan
   ingen egen upptäckt — dess urval kommer från hemmets peknings-moment.
2. **Svepet är en CROSS-EVENT-sändyta med EN trygghetstriad för hela
   svepet:** adresslista grupperad per event · bläddringsbar
   per-event-förhandsvisning · testmail till avsändaren själv. Triaden
   tummas aldrig — den är svepets existensberättigande, inte ett steg
   som kan effektiviseras bort.
3. **Ett sändanrop per event-grupp under huven.** Granskningen är
   cross-event men sändningen respekterar event-gränsen — fel och
   delresultat kan därmed rapporteras per event.
4. Bekräftelsesvepet och påminnelsesvepet är två instanser av SAMMA
   form (egen PRD, "Sveparna"); påminnelsesvepets urval styrs av
   en-påminnelse-modellen (S102 Del 10).

## Konsekvenser

- En framtida byggare som routar hemmets bulk-knappar till Åtgärds-sidan
  eller till direktsändning bryter detta beslut — det är exakt den
  koherens-återställnings-kostnad som motiverar ADR-formen.
- Sändytan blir en ny yta att underhålla, med egen laddläges- och
  tillgänglighetsribba (DESIGN-SYSTEM-SPEC §15, ADR-078).
- `useConfirmAll`-mönstret återuppstår med svepet som första nya
  konsument (revs korrekt i 201.18 när konsumenterna var noll).
- Övergången hem ↔ sändyta är en del av formen (Marcus WOW-krav
  2026-08-16), inte efterpolish — den specas i svep-PRD:n.

## Källor

- Grillad samsyn: `tasks/sessions/archive/2026-08/2026-08-10-session-102.md` Del 8
  (SVEPARNA-blocket + ADR-bedömningen) och Del 10
  (en-påminnelse-modellen).
- Svep-PRD:n: backlog-kortet "PRD: Sveparna — cross-event-sändytorna"
  (publicerat i samma landning som denna ADR).
- Triadens förebild: Åtgärds-sidans send-flöden och deras
  acceptance-sviter (`tests/acceptance/atgarder-*-send.acceptance.test.ts`).
