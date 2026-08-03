import { createFileRoute, redirect } from '@tanstack/react-router';
import { parseAsStringEnum, useQueryState } from 'nuqs';
import type { ComponentType } from 'react';
import { PrototypeSwitcher, type PrototypeVariant } from '@/components/dev/PrototypeSwitcher';
// SKARV — när VariantB.tsx/VariantC.tsx landar: byt de TVÅ raderna längst
// ned i den här import-gruppen (de som anropar `skapaPlatshallare`) mot:
//   import { AcceptVariantB, LoginVariantB } from '@/components/dev/prototyp-auth/VariantB';
//   import { AcceptVariantC, LoginVariantC } from '@/components/dev/prototyp-auth/VariantC';
// Exakt en rad byts per variant — resten av filen (VARIANTER, SKARMAR,
// AuthPrototypPage) rörs inte.
import { AcceptVariantA, LoginVariantA } from '@/components/dev/prototyp-auth/VariantA';
import { AcceptVariantB, LoginVariantB } from '@/components/dev/prototyp-auth/VariantB';
import { ToggleButton, ToggleButtonGroup } from '@/components/primitives/ToggleButtonGroup';

export const Route = createFileRoute('/dev/auth-prototyp')({
  // Dev-only prototyp-yta (ADR-044-mönstret, jfr /dev/prototyper): i
  // produktion finns routen i bundlen men är onåbar — beforeLoad kastar
  // redirect före render.
  beforeLoad: () => {
    if (!import.meta.env.DEV) {
      throw redirect({ to: '/' });
    }
  },
  staticData: { title: 'Auth-prototyp — login + accept' },
  component: AuthPrototypPage,
});

/**
 * TASK-127.2 DIVERGENSFAS — auth-prototypen (T66-formen, ADR-074
 * UI-underform B).
 *
 * FRÅGAN: "Hur ska login-vyn och accept-sidan se ut?" — de två skärmar som
 * ÄR Roger och Lottas förstaintryck av appen (TASK-127-PRD:t).
 *
 * TVÅ OBEROENDE AXLAR på samma route:
 * - VARIANT (a/b/c, ADR-074 beslut 1 + URL-STATE-SPEC §Dev-parametrar) —
 *   den dockade railen (PrototypeSwitcher) äger denna axel. Återuppfinns
 *   ALDRIG inline.
 * - SKÄRM (login/accept) — vilken av de två skärmarna som visas. ADR-074
 *   definierar bara `?variant=`/`?data=`; skärmvalet är den här routens EGNA
 *   UI (ett vanligt flik-par via ToggleButtonGroup-primitiven), inte en ny
 *   nyckelrymd i växlar-kontraktet.
 *
 * Båda axlarna är oberoende: byt variant utan att tappa vald skärm, och
 * vice versa — Marcus ska kunna se login OCH accept i alla tre varianter
 * utan att lämna routen (kortets AC#1).
 *
 * B och C existerar inte när detta skrivs — parallella agenter bygger dem
 * (TASK-127.2:s tre delade divergens-spår). Platshållarna nedan renderas
 * inline tills dess; se SKARV-kommentaren vid importerna ovan för den
 * exakta tvåradersbytet per variant.
 */

function skapaPlatshallare(bokstav: 'B' | 'C') {
  const Platshallare = ({ skarm }: { skarm: 'login' | 'accept' }) => (
    <div className="flex w-full max-w-sm flex-col items-center gap-3 rounded-2xl border border-border-strong border-dashed p-10 text-center">
      <p className="font-semibold text-lg text-text">Variant {bokstav}</p>
      <p className="max-w-[26ch] text-body text-text-secondary">
        Byggs av en annan agent. {skarm === 'login' ? 'Login-vyn' : 'Accept-sidan'} landar här när
        filen finns.
      </p>
    </div>
  );
  return {
    Login: () => <Platshallare skarm="login" />,
    Accept: () => <Platshallare skarm="accept" />,
  };
}

const { Login: LoginVariantC, Accept: AcceptVariantC } = skapaPlatshallare('C');

const VARIANTER: PrototypeVariant[] = [
  { key: 'a', label: 'Variant A', steg: 1, stegLabel: 'Steg 1 — divergens' },
  { key: 'b', label: 'Variant B', steg: 1, stegLabel: 'Steg 1 — divergens' },
  { key: 'c', label: 'Variant C', steg: 1, stegLabel: 'Steg 1 — divergens' },
];

const SKARMAR: Record<'login' | 'accept', Record<'a' | 'b' | 'c', ComponentType>> = {
  login: { a: LoginVariantA, b: LoginVariantB, c: LoginVariantC },
  accept: { a: AcceptVariantA, b: AcceptVariantB, c: AcceptVariantC },
};

function IngenSkarpVy({ skarm }: { skarm: 'login' | 'accept' }) {
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-3 rounded-2xl border border-border-light bg-surface p-10 text-center shadow-sm">
      <p className="font-semibold text-lg text-text">Ingen skarp vy här</p>
      <p className="text-body text-text-secondary">
        Den här dev-routen binder bara ihop prototyp-varianterna. Riktiga{' '}
        {skarm === 'login'
          ? 'login-vyn ligger på /login'
          : 'accept-sidan blir /valkommen (TASK-127.6)'}
        .
      </p>
      <p className="text-caption text-text-muted">Välj en variant i railen till höger →</p>
    </div>
  );
}

function AuthPrototypPage() {
  const [variant] = useQueryState('variant');
  const [skarm, setSkarm] = useQueryState(
    'skarm',
    parseAsStringEnum(['login', 'accept'] as const).withDefault('login'),
  );

  const nyckel = variant === 'a' || variant === 'b' || variant === 'c' ? variant : null;
  // OBS: rendera som JSX (<Skarm />), aldrig anropa som funktion — komponenterna
  // äger egna hooks (useState/useEffect), och ett funktionsanrop kringgår Reacts
  // reconciler och bryter Rules of Hooks.
  const Skarm = nyckel == null ? null : SKARMAR[skarm][nyckel];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex flex-wrap items-center justify-between gap-4 border-border-light border-b px-4 py-3">
        <div>
          <p className="font-semibold text-lg text-text">Auth-prototyp — login + accept</p>
          <p className="text-caption text-text-muted">
            TASK-127.2 divergensfas. Variant via railen till höger · skärm via flikarna.
          </p>
        </div>
        <ToggleButtonGroup<'login' | 'accept'>
          label="Skärm"
          selectedKey={skarm}
          onSelectionChange={(key) => setSkarm(key)}
        >
          <ToggleButton id="login">Logga in</ToggleButton>
          <ToggleButton id="accept">Välkommen (accept)</ToggleButton>
        </ToggleButtonGroup>
      </header>

      <main className="flex flex-1 items-center justify-center bg-bg-subtle p-6">
        {Skarm ? <Skarm /> : <IngenSkarpVy skarm={skarm} />}
      </main>

      <PrototypeSwitcher variants={VARIANTER} />
    </div>
  );
}
