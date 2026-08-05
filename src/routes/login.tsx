import * as Sentry from '@sentry/react';
import { createFileRoute, Link, redirect, useNavigate, useSearch } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import { Button, Input, MessageBox } from '@/components/primitives';
import { useAuth } from '../auth/useAuth';

// Zod v4-syntax: schema direkt i validateSearch (ingen zodValidator-adapter krävs).
// `redirect`-param sparas vid `_authenticated.tsx beforeLoad`-redirect så användaren
// återvänder till ursprunglig sida efter login.
const loginSearchSchema = z.object({
  redirect: z.string().optional().default('/hem'),
});

export const Route = createFileRoute('/login')({
  staticData: { title: 'Logga in' },
  validateSearch: loginSearchSchema,
  beforeLoad: ({ context, search }) => {
    // Redan inloggad? Hoppa direkt till redirect-target. Skyddar mot "stuck on /login"
    // för redan-autentiserade users.
    if (context.auth.isAuthenticated) {
      throw redirect({ to: search.redirect });
    }
  },
  component: LoginRoute,
});

/**
 * Login-vyn — skarp implementation mot designsystemets primitiver
 * (TASK-127.3). Infriar Fas 3-refaktorlöftet den gamla vyn lämnade öppet
 * (rå HTML/Tailwind) och skrivs NYSKRIVEN mot prototyp-facitet i stället för
 * att kopiera prototypgrenar — throwaway-kontraktets klausul iv
 * (prototypkod befordras aldrig).
 *
 * FORM (S96-facit, `tasks/sessions/bilagor/s96-auth-prototyp-facit/README.md`,
 * variant B — konvergerad genom sjutton omgångar, Marcus helt nöjd):
 * en spalt, varm toning kant i kant satt på `<html>` via `data-auth-fond`
 * (src/styles/base.css § "FULL-BREDDS-FOND UTAN ATT RÖRA RÄNNSTENEN" —
 * rännstenen är oförändrad, inget hopp införs vid mount/unmount), formuläret
 * i ett vitt kort (`rounded-2xl`, appens kort-standard, samma som
 * DashboardCard och 38 andra ytor). Hälsningen bor INUTI kortet (login har
 * inget att säga utanför det — skiljer login från den kommande
 * inbjudningssidan, TASK-127.6, som bär roll-rad och fotnot ovanför/under).
 *
 * FOKUSRING VID MUSKLICK i textfälten kräver INGEN egen klass här —
 * TASK-134 (2026-08-04) breddade `.mm-fokusring-vid-fokus` till att sitta
 * direkt på `<Input>`-primitivens underliggande fält (se Input.tsx), så
 * varje konsument — den här vyn inräknad — ärver rätt beteende automatiskt.
 * Prototypens egen `AUTH_FOKUSRING`-klass (`mm-auth-formular`, en form-scopad
 * variant) motsvarar därför INGEN CSS-regel i base.css längre; den bredare
 * TASK-134-lösningen gör den smalare auth-specifika varianten obsolet innan
 * den ens landade (research-underlag:
 * docs/research/focus-ring-auth-musklick-2026-08-03.md § Rekommendation).
 *
 * ENUMERATION-NEUTRALT (AC#2, ADR-093 §6.3.8): Supabase auth-fel särskiljer
 * medvetet inte "fel e-post" från "fel lösenord" — UI:t lägger inte till
 * egen särskiljning heller. ETT generiskt fel för varje `catch`-gren
 * (nätverksfel, ogiltiga uppgifter, rate limit — alla renderar samma text).
 *
 * FELET ÄR ETT AFFÄRS-FEL, INTE FÄLT-VALIDERING — samma klassning som
 * `ManuellAnmalanForm`s 409-hantering (dubblett-fallet): en `MessageBox`,
 * inte `isInvalid` på ett enskilt fält. Att markera ETT av fälten som
 * ogiltigt hade dessutom läckt information om VILKET som var fel, rakt emot
 * enumeration-neutraliteten AC#2 kräver.
 *
 * `validationBehavior="aria"` på båda fälten sätts ändå, defensivt (kortets
 * byggkrav ur TASK-127.2 divergensfasen, variant-oberoende): React Arias
 * default `validationBehavior="native"` speglar `isInvalid`/`errorMessage`
 * via `input.setCustomValidity(...)`, som webbläsaren ENDAST rensar vid en
 * lyckad NATIV submit — aldrig sant här (`e.preventDefault()` varje gång).
 * Denna vy sätter idag aldrig `isInvalid` på fälten (se ovan), så mekanismen
 * triggas inte i praktiken — men skyddet kostar noll och gör att en framtida
 * ändring som lägger till fält-nivå-validering ärver det automatiskt i
 * stället för att återintroducera buggen (den bet skarpt i prototypen,
 * reproducerad två gånger, se TASK-127.2/127.6 Implementation Notes).
 *
 * "GLÖMT LÖSENORD?" LÄNKAR till `/glomt-losenord` (TASK-127.7) — bar fram
 * till dess en toggle som visade en attrapp-notis, eftersom mottagningssidan
 * ännu inte existerade (se historiken i git-loggen för den ursprungliga
 * kommentaren, TASK-127.3). Nu när sidan finns är en riktig navigering rätt
 * — samma "en knapp som NAVIGERAR ska vara en riktig länk"-resonemang som
 * `valkommen.tsx`s `PrimarLankKnapp` dokumenterar (cmd/ctrl-klick i ny flik,
 * kopiera länk, `role="link"` för skärmläsare).
 *
 * A11Y utöver facitets visuella form (ACCESSIBILITY-CHECKLIST §2):
 * `aria-busy` på formuläret under inloggningsförsök, och fokus flyttas
 * programmatiskt till felmeddelandet vid ett misslyckat försök ("Fokus
 * flyttas till första felet vid submit-fel") — samma
 * ref+tabIndex={-1}-mönster som `ManuellAnmalanForm`s bekräftelseläge.
 */
function LoginRoute() {
  const auth = useAuth();
  const navigate = useNavigate();
  const search = useSearch({ from: '/login' });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [misslyckades, setMisslyckades] = useState(false);
  const felRef = useRef<HTMLDivElement>(null);

  // Varm fond kant i kant (S96-facit) — satt på <html>, städas vid unmount så
  // appen aldrig ärver auth-fonden. Se src/styles/base.css rad ~100–164.
  useEffect(() => {
    const rot = document.documentElement;
    rot.dataset.authFond = 'true';
    return () => {
      delete rot.dataset.authFond;
    };
  }, []);

  // Fokus flyttas till felmeddelandet vid misslyckat försök
  // (ACCESSIBILITY-CHECKLIST §2 "Formulär").
  useEffect(() => {
    if (misslyckades) felRef.current?.focus();
  }, [misslyckades]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMisslyckades(false);

    try {
      await auth.login(email, password);
      // router.invalidate() i InnerApp triggar beforeLoad-re-eval. Navigate till redirect-target.
      navigate({ to: search.redirect });
    } catch (err) {
      // Supabase auth-errors är medvetet otydliga om "fel email" vs "fel lösenord"
      // (motverkar email-enumeration, ADR-093 §6.3.8). Generiskt felmeddelande (AC#2).
      setMisslyckades(true);
      Sentry.captureException(err, { tags: { auth: 'login-form' } });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-dvh w-full items-center justify-center p-4 sm:p-8 lg:p-12">
      <div className="flex w-full max-w-xl flex-col gap-8">
        <form
          onSubmit={handleSubmit}
          // Padding/gap smalnar under `sm` (BYGGKRAV: allt ska rymmas utan
          // scroll, mätt vid en HALVERAD viewport-höjd — mjukt tangentbord
          // uppe krymper synlig yta ofta till ~halva skärmen. Vid 390×844
          // fanns ingen overflow (mätt), men vid 390×422/400 gjorde det
          // (9–31 px) — täta värden löser det utan att röra typsnitt,
          // fokusringar eller 44px-träffytor (golvet rörs aldrig). `sm:`+
          // uppåt är OFÖRÄNDRAT p-8/gap-5 — exakt facitets uppmätta,
          // skärmdumpade form. Avvikelse mot facit ENDAST under `sm` i ett
          // tillstånd (kort viewport) facitets skärmdumpar aldrig visade.
          className="flex flex-col gap-4 rounded-2xl border border-border-light bg-surface p-4 shadow-sm sm:gap-5 sm:p-8"
          aria-labelledby="login-heading"
          aria-busy={isSubmitting}
          noValidate
        >
          <div className="flex flex-col gap-2">
            <h1 id="login-heading" className="font-semibold text-3xl text-text">
              Välkommen tillbaka
            </h1>
            <p className="text-body text-text-secondary">Logga in och kolla läget.</p>
          </div>

          <Input
            id="login-email"
            label="E-postadress"
            type="email"
            autoComplete="email"
            value={email}
            onChange={setEmail}
            isRequired
            isDisabled={isSubmitting}
            validationBehavior="aria"
            placeholder="t.ex. lotta@miranon.se"
          />

          <div className="flex flex-col gap-1.5">
            <Input
              id="login-password"
              label="Lösenord"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={setPassword}
              isRequired
              isDisabled={isSubmitting}
              validationBehavior="aria"
            />
            <Link
              to="/glomt-losenord"
              className="text-(color:--mm-accent) self-end rounded text-small underline-offset-2 hover:underline focus-visible:outline-(--mm-focus-ring) focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Glömt lösenord?
            </Link>
          </div>

          {misslyckades && (
            <div ref={felRef} tabIndex={-1} className="outline-none">
              <MessageBox
                intent="error"
                title="Kunde inte logga in"
                className="motion-safe:animate-mm-avsloj"
              >
                Kontrollera e-postadress och lösenord och försök igen.
              </MessageBox>
            </div>
          )}

          <Button type="submit" size="lg" isDisabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 aria-hidden="true" className="size-4 motion-safe:animate-spin" />
                Loggar in …
              </>
            ) : (
              'Logga in'
            )}
          </Button>
        </form>
      </div>
    </main>
  );
}
