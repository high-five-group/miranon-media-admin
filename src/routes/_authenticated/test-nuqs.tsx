import { createFileRoute } from '@tanstack/react-router';
import { parseAsString, useQueryState } from 'nuqs';

/**
 * **DEV-ONLY route** för nuqs-arkitektur-validering (DoD 4 Fas 2).
 *
 * Användning: navigera till `/_authenticated/test-nuqs` i dev-mode och verifiera
 * att `?test=<värde>` synkroniseras med input-fält.
 *
 * **Tas bort i Fas 6** när första riktiga nuqs-vy aktiveras (förmodat
 * `_authenticated/dokumenten.tsx` eller liknande). Per Marcus + sessionsdok Del 4.
 *
 * Route gated på `import.meta.env.DEV` via render-time-check — i prod-build
 * renderar route en "Not available in production"-meddelande snarare än att
 * vara helt frånvarande från route-tree (förenklar bundle-analys + Playwright-test).
 */
export const Route = createFileRoute('/_authenticated/test-nuqs')({
  component: TestNuqsRoute,
});

function TestNuqsRoute() {
  const [testValue, setTestValue] = useQueryState('test', parseAsString.withDefault(''));

  if (!import.meta.env.DEV) {
    return (
      <main className="p-4">
        <h1 className="font-bold text-xl">Test route ej tillgänglig i produktion</h1>
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-4 p-4">
      <h1 className="font-bold text-2xl">nuqs test-route (dev only)</h1>
      <p className="text-gray-600 text-sm">
        Synkroniserar input med URL <code>?test=...</code>. Detta är endast en DoD 4- verifieringsvy
        och tas bort i Fas 6.
      </p>

      <div className="flex max-w-sm flex-col gap-1">
        <label htmlFor="test-input" className="font-medium text-sm">
          Test-värde
        </label>
        <input
          id="test-input"
          type="text"
          value={testValue}
          onChange={(e) => setTestValue(e.target.value)}
          className="rounded border px-3 py-2"
          autoComplete="off"
          data-testid="nuqs-test-input"
        />
      </div>

      <div className="text-sm">
        URL-state: <code data-testid="nuqs-test-value">{testValue || '(tomt)'}</code>
      </div>
    </main>
  );
}
