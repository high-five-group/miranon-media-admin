import { createFileRoute } from '@tanstack/react-router';
import { AtgardsSida } from '@/components/events/atgarder/AtgardsSida';

export const Route = createFileRoute('/_authenticated/atgarder')({
  staticData: { title: 'Åtgärder' },
  component: AtgarderUtanEventPage,
});

/**
 * Åtgärds-sidan UTAN event — tomt läge. PRODUKTIONSKOD sedan TASK-171.5
 * (ADR-103 B2 steg 4) — Marcus godkännande (2026-08-09,
 * tasks/sessions/bilagor/s93-atgardssida-promovering/facit.json) gör denna
 * formen den enda och permanenta, inte en av flera prototyp-varianter.
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
 *
 * [RIVEN, TASK-171.5, ADR-103 B2 steg 4] `PrototypeSwitcher`-monteringen +
 * `PROTO_VARIANTS` (en enda post, `key: 'a'`) rivna efter Marcus
 * godkännande — ingen kod läste `variantParam` (171.1/171.2:s mätta
 * divergens), så borttagningen är ren byggställning, ingen formändring.
 */
function AtgarderUtanEventPage() {
  return <AtgardsSida />;
}
