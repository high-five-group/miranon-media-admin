// Kanonisk gräns-coercion: Airtable-fält-värden → domän-form.
//
// Airtable levererar lookup/rollup/multipleSelect som ARRAYER (även ett 1→1-
// lookup ger en 1-element-array; ett 1→många-rollup ger N element). Domänen vill
// ha skalärer ELLER explicita listor. Coercion namnges efter ARITET så avsikten
// syns i anropet — och så att ett genuint fler-värt fält ALDRIG tyst reduceras
// till ett (Lottas kärnkrav: tappa aldrig data). Det fanns tidigare en
// array-droppande `firstString` som maskerade exakt den buggen; den är borttagen
// till förmån för dessa.
//
// Endast dessa tre smala hjälpare delas — ingen generisk fält-mapper-framework
// (warranted DRY på en verklig invariant: Airtable-array ↔ domän).

/** En råform → en sträng: rå sträng, eller singleSelect/lookup-objekt {name}. */
function oneString(value: unknown): string | null {
  if (typeof value === 'string') return value.length > 0 ? value : null;
  if (value && typeof value === 'object' && 'name' in (value as Record<string, unknown>)) {
    const name = (value as { name?: unknown }).name;
    return typeof name === 'string' ? name : null;
  }
  return null;
}

/**
 * singleSelect / multipleSelect-objekt eller sträng → namn (string|null).
 * Kanonisk kopia (ersätter de fyra inline-dubbletterna i list/detalj-EF:erna).
 */
export function selectName(value: unknown): string | null {
  return oneString(value);
}

/**
 * Genuint SKALÄRT Airtable-fält → string|null. Lookups levereras som array även
 * när de är 1→1 — en 1-element-array coercas tyst till sitt värde. Men >1 element
 * på ett fält vi behandlar som skalärt är en DATA-FORM-AVVIKELSE: vi loggar
 * (server-side) och tar första — vi sväljer det ALDRIG tyst. Ren skalär passerar
 * oförändrad.
 */
export function scalarString(value: unknown): string | null {
  if (Array.isArray(value)) {
    if (value.length > 1) {
      console.warn(
        `scalarString: förväntade skalärt fält men fick ${value.length} värden — tar första (data-form-avvikelse)`,
      );
    }
    return value.length > 0 ? oneString(value[0]) : null;
  }
  return oneString(value);
}

/**
 * FLER-VÄRT Airtable-fält (lookup/rollup 1→många) → string[]. Bevarar ALLA
 * värden (inga tysta drop). Tom/saknad → []. En ensam skalär → ettelements-array
 * (form-robusthet). Filtrerar bort icke-strängbara element.
 */
export function stringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(oneString).filter((s): s is string => s !== null);
  }
  const one = oneString(value);
  return one === null ? [] : [one];
}
