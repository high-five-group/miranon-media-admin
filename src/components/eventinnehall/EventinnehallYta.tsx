/**
 * Eventinnehåll-ytan — Mer-ytan där standardtexterna per Event × Eventtyp
 * förvaltas (TASK-309.7 AC #2, Del 2 § D beslut 10, ADR-125 § 7). Listar de
 * sju kombinationerna (data-model.md § Bilagornas datamodell) och låter
 * varje kombinations tolv textfält + agendan (dag för dag) redigeras med
 * HUSETS BLOCK-DIALOG — samma `BlockDialog` som genereringsvyn använder
 * (`@/components/dokument/BlockDialog`, utbruten TASK-309.7) — ingen andra
 * dialogform (AC #2).
 *
 * SKILLNADEN MOT GENERERINGSVYNS EGEN ANVÄNDNING: genereringsvyn redigerar
 * ETT EVENTS kopia av ett block, med ett "standard vs egen text"-lager
 * (Del 2 § D beslut 6 — "spara som platsens standard" är den enda platsen
 * det lagret syns här). Denna yta redigerar STANDARDEN direkt — det finns
 * inget event i sikte. `Rad.standardText`/`standardAgenda` bär därför
 * HELT ENKELT "den nuvarande sparade texten" (aldrig `Rad.egen`, som
 * förblir `null` genomgående) — `BlockDialog` initierar sina fält från
 * `standardText`/`standardAgenda` oavsett vilken semantik siffrorna bär,
 * så samma komponent fungerar oförändrad för båda bruken. `caption`-proppen
 * (TASK-309.7-tillägget på `BlockDialog`) ersätter den händelse-specifika
 * hjälptexten ("Följer standarden…") med en som stämmer här.
 *
 * BLOCKLISTAN ÄR EGEN, INTE `GRUPPER` FRÅN GENERERINGSVYN: `GRUPPER`
 * (`blockDefinitioner.ts`) beskriver HUR blocken grupperas i en genererad
 * bilaga (Inforutan/Om utbildningen/Agenda/Praktisk information, uppdelat
 * på två mallar) — den grupperingen är dokumentspecifik, inte
 * tabellspecifik. Denna ytas block är i stället EXAKT `EVENTINNEHALL_FALT_
 * KEYS` (`_shared/eventinnehall-falt.ts`, tolv fält) plus de två
 * agendadagarna — en platt lista, en rad per redigerbart fält på
 * `Eventinnehåll`-tabellen. `Tid` (som i genereringsvyn bara existerar
 * inbäddat i det event-källade "Datum och tid"-blocket, aldrig
 * fristående redigerbart där) blir här sin EGEN rad, eftersom `save-
 * event-content` redan tillåter att skriva den isolerat
 * (`EVENTINNEHALL_FALT_KEYS` inkluderar `tid`).
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
import { MessageBox } from '@/components/primitives/MessageBox';
import { Modal } from '@/components/primitives/Modal';
import { SidRam } from '@/components/primitives/SidRam';
import { Skeleton } from '@/components/primitives/Skeleton';
import { EdgeFunctionError } from '@/data/config/EdgeFunctionError';
import { useSaveEventContent } from '@/data/mutations/useSaveEventContent';
import { useEventinnehallList } from '@/data/queries/useEventinnehallList';
import type { EventinnehallFalt, EventinnehallListItem } from '@/domain/schemas';

/** Blocken som redigeras på DENNA yta — se filhuvudet för varför listan är
 *  egen och inte `GRUPPER`. `falt` saknas på agenda-block (de har ingen
 *  motsvarande `EventinnehallFalt`-nyckel — `save-event-content`s
 *  `agenda`-gren, inte dess `falt`-gren, äger dem). */
const EVENTINNEHALL_BLOCK: { def: BlockDef; falt?: EventinnehallFalt }[] = [
  { def: { id: 'tid', etikett: 'Tid', kalla: 'eventinnehall' }, falt: 'tid' },
  { def: { id: 'pris', etikett: 'Pris', kalla: 'eventinnehall' }, falt: 'pris' },
  {
    def: { id: 'anmalningsavgift', etikett: 'Anmälningsavgift', kalla: 'eventinnehall' },
    falt: 'anmalningsavgift',
  },
  {
    def: { id: 'resterande', etikett: 'Resterande belopp', kalla: 'eventinnehall' },
    falt: 'resterandeBelopp',
  },
  {
    def: { id: 'beskrivning', etikett: 'Beskrivning', kalla: 'eventinnehall', langtext: true },
    falt: 'beskrivning',
  },
  {
    def: { id: 'forberedelser', etikett: 'Förberedelser', kalla: 'eventinnehall' },
    falt: 'forberedelser',
  },
  { def: { id: 'tagMed', etikett: 'Tag med', kalla: 'eventinnehall' }, falt: 'tagMed' },
  {
    def: { id: 'rokning', etikett: 'För dig som röker', kalla: 'eventinnehall' },
    falt: 'rokning',
  },
  {
    def: { id: 'parfym', etikett: 'Parfym och kosmetika', kalla: 'eventinnehall' },
    falt: 'parfym',
  },
  { def: { id: 'mat', etikett: 'Mat/fika', kalla: 'eventinnehall' }, falt: 'mat' },
  {
    def: { id: 'overnattning', etikett: 'Övernattning', kalla: 'eventinnehall' },
    falt: 'overnattning',
  },
  { def: { id: 'utrustning', etikett: 'Utrustning', kalla: 'eventinnehall' }, falt: 'utrustning' },
  { def: { id: 'dagEtt', etikett: 'Agenda, dag 1', kalla: 'eventinnehall', agenda: true } },
  { def: { id: 'dagTva', etikett: 'Agenda, dag 2', kalla: 'eventinnehall', agenda: true } },
];

/** Blockets aktuella värde → `Rad` — `standardText`/`standardAgenda` bär
 *  HÄR "den nuvarande texten" (se filhuvudet), `egen` är alltid `null`. */
function byggRad(def: BlockDef, item: EventinnehallListItem): Rad {
  if (def.agenda) {
    const rader = def.id === 'dagEtt' ? item.agenda.dag1 : item.agenda.dag2;
    return {
      def,
      standardText: null,
      standardAgenda: rader,
      egen: null,
      text: null,
      agenda: rader,
      tomt: rader.length === 0,
    };
  }
  const entry = EVENTINNEHALL_BLOCK.find((b) => b.def.id === def.id);
  const varde = entry?.falt ? item.falt[entry.falt] : null;
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

function radRader(item: EventinnehallListItem): Rad[] {
  return EVENTINNEHALL_BLOCK.map((b) => byggRad(b.def, item));
}

/** BlockId → EventinnehallFalt-nyckeln `save-event-content` förväntar
 *  (skiljer sig bara för `resterande` → `resterandeBelopp`). */
function faltForBlock(id: BlockId): EventinnehallFalt | undefined {
  return EVENTINNEHALL_BLOCK.find((b) => b.def.id === id)?.falt;
}

export function EventinnehallYta() {
  const [valdId, setValdId] = useQueryState('id');
  const { data, isPending, isError, error } = useEventinnehallList();
  const spara = useSaveEventContent();
  const [oppenBlockId, setOppenBlockId] = useState<BlockId | null>(null);

  const valt = useMemo(() => data?.find((i) => i.id === valdId) ?? null, [data, valdId]);
  const rader = useMemo(() => (valt ? radRader(valt) : []), [valt]);
  const oppenRad = rader.find((r) => r.def.id === oppenBlockId) ?? null;

  const sparaBlock = (id: BlockId, nytt: Override | null) => {
    if (!valt) return;
    if (nytt === null) return; // Oförändrat — ingen anropsvärd skillnad.
    if (nytt.typ === 'agenda') {
      const dag = id === 'dagEtt' ? 1 : 2;
      spara.mutate({ eventinnehallId: valt.id, agenda: { dag, rader: nytt.rader } });
      return;
    }
    const falt = faltForBlock(id);
    if (!falt) return;
    spara.mutate({ eventinnehallId: valt.id, falt: { [falt]: nytt.varde || null } });
  };

  return (
    <div className="flex flex-col gap-4" data-testid="eventinnehall-yta">
      <SidRam to="/mer" tillbakaEtikett="Tillbaka till Mer" />
      <header className="flex flex-col gap-1 px-4">
        <h1 className="font-semibold text-3xl">Eventinnehåll</h1>
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
              ‹ Alla kombinationer
            </Button>
            <h2 className="font-medium text-lg">{valt.namn}</h2>
            <ul
              data-testid="eventinnehall-block-lista"
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
        ) : isPending ? (
          <div role="status" aria-live="polite" aria-busy="true" className="flex flex-col gap-2">
            <span className="sr-only">Laddar eventinnehåll…</span>
            <Skeleton variant="text" className="w-2/5" />
            <Skeleton variant="text" className="w-3/5" />
            <Skeleton variant="text" className="w-2/5" />
          </div>
        ) : isError ? (
          <MessageBox intent="error" title="Kunde inte hämta eventinnehåll">
            {error instanceof EdgeFunctionError || error instanceof Error
              ? error.message
              : 'Inget felmeddelande angavs.'}
          </MessageBox>
        ) : data.length === 0 ? (
          <p className="text-small text-text-muted">Inget eventinnehåll finns än.</p>
        ) : (
          <ul
            data-testid="eventinnehall-lista"
            className="divide-y divide-border rounded-xl border border-transparent bg-surface px-3 contrast-more:border-border-strong"
            aria-live="polite"
          >
            {data.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 py-3 text-left"
                  onClick={() => void setValdId(item.id)}
                >
                  <span className="min-w-0 flex-1 truncate text-body">{item.namn}</span>
                  <ChevronRight aria-hidden="true" size={16} className="shrink-0 text-text-muted" />
                </button>
              </li>
            ))}
          </ul>
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
            caption="Standardtext för samtliga event av den här typen."
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
