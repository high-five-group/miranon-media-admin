import { AlertTriangle, Check, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Input as AriaInput, Checkbox, SearchField } from 'react-aria-components';
import {
  Button,
  InitialAvatar,
  Input,
  MessageBox,
  Select,
  SelectItem,
} from '@/components/primitives';
import { useRegistreraInbetalning } from '@/data/mutations/inbetalningar';
import {
  analyseraFil,
  beraknaSignatur,
  type Filanalys,
  type Kolumnmappning,
  mappningsFel,
  parsaTransaktioner,
  TRANSAKTIONSFALT,
  type Transaktionsfalt,
} from './bankimport-parser';
import {
  arDubblettfel,
  attHantera,
  byggImportrader,
  type Importradstillstand,
  raderAttRegistrera,
  radnyckel,
  redanImporterade,
  sammanfattaImport,
} from './bankimport-rader';
import {
  bokforImporterade,
  importloggKarta,
  lasMappningar,
  sparaMappning,
} from './bankmappning-minne';
import { visaKronor } from './belopp-inmatning';
import type { Betalsatt } from './betalsatt-minne';
import { type InkorgsRad, rankaTraffar } from './inkorg-harledningar';

/**
 * [TASK-346.10 AC #1, #3, #4, PRD berättelse 19-22] Swish-importen: från
 * "åtta rader i banken" till "åtta bekräftelser", i SAMMA inkorg.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * INGEN NY YTA, OCH INGEN NY EDGE FUNCTION
 * ═══════════════════════════════════════════════════════════════════════════
 * Kortets egen rubrik säger "samma inkorg, ingen ny yta". Komponenten
 * renderas därför INUTI `BetalningsInkorg`, ovanför listan - inte som en egen
 * route. Två följder, båda avsiktliga:
 *
 *   1. MILJÖFLAGGAN GÄLLER UTAN NY KOD. Inkorgens route bär `betalningarPa()`
 *      i sin `beforeLoad` (`routes/_authenticated/mer/betalningar.tsx`), så
 *      importen är avstängd i prod på exakt samma villkor (PRD berättelse 36,
 *      DoD #7).
 *   2. "SKICKA N KVITTON" ÄR INKORGENS EGEN KNAPP. Registrerade rader lyfts
 *      upp via `onRegistrerade`, hamnar i inkorgens väntande-lista, och Lotta
 *      trycker på knappen hon redan känner. En andra knapp för samma sak hade
 *      gett två köer att hålla reda på.
 *
 * INGEN Edge Function behövde ändras eller deployas för denna skiva.
 * `registrera-inbetalning` tog redan emot `bankreferens` (dess `index.ts`
 * § "Dubblettnyckeln vid import") och svarade redan 409
 * `dubblett_bankreferens` på ett brott mot det partiella unika indexet.
 * Uppdraget väntade sig en EF-utvidgning; premiss-passet visade att den
 * redan var byggd i TASK-346.4.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * DUBBLETTERNA - TVÅ VÄGAR, EN SANNING
 * ═══════════════════════════════════════════════════════════════════════════
 * AC #3: "bankreferens som redan finns hoppas över och räknas synligt".
 *
 *   FÖRE bekräftelsen: den lokala importloggen märker rader denna webbläsare
 *   redan tagit, och de hamnar i en egen hopfälld hög. Det är ett hjälpmedel
 *   för ögat - utan det hade en omimport visat raderna som OMATCHADE, därför
 *   att matchningen söker bland öppna betalningar och en betald anmälan inte
 *   längre är öppen.
 *
 *   UNDER bekräftelsen: servern avvisar med 409 om referensen finns i
 *   databasen. Det är den enda källa som vet sanningen om alla enheter och
 *   alla användare, och den gäller även när loggen är tom eller rensad.
 *
 * Båda räknas i SAMMA tal ("N rader redan registrerade"), eftersom det för
 * Lotta är ett och samma faktum.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * REGISTRERINGEN ÄR SEKVENTIELL, MED AVSIKT
 * ═══════════════════════════════════════════════════════════════════════════
 * Raderna skickas en i taget, inte som ett `Promise.all`. Skälet är inte
 * försiktighet utan RIKTIGHET: varje registrering räknar om anmälans
 * härledning ur HELA inbetalningsmängden och skriver om spegeln
 * (`registrera-inbetalning` § Steg 2-3). Två parallella anrop mot SAMMA
 * anmälan - vilket händer så fort någon swishat två gånger, PRD berättelse 5
 * - hade läst samma utgångsläge och skrivit två spegelvärden där det senare
 * skriver över det tidigare med ett för lågt tal.
 *
 * Ett fel på en rad stoppar inte de andra. Åtta rader ger åtta utfall.
 */

type Props = {
  /** Inkorgens öppna betalningar - matchningens sökrymd. */
  oppna: readonly InkorgsRad[];
  idag: string;
  betalsatt: Betalsatt;
  /** Lyfter registrerade rader till inkorgens "Skicka N kvitton". */
  onRegistrerade: (kvitton: { inbetalningId: string; namn: string; belopp: number }[]) => void;
  onStang: () => void;
};

type Steg = 'val' | 'mappning' | 'lista';

const FALTETIKETT: Record<Transaktionsfalt, string> = {
  datum: 'Betalningsdatum',
  belopp: 'Belopp',
  namn: 'Namn',
  telefon: 'Telefonnummer',
  meddelande: 'Meddelande',
  bankreferens: 'Bankens referens',
};

/** Ett tomt utkast, för en fil vi inte känner igen alls. Inget är förvalt. */
function tomMappning(analys: Filanalys): Kolumnmappning {
  return {
    bank: '',
    avgransare: analys.avgransare,
    harRubrikrad: analys.harRubrikrad,
    radfilter: [],
    kolumner: {
      datum: null,
      belopp: null,
      namn: null,
      telefon: null,
      meddelande: null,
      bankreferens: null,
    },
    signatur: null,
  };
}

/**
 * Dialogens startläge. `analys.bastaGissning` är ALDRIG tillämpad
 * automatiskt (se `Filanalys.bastaGissning`) - bara ett förslag Lotta ser,
 * kan rätta, och måste EXPLICIT bekräfta genom att trycka "Läs filen"
 * (`bekraftaMappning`). Signaturen nollställs: den beräknas på nytt mot
 * DENNA fil när hon bekräftar, aldrig återanvänds från gissningens källa.
 */
function utkastFor(analys: Filanalys): Kolumnmappning {
  const gissning = analys.bastaGissning;
  if (gissning === null) return tomMappning(analys);
  return {
    ...gissning,
    avgransare: analys.avgransare,
    harRubrikrad: analys.harRubrikrad,
    signatur: null,
  };
}

export function SwishImport({ oppna, idag, betalsatt, onRegistrerade, onStang }: Props) {
  const [steg, setSteg] = useState<Steg>('val');
  const [filnamn, setFilnamn] = useState('');
  const [innehall, setInnehall] = useState('');
  const [analys, setAnalys] = useState<Filanalys | null>(null);
  const [utkast, setUtkast] = useState<Kolumnmappning | null>(null);
  const [mappning, setMappning] = useState<Kolumnmappning | null>(null);
  const [rader, setRader] = useState<Importradstillstand[]>([]);
  const [bortfiltrerade, setBortfiltrerade] = useState(0);
  const [fel, setFel] = useState<{ radnummer: number; skal: string }[]>([]);
  const [lasfel, setLasfel] = useState<string | null>(null);
  const [korning, setKorning] = useState<'nej' | 'pagar' | 'klar'>('nej');
  const [visaRedan, setVisaRedan] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const registrera = useRegistreraInbetalning();

  const mappningPanelRef = useRef<HTMLDivElement>(null);
  const listaPanelRef = useRef<HTMLDivElement>(null);

  /**
   * FLYTTAR FOKUS DETERMINISTISKT vid stegbyte 'val' → 'mappning'/'lista'.
   *
   * Knappen "Ladda upp fil" (steg 'val') AVMONTERAS när `laddaFil` byter
   * steg, och utan detta faller fokus till `document.body` - en
   * tangentbords- eller skärmläsaranvändare tappar sin plats mitt i ett
   * pengaflöde. Samma felklass, samma fix-mönster som
   * `BetalningsInkorg.tsx` § `stangImport` (`importKnappRef.current?.focus()`)
   * bär åt andra hållet.
   *
   * `useEffect`, inte ett anrop direkt efter `setSteg(...)`: React har inte
   * målat det NYA stegets DOM förrän efter renderingen, så en synkron
   * `.focus()`-anrop omedelbart efter `setSteg` hade träffat FÖREGÅENDE
   * stegs träd.
   */
  useEffect(() => {
    if (steg === 'mappning') mappningPanelRef.current?.focus();
    else if (steg === 'lista') listaPanelRef.current?.focus();
  }, [steg]);

  /**
   * `value = ''` FÖRE klicket är inte kosmetik här - det är AC #3:s bevis.
   * Utan nollställningen fyrar `change` inte när SAMMA fil väljs två gånger i
   * rad, och "omimport av samma fil skapar 0 nya" hade varit omöjligt att
   * visa i webbläsaren. Samma form `DokumentYta.tsx` § `oppnaFilvaljare` bär,
   * av ett besläktat skäl (Lotta väljer om en fil hon råkat välja fel).
   */
  function valjFil() {
    const input = inputRef.current;
    if (!input) return;
    input.value = '';
    input.click();
  }

  async function laddaFil(fil: File) {
    setLasfel(null);
    setKorning('nej');
    setFilnamn(fil.name);

    let text: string;
    try {
      text = await fil.text();
    } catch {
      setLasfel('Filen gick inte att läsa. Prova att ladda ner rapporten på nytt.');
      return;
    }

    setInnehall(text);
    const nyAnalys = analyseraFil(text, lasMappningar());
    setAnalys(nyAnalys);

    if (nyAnalys.igenkand) {
      visaRader(text, nyAnalys.igenkand);
      return;
    }
    // AC #1: okänt format (noll ELLER FLERA strukturellt matchande
    // kandidater) ger mappningsdialog, ALDRIG en tyst gissning - se
    // `Filanalys.igenkand`. `utkastFor` förifyller med bästa gissning, men
    // Lotta bekräftar alltid explicit innan något sparas eller läses.
    setUtkast(utkastFor(nyAnalys));
    setSteg('mappning');
  }

  function visaRader(text: string, vald: Kolumnmappning) {
    const parsat = parsaTransaktioner(text, vald);
    setMappning(vald);
    setRader(byggImportrader(parsat, oppna, importloggKarta()));
    setBortfiltrerade(parsat.bortfiltrerade.length);
    setFel(parsat.fel);
    setSteg('lista');
  }

  /**
   * Bekräftar mappningen. Signaturen beräknas HÄR, mot DEN HÄR FILEN
   * (`analys`) - aldrig mot en tidigare gissnings ursprungsfil - så att en
   * framtida import bara matchar automatiskt när formen faktiskt är
   * densamma (`Strukturensignatur`, fix-runda 2).
   */
  function bekraftaMappning() {
    if (!utkast || !analys || mappningsFel(utkast) !== null) return;
    const signatur = beraknaSignatur(
      analys.rader,
      analys.avgransare,
      analys.harRubrikrad,
      analys.kolumner,
    );
    const attSpara: Kolumnmappning = { ...utkast, signatur };
    sparaMappning(attSpara);
    visaRader(innehall, attSpara);
  }

  function andraRad(nyckel: string, andring: Partial<Importradstillstand>) {
    setRader((tidigare) =>
      tidigare.map((rad) => (radnyckel(rad.rad) === nyckel ? { ...rad, ...andring } : rad)),
    );
  }

  /**
   * Kör bekräftelsen. Sekventiellt - se filhuvudet för varför.
   *
   * Utfallen samlas i en LOKAL karta och skrivs till tillståndet EN gång, i
   * stället för ett `setRader` per varv: en uppdatering per rad hade gett
   * React åtta omritningar av en lista Lotta tittar på, och en halvfärdig
   * lista som ändrar sig under handen är svårare att följa än en som byter
   * läge en gång.
   */
  async function bekrafta() {
    const attKora = raderAttRegistrera(rader);
    if (attKora.length === 0) return;

    setKorning('pagar');
    const utfall = new Map<string, Importradstillstand['utfall']>();
    const kvitton: { inbetalningId: string; namn: string; belopp: number }[] = [];
    const nyaReferenser: string[] = [];

    for (const rad of attKora) {
      const nyckel = radnyckel(rad.rad);
      const { transaktion } = rad.rad;
      try {
        const svar = await registrera.mutateAsync({
          anmalanRecordId: rad.vald as string,
          // Beloppet skickas som STRÄNG och normaliseras server-side, precis
          // som formulärets (`Betalningar.schema.ts` § RegistreraInbetalningInput).
          belopp: String(transaktion.belopp),
          betalsatt,
          ...(transaktion.datum !== null ? { betalningsdatum: transaktion.datum } : {}),
          ...(transaktion.bankreferens !== null ? { bankreferens: transaktion.bankreferens } : {}),
        });

        utfall.set(nyckel, {
          klass: 'registrerad',
          inbetalningId: svar.inbetalning.id,
          kvittens: `${visaKronor(svar.inbetalning.belopp)} kr registrerat.`,
        });
        if (transaktion.bankreferens !== null) nyaReferenser.push(transaktion.bankreferens);
        if (rad.medKvitto) {
          kvitton.push({
            inbetalningId: svar.inbetalning.id,
            // RAD.VALD, INTE `kandidater[0]`: en osäker rad kan ha fått en
            // ANNAN kandidat vald än den första, och en omatchad rad har
            // ALLTID en tom kandidatlista - `kandidater[0]` hade då varit
            // `undefined` och alltid fallit till bankens (Swish-ägarens)
            // namn i stället för deltagarens. `oppna` bär hela sökrymden,
            // inklusive de rader Lotta hittat via sökfältet (som aldrig
            // hamnar i `rad.matchning.kandidater`).
            namn:
              namnForVal(rad.vald, rad.matchning.kandidater, oppna) ??
              transaktion.namn ??
              'Okänt namn',
            belopp: svar.inbetalning.belopp,
          });
        }
      } catch (error) {
        if (arDubblettfel(error)) {
          utfall.set(nyckel, { klass: 'dubblett' });
          // LOGGAS ÄVEN HÄR: en server-avvisad dubblett är precis det
          // importloggen finns för att göra synligt vid NÄSTA import (se
          // `bankmappning-minne.ts` § "VAD DEN ÄR TILL FÖR"). Utan detta
          // bokfördes bara de rader SOM LYCKADES i try-grenen, och en
          // referens databasen redan kände till men denna webbläsares logg
          // inte gjorde (annan dator, rensad lagring) hade fallit ut som
          // OMATCHAD nästa gång i stället för "redan registrerad".
          if (transaktion.bankreferens !== null) nyaReferenser.push(transaktion.bankreferens);
        } else {
          utfall.set(nyckel, {
            klass: 'fel',
            skal: error instanceof Error ? error.message : 'Okänt fel.',
          });
        }
      }
    }

    bokforImporterade(nyaReferenser, idag);
    setRader((tidigare) =>
      tidigare.map((rad) => {
        const nytt = utfall.get(radnyckel(rad.rad));
        return nytt === undefined ? rad : { ...rad, utfall: nytt, ibockad: false };
      }),
    );
    setKorning('klar');
    if (kvitton.length > 0) onRegistrerade(kvitton);
  }

  const summa = sammanfattaImport(rader);
  const arbetsyta = attHantera(rader);
  const redan = redanImporterade(rader);
  const utkastfel = utkast ? mappningsFel(utkast) : null;
  // AC #3-ytan (`Transaktion.ts` § `bankreferens`): en rad UTAN referens har
  // inget dubblettskydd - varken indexet i databasen eller den lokala
  // loggen kan känna igen den vid en omimport. Räknas bland ARBETSYTAN
  // (raderna Lotta faktiskt kan bocka i just nu), inte bland redan
  // registrerade, som redan är ofarliga oavsett.
  const utanReferens = arbetsyta.filter((rad) => rad.rad.transaktion.bankreferens === null).length;

  return (
    <section
      /* TERMEN ÄR "KONTOUTDRAG", INTE "BANKRAPPORT" (Marcus dom 2026-09-01):
         *"'Importera kontoutdrag' är mer rätt namn på knappen … 'bankrapport'
         är typiskt dålig svensk översättning av 'bank statement'"*. Han har
         rätt i sak: "bank statement" heter kontoutdrag på svenska, och
         "bankrapport" är inget ord Lotta möter i sin internetbank
         (Gunilla-principen). `aria-label` räknas som UI-text och byts med
         resten — den ÄR ytans tillgängliga namn. Kodidentifierare och filnamn
         (`SwishImport`, `bankimport-*`) är orörda: de är inte text Lotta
         läser. */
      aria-label="Importera kontoutdrag"
      className="mx-4 flex flex-col gap-3 rounded border border-border bg-surface p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold text-lg">Importera kontoutdrag</h2>
        <Button intent="ghost" size="sm" onPress={onStang}>
          Stäng
        </Button>
      </div>

      {/* Dold input plus en knapp som klickar den. `hidden` ger display:none,
          alltså varken synlig, tabbstopp eller nåbar för skärmläsaren -
          precis den form react-arias FileTrigger själv renderar. */}
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.txt,text/csv,text/plain"
        hidden
        onChange={(event) => {
          const fil = event.target.files?.[0];
          if (fil) void laddaFil(fil);
        }}
      />

      {steg === 'val' && (
        <div className="flex flex-col gap-2">
          {/* "PER BANK" ÄR STRUKET (Marcus: *"Ta bort 'per bank', de har bara
              en bank"*). Kvalificeringen beskrev en generalitet koden bär
              (`bankmappning-minne.ts` sparar faktiskt mappningen per banknamn)
              men som Lotta aldrig möter — hon har en bank, och "per bank" fick
              en engångsuppgift att låta som en återkommande.

              SWISH-HÄNVISNINGEN ÄR KVAR, omskriven till den nya termen: utan
              den vet Lotta inte VILKEN av bankens filer som avses. Vald
              formulering: "Ladda ner kontoutdraget för Swish från din bank och
              välj filen här." — kontoutdrag som huvudord, Swish som
              bestämning, alltså samma sak hon letar efter i banken. */}
          <p className="text-small text-text-muted">
            Ladda ner kontoutdraget för Swish från din bank och välj filen här. Kolumnerna behöver
            bara pekas ut en gång.
          </p>
          <div>
            <Button intent="primary" emphasis="outline" onPress={valjFil}>
              <Upload aria-hidden size={16} className="shrink-0" />
              {/* *"Byt ut 'Välj rapportfil' till 'Ladda upp fil'"* — och
                  "rapportfil" försvinner därmed ur UI:t helt, i samma andetag
                  som "bankrapport". Ikonen (`Upload`) är oförändrad. */}
              Ladda upp fil
            </Button>
          </div>
        </div>
      )}

      {lasfel !== null && (
        <MessageBox intent="error" title="Filen kunde inte läsas">
          {lasfel}
        </MessageBox>
      )}

      {steg === 'mappning' && analys && utkast && (
        // `tabIndex={-1}` + `ref`: fokusmål för `useEffect`-svepet ovan. Se
        // dess docblock för VARFÖR (a11y-golvet, tidigare oåtgärdat).
        <div ref={mappningPanelRef} tabIndex={-1} className="flex flex-col gap-3 outline-none">
          <MessageBox intent="info" title={`Kontrollera mappningen: ${filnamn}`}>
            {analys.bastaGissning === null
              ? 'Appen känner inte igen filen. Peka ut vilken kolumn som är vad, en gång, så sparas det till nästa import.'
              : 'Appen är inte säker på vilken sparad mappning som gäller. Kolumnerna nedan är en GISSNING, förifylld men aldrig tillämpad automatiskt. Kontrollera dem, rätta det som skiljer sig, och bekräfta.'}
          </MessageBox>

          <Input
            label="Vilken bank kommer rapporten från?"
            value={utkast.bank}
            onChange={(varde) => setUtkast({ ...utkast, bank: varde })}
            placeholder="Till exempel Nordea"
            // `mappningsFel` returnerar EN sträng, antingen om banknamnet
            // eller om en obligatorisk kolumn - aldrig båda. Fältet visar
            // felet bara när det FAKTISKT gäller banknamnet; ett fel om en
            // saknad kolumn visas i stället i kolumnlistans egen fotnot
            // nedan (samma utkastfel, olika plats beroende på VAD det gäller).
            isInvalid={utkastfel !== null && utkast.bank.trim() === ''}
            errorMessage={utkast.bank.trim() === '' ? (utkastfel ?? undefined) : undefined}
            className="max-w-80"
          />

          <ul className="flex flex-col gap-2">
            {TRANSAKTIONSFALT.map((falt) => (
              <li key={falt} className="flex flex-wrap items-center gap-2">
                <Select
                  label={FALTETIKETT[falt]}
                  selectedKey={
                    utkast.kolumner[falt] === null ? 'ingen' : String(utkast.kolumner[falt])
                  }
                  onSelectionChange={(nyckel) =>
                    setUtkast({
                      ...utkast,
                      kolumner: {
                        ...utkast.kolumner,
                        [falt]: nyckel === 'ingen' ? null : Number(nyckel),
                      },
                    })
                  }
                  className="min-w-64"
                >
                  <SelectItem id="ingen">Finns inte i filen</SelectItem>
                  {analys.kolumner.map((kolumn) => (
                    <SelectItem key={kolumn.index} id={String(kolumn.index)}>
                      {kolumnEtikett(kolumn.index, kolumn.rubrik, kolumn.exempel)}
                    </SelectItem>
                  ))}
                </Select>
              </li>
            ))}
          </ul>

          {/* Felmeddelandet visas nu av `Input`s egen `FieldError` (kopplad
              via `aria-describedby`/`aria-invalid`, ADR-046) - se fältet
              ovan. Ett fel som gäller ENDAST kolumnvalen (bankfältet är
              ifyllt men ingen kolumn pekar ut beloppet) syns bara här. */}
          {utkastfel !== null && utkast.bank.trim() !== '' && (
            <p role="status" className="text-(color:--mm-input-error-text) text-small">
              {utkastfel}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button isDisabled={utkastfel !== null} onPress={bekraftaMappning}>
              Läs filen
            </Button>
            <Button intent="ghost" onPress={onStang}>
              Avbryt
            </Button>
          </div>
        </div>
      )}

      {steg === 'lista' && (
        // `tabIndex={-1}` + `ref`: fokusmål för `useEffect`-svepet ovan. Se
        // dess docblock för VARFÖR (a11y-golvet, tidigare oåtgärdat).
        <div ref={listaPanelRef} tabIndex={-1} className="flex flex-col gap-3 outline-none">
          <p role="status" aria-live="polite" className="text-small text-text-muted">
            {sammanfattningstext(summa, filnamn, mappning?.bank ?? '')}
          </p>

          {utanReferens > 0 && (
            <MessageBox intent="warning" title="Rader utan bankreferens">
              {`${utanReferens} ${utanReferens === 1 ? 'rad saknar' : 'rader saknar'} bankreferens och har inget dubblettskydd. Importeras samma rapport igen kan ${
                utanReferens === 1 ? 'den' : 'de'
              } registreras en gång till.`}
            </MessageBox>
          )}

          {(bortfiltrerade > 0 || fel.length > 0) && (
            <ul className="flex flex-col gap-1 text-caption text-text-muted">
              {bortfiltrerade > 0 && (
                <li>{`${bortfiltrerade} rader i filen var inte inbetalningar och togs inte med.`}</li>
              )}
              {fel.map((post) => (
                <li key={post.radnummer} className="flex items-center gap-1">
                  <AlertTriangle aria-hidden size={13} className="shrink-0" />
                  {`Rad ${post.radnummer}: ${post.skal}`}
                </li>
              ))}
            </ul>
          )}

          {arbetsyta.length === 0 && redan.length > 0 && korning === 'nej' && (
            <MessageBox intent="success" title="Allt i filen är redan registrerat">
              Ingen ny inbetalning skapas. Du kan importera samma rapport hur många gånger som
              helst.
            </MessageBox>
          )}

          {/* SAMMA RADFORMSKLASS SOM INKORGEN (designfynd 6) —
              `divide-y`-container i stället för separata bordade kort per
              rad, se `BetalningsInkorg.tsx`s `BetalningsradKort`. Villkorad
              på längd av samma skäl som den listan: en tom `<ul>` hade annars
              stått kvar under "Allt i filen är redan registrerat" ovan. */}
          {arbetsyta.length > 0 && (
            <ul className="divide-y divide-border rounded-2xl border border-transparent bg-bg-muted px-4 contrast-more:border-border-strong">
              {arbetsyta.map((rad) => (
                <Importrad
                  key={radnyckel(rad.rad)}
                  rad={rad}
                  oppna={oppna}
                  idag={idag}
                  onAndra={(andring) => andraRad(radnyckel(rad.rad), andring)}
                />
              ))}
            </ul>
          )}

          {redan.length > 0 && (
            <div className="flex flex-col gap-2">
              <div>
                <Button
                  intent="ghost"
                  size="sm"
                  onPress={() => setVisaRedan((v) => !v)}
                  aria-expanded={visaRedan}
                >
                  {`Redan registrerade (${redan.length})`}
                </Button>
              </div>
              {visaRedan && (
                <ul className="flex flex-col gap-1 px-3 text-small text-text-muted">
                  {redan.map((rad) => (
                    <li key={radnyckel(rad.rad)}>
                      {`${rad.rad.transaktion.namn ?? 'Okänt namn'} · ${visaKronor(
                        rad.rad.transaktion.belopp,
                      )} kr · importerad ${rad.tidigareImporterad}`}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              isDisabled={summa.attRegistrera === 0 || korning === 'pagar'}
              isLoading={korning === 'pagar'}
              onPress={() => void bekrafta()}
            >
              {`Registrera ${summa.attRegistrera} ${
                summa.attRegistrera === 1 ? 'betalning' : 'betalningar'
              }`}
            </Button>
            <Button intent="ghost" onPress={valjFil}>
              Välj en annan fil
            </Button>
            <Button intent="ghost" onPress={onStang}>
              {korning === 'klar' ? 'Klar' : 'Avbryt'}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

/** Kolumnens etikett i dialogen: plats, rubrik och vad den faktiskt bär. */
function kolumnEtikett(index: number, rubrik: string | null, exempel: string[]): string {
  const namn = rubrik !== null && rubrik !== '' ? rubrik : `Kolumn ${index + 1}`;
  const prov = exempel.slice(0, 2).join(', ');
  return prov === '' ? namn : `${namn} (${prov})`;
}

function sammanfattningstext(
  summa: ReturnType<typeof sammanfattaImport>,
  filnamn: string,
  bank: string,
): string {
  if (summa.registrerade > 0 || summa.misslyckade > 0 || summa.redanRegistrerade > 0) {
    const delar = [`${summa.registrerade} registrerade`];
    if (summa.redanRegistrerade > 0) {
      delar.push(`${summa.redanRegistrerade} redan registrerade`);
    }
    if (summa.misslyckade > 0) delar.push(`${summa.misslyckade} misslyckades`);
    return delar.join(' · ');
  }
  // [TASK-346.14, designfynd 3/språkfynd 2] Kongruens vid N=1 — "1 rader"
  // läste fel. Räknelogiken (VAD som räknas, ramrads-frågan §3 bullet 3) är
  // ORÖRD, uppdraget säger uttryckligen "rör den inte" — bara ordformen
  // ändras utifrån talet som redan finns.
  const kalla = bank === '' ? filnamn : `${filnamn}, läst som ${bank}`;
  const radOrd = summa.lasta === 1 ? 'rad' : 'rader';
  const sakraOrd = summa.sakra === 1 ? 'säker' : 'säkra';
  const osakraOrd = summa.osakra === 1 ? 'osäker' : 'osäkra';
  const omatchadeOrd = summa.omatchade === 1 ? 'omatchad' : 'omatchade';
  return `${kalla}: ${summa.lasta} ${radOrd} · ${summa.sakra} ${sakraOrd} · ${summa.osakra} ${osakraOrd} · ${summa.omatchade} ${omatchadeOrd}`;
}

/* ═══════════════════════════ EN RAD ═══════════════════════════ */

type RadProps = {
  rad: Importradstillstand;
  oppna: readonly InkorgsRad[];
  idag: string;
  onAndra: (andring: Partial<Importradstillstand>) => void;
};

/**
 * EN bankrad i bekräftelselistan.
 *
 * DE TRE LÄGENA ÄR AC #4, ORD FÖR ORD: "säkra rader förbockade, osäkra visar
 * kandidater, omatchade får sökfältet". Kryssrutan för kvitto finns på VARJE
 * rad med samma default som formuläret (i), så att Lotta kan ta bort den för
 * en enskild rad utan att röra de andra.
 *
 * VALET OCH BOCKEN HÖR IHOP. Väljer Lotta en anmälan på en osäker rad bockas
 * den i automatiskt - annars hade hon behövt två handlingar för det som är
 * ett beslut. Väljer hon bort anmälan igen bockas raden ur, eftersom en
 * ibockad rad utan anmälan inte kan registreras (`raderAttRegistrera`
 * § KRAVET PÅ `vald`).
 */
function Importrad({ rad, oppna, idag, onAndra }: RadProps) {
  const [sokterm, setSokterm] = useState('');
  const { transaktion } = rad.rad;
  const klass = rad.matchning.klass;

  // Omatchade rader får sökfältet, och söker i SAMMA rankning som inkorgen
  // (`rankaTraffar`): personer med öppna betalningar först. Att bygga en egen
  // sökordning här hade gett Lotta två olika svar på samma fråga.
  const traffar = sokterm.trim() === '' ? [] : rankaTraffar([...oppna], sokterm, idag).slice(0, 8);
  const valbara = klass === 'omatchad' ? traffar : rad.matchning.kandidater;

  function valj(anmalanRecordId: string | null) {
    onAndra({ vald: anmalanRecordId, ibockad: anmalanRecordId !== null });
  }

  return (
    // Egen kant/bakgrund riven (designfynd 6) — raden lever nu i förälderns
    // `divide-y`-container, samma hårlinje-rytm som inkorgens rader.
    <li className="flex flex-col gap-2 py-3">
      <div className="flex flex-wrap items-start gap-3">
        <InitialAvatar namn={transaktion.namn ?? 'Utan namn'} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="font-medium">
            {`${transaktion.namn ?? 'Utan namn'} · ${visaKronor(transaktion.belopp)} kr`}
          </span>
          <span className="text-caption text-text-muted">
            {radbeskrivning(transaktion.datum, transaktion.telefon, transaktion.meddelande)}
          </span>
          <span className="text-caption text-text-muted">{rad.matchning.grund}</span>
        </div>
        <span className="shrink-0 rounded border border-transparent bg-bg px-2 py-0.5 text-caption">
          {klass === 'saker' ? 'Säker' : klass === 'osaker' ? 'Osäker' : 'Omatchad'}
        </span>
      </div>

      {rad.utfall === null ? (
        <>
          {klass === 'omatchad' && (
            <SearchField
              aria-label={`Sök anmälan för ${transaktion.namn ?? 'raden'}`}
              value={sokterm}
              onChange={setSokterm}
            >
              <AriaInput
                placeholder="Sök på namn, telefon eller belopp"
                className="mm-fokusring-vid-fokus text-(color:--mm-input-text) placeholder:text-(color:--mm-input-text-placeholder) min-h-10 w-full rounded border border-(--mm-input-border) bg-(--mm-input-bg) px-3 text-body"
              />
            </SearchField>
          )}

          {valbara.length > 0 && (
            <Select
              label="Registrera på anmälan"
              selectedKey={rad.vald ?? 'ingen'}
              onSelectionChange={(nyckel) => valj(nyckel === 'ingen' ? null : String(nyckel))}
            >
              <SelectItem id="ingen">Välj anmälan ...</SelectItem>
              {valbara.map((kandidat) => (
                <SelectItem key={kandidat.nyckel} id={kandidat.betalning.anmalanRecordId}>
                  {kandidatEtikett(kandidat)}
                </SelectItem>
              ))}
            </Select>
          )}

          {klass === 'omatchad' && sokterm.trim() !== '' && traffar.length === 0 && (
            <p className="text-caption text-text-muted">
              Ingen kvarvarande betalning matchar sökningen.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4">
            <Checkbox
              isSelected={rad.ibockad}
              isDisabled={rad.vald === null}
              onChange={(vald) => onAndra({ ibockad: vald })}
              className="group flex cursor-pointer items-center gap-2 text-small data-[disabled]:cursor-not-allowed data-[disabled]:opacity-60"
            >
              <span className="flex size-5 shrink-0 items-center justify-center rounded border border-(--mm-input-border) bg-(--mm-input-bg) group-data-[selected]:border-text group-data-[selected]:bg-text">
                <Check
                  aria-hidden="true"
                  size={14}
                  className="text-text-inverse opacity-0 group-data-[selected]:opacity-100"
                />
              </span>
              <span>Ta med</span>
            </Checkbox>

            {/* Samma kryssruta och samma default som `RegistreraForm` (i). */}
            <Checkbox
              isSelected={rad.medKvitto}
              onChange={(vald) => onAndra({ medKvitto: vald })}
              className="group flex cursor-pointer items-center gap-2 text-small"
            >
              <span className="flex size-5 shrink-0 items-center justify-center rounded border border-(--mm-input-border) bg-(--mm-input-bg) group-data-[selected]:border-text group-data-[selected]:bg-text">
                <Check
                  aria-hidden="true"
                  size={14}
                  className="text-text-inverse opacity-0 group-data-[selected]:opacity-100"
                />
              </span>
              <span>Skicka kvitto</span>
            </Checkbox>
          </div>
        </>
      ) : (
        <p role="status" className="text-small">
          {utfallstext(rad.utfall)}
        </p>
      )}
    </li>
  );
}

/**
 * Namnet på anmälan Lotta FAKTISKT valde för raden - inte gissat ur index 0.
 *
 * Sökordningen speglar var valet kan ha kommit ifrån: `kandidater` är
 * matchningens egna förslag (säkra/osäkra rader), `oppna` är HELA
 * sökrymden och täcker även ett fritt sökval på en omatchad rad (vars
 * kandidatlista alltid är tom per `Matchning`-invarianten).
 */
function namnForVal(
  vald: string | null,
  kandidater: readonly InkorgsRad[],
  oppna: readonly InkorgsRad[],
): string | null {
  if (vald === null) return null;
  const traff =
    kandidater.find((k) => k.betalning.anmalanRecordId === vald) ??
    oppna.find((k) => k.betalning.anmalanRecordId === vald);
  return traff?.namn ?? null;
}

function radbeskrivning(
  datum: string | null,
  telefon: string | null,
  meddelande: string | null,
): string {
  const delar = [datum ?? 'Datum saknas i filen'];
  if (telefon !== null) delar.push(telefon);
  if (meddelande !== null && meddelande !== '') delar.push(meddelande);
  return delar.join(' · ');
}

function kandidatEtikett(kandidat: InkorgsRad): string {
  const saknas = kandidat.kvar;
  // Delad domänterm (Marcus 2026-09-01): "kvar att betala", beloppet först i
  // löpande text. Etiketten är en ` · `-fogad rad, så ledet står versal-löst
  // och börjar ändå med en siffra.
  const belopp = saknas === null ? 'pris saknas' : `${visaKronor(saknas)} kr kvar att betala`;
  return `${kandidat.namn} · ${kandidat.betalning.eventNamn ?? 'Utan event'} · ${belopp}`;
}

function utfallstext(utfall: NonNullable<Importradstillstand['utfall']>): string {
  if (utfall.klass === 'registrerad') return utfall.kvittens;
  if (utfall.klass === 'dubblett') return 'Redan registrerad. Ingen ny inbetalning skapades.';
  return `Kunde inte registreras: ${utfall.skal}`;
}
