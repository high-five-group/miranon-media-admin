# En enda `esm.sh`-import i toppen gör HELA den delade filen otestbar i Node

TASK-309.22 (2026-08-26), miranon-media-admin · `_shared/attachments.ts`

**[UNIVERSAL]**

**Vad som antogs:** att `sanitizeFilnamn`/`buildAttachmentLeaf` — två rena
strängfunktioner utan Deno-beroenden — skulle gå att importera direkt i ett
Playwright/Node-test (`api-pure`) från `_shared/attachments.ts`, precis som
`tests/api/course-dimensions.test.ts` redan gör mot en annan `_shared`-fil.

**Vad som faktiskt hände:** `node -e "import('.../attachments.ts')"` kastade
omedelbart —

```text
Error [ERR_UNSUPPORTED_ESM_URL_SCHEME]: Only URLs with a scheme in: file and
data are supported by the default ESM loader. Received protocol 'https:'
```

INNAN någon av filens funktioner ens anropades. Orsaken: `attachments.ts` har
`import { z } from 'https://esm.sh/zod@4';` överst — för en HELT ANNAN
angelägenhet (räckviddsvalidering, `AttachmentScopeInputSchema`). ES-modulers
alla top-level-imports resolvas innan modulkroppen körs, så EN esm.sh-import
någonstans i filen gör HELA filen ett strukturellt otestbart Node-import,
oavsett vilken specifik export testet faktiskt behöver.

**Hur det upptäcktes:** ett minimalt 2-radigt repro (`node -e`) INNAN
enhetstestfilen skrevs — samma "testa nytt bibliotek/approach minimalt
innan full implementation"-disciplin som redan står i `CLAUDE.md`, tillämpad
på en import-mekanism i stället för ett bibliotek.

**Hur det löstes:** de zod-fria pura funktionerna (`sanitizeFilnamn`,
`buildAttachmentLeaf`, `buildAttachmentPath`) flyttades till en NY, helt
importfri fil (`_shared/attachment-filename.ts`), re-exporterad oförändrat
från `attachments.ts` — noll konsument-ändringar för de 13 EF-filer som redan
importerade dem. Den nya filen lades dessutom till `tsconfig.edge-shared.json`s
include-lista (en redan existerande, disciplinerad mekanism för exakt denna
klass moduler: "transitivt Deno-fri" pura `_shared`-filer får äkta
Node-tsc-täckning i stället för att bara typas av Deno vid deploy).

**Generalisering:** innan ett enhetstest planeras mot en `_shared`-fil i ett
Deno/Node-hybridrepo, grep:a filens EGNA topp-imports (inte bara den
specifika funktionens beroenden) för `https://esm.sh/` eller andra
URL-scheman. En enda sådan rad — även för en HELT ANNAN export än den som
ska testas — blockerar hela filen. Symptomet (`ERR_UNSUPPORTED_ESM_URL_SCHEME`)
är omedelbart och entydigt, men kostar en hel diagnosrunda om man inte vet
att man letar efter det.
