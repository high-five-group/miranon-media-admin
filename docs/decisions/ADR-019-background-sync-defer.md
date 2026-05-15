# ADR-019: Background Sync API uppskjuten från Fas 7 till Fas 8

- **Status:** Accepted
- **Datum:** 2026-05-05 (skrivs i P3a, refereras vid Fas 7-start)
- **Fas:** 8 (framtid — defer från Fas 7)

## Kontext

Conversion-plan §D Fas 7 listade `[GA] Background Sync för offline-närvaro: markera närvaro lokalt → synka automatiskt vid uppkoppling`. Idén: när Lotta är i ett event utan nät, kan hen markera närvaro per deltagare; mutationer köas lokalt och synkas automatiskt vid uppkoppling.

Per B2-beslutet (P1-sessionsdok Del 5): Background Sync defer:as från Fas 7 till **Fas 8** (framtid). Skälen:

1. **Fas 7-scope är redan stort.** Per B3-beslutet (ADR-018) absorberade Fas 7 fyra `[GA]`-tillägg från Fas 5. Plus CSP, Trusted Types, web-vitals, deploy-pipeline, chaos-testing, Golden Master-tester, Supply chain audit, React 19 CVE-granskning, design-audit. Att lägga till Background Sync är överlast.

2. **Background Sync kräver IndexedDB-baserad mutationskö + konfliktshantering.** Inte trivial implementation — 1-2 sessioner extra arbete inom Fas 7. Hade krävt egen ADR oavsett (queue-schema, retry-policy, konfliktstrategi vid server-state-divergence).

3. **Empirisk data om offline-incidens saknas.** Vi vet inte hur ofta Lotta är offline under närvaroregistrering. Production-instrumentering från Fas 7-deploy ger den datan. Att bygga Background Sync utan datan är preliminär arkitektur — kan vara fel scope, fel queue-strategi, fel konfliktsmodell.

4. **Mobil-Lottas faktiska arbetsflöde under event är inte verifierat.** Använder Lotta appen *under* eventet, eller efteråt? Om efteråt + Wi-Fi-tillgång på event-platsen → Background Sync onödig. Empirisk data behövs.

`STATE-STRATEGY.md` har Background Sync som "kommer i Fas 8"-not (uppdateras post-P2). Denna ADR konsoliderar beslutet med trigger-kriterier.

## Beslut

Background Sync API **defer:as från Fas 7 till Fas 8**. Fas 7 levererar inte Background Sync. Fas 8 är "framtid" — aktualiseras när trigger-kriterier uppfylls.

### Trigger-kriterier för Fas 8-aktualisering

Background Sync prioriteras till Fas 8-implementation när **endera av**:

1. **Empirisk data från Fas 7 visar 5+ offline-incidenter inom 30 dagar** för Lotta-användning. Mätning: Sentry/Faro `network.offline`-events per session.
2. **Lotta rapporterar manuellt** att hen tappat närvaro-data eller behövt mata in samma data två gånger.
3. **Fas E (Supabase-migration) ger CDC-baserad sync som ersätter Background Sync-behov** — i så fall skrivs ny ADR som superseder denna.
4. **Andra produkter (Passionslyftet, Maxat Event) under utveckling kräver Background Sync** — i så fall flyttas Fas 8-scope till komponentbiblioteket Mm Component Library.

### Vad Fas 7 ska INTE göra

- Implementera Background Sync API i `public/sw.js`
- Bygga IndexedDB-baserad mutationskö
- Konfliktshantering klient vs server-state
- Kö-status-UI i app-shell

### Vad Fas 7-deploy SKA göra (för framtida Fas 8)

- Sentry/Faro-instrumentering av `navigator.onLine`-events
- Loggning av mutation-fail-mode (5xx vs nätverkstimeout vs offline)
- Analytics-event vid `navigator.connection.effectiveType` < `3g`

## Alternativ som övervägdes

**Alt 1 — Implementera i Fas 7 enligt conversion-plan.** Avvisat: Fas 7-scope-överlast (per ADR-018). Hade riskerat att Background Sync görs ofullständigt eller andra Fas 7-leveranser tappar kvalitet.

**Alt 2 — Defer:a till "någon gång" utan dokumenterad trigger.** Avvisat: tyst defer = glömt arbete. Trigger-kriterier säkerställer aktualisering vid empiriskt behov.

**Alt 3 — Implementera minimal version i Fas 7 (kö endast, ingen konflikthantering).** Avvisat: kö utan konflikthantering är värre än ingen kö — användaren får rapport om "synkat" som senare visar sig vara fel. Hellre ingen Background Sync än felaktig.

**Alt 4 — Defer:a till Fas E (Supabase-migration).** Avvisat: Background Sync är klient-side, fungerar lika bra mot Airtable som mot Supabase. Att vänta på Fas E är onödig fördröjning om empirisk data motiverar implementation tidigare.

## Konsekvenser

**Positiva:**

- Fas 7-scope hålls inom 3-session-budget med kvalitet på behållet scope.
- Beslutet är *medvetet defer:at*, inte glömt — denna ADR + byggplan.md Fas 8-rad gör det synligt för framtida läsare.
- Trigger-kriterier ger *empirisk-driven* aktualisering — implementation matchar reellt behov, inte hypotetiskt.
- Fas 7-instrumentering är förberedande arbete för Fas 8 — ingen tid förlorad om/när Background Sync prioriteras.

**Negativa:**

- Mellan Fas 7-deploy och eventuell Fas 8-aktualisering har Lotta ingen offline-mutationskö. Mitigation: TanStack Query offline-config (Fas 5) ger optimistic UI som rollbackar vid fail — användaren ser felet, kan retry:a manuellt. Inte ideellt men acceptabelt för ~5-20 mutationer/dag.
- Risk att Fas 8 aldrig aktualiseras (Lotta klagar inte tillräckligt högt). Mitigation: trigger 1 (5+ offline-incidenter) är empirisk, inte beroende på rapportering.
- Risk att Passionslyftet/Maxat Event behöver Background Sync först → Mm Component Library tvingas implementera scope före Miranon Media Admin har empirisk data. Mitigation: trigger 4 hanterar det fallet — scope flyttas då till Mm Library.

**Verifiering vid Fas 7-start:**

- Denna ADR läses som första-grej i Fas 7-sessionsdok
- byggplan.md Fas 7 scope-listan har INTE Background Sync (verifierat med `grep -i 'background sync' docs/byggplan.md` ger endast träffar i Fas 8-sektion)
- Sentry/Faro-config inkluderar `navigator.onLine`-instrumentering (Fas 7 DoD-tillägg)
