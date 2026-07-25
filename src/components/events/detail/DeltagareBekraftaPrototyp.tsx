/**
 * [PROTOTYPE] Bekräftelse-flödet i Anmälda deltagare — markera-läge med
 * batch-bekräftelse (S86 divergens-pass, Marcus-beordrad 2026-07-25).
 *
 * FRÅGAN (throwaway-kontraktet klausul i): Hur ska Obekräftade-köns
 * bekräftelse-flöde se ut när per-kort-knappen "Skicka bekräftelse" ersätts
 * av markering + batch-handling — och blocket begränsas till ~3 synliga kort
 * med inline scroll?
 *
 * TRE VARIANTER på befintliga eventdetalj-routen (?variant=a|b|c, underform A):
 *   a — MARKERA-LÄGET (Marcus skiss): explicit "Markera"-knapp öppnar
 *       select-läge; kort-klick togglar val (ljusgrön + check); batch-bar
 *       med mutad "Bekräfta X anmälningar" + "Rensa" vid ≥1. iOS/Photos-
 *       klassens mode-mönster.
 *   b — DIREKTMARKERING: inget läge — varje obekräftat kort bär alltid en
 *       kryssruta; batch-baren stiger fram vid ≥1 val. Gmail-klassen.
 *   c — KOMPAKT KRYSSLISTA: kön som kompakta kryssrader + "Välj alla",
 *       batch-bar alltid synlig. Polaris ResourceList-klassen.
 *
 * KASTBAR KOD (klausul ii + iv): raderas eller skrivs om nyskrivet genom
 * leverans-grindarna efter Marcus val. Mutationen är STUBBAD — ingenting
 * skickas, ingen write-väg rörs (read-only-regeln; kontrollfråge-grinden
 * PRD beslut 7 markeras i stubben men prototypas inte).
 */
import { Check, Mail, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Checkbox } from 'react-aria-components';
import { Button } from '@/components/primitives/Button';
import { MessageBox } from '@/components/primitives/MessageBox';
import { displayName, inskickadTid } from '@/components/registrations/registration-display';
import type { Registration } from '@/domain/models/Registration';
import { RegistrationSource } from '@/domain/types/Status';

export type BekraftaProtoVariant = 'a' | 'b' | 'c';

/** Kategori-pillen — förenklad kopia (kastbar) av skarpa kortets märkning. */
function pillText(r: Registration): string | null {
  switch (r.kalla) {
    case RegistrationSource.MANUELL:
      return 'Manuellt tillagd';
    case RegistrationSource.MEDFOLJANDE:
      return 'Medföljande';
    case RegistrationSource.VANTELISTA:
      return 'Från väntelistan';
    default:
      return null;
  }
}

/** "Anmäld 1 juli 09:00" — förenklad kopia för prototypkortets metarad. */
const DAGTID = new Intl.DateTimeFormat('sv-SE', {
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
});
function anmaldText(r: Registration): string | null {
  if (!r.inskickad) return null;
  const d = new Date(r.inskickad);
  return Number.isNaN(d.getTime()) ? null : `Anmäld ${DAGTID.format(d)}`;
}

/** Max ~3 kort synliga, resten bakom inline scroll (Marcus skiss). */
const SCROLL_KLASS = 'max-h-[25.5rem] overflow-y-auto pr-1';

/**
 * MARKERBART KORT (variant a + b): RAC Checkbox — hela kortet är klickytan,
 * role="checkbox" + aria-checked ger AT-paritet. Valt läge: ljusgrön
 * bekräfta-ton + check-ruta + "Vald"-text (texten bär — färg aldrig ensam,
 * WCAG 1.4.1). I markera-läget är personlänken/metaytan INTE interaktiv
 * (klick = markera; L303 interaktivt-i-interaktivt undviks helt).
 */
function MarkerbartKort({
  reg,
  vald,
  onToggle,
  visaRuta,
}: {
  reg: Registration;
  vald: boolean;
  onToggle: (id: string, v: boolean) => void;
  /** Variant b: rutan alltid synlig; variant a: rutan finns bara i läget (alltid true där). */
  visaRuta: boolean;
}) {
  const pill = pillText(reg);
  const anmald = anmaldText(reg);
  return (
    <Checkbox
      isSelected={vald}
      onChange={(v) => onToggle(reg.id, v)}
      className={`group flex w-full cursor-pointer flex-col rounded-xl border motion-safe:transition-colors ${
        vald
          ? 'border-(--mm-success) bg-(--mm-success-bg)'
          : 'border-(--mm-navcard-border) bg-surface contrast-more:border-(--mm-navcard-border-contrast)'
      }`}
    >
      <span className="flex items-start justify-between gap-3 px-4 pt-3">
        <span className="flex min-w-0 flex-1 items-start gap-3">
          {visaRuta && (
            <span
              className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border ${
                vald
                  ? 'border-(--mm-success) bg-(--mm-success)'
                  : 'border-(--mm-input-border) bg-(--mm-input-bg)'
              }`}
            >
              <Check
                aria-hidden="true"
                size={14}
                className={`text-text-inverse ${vald ? 'opacity-100' : 'opacity-0'}`}
              />
            </span>
          )}
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="break-words font-semibold text-body">{displayName(reg)}</span>
            <span className="text-caption text-text-muted">E-post</span>
            <span className="break-words text-small">
              {reg.email ?? <span className="text-text-muted">Saknas</span>}
            </span>
          </span>
        </span>
        <span className="flex max-w-[45%] shrink-0 flex-wrap items-center justify-end gap-1.5">
          {vald ? (
            <span className="flex items-center gap-1 rounded-full bg-(--mm-success) px-2 py-0.5 font-medium text-caption text-text-inverse">
              <Check aria-hidden="true" size={12} className="shrink-0" />
              Vald
            </span>
          ) : (
            <span className="rounded-full bg-(--mm-error-bg) px-2 py-0.5 font-medium text-caption text-error">
              Obekräftad
            </span>
          )}
          {pill && (
            <span className="rounded-full bg-bg-muted px-2 py-0.5 font-medium text-caption text-text-secondary">
              {pill}
            </span>
          )}
        </span>
      </span>
      <span className="flex flex-col gap-1 px-4 pt-2 pb-3 text-caption text-text-muted">
        {anmald && <span>{anmald}</span>}
      </span>
    </Checkbox>
  );
}

/** KOMPAKT KRYSSRAD (variant c) — Bor över-radens grammatik för bekräfta-kön. */
function KryssRad({
  reg,
  vald,
  onToggle,
}: {
  reg: Registration;
  vald: boolean;
  onToggle: (id: string, v: boolean) => void;
}) {
  const pill = pillText(reg);
  return (
    <Checkbox
      isSelected={vald}
      onChange={(v) => onToggle(reg.id, v)}
      className={`group flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 motion-safe:transition-colors ${
        vald
          ? 'border-(--mm-success) bg-(--mm-success-bg)'
          : 'border-(--mm-navcard-border) bg-surface contrast-more:border-(--mm-navcard-border-contrast)'
      }`}
    >
      <span
        className={`flex size-5 shrink-0 items-center justify-center rounded border ${
          vald
            ? 'border-(--mm-success) bg-(--mm-success)'
            : 'border-(--mm-input-border) bg-(--mm-input-bg)'
        }`}
      >
        <Check
          aria-hidden="true"
          size={14}
          className={`text-text-inverse ${vald ? 'opacity-100' : 'opacity-0'}`}
        />
      </span>
      <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
        <span className="flex min-w-0 flex-col">
          <span className="truncate font-semibold text-body">{displayName(reg)}</span>
          <span className="truncate text-caption text-text-muted">{reg.email ?? '—'}</span>
        </span>
        {pill && (
          <span className="shrink-0 rounded-full bg-bg-muted px-2 py-0.5 font-medium text-caption text-text-secondary">
            {pill}
          </span>
        )}
      </span>
    </Checkbox>
  );
}

/**
 * BATCH-BAREN — gemensam form: antal-bärande bekräfta-knapp (mutad vid 0,
 * solid success vid ≥1 — batch-baren är blockets primära handlingsyta) +
 * Rensa (ghost) vid ≥1. aria-live annonserar antalet för skärmläsare.
 */
function BatchBar({
  antal,
  onBekrafta,
  onRensa,
  hoger,
}: {
  antal: number;
  onBekrafta: () => void;
  onRensa: () => void;
  /** Extra element till höger (variant a: Avbryt markera-läget). */
  hoger?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-bg-muted px-3 py-2">
      <span className="flex items-center gap-2">
        <Button intent="success" size="sm" isDisabled={antal === 0} onPress={onBekrafta}>
          <Mail aria-hidden="true" size={14} className="shrink-0" />
          {`Bekräfta ${antal} ${antal === 1 ? 'anmälan' : 'anmälningar'}`}
        </Button>
        {antal > 0 && (
          <Button intent="ghost" size="sm" onPress={onRensa}>
            Rensa
          </Button>
        )}
      </span>
      <span aria-live="polite" className="sr-only">
        {`${antal} ${antal === 1 ? 'anmälan vald' : 'anmälningar valda'}`}
      </span>
      {hoger}
    </div>
  );
}

/**
 * Prototypens Obekräftade-sektion — ersätter skarpa accordion-grenen när
 * ?variant= är satt (DEV). Rubrikraden efterliknar skarpa GruppRubrik-formen
 * (statisk här — accordion-toggling ingår inte i frågan).
 */
export function ObekraftadeProto({
  variant,
  rader,
}: {
  variant: BekraftaProtoVariant;
  rader: Registration[];
}) {
  const sorterade = useMemo(
    () => [...rader].sort((a, b) => inskickadTid(a) - inskickadTid(b)),
    [rader],
  );
  const [valda, setValda] = useState<Set<string>>(new Set());
  // Variant a: markera-läget av/på. b + c behöver inget läge.
  const [markeraLage, setMarkeraLage] = useState(false);
  const [stubSvar, setStubSvar] = useState<string | null>(null);

  const toggle = (id: string, v: boolean) =>
    setValda((nu) => {
      const next = new Set(nu);
      if (v) next.add(id);
      else next.delete(id);
      return next;
    });
  const rensa = () => setValda(new Set());
  const bekrafta = () => {
    setStubSvar(
      `PROTOTYP-STUB: här öppnas kontrollfrågan (PRD beslut 7) och ${valda.size} ` +
        `${valda.size === 1 ? 'bekräftelse' : 'bekräftelser'} skickas. Ingenting är skickat.`,
    );
    setValda(new Set());
    if (variant === 'a') setMarkeraLage(false);
  };

  const iMarkeringsLage = variant !== 'a' || markeraLage;

  return (
    <div className="flex flex-col gap-2" data-testid="bekrafta-prototyp">
      {/* Rubrikraden — varningston som skarpa formen; handlingen per variant. */}
      <div className="flex items-center rounded-lg bg-bg-emphasized">
        <span className="flex min-w-0 flex-1 items-center gap-1.5 px-3 py-2.5 font-semibold text-error text-small">
          {`Obekräftade (${sorterade.length})`}
        </span>
        {variant === 'a' && (
          <span className="flex shrink-0 items-center pr-1">
            {markeraLage ? (
              <Button
                intent="ghost"
                size="sm"
                onPress={() => {
                  setMarkeraLage(false);
                  rensa();
                }}
              >
                <X aria-hidden="true" size={14} className="shrink-0" />
                Avbryt
              </Button>
            ) : (
              <Button intent="secondary" size="sm" onPress={() => setMarkeraLage(true)}>
                Markera
              </Button>
            )}
          </span>
        )}
      </div>

      {stubSvar != null && (
        <MessageBox intent="info" title="Prototyp — ingen riktig sändning">
          {stubSvar}
        </MessageBox>
      )}

      {/* Variant c: Välj alla-raden ovanför listan. */}
      {variant === 'c' && (
        <Checkbox
          isSelected={valda.size === sorterade.length && sorterade.length > 0}
          onChange={(v) => setValda(v ? new Set(sorterade.map((r) => r.id)) : new Set())}
          className="group flex cursor-pointer items-center gap-3 px-1 py-1 text-small text-text-secondary"
        >
          <span
            className={`flex size-5 shrink-0 items-center justify-center rounded border ${
              valda.size === sorterade.length && sorterade.length > 0
                ? 'border-(--mm-success) bg-(--mm-success)'
                : 'border-(--mm-input-border) bg-(--mm-input-bg)'
            }`}
          >
            <Check
              aria-hidden="true"
              size={14}
              className={`text-text-inverse ${
                valda.size === sorterade.length && sorterade.length > 0
                  ? 'opacity-100'
                  : 'opacity-0'
              }`}
            />
          </span>
          {`Välj alla (${sorterade.length})`}
        </Checkbox>
      )}

      {/* Batch-baren: a = endast i läget · b = vid ≥1 val · c = alltid. */}
      {(variant === 'c' ||
        (variant === 'a' && markeraLage) ||
        (variant === 'b' && valda.size > 0)) && (
        <BatchBar antal={valda.size} onBekrafta={bekrafta} onRensa={rensa} />
      )}

      {/* Kön — max ~3 kort, inline scroll (Marcus skiss). */}
      <ul className={`flex flex-col gap-2.5 ${SCROLL_KLASS}`}>
        {sorterade.map((reg) => (
          <li key={reg.id}>
            {variant === 'c' ? (
              <KryssRad reg={reg} vald={valda.has(reg.id)} onToggle={toggle} />
            ) : iMarkeringsLage ? (
              <MarkerbartKort
                reg={reg}
                vald={valda.has(reg.id)}
                onToggle={toggle}
                visaRuta={variant === 'b'}
              />
            ) : (
              // Variant a UTANFÖR läget: kortet i vilande form — ingen
              // fot-knapp (borttagen per skissen), markering kräver läget.
              <MarkerbartKort
                reg={reg}
                vald={false}
                onToggle={() => setMarkeraLage(true)}
                visaRuta={false}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
