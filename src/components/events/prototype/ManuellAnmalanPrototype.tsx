/**
 * [PROTOTYPE] — kastbar kod, levereras ALDRIG (throwaway-kontraktet,
 * prototype-skillen; klausul i+ii).
 *
 * K17 (S73, Marcus-order: "Lägg till manuell anmälan-knapp som tar upp en
 * ny sida där man matar in alla uppgifter — FK-nivå"): manuell
 * anmälan-sidan. Vägen in för anmälningar utanför formuläret (Lotta får
 * mail/telefon privat) — basens Källa="Manuell"-distinktion
 * (formuläranmälningar lämnar Källa TOM; data-model §Anmälningar).
 *
 * Fält-uppsättningen är BASENS Anmälningar-write-fält (data-model
 * §Anmälningar — write-fält): Förnamn · Efternamn · E-post · Mobilnummer ·
 * Antal platser · Notering. Källa/EventKey/Event-länken sätts av systemet
 * i skarpa flödet — visas som förklarande kontext, aldrig som fält
 * (FK-principen: fråga inte efter det systemet redan vet).
 *
 * FK-formklassen: en kolumn · label-över-fält · obligatorisk-markering i
 * etiketten · grupprubriker utanför tonala kort (ProtoGrupp-arvet) ·
 * kontextrad under h1 (vilket event anmälan gäller) · fel visas först
 * vid Spara-försöket, inte medan man skriver. Förklaringstexterna revs
 * på Marcus-order (K18) — rubriken + kontextraden bär betydelsen.
 *
 * PROTOTYP-NO-OP (read-only-regeln): Spara validerar och visar
 * bekräftelse-läget — ingen write; sidladdning nollställer. Skarpa
 * kravet = create-manuell-anmalan-operation (Källa="Manuell" +
 * Event-länk/EventKey server-side) + allowlist-post (PRD-krav).
 */

import { Link, useNavigate } from '@tanstack/react-router';
import { ChevronLeft } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { I18nProvider } from 'react-aria-components';
import { Button } from '@/components/primitives/Button';
import { Input } from '@/components/primitives/Input';
import { MessageBox } from '@/components/primitives/MessageBox';
import { TextArea } from '@/components/primitives/TextArea';
import {
  AntalFalt,
  datumSpannText,
  demoEventById,
  eventName,
  ProtoGrupp,
} from './EventDetailPrototype';

export function ManuellAnmalanPrototype({ eventId }: { eventId: string }) {
  const navigate = useNavigate();
  // Demo-substratet (familje-flödet): kontexten slås upp ur samma
  // demo-data som lista/detalj. `?data=verklig` är detaljsidans axel —
  // formsidan är ren demo-yta tills skarpa flödet finns (PRD).
  const event = demoEventById(eventId);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const [fornamn, setFornamn] = useState('');
  const [efternamn, setEfternamn] = useState('');
  const [epost, setEpost] = useState('');
  const [mobil, setMobil] = useState('');
  const [antal, setAntal] = useState<number | null>(1);
  const [notering, setNotering] = useState('');
  const [visaFel, setVisaFel] = useState(false);
  const [sparad, setSparad] = useState(false);

  useEffect(() => {
    headingRef.current?.focus();
    document.title = 'Lägg till manuell anmälan — Miranon Media Admin';
  }, []);

  const fel = {
    fornamn: fornamn.trim() === '',
    efternamn: efternamn.trim() === '',
    epost: epost.trim() === '' || !epost.includes('@'),
  };
  const harFel = fel.fornamn || fel.efternamn || fel.epost;

  const tillbaka = () =>
    navigate({ to: '/event/$eventId', params: { eventId }, search: (prev) => prev });

  return (
    <section className="flex flex-col gap-6 pt-2 lg:pt-10">
      {/* Toppraden: samma stora runda chevron som detaljsidan (K10-formen);
          search-genomslaget bevarar variant-/data-axeln genom flödet. */}
      <Link
        to="/event/$eventId"
        params={{ eventId }}
        search={(prev) => prev}
        aria-label="Tillbaka till eventet"
        className="mx-4 flex size-11 shrink-0 items-center justify-center self-start rounded-full bg-bg-muted"
      >
        <ChevronLeft aria-hidden="true" size={26} />
      </Link>

      <header className="flex flex-col gap-1.5 border-border border-b px-4 pb-5">
        <h1 ref={headingRef} tabIndex={-1} className="font-semibold text-3xl">
          Lägg till manuell anmälan
        </h1>
        {/* Kontexten: vilket event anmälan gäller — låst, aldrig ett fält. */}
        <p className="text-small text-text-secondary">
          {eventName(event)} · {datumSpannText(event)}
        </p>
      </header>

      {sparad ? (
        <div role="status" className="flex flex-col items-start gap-4 px-4">
          <MessageBox intent="success" title="Anmälan sparad (prototyp)">
            I den skarpa versionen skapas anmälan i basen med källan Manuell och räknas som manuellt
            tillagd på eventets beläggning. Prototypen sparar ingenting.
          </MessageBox>
          <Button intent="primary" onPress={tillbaka}>
            Tillbaka till eventet
          </Button>
        </div>
      ) : (
        <>
          <ProtoGrupp id="ny-anmalan-deltagare" rubrik="Deltagare">
            <div className="flex flex-col gap-4 py-4">
              <Input
                label="Förnamn (obligatorisk)"
                value={fornamn}
                onChange={setFornamn}
                isRequired
                isInvalid={visaFel && fel.fornamn}
                errorMessage="Fyll i förnamn"
              />
              <Input
                label="Efternamn (obligatorisk)"
                value={efternamn}
                onChange={setEfternamn}
                isRequired
                isInvalid={visaFel && fel.efternamn}
                errorMessage="Fyll i efternamn"
              />
              <Input
                label="E-post (obligatorisk)"
                type="email"
                value={epost}
                onChange={setEpost}
                isRequired
                isInvalid={visaFel && fel.epost}
                errorMessage="Fyll i en giltig e-postadress"
              />
              <Input label="Mobilnummer" type="tel" value={mobil} onChange={setMobil} />
            </div>
          </ProtoGrupp>

          <ProtoGrupp id="ny-anmalan-detaljer" rubrik="Anmälan">
            <div className="flex flex-col gap-4 py-4">
              {/* Antal-fältet i rad-stepparens form (K14-arvet); synlig etikett
                  över fältet (formklassen) — AntalFalt bär samma namn som
                  aria-label. */}
              <div className="flex flex-col gap-1">
                <span className="text-(color:--mm-input-label-text) text-small">Antal platser</span>
                <I18nProvider locale="sv-SE">
                  <div className="w-32">
                    <AntalFalt label="Antal platser" value={antal} min={1} onChange={setAntal} />
                  </div>
                </I18nProvider>
              </div>
              <TextArea label="Notering" value={notering} onChange={setNotering} />
            </div>
          </ProtoGrupp>

          {/* Knappraden: primär först (FK-formklassen); px-4 = kortens inner-inset. */}
          <div className="flex items-center gap-2 px-4">
            <Button
              intent="primary"
              onPress={() => {
                setVisaFel(true);
                if (!harFel) setSparad(true);
              }}
            >
              Spara anmälan
            </Button>
            <Button intent="secondary" onPress={tillbaka}>
              Avbryt
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
