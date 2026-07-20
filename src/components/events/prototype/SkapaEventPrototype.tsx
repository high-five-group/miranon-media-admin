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
 * label-över-fält (K84, Marcus: ALLT på sidan är obligatoriskt →
 * inga obligatorisk-markeringar — markera undantag, inte normen;
 * isRequired kvar för skärmläsare; K17-sidan med MIXADE fält behåller
 * sina markeringar) · fel först
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
import { Check, ChevronLeft } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { I18nProvider } from 'react-aria-components';
import { Button } from '@/components/primitives/Button';
import { Input } from '@/components/primitives/Input';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Select, SelectItem } from '@/components/primitives/Select';
import { AntalFalt, DatumFalt, ProtoGrupp } from './EventDetailPrototype';

// K78 (Marcus-rättelse av K77-rättelsen): valet BENÄMNS EVENT, och
// Utbildning/Föreläsning är EVENTTYPER (ORDLISTA-posten Eventtyp;
// K77:s Utbildning-post var fel och är omskriven). Namnkrock mot
// basen öppet bokförd: basens fält `Typ` bär enumen
// Utbildning/Föreläsning medan basens fält `Eventtyp` är LÄNKEN till
// Eventformat — UI-språket följer Roger & Lotta, mappningen
// UI-Eventtyp → basens Typ är PRD-materia.
const EVENT_OPTIONS = ['Fjärrskådning', 'RIM 1', 'RIM 2', 'RIM 3'];
const EVENTTYP_OPTIONS = ['Utbildning', 'Föreläsning'];
// K83 (Marcus): formatspråket "2 dagar"/"1 dag" — mappningen till
// basens Eventformat/Sessionsmall (Dag 1 + Dag 2 · Föreläsning) är
// PRD-materia (etikett ≠ record; skarpa sidan listar get-event-formats).
const FORMAT_OPTIONS = ['2 dagar', '1 dag'];

export function SkapaEventPrototype() {
  const navigate = useNavigate();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const [eventVal, setEventVal] = useState('');
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
    eventVal: eventVal === '',
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
            {publicera && (
              <>
                , publiceras på <MiranonSe />
              </>
            )}{' '}
            och du landar direkt på dess detaljsida. Prototypen sparar ingenting.
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
                label="Event"
                placeholder="Välj event"
                selectedKey={eventVal || null}
                onSelectionChange={(k) => setEventVal(String(k))}
                isRequired
                isInvalid={visaFel && fel.eventVal}
                errorMessage="Välj ett event"
              >
                {EVENT_OPTIONS.map((o) => (
                  <SelectItem key={o} id={o}>
                    {o}
                  </SelectItem>
                ))}
              </Select>
              <Select
                label="Eventtyp"
                placeholder="Välj eventtyp"
                selectedKey={typ || null}
                onSelectionChange={(k) => setTyp(String(k))}
                isRequired
                isInvalid={visaFel && fel.typ}
                errorMessage="Välj en eventtyp"
              >
                {EVENTTYP_OPTIONS.map((o) => (
                  <SelectItem key={o} id={o}>
                    {o}
                  </SelectItem>
                ))}
              </Select>
              <Input
                label="Ort"
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
                <span className="text-(color:--mm-input-label-text) text-small">Datum</span>
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
                  Max antal platser
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
                label="Eventformat"
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

/** K81 (Marcus: "skriva ut miranon.se med en annan font?"): domänen i
    MONO — adress-grammatiken (URL:er/koder i monospace är etablerad
    klass, Resend/Linear-mönstret) bryter mot Inter i löptexten och
    lyfter domänen som DESTINATION. 0.95em kompenserar monons optiska
    överstorlek. Egen profil-font utanför Inter+mono = design-
    foundation-fråga (bokförd, ej tagen här). */
function MiranonSe() {
  return <span className="font-mono text-[0.95em] tracking-tight">miranon.se</span>;
}

/** K78 — prototyp-plinget vid armad publicering (Marcus: "ett pling
    och grön bock"): kort tvåtons-chime via Web Audio (inga assets).
    Skarp form = ljud-asset + användarrespekt/preferens = facit-fråga. */
function plinga() {
  try {
    const ctx = new AudioContext();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(880, ctx.currentTime);
    o.frequency.setValueAtTime(1318.5, ctx.currentTime + 0.08);
    g.gain.setValueAtTime(0.001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.4);
    o.onended = () => ctx.close();
  } catch {
    // Ljud är förstärkning, aldrig bärare — tystnad är ok (autoplay-policy m.m.).
  }
}

/** K77→K78 — publicerings-HANDTAGET (slide-to-confirm, Resend-klassen;
    K78 = Marcus Resend-detaljerna): cirkeln täcker EXAKT hela rännan
    (size-12 == h-12, ingen inset) · GRÖN FYLLNAD följer bakom handtaget
    under draget · vid mål: PLING + grön BOCK i cirkeln · ikonen i
    cirkeln RIVEN (tom vit cirkel; bocken är målets belöning) · rännans
    kontur RIVEN (tonad ränna bg-bg-emphasized bär formen själv) ·
    instruktions-texten tonar ut med fyllnaden. Dra tillbaka = ångra;
    släpp mitt i = fjädrar (90/10-trösklarna).
    A11y (11-ribban — drag får ALDRIG vara enda vägen): fokuserbar med
    role="switch"; Space/Enter togglar samma val (plingar också vid
    armning — samma feedback); fokusring via base.css-globalen;
    motion-reduce: ingen fjäder-animation. touch-none för pointer-drag
    på mobil. Drag-tillståndet REF-buret (stale-closure-fixen K77).
    Skarp form + ev. SlideToConfirm-primitiv = facit-frågor. */
function PubliceraHandtag({
  publicerad,
  onChange,
}: {
  publicerad: boolean;
  onChange: (v: boolean) => void;
}) {
  const sparRef = useRef<HTMLDivElement>(null);
  const handtagRef = useRef<HTMLSpanElement>(null);
  const dragRef = useRef<number | null>(null);
  // K79: grepp-offset — var i handtaget taget skedde, så cirkeln inte
  // HOPPAR till pekarens position vid greppet (kant-grepp = kant-följ).
  const greppOffsetRef = useRef(0);
  const [dragPos, setDragPos] = useState<number | null>(null);
  const pos = dragPos ?? (publicerad ? 1 : 0);

  const ratio = (clientX: number): number => {
    const spar = sparRef.current;
    if (!spar) return 0;
    const r = spar.getBoundingClientRect();
    return Math.min(
      1,
      Math.max(0, (clientX - greppOffsetRef.current - r.left - 24) / (r.width - 48)),
    );
  };

  const satt = (v: boolean) => {
    if (v && !publicerad) plinga();
    onChange(v);
  };

  const slappDrag = (p: number | null) => {
    if (p != null) satt(p >= 0.9 ? true : p <= 0.1 ? false : publicerad);
    dragRef.current = null;
    setDragPos(null);
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
          satt(!publicerad);
        }
      }}
      onPointerDown={(e) => {
        // K79 (Marcus: "jag måste ju klicka och hålla inne"): draget
        // startar ENDAST med primärknappen nedtryckt OCH greppet PÅ
        // HANDTAGET — klick på rännan teleporterar inte cirkeln.
        if (!e.isPrimary || e.button !== 0) return;
        const h = handtagRef.current?.getBoundingClientRect();
        if (
          !h ||
          e.clientX < h.left ||
          e.clientX > h.right ||
          e.clientY < h.top ||
          e.clientY > h.bottom
        )
          return;
        greppOffsetRef.current = e.clientX - (h.left + h.width / 2);
        // Capture kan kasta NotFoundError om pekaren redan släppts
        // (snabb tap) — draget funkar ändå via move/up på elementet.
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {}
        dragRef.current = ratio(e.clientX);
        setDragPos(dragRef.current);
      }}
      onPointerMove={(e) => {
        if (dragRef.current == null) return;
        // K79-vakten: har knappen släppts utan att up nådde oss (fångst
        // misslyckad/släpp utanför fönstret) avslutas draget — annars
        // följer handtaget ren HOVRING (Marcus-buggen).
        if (e.buttons === 0) {
          slappDrag(dragRef.current);
          return;
        }
        dragRef.current = ratio(e.clientX);
        setDragPos(dragRef.current);
      }}
      onPointerUp={() => slappDrag(dragRef.current)}
      onPointerCancel={() => {
        dragRef.current = null;
        setDragPos(null);
      }}
      className="relative h-12 w-full touch-none select-none rounded-full bg-bg-emphasized"
    >
      {/* K82 (Marcus): den gröna FYLLNADEN — släpet under drag + gröna
          spåret efter mål — PRÖVAD-OCH-RIVEN (K78-formen; K80 slipade
          dess frans men Marcus rev hela greppet). Armad-signalen bärs av
          BOCKEN i cirkeln + texten; rännan förblir tonad i alla lägen.
          Instruktionstextens uttoning under draget behålls. */}
      <span
        aria-hidden="true"
        style={publicerad ? undefined : { opacity: 1 - pos }}
        className={`absolute inset-0 flex items-center justify-center gap-[0.4em] text-small ${
          publicerad ? 'font-medium' : 'text-text-muted'
        }`}
      >
        {publicerad ? 'Publiceras på' : 'Dra för att publicera på'} <MiranonSe />
      </span>
      {/* K79 (Marcus: "ser jättelågupplöst ut"): cirkelns kant bars
          enbart av shadow-sm mot ljus botten — kantutjämningen läste
          som pixlig. Riktig KANT (navcard-bordern) + shadow-md ger
          definierad, skarp cirkel. */}
      <span
        ref={handtagRef}
        aria-hidden="true"
        style={{ left: `calc(${pos * 100}% - ${pos * 48}px)` }}
        className={`absolute top-0 flex size-12 cursor-grab items-center justify-center rounded-full border border-(--mm-navcard-border) bg-surface shadow-md ${
          dragPos == null ? 'motion-safe:transition-[left]' : 'cursor-grabbing'
        }`}
      >
        {publicerad && (
          <Check aria-hidden="true" size={22} strokeWidth={3} className="text-success" />
        )}
      </span>
    </div>
  );
}
