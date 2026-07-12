import { createFileRoute, Link } from '@tanstack/react-router';
import { CalendarPlus, ClipboardList, Filter, Hourglass, LogOut, Mail, Star } from 'lucide-react';
import type { ComponentType } from 'react';
import { useAuth } from '@/auth/useAuth';
import { Button } from '@/components/primitives/Button';

/*
 * [PROTOTYPE] T69-konvergensen (S64) — throwaway-kontraktet gäller.
 *
 * FRÅGAN (klausul i): Hur ska Mer-landningen se ut i FK-formen —
 * facit-läget ur Revision S64: synlig "Mer"-h1, sex kort-rader
 * (ikon + etikett + chevron) i TVÅ luftgrupper, centrerad Logga ut
 * med LogOut-ikon, hideShellHeader på?
 *
 * Startade som EXAKT kopia av dagens Mer-vy (M1-baslinjen,
 * skärmdump i sessionsbilagorna); itereras med Marcus i browsern
 * tills facit låses (K10-praxis). Leveransen skrivs därefter
 * NYSKRIVEN genom leverans-grindarna (NavCard-primitiven 11/11/11
 * per beslut D) — denna kod raderas (klausul iv).
 */

export const Route = createFileRoute('/_authenticated/mer/')({
  // [PROTOTYPE] hideShellHeader per F-beslutet (Hem-skelettmönstret).
  staticData: { title: 'Mer', hideShellHeader: true },
  component: MerPage,
});

// [PROTOTYPE] Rad-modellen speglar blivande NavCard-API:t { to, icon, label }
// (beslut D) — men detta är prototyp-form, inte primitiven.
type ProtoRow = {
  to: string;
  icon: ComponentType<{ size?: number; 'aria-hidden'?: boolean; className?: string }>;
  label: string;
};

// Grupp 1: listorna (samsyn C, Revision S64: två grupper).
const listRows: ProtoRow[] = [
  { to: '/mer/anmalningar', icon: ClipboardList, label: 'Anmälningar' },
  { to: '/mer/vantelista', icon: Hourglass, label: 'Väntelista' },
  { to: '/mer/intresserade', icon: Star, label: 'Intresserade' },
  { to: '/mer/maillogg', icon: Mail, label: 'Maillogg' },
];

// Grupp 2: handling före verktyg (samsyn C). [PROTOTYPE] M6: Bygg
// segment Users→Filter — Users är Personer-flikens ikon (krock funnen
// i detalj-svepet); segment byggs med filter (domänbegrepps-mappning).
const actionRows: ProtoRow[] = [
  { to: '/mer/skapa-event', icon: CalendarPlus, label: 'Skapa nytt event' },
  { to: '/mer/segment', icon: Filter, label: 'Bygg segment' },
];

// [PROTOTYPE] Kort-raden — FK IMG_1541-formen: hel radyta klickbar,
// ikon vänster (dekorativ), etikett bär länknamnet. Chevronen borttagen
// M4 (Marcus-varv 3 — öppen revision av samsyn D:s "alltid med",
// bokförs vid facit-låsningen).
function ProtoNavCard({ to, icon: Icon, label }: ProtoRow) {
  return (
    <li>
      <Link
        to={to}
        className="flex min-h-12 items-center gap-4 rounded-2xl border border-transparent bg-bg-muted px-4 py-4 contrast-more:border-border-strong"
      >
        {/* [PROTOTYPE] M5: exakt tabbar-paritet — size 20 + inaktiva
            flikens ikonfärg (text-secondary), Marcus-varv 4. */}
        <Icon size={20} aria-hidden className="shrink-0 text-text-secondary" />
        {/* [PROTOTYPE] M6: semibold per FK-vikten + anmälningsradernas
            namn-precedent (16/600). */}
        <span className="grow font-semibold">{label}</span>
      </Link>
    </li>
  );
}

function MerPage() {
  const { logout } = useAuth();

  // [PROTOTYPE] M6-måtten (FK IMG_1541 + Hem-paritet): ingen egen
  // sidopadding (skalets 16 px = FK:s marginal; p-4 gav dubbel kant),
  // pt-2 lg:pt-10 som Hem, gap-8 rubrik→innehåll (FK ~38 pt), gap-2.5
  // inom grupp (FK ~10 pt), px-4 py-4 på raden (FK ~51 pt radhöjd).
  return (
    <section className="flex flex-col gap-8 pt-2 lg:pt-10">
      {/* Synlig h1 per rubrikpolicyn (Revision S64 punkt 1) — FK large-title-läget. */}
      <h1 className="font-semibold text-3xl">Mer</h1>
      <nav aria-label="Mer-sidor" className="flex flex-col gap-8">
        <ul className="flex flex-col gap-2.5">
          {listRows.map((row) => (
            <ProtoNavCard key={row.to} {...row} />
          ))}
        </ul>
        <ul className="flex flex-col gap-2.5">
          {actionRows.map((row) => (
            <ProtoNavCard key={row.to} {...row} />
          ))}
        </ul>
      </nav>

      {/* Logga ut per E: HANDLING utanför nav-landmärket, centrerad under
          radgrupperna, lucide LogOut + text, ghost-intent. Verklig logout-
          wiring behålls (befintlig auth-handling, ingen ny mutation). */}
      <div className="flex justify-center pt-4">
        <Button intent="ghost" onPress={() => void logout()}>
          <LogOut size={20} aria-hidden />
          Logga ut
        </Button>
      </div>
    </section>
  );
}
