import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  beforeLoad: ({ context }) => {
    // Pure redirect: utloggad → /login, inloggad → /hem.
    // Ingen component renderas — beforeLoad kastar redirect alltid.
    if (context.auth.isAuthenticated) {
      throw redirect({ to: '/hem' });
    }
    throw redirect({ to: '/login' });
  },
});
