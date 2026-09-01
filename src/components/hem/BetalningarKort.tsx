import { Link } from '@tanstack/react-router';
import { Banknote, CircleCheck, Clock, Mail } from 'lucide-react';
import { useMemo } from 'react';
import { visaKronor } from '@/components/betalningar/belopp-inmatning';
import { idagIso } from '@/components/betalningar/idag';
import {
  harledRad,
  type InkorgsRad,
  jobbDelutfall,
  rankaTraffar,
  sammanfattaBetalningar,
} from '@/components/betalningar/inkorg-harledningar';
import { InitialAvatar, MessageBox, Skeleton } from '@/components/primitives';
import {
  HANDLINGSRAD_KLASS,
  HANDLINGSRAD_OMSLAG_KLASS,
  HandlingsRadInnehall,
  HandlingsRadKort,
} from '@/components/primitives/HandlingsRad';
import { useOppnaBetalningar } from '@/data/betalningar/useBetalningar';
import { useJobbstatus } from '@/data/betalningar/useJobbstatus';
import { BulkAtgardsknapp } from './BulkAtgardsknapp';

/**
 * [TASK-346.7 AC #1] Hem-sektionen **Betalningar** - Morgonkollens fjärde
 * block när miljöflaggan är på.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * DET ERSÄTTER "FÖRFALLNA BETALNINGAR", DET LIGGER INTE OVANPÅ
 * ═══════════════════════════════════════════════════════════════════════════
 * PRD § Inkorgen och formuläret, ordagrant: "Hem-kortet Betalningar ersätter
 * dagens kort 'Förfallna betalningar' (inte ovanpå det) och visar *N öppna ·
 * M förfallna · K kvitton att skicka* med Registrera betalning och Skicka
 * påminnelse till alla."
 *
 * `Hem.tsx` väljer mellan de två på miljöflaggan: med flaggan AV renderas
 * det gamla kortet OFÖRÄNDRAT (prod-beteendet, tills Marcus slår på
 * flaggan), med flaggan PÅ detta.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * FORMEN (Marcus dom 2026-09-01) — EN RIKTIG SEKTION, INTE ETT MINI-KORT
 * ═══════════════════════════════════════════════════════════════════════════
 * TASK-346.14 gav blocket `NastaEvent`s HEROFORM i miniatyr: overline-etikett
 * ("BETALNINGAR", `text-caption`) + ett displaytal ("5 öppna", `text-3xl`)
 * inuti ett eget grått kortskal. Marcus dom på den formen, ordagrant:
 *
 *   "Det passar verkligen INTE in i designen på hem-vyn. […] Rubriken på
 *   blocket borde vara 'Betalningar', inte '5 öppna'." · "Jag behöver veta
 *   vad 'öppna' betyder också." · "Knappen 'Skicka påminnelse till alla' […]
 *   ser ut att 'försöka vara likadan' som knappen 'Bekräfta alla' precis
 *   över, men det är den inte på något sätt." · "Blocket är så litet så jag
 *   scrollade ju nästan förbi det utan att märka det. Det var mycket bättre
 *   innan."
 *
 * Fyra fynd, en grundorsak: 346.14 kopierade FEL GRANNE. Hero-formen
 * (overline → displaytal → cream kortyta) tillhör Morgonkollens ENDA
 * hero-block, "Nästa event". Betalningar är ett SEKTIONSBLOCK, och husets
 * sektionsgrammatik är `NyaAnmalningar`/`Genvagar`s: en `font-semibold
 * text-2xl`-h2 direkt på sidans yta, personrader under, bulk-knappen sist i
 * sektionsspalten. Den grammatiken kopieras nu i stället, punkt för punkt:
 *
 *   1) `<h2 className="font-semibold text-2xl">Betalningar</h2>` — samma
 *      vikt som "Genvägar" och "N nya anmälningar att bekräfta". Overlinen
 *      och det omslutande kortskalet är BORTA: ett block som bara är en grå
 *      platta i en spalt av sektioner läses som en fotnot, inte som ett av
 *      Morgonkollens fyra block.
 *   2) KLARTEXT I STÄLLET FÖR JARGONG. "5 öppna" sade inte vad som är öppet.
 *      Nyckeltalsraden säger nu ut det: "5 anmälningar väntar på betalning",
 *      och förfallo-talet berättar sitt eget släktskap med huvudtalet
 *      ("varav 2 har passerat sista betalningsdagen") i stället för att stå
 *      som ett tredje löst tal. Ordet "förfallen" är kvar DÄR DET BÄR VIKT
 *      (radmärket, husets egen badge) — men skärmen definierar det nu själv.
 *   3) SEKTIONEN HAR KROPP. Det gamla kortet visade VEM som inte betalat;
 *      346.14:s kort visade tre tal. Personraderna är tillbaka, i
 *      `NyaAnmalningar`s exakta radgrammatik (avatar → namn → sekundärrad →
 *      efterställd markör), kapade vid `MAX_RADER` med en "Visa alla"-väg
 *      till inkorgen. Ordningen är inkorgens EGEN rankning (`rankaTraffar`),
 *      inte en ny sorteringsregel: förfallna först.
 *   4) BULK-KNAPPEN LIGGER I SEKTIONSSPALTEN, inte indragen i ett kort.
 *      Det var hela Marcus fynd 3: samma `BulkAtgardsknapp` i samma
 *      `<div className="pt-1">`-omslag som `NyaAnmalningar`s "Bekräfta alla"
 *      ger IDENTISK bredd och identiskt läge — 346.14:s kort-`px-4` gjorde
 *      den 34 px smalare och lade den på grå botten, vilket lästes som en
 *      annan, lägre knappklass.
 *   5) "Registrera betalning" är kvar som `HandlingsRad` (346.14:s fynd 1b
 *      håller: den NAVIGERAR, den handlar inte), men bor nu i sitt eget
 *      `HandlingsRadKort` — precis som `Genvagar` — eftersom sektionen inte
 *      längre har ett kortskal som kan bära raden åt den.
 *
 * Ikonerna är LÅNADE, inte uppfunna: `Clock` är samma ikon
 * `BetalningsInkorg.tsx`/`PanelBetalningar.tsx` använder för "Förfallen",
 * `Mail` är utskicksloggens ikon för kvitton, och `Banknote` är
 * Mer-navigeringens egen ikon för `/mer/betalningar` — samma destination,
 * samma ikon. Radens förfallo-badge är kopierad ur `BetalningsInkorg.tsx`
 * (`inline-flex … rounded border-transparent px-2 py-0.5 text-caption` +
 * `Clock` size 13) med EN avvikelse: bottnen är `bg-bg-muted` i stället för
 * `bg-bg`, eftersom raden här sitter direkt på sidans vita yta där `bg-bg`
 * är osynlig.
 *
 * DEN HÄR FILEN MOTSÄGER DÄRMED `AMENDERING-2026-08-31-betalningskortets-
 * formsprak-346-14.md` punkt 1 (kortyta) och 4 (overline) — öppet, på
 * Marcus dom, inte i tysthet. Punkt 2 (en primär CTA) och 3
 * (nyckeltalshierarki) lever vidare i ny form.
 */

/**
 * Hur många personrader sektionen bär innan den hänvisar vidare. Morgonkollen
 * ska kunna skummas i ett svep - en lista som växer obegränsat gör blocket
 * till en egen sida. Resten nås via "Visa alla", inte via scroll.
 */
const MAX_RADER = 5;

export function BetalningarKort({
  onSkickaPaminnelseAlla,
  harPaminnelser,
}: {
  /** Öppnar påminnelsesvepets sändyta - `Hem.tsx`s `aktivtSvep`. */
  onSkickaPaminnelseAlla: () => void;
  /**
   * Finns det någon rad i "Att påminna"-läget? Räknas av `Hem.tsx` ur
   * SAMMA `paminnelseRaderList` som svepets urval, så knappen aldrig kan
   * öppna en sändyta utan mottagare (den invarianten är mekaniskt bevisad i
   * `svep-paminnelse-send.acceptance.test.ts` och får inte tappas här).
   */
  harPaminnelser: boolean;
}) {
  const { data, isPending, isError, error } = useOppnaBetalningar();
  const idag = useMemo(idagIso, []);

  const rader = useMemo(
    () => (data?.betalningar ?? []).map((b) => harledRad(b, idag)),
    [data, idag],
  );
  const sammanfattning = useMemo(() => sammanfattaBetalningar(rader), [rader]);

  /* ORDNINGEN ÄR INKORGENS EGEN, INTE EN NY REGEL. `rankaTraffar` med tom
     sökterm är inkorgens viloläges-rankning (klara sist, förfallna först,
     kommande event närmast först, därefter namn) - redan testad, redan den
     ordning Lotta ser när hon klickar vidare. Filtreringen på `!klar` gör
     listan till exakt de rader `sammanfattning.oppna` räknar, så talet och
     listan aldrig kan säga olika saker. */
  const oppnaRader = useMemo(
    () => rankaTraffar(rader, '', idag).filter((rad) => !rad.klar),
    [rader, idag],
  );
  const visadeRader = oppnaRader.slice(0, MAX_RADER);

  /* JOBBET: `JobbLyssnare` håller redan `jobbstatus(null)` färsk för hela
     appen, så detta anrop läser samma cache-nyckel och kostar inget extra.
     PRD berättelse 11 vill att Hem säger "8 kvitton skickade" utan att Lotta
     gått till inkorgen. */
  const jobb = useJobbstatus();
  const senaste = jobbDelutfall(jobb.data);

  /* ETT FÄRDIGT JOBB FRÅN I GÅR ÄR INTE DAGENS NYHET. Samma mätta fälla som
     `BetalningsInkorg.tsx` bokför: banderollen visade "1 kvitto skickade"
     innan Lotta gjort något, därför att det SENASTE jobbet var TASK-346.4:s
     provkörning dagen innan. Hem har ingen egen session-koppling till ett
     jobb, så villkoret är det strängare av inkorgens två: visa bara ett jobb
     som fortfarande ARBETAR. Ett avslutat jobb tystas. */
  const utfall = senaste && senaste.kvar > 0 ? senaste : null;
  const tomt = sammanfattning.oppna === 0 && sammanfattning.kvittonAttSkicka === 0;

  return (
    <section aria-labelledby="hem-betalningar" className="flex min-w-0 flex-col gap-4">
      <h2 id="hem-betalningar" className="font-semibold text-2xl">
        Betalningar
      </h2>

      {isError ? (
        <MessageBox intent="error" title="Kunde inte hämta betalningar">
          {error instanceof Error ? error.message : 'Inget felmeddelande angavs.'}
        </MessageBox>
      ) : isPending ? (
        /* LADDLÄGET FÖLJER HEMMETS EGEN ANATOMI (Roselli-mönstret,
           `hem-laddlage.acceptance.test.ts` AC 2/AC 4): `role="status"` +
           `aria-busy`, EXAKT ETT `.sr-only`-besked som börjar med "Laddar",
           och skelettblock som är `aria-hidden`. Blocken speglar nu
           sektionens faktiska kropp (nyckeltalsrad + radlista), samma
           uppsättning `NyaAnmalningar` bär. */
        <div role="status" aria-busy="true" className="flex flex-col gap-3">
          <span className="sr-only">Laddar betalningar…</span>
          <Skeleton variant="text" className="w-1/2" aria-hidden />
          <Skeleton variant="listRow" aria-hidden />
          <Skeleton variant="listRow" aria-hidden />
        </div>
      ) : tomt ? (
        <p className="flex items-center gap-2 text-body text-text-secondary">
          <CircleCheck aria-hidden="true" size={20} className="shrink-0 text-success" />
          Inga öppna betalningar.
        </p>
      ) : (
        <>
          {/* NYCKELTALEN I KLARTEXT (Marcus fynd 1-2). PRD:ns tre tal är
              intakta - "N öppna · M förfallna · K kvitton att skicka" - men
              sagda så att de förklarar sig själva. Förfallo-talet bär sitt
              släktskap ("varav") i stället för att stå löst. */}
          <div className="flex flex-col gap-1">
            <p className="font-semibold text-body">
              {`${sammanfattning.oppna} ${
                sammanfattning.oppna === 1 ? 'anmälan väntar' : 'anmälningar väntar'
              } på betalning`}
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-caption text-text-secondary">
              <span className="flex items-center gap-1.5">
                <Clock aria-hidden="true" size={14} className="shrink-0" />
                {sammanfattning.forfallna === 0
                  ? 'inga har passerat sista betalningsdagen'
                  : `varav ${sammanfattning.forfallna} har passerat sista betalningsdagen`}
              </span>
              <span className="flex items-center gap-1.5">
                <Mail aria-hidden="true" size={14} className="shrink-0" />
                {`${sammanfattning.kvittonAttSkicka} ${
                  sammanfattning.kvittonAttSkicka === 1 ? 'kvitto' : 'kvitton'
                } att skicka`}
              </span>
            </div>
          </div>

          {/* KROPPEN (Marcus fynd 4): personrader, `NyaAnmalningar`s
              radgrammatik rakt av. Ingen scrollregion och därmed inget
              `tabIndex` - listan är kapad vid MAX_RADER, så det finns ingen
              dold yta att nå med tangentbord (WCAG 2.1.1 gäller
              scrollytor, inte kapade listor). */}
          {visadeRader.length > 0 ? (
            <ul aria-label="Öppna betalningar" className="flex flex-col gap-1">
              {visadeRader.map((rad, i) => (
                <li
                  key={rad.nyckel}
                  className={
                    i > 0
                      ? 'border-border-light border-t contrast-more:border-border-strong'
                      : undefined
                  }
                >
                  {rad.betalning.eventId ? (
                    <Link
                      to="/event/$eventId"
                      params={{ eventId: rad.betalning.eventId }}
                      className="group flex items-center gap-3 py-3"
                    >
                      <BetalningsradInnehall rad={rad} hovrandeNamn />
                    </Link>
                  ) : (
                    <div className="flex items-center gap-3 py-3">
                      <BetalningsradInnehall rad={rad} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : null}

          {oppnaRader.length > visadeRader.length ? (
            <Link to="/mer/betalningar" className="self-start text-small underline">
              {`Visa alla ${oppnaRader.length} i betalningsinkorgen`}
            </Link>
          ) : null}
        </>
      )}

      {utfall && (
        <MessageBox intent={utfall.intent} title={utfall.rubrik}>
          Kvittona skickas i bakgrunden. Du kan lämna sidan.
        </MessageBox>
      )}

      {/* SEKTIONSSPALTENS EGEN KNAPP (Marcus fynd 3) - samma `pt-1`-omslag
          som `NyaAnmalningar`s "Bekräfta alla", alltså identisk bredd och
          identiskt läge. Den renderas BARA när det finns någon att påminna -
          annars hade den öppnat en sändyta utan mottagare. Det är exakt den
          invariant `svep-paminnelse-send.acceptance.test.ts` § "tomt urval
          strukturellt onåbart via UI" bevisar, och den överlever formbytet. */}
      {harPaminnelser && (
        <div className="pt-1">
          <BulkAtgardsknapp label="Skicka påminnelse till alla" onPress={onSkickaPaminnelseAlla} />
        </div>
      )}

      {/* NAVIGATION, INTE EN KNAPP - samma `HandlingsRad`-form `Genvagar.tsx`
          bär, inklusive dess `HandlingsRadKort`-skal. Skalet behövs nu när
          sektionen själv är naken: utan det blir raden en hover-platta på
          sidans egen bakgrund (se `HandlingsRad.tsx` § HandlingsRadKort). */}
      <nav aria-label="Betalningsgenvägar">
        <HandlingsRadKort>
          <ul className="flex flex-col">
            <li className={HANDLINGSRAD_OMSLAG_KLASS}>
              <Link to="/mer/betalningar" className={HANDLINGSRAD_KLASS}>
                <HandlingsRadInnehall
                  ledande={<Banknote aria-hidden="true" size={16} className="shrink-0" />}
                >
                  Registrera betalning
                </HandlingsRadInnehall>
              </Link>
            </li>
          </ul>
        </HandlingsRadKort>
      </nav>
    </section>
  );
}

/**
 * Radens innehåll - `NyaAnmalningar.tsx`s grammatik (avatar → namn →
 * sekundärrad → efterställd markör), med inkorgens EGET sekundärradsinnehåll
 * (`BetalningsInkorg.tsx`: "{event} · Saknas N kr", och "Pris saknas i basen"
 * när priset är okänt). Två ytor, samma mening.
 *
 * `saknas` läser `kvar` FÖRE `betalning.saknas` - Postgres är sanningen,
 * basens formel läser spegeln och spegeln kan släpa (ADR-128 § Konsekvenser).
 * Samma uttryck som inkorgens rad bär, ordagrant.
 */
function BetalningsradInnehall({ rad, hovrandeNamn }: { rad: InkorgsRad; hovrandeNamn?: boolean }) {
  const saknas = rad.kvar ?? rad.betalning.saknas;
  return (
    <>
      <InitialAvatar namn={rad.namn} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span
          className={
            hovrandeNamn
              ? 'truncate font-medium text-body group-hover:underline'
              : 'truncate font-medium text-body'
          }
        >
          {rad.namn}
        </span>
        <span className="truncate text-caption text-text-muted">
          {rad.betalning.eventNamn ? `${rad.betalning.eventNamn} · ` : ''}
          {saknas === null ? 'Pris saknas i basen' : `Saknas ${visaKronor(saknas)} kr`}
        </span>
      </span>
      {rad.forfallen ? (
        <span className="inline-flex shrink-0 items-center gap-1 rounded border border-transparent bg-bg-muted px-2 py-0.5 text-caption contrast-more:border-border-strong">
          <Clock aria-hidden="true" size={13} className="shrink-0" />
          Förfallen
        </span>
      ) : null}
    </>
  );
}
