/**
 * Platser-ytan — Mer-ytan där platsernas uppgifter förvaltas (TASK-309.7
 * AC #3, Del 2 § D beslut 10, ADR-125 § 7). Listar platserna, låter
 * adress/parkering/transport/kläder redigeras och nya platser skapas —
 * samma HUSETS BLOCK-DIALOG som genereringsvyn och Eventinnehåll-ytan
 * använder (`@/components/dokument/BlockDialog`) — ingen andra dialogform.
 *
 * REN PLATS-REDIGERING, INGET EVENT (mission-kontrollerad premiss,
 * bekräftad mot `save-place-standard/index.ts`): den befintliga EF:en var
 * byggd för "spara som platsens standard" FRÅN ett event (tömmer eventets
 * kopia, länkar eventet). Denna yta använder EF:ens NYA event-lösa läge
 * (TASK-309.7, samma commit) via `useSavePlace`/`DataSourceAdapter.
 * savePlace` — `platsId` uppdaterar en befintlig plats direkt, `namn`
 * skapar en ny (find-or-create by Namn server-side).
 *
 * "NY PLATS" är TVÅSTEG: ange ett namn (skapar en TOM shell-rad) → redigera
 * dess fyra fält via samma block-lista som en befintlig plats. Ett enda
 * formulär med alla fem fälten på en gång hade krävt en ANNAN dialogform —
 * AC #2/#3 kräver uttryckligen att block-dialogen är den enda formen.
 */
import { ChevronRight } from 'lucide-react';
import { useQueryState } from 'nuqs';
import { useMemo, useState } from 'react';
import {
  BlockDialog,
  DIALOG_ANKARE,
  DIALOG_PANEL_KLASS,
  type Override,
  type Rad,
} from '@/components/dokument/BlockDialog';
import type { BlockDef, BlockId } from '@/components/dokument/blockDefinitioner';
import { Button } from '@/components/primitives/Button';
import { Input } from '@/components/primitives/Input';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Modal } from '@/components/primitives/Modal';
import { SidRam } from '@/components/primitives/SidRam';
import { Skeleton } from '@/components/primitives/Skeleton';
import { EdgeFunctionError } from '@/data/config/EdgeFunctionError';
import { useSavePlace } from '@/data/mutations/useSavePlace';
import { usePlacesList } from '@/data/queries/usePlacesList';
import type { PlaceListItem, PlatsFalt } from '@/domain/schemas';

/** Blocken som redigeras på DENNA yta — en rad per fält på `Platser`
 *  (`PLATS_FALT_KEYS`, `_shared/eventinnehall-falt.ts`). */
const PLATS_BLOCK: { def: BlockDef; falt: PlatsFalt }[] = [
  { def: { id: 'plats', etikett: 'Adress', kalla: 'plats', platsFalt: 'adress' }, falt: 'adress' },
  {
    def: { id: 'parkering', etikett: 'Parkering', kalla: 'plats', platsFalt: 'parkering' },
    falt: 'parkering',
  },
  {
    def: { id: 'transport', etikett: 'Transport', kalla: 'plats', platsFalt: 'transport' },
    falt: 'transport',
  },
  {
    def: { id: 'klader', etikett: 'Kläder', kalla: 'plats', platsFalt: 'klader' },
    falt: 'klader',
  },
];

function byggRad(def: BlockDef, item: PlaceListItem): Rad {
  const entry = PLATS_BLOCK.find((b) => b.def.id === def.id);
  const varde = entry ? item.falt[entry.falt] : null;
  return {
    def,
    standardText: varde,
    standardAgenda: null,
    egen: null,
    text: varde,
    agenda: null,
    tomt: !varde?.trim(),
  };
}

function radRader(item: PlaceListItem): Rad[] {
  return PLATS_BLOCK.map((b) => byggRad(b.def, item));
}

function faltForBlock(id: BlockId): PlatsFalt | undefined {
  return PLATS_BLOCK.find((b) => b.def.id === id)?.falt;
}

export function PlatserYta() {
  const [valdId, setValdId] = useQueryState('id');
  const [visaNyPlats, setVisaNyPlats] = useState(false);
  const [nyttNamn, setNyttNamn] = useState('');
  const { data, isPending, isError, error } = usePlacesList();
  const spara = useSavePlace();
  const [oppenBlockId, setOppenBlockId] = useState<BlockId | null>(null);

  const valt = useMemo(() => data?.find((p) => p.id === valdId) ?? null, [data, valdId]);
  const rader = useMemo(() => (valt ? radRader(valt) : []), [valt]);
  const oppenRad = rader.find((r) => r.def.id === oppenBlockId) ?? null;

  const sparaBlock = (id: BlockId, nytt: Override | null) => {
    if (!valt || nytt === null || nytt.typ !== 'text') return;
    const falt = faltForBlock(id);
    if (!falt) return;
    spara.mutate({ platsId: valt.id, falt: { [falt]: nytt.varde } });
  };

  const skapaPlats = () => {
    const namn = nyttNamn.trim();
    if (!namn) return;
    spara.mutate(
      { namn },
      {
        onSuccess: () => {
          setNyttNamn('');
          setVisaNyPlats(false);
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-4" data-testid="platser-yta">
      <SidRam to="/mer" tillbakaEtikett="Tillbaka till Mer" />
      <header className="flex flex-col gap-1 px-4">
        <h1 className="font-semibold text-3xl">Platser</h1>
      </header>

      <div className="flex flex-col gap-4 px-4">
        {valt ? (
          <>
            <Button
              intent="ghost"
              size="sm"
              className="self-start"
              onPress={() => void setValdId(null)}
            >
              ‹ Alla platser
            </Button>
            <h2 className="font-medium text-lg">{valt.namn}</h2>

            {/* Felytan renderas ur `spara.isError`/`spara.error` — samma
                disciplin som `GenereringsVy.tsx`s block-dialog (rad
                ~885–895): dialogen stänger SYNKRONT vid Spara (`onSpara`,
                nedan), så detta är ANVÄNDARENS enda besked om att den
                optimistiska sparningen rullades tillbaka (TASK-309.36,
                review-runda 1 på #2055, F1). Utan denna yta hade ett
                misslyckat sparförsök tystats bort helt — a11y-golvbrott
                (WCAG 3.3.1/4.1.3). */}
            {spara.isError && (
              <MessageBox intent="error">
                Ändringen kunde inte sparas:{' '}
                {spara.error instanceof Error ? spara.error.message : 'Okänt fel.'}
              </MessageBox>
            )}

            <ul
              data-testid="plats-block-lista"
              className="divide-y divide-border rounded-xl border border-transparent bg-surface px-3 contrast-more:border-border-strong"
            >
              {rader.map((rad) => (
                <li key={rad.def.id}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 py-3 text-left"
                    onClick={() => setOppenBlockId(rad.def.id)}
                  >
                    <span className="min-w-0 flex-1 truncate text-body">{rad.def.etikett}</span>
                    {rad.tomt && (
                      <span className="shrink-0 text-caption text-text-muted">Tomt</span>
                    )}
                    <ChevronRight
                      aria-hidden="true"
                      size={16}
                      className="shrink-0 text-text-muted"
                    />
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            {visaNyPlats ? (
              <form
                className="flex items-end gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  skapaPlats();
                }}
              >
                <Input
                  label="Namn på ny plats"
                  autoFocus
                  className="flex-1"
                  value={nyttNamn}
                  onChange={setNyttNamn}
                />
                <Button
                  type="submit"
                  intent="primary"
                  aria-disabled={spara.isPending || !nyttNamn.trim()}
                >
                  Skapa
                </Button>
                <Button
                  intent="secondary"
                  emphasis="outline"
                  onPress={() => {
                    setVisaNyPlats(false);
                    setNyttNamn('');
                  }}
                >
                  Avbryt
                </Button>
              </form>
            ) : (
              <Button
                intent="secondary"
                emphasis="outline"
                className="self-start"
                onPress={() => setVisaNyPlats(true)}
              >
                Ny plats
              </Button>
            )}

            {isPending ? (
              <div
                role="status"
                aria-live="polite"
                aria-busy="true"
                className="flex flex-col gap-2"
              >
                <span className="sr-only">Laddar platser…</span>
                <Skeleton variant="text" className="w-2/5" />
                <Skeleton variant="text" className="w-1/3" />
              </div>
            ) : isError ? (
              <MessageBox intent="error" title="Kunde inte hämta platser">
                {error instanceof EdgeFunctionError || error instanceof Error
                  ? error.message
                  : 'Inget felmeddelande angavs.'}
              </MessageBox>
            ) : data.length === 0 ? (
              <p className="text-small text-text-muted">Inga platser finns än.</p>
            ) : (
              <ul
                data-testid="platser-lista"
                className="divide-y divide-border rounded-xl border border-transparent bg-surface px-3 contrast-more:border-border-strong"
                aria-live="polite"
              >
                {data.map((plats) => (
                  <li key={plats.id}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 py-3 text-left"
                      onClick={() => void setValdId(plats.id)}
                    >
                      <span className="min-w-0 flex-1 truncate text-body">{plats.namn}</span>
                      <ChevronRight
                        aria-hidden="true"
                        size={16}
                        className="shrink-0 text-text-muted"
                      />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      {oppenRad && (
        <Modal
          isOpen
          isDismissable
          className={DIALOG_PANEL_KLASS}
          style={DIALOG_ANKARE}
          onOpenChange={(open) => {
            if (!open) setOppenBlockId(null);
          }}
        >
          <BlockDialog
            rad={oppenRad}
            ort={null}
            somStandard={false}
            syskon={rader}
            caption="Platsens standarduppgift."
            onVaxla={(id, nytt) => {
              sparaBlock(oppenRad.def.id, nytt);
              setOppenBlockId(id);
            }}
            onSpara={(nytt) => {
              sparaBlock(oppenRad.def.id, nytt);
              setOppenBlockId(null);
            }}
            onStang={() => setOppenBlockId(null)}
          />
        </Modal>
      )}
    </div>
  );
}
