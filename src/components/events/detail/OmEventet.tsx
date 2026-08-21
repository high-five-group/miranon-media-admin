import { type CalendarDate, parseDate } from '@internationalized/date';
import { useEffect, useRef, useState } from 'react';
import { I18nProvider } from 'react-aria-components';
import { Button } from '@/components/primitives/Button';
import { DatumFalt } from '@/components/primitives/DatumFalt';
import { Input } from '@/components/primitives/Input';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Select, SelectItem } from '@/components/primitives/Select';
import { useUpdateEvent } from '@/data/mutations/useUpdateEvent';
import type { Event } from '@/domain/models/Event';
import { EventStatus } from '@/domain/types/Status';
import { AndraRad, DetaljGrupp, EtikettVardeRad, RedigeringsRad } from './DetaljGrupp';
import { datumSpannText } from './datumSpann';

/** Säker parse av eventets datum till kalender-range (ogiltigt → null). */
function tillDatumRange(e: Event): { start: CalendarDate; end: CalendarDate } | null {
  if (!e.startdatum) return null;
  try {
    const start = parseDate(e.startdatum);
    const end = e.slutdatum ? parseDate(e.slutdatum) : start;
    return { start, end };
  } catch {
    return null;
  }
}

/**
 * Redigeringsläget (task-18.1; S73-facit K11–K13): raderna byter till fält i
 * SAMMA geometri (Δ=0 px — mätt i e2e), "ändrar från"-mönstret med dämpat
 * nuvarande värde, likbredda fält. Alternativen är BASENS: Typ =
 * Utbildning/Föreläsning, Status = EventStatus-enumen (live-verifierade).
 * Spara skriver via uppdatera-event-vertikalen (pessimistisk mutation;
 * useUpdateEvent) — sektionens samtliga fält skickas som absoluta värden.
 */
function OmEventetForm({ event, onStang }: { event: Event; onStang: () => void }) {
  const [typ, setTyp] = useState<string | null>(event.typ);
  const [ort, setOrt] = useState(event.ort ?? '');
  const [status, setStatus] = useState<string | null>(event.status);
  const [datum, setDatum] = useState(() => tillDatumRange(event));
  const [ortFel, setOrtFel] = useState(false);
  const mutation = useUpdateEvent(event.id);

  const spara = () => {
    if (ort.trim() === '') {
      setOrtFel(true);
      return;
    }
    setOrtFel(false);
    mutation.mutate(
      {
        // Sektions-spara: samtliga fält som absoluta värden (naturligt idempotent).
        // Osatta selects/datum utelämnas — frånvaro betyder "ändra inte" i EF:en.
        ...(typ != null ? { typ } : {}),
        ort: ort.trim(),
        ...(datum != null
          ? { startdatum: datum.start.toString(), slutdatum: datum.end.toString() }
          : {}),
        ...(status != null ? { status } : {}),
      },
      { onSuccess: onStang },
    );
  };

  return (
    <I18nProvider locale="sv-SE">
      <dl className="divide-y divide-border">
        <RedigeringsRad term="Typ" nuvarande={event.typ}>
          <Select
            label="Typ"
            hideLabel
            size="sm"
            placeholder="Välj typ"
            autoFocus
            selectedKey={typ}
            onSelectionChange={(k) => setTyp(k == null ? null : String(k))}
          >
            <SelectItem id="Utbildning">Utbildning</SelectItem>
            <SelectItem id="Föreläsning">Föreläsning</SelectItem>
          </Select>
        </RedigeringsRad>
        <RedigeringsRad term="Ort" nuvarande={event.ort}>
          <Input
            label="Ort"
            hideLabel
            size="sm"
            placeholder="Ort"
            value={ort}
            onChange={(v) => {
              setOrt(v);
              if (ortFel && v.trim() !== '') setOrtFel(false);
            }}
            isInvalid={ortFel}
            isRequired
            errorMessage="Ort får inte vara tom"
          />
        </RedigeringsRad>
        <RedigeringsRad term="Datum" nuvarande={datumSpannText(event)}>
          <DatumFalt value={datum} onChange={setDatum} />
        </RedigeringsRad>
        <RedigeringsRad term="Status" nuvarande={event.status}>
          <Select
            label="Status"
            hideLabel
            size="sm"
            placeholder="Välj status"
            selectedKey={status}
            onSelectionChange={(k) => setStatus(k == null ? null : String(k))}
          >
            {Object.values(EventStatus).map((s) => (
              <SelectItem key={s} id={s}>
                {s}
              </SelectItem>
            ))}
          </Select>
        </RedigeringsRad>
      </dl>
      {/* Fel-ytan renderas UNDER raderna (geometri-mätningen sker i felfri väg);
          morfen förblir öppen — inga ändringar tappas tyst. requestId surfas när
          EdgeFunctionError bär den (koppling mot backend-loggen). */}
      {mutation.isError && (
        <div className="py-3">
          <MessageBox intent="error" title="Kunde inte spara ändringarna">
            {mutation.error instanceof Error
              ? mutation.error.message
              : 'Inget felmeddelande angavs.'}
          </MessageBox>
        </div>
      )}
      {/* Spara/Avbryt ersätter Ändra-raden PÅ SAMMA plats och höjd
          (py-2 + 32 px-knappar == Ändra-radens py-3 + 24 px = 48 px). */}
      <div className="flex items-center justify-center gap-2 py-2">
        <Button size="sm" intent="primary" onPress={spara} isDisabled={mutation.isPending}>
          {mutation.isPending ? 'Sparar…' : 'Spara'}
        </Button>
        <Button size="sm" intent="secondary" onPress={onStang} isDisabled={mutation.isPending}>
          Avbryt
        </Button>
      </div>
    </I18nProvider>
  );
}

/**
 * Om eventet-gruppen (task-18.1; S73-facit): etikett-värde-rader (Typ/Ort/
 * Datum/Status) med Ändra-läget i sömlös morf. Fokus-kontinuitet: morfen
 * öppnas → första fältet (autoFocus); stängs → tillbaka till Ändra-knappen
 * (tangentbordsanvändaren tappas aldrig i bytet).
 */
export function OmEventet({ event }: { event: Event }) {
  const [redigerar, setRedigerar] = useState(false);
  const andraKnappRef = useRef<HTMLButtonElement>(null);
  const varRedigerad = useRef(false);

  // Fokus-retur: när morfen just stängts (redigerar true → false) fokuseras
  // Ändra-knappen — utan detta tappas tangentbordsfokus till <body>.
  useEffect(() => {
    if (!redigerar && varRedigerad.current) {
      andraKnappRef.current?.focus();
    }
    varRedigerad.current = redigerar;
  }, [redigerar]);

  return (
    <DetaljGrupp id="grupp-om-eventet" rubrik="Om eventet">
      {redigerar ? (
        <OmEventetForm event={event} onStang={() => setRedigerar(false)} />
      ) : (
        <>
          <dl className="divide-y divide-border">
            <EtikettVardeRad term="Typ">{event.typ}</EtikettVardeRad>
            <EtikettVardeRad term="Ort">{event.ort}</EtikettVardeRad>
            <EtikettVardeRad term="Datum">{datumSpannText(event)}</EtikettVardeRad>
            <EtikettVardeRad term="Status">{event.status}</EtikettVardeRad>
          </dl>
          <AndraRad buttonRef={andraKnappRef} onPress={() => setRedigerar(true)} />
        </>
      )}
    </DetaljGrupp>
  );
}
