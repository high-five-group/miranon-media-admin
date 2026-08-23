import { Link } from '@tanstack/react-router';
import { Bell, Check, ChevronDown, Clock, Mail } from 'lucide-react';
import { useState } from 'react';
import { Checkbox } from 'react-aria-components';
import { ToggleButton, ToggleButtonGroup } from '@/components/primitives/ToggleButtonGroup';
import { displayName } from '@/components/registrations/registration-display';
import { StatusBadge } from '@/components/registrations/StatusBadge';
import { Tidslinje, type TidslinjeHandelse } from '@/components/registrations/Tidslinje';
import { BETALNING_LABEL, type Betalning } from '@/data/mutations/registrationPayments';
import type { Event } from '@/domain/models/Event';
import type { Registration } from '@/domain/models/Registration';
import { PaymentStatus, RegistrationStatus } from '@/domain/types/Status';
import { DAGMANAD } from './datumSpann';
import { kategoriPillText } from './hallplats-steg-prototyp';

/**
 * Betalningarnas LÄSYTA-ARBETSYTA (`BetalningsDetaljer`; task-18.8/TASK-145.4;
 * S73-facit K27–K34, formen amenderad av PRD TASK-145 § Implementationsbeslut
 * "Eventsidan är en LÄSYTA"). Monteras fällbar under registret, inuti
 * Anmälda deltagare (`Deltagare.tsx`s `ArbetsKo`, "Öppna detaljer") — inget
 * eget toppnivå-block sedan TASK-145.4.
 *
 * Formen (uppifrån och ned): flikar i familje-kapseln (Saknar betalning /
 * Klara — K30; Stripe-klassens statusfilter) + deadline som STATUS-BADGE →
 * person-korten (`BetalningsPersonRad`): namn + status-/kategoripill,
 * TVÅ läs-kryss-rader (`BetalningsLasRad`, K29 — status + notering, ALDRIG
 * skrivbara: krysset är permanent `isDisabled`) + en riktig utskickslogg
 * (`Tidslinje`, K34). Skrivvertikalen (kryss/notering/mailto-påminn) flyttade
 * till Åtgärds-sidan (TASK-147) — DoD #7 (noll skriv-affordanser på
 * eventsidan) håller mekaniskt: ingen mutation instansieras längre i denna
 * fil (TASK-145.6 rev den sista skrivbara raden, `BetalningsLinje`).
 *
 * A11y (11/10): disclosure med aria-expanded/aria-controls; flikarna är
 * ToggleButtonGroup (radiogroup-semantik); kryssen är RAC Checkbox
 * (permanent disabled, status-semantik); utskickshistoriken är en riktig
 * `<ol>` (Tidslinje).
 */

/** Avgiften klar = Mottagen (null/Ej mottagen = saknas). */
function avgiftKlar(r: Registration): boolean {
  return r.anmalningsavgift === PaymentStatus.MOTTAGEN;
}

/** Slutbetalningen kräver inget mer: Mottagen ELLER Ej relevant (föreläsning). */
function slutKlar(r: Registration): boolean {
  return (
    r.slutbetalning === PaymentStatus.MOTTAGEN || r.slutbetalning === PaymentStatus.EJ_RELEVANT
  );
}

/** Slutbetalning SAKNAS (deltat): varken mottagen eller irrelevant. */
function slutSaknas(r: Registration): boolean {
  return !slutKlar(r);
}

/**
 * Deadline som STATUS-DATA (K30; LÅST REGEL, Marcus 2026-07-21): slutbetalningen
 * förfaller 14 dagar före eventets startdatum — härleds ur startdatum, inget
 * bas-fält (basens formel 'Deadline slutbetalning' bär samma regel). Färgen
 * följer läget: lugnt → neutral · imorgon/idag → warning · passerad → error.
 * Aldrig rå negativ siffra (Gunilla).
 */
export function deadlineStatus(startdatum: string | null): { text: string; cls: string } | null {
  if (!startdatum) return null;
  const start = new Date(startdatum);
  if (Number.isNaN(start.getTime())) return null;
  const deadline = new Date(start);
  deadline.setDate(deadline.getDate() - 14);
  deadline.setHours(0, 0, 0, 0);
  const idag = new Date();
  idag.setHours(0, 0, 0, 0);
  const diff = Math.round((deadline.getTime() - idag.getTime()) / 86_400_000);
  const datum = DAGMANAD.format(deadline);
  if (diff > 1) return { text: `Deadline ${datum} · om ${diff} dagar`, cls: 'text-text-secondary' };
  if (diff === 1) return { text: `Deadline ${datum} · imorgon`, cls: 'font-medium text-warning' };
  if (diff === 0) return { text: 'Deadline idag', cls: 'font-medium text-warning' };
  return { text: `Deadline passerad · ${datum}`, cls: 'font-medium text-error' };
}

/** [PROTOTYPE] [S93] ITERATIONSVÅG 11 — utskicksloggens tidsstämpel: dag,
    månad OCH klockslag. Se `utskickslogg` i BetalningsPersonRad för varför
    klockslaget bär här men inte i registret. */
const LOGGTID = new Intl.DateTimeFormat('sv-SE', {
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
});

/** K27-disclosure: "Öppna/Stäng detaljer" centrerad rad; chevron-down roterar
    (disclosure-branschformen — skild från navigationsradernas höger-chevron).
    EXPORTERAD sedan konvergens-passet (S93 Del 3 beslut 1): återanvänds av
    `Deltagare.tsx`s DEV-gren för den INFLYTTADE arbetsytan (samma K27-form,
    inte en kopia — se `Deltagare.tsx`s `ArbetsKo` för montering).

    HOVER (S93 våg 17, Marcus 2026-08-06: "'Öppna detaljer' har ingen hover,
    fixa det"). Raden var klickbar utan att se klickbar ut — ren tappad
    affordans, inte ett designval.

    Formen speglar appens etablerade rad-hover: `hover:bg-bg-emphasized` +
    `motion-safe:transition-colors`, samma som `AnmalanDetail`s eventlänk (396)
    och `EventsList` 416. Ingen ny form mintas.

    GEOMETRIN ÄR OFÖRÄNDRAD, med avsikt: `py-3` (12 px) på wrappern flyttades
    till `py-1.5` + `py-1.5` på knappen, så 6+6+24+6+6 = 48 px precis som förut
    — familjens radhöjd (DetaljGrupp § morf-pariteten) rörs inte. Vinsten är
    att hover-plattan nu ligger på KNAPPEN och därför kan bära `rounded-lg`;
    hade den suttit på wrappern med `py-3` blivit en kant-till-kant-platta utan
    rundning, vilket är fel form i ett kort med rundade hörn.

    `focus-visible` behövs inte här — den bärs globalt via
    `--mm-color-focus-ring` (samma som alla andra knappar i filen). */
export function DetaljRad({
  oppen,
  kontrollerarId,
  onToggle,
}: {
  oppen: boolean;
  kontrollerarId: string;
  onToggle: () => void;
}) {
  return (
    <div className="py-1.5">
      <button
        type="button"
        aria-expanded={oppen}
        aria-controls={kontrollerarId}
        onClick={onToggle}
        className="flex w-full items-center justify-center gap-2 rounded-lg py-1.5 font-medium text-body hover:bg-bg-emphasized motion-safe:transition-colors"
      >
        {oppen ? 'Stäng detaljer' : 'Öppna detaljer'}
        <ChevronDown
          aria-hidden="true"
          size={18}
          className={`shrink-0 text-text-secondary motion-safe:transition-transform ${oppen ? 'rotate-180' : ''}`}
        />
      </button>
    </div>
  );
}

/** K29-krysset: RAC Checkbox i bibliotekets fält-grammatik (rå-RAC —
    Checkbox-primitiv saknas, prototypens precedent). Obockad etikett i RÖTT
    fetstil ("vilka betalningar folk inte gjort" syns direkt — texten + tomma
    rutan bär, rött förstärker); ibockad = mörk ruta + check, dämpad etikett. */
function BetalKryss({
  text,
  namn,
  vald,
  onChange,
  disabled = false,
  lugn = false,
}: {
  /** Synlig etikett (betalningsordet — facit-formen). */
  text: string;
  /** Personens namn — accessible name blir "<text> för <namn>" (WCAG 2.5.3-säkert). */
  namn: string;
  vald: boolean;
  onChange: (v: boolean) => void;
  /** [PROTOTYPE] [S93] review-fix — `?data=proto`: kontrollen görs read-only
      (native disabled-semantik), ingen mutation avfyras (se BetalningsLinje). */
  disabled?: boolean;
  /** [PROTOTYPE] [S93] ITERATIONSVÅG 10 — etiketten dämpad i stället för röd.
      Se `BetalningsLasRad` för skälet (rött på varje rad upprepar bara flikens
      egen utsaga och tömmer färgen på betydelse). Skarpa vyn rörs inte. */
  lugn?: boolean;
}) {
  return (
    <Checkbox
      isSelected={vald}
      isDisabled={disabled}
      onChange={onChange}
      aria-label={`${text} för ${namn}`}
      className="group flex cursor-pointer items-center gap-2 text-small data-[disabled]:cursor-not-allowed data-[disabled]:opacity-60"
    >
      <span className="flex size-5 shrink-0 items-center justify-center rounded border border-(--mm-input-border) bg-(--mm-input-bg) group-data-[selected]:border-text group-data-[selected]:bg-text">
        <Check
          aria-hidden="true"
          size={14}
          className="text-text-inverse opacity-0 group-data-[selected]:opacity-100"
        />
      </span>
      <span
        className={
          lugn ? 'text-text-muted' : vald ? 'text-text-secondary' : 'font-medium text-error'
        }
      >
        {text}
      </span>
    </Checkbox>
  );
}

/**
 * [TASK-145.4] MOTTAGEN-PILLENS TEXT — VÄG C (Marcus 2026-08-07, PRD TASK-145
 * § Implementation Notes: "vi måste ha in datum, det har alltid proffs …
 * Det gör inget att gamla betalningar inte har datum"). Datum NÄR
 * domänmodellens fält bär värde, annars bara "Mottagen" — ALDRIG ett
 * fabricerat datum (RÅ-disciplinen; samma disciplin `AnmalanDetail.tsx`
 * redan följer för sina egna tidsstämplar).
 *
 * `iso` kommer f.n. ALLTID som `null`: `Registration` bär ännu inget
 * mottagen-datum-fält. TASK-147 äger de två additiva dateTime-fälten i
 * basen, allowlist-utökningen och skrivvägen som stämplar datumet vid
 * avprickning — att lägga fältet i domänmodellen HÄR, för ett bas-fält som
 * inte är beslutat, vore att föregripa beslutet i kod (över-engineering-
 * vakten; samma resonemang som höll `PROTO_MOTTAGEN_DATUM` prototyp-lokal
 * i stället för i `Registration` — den konstanten är riven med denna skiva,
 * se `hallplats-steg-prototyp.ts`). ACCEPTERAD KONSEKVENS (PRD, öppet
 * bokförd): appen bär permanent TVÅ KLASSER i samma lista — nya betalningar
 * visar datum, gamla visar bara "Mottagen". Den konsekvensen gäller redan
 * från dag ett, eftersom ingen betalning ännu KAN bära ett datum.
 *
 * Ren funktion, oexporterad: kontraktet ("datum när det finns, annars bara
 * ordet") är testbart via komponentens rendering redan idag — TASK-147
 * behöver bara byta ut anropsplatsens `null` mot det riktiga fältet när
 * det landar.
 */
function mottagenPillText(iso: string | null): string {
  if (!iso || Number.isNaN(Date.parse(iso))) return 'Mottagen';
  return `Mottagen ${DAGMANAD.format(new Date(iso))}`;
}

/**
 * [TASK-145.4] BETALNINGEN SOM ETIKETT-VÄRDE-RAD, LÄSYTA (våg 10, Marcus
 * 2026-08-06: "designmässigt är det skit … vi får hämta inspiration från
 * detalj-sidan för anmälan"; formen amenderad av PRD TASK-145
 * § Implementationsbeslut, "Eventsidan är en LÄSYTA").
 *
 * Formen är `EtikettVardeRad`:s (DetaljGrupp.tsx): etiketten dämpad till
 * vänster, VÄRDET primärt till höger, 48 px radhöjd (py-3 + 24 px). Krysset
 * bor i etikett-slotten och visar STATUS — det SKRIVER ingenting.
 *
 * K27-ANDEN ÄR RIVEN, öppet bokfört (PRD TASK-145 § Implementationsbeslut):
 * grillad samsyn S93 beslut 1 lät avprickningen stanna kvar interaktiv på
 * denna yta ("Lotta lämnar inte sidan för avprickning"); PRD:n river det
 * medvetet — "en halv redigerbarhet (kryssa ja, skriva nej) är en sämre
 * gräns än ingen alls". BÅDA betalnings-kryssen flyttar till Åtgärds-sidan
 * (TASK-147). Krysset här är därför ALLTID `isDisabled` — ingen
 * `mutationer`/`protoDataMode`-grind behövs längre, eftersom det aldrig
 * finns något att grinda (DoD #7: noll skriv-affordanser).
 *
 * TRE RIVNINGAR mot föregående form (våg 10), var och en med sitt skäl:
 *
 * (a) `<Input>`-fältet är BORTA. Ytan är för ÖVERBLICK — editering görs på
 *     åtgärds-sidan (Marcus 2026-08-06). Nio personer × två fält var arton
 *     tomma rutor som bar noll information och ändå dominerade ytan.
 *     Noteringen finns kvar som LÄSVÄRDE; den är det enda värdet som säger
 *     något Lotta inte redan vet.
 *
 * (b) RÖTT lämnar etiketten. Skälet på `BetalKryss` var att "vilka betalningar
 *     folk inte gjort syns direkt" — men fliken heter redan
 *     "Saknar betalning (9)": ALLA i listan saknar per definition något, så
 *     rött per rad upprepar bara flikens utsaga. Arton röda ord tömde färgen
 *     på betydelse och konkurrerade med `Obekräftad`-badgen, som bär en
 *     genuint avvikande sak. Vilken av de två som saknas bär krysset.
 *
 * (c) Värde-slotten är ALDRIG tom (`AnmalanDetail`-disciplinen "—"/"Ingen
 *     notering"): finns notering ÄR den värdet, annars statusordet dämpat.
 *
 * HÖGER-SLOTTEN ("Saknas"/"Mottagen" utan datum) är RIVEN sedan tidigare
 * (våg 13, Marcus 2026-08-06: "'Saknas' kan vi ta bort också … 'Mottagen'
 * … säger ju bara exakt samma sak som kryssrutan") — krysset bar redan
 * samma information (AC #9). MOTTAGEN-PILLEN nedan är INTE den raden: den
 * renderas alltid när `vald`, med eller utan datum (AC #10), eftersom den
 * bär vad krysset omöjligt kan bära — antingen datumet, eller det faktum
 * att basen ännu inte känner det.
 */
function BetalningsLasRad({
  registration,
  betalning,
  vald,
  notering,
}: {
  registration: Registration;
  betalning: Betalning;
  vald: boolean;
  notering: string | null;
}) {
  const namn = displayName(registration);
  const label = BETALNING_LABEL[betalning];
  const egenNotering = notering?.trim();

  return (
    <div className="py-3">
      <div className="flex items-center justify-between gap-4">
        <BetalKryss text={label} namn={namn} vald={vald} lugn disabled onChange={() => {}} />
        {vald && (
          // Pill-skalans `sm` (våg 16) — var px-2.5 py-1, alltså `md`-steget,
          // vilket gjorde den bredare än kategori-pillen på samma kort.
          // Fyllningen är `bg-bg-muted` och det är RÄTT här: denna pill står
          // INUTI kortet (bg-surface), inte på namnraden — muted mot vitt är
          // samma 1.09 som vitt mot muted, bara omvänt håll.
          <span className="shrink-0 rounded-full border border-transparent bg-bg-muted px-2 py-0.5 font-medium text-caption text-text-secondary contrast-more:border-border-strong">
            {mottagenPillText(null)}
          </span>
        )}
      </div>
      {/* NOTERINGEN PÅ EGEN RAD, FULL BREDD (Marcus 2026-08-06: "kommer det ju
          inte få plats några noteringar eller? Vart ska dem skrivas ut?").
          Föregående våg lade noteringen i höger-slotten, och den var för smal
          för hur Lotta faktiskt skriver — fixturens Sara Nilsson bär numera ett
          långt fall just för att bevisa radbrytningen här i stället för i prod.

          `pl-7` = kryssets 20 px + gap-2:s 8 px, så noteringen linjerar exakt
          under betalningsordet, inte under krysset. Dämpad (`text-small`,
          `text-text-secondary`): den kvalificerar raden ovanför, den tävlar
          inte med den.

          LUFTEN (våg 12, Marcus 2026-08-06: "det blir för mycket text som
          nästan står på varandra runt noteringstexten"). Tre mått, inte ett —
          det klistrade åt tre håll samtidigt och en enda justering hade bara
          flyttat trängseln:

          (i)   `pt-4` mot etikettraden ovanför — PADDING, inte margin, och det
                är hela poängen.

                Våg 12 satte `mt-3` och våg 14 först `mt-4`. BÅDA VAR
                VERKNINGSLÖSA: en global oskiktad `p { margin: 0px }` i
                stilmallen slår Tailwinds `.mt-*`, eftersom utilities ligger i
                `@layer utilities` och CSS-kaskaden ger OSKIKTADE regler högre
                prioritet än skiktade. DOM-mätt `marginTop: "0px"` med
                `class="mt-4 …"` på elementet.

                Det förklarar varför Marcus fortsatte se att noteringen
                klistrade uppåt efter våg 12: den vågens synliga förbättring
                kom helt från `leading-relaxed` och `pb-1`, aldrig från
                marginalen. Padding rörs inte av reset:en och verkar direkt.

                Måttet: luften NEDÅT är `pb-1` (4 px) + radens `py-3` (12 px) =
                16 px, så `pt-4` = 16 px gör paret symmetriskt — Marcus krav
                ordagrant ("lika mycket luft däremellan som det är mellan
                noteringstexten och avdelaren under").

                LÄXAN ÄR GENERELL: på denna kodbas är `mt-*`/`mb-*` på `<p>`
                tysta no-ops. Använd padding, eller `gap` på föräldern. Att
                `my-0`/`mb-0` står utskrivet på flera `<p>` i filen är därför
                också dekoration — reset:en hade redan nollat dem.
          (ii)  `leading-relaxed` INUTI noteringen — samma val som
                AnmalanDetail gör för sin fritext. En flerradig notering med
                tät radsättning är den enda texten på kortet som måste läsas
                som prosa, inte skannas som data.
          (iii) `pb-1` under: `py-3` räknade från styckets sista rad, vilket
                gav mindre luft ner till avdelaren än upp till statusraden.
                Asymmetrin syntes som att noteringen hängde i nederkanten. */}
      {egenNotering && (
        <p className="pt-4 pb-1 pl-7 text-small text-text-secondary leading-relaxed">
          {egenNotering}
        </p>
      )}
    </div>
  );
}

/**
 * [RIVEN, TASK-145.6] EN LINJE PER BETALNING (`BetalningsLinje`, K31) — den
 * SKRIVBARA kryss+notering+Påminn-raden ur hållplats-prototypens variant-
 * läge. `BetalningsPersonRad` (nedan) blev strukturellt onåbar för denna
 * gren när `protoAktiv` gjordes ovillkorligt (ADR-103 B2 steg 4): den
 * PROMOVERADE läsyte-formen (`BetalningsLasRad`) är sidans enda form.
 * Skrivvertikalen (kryss/notering/mailto-påminn) flyttade redan till
 * Åtgärds-sidan (TASK-147, PRD TASK-145 § Implementationsbeslut) — denna
 * rad var sedan dess bara den prototyp-lokala vägen dit, aldrig nådd i
 * skarpa vyn. `registrationPayments`-mutationerna (`useSetPaymentStatus`/
 * `useUpdatePaymentNote`/`useLogPaymentReminder`) och `ArbetsytansMutationer`
 * hade ingen annan konsument och är rivna med samma commit — DoD #7 (noll
 * skriv-affordanser i den renderade eventsidan) mekaniskt sant, inte bara
 * dolt bakom ett villkor. Git bevarar koden (denna fils blame).
 */

/**
 * Person-raden i arbetsytan (K29, promoverad TASK-145.6/ADR-103 B2 steg 4):
 * namnet länkar till person-detaljvyn när anmälan bär person-länken (annars
 * stilla text — länk utan mål ljuger); LÄSYTE-formen (`BetalningsLasRad` ×2)
 * + kategori-/bekräftelsepill på namnraden + en riktig utskickslogg
 * (Tidslinje, K34). Slutbetalning 'Ej relevant (för föreläsningar)' renderas
 * som stilla textrad UTAN kryss — ett kryss vore en lögn (av-bock hade
 * skrivit 'Ej mottagen' och rivit basens semantik); öppet bokfört skiv-beslut
 * (facit-demon saknade fallet).
 */
function BetalningsPersonRad({ registration }: { registration: Registration }) {
  const namn = displayName(registration);
  const kategoriPill = kategoriPillText(registration);
  const arObekraftad = registration.status === RegistrationStatus.OBEKRAFTAD;

  // UTSKICKEN ÄR EN RIKTIG LOGG (ITERATIONSVÅG 11, Marcus 2026-08-06:
  // "'skickat' som vi har längst ner på varje kort måste bli och se ut mer
  // som en utskickslogg").
  //
  // Formen är `Tidslinje` (registrations/Tidslinje.tsx) — samma komponent som
  // bär Händelser på anmälnings-sidan, alltså samma yta Marcus pekade ut som
  // förebild. Den är dokumenterad som "aktivitetslogg i branschledar-formen
  // (Shopify/Stripe activity)": genomgående linje, ikon-noder i cirklar,
  // texten bär och tiden mutad under. Ingen ny form mintas — och Tidslinje är
  // [BIBLIOTEKS-KANDIDAT] med promovering "vid andra konsumenten", precis som
  // StatusBadge; detta är den andra konsumenten även för den.
  //
  // ORDNINGEN ÄR OFÖRÄNDRAD: bekräftelse → påminnelser → eventinfo (K42,
  // Lottas utskicksordning). Tidslinje sorterar aldrig själv — callern äger
  // ordningen — så bytet av form ändrar inte vad Lotta ser i vilken följd.
  //
  // Tidsformatet bär KLOCKSLAG här men inte i registret: en logg som säger
  // "Påminnelse 24 juli" två rader under "Bekräftelse 24 juli" gör dem
  // oskiljbara, och ordningsföljden blir det enda som skiljer — vilket är
  // precis vad en logg ska belägga, inte förutsätta.
  const utskickslogg: TidslinjeHandelse[] = [
    { nar: registration.bekraftelseSkickad ?? null, text: 'Bekräftelse skickad', ikon: Mail },
    {
      nar: registration.paminnelseAnmalningsavgiftSkickad ?? null,
      text: 'Påminnelse om anmälningsavgift',
      ikon: Bell,
    },
    {
      nar: registration.paminnelseSlutbetalningSkickad ?? null,
      text: 'Påminnelse om slutbetalning',
      ikon: Bell,
    },
    { nar: registration.deltagarinfoSkickad ?? null, text: 'Deltagarinfo skickad', ikon: Mail },
  ].flatMap((p) =>
    p.nar != null && !Number.isNaN(Date.parse(p.nar))
      ? [
          {
            id: `${p.text}-${p.nar}`,
            text: p.text,
            tid: LOGGTID.format(new Date(p.nar)),
            ikon: p.ikon,
          },
        ]
      : [],
  );

  // [PROTOTYPE] [S93] ITERATIONSVÅG 10 — PERSONEN FÅR EN KROPP.
  //
  // Marcus 2026-08-06: "varje personblock har väl innehållet som det behöver
  // ha, men designmässigt är det skit … detalj-sidan för anmälan är SNYGG.
  // Vi får hämta inspiration därifrån."
  //
  // Föregående form var `<li>` i en `divide-y`-lista: personen hade ingen
  // kortyta alls, bara hårstreck emellan — och det ENDA som bar en
  // inneslutning var utskicks-lådan, alltså ytans minst viktiga innehåll.
  //
  // Formen här är `DetaljGrupp`s (DetaljGrupp.tsx:26-32), den som gör
  // anmälnings-sidan läsbar: RUBRIKEN UTANFÖR (namn + status, `px-4` in till
  // "där rundningen slutar"), KORTET under (`rounded-2xl bg-bg-muted px-4`)
  // med `divide-y` mellan raderna. Ingen ny form mintas — grammatiken finns
  // redan och är e2e-bevisad på anmälnings-sidan.
  //
  // Hierarkin får fyra nivåer i stället för två: namnet `text-lg
  // font-semibold` → etiketten `text-small text-text-muted` → värdet
  // `text-body`. Förut var namn och fältetikett nästan lika tunga.
  return (
    <li className="flex min-w-0 flex-col gap-2">
      {/* Namnraden står UTANFÖR kortet — DetaljGrupp:s h2-position. Den är
          medvetet INGEN rubrikelement: fjorton syskon-rubriker under en enda
          `<h2>` vore en semantisk lögn (samma skäl som rev sr-only-rubriken
          i CI-fångsten nedan), och listan är redan en `<ul>` med poster. */}
      <div className="flex items-center justify-between gap-3 px-4">
        {registration.personId ? (
          <Link
            to="/personer/$personId"
            params={{ personId: registration.personId }}
            className="min-w-0 font-semibold text-lg underline-offset-2 hover:underline"
          >
            {namn}
          </Link>
        ) : (
          <span className="min-w-0 font-semibold text-lg">{namn}</span>
        )}
        {/* `StatusBadge` ersätter den handrullade pillen: samma tillstånd
            hade förut TVÅ former i appen — `bg-error-bg`/`text-error` här
            mot `<StatusBadge ton="warning">` på anmälnings-sidan
            (AnmalanDetail.tsx:341). Ett ord, en färg, hela appen.
            StatusBadge är märkt [BIBLIOTEKS-KANDIDAT] med promovering till
            `primitives/` "vid andra konsumenten" — detta ÄR den andra. */}
        {(arObekraftad || kategoriPill) && (
          <span className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
            {arObekraftad && (
              <StatusBadge ton="warning" storlek="sm">
                Obekräftad
              </StatusBadge>
            )}
            {/* KATEGORI-PILLEN FÅR KONTUR (våg 15, Marcus 2026-08-06: "vi
                  måste lösa pill-färgen på de som är gråa för de syns ju inte
                  alls just nu").

                  Han hade rätt, och mätningen gjorde det värre än "syns dåligt":
                  pillen bar `bg-bg-muted` OCH stod på namnraden, som ligger
                  UTANFÖR kortet på arbetsytans egen `bg-bg-muted`-botten. Båda
                  mättes till rgb(245,245,243) — KONTRAST 1.00, alltså
                  matematiskt osynlig. Bara texten syntes; kapseln fanns inte.
                  Exakt samma fel som personkortet hade i våg 10, samma orsak.

                  KONTUREN ÄR RIVEN IGEN (våg 16, Marcus: "Jag vill inte ha
                  kontur på pillen. Då får vi hitta en annan färg vi kan
                  använda."). Kvar står `bg-surface` — VIT fyllning på muted
                  botten, 1.09.

                  Talet är lågt, men det är fel mått för en 26 px hög YTA, och
                  formen är dessutom appens ETABLERADE neutrala pill mot muted
                  underlag: EventCard:191, NastaEventCard:131 och
                  AnmalanDetail:475 (dagar-kvar) kör alla exakt `bg-surface`
                  som pill-fyllning, och ingen av dem har någonsin rapporterats
                  osynlig. Det som var trasigt var 1.00 — noll kontrast, muted
                  på muted — inte 1.09.

                  `contrast-more` behåller en kant för dem som BEGÄRT högre
                  kontrast; det är inte samma sak som att alltid rita den. */}
            {kategoriPill && (
              <span className="rounded-full border border-transparent bg-surface px-2 py-0.5 font-medium text-caption text-text-secondary contrast-more:border-border-strong">
                {kategoriPill}
              </span>
            )}
          </span>
        )}
      </div>
      {/* `bg-surface`, INTE `bg-bg-muted` som DetaljGrupp använder: arbetsytan
            är monterad INUTI en DetaljGrupp (Deltagare.tsx:s ArbetsKo), så
            underlaget är redan muted — ett muted kort på muted botten är
            osynligt (mätt i browsern 2026-08-06: första formen försvann helt).
            Samma val som AnmalanDetail:s noterings-ruta gör inuti sin grupp. */}
      <div className="divide-y divide-border rounded-2xl border border-transparent bg-surface px-4 contrast-more:border-border-strong">
        <BetalningsLasRad
          registration={registration}
          betalning="avgift"
          vald={avgiftKlar(registration)}
          notering={registration.noteringAnmalningsavgift ?? null}
        />
        {registration.slutbetalning === PaymentStatus.EJ_RELEVANT ? (
          // Ej relevant får radens form men ALDRIG ett kryss — en av-bock
          // hade skrivit 'Ej mottagen' och rivit basens semantik (befintligt
          // öppet skiv-beslut, oförändrat).
          //
          // Våg 13: raden följer med när höger-slotten rivs. Den var det
          // enda som stod kvar högerställt när alla andra rader blev
          // vänsterställda, och en ensam höger-kolumn läser som att något
          // fattas i de andra. `pl-7` = kryssets 20 px + gap-2:s 8 px, så
          // ordet "Slutbetalning" står på exakt samma vänsterlinje som
          // grannradernas etiketter trots att kryssrutan saknas.
          <p className="my-0 py-3 pl-7 text-small text-text-muted">
            Slutbetalning · Ej relevant (föreläsning)
          </p>
        ) : (
          <BetalningsLasRad
            registration={registration}
            betalning="slut"
            vald={registration.slutbetalning === PaymentStatus.MOTTAGEN}
            notering={registration.noteringSlutbetalning ?? null}
          />
        )}
        {/* UTSKICKSLOGGEN (våg 11). Vägen hit i två steg, båda värda att
              minnas: punkt 7 sa att historiken "hängde i luften" och fick en
              `md:w-60`-LÅDA bredvid personen; våg 10 rev lådan och gjorde den
              till en etikett-värde-rad i kortet. Raden löste svävandet men
              gjorde historiken till ett VÄRDE — och en logg är ingen
              värde-slot: fyra utskick högerställda i en `dd` blir en klump
              utan tidsaxel, vilket är exakt vad Marcus såg när han sa att den
              "måste bli och se ut mer som en utskickslogg".

              RUBRIKEN ÄR RIVEN (våg 12, Marcus 2026-08-06: "'Utskick' kan vi
              ta bort, det sabbar designen och jag tror man fattar ändå. Men
              behåll … tom yta liksom så vi behåller luft där").

              Han har rätt i att den var överflödig: varje nod säger redan
              "Bekräftelse skickad" / "Påminnelse om slutbetalning", så ordet
              Utskick upprepade bara vad de fyra raderna under den redan sa —
              och det gjorde det med en fjärde textvikt (`font-medium
              text-caption`) i ett kort som redan bar tre.

              LUFTEN ÄR KVAR, exakt som beställt: `pt-8` ersätter rubrikens
              forna höjd (`pt-3` + ~18 px radhöjd ≈ 30 px, mot 32 px nu), så
              avståndet från avdelaren ner till första noden är oförändrat.
              Tomrummet är alltså inte en glömd rubrik — det är rubrikens
              plats, medvetet lämnad tom.

              A11y: INGEN ersättnings-etikett alls, och det är ett medvetet
              val efter två avvisade försök. En sr-only-rubrik är utesluten —
              den som stod på denna yta rev två CI-grindar samtidigt (axe
              `heading-order` + Playwrights strict mode, se kommentaren längre
              upp i filen). Ett `role="group"` + `aria-label` avvisades av
              `lint/a11y/useSemanticElements`, som kräver `<fieldset>` — och
              fieldset kräver `<legend>`, alltså en synlig rubrik igen: exakt
              det Marcus rev.

              Men etiketten behövs faktiskt inte. `Tidslinje` renderar en
              `<ol>` där varje nod läses "Bekräftelse skickad, 20 juni kl.
              11:00" — orden bär sitt eget sammanhang, och listan sitter redan
              inuti personens `<li>`. Marcus "man fattar ändå" gäller
              skärmläsaren lika mycket som ögat. Att lägga på en etikett här
              hade varit samma garderings-reflex som gav sr-only-rubriken. */}
        {utskickslogg.length > 0 ? (
          <div className="flex flex-col pt-8">
            <Tidslinje handelser={utskickslogg} />
          </div>
        ) : (
          // Tom logg: frånvaron måste sägas rakt ut (annars läses tomrummet
          // som ett renderingsfel) — men UTAN etikett, samma rivning som
          // ovan. Etikett-värde-formen som stod här gav ett högerställt
          // "Inget skickat ännu" mot ett vänsterställt "Utskick", alltså
          // exakt de två ord Marcus rev.
          //
          // `pt-8` = samma luft som logg-grenen. `pl-11` = Tidslinjes
          // ikon-cirkel (32 px) + dess `gap-3` (12 px), så texten står
          // precis där en nodtext hade stått — de två grenarna läser som
          // samma yta i två tillstånd, inte som två olika layouter.
          // Texten säger vad rutan ÄR, inte bara att den är tom (Marcus våg
          // 14). "Inget skickat ännu" ensamt förutsatte att läsaren redan
          // visste vad ytan under betalningarna var till för — och rubriken
          // som hade sagt det revs i våg 12. Meningen bär nu båda: vad som
          // kommer stå här, och att inget gör det ännu.
          <div className="pt-8 pb-3">
            <p className="my-0 pl-11 text-small text-text-muted">
              Utskickslogg visas här - inget skickat ännu till denna person
            </p>
          </div>
        )}
      </div>
    </li>
  );
}

/**
 * Arbetsytan (K29–K30): flikar i familje-kapseln (Saknar betalning / Klara —
 * räknarna följer kryssen live) + deadline-STATUS-BADGEN (listkortens
 * status-slot-form: bg-surface-pill + statusfärgad text) + person-listan.
 * Kryssen flyttar personen mellan flikarna direkt (optimistisk cache).
 *
 * EXPORTERAD sedan konvergens-passet (S93 Del 3 beslut 1): Betalningar som
 * TOPPNIVÅ-block försvinner i variant-läge — denna arbetsyta (oförändrad;
 * "Återanvänd befintliga komponenter — flytta montering, skriv inte om")
 * monteras i stället inuti Anmälda deltagare (`Deltagare.tsx`s `ArbetsKo`),
 * fällbar under registret, bakom samma `DetaljRad`. Deadline-badgen ovan
 * följer därmed automatiskt med — den renderas HÄR, oberoende av vem som
 * monterar komponenten.
 */
export function BetalningsDetaljer({
  event,
  registreringar,
}: {
  event: Event;
  registreringar: Registration[];
}) {
  const [flik, setFlik] = useState<'saknar' | 'klara'>('saknar');
  const deadline = deadlineStatus(event.startdatum);
  const saknar = registreringar.filter((r) => !avgiftKlar(r) || slutSaknas(r));
  const klara = registreringar.filter((r) => avgiftKlar(r) && slutKlar(r));
  const lista = flik === 'saknar' ? saknar : klara;

  return (
    <div className="flex flex-col gap-3 py-3">
      <ToggleButtonGroup
        label="Visa betalningar"
        spread
        className="bg-bg-emphasized"
        selectedKey={flik}
        onSelectionChange={(key) => setFlik(key as 'saknar' | 'klara')}
      >
        <ToggleButton id="saknar" size="sm">
          {`Saknar betalning (${saknar.length})`}
        </ToggleButton>
        <ToggleButton id="klara" size="sm">
          {`Klara (${klara.length})`}
        </ToggleButton>
      </ToggleButtonGroup>
      {deadline && (
        <p
          data-testid="betalning-deadline"
          className={`inline-flex items-center gap-1.5 self-start rounded-full bg-surface px-2.5 py-1 text-small ${deadline.cls}`}
        >
          <Clock aria-hidden="true" size={14} />
          {deadline.text}
        </p>
      )}
      {lista.length > 0 ? (
        // Korten separeras av LUFT, inte av hårstreck: när varje person bär
        // en egen kortyta blir en avdelare emellan en andra gräns runt samma
        // sak (DetaljGrupp-formen på anmälnings-sidan har samma gap-4 mellan
        // grupperna).
        <ul className="flex flex-col gap-4">
          {lista.map((r) => (
            <BetalningsPersonRad key={r.id} registration={r} />
          ))}
        </ul>
      ) : (
        <p className="py-2 text-small text-text-secondary">
          {flik === 'saknar'
            ? 'Alla anmälda har betalat.'
            : 'Ingen är klar med båda betalningarna ännu.'}
        </p>
      )}
    </div>
  );
}

/**
 * [RIVEN, TASK-145.6, AC #5] `BetalningsInnehall` och `Betalningar` (den
 * exporterade eventsidans TOPPNIVÅ-block) bodde här. Redan sedan TASK-145.4
 * (2026-08-07) var `Betalningar` overkallad — "Betalnings-toppblocket
 * försvinner" flyttade dess arbetsyta (`BetalningsDetaljer`) in i Anmälda
 * deltagare (`Deltagare.tsx`s `ArbetsKo`, "Öppna detaljer"), och ingen fil i
 * repot importerade `Betalningar`/`BetalningsInnehall` längre (verifierat med
 * grep). Deras enda LEVANDE kod var hållplats-prototypens egen
 * `protoAktiv`-läsning (`isHallplatsVariant(variantParam)`) — en av
 * `TASK-145.6`:s AC #1-grenar. Strukturellt onåbar dubbelt över: rivningen
 * löser både den overkallade koden (AC #5) och variant-läsningen (AC #1) i
 * samma commit i stället för att lämna en död funktion som råkar innehålla
 * den. Git bevarar båda (denna fils blame, senast före denna commit).
 */
