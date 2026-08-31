# Amendering 2026-08-31 — Åtgärds-sidan under hållplats-facitet berörs också (TASK-346.7)

**Yta:** `atgarder` i `tasks/sessions/bilagor/s93-hallplats-prototyp/facit.json`
(Marcus 2026-08-10: *"Ser bra ut"*, stämpel-SHA `e25efd05`). Ytans `kallor`:
`src/components/events/detail/Atgarder.tsx` **och**
`src/components/events/atgarder/AtgardsSida.tsx`.

**Klass:** *ny form, förhandsmandat S113 Del 11 (B3)* — PRD `TASK-346`
§ Ytorna (beslut 10), skivans AC #2.

---

## Varför denna fil finns — en divergens mot uppdraget

`TASK-346.7` AC #1/#2/#4 och DoD #8/#9 räknar upp **tre** facit-kataloger som
ska bära en AMENDERING-sidofil: `s102-hem-konvergens`,
`s93-atgardssida-promovering` och `s103-persondetalj-konvergens`.

**Det är en katalog för lite.** `AtgardsSida.tsx` är `kallor` i **två**
stämplade manifest, inte ett:

```bash
node -e "…"  # över tasks/sessions/bilagor/*/facit.json
# s93-atgardssida-promovering · ytorna atgarder-tomt-lage / -mottagarurval /
#   -granskning        → src/components/events/atgarder/AtgardsSida.tsx
# s93-hallplats-prototyp · ytan atgarder
#   → src/components/events/detail/Atgarder.tsx,
#     src/components/events/atgarder/AtgardsSida.tsx
```

Uppdraget namngav bara den första. Skivan ändrar filen, alltså berörs båda —
och `ADR-102`-disciplinen ("varje ändring under ett stämplat facit bär en
sidofil") gäller lika mycket för den katalog ingen råkade räkna upp. Filen
skrivs därför, och divergensen rapporteras i stället för att byggas vidare på
(`ADR-086`).

**Grinden tvingar den inte.** Ytan saknar `referenser`-nyckeln precis som de
tre andra, så `scripts/check-facit.sh` kan inte fälla diffen — se
`s102-hem-konvergens/AMENDERING-2026-08-31-betalningar-kortet.md` § FÖRST för
mätningen. Detta är bokföring, inte en grind-tvingad sidofil.

---

## Vad som ändrades i den fil denna yta delar

Ändringen är **densamma** som beskrivs i
`s93-atgardssida-promovering/AMENDERING-2026-08-31-lasande-kryss-och-betalningsblock.md`
— den upprepas inte här, den refereras:

1. Kryssen Anmälningsavgift/Slutbetalning blir **läsande** (`isReadOnly`) med
   miljöflaggan på.
2. Gamla **"Skicka kvitto"-dialogen** renderas inte med flaggan på.
3. Ett nytt **betalningsblock per person** (saknas-belopp, Registrera
   betalning, inbetalningsrader med kvittostatus) monteras sist i varje
   persons kort.

Allt tre gäller **enbart** med `betalningarPa()` sann. Med flaggan av — alltså
i prod i dag — är `AtgardsSida.tsx` byte för byte dagens.

## Vad som INTE ändrats i DENNA ytas eget innehåll

Hållplats-facitets `atgarder`-yta handlar om **ingången** till åtgärderna från
eventdetaljen:

- **`src/components/events/detail/Atgarder.tsx` är helt orörd** av denna
  skiva. Ingen rad, ingen import, ingen prop.
- **Åtgärds-sidans sidhuvud, eventväljare, mottagar-yta, åtgärdsmeny,
  arbetsyta och granskningssida** — samtliga orörda. Det ändrade ligger inuti
  betalningspanelen ("Pricka av och notera"), som fälls ut separat.

## Systerytan `betalningar` i SAMMA manifest är också orörd — och det är ett beslut

Manifestets yta `betalningar` pekar på `src/components/events/detail/Betalningar.tsx`,
alltså eventsidans "Öppna detaljer". Skivans **AC #5** lyder: *"Eventsidans
'Öppna detaljer' visar samma härledda läge läsande."*

**Ingen kodrad är ändrad där, med avsikt.** Ytan uppfyller redan AC:n genom
komposition: `BetalningsLasRad` renderar sina kryss `disabled` och läser
`registration.anmalningsavgift`/`slutbetalning` — och sedan `TASK-346.4` ÄR de
två fälten den app-skrivna spegeln av härledningen (ADR-128 beslut 5). Ytan
visar alltså härlett läge, läsande, utan en ändring.

**Det övervägda tillägget avvisades av ett Marcus-beslut, inte av bekvämlighet.**
Att lägga till ett saknas-belopp per person hade varit den naturliga
förstärkningen — men höger-slotten "Saknas" revs på din uttryckliga order
2026-08-06, citerad verbatim i filens eget docblock (`Betalningar.tsx`
rad ~261):

> *"'Saknas' kan vi ta bort också … 'Mottagen' … säger ju bara exakt samma sak
> som kryssrutan"*

och beslutet är dessutom mekaniskt låst av ett negativt bevis:

```ts
// tests/e2e/mark-paid.staging.test.ts:461
await expect(arbetsytan(page).getByText('Saknas', { exact: true })).toHaveCount(0);
```

Att återinföra ordet hade rivit ett av dina beslut som **sidoeffekt av ett
annat korts AC**. Det är precis den klass av ändring som ska stanna och
frågas, inte utföras på eget bevåg. **Öppen fråga till morgongranskningen:**
räcker de disablade kryssen som "härlett läge läsande" på eventsidan, eller
vill du ha saknas-beloppet tillbaka just där — och i så fall som en ny form,
inte som en återställning av den rivna slotten?

## Omstämplings-läge

**Inget är omstämplat, och inget stämpel-fält är rört.** `godkand` står kvar
med din 2026-08-10-kvittens och SHA `e25efd05`.

`bash scripts/check-facit.sh` → **exit 0**, före och efter.
