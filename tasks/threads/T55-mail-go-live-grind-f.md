# T55 — Mail-go-live: Grind F (öppna prod-ENVIRONMENT-spärren)

- **Tillstånd:** `paused`
- **Uppstod:** Session 46 (pivot till UI-spår)
- **Commit-tagg:** `git log --grep "\[T55\]"`

## Scope

Den sista flippen som gör `send-email` skarp på prod: sätt secret
`ENVIRONMENT=production` i prod-projektet (`lvjsfnphlauldxqlncpl`), verifiera att
fail-closed-grinden lyfter rent, kör Marcus-självtest (T51) och en prod-smoke. Efter
detta kan Lotta sända skarpt.

## Var tråden står (ingångstillstånd S46)

send-email är **prod-deployad men SÖVD** (S44): den ligger i prod-allowlisten (11
funktioner, disk-verifierat i S46-orienteringen), prod-`Idempotensnyckel`-kolumnen är
satt, och UI:t är T50-härdat (S45). MEN `ENVIRONMENT` är ej satt → fail-closed-grinden
i `send-email/index.ts:182` (`Deno.env.get('ENVIRONMENT') === 'production'`, strikt
likhet) gör allt utom exakt `'production'` till icke-prod → `NonProdAddressError` → 422
`non_prod_address_refused`, **noll skickat**. ~90% klart; inga prod-ändringar gjordes i
S46 (sessionen pivoterade till UI innan spärren rördes).

## Säkerhets-invariant (tre oberoende lager — bara Lager 1 flippas)

- **Lager 1** — fail-closed ENVIRONMENT-spärr (`send-email/index.ts:182`). Grind F
  sätter denna; medvetet det enda som flippar.
- **Lager 2** — idempotensnyckel (Utskickslogg-kolumn, prod, S44): samma utskick kan
  inte köras två gånger.
- **Lager 3** — UI-grind (T50, S45): granska + skriv-mottagar-antal-för-att-låsa-upp +
  faro-knapp → inget oavsiktligt massutskick av en icke-teknisk användare.

## Stegsekvens (när tråden plockas)

1. Marcus granskar härdade sänd-vyn (`SegmentMailCompose`, dev) → go/no-go.
2. **Grind F:** `ENVIRONMENT=production`-secret i prod (Marcus/Code i prod-panelen;
   **Chat rör ALDRIG nyckeln/secret**). Säker ordning: secret satt → verifiera att
   fail-closed-grinden lyfter rent. Prod-ref verifieras mot disk vid Grind F-design.
3. **T51 — Marcus självtest:** riktigt testutskick → verifiera Reply-To + leverans till
   riktig inkorg + loggrad i Utskickslogg.
4. **Prod-smoke** på send-email.

## Varför deferrad (ej blockerande)

Session 46 omdefinierade riktningen till ett UI-fokus-spår (presentationslager-skuld,
L220). Mail-go-live är ~90% klart och bär ingen extern drivare → plockas i "redo för
Lotta"-passet EFTER UI, om ingen extern drivare dyker upp. ADR-053-triage:
blockerar ej men värdefullt → defer (durabelt), förkasta aldrig tyst.

## Relaterat

- [session-46](../sessions/2026-06-30-session-46.md) § Del 2 (pivot + deferral).
- [T51](README.md) — Reply-To gold-standard-självtest (= första skarpa utskicket).
- [T53](T53-test-till-sig-sjalv-skicka.md) — test-till-sig-själv (förhandsgransknings-väg).
- [T46](T46-go-live-karta.md) — go-live-karta (Mail-raden rättad till deployad-men-sövd).
- [T44](T44-fas-6h-externa-provisionerings-forkrav.md) — externa provisionerings-förkrav (M3).
- ADR-067 (bulk-mail-send-kontrakt) · ADR-061 (lokal-miljö-isolation, prod/staging-refs).
