import type { UseQueryResult } from '@tanstack/react-query';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { useQueryState } from 'nuqs';
import type { CSSProperties } from 'react';
import { useMemo } from 'react';
import { demoUniversum } from '@/components/dev/hem-prototyp/demoData';
import { VariantRo } from '@/components/dev/hem-prototyp/VariantRo';
import {
  type PrototypeDataLage,
  PrototypeSwitcher,
  type PrototypeVariant,
} from '@/components/dev/PrototypeSwitcher';
import { SvepOverlay } from '@/components/dev/svep-prototyp/SvepOverlay';
import type { Scenario, SvepTyp } from '@/components/dev/svep-prototyp/types';
import { Modal } from '@/components/primitives';
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
 * TASK-241.1 KONVERGENSVARV 2 — sändytan (bekräftelse-/påminnelsesvepen) som
 * OVERLAY ovanpå hem-vyn (ADR-114 + S102 Del 10 beslut 1: "Hem är
 * ARBETSPLATSEN — handlingar påbörjas och slutförs utan att lämna vyn").
 *
 * BAKGRUNDEN är hem-prototypens V1-form (`VariantRo`, task-226-facitet) —
 * RIVNINGSBEROENDE, bokfört i kortets notes: när `task-243.5` river
 * `components/dev/hem-prototyp/` måste denna import pekas om. Bakgrunden
 * matas med ETT EGET syntetiskt universum via HANDBYGGDA query-liknande
 * objekt — INTE de riktiga hookarna: routen körs på en annan dev-port än
 * 5173, och 5173/4173 är de enda CORS-allowlistade portarna
 * (`docs/reference/prototyp-verifiering-runbook.md` § Portkartan).
 * `SenasteAktivitetKompakt` inne i `VariantRo` gör ändå ETT eget riktigt
 * anrop som routen inte kan mocka utan att röra hem-prototyp-katalogen; det
 * faller till sitt egna inbyggda felläge och stör inte renderingen.
 *
 * VARV 2 ÅTGÄRDAR TRE SAKER I DENNA FIL — scrimmen, bredden och railen:
 *
 * SCRIMMEN (Marcus-fynd 1). Husets delade scrim är
 * `color-mix(in srgb, var(--mm-text) 50%, transparent)`
 * (`components.css:227`), utan blur. Den är avvägd för husets små
 * formulärdialoger (28 rem); under en yta som täcker halva skärmen blev den
 * "en platt, tung gråmassa som dödar hemmet bakom". Routen sätter därför en
 * LOKAL override av samma token via `style` — värdet går genom `Modal`s
 * `...props` till `ModalOverlay`, alltså precis det element som konsumerar
 * variabeln (`Modal.tsx:32-34`), och når varken den globala token-filen
 * eller husets övriga dialoger. Samma formel som huset, lägre täckning, plus
 * en lätt blur som håller hemmet läsbart men ur fokus. Att i stället ändra
 * `components.css` hade träffat varenda dialog i appen — utanför denna
 * skivas scope. Förslag till Marcus, inte ett fait accompli.
 *
 * BREDDEN. Varv 1 körde `w-[min(94vw,52rem)]`. Det var roten till att
 * ämnesradens värde hamnade "i extremhögerkanten": Åtgärds-sidans
 * etikett/värde-grammatik är avvägd för en LÄSKOLUMN, inte för 52 rem.
 * 40 rem är samma storleksordning som förlagans kolumn.
 *
 * ÖVERGÅNGEN (Marcus-fynd 8). `Modal`s egen transition är
 * `duration-200 data-[entering]:scale-95` (`Modal.tsx:38`) — den hårda
 * växlingen. `className` går via `cn()` (tailwind-merge) till samma element,
 * så en längre duration och en mindre skalning vinner utan att primitiven
 * ändras. Innehållets mjuka entré ligger i `SvepOverlay` via husets
 * `--animate-mm-avsloj`. `prefers-reduced-motion` neutraliserar båda globalt
 * (`base.css`).
 */
const VARIANTER: PrototypeVariant[] = [
  { key: '1', label: 'Bekräftelsesvepet', steg: 2, stegLabel: 'Konvergensvarv 2' },
  { key: '2', label: 'Påminnelsesvepet', steg: 2, stegLabel: 'Konvergensvarv 2' },
];

/**
 * RAILEN (Marcus-fynd 7, uppgraderat till hårt krav i förstärkningen).
 *
 * MÄTT ROT-ORSAK — varv 1 byggde ALDRIG en egen rail. Det finns exakt EN
 * `PrototypeSwitcher` i repot (`src/components/dev/PrototypeSwitcher.tsx`,
 * grep-verifierat), och både `/dev/hem-prototyp` och denna route importerade
 * redan samma fil. Symptomen kom uteslutande ur KONFIGURATIONEN:
 *
 *   • Variant-knappen renderar `v.key` som synlig text i en 36x36 px cirkel
 *     (`PrototypeSwitcher.tsx:317`). Varv 1 skickade `key: 'bekraftelse'` —
 *     elva tecken i en cirkel byggd för ett. Det var klippningen mot kanten.
 *     Hem-prototypen skickar `'1'`/`'2'`/`'3'`.
 *   • Dataläges-badgen renderar `label` i en 16 px hörn-badge
 *     (`PrototypeSwitcher.tsx:359`). Varv 1 skickade `'Tomt urval'` och
 *     `'Fel-läge'`. Det var de överlappande badgarna. Hem-prototypen
 *     skickar `'Tom'`/`'Demo'`.
 *
 * Varv 2 konfigurerar därför railen som hem-prototypen gör, och rör inte den
 * delade komponenten. `aliases` håller varv 1:s URL:er levande.
 *
 * `?data=`-VÄRDENA är MEDVETET oförändrade: de delas med bakgrundens egen
 * `?data=`-läsning (`VariantRo` känner `'tom'`/`'demo'`), och varv 1 valde
 * icke-kolliderande strängar just därför. Bara ETIKETTERNA är förkortade —
 * det är de, inte värdena, som badgen visar.
 */
const ALIASES: Record<string, string> = { bekraftelse: '1', paminnelse: '2' };

const DATA_LAGEN: PrototypeDataLage[] = [
  { value: null, label: 'Normal' },
  { value: 'tomt-urval', label: 'Tomt' },
  { value: 'fel-utfall', label: 'Fel' },
];

/** Lokal scrim-override, se docblocket § SCRIMMEN. */
const SCRIM: CSSProperties = {
  '--mm-dialog-overlay-bg': 'color-mix(in srgb, var(--mm-text) 32%, transparent)',
  backdropFilter: 'blur(3px)',
} as CSSProperties;

function tillScenario(data: string | null): Scenario {
  if (data === 'tomt-urval') return 'tomt';
  if (data === 'fel-utfall') return 'fel';
  return 'normal';
}

/** Både varv 2:s korta nycklar och varv 1:s långa (som `ALIASES` håller
    levande i railen) leder till samma svep-typ. */
function tillSvepTyp(variant: string | null): SvepTyp | null {
  if (variant === '1' || variant === 'bekraftelse') return 'bekraftelse';
  if (variant === '2' || variant === 'paminnelse') return 'paminnelse';
  return null;
}

/** Duck-typade query-liknande objekt (endast fälten `VariantRo`/`ui.tsx`
    faktiskt läser) — se docblockets CORS-motiv. Aldrig ett nätverksanrop. */
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
        style={SCRIM}
        // Scrollen bor på dialogens body (se `SvepOverlay`s docblock), så
        // `Modal` självt får inte scrolla: `overflow-hidden` vinner över
        // primitivens `overflow-auto` via tailwind-merge.
        className="w-[min(94vw,40rem)] overflow-hidden duration-300 data-[entering]:scale-[0.98] data-[exiting]:scale-[0.98]"
        onOpenChange={(open) => {
          if (!open) stang();
        }}
      >
        {svepTyp && <SvepOverlay svepTyp={svepTyp} scenario={scenario} onClose={stang} />}
      </Modal>

      <PrototypeSwitcher variants={VARIANTER} aliases={ALIASES} dataLagen={DATA_LAGEN} />
    </>
  );
}
