/**
 * [PROTOTYPE] TASK-127.2 — Variant A: MINIMAL OCH FOKUSERAD.
 *
 * FRÅGAN (throwaway-kontraktets klausul i): "Hur ska login-vyn och
 * accept-sidan se ut?" — auth-prototypens divergensfas, monterad på
 * dev-routen `/dev/auth-prototyp` (ADR-074 UI-underform B: ingen befintlig
 * sida binder ihop login + en ännu icke-byggd accept-sida).
 *
 * HÅLLNING — en sak i taget, maximalt lugn:
 * - Login delas upp i TVÅ steg (e-post → lösenord) så bara ETT fält är i
 *   fokus åt gången (Linear/Stripe-mönstret för inloggning — branschledarnas
 *   progressive-disclosure-form, inte en hemmasnickrad idé).
 * - Accept-sidan förblir ETT steg: enda ifyllbara fältet är lösenordet
 *   (e-posten är låst av inbjudan, ADR-092 beslut 2) — en uppdelning hade
 *   varit teater utan ett andra fält att skjuta upp.
 * - Enda-fält-lösenordet ERSÄTTER dubbel-inmatning (lösenord + bekräfta):
 *   ett visa/dölj-öga (samma branschmönster) eliminerar behovet av ett andra
 *   fält — en rad mindre på skärmen, inte en genväg.
 *
 * KASTBAR KOD (throwaway-kontraktet, klausul iv): ingen riktig Supabase-auth
 * anropas. "Loggar in"/"Skapar lösenord" simuleras lokalt (kort setTimeout)
 * så fel- och successläget går att bedöma utan backend.
 *
 * DEMO-FACIT: skriv "fel" som lösenord i login-steg 2 för att se felläget.
 */
import { Eye, EyeOff } from 'lucide-react';
import { type FormEvent, type ReactNode, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/primitives/Button';
import { Input } from '@/components/primitives/Input';
import { MessageBox } from '@/components/primitives/MessageBox';

// ═══════════════════════════ DELAT (inom Variant A) ═══════════════════════

function AuthCard({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-2xl border border-border-light bg-surface p-8 shadow-sm sm:p-10">
      <img src="/miranon-logo.svg" alt="" width={40} height={40} className="shrink-0" />
      {children}
    </div>
  );
}

/** Lösenordsfält med visa/dölj-växel — delat av login-steg 2 och accept-sidan. */
function LosenordsFalt({
  label,
  value,
  onChange,
  description,
  errorMessage,
  isInvalid,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (varde: string) => void;
  description?: string;
  errorMessage?: string;
  isInvalid?: boolean;
  autoComplete: 'current-password' | 'new-password';
}) {
  const [synligt, setSynligt] = useState(false);
  return (
    <div className="flex w-full flex-col gap-1.5">
      <Input
        label={label}
        type={synligt ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        description={description}
        errorMessage={errorMessage}
        isInvalid={isInvalid}
        autoComplete={autoComplete}
        size="lg"
        isRequired
        // `validationBehavior="aria"` — vi styr isInvalid/errorMessage helt
        // själva (ingen HTML-constraint-attribut som pattern/minLength).
        // React Arias DEFAULT ('native') speglar isInvalid via
        // input.setCustomValidity(felmeddelandet), och webbläsaren rensar
        // ALDRIG den strängen bara för att värdet ändras — den rensas bara
        // av en lyckad native submit. Nästa försök blockeras då tyst av
        // webbläsarens EGEN validering INNAN onSubmit ens hinner köra
        // (reproducerat skarpt: input.validity.customError förblev true
        // med ett giltigt nytt värde, submit-eventet nådde aldrig React).
        // 'aria' stänger av den native vägen och låter ARIA-annonseringen
        // (redan verifierad ovan) bära hela felsemantiken.
        validationBehavior="aria"
      />
      <button
        type="button"
        onClick={() => setSynligt((v) => !v)}
        className="inline-flex w-fit items-center gap-1 text-caption text-text-secondary underline underline-offset-2 hover:text-text focus-visible:outline-2 focus-visible:outline-border-focus focus-visible:outline-offset-2"
      >
        {synligt ? (
          <>
            <EyeOff aria-hidden className="size-3.5" /> Dölj lösenord
          </>
        ) : (
          <>
            <Eye aria-hidden className="size-3.5" /> Visa lösenord
          </>
        )}
      </button>
    </div>
  );
}

// ═══════════════════════════════ LOGIN ═════════════════════════════════

type LoginSteg = 'epost' | 'losenord' | 'inloggad';

export function LoginVariantA() {
  const [steg, setSteg] = useState<LoginSteg>('epost');
  const [epost, setEpost] = useState('');
  const [losenord, setLosenord] = useState('');
  const [fel, setFel] = useState<string | null>(null);
  const [visaGlomtNot, setVisaGlomtNot] = useState(false);
  const [laddar, setLaddar] = useState(false);
  const rubrikRef = useRef<HTMLHeadingElement>(null);

  // Fokus flyttas till nästa stegs rubrik (bekraftelseRef-mönstret,
  // ManuellAnmalanForm.tsx) — aldrig kvar på en knapp som just försvann.
  useEffect(() => {
    if (steg !== 'epost') rubrikRef.current?.focus();
  }, [steg]);

  const epostGiltig = epost.includes('@') && epost.trim().length > 3;

  const fortsatt = (e: FormEvent) => {
    e.preventDefault();
    if (!epostGiltig) return;
    setSteg('losenord');
  };

  const loggaIn = (e: FormEvent) => {
    e.preventDefault();
    setFel(null);
    setLaddar(true);
    window.setTimeout(() => {
      setLaddar(false);
      if (losenord.trim().toLowerCase() === 'fel') {
        setFel('Felaktiga inloggningsuppgifter. Försök igen.');
        return;
      }
      setSteg('inloggad');
    }, 700);
  };

  const bornOm = () => {
    setSteg('epost');
    setEpost('');
    setLosenord('');
    setFel(null);
    setVisaGlomtNot(false);
  };

  if (steg === 'inloggad') {
    return (
      <AuthCard>
        <div className="flex w-full flex-col items-center gap-6 motion-safe:animate-mm-avsloj">
          <h1
            ref={rubrikRef}
            tabIndex={-1}
            className="text-center font-semibold text-2xl text-text outline-none"
          >
            Inloggad!
          </h1>
          <MessageBox intent="success">
            Prototyp — ingen riktig inloggning sker. I den skarpa vyn hade du nu sett startsidan.
          </MessageBox>
          <Button intent="secondary" size="lg" className="w-full" onPress={bornOm}>
            Börja om
          </Button>
        </div>
      </AuthCard>
    );
  }

  if (steg === 'losenord') {
    return (
      <AuthCard>
        <div className="flex w-full flex-col items-center gap-6 motion-safe:animate-mm-avsloj">
          <h1
            ref={rubrikRef}
            tabIndex={-1}
            className="text-center font-semibold text-2xl text-text outline-none"
          >
            Ange ditt lösenord
          </h1>
          <div className="flex w-full items-center justify-between gap-2 rounded-lg bg-bg-muted px-3 py-2">
            <span className="truncate text-small text-text-secondary">{epost}</span>
            <button
              type="button"
              onClick={() => setSteg('epost')}
              className="shrink-0 text-caption text-text-secondary underline underline-offset-2 hover:text-text focus-visible:outline-2 focus-visible:outline-border-focus focus-visible:outline-offset-2"
            >
              Byt
            </button>
          </div>
          <form onSubmit={loggaIn} className="flex w-full flex-col gap-4">
            {/* Dold användarindikator: hjälper lösenordshanterare koppla ihop
                de två stegen till EN inloggning (Credential Management-
                rekommendationen för flerstegs-login). */}
            <input type="hidden" name="username" autoComplete="username" value={epost} readOnly />
            <LosenordsFalt
              label="Lösenord"
              value={losenord}
              onChange={setLosenord}
              autoComplete="current-password"
              isInvalid={!!fel}
            />
            {fel && (
              <MessageBox intent="error" title="Kunde inte logga in">
                {fel}
              </MessageBox>
            )}
            <Button
              type="submit"
              intent="primary"
              size="lg"
              isPending={laddar}
              isDisabled={laddar}
              className="w-full"
            >
              {laddar ? 'Loggar in…' : 'Logga in'}
            </Button>
          </form>
          <button
            type="button"
            onClick={() => setVisaGlomtNot((v) => !v)}
            className="text-caption text-text-secondary underline underline-offset-2 hover:text-text focus-visible:outline-2 focus-visible:outline-border-focus focus-visible:outline-offset-2"
          >
            Glömt lösenordet?
          </button>
          {visaGlomtNot && (
            <p className="text-center text-caption text-text-muted">
              Eget kort (TASK-127.7) — visas inte i den här prototypen.
            </p>
          )}
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <h1 className="text-center font-semibold text-2xl text-text">Logga in</h1>
      <p className="text-center text-body text-text-secondary">
        Ange din e-postadress för att fortsätta.
      </p>
      <form onSubmit={fortsatt} className="flex w-full flex-col gap-4">
        <Input
          label="E-postadress"
          type="email"
          value={epost}
          onChange={setEpost}
          autoComplete="email"
          size="lg"
          isRequired
        />
        <Button
          type="submit"
          intent="primary"
          size="lg"
          isDisabled={!epostGiltig}
          className="w-full"
        >
          Fortsätt
        </Button>
      </form>
      <p className="text-center text-caption text-text-muted">
        Konton skapas via inbjudan. Saknar du en? Hör av dig till Roger eller Lotta.
      </p>
    </AuthCard>
  );
}

// ═══════════════════════════════ ACCEPT ═════════════════════════════════

/**
 * Demo-mottagare: den kanoniska icke-tekniska referenspersonen
 * (Gunilla-principen), inte en gissad e-postadress för den riktiga Lotta —
 * en fixture ska aldrig kunna förväxlas med en riktig persons faktiska
 * uppgifter.
 */
const DEMO_MOTTAGARE = {
  namn: 'Gunilla',
  epost: 'gunilla.ekstrom@miranon.dev',
};

type AcceptSteg = 'formular' | 'klar';

export function AcceptVariantA() {
  const [steg, setSteg] = useState<AcceptSteg>('formular');
  const [losenord, setLosenord] = useState('');
  const [fel, setFel] = useState<string | null>(null);
  const [laddar, setLaddar] = useState(false);
  const rubrikRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (steg === 'klar') rubrikRef.current?.focus();
  }, [steg]);

  const skapa = (e: FormEvent) => {
    e.preventDefault();
    setFel(null);
    if (losenord.trim().length < 8) {
      setFel('Lösenordet behöver vara minst 8 tecken — testa att lägga till ett par till.');
      return;
    }
    setLaddar(true);
    window.setTimeout(() => {
      setLaddar(false);
      setSteg('klar');
    }, 700);
  };

  if (steg === 'klar') {
    return (
      <AuthCard>
        <div className="flex w-full flex-col items-center gap-6 motion-safe:animate-mm-avsloj">
          <h1
            ref={rubrikRef}
            tabIndex={-1}
            className="text-center font-semibold text-2xl text-text outline-none"
          >
            Klart, {DEMO_MOTTAGARE.namn}!
          </h1>
          <MessageBox intent="success">
            Prototyp — inget riktigt konto skapas. I den skarpa vyn hade du nu varit inloggad.
          </MessageBox>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <h1 className="text-center font-semibold text-2xl text-text">
        Välkommen, {DEMO_MOTTAGARE.namn}!
      </h1>
      <p className="text-center text-body text-text-secondary">
        Sätt ett lösenord så är kontot klart att använda.
      </p>
      <form onSubmit={skapa} className="flex w-full flex-col gap-4">
        {/* Låst per ADR-092 beslut 2: mottagaren väljer varken roll eller
            e-post själv. `isReadOnly` (inte `isDisabled`) är ett medvetet
            val — fältet förblir i tabbordningen och annonseras normalt av
            skärmläsare i stället för att hoppas över, vilket är WAI-ARIA-
            praxisens rekommendation för "synligt men olåsbart värde". */}
        <Input
          label="E-postadress"
          value={DEMO_MOTTAGARE.epost}
          isReadOnly
          size="lg"
          description="Hör till din inbjudan och går inte att ändra."
        />
        <LosenordsFalt
          label="Välj ett lösenord"
          value={losenord}
          onChange={setLosenord}
          autoComplete="new-password"
          description="Minst 8 tecken. Undvik enkla lösenord som ditt namn eller '12345678'."
          errorMessage={fel ?? undefined}
          isInvalid={!!fel}
        />
        <Button
          type="submit"
          intent="primary"
          size="lg"
          isPending={laddar}
          isDisabled={laddar}
          className="w-full"
        >
          {laddar ? 'Skapar lösenord…' : 'Skapa lösenord och logga in'}
        </Button>
      </form>
      <p className="text-center text-caption text-text-muted">
        Länken gäller i 24 timmar från att den skickades.
      </p>
    </AuthCard>
  );
}
