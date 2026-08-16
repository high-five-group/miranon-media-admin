import { ListChecks, UserPlus } from 'lucide-react';
import { NavCard } from '@/components/primitives';

/**
 * Genvägar — manuell anmälan + Åtgärds-sidan (TASK-243.1, promoverad ur
 * `dev/hem-prototyp/ui.tsx` Genvagar, facit "hem-vyn V1 Lugna morgonen").
 * BÅDA är REDAN skarpa, byggda routes (`/anmalan/ny`, `/atgarder`) vars
 * "tomt läge" ÄR eventväljar-steget (147.8-språket) — riktiga länkar, inte
 * döda ingångar. Ersätter den retirerade `CTA.tsx`.
 */
export function Genvagar() {
  return (
    <section aria-labelledby="hem-genvagar" className="flex min-w-0 flex-col gap-3">
      <h2 id="hem-genvagar" className="font-semibold text-2xl">
        Genvägar
      </h2>
      <nav aria-label="Genvägar">
        <ul className="flex flex-col gap-3">
          <li>
            <NavCard to="/anmalan/ny" icon={UserPlus} label="Lägg till manuell anmälan" />
          </li>
          <li>
            <NavCard to="/atgarder" icon={ListChecks} label="Öppna Åtgärds-sidan" />
          </li>
        </ul>
      </nav>
    </section>
  );
}
