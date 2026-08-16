import type { UseQueryResult } from '@tanstack/react-query';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { useQueryState } from 'nuqs';
import { useMemo } from 'react';
import { demoUniversum } from '@/components/dev/hem-prototyp/demoData';
import { VariantRo } from '@/components/dev/hem-prototyp/VariantRo';
import {
  type PrototypeDataLage,
  PrototypeSwitcher,
  type PrototypeVariant,
} from '@/components/dev/PrototypeSwitcher';
import { SVEP_RUBRIK } from '@/components/dev/svep-prototyp/data';
import { SvepOverlay } from '@/components/dev/svep-prototyp/SvepOverlay';
import type { Scenario, SvepTyp } from '@/components/dev/svep-prototyp/types';
import { Dialog, Modal } from '@/components/primitives';
import type { Event } from '@/domain/models/Event';
import type { Registration } from '@/domain/models/Registration';

export const Route = createFileRoute('/dev/svep-prototyp')({
  // Dev-only prototyp-yta (ADR-044-mönstret, jfr /dev/hem-prototyp +
  // /dev/prototyper): i produktion finns routen i bundlen men är onåbar —
  // beforeLoad kastar redirect före render.
  beforeLoad: () => {
    if (!import.meta.env.DEV) {
      throw redirect({ to: '/' });
    }
  },
  staticData: { title: 'Sändytans konvergens - prototyp' },
  component: SvepPrototypPage,
});

/**
 * TASK-241.1 KONVERGENSVARV 1 — sändytan (bekräftelse-/påminnelsesvepen) som
 * OVERLAY ovanpå hem-vyn (ADR-114 + S102 Del 10 beslut 1: "Hem är
 * ARBETSPLATSEN — handlingar påbörjas och slutförs utan att lämna vyn").
 *
 * BAKGRUNDEN är hem-prototypens V1-form (`VariantRo`, task-226-facitet,
 * facit-låst 2026-08-16) — RIVNINGSBEROENDE, bokfört i kortets notes: när
 * `task-243.5` river `components/dev/hem-prototyp/` måste denna import
 * pekas om (mot den då-skarpa `/hem`-vyn, eller mot en frusen egen kopia om
 * svepytan fortfarande är i prototypform). Bakgrunden matas med ETT EGET
 * syntetiskt universum (`demoUniversum`, samma fixtur som hem-prototypens
 * `?data=demo`) via HANDBYGGDA query-liknande objekt — INTE de riktiga
 * `useDashboardEvents`/`useDashboardRegistrations`-hooken: den här routen
 * körs typiskt på en ANNAN dev-port än 5173 (egen worktree,
 * `docs/reference/prototyp-verifiering-runbook.md` § "En egen ports
 * CORS-vägg"), och 5173 är den enda CORS-allowlistade porten för Supabase-
 * anropen. Bakgrunden ska vara stillsam dekoration, inte ett nätverksfel.
 * `SenasteAktivitetKompakt` (inne i `VariantRo`) gör ändå ETT eget riktigt
 * anrop (`useLatestActivity`) som denna route INTE kan mocka utan att röra
 * hem-prototyp-katalogen — MÄTT på port 5180 (varv 1s egen-verifiering):
 * appens globala startvärmning (ADR-112) gör dessutom SAMMA sak för
 * events/registrations/leads/waitlist oavsett route, så flera CORS-fel
 * loggas i konsolen vid varje sidladdning. Ingen av dem stör renderingen —
 * "Senaste aktivitet" visar sitt SKELETON i några sekunder (React Querys
 * retry-fördröjning) och faller sedan tillbaka till sitt egna, redan
 * inbyggda felläge ("Kunde inte hämta senaste aktiviteten.", bekräftat
 * efter 15 s väntan). Se slutrapporten för fullständigt verifieringsutfall.
 *
 * SÄNDYTAN öppnas via prototyp-växlarens variant-knappar (`bekraftelse`/
 * `paminnelse`) — INTE via hem-bakgrundens egna "Bekräfta alla"/"Skicka
 * påminnelse till alla"-knappar (`DodIngang`, `skarp`, medvetet UTAN
 * `onPress` i hem-prototypen, task-226-scope). Att koppla dem hade krävt
 * att ändra `VariantRo.tsx` — en fil som hör till en ANNAN skiva och rivs i
 * task-243.5; själva ihopkopplingen ("Hem PEKAR") är dessutom explicit
 * UTANFÖR denna skivas AC (den handlar om sändytans EGEN form). Railens
 * variant-knappar är därför den avsedda ingången i prototypform, samma
 * mönster som `/dev/hem-prototyp` redan använder för V1/V2/V3.
 *
 * Overlayen är husets `Modal`+`Dialog`-primitiv (ADR-044, react-aria-
 * components under huven): fokusfälla, Escape-stängning, `inert` bakgrund
 * och fokus-retur kommer gratis. Övergången (AC #4) är SKISSAD i varv 1 —
 * Modal-primitivens befintliga fade+scale-transition (`data-entering`/
 * `data-exiting`), som redan respekterar `prefers-reduced-motion` via
 * `base.css`s globala neutralisering. En mer komponerad "fortsättning av
 * Morgonkollen"-koreografi (`--animate-mm-*`-familjen nämns som precedent i
 * uppdraget) är en kandidat för ett SENARE varv, inte avgjord här.
 */
const VARIANTER: PrototypeVariant[] = [
  { key: 'bekraftelse', label: 'Bekräftelsesvepet', steg: 1, stegLabel: 'Konvergensvarv 1' },
  { key: 'paminnelse', label: 'Påminnelsesvepet', steg: 1, stegLabel: 'Konvergensvarv 1' },
];

/**
 * Simulerade datalägen (kortets AC #1). Värdena kolliderar MEDVETET inte
 * med `VariantRo.tsx`s egna `?data=`-lägen (`'tom'`/`'demo'`) — samma
 * query-nyckel (`?data=`) delas därför riskfritt mellan bakgrunden (som
 * aldrig matchar dessa strängar och alltid stannar i sitt "verklig"-läge)
 * och sändytans eget scenario-val.
 */
const DATA_LAGEN: PrototypeDataLage[] = [
  { value: null, label: 'Normalt urval' },
  { value: 'tomt-urval', label: 'Tomt urval' },
  { value: 'fel-utfall', label: 'Fel-läge' },
];

function tillScenario(data: string | null): Scenario {
  if (data === 'tomt-urval') return 'tomt';
  if (data === 'fel-utfall') return 'fel';
  return 'normal';
}

function tillSvepTyp(variant: string | null): SvepTyp | null {
  return variant === 'bekraftelse' || variant === 'paminnelse' ? variant : null;
}

/** Duck-typade query-liknande objekt (endast fälten `VariantRo`/`ui.tsx`
    faktiskt läser: `data`/`isPending`/`isError`/`error`) — se docblockets
    CORS-motiv. Aldrig en riktig `useQuery`-instans, aldrig ett nätverksanrop. */
function fakeQuery<T>(data: T): UseQueryResult<T, Error> {
  return {
    data,
    isPending: false,
    isError: false,
    error: null,
  } as unknown as UseQueryResult<T, Error>;
}

function SvepPrototypPage() {
  const [variantParam, setVariant] = useQueryState('variant');
  const [dataParam] = useQueryState('data');
  const svepTyp = tillSvepTyp(variantParam);
  const scenario = tillScenario(dataParam);
  const stang = () => setVariant(null);

  const nuMs = useMemo(() => Date.now(), []);
  const demo = useMemo(() => demoUniversum(nuMs), [nuMs]);
  const eventsQuery = useMemo(() => fakeQuery<Event[]>(demo.events), [demo.events]);
  const registrationsQuery = useMemo(
    () => fakeQuery<Registration[]>(demo.registrations),
    [demo.registrations],
  );

  return (
    <>
      <VariantRo eventsQuery={eventsQuery} registrationsQuery={registrationsQuery} nuMs={nuMs} />

      <Modal
        isOpen={svepTyp != null}
        isDismissable
        onOpenChange={(open) => {
          if (!open) stang();
        }}
      >
        {svepTyp && (
          <Dialog title={SVEP_RUBRIK[svepTyp]} className="max-h-[85vh] w-[min(94vw,52rem)]">
            {({ close }) => <SvepOverlay svepTyp={svepTyp} scenario={scenario} onClose={close} />}
          </Dialog>
        )}
      </Modal>

      <PrototypeSwitcher variants={VARIANTER} dataLagen={DATA_LAGEN} />
    </>
  );
}
