import { createFileRoute } from '@tanstack/react-router';
import { PrototypeSwitcher } from '@/components/dev/PrototypeSwitcher';
import { AtgardsSida } from '@/components/events/atgarder/AtgardsSida';

export const Route = createFileRoute('/_authenticated/atgarder')({
  staticData: { title: 'Åtgärder' },
  component: AtgarderUtanEventPage,
});

/**
 * [PROTOTYPE] [S100] Åtgärds-sidan UTAN event — tomt läge.
 *
 * Tunn ingång som renderar SAMMA komponent som
 * `/event/$eventId/atgarder` i tomt läge: eventväljaren står fristående som
 * sidans enda handling, och valet navigerar in i den nästlade routen. TVÅ
 * TILLSTÅND, INTE TVÅ SIDOR — formen är ärvd verbatim ur manuell anmälan
 * (`routes/_authenticated/anmalan/ny.tsx`, task-18.18 beslut 13).
 *
 * MARCUS-KRAV 2026-08-07: "Åtgärds-sidan behöver kunna stå på egna ben också,
 * hon ska kunna gå direkt dit från hem-vyn och välja vilka event hon vill
 * hantera." Hem-vyns knapp är denna routes tänkta ingång — den byggs inte i
 * detta pass, precis som manuell anmälans motsvarande knapp lämnades utanför
 * sin skiva.
 */
const PROTO_VARIANTS = [{ key: 'a', label: 'A — Hubben', steg: 1, stegLabel: 'Konvergens' }];

function AtgarderUtanEventPage() {
  return (
    <>
      <AtgardsSida />
      {import.meta.env.DEV ? <PrototypeSwitcher variants={PROTO_VARIANTS} /> : null}
    </>
  );
}
