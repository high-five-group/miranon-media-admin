import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { AppShell } from '@/components/AppShell';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ context, location }) => {
    // Auth-resolution är render-gate:ad i InnerApp (main.tsx, ADR-037): context.auth är
    // definitiv (isLoading=false) när denna beforeLoad körs. Här återstår enbart
    // behörighetskontrollen — ej autentiserad → redirect till /login med ursprungs-URL i
    // search (så användaren återvänder efter login).
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      });
    }
  },
  component: AuthenticatedLayout,
});

// App-skalet (header + main + tab bar + skip-länk) bor på denna layout, inte
// __root: login/dev-ytorna bär egna <main>-landmarks och tab bar utanför
// inloggat läge vore död navigation (Session 16 K3 STOPPA-utfall A).
function AuthenticatedLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
