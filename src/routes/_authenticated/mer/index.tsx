import { createFileRoute } from '@tanstack/react-router';
import { CalendarPlus, ClipboardList, Filter, Hourglass, LogOut, Mail, Star } from 'lucide-react';
import { useAuth } from '@/auth/useAuth';
import { Button, NavCard } from '@/components/primitives';

export const Route = createFileRoute('/_authenticated/mer/')({
  staticData: { title: 'Mer' },
  component: MerPage,
});

/*
 * Mer-landningen till M6-FACITET (sessionsdok S64 Del 3 + bilagor
 * s64-mer-konvergens; task-9.2). Statisk vy (ingen datahämtning, ingen EF —
 * PRD beslut 9); raderna bärs av NavCard-primitiven (task-9.1, spec §14).
 *
 * Facit-formen: synlig "Mer"-h1 i appens h1-skala (30/600 = Hem-hälsningen)
 * → ETT nav-landmärke "Mer-sidor" med TVÅ luftgrupper (listorna ·
 * handlingarna, handling före verktyg) → centrerad Logga ut UTANFÖR nav.
 * Måtten (computed-låsta, M6): skalets 16 px-sidmarginal — sektionen har
 * INGEN egen sidopadding (dubbelkants-fyndet) · 32 px vertikal rytm (gap-8)
 * · 10 px radgap inom grupp (gap-2.5) · topp-luft i Hem-paritet
 * (pt-2 lg:pt-10) · Logga ut-blocket med extra topp-luft (pt-4).
 *
 * Ikonvalen är domänbegrepps-mappade och Marcus-kvitterade (PRD beslut 5) —
 * Bygg segment bär Filter, INTE Users (Personer-flikens ikon; krocken funnen
 * i M6-detaljsvepet): segment byggs med filter.
 */
function MerPage() {
  const { logout } = useAuth();

  return (
    <section className="flex flex-col gap-8 pt-2 lg:pt-10">
      {/* Rubrikpolicyn (PRD beslut 1): synlig h1 = vyns namn; 30/600 (iOS
          large-title 34/700 medvetet avviken — intern typskala vinner). */}
      <h1 className="font-semibold text-3xl">Mer</h1>

      {/* Anatomin per spec §14: konsumenten äger nav > ul > li > NavCard.
          Grupp 1 = listorna (Anmälningar först — operativ kärnyta, task-1.4);
          grupp 2 = handling före verktyg (samsyn C, Revision S64). */}
      <nav aria-label="Mer-sidor" className="flex flex-col gap-8">
        <ul className="flex flex-col gap-2.5">
          <li>
            <NavCard to="/mer/anmalningar" icon={ClipboardList} label="Anmälningar" />
          </li>
          <li>
            <NavCard to="/mer/vantelista" icon={Hourglass} label="Väntelista" />
          </li>
          <li>
            <NavCard to="/mer/intresserade" icon={Star} label="Intresserade" />
          </li>
          <li>
            <NavCard to="/mer/maillogg" icon={Mail} label="Maillogg" />
          </li>
        </ul>
        <ul className="flex flex-col gap-2.5">
          <li>
            <NavCard to="/mer/skapa-event" icon={CalendarPlus} label="Skapa nytt event" />
          </li>
          <li>
            <NavCard to="/mer/segment" icon={Filter} label="Bygg segment" />
          </li>
        </ul>
      </nav>

      {/* Logout är en HANDLING, inte navigering → UTANFÖR nav-landmärket,
          centrerad med extra topp-luft (facit punkt 6). Ghost-intent +
          dekorativ LogOut-ikon; vikten är Button-primitivens standard (FK:s
          fetstil medvetet avviken — systemkonsekvens). Redirect till /login
          sköts av _authenticated-guarden: logout() → onAuthStateChange →
          router.invalidate() (main.tsx) → beforeLoad re-evaluerar → redirect
          (ADR-037-kedjan, oförändrad). Ingen bekräftelsedialog (Fas 6e-
          beslutet står). Ingen Inställningar (de-scopad, T47). */}
      <div className="flex justify-center pt-4">
        <Button intent="ghost" onPress={() => void logout()}>
          <LogOut size={20} aria-hidden />
          Logga ut
        </Button>
      </div>
    </section>
  );
}
