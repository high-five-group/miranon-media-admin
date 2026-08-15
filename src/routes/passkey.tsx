import { createFileRoute, redirect, useNavigate, useSearch } from '@tanstack/react-router';
import { Fingerprint } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import { Button, MessageBox } from '@/components/primitives';
import {
  markeraErbjudandeSett,
  type PasskeyAtgardUtfall,
  probaPasskeyTillganglighet,
  registreraPasskey,
} from '@/lib/auth/passkey';

// Samma default som /login (search.redirect) — den här ytan är ett steg
// INUTI inloggnings-sekvensen, inte en egen destination.
const passkeySearchSchema = z.object({
  redirect: z.string().optional().default('/hem'),
});

export const Route = createFileRoute('/passkey')({
  staticData: { title: 'Skydda ditt konto' },
  validateSearch: passkeySearchSchema,
  beforeLoad: ({ context, search }) => {
    // Kräver en aktiv session (samma guard-FORM som _authenticated.tsx),
    // men ytan lever UTANFÖR AppShell — egen sida, samma varma
    // auth-estetik som /login och /valkommen (kortets ram: "ska kännas
    // som samma app"). En direkt, oautentiserad navigering hit ska aldrig
    // kunna trigga ett passkey-anrop.
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login', search: { redirect: search.redirect } });
    }
  },
  component: PasskeyRoute,
});

type Vy = 'kontrollerar' | 'erbjudande' | 'registrerad';

/**
 * Erbjudande-ytan (TASK-127.8, ADR-093 beslut 2). Nås ENDAST via `/login`s
 * post-inloggnings-omdirigering (se login.tsx) för konton som inte sett
 * erbjudandet än — men byggd defensivt för direkt navigering också: samma
 * tillgänglighets-prob körs oavsett hur sidan nåddes, så en bokmärkt länk
 * eller en webbläsare utan WebAuthn-stöd aldrig fastnar här (AC #4,
 * "degraderar snyggt").
 *
 * INGEN "SEDD"-MARKERING vid otillgänglighet (webbläsarstöd saknas eller
 * servern svarar `passkey_disabled` — verifierat läge på staging idag, se
 * `src/lib/auth/passkey.ts`s topp-kommentar): sidan skickar tyst vidare
 * till `redirect`-målet UTAN att sätta `passkey_erbjudande_sett`, så
 * kontot kan erbjudas igen den dag funktionen faktiskt blir tillgänglig.
 * Motsatsen — ett uttryckligt "Inte nu" eller en lyckad registrering —
 * markerar ALLTID, så avböjandet respekteras (AC #1).
 */
function PasskeyRoute() {
  const navigate = useNavigate();
  const search = useSearch({ from: '/passkey' });
  const [vy, setVy] = useState<Vy>('kontrollerar');
  const [sparar, setSparar] = useState(false);
  const [fel, setFel] = useState<string | null>(null);
  const felRef = useRef<HTMLDivElement>(null);

  // Varm fond kant i kant (S96-facit, samma mönster som login.tsx/
  // valkommen.tsx) — städas vid unmount så appen aldrig ärver den.
  useEffect(() => {
    const rot = document.documentElement;
    rot.dataset.authFond = 'true';
    return () => {
      delete rot.dataset.authFond;
    };
  }, []);

  // Körs EN gång vid mount — search.redirect/navigate är stabila nog för
  // detta syfte (samma mönster som main.tsx § medveten TRIGGER-kommentar).
  // biome-ignore lint/correctness/useExhaustiveDependencies: medveten mount-once-probe, se kommentar ovan
  useEffect(() => {
    let mounted = true;
    probaPasskeyTillganglighet()
      .then(async (probe) => {
        if (!mounted) return;
        if (!probe.webblasarstod || !probe.servertillgangligt) {
          navigate({ to: search.redirect });
          return;
        }
        if (probe.harRedanPasskey) {
          await markeraErbjudandeSett();
          if (!mounted) return;
          navigate({ to: search.redirect });
          return;
        }
        setVy('erbjudande');
      })
      .catch(() => {
        // Probet självt kastar aldrig (se passkey.ts), men ett oväntat
        // fel i navigate/markeraErbjudandeSett-kedjan ska ändå aldrig
        // fastna på "kontrollerar" för evigt — samma degraderings-princip.
        if (mounted) navigate({ to: search.redirect });
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Fokus flyttas till felmeddelandet (ACCESSIBILITY-CHECKLIST §2), samma
  // mönster som login.tsx/valkommen.tsx.
  useEffect(() => {
    if (fel) felRef.current?.focus();
  }, [fel]);

  const hoppaOver = async () => {
    setSparar(true);
    await markeraErbjudandeSett();
    navigate({ to: search.redirect });
  };

  const registrera = async () => {
    setFel(null);
    setSparar(true);
    const utfall: PasskeyAtgardUtfall = await registreraPasskey();
    if (utfall.ok) {
      await markeraErbjudandeSett();
      setSparar(false);
      setVy('registrerad');
      return;
    }
    setSparar(false);
    // Användaren avbröt/stängde själv plattformens prompt — normalt utfall,
    // ingen felyta (se passkey.ts § PasskeyAtgardUtfall).
    if (utfall.anvandarenAvbrot) return;
    setFel(utfall.meddelande);
  };

  return (
    <main className="flex min-h-dvh w-full items-center justify-center p-6 sm:p-8 lg:p-12">
      {vy === 'kontrollerar' && (
        <div role="status" aria-live="polite" className="text-body text-text-secondary">
          Kontrollerar ditt konto …
        </div>
      )}

      {vy === 'erbjudande' && (
        <div className="flex w-full max-w-md flex-col gap-8">
          <div className="flex flex-col gap-5 rounded-2xl border border-border-light bg-surface p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-3">
              <Fingerprint aria-hidden="true" className="text-(color:--mm-accent) size-8" />
              <h1 className="font-semibold text-3xl text-text">
                Vill du logga in snabbare nästa gång?
              </h1>
              <p className="text-body text-text-secondary">
                En passkey är ett säkert sätt att logga in utan att skriva lösenordet - du bekräftar
                i stället med fingeravtryck, ansiktsigenkänning eller enhetens egen låskod. Den
                sparas på din enhet eller i din lösenordshanterare, aldrig hos oss, och kan inte
                gissas eller stjälas på samma sätt som ett lösenord.
              </p>
              <p className="text-body text-text-secondary">
                Lösenordet fortsätter fungera precis som vanligt - en passkey är ett extra
                alternativ, aldrig ett krav.
              </p>
            </div>

            {fel && (
              <div ref={felRef} tabIndex={-1} className="outline-none">
                <MessageBox
                  intent="error"
                  title="Det gick inte att skapa passkeyn"
                  className="motion-safe:animate-mm-avsloj"
                >
                  {fel}
                </MessageBox>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row-reverse">
              <Button
                size="lg"
                isLoading={sparar}
                loadingText="Skapar …"
                onPress={() => {
                  void registrera();
                }}
              >
                Skapa en passkey
              </Button>
              <Button
                intent="secondary"
                size="lg"
                isDisabled={sparar}
                onPress={() => {
                  void hoppaOver();
                }}
              >
                Inte nu
              </Button>
            </div>
          </div>
        </div>
      )}

      {vy === 'registrerad' && (
        <div className="flex w-full max-w-md flex-col gap-8">
          <div className="flex flex-col gap-5 rounded-2xl border border-border-light bg-surface p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-2">
              <h1 className="font-semibold text-3xl text-text">Passkey skapad</h1>
              <p className="text-body text-text-secondary">
                Nästa gång kan du logga in med den i stället för lösenordet - lösenordet fungerar
                fortfarande, om du någon gång hellre vill använda det.
              </p>
            </div>
            <Button
              size="lg"
              onPress={() => {
                navigate({ to: search.redirect });
              }}
            >
              Fortsätt
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
