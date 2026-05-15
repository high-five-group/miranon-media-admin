# ADR-004: TypeScript `baseUrl` proaktiv borttagning

- **Status:** Accepted
- **Datum:** 2026-04-14
- **Fas:** 0

## Kontext

Initial `tsconfig.app.json` innehöll path-alias-konfiguration enligt Vite-templaten:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

När `npm run build` kördes varnade TypeScript:

```text
tsconfig.app.json(26,5): error TS5101: Option 'baseUrl' is deprecated and will
stop functioning in TypeScript 7.0. Specify compilerOption '"ignoreDeprecations":
"6.0"' to silence this error.
```

Eftersom Fas 0-verifieringen krävde "bygger utan varningar" blev detta en blockerare. Felaktigt motiverade jag (Claude) fixen med "TS 7.0 deprecated, måste fixas nu" — den riktiga kontexten är att TS 6.0.2 (den installerade versionen) bara visar en deprecation-varning, den har inte tagit bort funktionen. Den kunde ha tystats med `"ignoreDeprecations": "6.0"`.

## Beslut

Ta bort `baseUrl: "."` helt ur `tsconfig.app.json`. Behåll `paths`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

Sedan TypeScript 5.4 fungerar `paths` utan `baseUrl` — rotsökvägen blir `tsconfig.json`-filens egen directory. Ingen funktionell förändring, ingen deprecation-varning, framtidssäkert för TS 7.0.

## Alternativ som övervägdes

**1. Behåll `baseUrl` + lägg till `"ignoreDeprecations": "6.0"`**

- **Fördelar:** Minimal förändring, samma beteende som tidigare.
- **Nackdelar:** Deprecation-varningen återkommer när vi migrerar till TS 7.0 (okänd tidpunkt). Skapar teknisk skuld som måste fixas senare ändå.

**2. Använd absoluta imports utan alias (`../../../lib/cn`)**

- **Fördelar:** Ingen config alls.
- **Nackdelar:** Ful och bräcklig — flyttar vi en fil bryts alla imports. Biomes `useSortedClasses` och andra sort-regler bryr sig inte, men mänskliga läsare gör det.

**3. Använd en ren relativ stil (`./lib/cn` från `src/`)**

- **Fördelar:** Fungerar out-of-the-box.
- **Nackdelar:** Samma som ovan.

## Konsekvenser

**Positivt:**

- Ingen deprecation-varning vid `npm run build` eller `tsc -b`
- `@/`-alias fungerar identiskt: `import { env } from '@/env'` i `src/data/config/supabase-client.ts`
- Framtidssäkert för TS 7.0-migration
- En rad mindre config att underhålla

**Negativt:**

- **Motivationen var initialt fel.** Jag skrev "TS 7.0 deprecated" utan att verifiera installerad version (TS 6.0.2 hade bara varningen). Det gav Marcus legitim anledning att ifrågasätta framtida versionsbaserade motiveringar.
- Ny universell lärdom: `[UNIVERSAL]` i `tasks/lessons.md` — "Hävda aldrig en specifik versionsorsak utan att först verifiera installerad version med faktiskt kommando (`tsc --version`, `node --version`, `npm ls <paket>`)."

## Referenser

- `tasks/lessons.md` — den universella lärdomen om versionsverifiering
- `tsconfig.app.json` — den faktiska konfigurationen
- TypeScript 5.4 release notes — `paths` utan `baseUrl` blev stött
