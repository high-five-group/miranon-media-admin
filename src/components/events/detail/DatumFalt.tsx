import type { CalendarDate } from '@internationalized/date';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Button as AriaButton,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  DateInput,
  DateRangePicker,
  DateSegment,
  Dialog,
  Group,
  Heading,
  Popover,
  RangeCalendar,
} from 'react-aria-components';

/**
 * Datumfält för Om eventet-morfen (task-18.1; S73-facit K11/K12): RAC
 * DateRangePicker — segmenterad inmatning (bestämt format per locale) +
 * RangeCalendar i popover för start/slut. Kompakt rad-form: min-h-8 matchar
 * morf-radgeometrin (48 px-raden); etiketten bärs av raden utanför → aria-label.
 *
 * Rå RAC-vägen per prototypens precedent — biblioteket saknar
 * DateRangePicker-primitiv (saknad primitiv = rå-RAC; primitiv-lyft är en
 * senare biblioteks-fråga vid bevisat delbehov). Nyskriven mot facit
 * (throwaway-kontraktet).
 */
export function DatumFalt({
  value,
  onChange,
}: {
  value: { start: CalendarDate; end: CalendarDate } | null;
  onChange: (v: { start: CalendarDate; end: CalendarDate } | null) => void;
}) {
  const segKlass =
    'rounded tabular-nums outline-none data-[focused]:bg-bg-emphasized data-[placeholder]:text-(color:--mm-input-text-placeholder)';
  return (
    <DateRangePicker
      aria-label="Datum"
      value={value}
      onChange={onChange}
      className="flex w-full flex-col gap-1"
    >
      <Group className="flex min-h-8 w-full items-center justify-between gap-1 rounded border border-(--mm-input-border) bg-(--mm-input-bg) px-2 text-small">
        <div className="flex items-center gap-1">
          <DateInput slot="start" className="flex">
            {(seg) => <DateSegment segment={seg} className={segKlass} />}
          </DateInput>
          <span aria-hidden="true" className="text-text-muted">
            –
          </span>
          <DateInput slot="end" className="flex">
            {(seg) => <DateSegment segment={seg} className={segKlass} />}
          </DateInput>
        </div>
        <AriaButton
          aria-label="Öppna kalendern"
          className="flex size-7 shrink-0 items-center justify-center rounded-full"
        >
          <CalendarDays aria-hidden="true" size={16} />
        </AriaButton>
      </Group>
      <Popover className="rounded-2xl border border-(--mm-select-popover-border) bg-(--mm-select-popover-bg) p-4 shadow-lg">
        <Dialog className="outline-none">
          <RangeCalendar className="flex flex-col gap-3">
            <header className="flex items-center justify-between gap-2">
              <AriaButton
                slot="previous"
                aria-label="Föregående månad"
                className="flex size-9 items-center justify-center rounded-full bg-bg-muted"
              >
                <ChevronLeft aria-hidden="true" size={18} />
              </AriaButton>
              <Heading className="font-semibold text-body" />
              <AriaButton
                slot="next"
                aria-label="Nästa månad"
                className="flex size-9 items-center justify-center rounded-full bg-bg-muted"
              >
                <ChevronRight aria-hidden="true" size={18} />
              </AriaButton>
            </header>
            <CalendarGrid weekdayStyle="short" className="border-separate border-spacing-0.5">
              <CalendarGridHeader>
                {(day) => (
                  <CalendarHeaderCell className="text-caption text-text-secondary">
                    {day}
                  </CalendarHeaderCell>
                )}
              </CalendarGridHeader>
              <CalendarGridBody>
                {(date) => (
                  <CalendarCell
                    date={date}
                    className="flex size-9 items-center justify-center rounded-full text-small tabular-nums outline-none data-[selected]:bg-bg-emphasized data-[selection-end]:bg-text data-[selection-start]:bg-text data-[outside-month]:text-text-muted data-[selection-end]:text-text-inverse data-[selection-start]:text-text-inverse data-[disabled]:opacity-40"
                  />
                )}
              </CalendarGridBody>
            </CalendarGrid>
          </RangeCalendar>
        </Dialog>
      </Popover>
    </DateRangePicker>
  );
}
