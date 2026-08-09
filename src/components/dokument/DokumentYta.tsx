/**
 * [PROTOTYPE] [S100] DOKUMENT-YTAN — Mer-ytan där bilagor förvaltas (`T131`).
 *
 * FRÅGAN SOM BESVARAS (throwaway-kontraktet klausul i):
 *   "Vilken form ska Dokument-ytan ha — den yta som förvaltar det
 *    bilageväljaren på åtgärds-sidan visar?"
 *
 * VARFÖR DEN BYGGS I SAMMA SESSION SOM ÅTGÄRDS-SIDAN (underlaget § 9,
 * Marcus-beslut 2026-08-07): bilageväljaren visar det den här ytan förvaltar.
 * Designas väljaren utan att biblioteket är designat designas den baklänges —
 * de två är två vyer av samma objekt. Bieffekt: `TASK-146` (bilage-fundamentet)
 * får tillbaka sin UI-konsument; klass A gick annars inte att ladda upp
 * någonstans ifrån.
 *
 * FORMEN: TRE GRUPPER, EN PER DOKUMENTKLASS — inte en lista med klass-märken.
 *
 * Skälet är att klasserna är STRUKTURELLT olika, inte olika sorters etikett på
 * samma sak (ORDLISTA § Bilaga):
 *
 *   A — UPPLADDAD        en fil. Lotta väljer den från datorn. Kan ersättas.
 *   B — EVENT-MALLAD     ingen fil förrän ett event valts; mallen FYLLS med
 *                        eventets uppgifter vid utskicket.
 *   C — PERSON-GENERERAD ingen fil alls förrän utskicket sker, och då EN PER
 *                        MOTTAGARE — sex mottagare ger sex olika PDF:er.
 *
 * En platt lista med ett klass-märke per rad påstår att skillnaden är en
 * etikett. Det är den inte: två av tre klasser har ingen fil att visa storleken
 * på, och klass C har inte ens ett bestämt antal förrän mottagarlistan är känd.
 * Just den missuppfattningen är vad som gör bilageväljaren svår att förstå — så
 * om biblioteket lär henne skillnaden behöver väljaren inte göra det igen.
 *
 * AVVÄGNINGEN, ÖPPET: tre grupper där två har en enda post ser tunna ut, och
 * fördelningen mellan klasserna är OKÄND — ingen datakälla finns ännu
 * (`TASK-146` är inte byggd), så stubbarna nedan är antaganden, inte mätning.
 * Visar det sig att klass A rymmer tjugo filer och B/C en var, är en lista med
 * klass-filter (den avvisade formen) rimligare. Det avgörs när ytan har data.
 *
 * GRAMMATIKEN ÄR ÄRVD: Mer-undersidornas skal (`AnmalningarList` —
 * `p-4`-sektion, "← Tillbaka till Mer", `h1 font-semibold text-2xl` med
 * antalsrad under) och eventsidans grupp-grammatik (`DetaljGrupp`: rubriken
 * UTANFÖR den tonala kortytan).
 *
 * READ-ONLY: ingen handling här skriver något. Uppladdning, ersättning och
 * borttagning är prototyp-lokala stubbar — bilage-fundamentet finns inte.
 *
 * KASTBAR: koden absorberas ALDRIG (klausul iv).
 */
import { Link } from '@tanstack/react-router';
import { FileText, Sparkles, Upload, UserRound } from 'lucide-react';
import { DetaljGrupp } from '@/components/events/detail/DetaljGrupp';
import { Button } from '@/components/primitives/Button';

/* ------------------------------------------------------------------ *
 * PROTOTYP-STUBBAR. Ingen datakälla finns (`TASK-146` ej byggd) — dessa
 * är antaganden om vad metadatat kommer bära, inte mätning.
 * ------------------------------------------------------------------ */

type UppladdadFil = {
  id: string;
  namn: string;
  storlek: string;
  uppladdad: string;
  /** Antal event som bifogar filen — bibliotekets enda användnings-signal. */
  anvandsI: number;
  /** Satt när filen ersatts: den förra versionens datum. */
  ersatte?: string;
};

const UPPLADDADE: UppladdadFil[] = [
  {
    id: 'a1',
    namn: 'Hörlursinformation.pdf',
    storlek: '184 kB',
    uppladdad: '12 juni 2026',
    anvandsI: 4,
  },
  {
    id: 'a2',
    namn: 'Vägbeskrivning Skövde.pdf',
    storlek: '92 kB',
    uppladdad: '3 juli 2026',
    anvandsI: 2,
    ersatte: '18 maj 2026',
  },
  {
    id: 'a3',
    namn: 'Meny och specialkost.pdf',
    storlek: '61 kB',
    uppladdad: '28 juli 2026',
    anvandsI: 1,
  },
];

type Mall = {
  id: string;
  namn: string;
  /** Vilka eventfält mallen fyller i — det som gör den till en MALL. */
  fyllerI: string[];
};

const MALLAR: Mall[] = [
  {
    id: 'b1',
    namn: 'Deltagarinformation',
    fyllerI: ['Eventnamn', 'Datum', 'Ort', 'Lokal', 'Starttid'],
  },
];

type Generator = {
  id: string;
  namn: string;
  /** Vilka uppgifter filen byggs ur — per person. */
  byggsUr: string[];
};

const GENERATORER: Generator[] = [
  {
    id: 'c1',
    namn: 'Betalningskvitto',
    byggsUr: ['Namn', 'E-post', 'Betalt belopp', 'Betaldatum', 'Eventnamn'],
  },
];

/* ------------------------------------------------------------------ *
 * Radformerna — en per klass, eftersom klasserna bär olika sanningar.
 * ------------------------------------------------------------------ */

/**
 * Metaraden under namnet. Klass A är den enda som kan bära storlek: de andra
 * två har ingen fil förrän utskicket sker, och en påhittad storlek vore en
 * osanning (samma regel som deltagarkortets "frånvaron är informationen").
 */
function MetaRad({ delar }: { delar: (string | null)[] }) {
  const text = delar.filter(Boolean).join(' · ');
  if (!text) return null;
  return <span className="text-caption text-text-muted">{text}</span>;
}

function FilRad({ fil }: { fil: UppladdadFil }) {
  return (
    <div data-testid="dokument-fil" className="flex items-start gap-3 py-3">
      <FileText aria-hidden="true" size={18} className="mt-0.5 shrink-0 text-text-muted" />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="break-words font-medium text-body">{fil.namn}</span>
        <MetaRad
          delar={[
            fil.storlek,
            `Uppladdad ${fil.uppladdad}`,
            fil.anvandsI > 0 ? `Bifogas i ${fil.anvandsI} event` : 'Används inte än',
          ]}
        />
        {/* ERSÄTTNINGEN SYNS (underlagets krav: "hur en ersatt version syns").
            Den gamla filen är borta ur väljaren, men att den FANNS är sådant
            Lotta behöver veta när ett gammalt utskick refereras. */}
        {fil.ersatte && (
          <span className="text-caption text-text-secondary">
            Ersatte en tidigare version från {fil.ersatte}
          </span>
        )}
      </span>
      <Button intent="ghost" size="sm">
        Ersätt
      </Button>
    </div>
  );
}

function MallRad({ mall }: { mall: Mall }) {
  return (
    <div data-testid="dokument-mall" className="flex items-start gap-3 py-3">
      <Sparkles aria-hidden="true" size={18} className="mt-0.5 shrink-0 text-text-muted" />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="break-words font-medium text-body">{mall.namn}</span>
        <MetaRad delar={[`Fyller i ${mall.fyllerI.join(', ').toLowerCase()}`]} />
      </span>
      <Button intent="ghost" size="sm">
        Visa
      </Button>
    </div>
  );
}

function GeneratorRad({ gen }: { gen: Generator }) {
  return (
    <div data-testid="dokument-generator" className="flex items-start gap-3 py-3">
      <UserRound aria-hidden="true" size={18} className="mt-0.5 shrink-0 text-text-muted" />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="break-words font-medium text-body">{gen.namn}</span>
        <MetaRad delar={[`Byggs ur ${gen.byggsUr.join(', ').toLowerCase()}`]} />
      </span>
      <Button intent="ghost" size="sm">
        Visa
      </Button>
    </div>
  );
}

/** Förklaringsraden per grupp — Gunilla-principen: inget antas känt. */
function GruppText({ children }: { children: string }) {
  return <p className="py-3 text-small text-text-secondary">{children}</p>;
}

export function DokumentYta() {
  return (
    <section className="flex flex-col gap-4 p-4">
      <Link to="/mer" className="text-small underline">
        ← Tillbaka till Mer
      </Link>

      <header className="flex flex-col gap-1">
        <h1 className="font-semibold text-2xl">Dokument</h1>
        <p className="text-small text-text-muted">
          {UPPLADDADE.length + MALLAR.length + GENERATORER.length} saker som kan bifogas i utskick
        </p>
      </header>

      <div className="flex flex-col gap-6">
        {/* KLASS A — den enda gruppen med en riktig fil att förvalta, och
            därmed den enda med uppladdning. `TASK-146`:s UI-konsument. */}
        <DetaljGrupp id="grupp-uppladdade" rubrik="Uppladdade filer">
          <GruppText>
            Färdiga PDF:er som du laddat upp. Samma fil skickas till alla som får den.
          </GruppText>
          {UPPLADDADE.map((f) => (
            <FilRad key={f.id} fil={f} />
          ))}
          <div className="py-3">
            <Button intent="secondary">
              <Upload aria-hidden="true" size={16} className="shrink-0" />
              Ladda upp en fil
            </Button>
          </div>
        </DetaljGrupp>

        {/* KLASS B — ingen fil förrän ett event valts. Ingen uppladdning:
            mallarna är systemets, inte Lottas att lägga till. */}
        <DetaljGrupp id="grupp-mallar" rubrik="Event-mallar">
          <GruppText>
            Brev där eventets egna uppgifter fylls i automatiskt. Alla på samma event får samma
            brev.
          </GruppText>
          {MALLAR.map((m) => (
            <MallRad key={m.id} mall={m} />
          ))}
        </DetaljGrupp>

        {/* KLASS C — den klass som gör bilageväljaren till något annat än en
            filväljare: EN FIL PER MOTTAGARE. Det står i klartext här så att
            väljaren inte behöver förklara det en gång till. */}
        <DetaljGrupp id="grupp-genererade" rubrik="Skapas för varje person">
          <GruppText>
            Byggs på plats ur personens egna uppgifter. Skickar du till sex personer skapas sex
            olika filer - en åt var och en.
          </GruppText>
          {GENERATORER.map((g) => (
            <GeneratorRad key={g.id} gen={g} />
          ))}
        </DetaljGrupp>
      </div>

      <p className="text-small text-text-muted">
        <strong className="font-medium">Prototyp.</strong> Innehållet är påhittat -
        bilage-fundamentet (TASK-146) är inte byggt. Inget laddas upp, inget sparas.
      </p>
    </section>
  );
}
