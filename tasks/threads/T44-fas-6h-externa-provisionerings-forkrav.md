# T44 — Fas 6h externa provisionerings-förkrav (Marcus-ägda)

- **Tillstånd:** `paused` (parkerad — inväntar Marcus-provisionering)
- **Uppstod:** Session 39 (Fas 6h L2a/L2c — Resend läge 1: ingen nyckel)
- **Commit-tagg:** `git log --grep "\[T44\]"`

> ⚠️ **GRINDAR FAS 6H-PROGRESSION — får ej glömmas vid resume.** Trådens
> `paused` betyder "väntar på Marcus", INTE "lågprioriterat". M2 grindar L2d;
> M3 + Code-at-prod-deploy grindar 6h prod-deploy. Fas 6h kan inte avslutas
> förrän dessa externa handlingar är gjorda av rätt ägare via rätt kanal.

## Varför denna tråd

Fas 6h (bulk-mail på segment, [ADR-067](../../docs/decisions/ADR-067-bulk-mail-segment-send-kontrakt.md))
har externa förkrav som Chat och Code **inte kan utföra** — de kräver att Marcus
provisionerar konton/nycklar/DNS via rätt kanaler. Per Marcus-direktiv (+ L26 +
11/10) ska varje sådan handling stå **ägar-taggat i durabel dokumentation**,
aldrig i Chat-minne (efemärt) och aldrig som credential-i-repo/chatt. Stängningen
av Session 39 bar staging-Resend-nyckeln som en lös carry-rad; denna tråd lyfter
hela förkravs-mängden till standard.

## MARCUS-ÄGDA (externt — Chat/Code kan EJ utföra)

- **M1 — Resend-konto.** Skapat/ägt av Marcus. Förutsättning för M2 + M3.
- **M2 — Staging-test-nyckel.** Marcus skapar en domän-lös / test-only
  Resend-API-nyckel och sätter den **själv** som Supabase **staging**-secret
  (`RESEND_API_KEY`, eller det namn EF:en förväntar — se
  [`send-email/index.ts`](../../supabase/functions/send-email/index.ts)
  `makeRealBatchSender`). **Nyckelvärdet går ALDRIG genom chatten** (secure-
  handling; jfr T40:s prod-lösenord-i-kanal = ej tillåten väg). **GRINDAR:**
  Fas 6h **L2d** (riktiga Resend-gränsen mot test-adresser `delivered@`/
  `bounced@`/`complained@`/`suppressed@resend.dev`).
  - **STATUS: PROVISIONERAD 2026-06-28.** `RESEND_API_KEY` + `RESEND_FROM=onboarding@resend.dev`
    satta på Supabase **staging** (värde-fritt bekräftade Session 40). **Grindar ej längre**
    Fas 6h **L2d** (L2d KLAR staging — riktig Resend-gräns + Utskickslogg-merge + idempotens +
    422/503 verifierade). Nyckelvärdet gick aldrig genom chatten.
- **M3 — Prod-nyckel + VERIFIERAD domän.** Marcus provisionerar en
  prod-Resend-nyckel **och** verifierar avsändardomänen via DNS
  (resend.com/domains). **GRINDAR:** 6h **prod-real-send** — Resend hård-spärrar
  riktiga mottagare utan verifierad domän (ADR-067-research). En prod-nyckel utan
  verifierad domän räcker INTE för riktiga utskick.
  - **Domän (konkret, 2026-06-28):** `miranon.dev`, registrerad hos GoDaddy
    (Marcus). Avsedd som verifierad avsändardomän för prod-Resend — `RESEND_FROM`
    byter från `onboarding@resend.dev` (staging/läge-1) till en `miranon.dev`-adress
    **vid prod-deploy, EJ före** (staging fortsätter på `onboarding@resend.dev`).
  - **FRÅGAN AVGJORD (S95 2026-08-02, T95-grillningen beslut 3+4): SUBDOMÄN.**
    Utskick sker från `send.miranon.dev`; DMARC på `miranon.dev` sätts till
    `p=reject` + rua direkt (Marcus-sakuppgift S95: inget skickas från domänen
    i dag, `send-email` sövd ⇒ noll historik att bryta). Psionautics-korsläsningen
    gjordes och gav MOTSATT vägledning än raden antog: deras root-setup
    (`noreply@h5gruppen.se`) är per deras egen lesson ett erkänt provisorium,
    inte ett mönster. Resends förstapartsrekommendation (sändande subdomän för
    reputation-isolering) styrde. Beslut + underlag: sessionsdok S95 Del 2;
    operativ checklista: T46-kartans Grind 0-paket. `RESEND_FROM`-bytet från
    root utförs vid SMTP-/DNS-momentet, ej före.
  - **TIMING:** åtgärd vid M3 / prod-deploy efter L3 + 6h arch-audit; faktumet
    registreras NU (durabilitet — Chat-minne efemärt), inte väntande på avslut.

## CODE-AT-PROD-DEPLOY (under Marcus-auktorisation — EJ Marcus-only)

Listas för fullständighet; dessa utför Code vid prod-deploy-handlingen (separat
auktoriserad), **ej** M-taggade:

- Prod-secret `ENVIRONMENT='production'` (fail-closed icke-prod-spärren, L206 —
  utan denna behandlar EF:en prod som icke-prod och vägrar riktiga mottagare).
- Prod `Idempotensnyckel`-kolumn på Utskickslogg (additivt, **hård ordning FÖRE
  EF-deploy**, 6f-mönstret / §Kända fällor 37-klass).
- Prod-deploy av `send-email` + den refaktorerade `compute-segment` (T39:s
  prod-drift adresseras i samma veva — prod bär gamla compute-segment).

## GRINDAR (sammanfattat)

| Förkrav | Ägare | Grindar |
|---|---|---|
| M2 staging-test-nyckel | Marcus | Fas 6h **L2d** |
| M3 prod-nyckel + verifierad domän | Marcus | 6h **prod-real-send** |
| ENVIRONMENT=production + prod-kolumn + prod-deploy | Code (Marcus-auktoriserad) | 6h **prod-deploy** |

## Relaterat

- [ADR-067](../../docs/decisions/ADR-067-bulk-mail-segment-send-kontrakt.md) (send-kontraktet, läge-1-research)
- T39 (compute-segment prod-drift — adresseras vid prod-deploy)
- T40 (prod-test-user — samma secure-channel-princip för credentials)
- L206 (fail-closed ENVIRONMENT-flagga) · L207 (risk-trappa)

## Migrerat ur indexraden (`TASK-157.2`, 2026-08-07)

> Ordagrann text som tidigare bodde i `tasks/threads/README.md`s Titel-
> och/eller Ingång-kolumn för denna tråd, flyttad hit av registrets
> tunna radform-migration (ADR-098). Inget härunder är omskrivet —
> emfas-markörernas STIL (*...* vs *...*) normaliseras separat av
> `npx markdownlint-cli2 --fix` mot filens egen etablerade MD049-stil,
> inte av denna migration.

**Ingång (fullständig, ursprunglig):**
[T44-fas-6h-externa-provisionerings-forkrav.md](T44-fas-6h-externa-provisionerings-forkrav.md) — ⚠️ GRINDAR 6h: M1 Resend-konto / M2 staging-test-nyckel→L2d / M3 prod-nyckel+verifierad-domän→prod-real-send (Marcus-ägda, secure-channel); Code-at-prod-deploy separat. **Root-vs-subdomän-frågan AVGJORD S95:** utskick från `send.miranon.dev`, DMARC `p=reject` (T95-grillningen beslut 3+4; se kortet + T46:s Grind 0-paket)
