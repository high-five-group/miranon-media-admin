import { createFileRoute, redirect } from '@tanstack/react-router';
import { useState } from 'react';
import type { Betalsatt } from '@/components/betalningar/betalsatt-minne';
import { harledRad } from '@/components/betalningar/inkorg-harledningar';
import { type RedigeringsVarden, RegistreraForm } from '@/components/betalningar/RegistreraForm';
import { Button } from '@/components/primitives';
import type { OppenBetalning } from '@/domain/schemas';

/**
 * [TASK-402.2 AC #3] DEV-KONSUMENT för det delade Klar/Avbryt-läget
 * (`RegistreraForm`s `lage="redigera"`) — bevisar läget LEVANDE, i webbläsaren,
 * UTAN att röra prototypgrenen (`src/components/betalningar/prototype/**`,
 * ägd av draft-PR #2325 fram till landning) eller vänta på TASK-402.3:s
 * riktiga andra konsument (bekräftelsestegets radkort).
 *
 * Dev-only demo-yta (samma ADR-044-mönster som `/dev/primitives` och
 * `/dev/patterns`): i produktion finns routen i bundlen men är onåbar —
 * `beforeLoad` kastar redirect före render.
 *
 * VARFÖR EN EGEN ROUTE OCH INTE ETT UNIT-TEST: repot har ingen
 * komponent-renderingsrigg (inget vitest/@testing-library/react,
 * `package.json` bär bara Playwright) — samma gräns
 * `kvitto-forhandsgranskning.test.ts`s filhuvud dokumenterar för
 * `BetalningsInkorg` ("kräver router, React Query, dataadapter och
 * miljöflagga — en acceptance-yta, inte en api-pure-svit"). En
 * källkods-sträng-grind hade kunnat bevisa att texten "Klar" FINNS i
 * villkorad JSX, men aldrig att `onRedigeringKlar` faktiskt anropas MED RÄTT
 * VÄRDEN och att INGET serveranrop görs. Den här sidan bevisar båda, live.
 *
 * INGEN MUTATION KAN TRÄFFA SERVERN VIA DENNA SIDAS EGET FLÖDE: `spara()`s
 * `redigera`-gren (`RegistreraForm.tsx`) returnerar innan
 * `registrera.mutateAsync` någonsin anropas — se den funktionens docblock.
 * Den fristående "Har ni kommit överens om ett nytt pris?"-länken i
 * utfallsrutan är OBEROENDE av `lage` och kvar orörd (den hör till formulärets
 * pris-yta, inte till registrerings-vägen denna sida verifierar) — den är
 * fri att klicka på men pekar mot en påhittad `anmalanRecordId` och
 * fallerar därför synligt om någon råkar trycka den, aldrig tyst.
 */

const FIXTUR: OppenBetalning = {
  anmalanRecordId: 'dev-fixtur-registrera-form-redigera',
  personNamn: 'Dev Testsson',
  personEpost: 'dev@example.test',
  personTelefon: '070-000 00 00',
  eventId: 'dev-event-registrera-form-redigera',
  eventNamn: 'Dev-eventet (demo)',
  eventStartdatum: '2099-12-01',
  eventTyp: 'Utbildning',
  anmalanStatus: 'Bekräftad (mail skickat)',
  saknas: 1500,
  gallandePris: 1500,
  anmalningsavgift: 500,
  summaInbetalt: 0,
  summaInbetaltSpegel: 0,
  spegelIFas: true,
  deadlineSlutbetalning: null,
  kvittonAttSkicka: 0,
  oskickadeKvitton: [],
};

const IDAG = '2026-09-05';

export const Route = createFileRoute('/dev/registrera-form-redigera')({
  beforeLoad: () => {
    if (!import.meta.env.DEV) {
      throw redirect({ to: '/' });
    }
  },
  staticData: { title: 'RegistreraForm, redigera-läget (demo)' },
  component: RegistreraFormRedigeraDemo,
});

function RegistreraFormRedigeraDemo() {
  const [oppen, setOppen] = useState(true);
  const [betalsatt, setBetalsatt] = useState<Betalsatt>('Swish');
  const [senastKlar, setSenastKlar] = useState<RedigeringsVarden | null>(null);
  const [avbrutetAntal, setAvbrutetAntal] = useState(0);
  const rad = harledRad(FIXTUR, IDAG);

  return (
    <section className="flex flex-col gap-4 p-4">
      <header className="flex flex-col gap-1">
        <h1 className="font-semibold text-3xl">RegistreraForm, redigera-läget (demo)</h1>
        <p className="text-small text-text-secondary">
          TASK-402.2 AC #3: det delade Klar/Avbryt-läget bekräftelsesteget (TASK-402.3)
          återanvänder. "Klar" gör inget serveranrop, de ifyllda värdena visas nedan i stället.
        </p>
      </header>

      {!oppen && (
        <Button onPress={() => setOppen(true)} data-testid="oppna-formular">
          Öppna formuläret igen
        </Button>
      )}

      {oppen && (
        <RegistreraForm
          rad={rad}
          idag={IDAG}
          betalsatt={betalsatt}
          onBetalsatt={setBetalsatt}
          lage="redigera"
          onRedigeringKlar={(varden) => {
            setSenastKlar(varden);
            setOppen(false);
          }}
          onAvbryt={() => {
            setAvbrutetAntal((n) => n + 1);
            setOppen(false);
          }}
        />
      )}

      <dl className="flex flex-col gap-1 text-small">
        <div className="flex gap-2">
          <dt className="font-medium">Senast Klar:</dt>
          <dd data-testid="senast-klar">{senastKlar ? JSON.stringify(senastKlar) : 'inget än'}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-medium">Antal Avbryt:</dt>
          <dd data-testid="avbrutet-antal">{avbrutetAntal}</dd>
        </div>
      </dl>
    </section>
  );
}
