import { Component, type ReactNode } from 'react';
import { AppErrorFallback } from './AppErrorFallback';

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
 * Fallbacken själv (formen, copyn, inline-stilarna) bor sedan TASK-285.3 i
 * `AppErrorFallback.tsx` — brutits ut till en egen exporterad komponent så
 * att `/dev/primitives` kan visa den och axe-sviten nå den utan att krascha
 * appen. Boundaryn RENDERAR fallbacken (utan `inbaddad` — default `false`
 * behåller `role="alert"` här) men äger ingen egen stil. Ingen egen
 * Sentry-capture — createRoot-hooken `onCaughtError` rapporterar
 * (K4-beslut 3); componentDidCatch loggar endast, inslaget i try/catch så
 * boundaryn aldrig själv kastar.
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
      return <AppErrorFallback />;
    }
    return this.props.children;
  }
}
