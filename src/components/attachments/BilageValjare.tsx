import { Check, Paperclip } from 'lucide-react';
import { Checkbox } from 'react-aria-components';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Skeleton } from '@/components/primitives/Skeleton';
import { formatMB } from '@/data/adapters/attachmentUpload';
import type { Attachment } from '@/domain/models/Attachment';

/**
 * [TASK-455] UTBRUTEN UR `AtgardsSida.tsx` — DELAD, inte kopierad. Formen och
 * all logik nedan är BYTE-IDENTISK med Åtgärds-sidans stämplade facit
 * (`tasks/sessions/bilagor/s93-atgardssida-promovering/facit.json`); flytten
 * är en ren kodrelokering, ingen renderingsändring — `AtgardsSida.tsx`
 * importerar nu härifrån i stället för att äga en egen kopia. Andra konsument:
 * `Forhandsvisning.tsx` (svepets per-eventgrupp-bilageväljare, samma kortets
 * AC #1) — se dess docblock för hur den scopar `attachments`/`valda`/`onVaxla`
 * PER event-grupp i stället för per event-sida.
 *
 * KRYSSRUTANS RUTA — EN form för appens bilage-/betalnings-kryss (varv 14,
 * `AtgardsSida.tsx`s historik).
 *
 * Marcus 2026-08-07: "nu har vi också flera olika typer av checkboxar. En blå
 * och en svart. Jag gillar den blåa mer faktiskt."
 *
 * Han hade sett två former på SAMMA sida, och båda var mina: bilageväljarens
 * native `<input type="checkbox">` (varv 10) och betalningarnas RAC-kryss
 * (varv 13). De skilde sig i tre mått samtidigt — 16 mot 20 px, radie 0 mot
 * 4 px, och färg.
 *
 * FÄRGEN VAR EN BUGG, INTE ETT VAL. Se `components.css` § Kryssruta: den blå
 * kom ur att `--mm-color-primary` inte existerar, så `accent-color` föll till
 * webbläsarens `auto` — på macOS användarens EGEN systemaccent. Blått är nu en
 * riktig token (`--p-blue-9`), och därmed samma färg för Lotta som för Marcus.
 *
 * RAC-FORMEN VANN ÖVER NATIVE, av två skäl som båda är mätbara: den är appens
 * etablerade (4 av 5 kryss i `src/components/` bär exakt denna klassrad —
 * `Betalningar`, `Deltagare`, `EventCheckin` och Åtgärds-sidan), och
 * `accent-color` kan bara styra FÄRG — inte radie, storlek eller bockens form.
 * Native hade alltså aldrig kunnat matcha de andra fyra.
 *
 * INVENTERINGEN AV HELA APPEN ÄR EN EGEN TRÅD (`T134`), per Marcus: "samma sak
 * här som med pills och knappar, inventera och kolla". Denna konstant löser
 * bilageväljaren (Åtgärds-sidan OCH svepet sedan TASK-455, samma delade form);
 * de tre andra filerna ägs av S93 och rörs inte härifrån.
 *
 * STORLEKEN ÄR 16 px SEDAN VARV 17 (Marcus: "Kan vi göra checkboxen lite
 * mindre? Känns ganska stor"), ned från förlagans `size-5` (20 px). Bocken
 * följde med 14 → 12 px så proportionen inuti rutan hålls.
 *
 * DETTA ÄR EN MEDVETEN AVVIKELSE FRÅN DE TRE ANDRA, inte en ny drift: de bär
 * fortfarande 20 px, och `T134`:s app-svep ska ta ställning till vilket mått
 * som blir appens. Åtgärds-sidan gick först eftersom den är ytan Marcus
 * granskar; avvikelsen är bokförd i tråden så varje ny konsument (nu svepet)
 * ärver frågan i stället för att upptäcka den på nytt.
 */
export const KRYSSRUTA_KLASS =
  'flex size-4 shrink-0 items-center justify-center rounded border border-(--mm-input-border) bg-(--mm-input-bg) group-data-[selected]:border-(--mm-checkbox-selected-border) group-data-[selected]:bg-(--mm-checkbox-selected-bg)';

/* ================================================================== *
 * BILAGEVÄLJAREN — utan förvals-logik. Kryssruta, namn, storlek.
 *
 * `antalMottagare`-proppen FÖLL MED KLASSTEXTERNA (varv 10, Åtgärds-sidans
 * historik): den fanns bara för att klass C:s rad skulle kunna säga
 * "Genereras för var och en — N st". Den togs bort i stället för att lämnas
 * oanvänd — en prop som inget läser påstår ett beroende som inte finns.
 *
 * [TASK-147.5] `attachments` KOMMER FRÅN SERVERN (anroparens `useQuery`/
 * `useEventAttachments`), inte en hårdkodad array. Storleken visas ALLTID
 * (real data bär alltid en verklig `storlekBytes`). `formatMB` ÅTERANVÄND ur
 * `attachmentUpload.ts` (samma helper upload-flödet redan visar fel med) —
 * ingen ny kB-vs-MB-formatterare uppfunnen här.
 *
 * ANROPAREN ÄGER DATA-HÄMTNINGEN OCH URVALS-STATE (`valda`/`onVaxla`) — denna
 * komponent är ren presentation plus en toggle-callback, medvetet, så BÅDA
 * konsumenterna kan scopa "vilket event" och "vilket urval" på sitt eget sätt
 * (Åtgärds-sidan: ett event per sida. Svepet: ett urval PER event-grupp,
 * `Forhandsvisning.tsx`).
 * ================================================================== */
export function BilageValjare({
  attachments,
  laddar,
  fel,
  valda,
  onVaxla,
}: {
  attachments: Attachment[];
  laddar: boolean;
  fel: boolean;
  valda: Set<string>;
  onVaxla: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2 py-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-small text-text-muted">
          <Paperclip aria-hidden="true" size={14} />
          Bilagor
        </span>
        <span className="text-small text-text-secondary">
          {valda.size === 0 ? 'Inga valda' : `${valda.size} valda`}
        </span>
      </div>

      {/* RADEN ÄR KRYSSRUTA + NAMN + STORLEK, inget mer (varv 10, Åtgärds-
          sidans historik).

          IKONERNA ÄR BORTA (Marcus: "Ta bort alla ikoner för dokumenten,
          räcker med kryssrutan"). HOVER ÄR HELT BORTA (varv 11, Marcus: "Jag
          vill nog ta bort hover helt").

          VAD SOM BÄR AFFORDANSEN: `cursor-pointer` för mus, kryssrutans egen
          fokusring för tangentbord, och kryssrutans eget markerade läge som
          resultat-återkoppling. Raden är klickbar i hela sin bredd (RAC:s
          `Checkbox` ÄR sin egen etikett-yta) utan att signalera det visuellt
          vid hover — ett medvetet val, inte en glömska.

          `items-center` i stället för `items-start`: raden är enradig, så en
          `mt-0.5`-justering mot en tvåradig text vore onödig. */}
      {laddar ? (
        /* [TASK-416.11, ADR-113 steg 4] SKELETON I STÄLLET FÖR NAKEN LADDTEXT.
           `role="status" aria-busy="true"` + `sr-only`-besked: samma
           Roselli-mönster som `Skeleton`s eget docblock beskriver — blocket
           är dekorativt, konsumenten äger busy-beskedet. RADHÖJDEN ÄR EXAKT:
           `h-11` (44 px) = `py-2.5` (2×10 px) + `text-body`s 1lh (24 px). */
        <div role="status" aria-busy="true" className="flex flex-col gap-2">
          <span className="sr-only">Hämtar bilagor…</span>
          <Skeleton variant="listRow" className="h-11" />
          <Skeleton variant="listRow" className="h-11" />
        </div>
      ) : fel ? (
        <MessageBox intent="warning" title="Bilagorna kunde inte hämtas">
          Prova att öppna åtgärden igen. Går det inte skickas mailet ändå, utan bilaga.
        </MessageBox>
      ) : attachments.length === 0 ? (
        <p className="px-3 py-2.5 text-small text-text-muted">
          Inga bilagor tillgängliga för det här eventet.
        </p>
      ) : (
        <div className="divide-y divide-border rounded-lg bg-surface">
          {attachments.map((b) => (
            <Checkbox
              key={b.id}
              isSelected={valda.has(b.id)}
              onChange={() => onVaxla(b.id)}
              aria-label={`Bifoga ${b.namn}`}
              className="group flex cursor-pointer items-center gap-3 px-3 py-2.5"
            >
              <span className={KRYSSRUTA_KLASS}>
                <Check
                  aria-hidden="true"
                  size={14}
                  className="text-(--mm-checkbox-check) opacity-0 group-data-[selected]:opacity-100"
                />
              </span>
              {/* [TASK-339] Räckviddsbadgen (RackviddBadge, TASK-275.3) TAGEN
                  BORT härifrån — Marcus prod-röktest 2026-08-29: "blir inte
                  snyggt". Unionen (event-egen + delad, TASK-275.2/TASK-452)
                  är OFÖRÄNDRAD, bara räckviddsmarkeringen är borta. */}
              <span className="min-w-0 flex-1 truncate font-medium text-body">{b.namn}</span>
              <span className="ml-auto shrink-0 text-small text-text-muted">
                {formatMB(b.storlekBytes)}
              </span>
            </Checkbox>
          ))}
        </div>
      )}
    </div>
  );
}
