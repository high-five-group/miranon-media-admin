import * as Sentry from '@sentry/react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Lock } from 'lucide-react';
import { type FormEvent, useEffect, useId, useState } from 'react';
import { Button, Input, MessageBox } from '@/components/primitives';
import { supabase } from '@/data/config/supabase-client';
import { checkPasswordBreached } from '@/lib/auth/pwnedPasswordCheck';

export const Route = createFileRoute('/nytt-losenord')({
  staticData: { title: 'Nytt lösenord' },
  component: NyttLosenordRoute,
});

/**
 * Sätt-nytt-lösenord-sidan (TASK-127.7, ADR-093). Landningssidan för
 * `resetPasswordForEmail`s mail-länk (`supabase/templates/recovery.html`,
 * `redirectTo` satt i `src/routes/glomt-losenord.tsx`) — samma säkerhets-
 * golv som accept-sidan (AC #3, `src/routes/valkommen.tsx`, TASK-127.6):
 * minst 8 tecken (ASVS 6.2.1), kontroll mot läckta lösenord via
 * `checkPasswordBreached` (ÅTERANVÄND OFÖRÄNDRAD — ingen andra variant
 * byggd, se `src/lib/auth/pwnedPasswordCheck.ts`), generiskt vänligt
 * felläge (ASVS 6.5.1/6.4.1).
 *
 * HUR SESSIONEN UPPSTÅR — IDENTISKT MED valkommen.tsx: Supabases recovery-
 * mail länkar hit med access/refresh-token i URL:ens HASH-fragment (implicit
 * flow). Klientens `detectSessionInUrl: true` (default) konsumerar
 * fragmentet och persisterar sessionen INNAN denna komponent hinner mounta.
 * `getSession()` väntar internt in den processen — Supabases egen
 * dokumentation (context7, `guides/auth/passwords.mdx`): "the password
 * reset page can call `updateUser({password})` directly because the session
 * is already initialized." Ingen `verifyOtp`-anrop, ingen MFA-utmaning
 * (v1 har inga MFA-registrerade användare — TOTP är öppet skjutet,
 * ADR-093 beslut 3 — så Supabase Studios egen MFA-grenade recovery-flow
 * är irrelevant scope här).
 *
 * ENUMERATION-NEUTRALT (AC #2) FÖLJER AV SAMMA MEKANIK SOM valkommen.tsx:
 * en ogiltig, förbrukad ELLER obefintlig länk ger alla samma observerbara
 * utfall härifrån — `getSession()` returnerar `null`, ingen kod-väg skiljer
 * "utgången" från "redan använd" från "aldrig utfärdad".
 *
 * DIVERGENS MOT valkommen.tsx, ÖPPET BOKFÖRD: ingen TTL-fotnot under
 * kortet. Den fotnoten informerar om en länk som INTE ÄNNU använts — här
 * har länken redan fungerat (sidan renderar bara OM sessionen finns), så
 * samma text hade varit missvisande snarare än informativ. "Ogiltig
 * länk"-läget har i stället en CTA till `/glomt-losenord` (begär en NY
 * länk) i stället för `/login` — självbetjäning finns här (till skillnad
 * från invite, som saknar en omskicksyta i appen ännu), så CTA:n pekar dit
 * user story 5 faktiskt löser problemet.
 */
function NyttLosenordRoute() {
  const [tillstand, setTillstand] = useState<'laddar' | 'formular' | 'ogiltig-lank' | 'klart'>(
    'laddar',
  );
  const [epost, setEpost] = useState('');

  useEffect(() => {
    let mounted = true;
    const rot = document.documentElement;
    rot.dataset.authFond = 'true';

    supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (!mounted) return;
        if (window.location.hash.length > 1) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
        if (error) Sentry.captureException(error, { tags: { auth: 'nytt-losenord-getSession' } });
        if (!session?.user?.email) {
          setTillstand('ogiltig-lank');
          return;
        }
        setEpost(session.user.email);
        setTillstand('formular');
      })
      .catch((err) => {
        if (!mounted) return;
        Sentry.captureException(err, { tags: { auth: 'nytt-losenord-getSession-throw' } });
        setTillstand('ogiltig-lank');
      });

    return () => {
      mounted = false;
      delete rot.dataset.authFond;
    };
  }, []);

  return (
    <main className="flex min-h-dvh w-full items-center justify-center p-4 sm:p-8 lg:p-12">
      {tillstand === 'laddar' && (
        <div role="status" aria-live="polite" className="text-body text-text-secondary">
          Kontrollerar din länk …
        </div>
      )}
      {tillstand === 'ogiltig-lank' && <OgiltigLank />}
      {tillstand === 'formular' && <LosenordsFormular epost={epost} onUtfall={setTillstand} />}
      {tillstand === 'klart' && <LosenordSparat />}
    </main>
  );
}

/** AC #2 — förbrukad, utgången eller obefintlig länk. Medvetet GENERISK
 * (ingen orsak anges, enumeration-neutralt) — men CTA:n skiljer sig från
 * valkommen.tsx:s motsvarighet: `/glomt-losenord` erbjuder en RIKTIG
 * självbetjäningsväg (till skillnad från invite-omskick, som saknas i
 * appen ännu), så vägen framåt är en knapp här, inte en mänsklig begäran. */
function OgiltigLank() {
  return (
    <div className="flex w-full max-w-md flex-col gap-8">
      <div className="flex flex-col gap-5 rounded-2xl border border-border-light bg-surface p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-2">
          <h1 className="font-semibold text-3xl text-text">Länken fungerar inte längre</h1>
          <p className="text-body text-text-secondary">
            Den här återställningslänken är antingen redan använd eller har gått ut. Begär en ny
            länk, så är du igång på nolltid.
          </p>
        </div>
        <Link
          to="/glomt-losenord"
          className="text-(color:--mm-button-primary-text) inline-flex min-h-12 select-none items-center justify-center gap-2 self-start rounded bg-(--mm-button-primary-bg) px-5 text-center text-lg transition-colors hover:bg-(--mm-button-primary-bg-hover)"
        >
          Begär en ny länk
        </Link>
      </div>
    </div>
  );
}

function LosenordSparat() {
  return (
    <div className="flex w-full max-w-md flex-col gap-8">
      <div className="flex flex-col gap-5 rounded-2xl border border-border-light bg-surface p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-2">
          <h1 className="font-semibold text-3xl text-text">Lösenordet är sparat</h1>
          <p className="text-body text-text-secondary">Du kan nu logga in med ditt nya lösenord.</p>
        </div>
        <Link
          to="/login"
          className="text-(color:--mm-button-primary-text) inline-flex min-h-12 select-none items-center justify-center gap-2 self-start rounded bg-(--mm-button-primary-bg) px-5 text-center text-lg transition-colors hover:bg-(--mm-button-primary-bg-hover)"
        >
          Logga in
        </Link>
      </div>
    </div>
  );
}

interface LosenordsFormularProps {
  epost: string;
  /** `'ogiltig-lank'` täcker fallet där sessionen dör MITT I flödet (token
   * hann gå ut medan formuläret var öppet) — samma vänliga yta som en direkt
   * ogiltig länk (AC #2). */
  onUtfall: (utfall: 'ogiltig-lank' | 'klart') => void;
}

/**
 * Formuläret — strukturellt en KOPIA av valkommen.tsx:s `LosenordsFormular`
 * (samma ASVS-golv, AC #3), med anpassad copy. E-post readonly + hänglås-
 * ikon ger användaren kontext ("det här är kontot jag återställer") — samma
 * motivering som accept-sidan.
 */
function LosenordsFormular({ epost, onUtfall }: LosenordsFormularProps) {
  const emailFaltId = useId();
  const emailBeskrivningId = useId();
  const [losenord, setLosenord] = useState('');
  const [visaLosenord, setVisaLosenord] = useState(false);
  const [status, setStatus] = useState<'vila' | 'sparar'>('vila');
  const [fel, setFel] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFel(null);

    // ASVS 6.2.1 — golvet (8 tecken) upprätthålls klientsidan direkt, samma
    // gren-innan-nätverk-mönster som valkommen.tsx.
    if (losenord.length < 8) {
      setFel('Lösenordet behöver vara minst 8 tecken.');
      return;
    }

    setStatus('sparar');

    // ASVS 6.2.4/6.2.12 — se src/lib/auth/pwnedPasswordCheck.ts för det fulla
    // resonemanget. ÅTERANVÄND OFÖRÄNDRAD (kortets uttryckliga krav).
    const breach = await checkPasswordBreached(losenord);
    if (breach?.breached) {
      setFel(
        'Det lösenordet har förekommit i tidigare dataintrång och är inte säkert att använda. Välj ett annat.',
      );
      setStatus('vila');
      return;
    }
    if (breach === null) {
      // Fail-open (modulens topp-kommentar) — kontrollen kunde inte
      // genomföras, men blockerar inte lösenordsbytet.
      Sentry.captureMessage('Läckt-lösenord-kontroll kunde inte genomföras (fail-open)', {
        level: 'warning',
        tags: { auth: 'nytt-losenord-breach-check' },
      });
    }

    const { error } = await supabase.auth.updateUser({ password: losenord });
    if (error) {
      Sentry.captureException(error, { tags: { auth: 'nytt-losenord-updateUser' } });
      setStatus('vila');
      // Sessionen dog mitt i flödet — samma vänliga felläge som en direkt
      // ogiltig länk (AC #2), aldrig en rå felkod.
      if (error.code === 'session_not_found' || error.code === 'session_expired') {
        onUtfall('ogiltig-lank');
        return;
      }
      // Copy-domarna (research-passet § 5/§ 7.3, TASK-285.8): "Något gick
      // fel ... Försök igen" faller på GOV.UK/NN/g — huvudsatsen bär ingen
      // orsak. Ersatt med ett specifikt problem + en genuint hållbar
      // uppmaning (retry KAN lyckas: det är oftast en transient 5xx/nätverksfel).
      setFel('Lösenordet kunde inte sparas just nu. Försök igen om en liten stund.');
      return;
    }

    // Samma konvergens-signal som valkommen.tsx: nästa steg är ETT medvetet
    // inloggningsmoment, inte en session som råkar redan finnas kvar.
    const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' });
    if (signOutError) {
      Sentry.captureException(signOutError, {
        tags: { auth: 'nytt-losenord-signOut-post-reset' },
      });
      // Utloggningen misslyckades — lösenordet är ändå sparat (updateUser
      // lyckades ovan). Visa framgång ändå, se valkommen.tsx:s motsvarande
      // resonemang.
    }
    setStatus('vila');
    onUtfall('klart');
  };

  return (
    <div className="flex w-full max-w-md flex-col gap-8">
      <form
        onSubmit={(e) => {
          void handleSubmit(e);
        }}
        className="flex flex-col gap-4 rounded-2xl border border-border-light bg-surface p-4 shadow-sm sm:gap-5 sm:p-8"
        aria-busy={status === 'sparar'}
        noValidate
      >
        {/* INGEN aria-labelledby på formuläret (avvikelse mot login.tsx,
            avsiktlig — matchar valkommen.tsx:s LosenordsFormular i stället):
            rubrikens text ("Sätt nytt lösenord") delar substrängen "nytt
            lösenord" med fältets egen etikett ("Nytt lösenord"), vilket gör
            Playwrights `getByLabel`-substrängsmatchning tvetydig mellan
            formuläret och fältet (fångat skarpt av
            tests/webblasarbeteende/nytt-losenord.test.ts). Ensamt formulär
            på sidan — ingen landmärkes-disambiguering behövs. */}
        <div className="flex flex-col gap-2">
          <h1 className="font-semibold text-3xl text-text">Sätt nytt lösenord</h1>
          <p className="text-body text-text-secondary">Välj ett nytt lösenord för ditt konto.</p>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={emailFaltId} className="text-(color:--mm-input-label-text) text-small">
            E-postadress
          </label>
          <div className="relative">
            <Lock
              aria-hidden="true"
              className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-muted"
            />
            <input
              id={emailFaltId}
              type="email"
              value={epost}
              readOnly
              aria-describedby={emailBeskrivningId}
              className="text-(color:--mm-input-text) w-full cursor-default rounded border border-(--mm-input-border) bg-bg-muted py-2.5 pr-3 pl-9 text-body"
            />
          </div>
          <p
            id={emailBeskrivningId}
            className="text-(color:--mm-input-description-text) text-caption"
          >
            Det nya lösenordet gäller för det här kontot.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          {/* validationBehavior="aria" — samma byggkrav som valkommen.tsx
              (React Arias native-läge blockerar ett andra försök tyst). */}
          <Input
            label="Nytt lösenord"
            type={visaLosenord ? 'text' : 'password'}
            autoComplete="new-password"
            validationBehavior="aria"
            value={losenord}
            onChange={setLosenord}
            isRequired
            isDisabled={status === 'sparar'}
            isInvalid={!!fel}
            description="Minst 8 tecken. Vi rekommenderar 15 eller fler för extra trygghet."
          />
          <button
            type="button"
            aria-pressed={visaLosenord}
            onClick={() => setVisaLosenord((v) => !v)}
            className="text-(color:--mm-accent) self-end rounded text-small underline-offset-2 hover:underline focus-visible:outline-(--mm-focus-ring) focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            {visaLosenord ? 'Dölj lösenord' : 'Visa lösenord'}
          </button>
        </div>

        {fel && (
          <MessageBox
            intent="error"
            title="Något stämmer inte"
            className="motion-safe:animate-mm-avsloj"
          >
            {fel}
          </MessageBox>
        )}

        <Button type="submit" size="lg" isLoading={status === 'sparar'} loadingText="Sparar …">
          Spara nytt lösenord
        </Button>
      </form>
    </div>
  );
}
