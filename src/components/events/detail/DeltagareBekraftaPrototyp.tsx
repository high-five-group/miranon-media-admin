/**
 * [PROTOTYPE] Bekräftelse-flödet i Anmälda deltagare — markera-läge med
 * batch-bekräftelse (S86; Marcus-beordrad 2026-07-25).
 *
 * FRÅGAN (throwaway-kontraktet klausul i): Hur ska Obekräftade-köns
 * bekräftelse-flöde se ut när per-kort-knappen ersätts av markering +
 * batch-handling — max ~3 synliga kort med inline scroll?
 *
 * KONVERGENS-STEG 2 (vinnare: variant A — Marcus val 2026-07-25; b/c rivna
 * per UI.md § 6). Marcus-justeringar i detta steg:
 *   1. Markera-knappen i mörkgrå standardform (intent primary).
 *   2. "Markera alla" bredvid "Bekräfta X anmälningar" i batch-baren.
 *   3. Valt kort: Obekräftad-pillen FÖRSVINNER (ingen Vald-pill) — grön
 *      bakgrund + kant bär visuellt; RAC Checkbox bär aria-checked för AT.
 *      (1.4.1-bäraren i SKARPA bygget löses i spec-ledet — t.ex. diskret
 *      check-indikator; bokförs i svar-fångsten.)
 *   4. Avdelar-strecket under sista kortet borta (växlaren flyttad ut ur
 *      DetaljGrupps divide-y — se Deltagare.tsx).
 *
 * KASTBAR KOD (klausul ii + iv): skrivs om nyskrivet genom leverans-
 * grindarna efter konvergensen. Mutationen STUBBAD — read-only.
 */
import { Mail, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Checkbox } from 'react-aria-components';
import { Button } from '@/components/primitives/Button';
import { MessageBox } from '@/components/primitives/MessageBox';
import { displayName, inskickadTid } from '@/components/registrations/registration-display';
import type { Registration } from '@/domain/models/Registration';
import { RegistrationSource } from '@/domain/types/Status';

/** Vinnarens stabila nyckel (ADR-074: vinnaren behåller `a` genom konvergensen). */
export type BekraftaProtoVariant = 'a';

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
const SCROLL_KLASS = 'scrollbar-inline max-h-[25.5rem] overflow-y-auto pr-1';

/**
 * MARKERBART KORT: RAC Checkbox — hela kortet är klickytan, aria-checked
 * bär tillståndet för AT. Valt läge (steg 2): grön bekräfta-ton + kant;
 * Obekräftad-pillen försvinner (Marcus-justering 3). Kategori-pillen
 * står kvar (vägen in ändras inte av markeringen).
 */
function MarkerbartKort({
  reg,
  vald,
  onToggle,
}: {
  reg: Registration;
  vald: boolean;
  onToggle: (id: string, v: boolean) => void;
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
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="break-words font-semibold text-body">{displayName(reg)}</span>
          <span className="text-caption text-text-muted">E-post</span>
          <span className="break-words text-small">
            {reg.email ?? <span className="text-text-muted">Saknas</span>}
          </span>
        </span>
        <span className="flex max-w-[45%] shrink-0 flex-wrap items-center justify-end gap-1.5">
          {!vald && (
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

/**
 * BATCH-BAREN (steg 2): [Bekräfta X — success, mutad vid 0] [Markera alla —
 * grå sekundär] [Rensa — ghost, vid ≥1]. aria-live annonserar antalet.
 */
function BatchBar({
  antal,
  totalt,
  onBekrafta,
  onMarkeraAlla,
  onRensa,
}: {
  antal: number;
  totalt: number;
  onBekrafta: () => void;
  onMarkeraAlla: () => void;
  onRensa: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl bg-bg-muted px-3 py-2">
      <Button intent="success" size="sm" isDisabled={antal === 0} onPress={onBekrafta}>
        <Mail aria-hidden="true" size={14} className="shrink-0" />
        {/* Breddlåset (Marcus steg 3): osynlig platshållare i tvåsiffrig
            maxform ger konstant knappbredd — texten växlar ovanpå i samma
            grid-cell utan att knappen andas. tabular-nums mot siffer-skutt. */}
        <span className="grid text-center tabular-nums">
          <span aria-hidden="true" className="invisible col-start-1 row-start-1">
            Bekräfta 99 anmälningar
          </span>
          <span className="col-start-1 row-start-1">
            {`Bekräfta ${antal} ${antal === 1 ? 'anmälan' : 'anmälningar'}`}
          </span>
        </span>
      </Button>
      <Button intent="secondary" size="sm" isDisabled={antal === totalt} onPress={onMarkeraAlla}>
        Markera alla
      </Button>
      {antal > 0 && (
        <Button intent="ghost" size="sm" onPress={onRensa}>
          Rensa
        </Button>
      )}
      <span aria-live="polite" className="sr-only">
        {`${antal} ${antal === 1 ? 'anmälan vald' : 'anmälningar valda'}`}
      </span>
    </div>
  );
}

/**
 * Prototypens Obekräftade-sektion — ersätter skarpa accordion-grenen när
 * ?variant=a är satt (DEV). Rubrikraden efterliknar skarpa GruppRubrik-formen
 * (statisk här — accordion-toggling ingår inte i frågan).
 */
export function ObekraftadeProto({ rader }: { rader: Registration[] }) {
  const sorterade = useMemo(
    () => [...rader].sort((a, b) => inskickadTid(a) - inskickadTid(b)),
    [rader],
  );
  const [valda, setValda] = useState<Set<string>>(new Set());
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
  const markeraAlla = () => setValda(new Set(sorterade.map((r) => r.id)));
  const bekrafta = () => {
    setStubSvar(
      `PROTOTYP-STUB: här öppnas kontrollfrågan (PRD beslut 7) och ${valda.size} ` +
        `${valda.size === 1 ? 'bekräftelse' : 'bekräftelser'} skickas. Ingenting är skickat.`,
    );
    setValda(new Set());
    setMarkeraLage(false);
  };

  return (
    <div className="flex flex-col gap-2" data-testid="bekrafta-prototyp">
      {/* Rubrikraden: Markera i mörkgrå standardform (Marcus-justering 1). */}
      <div className="flex items-center rounded-lg bg-bg-emphasized">
        <span className="flex min-w-0 flex-1 items-center gap-1.5 px-3 py-2.5 font-semibold text-error text-small">
          {`Obekräftade (${sorterade.length})`}
        </span>
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
            <Button intent="primary" size="sm" onPress={() => setMarkeraLage(true)}>
              Markera
            </Button>
          )}
        </span>
      </div>

      {stubSvar != null && (
        <MessageBox intent="info" title="Prototyp — ingen riktig sändning">
          {stubSvar}
        </MessageBox>
      )}

      {markeraLage && (
        <BatchBar
          antal={valda.size}
          totalt={sorterade.length}
          onBekrafta={bekrafta}
          onMarkeraAlla={markeraAlla}
          onRensa={rensa}
        />
      )}

      {/* Kön — max ~3 kort, inline scroll (Marcus skiss). */}
      <ul className={`flex flex-col gap-2.5 ${SCROLL_KLASS}`}>
        {sorterade.map((reg) => (
          <li key={reg.id}>
            {markeraLage ? (
              <MarkerbartKort reg={reg} vald={valda.has(reg.id)} onToggle={toggle} />
            ) : (
              // Utanför läget: kortet i vilande form — ingen fot-knapp
              // (borttagen per skissen); klick öppnar markera-läget.
              <MarkerbartKort reg={reg} vald={false} onToggle={() => setMarkeraLage(true)} />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
