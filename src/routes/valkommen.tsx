import * as Sentry from '@sentry/react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Clock, Lock } from 'lucide-react';
import { type FormEvent, type ReactNode, useEffect, useId, useState } from 'react';
import { Button, Input, MessageBox } from '@/components/primitives';
import { supabase } from '@/data/config/supabase-client';
import { checkPasswordBreached } from '@/lib/auth/pwnedPasswordCheck';

export const Route = createFileRoute('/valkommen')({
  staticData: { title: 'Välkommen' },
  component: ValkommenRoute,
});

/**
 * Accept-sidan (TASK-127.6, ADR-092 beslut 2, ADR-093 beslut 1). Den nya
 * publika sidan där en användarinbjudan landar: e-postadressen förifylld
 * och OREDIGERBAR, mottagaren sätter lösenord enligt ASVS 5.0 V6-golvet.
 *
 * SKARP NYSKRIVNING — prototypkoden (TASK-127.2,
 * `src/components/dev/prototyp-auth/VariantB.tsx`) är kastbar per
 * throwaway-kontraktet och rörs aldrig här. Facit (visuell form, layout,
 * copy-struktur) bor i
 * `tasks/sessions/bilagor/s96-auth-prototyp-facit/inbjudan-*.png` +
 * README.md i samma katalog.
 *
 * HUR SESSIONEN UPPSTÅR: Supabases invite-mail länkar till `/valkommen`
 * med access/refresh-token i URL:ens HASH-fragment (implicit flow — appens
 * enda Supabase-klient sätter ingen `flowType`, och supabase-js defaultar
 * till `implicit`, verifierat mot Supabase-dokumentationen). Klientens
 * `detectSessionInUrl: true` (default) konsumerar fragmentet OCH
 * persisterar sessionen INNAN denna komponent hinner mounta — `getSession()`
 * väntar internt in den processen (samma mönster Supabase dokumenterar för
 * lösenordsåterställning: "the password reset page can call
 * `updateUser({password})` directly because the session is already
 * initialized"). Ingen manuell `verifyOtp`-anrop behövs alltså.
 *
 * ENUMERATION-NEUTRALT (ASVS 6.3.8, AC #3) FÖLJER AV MEKANIKEN, INTE AV EN
 * SÄRSKILD GREN: en ogiltig, förbrukad ELLER obefintlig länk ger alla
 * samma observerbara utfall härifrån — `getSession()` returnerar `null`.
 * Sidan har ingen kod-väg som skiljer "utgången" från "redan använd" från
 * "aldrig utfärdad", så det finns inget att läcka.
 */
function ValkommenRoute() {
  const [tillstand, setTillstand] = useState<'laddar' | 'formular' | 'ogiltig-lank' | 'klart'>(
    'laddar',
  );
  const [epost, setEpost] = useState('');
  const [rollEtikett, setRollEtikett] = useState('');
  const [mottagarNamn, setMottagarNamn] = useState<string | null>(null);
  const [inbjudarNamn, setInbjudarNamn] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    // Varm fond över hela ytan (base.css `[data-auth-fond="true"]`,
    // permanent infrastruktur sedan S96 — se facit-README:ns
    // "Rännstenen"-avsnitt). Städas vid unmount så appen aldrig ärver den.
    const rot = document.documentElement;
    rot.dataset.authFond = 'true';

    supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (!mounted) return;
        // Hash-fragmentet (token ELLER `#error=…`) har nu konsumerats av
        // klienten oavsett utfall — städa adressraden så ingen token/felkod
        // ligger kvar synlig i historik eller vid kopierad URL.
        if (window.location.hash.length > 1) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
        if (error) Sentry.captureException(error, { tags: { auth: 'valkommen-getSession' } });
        if (!session?.user?.email) {
          setTillstand('ogiltig-lank');
          return;
        }
        setEpost(session.user.email);
        setRollEtikett(rollTillEtikett(session.user.app_metadata?.role));
        // TASK-143: invite-user-EF:en sätter dessa i user_metadata vid
        // inbjudan (samma icke-säkerhetsbärande fält och samma läsmönster
        // som AuthProvider.tsx:s task-1.1-namekälla) — `lasStrangMetadata`
        // ger `null` (aldrig ett tomt/whitespace-fält) för en session utan
        // dem, så greeting-blocket nedan degraderar snyggt.
        setMottagarNamn(lasStrangMetadata(session.user.user_metadata?.display_name));
        setInbjudarNamn(lasStrangMetadata(session.user.user_metadata?.inviter_name));
        setTillstand('formular');
      })
      .catch((err) => {
        if (!mounted) return;
        Sentry.captureException(err, { tags: { auth: 'valkommen-getSession-throw' } });
        setTillstand('ogiltig-lank');
      });

    return () => {
      mounted = false;
      delete rot.dataset.authFond;
    };
  }, []);

  return (
    <main className="flex min-h-dvh w-full items-center justify-center p-6 sm:p-8 lg:p-12">
      {tillstand === 'laddar' && (
        <div role="status" aria-live="polite" className="text-body text-text-secondary">
          Kontrollerar din inbjudan …
        </div>
      )}
      {tillstand === 'ogiltig-lank' && <OgiltigLank />}
      {tillstand === 'formular' && (
        <LosenordsFormular
          epost={epost}
          rollEtikett={rollEtikett}
          mottagarNamn={mottagarNamn}
          inbjudarNamn={inbjudarNamn}
          onUtfall={setTillstand}
        />
      )}
      {tillstand === 'klart' && <KontotSkapat />}
    </main>
  );
}

/** v1-allowlisten (TASK-127.5) tillåter bara `'admin'` — men rollen kommer
 * ur en JWT-claim (attacker-uncontrollable via appen, men inte immun mot
 * framtida serverändringar), så en okänd framtida roll visas rått i
 * stället för att tystas bort (Roger-linsen: hellre synligt konstigt än
 * osynligt fel). */
function rollTillEtikett(roll: unknown): string {
  if (roll === 'admin') return 'administratör';
  return typeof roll === 'string' && roll.length > 0 ? roll : 'användare';
}

/**
 * `user_metadata` är otypad (`Record<string, any>`, samma anmärkning som
 * `AuthProvider.tsx`s `sessionToUser`) — endast en icke-tom sträng
 * accepteras, allt annat (saknas, fel typ, whitespace) → `null`. Delad av
 * mottagarens `display_name` och inbjudarens `inviter_name` (TASK-143,
 * båda satta av invite-user-EF:en, se `src/routes/valkommen.tsx` § greeting
 * i `LosenordsFormular` nedan för hur `null` degraderar).
 */
function lasStrangMetadata(varde: unknown): string | null {
  return typeof varde === 'string' && varde.trim() !== '' ? varde.trim() : null;
}

/**
 * En äkta `<a>`-länk (TanStack Routers `Link`) stylad som Button-
 * primitivens `intent="primary" size="lg"`-variant. `Button.tsx`s
 * `buttonVariants` (cva) är INTE exporterad ur modulen (avsiktligt privat
 * — inget annat ställe i appen återanvänder den externt heller), och
 * React Arias `Button` har ingen polymorf "rendera som länk"-prop i den
 * versionen komponenten är byggd mot. En knapp som NAVIGERAR ska vara en
 * riktig länk (cmd/ctrl-klick i ny flik, kopiera länk, `role="link"` för
 * skärmläsare) — inte en `<button>` med `onPress`-navigering, så
 * dubblering av de synliga klasserna är rätt val här, inte ett genvägs-
 * hack. Fokusring kommer automatiskt av base.css:s globala
 * `*:focus-visible`-regel (samma mekanism som Button-primitiven lutar sig
 * mot) — ingen egen fokus-CSS behövs.
 *
 * `to="/login"` HÅRDKODAT: TanStack Routers `Link` typar `to` mot
 * routeträdets literal-union, inte mot `string` — båda anropsplatserna på
 * denna sida pekar mot samma mål, så en generisk `to`-prop hade bara
 * krävt en typ-vidgning utan att någon uppringare behöver den.
 */
function PrimarLankKnapp({ children }: { children: ReactNode }) {
  return (
    <Link
      to="/login"
      className="text-(color:--mm-button-primary-text) inline-flex min-h-12 select-none items-center justify-center gap-2 rounded bg-(--mm-button-primary-bg) px-5 text-center text-lg transition-colors hover:bg-(--mm-button-primary-bg-hover)"
    >
      {children}
    </Link>
  );
}

/**
 * AC #3 — utgången, förbrukad eller obefintlig länk. Medvetet GENERISK:
 * ingen inbjudare namnges (den datan finns inte utan en session — se
 * kortets Implementation Notes/slutrapport § "Divergens mot facit"), ingen
 * orsak anges (enumeration-neutralt). Vägen framåt matchar facitets
 * fotnotsmönster: be den som bjöd in dig skicka en ny länk. Det finns
 * ännu ingen självbetjänings-omskicksyta i appen (TASK-127.7 är glömt-
 * lösenord, inte omskick av inbjudan) — vägen framåt är därför mänsklig,
 * inte en knapp, och det är en ärlig avspegling av vad som faktiskt finns.
 */
function OgiltigLank() {
  return (
    <div className="flex w-full max-w-md flex-col gap-8">
      <div
        className={
          'flex flex-col gap-5 rounded-2xl border border-border-light bg-surface p-6 shadow-sm sm:p-8'
        }
      >
        <div className="flex flex-col gap-2">
          <h1 className="font-semibold text-3xl text-text">Länken fungerar inte längre</h1>
          <p className="text-body text-text-secondary">
            Den här inbjudningslänken är antingen redan använd eller har gått ut. Be den som bjöd in
            dig att skicka en ny inbjudan, så kommer du in på nolltid.
          </p>
        </div>
        <PrimarLankKnapp>Till inloggningen</PrimarLankKnapp>
      </div>
    </div>
  );
}

/** Post-skapande — ETT explicit inloggningssteg, inte en tyst navigering
 * in i appen (S96/TASK-127.2 konvergens-signal: "Logga in direkt efteråt
 * — klart" byttes till "Logga in och upptäck ditt nya verktyg" — en
 * uttalad Marcus-formulering för precis detta ögonblick). Sessionen som
 * `updateUser` lämnar kvar signas ut explicit i `LosenordsFormular` innan
 * detta läge visas, så CTA:n nedan leder till ett RIKTIGT, medvetet
 * inloggningsmoment — aldrig en session som råkar redan finnas kvar. */
function KontotSkapat() {
  return (
    <div className="flex w-full max-w-md flex-col gap-8">
      <div className="flex flex-col gap-5 rounded-2xl border border-border-light bg-surface p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-2">
          <h1 className="font-semibold text-3xl text-text">Kontot är skapat</h1>
          <p className="text-body text-text-secondary">Ditt lösenord är sparat.</p>
        </div>
        <PrimarLankKnapp>Logga in och upptäck ditt nya verktyg</PrimarLankKnapp>
      </div>
    </div>
  );
}

interface LosenordsFormularProps {
  epost: string;
  rollEtikett: string;
  /** Mottagarens eget namn, ur `user_metadata.display_name` — `null` när
   * sessionen saknar det (se `lasStrangMetadata`). TASK-143. */
  mottagarNamn: string | null;
  /** Vem som bjöd in, ur `user_metadata.inviter_name` — `null` när
   * sessionen saknar det. TASK-143. */
  inbjudarNamn: string | null;
  /** Byter föräldrans tillstånd. `'ogiltig-lank'` täcker fallet där
   * sessionen dör MITT I flödet (t.ex. token hann gå ut medan formuläret
   * var öppet) — samma vänliga yta som en direkt ogiltig länk (AC #3). */
  onUtfall: (utfall: 'ogiltig-lank' | 'klart') => void;
}

/**
 * Formuläret — facitets struktur (README `## Den byggda formen`): hälsning
 * ovanför kortet, formuläret i ett vitt `rounded-2xl`-kort, e-post
 * readonly med hänglås-ikon, ETT lösenordsfält (facitets research-grundade
 * val — inget bekräftelsefält, NN/g + GitLabs skarpa invite-accept-kod
 * citerade i facit-README) med visa/dölj-knapp, TTL-fotnot under kortet.
 *
 * PERSONALISERAD HÄLSNING (TASK-143) — DIVERGENSEN ÄR STÄNGD. `invite-user`-
 * EF:ens kontrakt utökades (TASK-143) med mottagarens namn (klient-indata,
 * precis som e-post/roll) och inbjudarens identitet (härledd SERVER-SIDE ur
 * den ANROPANDE adminens egen verifierade JWT — aldrig klient-indata, se
 * EF:ens fil-header). Båda landar i `user_metadata` och läses härifrån via
 * `lasStrangMetadata` ovan. Ingen e-post-härledd namngissning förekommer
 * någonstans (fortfarande förbjudet av `AuthProvider.tsx`s
 * Gunilla-princip-kommentar) — `mottagarNamn`/`inbjudarNamn` kommer
 * UTESLUTANDE ur den explicit satta metadatan.
 *
 * GRACEFUL DEGRADATION, INTE ETT HÅRT KRAV: en session utan namn (t.ex. en
 * teoretisk kvarleva från FÖRE denna utökning) visar samma generiska copy
 * som innan TASK-143 i stället för en trasig "Välkommen, " — se
 * greeting-blocket nedan. `rollEtikett`-logiken är opåverkad.
 */
function LosenordsFormular({
  epost,
  rollEtikett,
  mottagarNamn,
  inbjudarNamn,
  onUtfall,
}: LosenordsFormularProps) {
  const emailFaltId = useId();
  const emailBeskrivningId = useId();
  const [losenord, setLosenord] = useState('');
  const [visaLosenord, setVisaLosenord] = useState(false);
  const [status, setStatus] = useState<'vila' | 'sparar'>('vila');
  const [fel, setFel] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFel(null);

    // ASVS 6.2.1 — golvet (8 tecken) upprätthålls klientsidan direkt;
    // 15 är rekommendationen, inte ett hårt krav (facitets och ADR-093:s
    // egen formulering: "15 starkt rekommenderat", inte "krävt").
    if (losenord.length < 8) {
      setFel('Lösenordet behöver vara minst 8 tecken.');
      return;
    }

    setStatus('sparar');

    // ASVS 6.2.4/6.2.12 — kontroll mot läckta lösenord. Se
    // src/lib/auth/pwnedPasswordCheck.ts för det fulla resonemanget kring
    // varför denna kontroll är egenbyggd i stället för att lita blint på
    // Supabases (overifierat påslagna, Pro-plan-gated) motsvarighet.
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
      // genomföras, men blockerar inte kontoskapandet. Observabilitet i
      // stället för tystnad.
      Sentry.captureMessage('Läckt-lösenord-kontroll kunde inte genomföras (fail-open)', {
        level: 'warning',
        tags: { auth: 'valkommen-breach-check' },
      });
    }

    const { error } = await supabase.auth.updateUser({ password: losenord });
    if (error) {
      Sentry.captureException(error, { tags: { auth: 'valkommen-updateUser' } });
      setStatus('vila');
      // Sessionen dog mitt i flödet (t.ex. token hann gå ut medan
      // formuläret var öppet) — samma vänliga felläge som en direkt
      // ogiltig länk (AC #3), aldrig en rå felkod.
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

    // Sessionen `updateUser` lämnar kvar är teknisk giltig, men
    // konvergens-signalen (se KontotSkapat-kommentaren) är att nästa steg
    // ska vara ETT medvetet inloggningsmoment — inte en session som råkar
    // redan finnas. `scope: 'local'` rör bara DENNA flik/enhet.
    const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' });
    if (signOutError) {
      Sentry.captureException(signOutError, { tags: { auth: 'valkommen-signOut-post-accept' } });
      // Utloggningen misslyckades — kontot är ändå skapat (updateUser
      // lyckades ovan). Visa framgång ändå; en kvarlevande session här är
      // ofarlig (den är en RIKTIG, nu lösenordsskyddad session för samma
      // konto), bara inte den avsedda UX:en.
    }
    setStatus('vila');
    onUtfall('klart');
  };

  return (
    <div className="flex w-full max-w-md flex-col gap-8">
      <div className="flex flex-col gap-3">
        <h1 className="font-semibold text-3xl text-text">
          {mottagarNamn ? `Välkommen, ${mottagarNamn}` : 'Du har bjudits in'}
        </h1>
        <p className="text-lg text-text-secondary">
          {inbjudarNamn ? (
            <>
              {inbjudarNamn} har bjudit in dig till Miranon Media Admin. Du får rollen{' '}
              <strong className="font-semibold text-text">{rollEtikett}</strong>.
            </>
          ) : (
            <>
              Du får rollen <strong className="font-semibold text-text">{rollEtikett}</strong> i
              Miranon Media Admin.
            </>
          )}
        </p>
      </div>

      <form
        onSubmit={(e) => {
          void handleSubmit(e);
        }}
        className="flex flex-col gap-5 rounded-2xl border border-border-light bg-surface p-6 shadow-sm sm:p-8"
        noValidate
      >
        <h2 className="font-semibold text-2xl text-text">Sätt ditt lösenord</h2>

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
            Den här adressen hör till din inbjudan och går inte att ändra.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          {/* validationBehavior="aria" — BYGGKRAV ur TASK-127.2:s
              divergensfas (kortets Implementation Notes). React Arias
              default `validationBehavior="native"` speglar isInvalid via
              `input.setCustomValidity()`, som webbläsaren bara rensar vid
              en LYCKAD native submit — ett andra försök med rätt
              lösenord blockeras då tyst av webbläsarens egen constraint-
              validering innan onSubmit hinner köra. Fångad, diagnostiserad
              och fixad i prototypen; måste upprepas här eller återkommer
              felet — det syns bara vid ANDRA försöket. */}
          <Input
            label="Lösenord"
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

        <Button
          type="submit"
          size="lg"
          isLoading={status === 'sparar'}
          loadingText="Skapar konto …"
        >
          Skapa mitt konto
        </Button>
      </form>

      <p className="flex items-center gap-2 text-caption text-text-muted">
        <Clock aria-hidden="true" className="size-4 shrink-0" />
        Länken gäller i 24 timmar. Har den gått ut? Be den som bjöd in dig skicka en ny.
      </p>
    </div>
  );
}
