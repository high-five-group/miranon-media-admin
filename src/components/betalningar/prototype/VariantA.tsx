import { useState } from 'react';
import { Button } from '@/components/primitives';
import { InitialAvatar } from '@/components/primitives/InitialAvatar';
import { visaKronor } from '../belopp-inmatning';
import {
  antalRegistreradeKvitton,
  type BekraftelseRad,
  type BekraftelsestegModell,
  grupperaRader,
} from './bekraftelseSimulering';
import {
  BeloppInput,
  BeloppsgenvagsKnappar,
  BetalsattMiniSelect,
  BetalsattSegment,
  DatumInput,
  InertaKvittoKnappar,
  KvittoKryss,
  Markering,
  RadMarken,
  RadUtfallRad,
  SaknasKontext,
} from './radfalt';

/**
 * [PROTOTYPE] Variant A — RADLISTAN (S121 divergens).
 *
 * Bevisar: TÄTHET och TEMPO. Inkorgens grammatik lyft till ett steg — sticky
 * verktygsrad överst med bulkvalen, kompakta enradiga poster grupperade per
 * event, sticky handlingsrad nederst. Lotta ser många rader samtidigt och
 * betar av dem uppifrån och ned.
 *
 * Svag där: när en rad behöver hennes hand (markering, udda belopp) tävlar den
 * om uppmärksamhet med nitton andra rader — undantaget syns inte förrän hon
 * läser varje rad. Täta rader på iPad kan också bli trångt när betalsätt och
 * belopp ligger på samma rad som namnet.
 */
export function VariantA({ modell }: { modell: BekraftelsestegModell }) {
  const grupper = grupperaRader(modell.rader);
  const klart = modell.fas === 'klart';
  const { summering } = modell;

  return (
    <div className="flex flex-col gap-4 pb-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-semibold text-3xl">Registrera betalningar</h1>
        <p className="text-body text-text-secondary">
          {modell.rader.length} inbetalningar valda. Sätt belopp och betalsätt, registrera alla på
          en gång.
        </p>
      </header>

      {/* ═══ STICKY VERKTYGSRAD — bulkvalen överst (beslut 2 + 3) ═══ */}
      {!klart && (
        <div className="sticky top-2 z-10 flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <div className="flex flex-col gap-1.5">
            <span className="font-medium text-small text-text-secondary">Sätt belopp på alla</span>
            <BeloppsgenvagsKnappar aktiv={modell.aktivGenvag} onValj={modell.sattGenvag} />
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="font-medium text-small text-text-secondary">Betalsätt för alla</span>
              <BetalsattSegment
                label="Betalsätt för alla rader"
                value={modell.batchBetalsatt}
                onChange={modell.sattBetalsattAlla}
              />
            </div>
            <div className="w-40">
              <DatumInput
                label="Datum för alla"
                value={modell.batchDatum}
                onChange={modell.sattDatumAlla}
                size="sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* ═══ GRUPPER + RADER ═══ */}
      <div className="flex flex-col gap-5">
        {grupper.map((grupp) => (
          <section key={grupp.eventId} className="flex flex-col gap-2" aria-label={grupp.eventNamn}>
            <h2 className="flex items-baseline gap-2 px-1 font-semibold text-lg">
              {grupp.eventNamn}
              <span className="font-normal text-caption text-text-muted">
                {grupp.eventStartdatum ?? 'utan datum'} · {grupp.rader.length} rader
              </span>
            </h2>
            <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-transparent bg-bg-muted contrast-more:border-border-strong">
              {grupp.rader.map((rad) => (
                <RadA
                  key={rad.nyckel}
                  rad={rad}
                  klart={klart}
                  onBelopp={(v) => modell.sattRadBelopp(rad.nyckel, v)}
                  onBetalsatt={(v) => modell.sattRadBetalsatt(rad.nyckel, v)}
                  onDatum={(v) => modell.sattRadDatum(rad.nyckel, v)}
                  onKvitto={(v) => modell.sattRadKvitto(rad.nyckel, v)}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>

      {/* ═══ STICKY HANDLINGSRAD NEDERST (sticky, inte fixed — ligger i flödet
          vid sidans slut och pinnas mot viewportens botten under scroll) ═══ */}
      <div className="sticky bottom-0 z-20 -mx-4 border-border border-t bg-surface/95 px-4 py-3 backdrop-blur lg:-mx-6 lg:px-6">
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-end gap-3">
          {klart ? (
            <div className="w-full">
              <InertaKvittoKnappar antal={antalRegistreradeKvitton(modell.rader)} />
            </div>
          ) : (
            <>
              <span className="mr-auto text-small text-text-secondary">
                {summering.antal} rader · {visaKronor(summering.summa)} kr
              </span>
              <Button
                intent="secondary"
                emphasis="outline"
                isDisabled={summering.antal === 0}
                onPress={modell.registrera}
              >
                Registrera och skicka
              </Button>
              <Button isDisabled={summering.antal === 0} onPress={modell.registrera}>
                {`Registrera ${summering.antal} · ${visaKronor(summering.summa)} kr`}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function RadA({
  rad,
  klart,
  onBelopp,
  onBetalsatt,
  onDatum,
  onKvitto,
}: {
  rad: BekraftelseRad;
  klart: boolean;
  onBelopp: (v: string) => void;
  onBetalsatt: (v: BekraftelseRad['betalsatt']) => void;
  onDatum: (v: string) => void;
  onKvitto: (v: boolean) => void;
}) {
  const [visaDatum, setVisaDatum] = useState(false);

  return (
    <li className="flex flex-col gap-2 p-3">
      <div className="flex flex-wrap items-center gap-3">
        <InitialAvatar namn={rad.inkorg.namn} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="font-medium text-body">{rad.inkorg.namn}</span>
          <SaknasKontext rad={rad} visaEvent={false} />
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <RadMarken rad={rad} />
            {rad.ejGenomforbar !== null && rad.belopp === '' && <Markering rad={rad} />}
          </div>
        </div>

        {rad.utfall !== null ? (
          <div className="ml-auto">
            <RadUtfallRad rad={rad} />
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-28">
              <BeloppInput rad={rad} onChange={onBelopp} hideLabel size="sm" />
            </div>
            <BetalsattMiniSelect
              value={rad.betalsatt}
              onChange={onBetalsatt}
              namn={rad.inkorg.namn}
            />
            <KvittoKryss checked={rad.medKvitto} onChange={onKvitto} label="Kvitto" />
            <Button
              intent="ghost"
              size="sm"
              aria-expanded={visaDatum}
              onPress={() => setVisaDatum((v) => !v)}
            >
              {visaDatum ? 'Dölj datum' : 'Ändra datum'}
            </Button>
          </div>
        )}
      </div>

      {!klart && visaDatum && rad.utfall === null && (
        <div className="w-44 pl-12">
          <DatumInput
            label={`Betalningsdatum för ${rad.inkorg.namn}`}
            hideLabel
            value={rad.datum}
            onChange={onDatum}
            size="sm"
          />
        </div>
      )}
    </li>
  );
}
