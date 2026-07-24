/**
 * [PROTOTYPE] S83 pass 2 — TASK-18.15. KASTBAR KOD (throwaway-kontraktet;
 * prototype-skillen UI-grenen, konvergens-fasen T78 b / ADR-074).
 *
 * FRÅGAN (nedskriven, klausul i): Ska åtgärds-radernas ledande ikoner
 * ersättas av RADNUMMER i grå rutor (referentbarhet — "gå till åtgärd 4",
 * Gunilla-principen), och i så fall i vilken form: nummer ensamt eller
 * nummer + ikon? (Avslag = skarpa vyn består.)
 *
 * Konvergens från EXAKT KOPIA av Atgarder.tsx; check-in-kortet och
 * chevronerna berörs EJ (kortets avgränsning). AT-PARITET: radnamnen och
 * aria-disabled-interimen är oförändrade — numret är aria-hidden dekor.
 * URL: /event/$eventId?variant=k (utan param = skarpa vyn).
 */
import { Link } from '@tanstack/react-router';
import { BadgeCheck, ChevronRight, type LucideIcon, Mail, Plus, Printer } from 'lucide-react';
import type { PrototypeVariant } from '@/components/dev/PrototypeSwitcher';
import { DetaljGrupp } from './DetaljGrupp';

export const PROTO_VARIANTS_18_15: PrototypeVariant[] = [
  {
    key: 'k',
    label: 'Numrerade boxar',
    steg: 3,
    stegLabel: 'Steg 3 — LÅST: nummer ensamt, vit ruta (Marcus 2026-07-24)',
  },
];

/** Iterationsratt: 'nummer' | 'nummer+ikon' — flippas på Marcus ord (HMR). */
const FORM: 'nummer' | 'nummer+ikon' = 'nummer';

const RAD_KLASS =
  '-mx-2 flex w-auto items-center gap-2 rounded-lg px-2 py-1.5 text-left font-medium text-body hover:bg-bg-emphasized motion-safe:transition-colors';

/** Radnumret i grå ruta (kortets skiss: hörnradie mot kortets ytterram —
    startvärde rounded-lg, radien itereras i browsern). aria-hidden: numret
    är visuell referens; radNAMNET är oförändrat (AT-paritet per AC 2). */
function NumRuta({ n }: { n: number }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex size-6 shrink-0 items-center justify-center rounded-lg bg-surface font-semibold text-caption text-text-secondary"
    >
      {n}
    </span>
  );
}

function HandlingsRad({
  nummer,
  ikon: Ikon,
  onPress,
  ariaDisabled,
  children,
}: {
  nummer: number;
  ikon: LucideIcon;
  onPress?: () => void;
  ariaDisabled?: boolean;
  children: string;
}) {
  return (
    <div className="flex flex-col py-1.5">
      <button
        type="button"
        onClick={onPress}
        aria-disabled={ariaDisabled || undefined}
        className={RAD_KLASS}
      >
        <NumRuta n={nummer} />
        {FORM === 'nummer+ikon' && <Ikon aria-hidden="true" size={16} className="shrink-0" />}
        {children}
        <ChevronRight
          aria-hidden="true"
          size={18}
          className="ml-auto shrink-0 text-text-secondary"
        />
      </button>
    </div>
  );
}

function HandlingsLank({
  nummer,
  ikon: Ikon,
  to,
  eventId,
  children,
}: {
  nummer: number;
  ikon: LucideIcon;
  to: '/event/$eventId/ny-anmalan' | '/event/$eventId/narvaro';
  eventId: string;
  children: string;
}) {
  return (
    <div className="flex flex-col py-1.5">
      <Link to={to} params={{ eventId }} className={RAD_KLASS}>
        <NumRuta n={nummer} />
        {FORM === 'nummer+ikon' && <Ikon aria-hidden="true" size={16} className="shrink-0" />}
        {children}
        <ChevronRight
          aria-hidden="true"
          size={18}
          className="ml-auto shrink-0 text-text-secondary"
        />
      </Link>
    </div>
  );
}

/** Exakt kopia av Atgarder med numrerade rader 1–6 (frekvensordningen
    oförändrad). Check-in-kortet återanvänds SKARPT (berörs ej av skivan). */
export function AtgarderPrototyp({ eventId }: { eventId: string }) {
  return (
    <DetaljGrupp id="grupp-atgarder" rubrik="Åtgärder">
      <HandlingsLank nummer={1} ikon={Plus} to="/event/$eventId/ny-anmalan" eventId={eventId}>
        Lägg till manuell anmälan
      </HandlingsLank>
      <HandlingsRad nummer={2} ikon={Mail} ariaDisabled>
        Skicka bekräftelsemail till obekräftade
      </HandlingsRad>
      <HandlingsRad nummer={3} ikon={Mail} ariaDisabled>
        Skicka betalningspåminnelse till obetalda
      </HandlingsRad>
      <HandlingsRad nummer={4} ikon={BadgeCheck} ariaDisabled>
        Markera alla obetalda som betalda
      </HandlingsRad>
      <HandlingsRad nummer={5} ikon={Mail} ariaDisabled>
        Skicka eventinfo till alla anmälda
      </HandlingsRad>
      <HandlingsRad nummer={6} ikon={Printer} onPress={() => window.print()}>
        Skriv ut denna detaljsida
      </HandlingsRad>
    </DetaljGrupp>
  );
}
