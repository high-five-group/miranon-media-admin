// Källhash — SHA-256 över kanoniskt serialiserat bilage-ifyllnadsunderlag
// (TASK-309.4, ADR-125 § Beslut 3). Node+Deno dual-importable (samma
// "mirror-kontraktet" som `_shared/receipt-content.ts`/`_shared/mall-data.ts`
// redan etablerat) — INTE bara av testbarhetsskäl: ADR-125 § 3 kräver att
// adaptern (klienten, TASK-309.6) kan räkna om SAMMA hash för att härleda
// inaktualitet vid listning ("vid listning beräknar adaptern dagens hash av
// samma data och markerar raden inaktuell när de skiljer sig") — en hash
// räknad med två olika algoritmer på server och klient vore meningslös.
//
// VAD SOM HASHAS, OCH VARFÖR MALL-SPECIFIKT (inte hela
// DocumentSourcesResult): `T154`/ADR-125 § Konsekvenser kräver att
// dokumentet blir inaktuellt EXAKT när det som faktiskt trycktes skulle bli
// annorlunda — inte närhelst NÅGOT fält på eventet ändras. Bekräftelsebilagan
// och deltagarinformationen läser DISJUNKTA delmängder av `kopior`
// (bekräftelsebilagan bryr sig aldrig om `forberedelser`/`klader`/…,
// deltagarinformationen bryr sig aldrig om `pris`/`beskrivning`/…) — hashas
// hela underlaget skulle en ändring av ett fält deltagarinformationen inte
// ens visar felaktigt markera BEKRÄFTELSEBILAGAN som inaktuell. Anropa
// därför alltid med den REDAN MALL-RESOLVDA datan
// (`byggBekraftelseData`/`byggDeltagarinfoData`, `_shared/mall-data.ts`) —
// exakt den form Eta faktiskt fyller mallen med, aldrig råa
// standard/kopia-par.
//
// KANONISK FORM: `JSON.stringify` av värdet EFTER att varje objekts nycklar
// sorterats REKURSIVT (array-ORDNING bevaras oförändrad — ordningen är
// semantiskt meningsfull för t.ex. agenda-listorna). Två objekt med samma
// nyckel/värde-par i olika INSÄTTNINGSORDNING ger därmed IDENTISK
// serialisering och alltså samma hash.

/** Sorterar varje objekts nycklar REKURSIVT. Array-ordning orörd. */
function sorteraNycklarRekursivt(varde: unknown): unknown {
  if (Array.isArray(varde)) {
    return varde.map(sorteraNycklarRekursivt);
  }
  if (varde !== null && typeof varde === 'object') {
    const kalla = varde as Record<string, unknown>;
    const sorterat: Record<string, unknown> = {};
    for (const nyckel of Object.keys(kalla).sort()) {
      sorterat[nyckel] = sorteraNycklarRekursivt(kalla[nyckel]);
    }
    return sorterat;
  }
  return varde;
}

/** Den kanoniska JSON-strängen — deterministisk oavsett insättningsordning. */
export function serialiseraKanoniskt(varde: unknown): string {
  return JSON.stringify(sorteraNycklarRekursivt(varde));
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * SHA-256 (hex, gemener) över `serialiseraKanoniskt(data)`. Web Crypto
 * (`crypto.subtle`) är GLOBAL i både Deno och Node ≥ 19 — inget import,
 * inget Deno-specifikt API, se filhuvudet för varför det måste vara så.
 */
export async function berakaKallhash(data: unknown): Promise<string> {
  const kanoniskt = serialiseraKanoniskt(data);
  const bytes = new TextEncoder().encode(kanoniskt);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return bytesToHex(new Uint8Array(digest));
}
