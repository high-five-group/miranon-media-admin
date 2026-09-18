import { AlertTriangle } from 'lucide-react';

/**
 * [TASK-436] "Basen släpar" — spegelns eftersläpning sagd rakt ut (ADR-128
 * beslut 5: den SYNS I APPEN i stället för att tystas). Flyttad ur inkorgens
 * `RadInnehall` vid andra konsumenten (eventdetaljens "Öppna detaljer",
 * där fliken läser basens spegel medan beloppet läser Postgres — exakt det
 * läge där de två kan säga olika saker). Formen är inkorgens, orörd.
 *
 * [TASK-456 runda 2] `kompakt` — DEFAULT `false`, ORÖRT ÖVERALLT UTOM DÄR
 * DET UTTRYCKLIGEN SÄTTS (eventdetaljens `Betalningar.tsx` sätter den
 * aldrig, så den ytan är byte-för-byte oförändrad). Enda konsumenten är
 * inkorgens `RadInnehall`, och ENDAST när alla tre pillar samtidigt är
 * sanna (`forfallen && obekraftad && spegelSlapar`) — se dess docblock för
 * mätningen som motiverar exakt denna tröskel.
 *
 * FORMEN ÄR EN KORTARE, FULLSTÄNDIG ETIKETT — INTE EN AVKLIPPT TEXT.
 * "Släpar" är ett eget, helt läsbart ord (husmönstret "kortare etiketter på
 * smal skärm", inte trunkering med `truncate`/ellipsis): ingen information
 * göms bakom hover eller fokus, så inget tooltip-bibliotek behövs (repot
 * saknar en tillgänglig Tooltip-primitiv i dag — att bygga en för denna
 * enda pill hade varit långt över golvet för ett fynd-kort). Skärmläsare
 * hör ändå ORDAGRANT samma namn som förut: en `sr-only`-nod ("Basen ")
 * döljs BARA visuellt, inte ur tillgänglighetsträdet, så den ackumulerade
 * accessible name blir "Basen Släpar" — samma ord, samma ordning.
 *
 * INTE `aria-label` på span:en — ett `<span>` utan explicit roll (default
 * `generic`) stödjer inte namngivande ARIA-attribut (biome
 * `lint/a11y/useAriaPropsSupportedByRole` fällde det direkt; webbläsare kan
 * tysta strunta i `aria-label` på en rollös nod). `sr-only`-prefixet kräver
 * ingen roll alls — texten finns bara kvar i DOM:en, bara `clip`ad visuellt
 * (samma Tailwind-klass som resten av huset redan använder för laddnings-
 * annonser, se t.ex. `BetalningsInkorg.tsx`s egna `sr-only`-noder).
 * `title`-attributet (förklarande, inte namngivande) är oförändrat i båda
 * lägena. Ikonen + tonen bär fortfarande signalen tillsammans med texten —
 * ingen ny färg-/ikon-bara information.
 */
export function BasenSlaparPill({ kompakt = false }: { kompakt?: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded border border-transparent bg-bg px-2 py-0.5 text-caption text-text-muted"
      title="Basen har inte hunnit uppdateras än"
    >
      <AlertTriangle aria-hidden size={13} />
      {kompakt ? (
        <>
          <span className="sr-only">Basen </span>
          Släpar
        </>
      ) : (
        'Basen släpar'
      )}
    </span>
  );
}
