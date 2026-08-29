import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useQueryState } from 'nuqs';
import type { MallId } from '@/components/dokument/blockDefinitioner';
import { DokumentYta } from '@/components/dokument/DokumentYta';
import { GenereringsVy } from '@/components/dokument/GenereringsVy';
import { useDataSource } from '@/data/useDataSource';
import { queryKeys } from '@/queries/keys';

export const Route = createFileRoute('/_authenticated/mer/dokument')({
  staticData: { title: 'Bilagor' },
  component: DokumentPage,
});

// Mer — Bilagor-ytan (`T131`): /mer/dokument. Ytan där bilagor förvaltas.
//
// [T176, 2026-08-29] ETIKETTEN är "Bilagor" (Mer-fliken, `<h1>` och
// `staticData.title`), SÖKVÄGEN är oförändrad `/mer/dokument`. ORDLISTA
// § Bilaga säger *"Dokument är YTAN i Mer där bilagor hanteras"* — den
// meningen beskriver den GAMLA etiketten och är Marcus att uppdatera; koden
// föregriper den inte. Filnamn, komponentnamn och `data-testid` följer
// sökvägen, inte etiketten.
//
// [PROMOVERAD, TASK-309.8, ADR-103 B2 + ADR-125 § 6] Routen bär nu SJÄLV
// dispatchen mellan de två skarpa lägena — tidigare bakom `?variant=a`,
// DEV-grindad (`import.meta.env.DEV && variant === 'a'`), med prototypens
// egen `GenereringsPrototyp`-komponent som ägde vy/mall-läsningen internt.
// `GenereringsPrototyp.tsx` är riven (`git mv` till
// `@/components/dokument/GenereringsVy.tsx` i samma commit) — dess
// dispatch-logik flyttade hit OFÖRÄNDRAD (samma villkor: `?vy=generering`
// plus ett faktiskt laddat event), bara utan flaggan och utan
// `PrototypeSwitcher`-monteringen. `DokumentYta.tsx`s mallkatalog
// (`SkapaDokumentMeny`, tidigare `MallRad`) sätter `?vy`/`?mall` via samma
// nuqs-nycklar; `?event=` är delad mellan båda lägena (samma queryKey). <Outlet/> bärs av
// _authenticated via AppShell (samma form som syskon-leafsen: maillogg.tsx,
// vantelista.tsx, intresserade.tsx).
function DokumentPage() {
  const [vy, setVy] = useQueryState('vy');
  const [mallParam, setMall] = useQueryState('mall');
  const mall: MallId = mallParam === 'deltagarinfo' ? 'deltagarinfo' : 'bekraftelse';
  const [eventId] = useQueryState('event');

  const dataSource = useDataSource();
  const eventsQuery = useQuery({
    queryKey: queryKeys.events.list,
    queryFn: () => dataSource.fetchEvents(),
  });
  const valtEvent = eventsQuery.data?.find((e) => e.id === eventId);

  // Genereringsvyn kräver ett RIKTIGT event — en direktlänk till
  // `?vy=generering` utan (eller med ett okänt) `?event=` faller tillbaka
  // till dokumentlistan i stället för att krascha på ett odefinierat event.
  if (vy === 'generering' && valtEvent) {
    return (
      <GenereringsVy
        key={`${valtEvent.id}-${mall}`}
        event={valtEvent}
        mall={mall}
        onTillbaka={() => {
          void setVy(null);
          void setMall(null);
        }}
        onTillDokumenten={() => {
          // TVÅ nycklar, EN navigering: nuqs buntar alla `set`-anrop i samma
          // tick till en enda `router.navigate` (dess egen update-kö), så
          // `RouteAnnouncer` ser EN href-ändring och annonserar högst en
          // gång. Att sätta dem i separata effekter hade gett flera
          // navigeringar och riskerat flera annonseringar (AC #4).
          //
          // [T176, 2026-08-29] `void setTyp('bilaga')` stod här som tredje
          // nyckel (TASK-340.2) — den slog på dokumentlistans bilage-filter i
          // samma navigering. Filtret är rivet (`DokumentLista` § docblock:
          // listan kan inte visa något ANNAT än bilagor längre), så
          // parametern är borta medan NAVIGERINGEN är oförändrad. Landningen
          // visar samma sak som förut.
          void setVy(null);
          void setMall(null);
        }}
      />
    );
  }

  return <DokumentYta />;
}
