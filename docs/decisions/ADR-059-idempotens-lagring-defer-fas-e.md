
# ADR-059: Idempotens-lagring defer:as till Fas E — interim klient-skydd, server-side UNIQUE när Postgres blir datahem

- **Status:** Accepted (Session 26 — 2026-06-21; ratificerad av Marcus i direktion efter läsning)
- **Datum:** 2026-06-20
- **Fas:** 6c (Registrations + Väntelista)

> **Supersession-not:** Denna ADR **supersederar [ADR-014](ADR-014-create-registration-idempotency.md) delvis** — dess *lagrings-mekanism* (Airtable `Idempotency Keys`-tabell + unique-constraint-antagandet + cron-cleanup) och dess *timing-beslut* (avvisningen av "Alt 4 — defer till Fas E"). ADR-014:s **idempotens-KRAV som princip** och dess **klient-genererade nyckel-kontrakt** KVARSTÅR oförändrade. ADR-014 markeras med korresponderande Erratum (öppen rättelse, immutabilitet bevarad — README §"Korrigering vs supersedering").

## Kontext

ADR-014 (Accepted, 2026-05-05) beslutade att `create-registration` måste vara idempotent och valde en **Airtable-baserad lagrings-mekanism**: en egen `Idempotency Keys`-tabell vars race-säkerhet vilade på en **unique-constraint på nyckel-fältet** (ADR-014 §Beslut: *"Vid race condition … Airtable unique-constraint på nyckeln fångar duplikatet"*).

Två fynd under Session 26 falsifierade lagrings-mekanismen — inte kravet:

1. **Airtable kan inte påtvinga unik-constraint på ett skrivbart fält.** Endast det auto-genererade record-ID:t är garanterat unikt, och det är inte skrivbart. Ett skrivbart `key`-fält kan därför ta emot två identiska värden i två parallella requests — exakt det race-scenario ADR-014:s egen DoD (§Verifiering scenario 3) kräver grönt. *Källa: Chat web-research Session 26 (branschpraxis + Airtable-dokumentation).* Lagrings-mekanismen är alltså strukturellt oförmögen att leverera den race-säkerhet ADR-014 byggde sin DoD på.

2. **Postgres-reservation NU vilar på vacklande fundament** (ADR-014-revisit-passet, Session 26, Code LÄS→RAPPORTERA mot disk/live):
   - **Noll migrations/DDL-workflow på disk** — `supabase/` har bara `config.toml` + `functions/`; ingen `migrations/`-mapp; noll `.sql`-filer i hela repot; `tasks/todo.md` registrerar explicit *"Migrations ej tillämpligt (L115)"*.
   - **Service-role rör aldrig data idag** — `@supabase/supabase-js` finns i EF-lagret men ENBART för auth (token-verifiering i `_shared/auth.ts`, auth-admin i `create-admin-user`); `.from(`/`.rpc(` över EF-lagret = tomt. Postgres-data-write vore första touchen + breddad blast-radius.
   - **[ADR-057](ADR-057-lager-oberoende-fitness-invariant.md) parkerar Postgres-DATA till Fas E** (*"Airtable och Supabase/Postgres samexisterar permanent … Postgres i Fas E måste implementera HELA interfacet"*).

   Postgres-reservation för EN tabell, i EN EF, före Fas E, är en **ny arkitektur-yta av betydelse** + en ny distribuerad-transaktions-felmod (reservation lyckas i Postgres / record-create failar i Airtable → föräldralös nyckel blockerar legitim retry).

ADR-014 avvisade ursprungligen "Alt 4 — defer till Fas E" med skälet *"dubblett-buggen är aktiv idag … Fas 6c utan idempotency reproducerar Vue-buggen"*. **Den avvisningen förutsatte att Airtable kunde ge race-säkerhet nu.** Den premissen är falsifierad (fynd 1) → avvisningen ärvs inte, utan om-prövas.

## Beslut

**Alt Y — defer äkta server-side idempotens till Fas E; interim klient-skydd i 6c.**

**Nu (Fas 6c):**

- **Klient-skydd** inom ADR-016:s mutation-mall (ingen ny mall-komponent):
  - **TanStack `mutationKey`-dedup**: `mutationKey: ['create-registration', idempotencyKey]` — in-flight-deduplicering av identisk mutation (redan i ADR-014:s klient-sektion).
  - **Disabled submit under in-flight**: knappen disablas på `isPending` tills mutationen settlar — stänger dubbelklick (den dominanta orsaken) deterministiskt.
- **Klient-genererad UUIDv7-nyckel BEVARAS i request-kontraktet** (`Idempotency-Key`/body) och **loggas server-side** även nu, utan att lagras. Server-side-aktivering i Fas E blir därmed **additiv** (kontraktet finns redan), inte ett kontraktsbrott.
- **`create-registration` EF byggs UTAN nyckel-lagring** — ingen Airtable Idempotency Keys-tabell skapas, ingen Postgres-DDL.

**Fas E (Postgres blir datahem):**

- `idempotency_keys`-tabell med `UNIQUE INDEX ON (key)` + atomär insert-if-not-exists ger äkta server-side race-säkerhet, naturligt där Postgres ändå är datahemmet och migrations-workflow finns. Klient-nyckeln (redan i kontraktet) aktiveras server-side.

## Känd accepterad begränsning (dokumenterad öppet, ej gömd)

Interim-skyddet stänger **dubbelklick** och **retry-på-samma-session** (de dominanta orsakerna) helt. Det stänger **inte** skarpt det smala race-fönstret: *samma person, två separata sessioner/flikar, millisekunder isär*. I Lottas **single-admin-användning** är detta fönster försumbart — det kräver att en ensam operatör skickar två identiska anmälningar parallellt från två klienter. Det motiverar inte att dra in Postgres-yta i förskott (huvudförslaget) eller en Airtable-dedup-automation (Alt X) **över golvet**. Skulle empirisk incidens senare visa motsatsen → Alt X står kvar som fallback (se nedan) tills Fas E.

## Alternativ som övervägdes

**Huvudförslag — Postgres UNIQUE-reservation nu (reservation i Postgres, record i Airtable).** Avvisat: ny arkitektur-yta av betydelse (första Postgres-data-touchen i ett Airtable-only EF-data-lager), migrations-lucka (ingen DDL-workflow på disk, L115), breddad service-role-blast-radius, ny distribuerad-transaktions-felmod, och korsar ADR-057:s Fas E-gräns i förskott — allt för EN tabell.

**Alt X — Airtable check-write + kompenserande dedup.** Avvisat **för 6c**: håller sig single-backend (noll ny yta) men kräver dedup-automation (post-write query på nyckel → behåll äldsta, voida senare) + hantering av rest-racet — komplexitet **över golvet** för ett försumbart fönster i single-admin-användning. **Noterat som fallback** om empirisk incidens senare motiverar skarpt interim-skydd före Fas E.

**Alt Z — `pg_advisory_lock`.** Avvisat: kräver fortfarande Postgres-nåbarhet → samma nya yta som huvudförslaget, utan att lösa migrations-luckan.

## Konsekvenser

**Positiva:**

- 6c create-registration byggs lättare och rent inom nuvarande arkitektur — Airtable-only EF-data-lager bevaras, ingen DDL, ingen ny backend-yta i förskott.
- Fas E-föralignering: klient-nyckel-kontraktet finns redan → server-side-idempotensen blir en additiv aktivering, inte en omskrivning.
- Ärlig om golvet: skyddet matchar den faktiska risk-profilen (single-admin) i stället för att bygga distribuerad-transaktions-maskineri "ifall".

**Negativa / skuld:**

- Det smala multi-session-fönstret är öppet tills Fas E (se §Känd accepterad begränsning). Mitigation: dominanta orsakerna täckta nu; fallback (Alt X) identifierad; Fas E stänger skarpt.
- ADR-014:s §Verifiering-DoD måste omformuleras: scenario 1–2 (lyckad create + identisk-nyckel-retur) testas mot klient-skyddet + nyckel-eko nu; **scenario 3 (parallell-request race) blir en Fas E-gate**, inte en 6c-DoD-punkt.

**Verifiering (omformulerad mot detta beslut):**

1. Dubbelklick på submit under in-flight → en enda `create-registration`-request (knapp disabled på `isPending`). *(6c)*
2. Identisk mutation med samma `idempotencyKey` medan första är in-flight → dedupad av `mutationKey`, ingen andra request. *(6c)*
3. Request bär `Idempotency-Key`; server loggar nyckeln (ej lagrad). *(6c — bekräftar kontrakts-bevarande)*
4. Parallell-request race (två sessioner, samma nyckel) → skarpt stängt av `UNIQUE INDEX`. **(Fas E-gate, ej 6c.)**

## Kors-referenser

- [ADR-014](ADR-014-create-registration-idempotency.md) — idempotens-kravet (bevarat); lagrings-mekanism + timing (delvis superseder av denna ADR).
- [ADR-016](ADR-016-tanstack-optimistic-mutation-pattern.md) — mutation-mallen som interim klient-skyddet ryms i (komponent 4 "Idempotency-stöd" namnger ADR-014 redan).
- [ADR-026](ADR-026-runtime-validering-vid-datagrans.md) — Zod `.parse()` vid datagräns gäller create-registrations läs-tillbaka oförändrat.
- [ADR-050](ADR-050-isolerad-staging-miljo.md) — EF-deploy-disciplin (staging först); 6c create-registration följer den oförändrat (ingen Postgres-yta att isolera).
- [ADR-057](ADR-057-lager-oberoende-fitness-invariant.md) — Postgres-DATA till Fas E; detta beslut respekterar den gränsen.
