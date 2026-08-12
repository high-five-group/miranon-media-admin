import { createFileRoute } from '@tanstack/react-router';
import { PersonDetail } from '@/components/persons';

export const Route = createFileRoute('/_authenticated/personer/$personId')({
  staticData: { title: 'Persondetalj' },
  component: PersonDetailPage,
});

// Persondetalj (Fas 6a L5a) — aggregerande full-historik-vy via get-person
// (fetchPerson + router-context-DI, ADR-055). Syskon-leaf till personer/index;
// logiken bor i komponenten, routen plockar bara ut param:t.
//
// PROTOTYP-MASKINERIET RIVET 2026-08-12 (ADR-103 B2 steg 4), efter Marcus
// godkännande via ADR-104:s kanalseparation (kvitto i manifestets `godkand`,
// av: marcus, sha: 4648823a). Rivet: `PROTO_VARIANTS`, rail-monteringen
// (`PrototypeSwitcher`), `useQueryState('variant')` och variant-villkoret.
// Villkor och växlar — ALDRIG form.
//
// FILEN BYTTE NAMN i samma landning: `PersonDetailPrototyp.tsx` →
// `PersonDetail.tsx`, buret av git som en rename så historiken följer FORMEN
// och inte filnamnet. Den gamla skarpa `PersonDetail.tsx` (271 rader) är därmed
// borta; den promoverade formen ÄR nu den skarpa komponenten, vilket är hela
// innebörden av ADR-103 B1 ("det skarpa bygget avskaffas som begrepp").
// Personlistans precedent: commit 4aad0111.
//
// En stale `?variant=`-URL (bokmärke, delad länk, öppen flik) är harmlös:
// ingen fil läser parametern längre, så adressen renderar exakt samma träd som
// ingen query alls.
function PersonDetailPage() {
  const { personId } = Route.useParams();
  return <PersonDetail personId={personId} />;
}
