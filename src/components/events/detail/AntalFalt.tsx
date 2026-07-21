import { Minus, Plus } from 'lucide-react';
import {
  Button as AriaButton,
  Input as AriaInput,
  Group,
  NumberField,
} from 'react-aria-components';

/**
 * Antal-fält för Beläggningens Ändra-morf (task-18.2; S73-facit K14/K15): RAC
 * NumberField — branschmönstret för numerisk inmatning (inputmode-numeriskt
 * fält + stegknappar, locale-medvetet). Kompakt rad-form: min-h-8 matchar
 * morf-radgeometrin (48 px-raden); etiketten bärs av raden utanför → aria-label.
 *
 * Rå RAC-vägen per prototypens precedent — biblioteket saknar
 * NumberField-primitiv (saknad primitiv = rå-RAC; primitiv-lyft är en senare
 * biblioteks-fråga vid bevisat delbehov). Nyskriven mot facit
 * (throwaway-kontraktet). Tomt fält = NaN i RAC → null (basens "ej satt");
 * null:ade fält UTELÄMNAS ur Spara-payloaden ("ändra inte" — EF-kontraktet).
 */
export function AntalFalt({
  label,
  value,
  min = 0,
  onChange,
  autoFocus,
}: {
  /** Fältets tillgängliga namn (aria-label — raden utanför bär det visuella). */
  label: string;
  value: number | null;
  min?: number;
  onChange: (v: number | null) => void;
  /** Morfens fokus-kontinuitet: första fältet fokuseras när morfen öppnas. */
  autoFocus?: boolean;
}) {
  return (
    <NumberField
      aria-label={label}
      value={value ?? Number.NaN}
      onChange={(v) => onChange(Number.isNaN(v) ? null : v)}
      minValue={min}
      autoFocus={autoFocus}
      className="flex w-full flex-col gap-1"
    >
      <Group className="flex min-h-8 w-full items-center gap-1 rounded border border-(--mm-input-border) bg-(--mm-input-bg) px-1">
        <AriaButton
          slot="decrement"
          aria-label="Minska"
          className="flex size-7 shrink-0 items-center justify-center rounded-full"
        >
          <Minus aria-hidden="true" size={16} />
        </AriaButton>
        <AriaInput
          placeholder="Ej satt"
          className="placeholder:text-(color:--mm-input-text-placeholder) w-full min-w-0 bg-transparent text-center text-small tabular-nums outline-none"
        />
        <AriaButton
          slot="increment"
          aria-label="Öka"
          className="flex size-7 shrink-0 items-center justify-center rounded-full"
        >
          <Plus aria-hidden="true" size={16} />
        </AriaButton>
      </Group>
    </NumberField>
  );
}
