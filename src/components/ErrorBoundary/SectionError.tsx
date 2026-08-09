import { type ErrorComponentProps, useRouter } from '@tanstack/react-router';
import { Button, MessageBox } from '@/components/primitives';

/**
 * Sektions-fallback (Fas 5, byggplan DoD 6) — wirad som routerns
 * `defaultErrorComponent` (src/router.ts) så ALLA routes täcks utan
 * per-route-duplicering. Ersätter RouteErrorFallback (ADR-038-eran) per
 * Session 16 K4-konsolideringen till exakt två fel-lager (sektion + app).
 *
 * Renderar i Outlet-positionen: vid fel i en route överlever skalet
 * (header + tab bar) och navigation till andra flikar fungerar.
 *
 * - MessageBox intent="error" ger `role="alert"` (assertiv annonsering).
 * - "Försök igen" = routerns reset-mekanism (remount) + invalidate
 *   (kör om loaders/beforeLoad — reset ensam läker inte loader-fel).
 * - INGEN egen Sentry-capture: createRoot-hooken `onCaughtError`
 *   (src/main.tsx) rapporterar redan — dubbel-rapporterings-skydd
 *   (K4-beslut 3).
 */
export function SectionError({ reset }: ErrorComponentProps) {
  const router = useRouter();
  return (
    <MessageBox intent="error" title="Något gick fel">
      <p>
        Den här delen av sidan kunde inte visas. Försök igen - ladda om hela sidan om felet
        kvarstår.
      </p>
      <Button
        intent="secondary"
        size="sm"
        className="mt-3"
        onPress={() => {
          reset();
          router.invalidate();
        }}
      >
        Försök igen
      </Button>
    </MessageBox>
  );
}
