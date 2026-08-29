import { createFileRoute } from '@tanstack/react-router';
import {
  ClipboardList,
  Filter,
  History,
  Hourglass,
  LogOut,
  Mail,
  MapPin,
  NotebookText,
  Paperclip,
  Smartphone,
  Star,
} from 'lucide-react';
import { useAuth } from '@/auth/useAuth';
import { Button, NavCard } from '@/components/primitives';
import { markeraAvsiktligUtloggning } from '@/lib/auth/utloggningsavsikt';

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
 * → ETT nav-landmärke "Mer-sidor" med luftgrupper (listorna · handlingarna,
 * handling före verktyg · Inställningar sist) → centrerad Logga ut UTANFÖR
 * nav. Måtten (computed-låsta, M6): skalets 16 px-sidmarginal — sektionen har
 * INGEN egen sidopadding (dubbelkants-fyndet) · 32 px vertikal rytm (gap-8)
 * · 10 px radgap inom grupp (gap-2.5) · topp-luft i Hem-paritet
 * (pt-2 lg:pt-10) · Logga ut-blocket med extra topp-luft (pt-4).
 *
 * Ikonvalen är domänbegrepps-mappade och Marcus-kvitterade (PRD beslut 5) —
 * Bygg segment bär Filter, INTE Users (Personer-flikens ikon; krocken funnen
 * i M6-detaljsvepet): segment byggs med filter.
 *
 * TREDJE gruppen (Inställningar) tillkom task-126.3: tråd T47:s parkerade
 * Inställnings-hemvist ("Ingen Inställningar (de-scopad, T47)" — noten stod
 * här till och med task-126.3) aktiveras av "Installera appen" som första
 * och hittills enda posten. Egen `<ul>` i stället för att buntas med
 * handling/verktyg-gruppen: Installera appen är varken en lista eller ett
 * marknadsföringsverktyg utan en app-/enhetsinställning — samma rytm
 * (gap-2.5 inom, gap-8 mellan) håller utan att facitets mått rubbas.
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
          {/* Aktivitetshistoriken (TASK-201.6, AC #2): mobil-/platta-ingången
              (S55 byggkrav B7 — desktop nås via hem-spaltens "Se all
              aktivitetshistorik ›", TASK-201.7, OBYGGD). History-ikonen
              (domänbegrepps-mappad, samma disciplin som M6:s ikonval): en
              historik är en tidslinje bakåt, skilt från Maillogg-radens
              Mail-ikon ovan. Sist i listorna-gruppen — nyaste tillskottet. */}
          <li>
            <NavCard to="/mer/aktivitetshistorik" icon={History} label="Aktivitetshistorik" />
          </li>
        </ul>
        <ul className="flex flex-col gap-2.5">
          {/* Skapa nytt event-raden RIVEN ÖPPET (task-19.2, PRD task-19
              beslut 2): ingången bor på event-listans vy-rad (S73-facit-
              utökningen K74) och sidan på /event/skapa (hemvist-flytten,
              Marcus-kvitterad 2026-07-21); gamla routen omdirigerar. */}
          <li>
            <NavCard to="/mer/segment" icon={Filter} label="Bygg segment" />
          </li>
          {/* Bilagor (`T131`, promoverad TASK-164-rivningen, ADR-103 B2 steg
              4). Hör till HANDLING/VERKTYG-gruppen, inte listorna: den
              förvaltar material, den listar inte personer. Ikonen är
              Paperclip = bilaga (domänbegreppsmappningen, PRD beslut 5);
              FileText hade läst som "dokument i allmänhet", vilket är precis
              det ORDLISTA varnar för.

              [T176, 2026-08-29] ETIKETTEN VAR "Dokument" — ORDLISTA § Bilaga
              säger *"Dokument är YTAN i Mer där bilagor hanteras"*, och ytan
              hette därför så. Marcus dom samma dag: *"Mer-fliken 'Dokument'
              kanske borde heta 'Bilagor'"*. BILAGA är substantivet för det
              som faktiskt hanteras (ORDLISTA rad 179: en PDF som Lotta väljer
              att bifoga i ett utskick), och alla tre klasserna — uppladdad,
              event-mallad, person-genererad — är bilagor. ROUTEN
              (`/mer/dokument`) är MEDVETET oförändrad: det är en adress, inte
              en etikett, och att byta den hade brutit varje bokmärke och
              varje testselektor utan att göra något begripligare. ORDLISTA.md
              är inte ändrad av denna landning — språkbytet är UI-språk, och
              ordlistans egen rad är Marcus att uppdatera. */}
          <li>
            <NavCard to="/mer/dokument" icon={Paperclip} label="Bilagor" />
          </li>
          {/* Eventinnehåll + Platser (TASK-309.7, Del 2 § D beslut 10):
              standardtexterna per Event × Eventtyp och platsernas uppgifter
              — redigeringsytorna bilagornas skrivvägar (skiva 2) matar.
              Samma radform som Dokument-grannen, samma grupp: båda förvaltar
              MATERIAL som bilagorna byggs av, ingen av dem listar personer.
              NotebookText (standardtexter/anteckningar, domänbegreppet
              Eventinnehåll — ORDLISTA.md) och MapPin (Plats som eget begrepp,
              samma ikon redan etablerad för "plats" i EventCard.tsx/
              NastaEvent.tsx — konsekvent återanvändning av EN betydelse,
              inte en krock). */}
          <li>
            <NavCard to="/mer/eventinnehall" icon={NotebookText} label="Eventinnehåll" />
          </li>
          <li>
            <NavCard to="/mer/platser" icon={MapPin} label="Platser" />
          </li>
        </ul>
        {/* Inställningar (task-126.3, T47 aktiverad) — se filhuvudets
            "TREDJE gruppen"-not. */}
        <ul className="flex flex-col gap-2.5">
          <li>
            <NavCard to="/mer/installera-appen" icon={Smartphone} label="Installera appen" />
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
          beslutet står).

          `markeraAvsiktligUtloggning()` FÖRE logout() (S107 fynd-fix): utan
          den sparade guarden ursprungs-URL:en och skickade användaren
          tillbaka hit vid nästa inloggning — och eftersom knappen bara finns
          HÄR blev det en sluten loop där /hem aldrig nåddes. Ordningen är
          inte utbytbar: kedjan startar när logout() flippar auth-tillståndet,
          inte när anropet returnerar. */}
      <div className="flex justify-center pt-4">
        <Button
          intent="ghost"
          onPress={() => {
            markeraAvsiktligUtloggning();
            void logout();
          }}
        >
          <LogOut size={20} aria-hidden />
          Logga ut
        </Button>
      </div>
    </section>
  );
}
