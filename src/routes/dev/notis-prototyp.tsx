import { createFileRoute, redirect } from '@tanstack/react-router';
import { useQueryState } from 'nuqs';
import { AppErrorPrototyp } from '@/components/dev/notis-prototyp/AppErrorPrototyp';
import { MessageBoxPrototyp } from '@/components/dev/notis-prototyp/MessageBoxPrototyp';
import { PrototypeSwitcher, type PrototypeVariant } from '@/components/dev/PrototypeSwitcher';
import { Button, MessageBox } from '@/components/primitives';

/**
 * [PROTOTYPE — KONVERGENS, S109] Meddelandefamiljen i flödet + appfel-sidan.
 *
 * FRÅGAN: hur ska `MessageBox` (inkl. `SectionError`) och `AppError` se ut så
 * att hela familjen talar notis-facitets designspråk? Underform B (egen
 * dev-route) är motiverad: `MessageBox` är en primitiv utan en enda hemvist,
 * och `AppError` nås bara genom att krascha appen. Sidramen efterliknar en
 * vanlig vy (600 px innehållskolumn, h1) så rutorna bedöms i rätt täthet.
 *
 * `?variant=1` visar prototypformen; utan parametern visas de SKARPA
 * komponenterna (exakt kopia — jämför i två fönster via växlaren).
 */
export const Route = createFileRoute('/dev/notis-prototyp')({
  beforeLoad: () => {
    if (!import.meta.env.DEV) {
      throw redirect({ to: '/' });
    }
  },
  staticData: { title: 'Meddelandefamiljen - prototyp' },
  component: NotisPrototypPage,
});

const VARIANTER: PrototypeVariant[] = [
  { key: '1', label: 'Meddelanderutan + appfel', steg: 4, stegLabel: 'Konvergensvarv 4' },
];

function NotisPrototypPage() {
  const [variantParam] = useQueryState('variant');
  const proto = variantParam === '1';
  const Ruta = proto ? MessageBoxPrototyp : MessageBox;

  return (
    <main className="mx-auto w-full max-w-[600px] px-4 py-4 pb-24">
      <section className="flex flex-col gap-6 pt-2 lg:pt-10">
        <h1 className="font-semibold text-3xl">Meddelanden</h1>
        <p className="text-small text-text-secondary">
          {proto
            ? 'Prototypform (varv 4): ingen kontur.'
            : 'Skarpa komponenter, exakt som i appen i dag.'}
        </p>

        <h2 className="font-semibold text-xl">Formulärfel</h2>
        {proto ? (
          <MessageBoxPrototyp
            intent="error"
            title="Lösenordet kunde inte sparas"
            actions={
              <Button intent="secondary" size="sm">
                Försök igen
              </Button>
            }
          >
            <p>
              Kontrollera att du är uppkopplad och prova igen. Det du skrev finns kvar i fälten.
            </p>
          </MessageBoxPrototyp>
        ) : (
          <MessageBox intent="error" title="Lösenordet kunde inte sparas">
            <p>
              Kontrollera att du är uppkopplad och prova igen. Det du skrev finns kvar i fälten.
            </p>
            <Button intent="secondary" size="sm" className="mt-3">
              Försök igen
            </Button>
          </MessageBox>
        )}

        <h2 className="font-semibold text-xl">En del av sidan gick sönder (SectionError)</h2>
        {proto ? (
          <MessageBoxPrototyp
            intent="error"
            title="Den här delen kunde inte visas"
            actions={
              <Button intent="secondary" size="sm">
                Försök igen
              </Button>
            }
          >
            <p>
              Resten av sidan fungerar. Prova igen, eller ladda om hela sidan om det inte hjälper.
            </p>
          </MessageBoxPrototyp>
        ) : (
          <MessageBox intent="error" title="Något gick fel">
            <p>
              Den här delen av sidan kunde inte visas. Försök igen - ladda om hela sidan om felet
              kvarstår.
            </p>
            <Button intent="secondary" size="sm" className="mt-3">
              Försök igen
            </Button>
          </MessageBox>
        )}

        <h2 className="font-semibold text-xl">Varning</h2>
        <Ruta intent="warning" title="Eventet är fullbokat">
          <p>Nya anmälningar hamnar på väntelistan tills en plats blir ledig.</p>
        </Ruta>

        <h2 className="font-semibold text-xl">Kvitto</h2>
        <Ruta intent="success" title="Bekräftelsemail skickat" onDismiss={() => {}}>
          <p>Anna Andersson har fått bekräftelsen på sin e-post.</p>
        </Ruta>

        <h2 className="font-semibold text-xl">Info</h2>
        <Ruta intent="info" title="Eventet saknar plats" onDismiss={() => {}}>
          <p>Lägg till en plats så att den kommer med i bekräftelsen.</p>
        </Ruta>

        <h2 className="font-semibold text-xl">Hela appen gick sönder (AppError)</h2>
        <p className="text-small text-text-secondary">
          Visas ovanför allt annat när inget annat skyddslager fångade felet. Måste rendera utan
          stylesheet.
        </p>
        <div className="rounded border border-border border-dashed bg-bg-subtle p-4">
          {proto ? (
            <AppErrorPrototyp inbaddad />
          ) : (
            <div
              style={{
                fontFamily: 'system-ui, sans-serif',
                lineHeight: 1.6,
                margin: '0 auto',
                maxWidth: '28rem',
                padding: '1.5rem',
              }}
            >
              <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Något gick fel</h1>
              <p style={{ margin: '0.75rem 0 0' }}>
                Appen kunde inte återhämta sig från ett fel. Ladda om sidan för att fortsätta - du
                förlorar inget av det du har sparat.
              </p>
              <button
                type="button"
                style={{ marginTop: '1rem', minHeight: '44px', padding: '0.5rem 1.25rem' }}
              >
                Ladda om
              </button>
            </div>
          )}
        </div>
      </section>
      <PrototypeSwitcher variants={VARIANTER} />
    </main>
  );
}
