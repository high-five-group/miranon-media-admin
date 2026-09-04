import { createFileRoute, redirect } from '@tanstack/react-router';
import { CalendarDays, ClipboardList, Hourglass, List, Star } from 'lucide-react';
import { useState } from 'react';
import { ChunkBanner, Forberedelseskarm, OfflineIndicator } from '@/components/AppShell';
import { AppErrorFallback } from '@/components/ErrorBoundary';
import {
  Button,
  Dialog,
  DialogTrigger,
  Input,
  InstallPrompt,
  MessageBox,
  Modal,
  NavCard,
  Select,
  SelectItem,
  SidRam,
  Skeleton,
  SlideToConfirm,
  TextArea,
  ToggleButton,
  ToggleButtonGroup,
} from '@/components/primitives';

const MESSAGE_INTENTS = ['info', 'success', 'warning', 'error'] as const;

// 'success' = grön primär (task-19.3; S73-facit K77 — skapa-sidans "Skapa event").
const INTENTS = ['primary', 'secondary', 'danger', 'ghost', 'success'] as const;
const SIZES = ['sm', 'md', 'lg'] as const;

export const Route = createFileRoute('/dev/primitives')({
  // Dev-only demo-yta (ADR-044): i produktion finns routen i bundlen men
  // är onåbar — beforeLoad kastar redirect före render.
  beforeLoad: () => {
    if (!import.meta.env.DEV) {
      throw redirect({ to: '/' });
    }
  },
  staticData: { title: 'Primitiver - demo' },
  component: PrimitivesPage,
});

function PrimitivesPage() {
  // Press-status gör onPress-pipelinen observerbar vid manuell verifiering
  // (mus, Enter, Space) — aria-live annonserar även till skärmläsare.
  const [senastTryckt, setSenastTryckt] = useState('—');
  return (
    <main className="p-8">
      {/* `ChunkBanner` (TASK-285.5) lever numera bara i `AppShell` (inloggade
          skalet) + här — `/dev/primitives` ligger UTANFÖR skalet, så denna
          rad är den ENDA kvarvarande vägen `tests/webblasarbeteende/
          app-chunk-laddningsfel.test.ts` kan pröva komponentens BETEENDE
          (ersätter/staplas inte, ingen tom alert-region, eventet sväljs
          inte) mot — se `ChunkBanner.tsx`s docblock § "PLACERINGEN". */}
      <ChunkBanner />
      {/* `OfflineIndicator` (TASK-285.6) lever precis som `ChunkBanner` bara
          i `AppShell` (inloggade skalet) + här — samma skäl, samma väg:
          `/dev/primitives` ligger UTANFÖR skalet, så denna rad är den ENDA
          kvarvarande vägen `tests/webblasarbeteende/offline-notis.test.ts`
          kan pröva komponentens BETEENDE (offline/online, staplingen mot
          den redan-globala `AppUpdateBanner` ovan) hermetiskt, utan
          autentisering eller staging. */}
      <OfflineIndicator />
      <h1 className="text-2xl">Primitiver - demo (endast dev-läge)</h1>
      <p className="mt-2 text-small text-text-secondary">
        Visuell verifiering av alla size × intent-kombinationer per Fas 3 DoD 3.
      </p>
      <p aria-live="polite" className="mt-2 text-small">
        Senast tryckt: <span data-testid="senast-tryckt">{senastTryckt}</span>
      </p>
      {INTENTS.map((intent) => (
        <section key={intent} aria-labelledby={`rubrik-${intent}`} className="mt-8">
          <h2 id={`rubrik-${intent}`} className="text-xl">
            Button - {intent}
          </h2>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            {SIZES.map((size) => (
              <Button
                key={size}
                intent={intent}
                size={size}
                onPress={() => setSenastTryckt(`${intent} ${size}`)}
              >
                {intent} {size}
              </Button>
            ))}
            <Button
              intent={intent}
              isDisabled
              onPress={() => setSenastTryckt(`${intent} DISABLED`)}
            >
              Inaktiverad
            </Button>
            {/* isLoading — Laddtrappans steg 2 (ADR-113, task-219.2): knapp-
                intern spinner + spärrat klickläge + polite sr-besked, granskat
                här för samtliga fem intents (onPress nollas internt av
                isLoading — knappen ÄR faktiskt spärrad, precis som facitet). */}
            <Button
              intent={intent}
              isLoading
              loadingText="Laddar …"
              onPress={() => setSenastTryckt(`${intent} LOADING`)}
            >
              Laddar
            </Button>
          </div>
        </section>
      ))}
      {/* TASK-361 r2 — knappens laddläge ska ALDRIG ändra mått (bredd/höjd),
          i VILA ELLER i laddläge (r1:s stapel-teknik höll bara det senare —
          granskningsfynd PR #2212 runda 1, risk HÖG). En referens-knapp
          (ingen `isLoading`-prop alls) + en target-knapp (samma etikett,
          `loadingText` LÄNGRE än etiketten) PER storlek (sm/md/lg — r1:s
          demo täckte bara md) + en EXTERN togglingskontroll (INTE
          knapparnas egna `onPress` — speglar hur en riktig mutation styr
          `isLoading` UTIFRÅN, se `BetalningsInkorg.tsx`s `koa.isPending`)
          så `tests/webblasarbeteende/button-laddlage-stabil-bredd.test.ts`
          kan mäta target MOT referensen, FÖRE och EFTER `isLoading`
          växlar, för alla tre storlekar, utan en riktig mutation eller
          staging. */}
      <section aria-labelledby="rubrik-laddlage-stabil-bredd" className="mt-8">
        <h2 id="rubrik-laddlage-stabil-bredd" className="text-xl">
          Button - laddläge, stabil bredd (TASK-361)
        </h2>
        <LaddlageStabilBreddDemo />
      </section>
      <section aria-labelledby="rubrik-input" className="mt-8 max-w-md">
        <h2 id="rubrik-input" className="text-xl">
          Input
        </h2>
        <div className="mt-4 flex flex-col gap-4">
          {SIZES.map((size) => (
            <Input key={size} size={size} label={`Namn (${size})`} placeholder="Anna Andersson" />
          ))}
          <Input
            label="E-post"
            description="Används för bekräftelsemail"
            placeholder="anna@exempel.se"
          />
          <Input label="Namn" errorMessage="Namn får inte vara tomt" isInvalid isRequired />
          <Input label="Låst fält" isDisabled placeholder="Kan inte redigeras" />
        </div>
      </section>
      <section aria-labelledby="rubrik-textarea" className="mt-8 max-w-md">
        <h2 id="rubrik-textarea" className="text-xl">
          TextArea
        </h2>
        <div className="mt-4 flex flex-col gap-4">
          {SIZES.map((size) => (
            <TextArea key={size} size={size} label={`Meddelande (${size})`} placeholder="Skriv…" />
          ))}
          <TextArea
            label="Meddelande"
            description="Texten som skickas till mottagarna"
            placeholder="Hej!"
            rows={6}
          />
          <TextArea
            label="Meddelande"
            errorMessage="Meddelande får inte vara tomt"
            isInvalid
            isRequired
          />
          {/* autoGrow = composer-formen (task-18.11): växer med innehållet upp till
              taket, resize-handtaget utgår, kort-radien. */}
          <TextArea
            label="Anteckning (autoGrow-composer)"
            hideLabel
            size="sm"
            rows={3}
            autoGrow
            placeholder="Skriv en anteckning …"
          />
          <TextArea label="Låst fält" isDisabled placeholder="Kan inte redigeras" />
        </div>
      </section>
      <section aria-labelledby="rubrik-select" className="mt-8 max-w-md">
        <h2 id="rubrik-select" className="text-xl">
          Select
        </h2>
        <div className="mt-4 flex flex-col gap-4">
          <Select
            label="Status"
            placeholder="Välj status"
            onSelectionChange={(key) => setSenastTryckt(`select: ${String(key)}`)}
          >
            <SelectItem id="anmald">Anmäld</SelectItem>
            <SelectItem id="betald">Betald</SelectItem>
            <SelectItem id="avbokad">Avbokad</SelectItem>
            <SelectItem id="vantelista">Väntelista</SelectItem>
          </Select>
          <Select
            label="Status (fel)"
            placeholder="Välj status"
            isInvalid
            errorMessage="Välj en status"
          >
            <SelectItem id="anmald">Anmäld</SelectItem>
            <SelectItem id="betald">Betald</SelectItem>
          </Select>
          <Select label="Status (låst)" placeholder="Kan inte väljas" isDisabled>
            <SelectItem id="anmald">Anmäld</SelectItem>
            <SelectItem id="betald">Betald</SelectItem>
          </Select>
        </div>
      </section>
      <section aria-labelledby="rubrik-messagebox" className="mt-8 max-w-md">
        <h2 id="rubrik-messagebox" className="text-xl">
          MessageBox
        </h2>
        <div className="mt-4 flex flex-col gap-4">
          {MESSAGE_INTENTS.map((intent) => (
            <MessageBox key={intent} intent={intent} title={`Rubrik (${intent})`}>
              Brödtext för {intent}-meddelandet - alltid i neutral textfärg.
            </MessageBox>
          ))}
          {/* Knapprad (actions-sloten) utan kryss — S109-facit: `error`/
              `warning` bär ALDRIG en stäng-knapp, bara handlingar. */}
          <MessageBox
            intent="error"
            title="Med knapprad (error)"
            actions={
              <Button
                intent="secondary"
                size="sm"
                onPress={() => setSenastTryckt('messagebox: error försök igen')}
              >
                Försök igen
              </Button>
            }
          >
            actions-sloten renderar högerställd under texten; ingen kryss-knapp för error.
          </MessageBox>
          <MessageBox
            intent="warning"
            title="Med knapprad (warning)"
            actions={
              <Button
                intent="secondary"
                size="sm"
                onPress={() => setSenastTryckt('messagebox: warning ignorera')}
              >
                Ignorera varningen
              </Button>
            }
          >
            Samma actions-slot som error; ingen kryss-knapp för warning heller.
          </MessageBox>
          {/* Kryss utan knapprad — bara info/success får stängas manuellt. */}
          <MessageBox
            intent="success"
            title="Avvisningsbar (success)"
            onDismiss={() => setSenastTryckt('messagebox: success avvisad')}
          >
            Stäng-knappen wirar till statusraden ovan.
          </MessageBox>
          <MessageBox
            intent="info"
            title="Avvisningsbar (info)"
            onDismiss={() => setSenastTryckt('messagebox: info avvisad')}
          >
            Stäng-knappen wirar till statusraden ovan.
          </MessageBox>
          {/* Kryss OCH knapprad tillsammans — de två slotarna är oberoende. */}
          <MessageBox
            intent="success"
            title="Kryss och knapprad tillsammans"
            onDismiss={() => setSenastTryckt('messagebox: success avvisad (med knapprad)')}
            actions={
              <Button
                intent="secondary"
                size="sm"
                onPress={() => setSenastTryckt('messagebox: success visa kvitto')}
              >
                Visa kvitto
              </Button>
            }
          >
            Krysset sitter på rubrikens linje; knappraden ligger under texten.
          </MessageBox>
        </div>
      </section>
      <section aria-labelledby="rubrik-messagebox-facit" className="mt-8 max-w-md">
        <h2 id="rubrik-messagebox-facit" className="text-xl">
          MessageBox: facit-formens fyra intents
        </h2>
        <p className="mt-2 text-small text-text-secondary">
          PROMOVERINGS-GRINDENS ANKARE (ADR-103 B4). Blocken nedan är{' '}
          <code>messagebox-promoverings-grind.spec.ts</code>s EFTER-läge: exakt de fyra intents vars{' '}
          <code>ariaSnapshot</code>-referenser är innehållslåsta i{' '}
          <code>tasks/sessions/bilagor/s109-meddelandefamiljen-konvergens/facit.json</code>.
          Flyttade hit ORÖRDA från den rivna prototyp-routen <code>/dev/notis-prototyp</code>{' '}
          (TASK-285.11): samma <code>data-testid</code>, samma copy, samma struktur, så referenserna
          fortsätter gälla. Ändra inte rubrik, brödtext eller knapptext här utan att läsa invariant
          (d) i <code>scripts/check-facit.sh</code> först.
        </p>
        <div className="mt-4 flex flex-col gap-6">
          <div data-testid="notis-formularfel">
            <MessageBox
              intent="error"
              title="Lösenordet kunde inte sparas"
              actions={
                <Button intent="secondary" size="sm">
                  Försök igen
                </Button>
              }
            >
              <p>
                Kontrollera att du är uppkopplad och prova igen. Det du skrev finns kvar i fälten.
              </p>
            </MessageBox>
          </div>
          <div data-testid="notis-varning">
            <MessageBox intent="warning" title="Eventet är fullbokat">
              <p>Nya anmälningar hamnar på väntelistan tills en plats blir ledig.</p>
            </MessageBox>
          </div>
          {/* onDismiss är medvetet en no-op: blocken är grind-ankare, inte
              interaktions-demo (den rollen bär MessageBox-sektionen ovan, som
              wirar sina kryss till statusraden). En kryss-knapp som faktiskt
              avmonterade rutan hade gjort ankaret beroende av klick-ordning. */}
          <div data-testid="notis-kvitto">
            <MessageBox intent="success" title="Bekräftelsemail skickat" onDismiss={() => {}}>
              <p>Anna Andersson har fått bekräftelsen på sin e-post.</p>
            </MessageBox>
          </div>
          <div data-testid="notis-info">
            <MessageBox intent="info" title="Eventet saknar plats" onDismiss={() => {}}>
              <p>Lägg till en plats så att den kommer med i bekräftelsen.</p>
            </MessageBox>
          </div>
        </div>
      </section>
      <section aria-labelledby="rubrik-dialog" className="mt-8 max-w-md">
        <h2 id="rubrik-dialog" className="text-xl">
          Modal + Dialog
        </h2>
        <div className="mt-4">
          <DialogTrigger>
            <Button intent="secondary">Öppna bekräftelse-dialog</Button>
            <Modal isDismissable>
              <Dialog
                title="Ta bort anmälan?"
                actions={({ close }) => (
                  <>
                    <Button intent="ghost" onPress={close}>
                      Avbryt
                    </Button>
                    <Button
                      intent="danger"
                      onPress={() => {
                        setSenastTryckt('dialog: bekräftad');
                        close();
                      }}
                    >
                      Ta bort
                    </Button>
                  </>
                )}
              >
                Åtgärden kan inte ångras. Anmälan tas bort permanent.
              </Dialog>
            </Modal>
          </DialogTrigger>
        </div>
      </section>
      <section aria-labelledby="rubrik-navcard" className="mt-8 max-w-md">
        <h2 id="rubrik-navcard" className="text-xl">
          NavCard
        </h2>
        {/* Anatomin ägs av konsumenten: nav > ul > li > NavCard
            (M6-facitet: 10 px radgap inom grupp = gap-2.5). */}
        <nav aria-label="NavCard-demo" className="mt-4">
          <ul className="flex flex-col gap-2.5">
            <li>
              <NavCard to="/mer/anmalningar" icon={ClipboardList} label="Anmälningar" />
            </li>
            <li>
              <NavCard to="/mer/vantelista" icon={Hourglass} label="Väntelista" />
            </li>
            <li>
              <NavCard to="/mer/intresserade" icon={Star} label="Intresserade" />
            </li>
          </ul>
        </nav>
      </section>
      <section aria-labelledby="rubrik-sidram" className="mt-8 max-w-md">
        <h2 id="rubrik-sidram" className="text-xl">
          SidRam
        </h2>
        {/* TASK-299.1 (ADR-126): husets kant-i-kant sidkrom — chevron +
            VALFRITT rubrikblock. Två instanser visar båda omfattningarna
            (AC #1). Omfattningen är LÅST sedan 2026-08-22 till den SMALARE
            (bara sidkromet, TASK-299.2 / PRD TASK-299 § OMFATTNINGEN LÅST),
            så den bredare rubrik-ägande grenen har noll skarpa konsumenter —
            denna sektion är den ENDA platsen den renderas och axe-provas, och
            det är skälet att den står kvar. Dev-växeln `?sidram=ny` som
            tidigare nämndes här är riven på samtliga fyra ytor (TASK-299.11 +
            299.6, ADR-103 B2 steg 4). Form och familjegräns:
            DESIGN-SYSTEM-SPEC § 23. */}
        <p className="mt-2 text-small text-text-secondary">
          Smalare omfattning (bara chevronen) och bredare (chevron + rubrikblock).
        </p>
        <div className="mt-4 flex flex-col gap-6">
          <div data-testid="sidram-smal">
            <SidRam to="/mer" tillbakaEtikett="Tillbaka till Mer (smal sidram)" />
          </div>
          <div data-testid="sidram-bred">
            <SidRam
              to="/mer"
              tillbakaEtikett="Tillbaka till Mer (bred sidram)"
              rubrik="Exempelrubrik"
            />
          </div>
        </div>
      </section>
      <section aria-labelledby="rubrik-skeleton" className="mt-8 max-w-md">
        <h2 id="rubrik-skeleton" className="text-xl">
          Skeleton
        </h2>
        <p className="mt-2 text-small text-text-secondary">
          Lugnt laddläge (spec §15): statiskt demo-kort i permanent laddläge. Roselli-anatomin ägs
          av konsumenten - aria-busy på innehålls-containern + sr-only-besked; blocken är
          aria-hidden.
        </p>
        <div
          aria-busy="true"
          className="mt-4 flex flex-col gap-4 rounded-2xl border border-transparent bg-bg-muted p-4 contrast-more:border-border-strong print:border-border-strong"
        >
          <span className="sr-only">Laddar demo-innehållet…</span>
          {/* Textrader — 1lh i brödtext-kontext; avtrappade bredder antyder löptext. */}
          <div data-demo="skeleton-text" className="flex flex-col gap-2">
            <Skeleton variant="text" />
            <Skeleton variant="text" className="w-4/5" />
            <Skeleton variant="text" className="w-3/5" />
          </div>
          {/* Talet — ärver talets slutna typografi (Obetalda-kortets 3xl-form). */}
          <p data-demo="skeleton-number" className="font-semibold text-3xl">
            <Skeleton variant="number" />
          </p>
          {/* Listrader — dimensionsreserverad list-yta (anmälningslistans klass). */}
          <div data-demo="skeleton-list" className="flex flex-col gap-2">
            <Skeleton variant="listRow" />
            <Skeleton variant="listRow" />
          </div>
        </div>
      </section>
      <section aria-labelledby="rubrik-togglebuttongroup" className="mt-8 max-w-md">
        <h2 id="rubrik-togglebuttongroup" className="text-xl">
          ToggleButtonGroup
        </h2>
        <p className="mt-2 text-small text-text-secondary">
          Pill-toggeln (S72-facitets form, spec §16): alltid exakt ett val, radiogroup-semantik,
          pilnavigering. Tre belagda former: period (spread), vy-ikoner (inline) och flik-kapslar
          (sm). Hovra en OVALD pill - plattan är ett genomskinligt skrim, så den håller sitt steg
          även på ett track vars ton konsumenten satt själv (fjärde gruppen).
        </p>
        <div className="mt-4 flex flex-col gap-4">
          {/* Period-formen — spread: likbreda segment som fyller bredden. */}
          <ToggleButtonGroup
            label="Period"
            spread
            defaultSelectedKey="upcoming"
            onSelectionChange={(key) => setSenastTryckt(`period: ${key}`)}
          >
            <ToggleButton id="upcoming">Kommande</ToggleButton>
            <ToggleButton id="past">Tidigare</ToggleButton>
          </ToggleButtonGroup>
          {/* Ikon-formen — inline kapsel; namnet bärs av aria-label,
              ikonen är dekorativ (aria-hidden). px per vy-toggelns facit. */}
          <div>
            <ToggleButtonGroup
              label="Visningsläge"
              defaultSelectedKey="lista"
              onSelectionChange={(key) => setSenastTryckt(`vy: ${key}`)}
            >
              <ToggleButton id="lista" aria-label="Listvy" className="px-3.5">
                <List aria-hidden="true" size={18} />
              </ToggleButton>
              <ToggleButton id="kalender" aria-label="Kalendervy" className="px-3.5">
                <CalendarDays aria-hidden="true" size={18} />
              </ToggleButton>
            </ToggleButtonGroup>
          </div>
          {/* Flik-kapsel-formen — sm: eventsidans betalningsflikar/filter. */}
          <div>
            <ToggleButtonGroup
              label="Deltagarfilter"
              defaultSelectedKey="alla"
              onSelectionChange={(key) => setSenastTryckt(`filter: ${key}`)}
            >
              <ToggleButton id="alla" size="sm">
                Alla
              </ToggleButton>
              <ToggleButton id="manuell" size="sm">
                Manuellt tillagda
              </ToggleButton>
              <ToggleButton id="medfoljande" size="sm">
                Medföljande
              </ToggleButton>
            </ToggleButtonGroup>
          </div>
          {/* OMSTÄLLT TRACK (S91) — Betalningar sätter `bg-bg-emphasized` på
              sitt track via className. Ytan finns här för att vakta att
              hover-skrimmet håller sitt steg på ett track vars ton ÄGS AV
              KONSUMENTEN: en opak hover-platta kollapsade in i just den här
              tonen och försvann helt. */}
          <div>
            <ToggleButtonGroup
              label="Omställt track"
              className="bg-bg-emphasized"
              defaultSelectedKey="saknar"
              onSelectionChange={(key) => setSenastTryckt(`omstallt: ${key}`)}
            >
              <ToggleButton id="saknar" size="sm">
                Saknar betalning
              </ToggleButton>
              <ToggleButton id="klara" size="sm">
                Klara
              </ToggleButton>
            </ToggleButtonGroup>
          </div>
          {/* Inaktiverat läge — hela gruppen. */}
          <div>
            <ToggleButtonGroup label="Inaktiverad demo" defaultSelectedKey="av" isDisabled>
              <ToggleButton id="av">Av</ToggleButton>
              <ToggleButton id="pa">På</ToggleButton>
            </ToggleButtonGroup>
          </div>
        </div>
      </section>
      <section aria-labelledby="rubrik-slidetoconfirm" className="mt-8 max-w-md">
        <h2 id="rubrik-slidetoconfirm" className="text-xl">
          SlideToConfirm
        </h2>
        <p className="mt-2 text-small text-text-secondary">
          Dra-till-bekräfta-handtaget (S73-facit-utökningen K77-K84, spec §18): draget är
          bekräftelsen vid tunga handlingar - tangentbordet (Space/Enter) är alltid en likvärdig
          väg. Armerat läge = bock + text utan fyllnad (K82).
        </p>
        <div className="mt-4 flex flex-col gap-4">
          {/* Facit-formen — publicerings-handtaget (monodomänen per K81:s
              adress-grammatik; 0.95em kompenserar monons optiska överstorlek). */}
          <SlideToConfirm
            label="Publicera på miranon.se"
            prompt={
              <>
                Dra för att publicera på <MiranonSe />
              </>
            }
            confirmedLabel={
              <>
                Publiceras på <MiranonSe />
              </>
            }
            onChange={(v) => setSenastTryckt(`slidetoconfirm: ${v ? 'armerad' : 'oarmerad'}`)}
          />
          {/* Armerad från start (uncontrolled defaultSelected) + sound av —
              konsument-preferensens säte (framtida app-bred ljudinställning). */}
          <SlideToConfirm
            label="Tyst demo utan pling"
            prompt="Dra för att armera (tyst)"
            confirmedLabel="Armerad (tyst)"
            defaultSelected
            sound={false}
          />
        </div>
      </section>
      <section aria-labelledby="rubrik-installprompt" className="mt-8 max-w-md">
        <h2 id="rubrik-installprompt" className="text-xl">
          InstallPrompt
        </h2>
        <p className="mt-2 text-small text-text-secondary">
          Bibliotekskomponent + hook (task-126.2): default-läget nedan renderar en knapp ENDAST när
          Chromiums installationshändelse faktiskt fångats (AC 2 - strukturellt omöjlig död knapp).
          Inspektions-läget använder render-prop-formen för att exponera hela plattformstillståndet
          - den väg Mer-flikens install-yta (task-126.3) bygger sin pedagogik ovanpå.
        </p>
        <div className="mt-4 flex flex-col gap-4">
          <div data-testid="installprompt-default">
            <InstallPrompt
              onInstalled={() => setSenastTryckt('installprompt: installerad')}
              onDismissed={() => setSenastTryckt('installprompt: avvisad')}
            />
          </div>
          <div data-testid="installprompt-inspect">
            <InstallPrompt>
              {(state) => (
                <div className="flex flex-col gap-2">
                  <p aria-live="polite" className="text-small">
                    Väg:{' '}
                    <span data-testid="installprompt-path-value" className="font-semibold">
                      {state.path}
                    </span>{' '}
                    ({state.promptAvailable ? 'prompt tillgänglig' : 'ingen prompt tillgänglig'})
                  </p>
                  {/* Render-prop-läget lämnar ALLA renderingsbeslut till
                      konsumenten (se InstallPrompt.tsx-kommentaren) — denna
                      knapp anropar promptToInstall() OVILLKORLIGT, utan att
                      kolla promptAvailable, för att bevisa kontraktets båda
                      försvarslinjer: (a) invariant-kastet när ingen händelse
                      någonsin fångats, och (b) det graciösa 'dismissed'-
                      fallet när en syskoninstans redan konsumerat samma
                      engångshändelse (review-fynd, task-126.2). */}
                  <Button
                    intent="secondary"
                    size="sm"
                    onPress={() => {
                      state
                        .promptToInstall()
                        .then((utfall) => setSenastTryckt(`installprompt: direkt-anrop ${utfall}`))
                        .catch(() => setSenastTryckt('installprompt: direkt-anrop kastade'));
                    }}
                  >
                    Testa promptToInstall() direkt (bibliotekskontraktet)
                  </Button>
                </div>
              )}
            </InstallPrompt>
          </div>
        </div>
      </section>
      <section aria-labelledby="rubrik-forberedelseskarm" className="mt-8">
        <h2 id="rubrik-forberedelseskarm" className="text-xl">
          Forberedelseskarm
        </h2>
        <p className="mt-2 text-small text-text-secondary">
          Förberedelseskärmen (AC 3, task-218.2): helskärmsyta, helt props-driven{' '}
          <code>{'{ klara, totalt }'}</code>. I produktion fyller ytan hela viewporten (anroparen
          sätter höjden, TASK-218.3 gate-integrationen); här begränsas varje instans till en fast
          inramning så alla tre förloppslägen (0 %, delvis, full) syns samtidigt.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <p className="text-caption text-text-muted">0 %</p>
            <div
              data-testid="forberedelseskarm-0"
              className="relative h-72 overflow-hidden rounded-2xl border border-border"
            >
              <Forberedelseskarm klara={0} totalt={5} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-caption text-text-muted">Delvis</p>
            <div
              data-testid="forberedelseskarm-delvis"
              className="relative h-72 overflow-hidden rounded-2xl border border-border"
            >
              <Forberedelseskarm klara={2} totalt={5} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-caption text-text-muted">Full</p>
            <div
              data-testid="forberedelseskarm-full"
              className="relative h-72 overflow-hidden rounded-2xl border border-border"
            >
              <Forberedelseskarm klara={5} totalt={5} />
            </div>
          </div>
        </div>
      </section>
      <section aria-labelledby="rubrik-appfel" className="mt-8 max-w-md">
        <h2 id="rubrik-appfel" className="text-xl">
          AppError: appfel-sidan
        </h2>
        <p className="mt-2 text-small text-text-secondary">
          Sista skyddslagrets fallback (TASK-285.3, <code>AppErrorBoundary</code> i{' '}
          <code>src/main.tsx</code>). Promoverad ur facit{' '}
          <code>tasks/sessions/bilagor/s109-meddelandefamiljen-konvergens/facit.json</code> ytan
          &quot;appfel-sidan&quot;: inline-stilar utan token-import (designvillkoret: sidan ska
          rendera även med ett dött stylesheet).
        </p>
        <div className="mt-4 flex flex-col gap-6">
          <div>
            <p className="mb-2 text-caption text-text-muted">
              Inbäddad (demo-form, ingen <code>role=&quot;alert&quot;</code>). Detta block är{' '}
              <code>appfel-promoverings-grind.spec.ts</code>s EFTER-läge; dess{' '}
              <code>ariaSnapshot</code>-referens är innehållslåst i facit-manifestet.
            </p>
            <div
              data-testid="appfel-fallback"
              className="rounded border border-border border-dashed p-4"
            >
              <AppErrorFallback inbaddad />
            </div>
          </div>
          <div>
            <p className="mb-2 text-caption text-text-muted">
              Skarp form (default-props, exakt vad <code>AppErrorBoundary</code> renderar,{' '}
              <code>role=&quot;alert&quot;</code> behålls)
            </p>
            <div
              data-testid="appfel-fallback-skarp"
              className="rounded border border-border border-dashed p-4"
            >
              <AppErrorFallback />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

/** K81 — domänen i mono (adress-grammatiken); konsument-ägd text, inte primitiv-API. */
function MiranonSe() {
  return <span className="font-mono text-[0.95em] tracking-tight">miranon.se</span>;
}

const LADDLAGE_DEMO_STORLEKAR = ['sm', 'md', 'lg'] as const;

/**
 * TASK-361 r2 — test-krok för `Button`s stabila-mått-kontrakt under
 * `isLoading`, EN referens- + EN target-knapp PER storlek (sm/md/lg —
 * granskningsfynd PR #2212 runda 1, info: r1:s demo/test täckte bara md).
 *
 * REFERENSEN saknar `isLoading`-prop helt — dess mått är FACIT för vad
 * target-knappen (samma etikett, samma storlek) ska hålla i BÅDA lägena.
 * En knapp som aldrig känner till `isLoading` kan strukturellt inte
 * påverkas av grid-stapling eller overlay-tekniken — därför är den
 * oberoende facit, inte bara "en till knapp".
 *
 * `loadingText` på target är MEDVETET LÄNGRE än etiketten ("Spara") —
 * exakt det fall som fällde r1 (permanent bredare ÄVEN I VILA, se
 * `Button`s docblock § isLoading-amenderingen r2). Med r2:s overlay-teknik
 * (etiketten äger måttet ensam, `loadingText` är sr-only och syns aldrig)
 * kan `loadingText`s längd strukturellt inte påverka måttet i något läge.
 *
 * `laddar` styrs ENDAST av knappen "Toggla laddläge" — INTE av
 * target-knapparnas egna `onPress` — så `isLoading` växlar precis som hos
 * en riktig konsument där en `useMutation`s `isPending` styr flera knappar
 * utifrån (`BetalningsInkorg.tsx`s `koa.isPending`/`forhandsgranska.isPending`).
 * `data-testid` per knapp är de STABILA ankarna
 * `button-laddlage-stabil-bredd.test.ts` mäter mot.
 */
function LaddlageStabilBreddDemo() {
  const [laddar, setLaddar] = useState(false);
  return (
    <div className="mt-4 flex flex-col gap-4">
      {LADDLAGE_DEMO_STORLEKAR.map((storlek) => (
        <div key={storlek} className="flex flex-wrap items-center gap-4">
          <Button data-testid={`task-361-referens-${storlek}`} size={storlek}>
            Spara
          </Button>
          <Button
            data-testid={`task-361-target-${storlek}`}
            size={storlek}
            isLoading={laddar}
            loadingText="Bearbetar och skickar bekräftelse till alla mottagare …"
          >
            Spara
          </Button>
        </div>
      ))}
      <Button
        intent="secondary"
        emphasis="outline"
        size="sm"
        data-testid="task-361-toggla"
        onPress={() => setLaddar((v) => !v)}
      >
        Toggla laddläge (test-krok)
      </Button>
    </div>
  );
}
