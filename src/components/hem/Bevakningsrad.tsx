import { ChevronRight } from 'lucide-react';
import { type BevakningRad, bevakningDagarText, bevakningStatusText } from './hem-derivations';

/**
 * Bevakningsraden (ORDLISTA.md "Bevakningsrad") — Morgonkollens yta för
 * sällsynta men tidskritiska härledda uppgifter (TASK-243.1, promoverad ur
 * `dev/hem-prototyp/VariantRo.tsx` BevakningsRadItem, S102 Del 10 beslut
 * 2–4). HELT OSYNLIG vid noll träffar — ingen wrapper, ingen rubrik, inget
 * kvitto (till skillnad från block, som alltid står kvar med positivt
 * kvitto vid noll) — asymmetrin är Marcus-låst.
 *
 * En RIKTIG `<button>` utan `onPress`: sändflödet finns inte byggt än
 * (svep-PRD:n task-241) — samma no-op-mönster som bulk-knapparna
 * (`BulkAtgardsknapp.tsx`), men UTAN den knappens disabled-semantik: raden
 * leder framåt (chevron) mot en framtida destination, den utför inget
 * skarpt just nu.
 *
 * KOLUMN-FORM (TASK-247, fynd c) — MEDVETEN FACIT-AMENDERING, inte en
 * avvikelse-rättning: den promoverade formen (facit
 * `tasks/sessions/bilagor/s102-hem-konvergens/facit.json`, "godkand": null,
 * ännu ej Marcus-stämplad via 243.4) visar Eventnamn/dagar-kvar/status som
 * EN sammanhängande textrad (`{namn} · {dagar} · {status}`). Marcus gav en
 * uttrycklig designorder (S102 sjätte paus, prod-granskning): raderna ska
 * DELAS i kolumner så samma tre delar alignar rakt över varandra mellan
 * rader — ett avsteg från den låsta prototypformen, tillåtet under ADR-102
 * B2 ("Avsteg är tillåtna endast som ett uttryckligt, bokfört
 * Marcus-beslut"). BOKFÖRING AV SJÄLVA FACIT-AMENDERINGEN (facit.json/
 * facit-bilderna) är ÖPPEN — se TASK-247 slutrapport: ADR-102/103
 * beskriver promoveringskontraktet men ingen av dem ger en mekanik för att
 * amendera ett LÅST-MEN-EJ-STÄMPLAT facit (`lasning` satt, `godkand: null`)
 * mitt i granskningsfönstret före 243.4 — formen nedan är kodad per ordern,
 * facit-registret är INTE rört av denna commit.
 *
 * Grid i stället för sammanhängande text — NÄSTLAD och RESPONSIV, inte en
 * enda platt 4-kolumnsrad. En första platt version (`2fr 7rem
 * minmax(9rem,1fr) auto` på hela knappen) mättes trasig på mobil: vid
 * 390px räckte bredden exakt för de tre fasta/minmax-kolumnerna + chevron
 * (112+144+36(gap)+18 ≈ 310px = precis knappens fulla innehållsbredd på
 * den vyporten), och eventnamn-kolumnen (`min-w-0` tar bort dess
 * innehålls-minimum) kollapsade till 0 — "Fjärrskådning" försvann helt ur
 * renderingen (screenshot `task-247-hem-mobil.png` FÖRE denna rättning).
 * Löst med en YTTRE 2-kolumns grid (`minmax(0,1fr) auto` — innehåll +
 * chevron, aldrig färre än två fungerande kolumner) och en INRE grid för
 * själva de tre bevakningsdelarna: under `sm` (640px) staplas den till en
 * kolumn (eventnamn egen rad, "dagar · status" i en flex-rad därunder,
 * SAMMA form originalets sammanhängande textrad hade — ingenting nytt
 * kollapsar). Från `sm` och uppåt blir samma inre wrapper `sm:contents`
 * (barnen "adopteras" som riktiga grid-celler av den yttre) med
 * `sm:grid-cols-[2fr_7rem_minmax(9rem,1fr)]` — SAMMA värden på varje rad
 * (ingen `auto`/`max-content` som varierar per rads eget innehåll) ger
 * pixel-identiska kolumngränser mellan rader utan subgrid. `7rem` rymmer
 * "21 dagar kvar" (fönstrets maxvärde, `EVENTINFO_FONSTER_DAGAR` i
 * hem-derivations.ts). `line-clamp-2` sitter på eventnamn- och
 * status-kolumnen (skyddsnätet gäller fortfarande — aldrig ellips på
 * meningsbärande text); "·"-separatorn syns bara i den staplade
 * mobilformen (`sm:hidden`, `aria-hidden` — rent dekorativ, försvinner
 * helt ur DOM-flödet vid `sm:contents` så den aldrig äter en grid-cell
 * på desktop).
 */
export function Bevakningsrad({ rader }: { rader: BevakningRad[] }) {
  if (rader.length === 0) return null;
  return (
    <ul aria-label="Bevakningar" className="flex min-w-0 flex-col gap-2">
      {rader.map((rad) => (
        <BevakningsradRad key={rad.event.id} rad={rad} />
      ))}
    </ul>
  );
}

function BevakningsradRad({ rad }: { rad: BevakningRad }) {
  const status = bevakningStatusText(rad);
  const dagar = bevakningDagarText(rad.dagarTillStart);
  return (
    <li>
      <button
        type="button"
        className="text-(color:--mm-navcard-text) grid min-h-12 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 rounded-2xl border border-(--mm-navcard-border) bg-(--mm-navcard-bg) px-4 py-3 text-left hover:bg-bg-emphasized motion-safe:transition-colors contrast-more:border-(--mm-navcard-border-contrast)"
      >
        <span className="grid min-w-0 gap-y-0.5 sm:grid-cols-[2fr_7rem_minmax(9rem,1fr)] sm:items-center sm:gap-x-3">
          {/* line-clamp-2 i stället för truncate — en lång rad bryter till
              max två rader i stället för att klippas med ellipsis mitt i
              ett ord (Gunilla-principen: en klippt mening är obegriplig). */}
          <span className="line-clamp-2 min-w-0 font-semibold text-body">{rad.eventNamn}</span>
          <span className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 text-body text-text-secondary sm:contents">
            <span className="min-w-0">{dagar}</span>
            <span aria-hidden="true" className="sm:hidden">
              ·
            </span>
            <span className="line-clamp-2 min-w-0">{status}</span>
          </span>
        </span>
        <ChevronRight
          aria-hidden="true"
          size={18}
          className="text-(color:--mm-navcard-icon) shrink-0"
        />
      </button>
    </li>
  );
}
