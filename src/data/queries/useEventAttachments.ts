import { useQuery } from '@tanstack/react-query';
import { useDataSource } from '@/data/useDataSource';
import type { Attachment } from '@/domain/models/Attachment';
import { queryKeys } from '@/queries/keys';

/**
 * Eventets bilagor (`get-event-attachments`, TASK-147.5) — EN hemvist för
 * frågan, delad av `DokumentYta.tsx` (listan) och `GenereringsVy.tsx`
 * (knappetiketten "Skapa om …").
 *
 * VARFÖR HOOKEN FÖDDES HÄR (TASK-340.2, PRD `TASK-340` § E): genereringsvyn
 * måste veta OM en Event-mallad rad redan finns för (event × mall), annars
 * kan knappen inte säga "Skapa om <dokumentnamnet>" när Lotta är på väg att
 * skriva över den befintliga bilagan. Frågan var redan ställd — inline i
 * `DokumentYta.tsx` — och genereringsvyn nås ALLTID därifrån, så svaret
 * ligger redan i React Query-cachen under SAMMA nyckel
 * (`queryKeys.attachments.byEvent`). Att skriva en andra inline-`useQuery`
 * med samma nyckel hade fungerat men gett två ställen att hålla i synk;
 * att hämta via en ny nyckel hade betalat ett extra nätverksanrop för data
 * appen redan har.
 *
 * NYCKELN ÄR DELAD MED INVALIDERINGEN, och det är hela poängen:
 * `useGenereraEventBilaga`/`useSkapaOmEventBilaga`/`useUploadAttachment`
 * invaliderar `attachments.byEvent(eventId)` när de lyckas, så BÅDA ytorna
 * uppdateras av samma skrivning utan att någon av dem känner till den
 * andra.
 *
 * `eventId: null` (räckviddsläget i `DokumentYta`, ADR-118 beslut 5) håller
 * frågan avstängd — `enabled: false` — i stället för att skicka en tom
 * sträng till EF:en. `queryKey` bär ändå `''` i det läget: nyckeln måste
 * vara serialiserbar och stabil, och en avstängd query hämtar aldrig något
 * att förväxla.
 */
export function useEventAttachments(eventId: string | null) {
  const dataSource = useDataSource();

  return useQuery<Attachment[]>({
    queryKey: queryKeys.attachments.byEvent(eventId ?? ''),
    queryFn: () => dataSource.fetchEventAttachments(eventId ?? ''),
    enabled: eventId != null,
  });
}
