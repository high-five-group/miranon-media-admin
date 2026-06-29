import { createFileRoute, Link } from '@tanstack/react-router';
import { useAuth } from '@/auth/useAuth';
import { Button } from '@/components/primitives/Button';

export const Route = createFileRoute('/_authenticated/mer/')({
  staticData: { title: 'Mer' },
  component: MerPage,
});

// Mer-landning (Fas 6c Leverabel 3): statisk länklista (spec bekräftar statisk
// Mer-vy — ingen URL-state). Väntelistan är den första riktiga Mer-ytan; övriga
// (leads, mailutskick m.m.) byggs i Fas 6e. <Outlet/> bärs av _authenticated.
function MerPage() {
  const { logout } = useAuth();

  return (
    <section className="flex flex-col gap-6 p-4">
      <h1 className="font-semibold text-2xl">Mer</h1>
      <nav aria-label="Mer-sidor">
        <ul className="flex flex-col gap-2">
          <li>
            <Link to="/mer/vantelista" className="underline">
              Väntelista
            </Link>
          </li>
          <li>
            <Link to="/mer/intresserade" className="underline">
              Intresserade
            </Link>
          </li>
          <li>
            <Link to="/mer/maillogg" className="underline">
              Maillogg
            </Link>
          </li>
          <li>
            <Link to="/mer/segment" className="underline">
              Bygg segment
            </Link>
          </li>
          <li>
            <Link to="/mer/skapa-event" className="underline">
              Skapa nytt event
            </Link>
          </li>
        </ul>
      </nav>

      {/* Logout är en HANDLING, inte navigering → egen block UTANFÖR nav-landmärket
          (får ej vara en nav-länk). Redirect till /login sköts av _authenticated-
          guarden: logout() → onAuthStateChange → router.invalidate() (main.tsx) →
          beforeLoad re-evaluerar → redirect (ADR-037-kedjan) — ingen manuell redirect
          här. Ingen bekräftelse-dialog (avsiktligt, Fas 6e L2). Ingen Inställningar
          (de-scopad till separat doc-landning). Button-primitiv = a11y-golv (riktig
          <button>, focus-visible via global regel, kontrast-token, träffyta ≥40px). */}
      <div>
        <Button intent="secondary" onPress={() => void logout()}>
          Logga ut
        </Button>
      </div>
    </section>
  );
}
