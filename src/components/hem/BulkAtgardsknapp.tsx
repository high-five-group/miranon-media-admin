import { useId } from 'react';
import { Button } from '@/components/primitives';

/**
 * Bulk-åtgärdsknappen (Bekräfta alla / Skicka påminnelse till alla) —
 * AC #4 (TASK-243.1, Marcus-kvitterat 2026-08-16): renderas VISUELLT per
 * facit — full, aktiv `intent="primary"`-yta, INTE nedtonad. `isDisabled`
 * (Button-primitivens vanliga väg) hade lagt `data-[disabled]:opacity-50`
 * (`Button.tsx` `buttonVariants`-basen, verifierat mot
 * `react-aria-components`-källan: `data-disabled` sätts ENDAST av
 * `isDisabled`-propen) — exakt den dämpning facit-bilden inte visar.
 *
 * TVÅ LÄGEN SEDAN [TASK-241.2], styrda av EN valfri `onPress`-prop:
 *
 *  · `onPress` UTELÄMNAD (ForfallnaBetalningars "Skicka påminnelse till
 *    alla", oförändrat tills TASK-241.4 kopplar påminnelsesvepet):
 *    FUNKTIONELLT avstängd — ingen `onPress` kopplas (klicket gör
 *    bokstavligen ingenting, samma no-op-princip som prototypens
 *    `DodIngang`), och `aria-disabled="true"` (RAKT, inte via `isDisabled`)
 *    annonserar tillståndet för skärmläsare utan att sänka opaciteten eller
 *    ta bort träffytan ur tabordningen. Den tillgängliga motiveringen ligger
 *    ALLTID i DOM:en (`aria-describedby`) men är VISUELLT dold tills
 *    fokus/hover — aldrig en `title`-attributs-tooltip (Gunilla-principen).
 *  · `onPress` GIVEN (NyaAnmalningars "Bekräfta alla", TASK-241.2): en
 *    RIKTIG, klickbar knapp — `onPress` kopplas rakt av, `aria-disabled`
 *    utelämnas, ingen tooltip renderas. Den visuella formen (samma
 *    `intent="primary"`, samma fullbredd) är OFÖRÄNDRAD i båda lägena —
 *    facit skiljer inte visuellt mellan "funktionell" och "väntar på
 *    sändflödet", bara `aria-disabled`/`onPress` gör det.
 *
 * `motion-safe:` respekterar prefers-reduced-motion.
 *
 * FULLBREDD (TASK-247, fynd b): wrappern är `flex flex-col` — SAMMA form
 * som prototypens `DodIngang` (`dev/hem-prototyp/ui.tsx`, `flex flex-col
 * gap-1.5`) — inte `inline-block`. Skälet är CSS-mekaniskt, inte kosmetiskt:
 * `Button` är `inline-flex` och sizear sig efter EGET textinnehåll oavsett
 * förälder; `inline-block` ärvde den auto-bredden rakt igenom och gjorde
 * "Bekräfta alla" (kortare etikett) synligt smalare än "Skicka påminnelse
 * till alla" (längre etikett) — mätt 124,5px mot 222,75px, identiskt på
 * desktop (1440px) och mobil (390px) eftersom bredden aldrig berodde på
 * containern. `flex flex-col` gör knappen till ENDA flex-barnet i en
 * flex-column-behållare — default `align-items: stretch` sträcker den till
 * förälderns fulla bredd, som i sin tur ärver full bredd av sektionens
 * `flex-col`-förälder (samma stretch-kedja). Facit
 * (`facit-hem-v1-demo-desktop.png`) visar båda knapparna fullbredd —
 * bekräftat via renderad skärmdump mot denna körning.
 */
export function BulkAtgardsknapp({ label, onPress }: { label: string; onPress?: () => void }) {
  const beskrivningId = useId();
  if (onPress) {
    return (
      <div className="flex flex-col">
        <Button type="button" intent="primary" onPress={onPress}>
          {label}
        </Button>
      </div>
    );
  }
  return (
    <div className="group relative flex flex-col">
      <Button type="button" intent="primary" aria-disabled="true" aria-describedby={beskrivningId}>
        {label}
      </Button>
      <p
        id={beskrivningId}
        role="tooltip"
        className="text-(color:--mm-surface) pointer-events-none absolute top-full left-0 z-10 mt-2 w-max max-w-64 rounded-lg bg-(--mm-text) px-3 py-2 text-caption opacity-0 shadow-md group-focus-within:opacity-100 group-hover:opacity-100 motion-safe:transition-opacity"
      >
        Skickar ingenting än. Sändflödet är inte byggt ännu.
      </p>
    </div>
  );
}
