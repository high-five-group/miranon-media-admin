# Amendering 2026-08-31 — Registrera betalning/återbetalning: horisontell knappgrupp på ≥sm (TASK-346.14 fix-runda D, D1)

**Yta:** `atgarder-granskning` i
`tasks/sessions/bilagor/s93-atgardssida-promovering/facit.json` (Marcus
2026-08-11: *"ser okej ut"*, stämpel-SHA
`efc4091aa4284d29246aa5a53bcd8f10d2250a04`). Skarp källa:
`src/components/events/atgarder/AtgardsSida.tsx` — samma indirekta koppling
som `AMENDERING-2026-08-31-registrera-aterbetalning.md` redan bokfört: filen
som faktiskt ändras är `src/components/betalningar/PanelBetalningar.tsx`, en
komponent `AtgardsSida.tsx` redan monterar. Denna sidofil kompletterar samma
dags `AMENDERING-2026-08-31-design-polish-346-14.md` (personblockens radform,
notering-ghost, knappbredden) utan att motsäga den — punkt 3 där ("Knappbredden,
4b") gav triggerknapparna sin INTRINSIC bredd; denna fix ändrar bara hur de
två redan-intrinsic-breda knapparna GRUPPERAS mot varandra.

**Klass:** *ny form, förhandsmandat S113 Del 13 — orkestrerarens egen
visuella dom-fångst (AC #6), fix-runda D, fynd D1.*

---

## FÖRST: samma grind-läge som sibling-posterna

Ingen av manifestets tre ytor bär `referenser`-nyckeln (oförändrat, samma
mekanik som de tre tidigare `AMENDERING-2026-08-31-*.md`-filerna i denna
katalog redan bokfört). `bash scripts/check-facit.sh` → exit 0, oförändrat.

## Vad som ändrades

Orkestrerarens dom (1440×900, granskning av PR #2183) mätte "Registrera
betalning" och "Registrera återbetalning" stå staplade vänsterställda med
olika naturlig bredd — `RegistreraYta` och `AterbetalningsYta` är två egna
`flex-col`-behållare, och `PanelBetalningar.tsx`s egen `flex flex-col gap-2`
gjorde dem till vertikala syskon utan avsikt, inte som ett designval.

`PanelBetalningar.tsx` wrappar nu de två `*Yta`-elementen i en gemensam
`<div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start">`
i stället för att montera dem direkt som syskon i panelens `flex-col`. Husets
etablerade mönster för en knappgrupp som ska bli sida-vid-sida på desktop men
stapla på mobil är `flex-col … sm:flex-row` (`DokumentYta.tsx` §
"STAPLADE I FULL BREDD UNDER `sm`, SIDA VID SIDA FRÅN `sm`") — här UTAN
`w-full`/`sm:w-auto`, eftersom mobilformen ska förbli OFÖRÄNDRAD (knapparnas
egen intrinsic bredd, precis som idag, per fynd D1:s egen instruktion
"staplade på mobil som nu"). Gapet (`gap-2`) är samma värde panelens egen
`flex-col gap-2` redan gav mellan raderna, så mobilens vertikala avstånd är
opåverkat — bara riktningen växlar vid `sm`. `sm:items-start` förhindrar att
en kvittens-rad under den ena triggern (annan höjd än den andra) sträcker
kolumnerna till samma höjd.

Ingen av knapparnas varianter, semantik, text eller `onPress`-hantering är
rörd — enbart grupplayouten runt dem.

## Vad som INTE ändrats

- **Knapparnas egna `intent`/`emphasis`/`size`** — orörda, exakt
  `AMENDERING-2026-08-31-design-polish-346-14.md` punkt 3:s redan bokförda
  form.
- **Formulären, kvittenserna, jobbutfallets `MessageBox`, fokus-returen** —
  all logik i `RegistreraYta.tsx`/`AterbetalningsYta.tsx` orörd; enda
  ändringen är den nya wrapper-`<div>` i `PanelBetalningar.tsx` runt de två
  komponenternas montering.
- **Kryssens läsande status, noteringsfältet, saknas-beloppet** — orörda.

## Testerna

`tests/e2e/atgarder-betalningar.staging.test.ts` lokaliserar knapparna via
`getByRole`, inte via layout-klasser — opåverkat av en ren `className`-ändring
på wrapper-diven.

## Omstämplings-läge

**Inget är omstämplat.** `godkand` står kvar med Marcus 2026-08-11-kvittens
och SHA `efc4091aa4284d29246aa5a53bcd8f10d2250a04`. `bash
scripts/check-facit.sh` → exit 0, före och efter.
