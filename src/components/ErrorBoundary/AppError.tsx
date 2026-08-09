import { Component, type ReactNode } from 'react';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

/**
 * App-boundary (Fas 5, byggplan DoD 7) — sista skyddslagret, monteras i
 * src/main.tsx runt providers + RouterProvider och täcker därmed även
 * provider-/render-gate-fel utanför routern (todo-trådens fråga 2).
 * Tar över __root:s rivna Sentry.ErrorBoundary-roll (Session 16 K4,
 * konsolidering till exakt två fel-lager).
 *
 * Medvetet beroende-snål: klasskomponent, inline-stilar utan tokens/CSS
 * (ska rendera även när stylesheet/design-system är trasigt), ingen
 * primitiv-import. Ingen egen Sentry-capture — createRoot-hooken
 * `onCaughtError` rapporterar (K4-beslut 3); componentDidCatch loggar
 * endast, inslaget i try/catch så boundaryn aldrig själv kastar.
 */
export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, errorInfo: unknown): void {
    try {
      console.error('App-fel fångat av AppErrorBoundary:', error, errorInfo);
    } catch {
      // Medvetet tyst — fallbacken får aldrig själv kasta.
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            fontFamily: 'system-ui, sans-serif',
            lineHeight: 1.6,
            margin: '0 auto',
            maxWidth: '28rem',
            padding: '1.5rem',
          }}
        >
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Något gick fel</h1>
          <p style={{ margin: '0.75rem 0 0' }}>
            Appen kunde inte återhämta sig från ett fel. Ladda om sidan för att fortsätta - du
            förlorar inget av det du har sparat.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{ marginTop: '1rem', minHeight: '44px', padding: '0.5rem 1.25rem' }}
          >
            Ladda om
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
