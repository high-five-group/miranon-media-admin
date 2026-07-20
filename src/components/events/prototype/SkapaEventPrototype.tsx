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
import { ChevronLeft, Globe } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { I18nProvider } from 'react-aria-components';
import { Button } from '@/components/primitives/Button';
import { Input } from '@/components/primitives/Input';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Select, SelectItem } from '@/components/primitives/Select';
import { AntalFalt, DatumFalt, ProtoGrupp } from './EventDetailPrototype';

// K77 (Marcus): domänspråket är UTBILDNING — Roger & Lotta benämner
// kurserna så (ORDLISTA-posten Utbildning; "Kurs" var min etikett).
const UTBILDNING_OPTIONS = ['Fjärrskådning', 'RIM 1', 'RIM 2', 'RIM 3'];
const TYP_OPTIONS = ['Utbildning', 'Föreläsning'];
const FORMAT_OPTIONS = ['Tvådagars — Dag 1 + Dag 2', 'Endagars — Föreläsning'];

export function SkapaEventPrototype() {
  const navigate = useNavigate();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const [utbildning, setUtbildning] = useState('');
  const [typ, setTyp] = useState('');
  const [ort, setOrt] = useState('');
  const [datum, setDatum] = useState<{ start: CalendarDate; end: CalendarDate } | null>(null);
  const [maxPlatser, setMaxPlatser] = useState<number | null>(null);
  const [format, setFormat] = useState('');
  const [publicera, setPublicera] = useState(false);
  const [visaFel, setVisaFel] = useState(false);
  const [skapad, setSkapad] = useState(false);

  useEffect(() => {
    headingRef.current?.focus();
    document.title = 'Skapa nytt event — Miranon Media Admin';
  }, []);

  const fel = {
    utbildning: utbildning === '',
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

      {/* K76 (Marcus): systemkontextraden RIVEN — "eventnummer,
          anmälningslänk …" är backend-angelägenhet, irrelevant för
          Lotta; sånt ska bara funka. (K75 ärvde raden ur skarpa sidans
          copy — felapplicerad FK-princip: att INTE fråga efter det
          systemet vet betyder inte att det ska FÖRKLARAS.) */}
      <header className="flex flex-col gap-1.5 border-border border-b px-4 pb-5">
        <h1 ref={headingRef} tabIndex={-1} className="font-semibold text-3xl">
          Skapa nytt event
        </h1>
      </header>

      {skapad ? (
        <div role="status" className="flex flex-col items-start gap-4 px-4">
          <MessageBox intent="success" title="Eventet skapat (prototyp)">
            I den skarpa versionen skapas eventet i basen
            {publicera ? ', publiceras på miranon.se' : ''} och du landar direkt på dess detaljsida.
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
                label="Utbildning (obligatorisk)"
                placeholder="Välj utbildning"
                selectedKey={utbildning || null}
                onSelectionChange={(k) => setUtbildning(String(k))}
                isRequired
                isInvalid={visaFel && fel.utbildning}
                errorMessage="Välj en utbildning"
              >
                {UTBILDNING_OPTIONS.map((o) => (
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

          {/* K76→K77 (Marcus-VISIONEN — T79: custom miranon.se ersätter
              Shopify + Elfsight så webbplats och app delar samma källa):
              publicerings-avsnittet. K77 (Marcus: "det där är INTE en
              Resend-grej … en vanlig radio-button" + research-order):
              K76:s TOGGLE PRÖVAD-OCH-RIVEN → slide-to-confirm-HANDTAGET
              (Resend Broadcasts: submit-knappen ersatt av slider —
              DRAGET är bekräftelsen vid tunga handlingar;
              resend.com/blog/send-marketing-emails-with-resend-broadcasts).
              PRD-krav oförändrade: publiceringsflaggan FINNS EJ i basen
              (live-fältlistan S73) → additivt bas-fält (ADR-063) +
              create-event-input-utökning + publicerings-KONTRAKTET i
              T79-spåret. */}
          <ProtoGrupp id="skapa-event-publicering" rubrik="Publicering">
            <div className="py-4">
              <PubliceraHandtag publicerad={publicera} onChange={setPublicera} />
            </div>
          </ProtoGrupp>

          {/* Knappraden: primär först (FK-formklassen); px-4 = kortens inner-inset.
              K77 (Marcus: "gillar inte att knappen är mörkgrå"): Skapa
              event i SAGE-GRÖNA (bg-success, K49) i stället för
              primärknappens svärta — tailwind-merge:as över varianten;
              vit text mot #606B57 ≈ 5,6:1 (AA ✓). Grön-primär som
              biblioteks-intent = facit-fråga. */}
          <div className="flex items-center gap-2 px-4">
            <Button
              intent="primary"
              className="bg-success data-[hovered]:bg-success/85 data-[pressed]:bg-success/75"
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

/** K77 — publicerings-HANDTAGET (slide-to-confirm, Resend-klassen):
    dra hela vägen HÖGER för att arma publiceringen; dra tillbaka
    vänster för att ångra. Släpp mitt i → fjädrar till utgångsläget
    (intentionalitets-trösklarna 90 %/10 %). Geometri: spår h-12,
    handtag 44 px med 2 px inset; positionen som ratio 0–1 →
    left-calc (ingen mätning i render).
    A11y (11-ribban — drag får ALDRIG vara enda vägen): elementet är
    fokuserbart med role="switch"; Space/Enter togglar samma val;
    fokusring via base.css-globalen (:focus-visible på riktigt
    fokuserbart element); motion-reduce: ingen fjäder. touch-none
    krävs för pointer-drag på mobil. Skarp form + ev. SlideToConfirm-
    primitiv i biblioteket = facit-frågor (RAC saknar mönstret —
    ren pointer-events-yta). */
function PubliceraHandtag({
  publicerad,
  onChange,
}: {
  publicerad: boolean;
  onChange: (v: boolean) => void;
}) {
  const sparRef = useRef<HTMLDivElement>(null);
  // Drag-tillståndet bor i en REF (closure-säkert mellan högfrekventa
  // pointermoves — event-handlers ser annars förra renderns state);
  // dragPos-staten finns ENBART för rendern.
  const dragRef = useRef<number | null>(null);
  const [dragPos, setDragPos] = useState<number | null>(null);
  const pos = dragPos ?? (publicerad ? 1 : 0);

  const ratio = (clientX: number): number => {
    const spar = sparRef.current;
    if (!spar) return 0;
    const r = spar.getBoundingClientRect();
    return Math.min(1, Math.max(0, (clientX - r.left - 24) / (r.width - 48)));
  };

  return (
    <div
      ref={sparRef}
      role="switch"
      aria-checked={publicerad}
      aria-label="Publicera på miranon.se"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          onChange(!publicerad);
        }
      }}
      onPointerDown={(e) => {
        // Capture kan kasta NotFoundError om pekaren redan släppts
        // (snabb tap) — draget funkar ändå via move/up på elementet.
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {}
        dragRef.current = ratio(e.clientX);
        setDragPos(dragRef.current);
      }}
      onPointerMove={(e) => {
        if (dragRef.current != null) {
          dragRef.current = ratio(e.clientX);
          setDragPos(dragRef.current);
        }
      }}
      onPointerUp={() => {
        const p = dragRef.current;
        if (p != null) onChange(p >= 0.9 ? true : p <= 0.1 ? false : publicerad);
        dragRef.current = null;
        setDragPos(null);
      }}
      onPointerCancel={() => {
        dragRef.current = null;
        setDragPos(null);
      }}
      className={`relative h-12 w-full touch-none select-none rounded-full border motion-safe:transition-colors ${
        publicerad
          ? 'border-transparent bg-success'
          : 'border-(--mm-input-border) bg-(--mm-input-bg)'
      }`}
    >
      <span
        aria-hidden="true"
        className={`absolute inset-0 flex items-center justify-center text-small ${
          publicerad ? 'font-medium text-text-inverse' : 'text-text-muted'
        }`}
      >
        {publicerad ? 'Publiceras på miranon.se' : 'Dra för att publicera på miranon.se'}
      </span>
      <span
        aria-hidden="true"
        style={{ left: `calc(2px + ${pos * 100}% - ${pos * 48}px)` }}
        className={`absolute top-0.5 flex size-11 items-center justify-center rounded-full bg-surface shadow-sm ${
          dragPos == null ? 'motion-safe:transition-[left]' : ''
        }`}
      >
        <Globe aria-hidden="true" size={18} className="text-text-secondary" />
      </span>
    </div>
  );
}
