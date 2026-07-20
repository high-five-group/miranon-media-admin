/**
 * [PROTOTYPE] — kastbar kod, levereras ALDRIG (throwaway-kontraktet,
 * prototype-skillen; klausul i+ii).
 *
 * K75 (S73, Marcus-order post-facit: "Ska vi bränna av skapa nytt
 * event-sidan också … det hör ju ändå till event-kategorin"): Skapa
 * nytt event-sidan i FAMILJE-grammatiken. Skarpa /mer/skapa-event
 * (Fas 6f L2, CreateEventForm mot create-event-EF:en) är FUNKTIONS-
 * facit men byggd FÖRE konvergensen: platt formlista + datum som
 * text-Inputs. Denna sida konvergerar FORMEN; fält-uppsättning och
 * kontrakt är CreateEventForms (ADR-066: Eventtyp REQUIRED b5 ·
 * idempotency-nyckel b3 · pessimistisk UI b4 — skarpa krav, bokförda,
 * ej prototyp-mekanik).
 *
 * FK-formklassen (K17-arvet): stora chevronen + h1 + systemkontext-rad
 * (FK-principen: berätta vad systemet sätter själv — eventnummer,
 * anmälningslänk, status) · grupprubriker utanför tonala kort ·
 * label-över-fält · obligatorisk-markering i etiketten · fel först
 * vid Skapa-försöket · DatumFalt = K13:s RAC DateRangePicker
 * (detaljsidans Ändra-grammatik, INTE skarpa sidans text-Inputs).
 *
 * Demo-options (read-only-regeln — inga fetches; skarpa sidan härleder
 * options självväxande ur get-events + get-event-formats): kurserna ==
 * kalender-legendens familj · Typ == basens enum (data-model rad 254) ·
 * Eventformat == Sessionsmall-klasserna.
 *
 * PROTOTYP-NO-OP: Skapa validerar + visar bekräftelse-läget
 * (K17-mönstret) — ingen write; sidladdning nollställer. Skarpa flödet
 * navigerar till skapade eventets detaljsida (CreateEventForm.onSuccess).
 */

import type { CalendarDate } from '@internationalized/date';
import { Link, useNavigate } from '@tanstack/react-router';
import { ChevronLeft } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { I18nProvider } from 'react-aria-components';
import { Button } from '@/components/primitives/Button';
import { Input } from '@/components/primitives/Input';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Select, SelectItem } from '@/components/primitives/Select';
import { AntalFalt, DatumFalt, ProtoGrupp } from './EventDetailPrototype';

const KURS_OPTIONS = ['Fjärrskådning', 'RIM 1', 'RIM 2', 'RIM 3'];
const TYP_OPTIONS = ['Utbildning', 'Föreläsning'];
const FORMAT_OPTIONS = ['Tvådagars — Dag 1 + Dag 2', 'Endagars — Föreläsning'];

export function SkapaEventPrototype() {
  const navigate = useNavigate();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const [kurs, setKurs] = useState('');
  const [typ, setTyp] = useState('');
  const [ort, setOrt] = useState('');
  const [datum, setDatum] = useState<{ start: CalendarDate; end: CalendarDate } | null>(null);
  const [maxPlatser, setMaxPlatser] = useState<number | null>(null);
  const [format, setFormat] = useState('');
  const [visaFel, setVisaFel] = useState(false);
  const [skapad, setSkapad] = useState(false);

  useEffect(() => {
    headingRef.current?.focus();
    document.title = 'Skapa nytt event — Miranon Media Admin';
  }, []);

  const fel = {
    kurs: kurs === '',
    typ: typ === '',
    ort: ort.trim() === '',
    datum: datum == null,
    maxPlatser: maxPlatser == null || maxPlatser < 0,
    format: format === '',
  };
  const harFel = Object.values(fel).some(Boolean);

  const tillListan = () => navigate({ to: '/event', search: (prev) => prev });

  return (
    <section className="flex flex-col gap-6 pt-2 lg:pt-10">
      {/* Toppraden: samma stora runda chevron som detaljsidan (K10-formen);
          search-genomslaget bevarar variant-/data-axeln genom flödet. */}
      <Link
        to="/event"
        search={(prev) => prev}
        aria-label="Tillbaka till event"
        className="mx-4 flex size-11 shrink-0 items-center justify-center self-start rounded-full bg-bg-muted"
      >
        <ChevronLeft aria-hidden="true" size={26} />
      </Link>

      <header className="flex flex-col gap-1.5 border-border border-b px-4 pb-5">
        <h1 ref={headingRef} tabIndex={-1} className="font-semibold text-3xl">
          Skapa nytt event
        </h1>
        {/* FK-principen: det systemet sätter själv berättas — frågas
            aldrig efter (eventnummer/EventKey/anmälningslänk server-side;
            status Planerat per skarpa kontraktet). */}
        <p className="text-small text-text-secondary">
          Eventnummer, anmälningslänk och status (Planerat) sätts automatiskt.
        </p>
      </header>

      {skapad ? (
        <div role="status" className="flex flex-col items-start gap-4 px-4">
          <MessageBox intent="success" title="Eventet skapat (prototyp)">
            I den skarpa versionen skapas eventet i basen och du landar direkt på dess detaljsida.
            Prototypen sparar ingenting.
          </MessageBox>
          <Button intent="primary" onPress={tillListan}>
            Tillbaka till eventlistan
          </Button>
        </div>
      ) : (
        <>
          <ProtoGrupp id="skapa-event-om" rubrik="Om eventet">
            <div className="flex flex-col gap-4 py-4">
              <Select
                label="Kurs (obligatorisk)"
                placeholder="Välj kurs"
                selectedKey={kurs || null}
                onSelectionChange={(k) => setKurs(String(k))}
                isRequired
                isInvalid={visaFel && fel.kurs}
                errorMessage="Välj en kurs"
              >
                {KURS_OPTIONS.map((o) => (
                  <SelectItem key={o} id={o}>
                    {o}
                  </SelectItem>
                ))}
              </Select>
              <Select
                label="Typ (obligatorisk)"
                placeholder="Välj typ"
                selectedKey={typ || null}
                onSelectionChange={(k) => setTyp(String(k))}
                isRequired
                isInvalid={visaFel && fel.typ}
                errorMessage="Välj en typ"
              >
                {TYP_OPTIONS.map((o) => (
                  <SelectItem key={o} id={o}>
                    {o}
                  </SelectItem>
                ))}
              </Select>
              <Input
                label="Ort (obligatorisk)"
                value={ort}
                onChange={setOrt}
                isRequired
                isInvalid={visaFel && fel.ort}
                errorMessage="Ange en ort"
              />
              {/* Datumspannet i K13-formen (synlig etikett över fältet —
                  formklassen; DatumFalt bär aria-label). Felraden manuell:
                  RAC-pickern har ingen errorMessage-slot i vår rad-form. */}
              <div className="flex flex-col gap-1">
                <span className="text-(color:--mm-input-label-text) text-small">
                  Datum (obligatorisk)
                </span>
                <I18nProvider locale="sv-SE">
                  <DatumFalt value={datum} onChange={setDatum} />
                </I18nProvider>
                {visaFel && fel.datum && (
                  <p className="text-(color:--mm-input-error-text) text-caption">
                    Välj start- och slutdatum
                  </p>
                )}
              </div>
            </div>
          </ProtoGrupp>

          <ProtoGrupp id="skapa-event-platser" rubrik="Platser och format">
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-1">
                <span className="text-(color:--mm-input-label-text) text-small">
                  Max antal platser (obligatorisk)
                </span>
                <I18nProvider locale="sv-SE">
                  <div className="w-32">
                    <AntalFalt
                      label="Max antal platser"
                      value={maxPlatser}
                      min={0}
                      onChange={setMaxPlatser}
                    />
                  </div>
                </I18nProvider>
                {visaFel && fel.maxPlatser && (
                  <p className="text-(color:--mm-input-error-text) text-caption">
                    Ange antal platser (0 eller fler)
                  </p>
                )}
              </div>
              <Select
                label="Eventformat (obligatorisk)"
                placeholder="Välj eventformat"
                selectedKey={format || null}
                onSelectionChange={(k) => setFormat(String(k))}
                isRequired
                isInvalid={visaFel && fel.format}
                errorMessage="Eventformat krävs — det styr sessionsstrukturen"
              >
                {FORMAT_OPTIONS.map((o) => (
                  <SelectItem key={o} id={o}>
                    {o}
                  </SelectItem>
                ))}
              </Select>
            </div>
          </ProtoGrupp>

          {/* Knappraden: primär först (FK-formklassen); px-4 = kortens inner-inset. */}
          <div className="flex items-center gap-2 px-4">
            <Button
              intent="primary"
              onPress={() => {
                setVisaFel(true);
                if (!harFel) setSkapad(true);
              }}
            >
              Skapa event
            </Button>
            <Button intent="secondary" onPress={tillListan}>
              Avbryt
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
