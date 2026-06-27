# ADR-015: `send-email` direkt Resend-anrop — medveten skuld med dokumenterad migrationsväg

- **Status:** Superseded by [ADR-067](ADR-067-bulk-mail-segment-send-kontrakt.md)
- **Datum:** 2026-05-05 (skrivs i P3a, refereras i Fas 6e om sendEmail deployas)
- **Fas:** 6e (Mer-fliken, villkorlig)

> **Superseded by [ADR-067](ADR-067-bulk-mail-segment-send-kontrakt.md) (Session 39, 2026-06-28):** send-kontraktet ersätts i grunden. Detta beslut (enkel-mottagar, transaktionell direct-Resend) blev ALDRIG implementerat — `sendEmail` förblev no-op-stub. Fas 6h behövde bulk-på-segment, vilket den landade `MailPayloadSchema` redan modellerade; ADR-067 är det första riktiga send-kontraktet (Resend `/emails/batch`, två-lagers idempotens, consent-gate, partial-failure-status). Migrationsväg-resonemanget nedan (direct-Resend → mail-event-pattern vid empirisk trigger) lever vidare som deferrad durabel-kö-tråd. Beslutstexten nedan bevaras oförändrad (immutabilitet).

## Kontext

Per A5-klassningen (P1-sessionsdok Del 3): `sendEmail` är en av 9 TODO-metoder i `AirtableAdapter`. Klassen är "**Defer → Fas 6e**, eventuell death-march" — sub-fasens scope är villkorlig. Om Mer-fliken behåller mail-vy (Marcus + Lottas beslut vid Fas 6e-start), deployas `send-email` Edge Function. Om mail-vyn elimineras, raderas stub:en istället.

Vid eventuell deploy är arkitekturfrågan: hur ska mail skickas?

**Två arkitekturvägar:**

1. **Direct-Resend-anrop:** EF skickar HTTP POST direkt till Resend API från Deno-runtime. Mail-content + mottagare i request-body. Synkron pattern, latency 200-500ms.

2. **Mail-event-pattern:** EF lägger en `mail_event` i Airtable (eller queue post-Fas E), separat worker plockar event:et och kallar Resend. Asynkront, reliability via retry, ev. mail-batching, audit-log-vänligt.

Mail-event-pattern är "rätt" arkitektur men kräver:

- Worker-deploy-pipeline (separat från EFs)
- Queue-tabell + cleanup-cron
- Retry-logik + dead-letter-queue
- Audit-log-integration
- 1-2 sessioner extra arbete

I psionautics (Roger/Lottas systerprojekt) implementerades direct-Resend-anrop initialt — och det har fungerat utan incident i över ett år. För Miranon Media Admin är mail-volymen lägre (admin-app, Lotta är ensam användare → ~5-20 mail/dag på höga volymer).

Per UNIVERSAL "Operations utan empirisk användning är onödig attack-yta" (M4-principen): mail-event-pattern utan empirisk drift-data är överingengjorting. Direct-Resend som start, mätning av drift-incidenter, migration när data motiverar.

## Beslut

`send-email` Edge Function implementeras med **direkt Resend-anrop** vid Fas 6e-deploy (om Mer-fliken behåller mail-vy). Detta är medveten **arkitekturskuld** med dokumenterad migrationsväg.

**Direct-Resend-implementation:**

- EF tar `to`, `subject`, `body_html`, `body_text` (+ `from` från env-config)
- Synkron POST till `https://api.resend.com/emails` med `RESEND_API_KEY` från env
- Returnerar `{messageId, sentAt}` vid framgång, INVARIANT-fail vid Resend 4xx/5xx
- Klient visar toast med `requestId` (per Fas A M7) vid fel

**Migrationsväg (mail-event-pattern):**
Trigger för migration är **endera av**:

1. Lotta rapporterar 2+ mail-incidenter (saknat mail, dubblett-mail, fel mottagare) inom 30 dagar
2. Daglig mail-volym överstiger 50/dag (5x dagens estimat)
3. Compliance-krav på audit-log för utskickade mail (t.ex. GDPR-bevis-spår)
4. Fas E (Supabase-migration) ger pg_cron + queue-tabell utan extra deploy-overhead

Vid migration: ny ADR skrivs som superseder denna (`Supersedes ADR-015`). Mail-event-pattern dokumenteras med worker-implementation, queue-schema, retry-policy.

## Alternativ som övervägdes

**Alt 1 — Mail-event-pattern direkt vid Fas 6e-deploy.** Avvisat: 1-2 sessioner extra arbete, ingen empirisk data om reliability-behov. Bygger för hypotetiskt problem.

**Alt 2 — Skippa sendEmail helt, manuell mail från Lottas Gmail.** Avvisat: vissa flöden (väntelista-bekräftelse, betalpåminnelse) gynnas av automation. Manuell mail bryter operativ flöde.

**Alt 3 — Defer:a `send-email` till Fas E.** Avvisat: Fas E är post-Fas 7. Mer-fliken är Fas 6e. Mail-funktion utan deploy hela Fas 6e + 6.5 + 7 är 4-5 sessioner försening på en operativ funktion Lotta kan behöva.

**Alt 4 — Använd extern mail-tjänst (Mailgun, SendGrid) istället för Resend.** Avvisat: Resend är redan etablerat i psionautics + outsidereality-domänen är verifierad i Resend. Byta tjänst för Miranon Media Admin är onödig kostnad.

## Konsekvenser

**Positiva:**

- Snabb deploy (1 EF-fil + env-config), Mer-fliken levereras inom Fas 6e:s 0,5 session.
- Etablerat mönster från psionautics — låg risk för okända fallgropar.
- Migrationsvägen dokumenterad → framtida utvecklare (eller framtida-jag) vet *när* det är dags att refaktorera, inte bara *att* det bör göras.

**Negativa:**

- **Single point of failure:** om Resend är nere, fallar mail. Ingen retry-mekanism. Mitigation: TanStack `useMutation` har retry-config, men det är klient-side — Resend-downtime mellan EF och Resend ger fortfarande fail. Acceptabel risk vid ~5-20 mail/dag.
- **Ingen audit-trail som överlever EF-restart:** mail skickas, ingen lokal kopia. Aktivitetsloggen (Fas 6.5) får `mail_sent`-event men inte mail-content. Mitigation: Resend har sin egen logging (90-dagars retention) — räcker för operativ debugging.
- **Skuld glöms bort:** risk att direct-Resend blir permanent. Mitigation: ADR + trigger-kriterier ovan — när någon trigger uppfylls, skrivs ny ADR, inte tyst kvarhållen skuld.

**Verifiering vid Fas 6e-deploy (om sendEmail behålls):**

- `supabase/functions/send-email/index.ts` har INVARIANT-check på Resend-respons-shape
- `RESEND_API_KEY` finns i env, INTE committad
- `tests/api/sendEmail.spec.ts` mockar Resend och testar happy path + 4xx-fel + 5xx-fel
- ADR-pekare i EF-kommentar: `// See ADR-015 — direct-Resend is intentional, see migration triggers`
