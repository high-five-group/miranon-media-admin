import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ context, location }) => {
    // **KRITISK: tre-tillstånds-hantering (sessionsdok Del 5.0 + K3-prompten):**
    // 1. isLoading: vänta — returnera utan throw. Router väntar på re-eval via
    //    router.invalidate() i InnerApp när AuthProvider settles.
    // 2. !isAuthenticated: throw redirect till /login med ursprunglig URL i search.
    // 3. isAuthenticated: tillåt — fortsätt till barn-route.
    //
    // Anti-mönster: "optimistic auth" där vi renderar barn-routes medan auth laddar.
    // Det ger flash av skyddat content. beforeLoad blockerar render via Promise-await.
    if (context.auth.isLoading) {
      return;
    }
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return <Outlet />;
}
