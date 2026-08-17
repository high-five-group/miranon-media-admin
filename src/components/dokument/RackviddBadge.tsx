import { stegEtikett } from '@/components/dokument/nivaSprak';
import { AttachmentScope, type AttachmentScopeValue } from '@/domain/types/Status';

/**
 * Räckviddsbadgen (TASK-275.3, ADR-118 beslut 2+5) — markerar en GEMENSAM
 * bilaga (räckvidd Kurstyp/Alla event) i eventläget och i Åtgärds-sidans
 * bilageväljare (ORDLISTA.md § Gemensam bilaga: "syns automatiskt, märkt med
 * räckviddsbadge, i varje berört events dokumentlista och i Åtgärds-sidans
 * bilageväljare"). RENDERAR INGET för `rackvidd` Event/`null` — en bilaga
 * som "bara" hör till DETTA event behöver ingen förklarande badge, badgen
 * finns för att förklara VARFÖR en rad dyker upp som INTE laddades upp här
 * (ADR-118 beslut 3: badgen "bär förklaringen" till varför Ersätt/Radera
 * saknas i eventkontext).
 *
 * HUSETS PILL-GRAMMATIK, INGEN NY FORMUPPFINNING (Marcus kvalitetsdirektiv
 * 2026-08-17): EXAKT samma klass-sträng som den neutrala metadata-pillen på
 * tre andra ställen i appen (`Gruppdynamik.tsx` rad ~160, `AtgardsSida.tsx`
 * rad ~915, `Deltagare.tsx` rad ~1099) — `rounded-full border
 * border-transparent bg-bg-muted px-2 py-0.5 font-medium text-caption
 * text-text-secondary contrast-more:border-border-strong`. Samma
 * `sm`-steg som `StatusBadge.tsx`s Pill-skala dokumenterar (list-/kortmiljö,
 * `px-2 py-0.5 text-caption`) — men INTE `StatusBadge` självt: den bär bara
 * success/warning-toner, och en räckviddsbadge är ren METADATA (varken
 * lyckat eller varnande), samma semantiska klass som "Klass"-pillen den
 * härmar. `border-transparent` reserverar plats för `contrast-more:border`
 * utan layout-hopp — samma tre-regels-disciplin `StatusBadge.tsx` § PILL_
 * STORLEK dokumenterar.
 *
 * TEXTEN, GUNILLA-LÄSBAR: "Alla event" (rakt av) eller "<Kursfamilj> · Nivå
 * N" / "<Familj> · Alla steg" (tom-nivå-regeln, ADR-118 beslut 1 —
 * EXPLICIT utskriven i stället för underförstådd, samma "gissa aldrig eller
 * lämna tvetydigt"-linje som `Attachment`-modellens `dokumentklass: null` →
 * "Okänd").
 */
export function RackviddBadge({
  rackvidd,
  kursfamilj,
  kursniva,
}: {
  rackvidd: AttachmentScopeValue | null;
  kursfamilj: string | null;
  kursniva: string | null;
}) {
  if (rackvidd !== AttachmentScope.KURSTYP && rackvidd !== AttachmentScope.ALLA_EVENT) return null;

  const text =
    rackvidd === AttachmentScope.ALLA_EVENT
      ? 'Alla event'
      : // "Okänd familj", inte "Okänd kursfamilj" — samma UI-språksbyte som
        // uppladdningsflödets Select-etikett (S107 QA-vandringen, Marcus:
        // "Kursfamilj" heter bara "Familj"). Prop-namnen `kursfamilj`/
        // `kursniva` är ORÖRDA med avsikt: de speglar Airtable-fälten, och
        // datakällans namn byts inte från en UI-copy-ändring.
        //
        // `stegEtikett` översätter basvärdet 'Nivå 1' → 'Steg 1' (Marcus
        // 2026-08-17). Mappningen bor i DokumentYta.tsx och är den ENDA
        // platsen ordet översätts — se dess docblock för den öppna
        // kollisionen mot wizardens egna "Steg 1"/"Steg 2".
        `${kursfamilj ?? 'Okänd familj'} · ${stegEtikett(kursniva) ?? 'Alla steg'}`;

  return (
    <span className="inline-flex shrink-0 items-center rounded-full border border-transparent bg-bg-muted px-2 py-0.5 font-medium text-caption text-text-secondary contrast-more:border-border-strong">
      {text}
    </span>
  );
}
