import { createFileRoute, redirect } from '@tanstack/react-router';
import { useState } from 'react';
import { Button } from '@/components/primitives';
import { VITE_PRELOAD_ERROR_EVENT } from '@/lib/chunk-laddningsfel';

/**
 * Dev-only feltrigger för `SectionError`s knappval (TASK-285.7).
 *
 * SYSKON till `/dev-fel` (`src/routes/_authenticated/dev-fel.tsx`), men
 * MEDVETET fixture-fri i stället för `/_authenticated`: TASK-285.7s AC #4
 * kräver ett bevis i `tests/webblasarbeteende/` (ADR-094), en klass som kör
 * UTAN `storageState` (`playwright.config.ts`s `webblasarbeteende`-projekt,
 * jfr `app-chunk-laddningsfel.test.ts`/`app-update-banner.test.ts` som båda
 * går mot `/dev/primitives` av samma skäl). En route under `/_authenticated`
 * hade omdirigerat till `/login` i den kontexten (`_authenticated.tsx`s
 * `beforeLoad`) — routern kan inte nå SectionError-läget alls utan en
 * inloggad session. `/dev-fel` fortsätter bevisa DoD 6 (skalet överlever,
 * authenticated e2e); denna route bevisar bara KNAPPVALET.
 *
 * DEV-guard (ADR-044-mönstret, jfr `/dev/primitives`): i produktion finns
 * routen i bundeln men är onåbar — `beforeLoad` kastar redirect före render.
 */
export const Route = createFileRoute('/dev/sektionsfel')({
  beforeLoad: () => {
    if (!import.meta.env.DEV) {
      throw redirect({ to: '/' });
    }
  },
  staticData: { title: 'Sektionsfel (dev)' },
  component: DevSektionsfelPage,
});

type Fellage = 'ingen' | 'vanligt' | 'chunk';

function DevSektionsfelPage() {
  const [fellage, setFellage] = useState<Fellage>('ingen');

  if (fellage === 'vanligt') {
    throw new Error('Medvetet sektions-fel - DEV-feltrigger (TASK-285.7)');
  }
  if (fellage === 'chunk') {
    throw new Error('Medvetet chunk-fel - DEV-feltrigger (TASK-285.7)');
  }

  return (
    <>
      <h1>Sektionsfel (dev)</h1>
      <p className="mt-2 text-small text-text-secondary">
        Kastar ett renderingsfel i denna route så att SectionErrors knappval kan verifieras: ett
        vanligt fel visar "Försök igen", ett chunk-fel visar ingen knapp alls (TASK-285.13:
        chunk-bannern äger "Ladda om") - samma igenkänning som{' '}
        <code>src/lib/chunk-laddningsfel.ts</code> redan bär.
      </p>
      <div className="mt-4 flex gap-3">
        <Button intent="danger" size="md" onPress={() => setFellage('vanligt')}>
          Kasta sektions-fel
        </Button>
        <Button
          intent="danger"
          size="md"
          onPress={() => {
            // Samma händelsekonstruktor som Vites egen preload-helper och
            // testsviten `app-chunk-laddningsfel.test.ts`: sätter modulens
            // `omladdningKravs` INNAN felet kastas, precis som i produktion
            // (se chunk-laddningsfel.ts:s filhuvud).
            window.dispatchEvent(new Event(VITE_PRELOAD_ERROR_EVENT, { cancelable: true }));
            setFellage('chunk');
          }}
        >
          Kasta chunk-fel
        </Button>
      </div>
    </>
  );
}
