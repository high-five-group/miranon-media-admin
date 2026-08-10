import { createFileRoute } from '@tanstack/react-router';
import { useQueryState } from 'nuqs';
import { PrototypeSwitcher } from '@/components/dev/PrototypeSwitcher';
import { PersonDetail } from '@/components/persons';
import {
  PersonDetailPrototyp,
  type PersonDetailVariant,
} from '@/components/persons/PersonDetailPrototyp';

export const Route = createFileRoute('/_authenticated/personer/$personId')({
  staticData: { title: 'Persondetalj' },
  component: PersonDetailPage,
});

/**
 * [PROTOTYPE] S90 divergens-pass — KASTBAR WIRING (throwaway-kontraktet).
 *
 * FRÅGAN: "Hur ska persondetalj-sidan arrangeras — vad är sidans huvudsak?"
 * Fullständig märkning + variantbeskrivningar:
 * `src/components/persons/PersonDetailPrototyp.tsx`.
 *
 * TRE varianter (`?variant=a|b|c`) — `label`/`stegLabel` renderas ingenstans
 * efter ADR-074 Amendering 5 men är obligatoriska i typen; de skrivs som
 * dokumentation. `steg: 1` för alla tre: divergens-passet har inga
 * konvergens-steg (steget bumpas först när en vinnare itereras).
 *
 * RIVNING: ta bort denna kommentar + `PROTO_VARIANTS` + `PROTO_NYCKLAR` +
 * `arProtoVariant` + `proto`-grenen + rail-monteringen, och `git rm`
 * prototyp-komponenten. Skarpa grenen nedan är ORÖRD — prototypen läggs
 * BREDVID, aldrig i.
 */
const PROTO_VARIANTS = [
  { key: 'a', label: 'A - Historik-först', steg: 1, stegLabel: 'Divergens' },
  { key: 'b', label: 'B - Kontakt-först', steg: 1, stegLabel: 'Divergens' },
  { key: 'c', label: 'C - Tidslinje', steg: 1, stegLabel: 'Divergens' },
  // `d` är Marcus egen blockordning (S103) — INTE ett fjärde divergens-förslag.
  // Formvalet på a/b/c hoppades över; D ÄR valet, och a/b/c står kvar enbart
  // som jämförelseytor. Därav `steg: 2`/Konvergens: numret bumpas när en
  // vinnare itereras (ADR-074 beslut 1).
  { key: 'd', label: 'D - Syntesen', steg: 2, stegLabel: 'Konvergens' },
];

const PROTO_NYCKLAR: readonly string[] = ['a', 'b', 'c', 'd'];

function arProtoVariant(v: string | null): v is PersonDetailVariant {
  return v != null && PROTO_NYCKLAR.includes(v);
}

// Persondetalj (Fas 6a L5a) — aggregerande full-historik-vy via get-person
// (fetchPerson + router-context-DI, ADR-055). Syskon-leaf till personer/index;
// logiken bor i PersonDetail-komponenten, routen plockar bara ut param:t.
function PersonDetailPage() {
  const { personId } = Route.useParams();
  // [PROTOTYPE] DEV-grinden är VÅR — PrototypeSwitcher har ingen egen.
  const [variant] = useQueryState('variant');
  const proto = import.meta.env.DEV && arProtoVariant(variant);

  return (
    <>
      {/* Komponent-BYTE, inte gren inuti den skarpa komponenten: hook-antalet
          får aldrig ändras mitt i en session när railen togglas. */}
      {proto && arProtoVariant(variant) ? (
        <PersonDetailPrototyp personId={personId} variant={variant} />
      ) : (
        <PersonDetail personId={personId} />
      )}
      {/* [PROTOTYPE] Rail-monteringen. `data-proto-rail` är snapshot-hooken
          (byggunderlagets R6: railen är `fixed z-50` och hamnar annars i
          bilagebilderna) — dev-överlägget maskas bort via CSS i snapshot-
          specen, aldrig via en app-namnrymds-kollision (R9/L308). */}
      {import.meta.env.DEV && (
        <div data-proto-rail="">
          <PrototypeSwitcher variants={PROTO_VARIANTS} />
        </div>
      )}
    </>
  );
}
