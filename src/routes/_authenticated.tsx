import { Outlet, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated')({
  // beforeLoad-guard implementeras i K3 (AuthProvider + Supabase session-check).
  // TODO K3: redirect till /login om context.auth.user saknas.
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return <Outlet />;
}
