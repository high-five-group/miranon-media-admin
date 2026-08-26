import * as Sentry from '@sentry/react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { type FormEvent, useEffect, useState } from 'react';
import { Button, Input, MessageBox } from '@/components/primitives';
import { supabase } from '@/data/config/supabase-client';

export const Route = createFileRoute('/glomt-losenord')({
  staticData: { title: 'Glömt lösenord' },
  component: GlomtLosenordRoute,
});

/**
 * Begär-återställning-sidan (TASK-127.7, ADR-093). Publik, självbetjänings-
 * väg för user story 5 ("klicka 'glömt lösenord' och lösa det själv på en
 * minut") — länkas hit från `login.tsx`s "Glömt lösenord?"-knapp, som fram
 * till denna skiva bara togglade en attrapp-notis (facit-text som uttryckligen
 * pekade hit, se login.tsx:s docblock).
 *
 * ENUMERATION-NEUTRALT SVAR (AC #1, ADR-093 §6.3.8 — "svarstid på BÅDE
 * accept- och glömt-lösenord-flödet"): Supabase Auths `/auth/v1/recover`
 * (bakom `resetPasswordForEmail`) är REDAN symmetriskt för känd/okänd adress
 * — plattformen returnerar `error: null` i BÅDA fallen och skickar bara
 * mailet när adressen faktiskt finns (verifierat mot Supabase-dokumentationen
 * via context7: "the redirectTo value is ignored... no error is raised" för
 * en annan gren av samma neutralitetsdesign, och Supabase Studios EGEN
 * `ForgotPasswordWizard` visar en medvetet tvetydig text — "you'll receive an
 * email IF an account exists" — som denna sidas copy speglar).
 *
 * DÄRFÖR ÄR KLIENTKODEN SYMMETRISK BY CONSTRUCTION, INTE BY DISCIPLINE: den
 * har ingen signal att förgrena på (API:t skiljer aldrig känd från okänd), så
 * "identiskt svar" följer automatiskt SÅ LÄNGE koden inte lägger till en egen
 * gren. Den enda platsen en sådan gren skulle kunna smyga sig in är
 * FELHANTERINGEN av `resetPasswordForEmail`s eget svar (nätverksfel,
 * rate-limit, 5xx) — ETT läge (rate limit) är dessutom teoretiskt korrelerat
 * med adressens historik (GoTrues "Limited By: Last request of the user").
 * Denna sida väljer därför MEDVETET FAIL-OPEN in i SAMMA bekräftelsevy
 * oavsett API-utfall (framgång ELLER fel) — samma mönster som
 * `pwnedPasswordCheck.ts`s fail-open-vid-nätverksfel (loggat till Sentry för
 * egen observabilitet, aldrig tyst): ett genuint 5xx/nätverksfel avslöjar då
 * inte om det var korrelerat med en känd adress, eftersom användaren aldrig
 * ser skillnaden. Detta är en STRÄNGARE tolkning än login.tsx/valkommen.tsx
 * (som visar distinkta felmeddelanden för genuina fel) — motiverat av att
 * DESSA två sidor redan känner till kontot (aktiv session), medan den här
 * sidan är precis den yta ADR-093 explicit namnger. AVVIKELSE mot den
 * annars etablerade "ett generiskt fel per catch-gren"-konventionen, flaggad
 * öppet i slutrapporten.
 *
 * KLIENTVALIDERING (tomt fält) sker FÖRE nätverksanropet och är INTE en
 * enumeration-signal — det är ett publikt, adressoberoende formkrav (samma
 * gren-innan-nätverk-mönster som valkommen.tsx:s längd-check).
 *
 * AUTH-FONDEN (TASK-223, S102 Explore-svepets fynd 2026-08-15): denna sida
 * saknade `data-auth-fond` trots att den delar samma publika auth-kortform
 * som login/passkey/nytt-losenord/valkommen. Forensik körd (git log/blame,
 * commit 0d3cb92f som skapade sidan): ingen dokumenterad avsikt hittades —
 * nytt-losenord.tsx fick fonden i SAMMA commit, glomt-losenord.tsx gjorde
 * det inte. Klassat som MISS, inte medvetet undantag. Samma
 * sätt/städ-mönster som login.tsx (se src/styles/base.css § "FULL-BREDDS-
 * FOND UTAN ATT RÖRA RÄNNSTENEN").
 */
function GlomtLosenordRoute() {
  const [epost, setEpost] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tillstand, setTillstand] = useState<'formular' | 'skickat'>('formular');
  const [fel, setFel] = useState<string | null>(null);

  // Varm fond kant i kant (S96-facit) — satt på <html>, städas vid unmount så
  // appen aldrig ärver auth-fonden. Se src/styles/base.css rad ~100–164.
  // TASK-223: samma mönster som login.tsx, tillagt efter forensik (se
  // filens docblock).
  useEffect(() => {
    const rot = document.documentElement;
    rot.dataset.authFond = 'true';
    return () => {
      delete rot.dataset.authFond;
    };
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFel(null);

    if (!epost.trim()) {
      setFel('Ange din e-postadress.');
      return;
    }

    setIsSubmitting(true);
    try {
      // redirectTo HÅRDKODAT till den absoluta produktionsdomänen (ADR-091),
      // matchande `supabase/config.toml`s `additional_redirect_urls` ORDAGRANT
      // — samma val som `invite-user`-EF:ens `INVITE_REDIRECT_URL` gör för
      // invite-flödet. En dynamisk `window.location.origin` hade fallit
      // tillbaka TYST på bar `site_url` (ingen path) i varje miljö som inte
      // exakt matchar allowlisten (lokal dev, förhandsgranskningar) — se
      // filens docblock.
      const { error } = await supabase.auth.resetPasswordForEmail(epost, {
        redirectTo: 'https://admin.miranon.dev/nytt-losenord',
      });
      if (error) {
        // Fail-open in i SAMMA bekräftelse — se filens docblock. Loggas för
        // egen observabilitet, avslöjas aldrig för användaren.
        Sentry.captureMessage('Glömt-lösenord-begäran gav ett API-fel (fail-open)', {
          level: 'warning',
          tags: { auth: 'glomt-losenord-request' },
        });
      }
    } catch (err) {
      Sentry.captureException(err, { tags: { auth: 'glomt-losenord-request-throw' } });
    } finally {
      setIsSubmitting(false);
      setTillstand('skickat');
    }
  };

  return (
    <main className="flex min-h-dvh w-full items-center justify-center p-4 sm:p-8 lg:p-12">
      <div className="flex w-full max-w-md flex-col gap-8">
        {tillstand === 'formular' ? (
          <form
            onSubmit={(e) => {
              void handleSubmit(e);
            }}
            className="flex flex-col gap-4 rounded-2xl border border-border-light bg-surface p-4 shadow-sm sm:gap-5 sm:p-8"
            aria-labelledby="glomt-losenord-heading"
            aria-busy={isSubmitting}
            noValidate
          >
            <div className="flex flex-col gap-2">
              <h1 id="glomt-losenord-heading" className="font-semibold text-3xl text-text">
                Glömt lösenord?
              </h1>
              <p className="text-body text-text-secondary">
                Ange din e-postadress, så skickar vi en länk för att välja ett nytt lösenord.
              </p>
            </div>

            <Input
              id="glomt-losenord-email"
              label="E-postadress"
              type="email"
              autoComplete="email"
              value={epost}
              onChange={setEpost}
              isRequired
              isDisabled={isSubmitting}
              isInvalid={!!fel}
              validationBehavior="aria"
              placeholder="t.ex. lotta@miranon.se"
            />

            {fel && (
              <MessageBox
                intent="error"
                title="Något stämmer inte"
                className="motion-safe:animate-mm-avsloj"
              >
                {fel}
              </MessageBox>
            )}

            <Button type="submit" size="lg" isLoading={isSubmitting} loadingText="Skickar …">
              Skicka återställningslänk
            </Button>

            <Link
              to="/login"
              className="text-(color:--mm-accent) self-center rounded text-small underline-offset-2 hover:underline focus-visible:outline-(--mm-focus-ring) focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Tillbaka till inloggningen
            </Link>
          </form>
        ) : (
          <div className="flex flex-col gap-5 rounded-2xl border border-border-light bg-surface p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-2">
              <h1 className="font-semibold text-3xl text-text">Kolla din inkorg</h1>
              {/* Enumeration-neutral copy (AC #1) — medvetet TVETYDIG, samma
                  mönster som Supabase Studios egen ForgotPasswordWizard: säger
                  varken "adressen finns" eller "adressen finns inte". */}
              <p className="text-body text-text-secondary">
                Om <strong className="font-semibold text-text">{epost}</strong> hör till ett konto
                hos oss har vi skickat ett mail med en länk för att välja nytt lösenord. Länken
                gäller i 24 timmar.
              </p>
            </div>
            <Link
              to="/login"
              className="text-(color:--mm-button-primary-text) inline-flex min-h-12 select-none items-center justify-center gap-2 self-start rounded bg-(--mm-button-primary-bg) px-5 text-center text-lg transition-colors hover:bg-(--mm-button-primary-bg-hover)"
            >
              Till inloggningen
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
