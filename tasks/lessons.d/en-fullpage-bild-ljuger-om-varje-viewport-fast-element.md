# En `fullPage`-bild ljuger om varje viewport-fäst element — väx vyporten i stället

**`fullPage: true` renderar sidan i sin fulla scrollhöjd, men element vars
position eller storlek är en funktion av vyporten (`position: fixed`,
`inset-0`, `vh`/`dvh`, `sticky`) fortsätter mätas mot den ursprungliga
vyporten. Resultatet är en bild där fästa element står på fel plats och
täcker fel yta — en rendering ingen användare kan framkalla. Ska en hel sidvy
fångas: väx VYPORTEN till sidans `scrollHeight` och ta en vanlig bild. Aldrig
`fullPage`.**
`[UNIVERSAL]`

Instans (S108, 2026-08-24, facit-tagningen för skiva 9, `TASK-309.10`, PR
`#1961`): riggens första pass tog de 22 facit-bilderna med `fullPage: true`.
Två defekter föll ut, båda fångade före commit. Bottennavigeringen
(`src/components/AppShell/TabBar.tsx` rad 77, `className="fixed inset-x-4
bottom-4 …"`) ockluderade blocket *"Sista betalningsdag"*
(`src/components/dokument/blockDefinitioner.ts` rad 90). Dialogens overlay
(`src/components/primitives/Modal.tsx` rad 34, `className="fixed inset-0
z-50 …"`) dimmade bara en del av bildytan — tagningsagenten rapporterade
**2 av 3**; den andelen är rapporterad, inte ommätt här, eftersom
defekt-bilderna aldrig committades. Mekanismen är däremot belagd i källan: en
`fixed inset-0`-overlay täcker exakt en vyporthöjd, så mot en sida renderad i
1,5× vyporthöjd blir kvoten just 2/3. Fixen står i commit `164190b6`:
*"sidvyerna tas i stället med viewporten uppväxt till sidans scrollHeight,
dialogerna i naturlig vyport"*.

**Det generella:** `fullPage` flyttar inte kameran — den byter duk. Layouten
fortsätter beräknas mot den vyport som är satt, så varje viewport-relativt
element hamnar i ett läge som inte motsvarar något verkligt tillstånd. Den
bilden är därmed oduglig som facit: den låser en rendering som aldrig
inträffar, och en framtida diff mot den mäter tagningsmetoden i stället för
ändringen. Fällan är inte begränsad till facit-riggar —
`docs/reference/prototyp-verifiering-runbook.md` rad 80 bär `fullPage: true`
i sin inklistringsbara bootstrap-mall, alltså just den form ett
engångs-diagnospass kopierar rakt av. Syskonlärdom om samma bilds TIDSaxel:
`ett-facit-taget-med-animationer-pa-fryser-ett-overgangstillstand.md`.
