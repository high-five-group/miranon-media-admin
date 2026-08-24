import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useQueryState } from 'nuqs';
import type { MallId } from '@/components/dokument/blockDefinitioner';
import { DokumentYta } from '@/components/dokument/DokumentYta';
import { GenereringsVy } from '@/components/dokument/GenereringsVy';
import { useDataSource } from '@/data/useDataSource';
import { queryKeys } from '@/queries/keys';

export const Route = createFileRoute('/_authenticated/mer/dokument')({
  staticData: { title: 'Dokument' },
  component: DokumentPage,
});

// Mer — Dokument-ytan (`T131`): /mer/dokument. Ytan där bilagor förvaltas
// (ORDLISTA § Bilaga: "Dokument är YTAN i Mer där bilagor hanteras").
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
// (`MallRad`) sätter `?vy`/`?mall` via samma nuqs-nycklar; `?event=` är
// delad mellan båda lägena (samma queryKey). <Outlet/> bärs av
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
      />
    );
  }

  return <DokumentYta />;
}
