import * as Sentry from '@sentry/react';
import { createFileRoute, redirect, useNavigate, useSearch } from '@tanstack/react-router';
import { type FormEvent, useState } from 'react';
import { z } from 'zod';
import { useAuth } from '../auth/useAuth';

// Zod v4-syntax: schema direkt i validateSearch (ingen zodValidator-adapter krävs).
// `redirect`-param sparas vid `_authenticated.tsx beforeLoad`-redirect så användaren
// återvänder till ursprunglig sida efter login.
const loginSearchSchema = z.object({
  redirect: z.string().optional().default('/hem'),
});

export const Route = createFileRoute('/login')({
  staticData: { title: 'Logga in' },
  validateSearch: loginSearchSchema,
  beforeLoad: ({ context, search }) => {
    // Redan inloggad? Hoppa direkt till redirect-target. Skyddar mot "stuck on /login"
    // för redan-autentiserade users.
    if (context.auth.isAuthenticated) {
      throw redirect({ to: search.redirect });
    }
  },
  component: LoginRoute,
});

/**
 * Login-vy. Minimal HTML-form med a11y full 11 (label-input-koppling, aria-describedby
 * för fel-state, aria-live för status, fokus-management).
 *
 * **Designval:** Plain `<form>` + Tailwind, INTE React Aria. Refactor till React Aria Form
 * + MmInput + MmButton sker i Fas 3 (designsystem).
 */
function LoginRoute() {
  const auth = useAuth();
  const navigate = useNavigate();
  const search = useSearch({ from: '/login' });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await auth.login(email, password);
      // router.invalidate() i InnerApp triggar beforeLoad-re-eval. Navigate till redirect-target.
      navigate({ to: search.redirect });
    } catch (err) {
      // Supabase auth-errors är medvetet otydliga om "fel email" vs "fel lösenord"
      // (motverkar email-enumeration). Visa generiskt felmeddelande.
      setError('Felaktiga inloggningsuppgifter. Försök igen.');
      Sentry.captureException(err, { tags: { auth: 'login-form' } });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4"
        aria-labelledby="login-heading"
      >
        <h1 id="login-heading" className="font-bold text-2xl">
          Logga in
        </h1>

        <div className="flex flex-col gap-1">
          <label htmlFor="login-email" className="font-medium text-sm">
            E-postadress
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            className="rounded border px-3 py-2"
            aria-describedby={error ? 'login-error' : undefined}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="login-password" className="font-medium text-sm">
            Lösenord
          </label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting}
            className="rounded border px-3 py-2"
            aria-describedby={error ? 'login-error' : undefined}
          />
        </div>

        {error && (
          <div id="login-error" role="alert" aria-live="polite" className="text-red-600 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-primary px-4 py-2 text-white disabled:opacity-50"
        >
          {isSubmitting ? 'Loggar in…' : 'Logga in'}
        </button>
      </form>
    </main>
  );
}

// JSDoc-not: Refactor till React Aria Form + MmInput + MmButton + MmCard sker i Fas 3.
// Vid refactor: behåll a11y-attribut (htmlFor/id, aria-describedby, aria-live, autoComplete).
