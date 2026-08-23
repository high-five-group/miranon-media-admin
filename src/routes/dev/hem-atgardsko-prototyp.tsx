import { createFileRoute, redirect } from '@tanstack/react-router';
import { useQueryState } from 'nuqs';
import {
  ATGARDSKO_VARIANTER,
  type AtgardskoVariantKey,
  EventinfoRadAnatomi,
} from '@/components/dev/hem-atgardsko-prototyp/AtgardskoRadVarianter';
import { PrototypeSwitcher, type PrototypeVariant } from '@/components/dev/PrototypeSwitcher';
import { Bevakningsrad } from '@/components/hem/Bevakningsrad';
import type {
  AtgardskoBevakningRad,
  EventinfoBevakningRad,
} from '@/components/hem/hem-derivations';
import type { Event } from '@/domain/models/Event';

export const Route = createFileRoute('/dev/hem-atgardsko-prototyp')({
  // Dev-only prototyp-yta (ADR-044-mönstret, jfr /dev/hem-prototyp +
  // /dev/auth-prototyp): i produktion finns routen i bundlen men är onåbar
  // — beforeLoad kastar redirect före render.
  beforeLoad: () => {
    if (!import.meta.env.DEV) {
      throw redirect({ to: '/' });
    }
  },
  staticData: { title: 'Åtgärdskö-raden - divergens' },
  component: AtgardskoPrototypPage,
});

/**
 * [TASK-291 AC #1] "litet divergenspass" (kortets egen ordval) — EN
 * nedskriven fråga: hur ska åtgärdskö-raden särskilja sig visuellt från
 * eventinfo-raden, INOM bevakningsrads-familjens tokens (ADR-122 beslut 8)?
 * Ingen egen full-sido-vy (till skillnad från `/dev/hem-prototyp`s V1/V2/V3,
 * TASK-226 — den frågan är redan avgjord och rör hela Hem-vyns estetik).
 * Denna route rör EN rad; substratet återanvänds (samma `PrototypeSwitcher`,
 * samma `?variant=`-URL-kontrakt, ADR-074) men får ett eget litet hemvist
 * eftersom frågan är en annan.
 *
 * TVÅ AXLAR I RAILEN: bara VARIANT (`?variant=`) — ingen VY-axel, en enda
 * rad har ingen familj av skärmar.
 *
 * "SKARPA VYN" (`?variant=` frånvarande) ÄR DAGENS FAKTISKA PRODUKTION,
 * INTE en attrapp: `Bevakningsrad` (den RIKTIGA, oförändrade komponenten,
 * `src/components/hem/Bevakningsrad.tsx`) renderas med BÅDA radtyperna —
 * exakt fyndets illustration, live: eventinfo-raden och åtgärdskö-raden ser
 * identiska ut. Varje variant (a/b/c) byter ENDAST åtgärdskö-radens
 * INNEHÅLL mot ett förslag (se `AtgardskoRadVarianter.tsx`); eventinfo-
 * raden står kvar oförändrad i alla lägen som facit-referens för jämförelse.
 *
 * DEMODATA ÄR FRISTÅENDE (se `AtgardskoRadVarianter.tsx`s docblock för
 * varför denna route inte importerar `dev/hem-prototyp/`s throwaway-
 * universum) — en minimal, handskriven `Event`/`EventinfoBevakningRad` som
 * bara fyller de fält `Bevakningsrad.tsx` faktiskt läser.
 *
 * [TASK-303, tillagd 2026-08-23] I VARIANT-LÄGE (`?variant=` satt) visas
 * INTE längre referensraden via den riktiga `Bevakningsrad` — den bär
 * fortfarande den GAMLA anatomin (`line-clamp-2`, radbrytning) eftersom
 * `Bevakningsrad.tsx` är HELT ORÖRD av denna skiva. I stället renderas
 * `EventinfoRadAnatomi` (`AtgardskoRadVarianter.tsx`), en prototyp-
 * parallell med den NYA höjdlåsta anatomin (rubrik + undertext, alltid
 * båda, talet i en badge), så Marcus ser den FULLA promoverbara formen —
 * båda radtyperna, samma anatomi — i variant-läge. Båda raderna delar NU
 * en enda `<ul aria-label="Bevakningar">` (`EventinfoRadAnatomi` äger sitt
 * eget `<li>`, variantens rad wrappas i ett eget `<li>` här) — samma
 * `<li>`-i-`<ul>`-struktur som skarpa vyn, vilket fixar `<li>`-
 * regressionen Marcus mätte 2026-08-22 (`parentElement.tagName` var
 * `'SECTION'`, inte `'LI'`, i alla tre varianter innan denna ändring).
 *
 * "SKARPA VYN" (`?variant=` frånvarande) förblir OFÖRÄNDRAD — fortsatt den
 * riktiga, orörda `Bevakningsrad` med dagens faktiska (gamla) anatomi, se
 * stycket ovan. De två vyerna visar alltså medvetet OLIKA anatomi-
 * generationer sida vid sida (skarpa vyn = idag, variant-läge = förslaget)
 * — det ÄR poängen med en jämförelseyta.
 */
const VARIANTER: PrototypeVariant[] = [
  { key: 'a', label: 'Variant A - Ikon', steg: 1, stegLabel: 'Steg 1 - divergens' },
  { key: 'b', label: 'Variant B - Etikett', steg: 1, stegLabel: 'Steg 1 - divergens' },
  { key: 'c', label: 'Variant C - Räknare', steg: 1, stegLabel: 'Steg 1 - divergens' },
];

/** Antalet i fyndet (284.5, staging, 2026-08-22) — samma tal, inte gissat. */
const ANTAL_DEMO = 12;

const DEMO_EVENT: Event = {
  id: 'demo-event-atgardsko-referens',
  eventlabel: 'Demo',
  eventNamn: 'Demo: Fjärrskådning',
  typ: 'Kurs',
  ort: 'Uppsala',
  startdatum: null,
  slutdatum: null,
  tidKvarTillEvent: null,
  maxPlatser: 20,
  antalAnmalda: 14,
  platserKvar: 6,
  anmaldBelaggning: 0.7,
  bekraftadBelaggning: 0.6,
  antalNyaAnmalningar: 0,
  antalAnmalningsavgifter: 0,
  antalSlutbetalningar: 0,
  antalSlutbetalningFelande: 0,
  status: null,
};

/** Eventinfo-radens facit-referens — ORÖRD i alla lägen (jämförelsepunkten
    fyndet pekar ut). */
const REFERENS_EVENTINFO_RAD: EventinfoBevakningRad = {
  typ: 'eventinfo',
  event: DEMO_EVENT,
  eventNamn: DEMO_EVENT.eventNamn ?? 'Namnlöst event',
  dagarTillStart: 10,
  lage: 'eftersalantrare',
  antalUtanEventinfo: 3,
};

/** Dagens FAKTISKA åtgärdskö-rad (oförändrad `AtgardskoRadLink`) —
    renderas bara i "skarpa vyn" (`?variant=` frånvarande). */
const REFERENS_ATGARDSKO_RAD: AtgardskoBevakningRad = {
  typ: 'atgardsko',
  antal: ANTAL_DEMO,
};

function AtgardskoPrototypPage() {
  const [variantParam] = useQueryState('variant');
  const variant = ATGARDSKO_VARIANTER[variantParam as AtgardskoVariantKey]
    ? (variantParam as AtgardskoVariantKey)
    : null;
  const VariantInnehall = variant ? ATGARDSKO_VARIANTER[variant] : null;

  return (
    <div className="flex min-h-dvh flex-col gap-8 bg-bg-subtle p-6">
      <header className="flex max-w-prose flex-col gap-2">
        <h1 className="font-semibold text-2xl">Åtgärdskö-radens särskiljning</h1>
        <p className="text-body text-text-secondary">
          TASK-291 AC #1 (QA-fynd 284.5) + TASK-303 (höjdlåset). "Skarpa vyn" nedan (växlarens
          fil-ikon, eller ingen <code>?variant=</code> alls) visar dagens FAKTISKA rader,
          oförändrade: fyndet, live, är att de ser identiska ut OCH att höjden kan variera med
          copyns längd. Varje variant a/b/c byter åtgärdskö-radens innehåll mot ett förslag OCH
          visar deltagarinfo-referensraden i den nya, höjdlåsta anatomin (rubrik + undertext, alltid
          båda, talet i en egen badge): den fulla, promoverbara formen.
        </p>
      </header>

      <section aria-labelledby="bevakningar-rubrik" className="flex max-w-xl flex-col gap-2">
        <h2 id="bevakningar-rubrik" className="sr-only">
          Bevakningar (prototyp)
        </h2>
        {VariantInnehall ? (
          <ul aria-label="Bevakningar" className="flex min-w-0 flex-col gap-2">
            <EventinfoRadAnatomi rad={REFERENS_EVENTINFO_RAD} onOppna={() => {}} />
            <li>
              <VariantInnehall antal={ANTAL_DEMO} />
            </li>
          </ul>
        ) : (
          <Bevakningsrad
            rader={[REFERENS_EVENTINFO_RAD, REFERENS_ATGARDSKO_RAD]}
            onOppnaEventinfo={() => {}}
          />
        )}
      </section>

      <PrototypeSwitcher variants={VARIANTER} />
    </div>
  );
}
