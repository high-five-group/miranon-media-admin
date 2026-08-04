import { createFileRoute, redirect } from '@tanstack/react-router';
import { parseAsStringEnum, useQueryState } from 'nuqs';
import type { ComponentType } from 'react';
import {
  PrototypeSwitcher,
  type PrototypeVariant,
  type PrototypeVy,
} from '@/components/dev/PrototypeSwitcher';
import { AcceptVariantB, LoginVariantB } from '@/components/dev/prototyp-auth/VariantB';

export const Route = createFileRoute('/dev/auth-prototyp')({
  // Dev-only prototyp-yta (ADR-044-mönstret, jfr /dev/prototyper): i
  // produktion finns routen i bundlen men är onåbar — beforeLoad kastar
  // redirect före render.
  beforeLoad: () => {
    if (!import.meta.env.DEV) {
      throw redirect({ to: '/' });
    }
  },
  staticData: { title: 'Auth-prototyp — login + inbjudan' },
  component: AuthPrototypPage,
});

/**
 * TASK-127.2 KONVERGENSFAS — auth-prototypen (T66-formen, ADR-074
 * UI-underform B).
 *
 * FRÅGAN: "Hur ska login-vyn och inbjudnings-sidan se ut?" — de två skärmar
 * som ÄR Roger och Lottas förstaintryck av appen (TASK-127-PRD:t).
 *
 * Divergensen är AVSLUTAD: Marcus valde variant B för båda skärmarna, och
 * A/C är raderade (S96). Kvar är EN variant som itereras — railen visar
 * därför prototyp-ikonen i stället för en kryptisk bokstav.
 *
 * TVÅ AXLAR, BÅDA I RAILEN (S96 — routen bär INGEN egen kontrollyta):
 * - VARIANT (`?variant=`) — ADR-074 beslut 1.
 * - VY (`?skarm=`) — vilken av familjens två skärmar som visas. Axeln flyttades
 *   IN i PrototypeSwitcher denna omgång; tidigare var den routens egen header
 *   med flikar. En prototyp-yta får inte bära en egen liten app ovanpå det som
 *   ska bedömas — headern konkurrerade visuellt med själva designen.
 *
 * BREDDEN: appens `max-w-[600px]` (AppShell) × 2 = 1200 px, samma ram för
 * BÅDA skärmarna. Tidigare satt skärmarna i en centrerad flex-container och
 * blev shrink-to-fit — de fick alltså olika bredd av att ha olika mycket
 * innehåll, vilket gjorde dem omöjliga att jämföra rättvist.
 */

const VARIANTER: PrototypeVariant[] = [
  { key: 'b', label: 'Variant B', steg: 4, stegLabel: 'Steg 4 — konvergens' },
];

const VYER: PrototypeVy[] = [
  { key: 'login', label: 'Logga in' },
  { key: 'accept', label: 'Inbjudan' },
];

const SKARMAR: Record<'login' | 'accept', ComponentType> = {
  login: LoginVariantB,
  accept: AcceptVariantB,
};

function IngenSkarpVy({ skarm }: { skarm: 'login' | 'accept' }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg-subtle p-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-3 rounded-2xl border border-border-light bg-surface p-10 text-center shadow-sm">
        <p className="font-semibold text-lg text-text">Ingen skarp vy här</p>
        <p className="text-body text-text-secondary">
          Den här dev-routen binder bara ihop prototypen. Riktiga{' '}
          {skarm === 'login'
            ? 'login-vyn ligger på /login'
            : 'inbjudnings-sidan blir /valkommen (TASK-127.6)'}
          .
        </p>
        <p className="text-caption text-text-muted">Välj prototypen i railen till höger →</p>
      </div>
    </div>
  );
}

function AuthPrototypPage() {
  const [variant] = useQueryState('variant');
  const [skarm] = useQueryState(
    'skarm',
    parseAsStringEnum(['login', 'accept'] as const).withDefault('login'),
  );

  const arPrototyp = variant === 'b';
  // OBS: rendera som JSX (<Skarm />), aldrig anropa som funktion — komponenterna
  // äger egna hooks (useState/useEffect), och ett funktionsanrop kringgår Reacts
  // reconciler och bryter Rules of Hooks.
  const Skarm = SKARMAR[skarm];

  return (
    <>
      {/* Ramen är ENDA skillnaden mot skarpt läge: 1200 px centrerat, inget
          annat. Ingen padding och ingen centrerings-flex — skärmarna äger sin
          egen höjd (`min-h-dvh`) och ska fylla ramen kant i kant. */}
      <div className="mx-auto w-full max-w-[1200px]">
        {arPrototyp ? <Skarm /> : <IngenSkarpVy skarm={skarm} />}
      </div>

      <PrototypeSwitcher variants={VARIANTER} vyer={VYER} vyParam="skarm" />
    </>
  );
}
