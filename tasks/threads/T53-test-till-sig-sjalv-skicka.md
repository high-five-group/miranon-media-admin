# T53 — Test-till-sig-själv (skicka test-mail före skarpt utskick)

- **Tillstånd:** `closed` — **STÄNGD 2026-08-10 (S102, TASK-147.10)**: väg C
  byggd — `send-action-email`s testgren (`testSend: true`, `_shared/
  send-action-email.ts` § `runActionTestSend`), ett urval på LÄNGD 1 (den
  FÖRSTA mottagaren i granskningens urval, ENDAST platshållar-data) riktat
  mot den inloggade användarens egen adress (server-side, `requireUser` —
  aldrig klient-buren). Trådens ARKITEKTURFRÅGA (options-rymden A/B/C) är
  därmed besvarad och byggd; kortets EGEN Done-flipp är ett separat,
  orkestrator-ägt gate (AC #3, ADR-104-kanalen, Marcus-omgodkännande av
  granskningsytans utökade form) — se `backlog task 147.10 --plain`.
- **Uppstod:** Session 45 (T50-scope-precisering)
- **Commit-tagg:** `git log --grep "\[T53\]"` · `git log --grep "\[TASK-147.10\]"`

## Scope

Skicka test-mail till egen adress före skarpt utskick (inbyggd förhandsgranskning)
— så att avsändaren ser exakt vad en mottagare får i sin inkorg innan
massutskicket går.

## Varför denna tråd

T50:s UI-härdning (Session 45) levererar en KLIENT-SIDE förhandsvisning av
mailtexten i granska-steget, vilket uppfyller accident-proof-mandatet utan en
test-sändning. Men en RIKTIG-inkorg-verifiering — se det faktiska renderade mailet
samt avsändar-/Reply-To-värden som en mottagare ser dem — är ett distinkt värde
som T50 medvetet INTE bygger.

Detta REVIDERAR Session 44:s "BESLUTAT: med" (T50 Form-sektion) mot disk-evidens:
`send-email`-EF:en är **segmentIds-only** (mottagar-upplösning sker SERVER-SIDE,
aldrig en klient-byggd lista; consent-filtret är GOLV per ADR-067). En explicit
enkel-mottagar-väg finns inte i kontraktet och kan inte byggas utan att skära mot
ADR-067:s avsiktliga design. Beslutet revs ÖPPET, med kvittens (ej tyst rivning).

## Options-rymd för senare beslut

- **(A) Ingen test-väg** — klient-side-förhandsvisningen (T50) räcker; riktig-
  inkorg-verifiering täcks av Marcus självtest (T51).
- **(B) Test-segment med Resend-test-adresser** — ingen EF-ändring; använd ett
  segment vars medlemmar är Resend-test-adresser (`delivered@resend.dev` m.fl.).
  Funkar ENDAST i icke-prod (fail-closed-spärren tillåter bara test-adresser där;
  i prod skulle ett sådant utskick gå till de fejk-adresserna).
- **(C) Net-new EF-kontrakt + ADR** — utöka `send-email` (eller ny EF) med en
  explicit enkel-mottagar-väg. Skär mot ADR-067:s segmentIds-only-design →
  kräver eget beslut + säkerhets-ribba per EF.

## Relaterat

- [session-45](../sessions/archive/2026-06/2026-06-29-session-45.md) § Del 1 "Ej i scope" (den
  precisering som föder denna tråd).
- ADR-067 (bulk-mail-send-kontraktet — segmentIds-only, consent-GOLV).
- [T51](README.md) — Reply-To gold-standard-verifiering (Marcus självtest = den
  människo-synliga riktig-inkorg-verifieringen).
- [T50](T50-ui-hardning-sand-grind.md) — bärande UI-härdning; dess Form-sektions
  "BESLUTAT: med" är det denna tråd reviderar.

## Migrerat ur indexraden (`TASK-157.2`, 2026-08-07)

> Ordagrann text som tidigare bodde i `tasks/threads/README.md`s Titel-
> och/eller Ingång-kolumn för denna tråd, flyttad hit av registrets
> tunna radform-migration (ADR-098). Inget härunder är omskrivet —
> emfas-markörernas STIL (*...* vs *...*) normaliseras separat av
> `npx markdownlint-cli2 --fix` mot filens egen etablerade MD049-stil,
> inte av denna migration.

**Ingång (fullständig, ursprunglig):**
[T53-test-till-sig-sjalv-skicka.md](T53-test-till-sig-sjalv-skicka.md) — uppstod Session 45 (T50-scope-precisering); REVIDERAR Session 44:s "BESLUTAT: med" mot disk-evidens (send-email segmentIds-only, ADR-067 consent-GOLV); options-rymd (A) ingen test-väg · (B) test-segment med Resend-test-adresser (ingen EF-ändring, endast icke-prod) · (C) net-new EF-kontrakt + ADR

## Avgörande 2026-08-10 (S102)

Options-rymden avgjord: **väg C**, legitimerad av att ADR-067 ändå revideras i
`task-147.1` (sändvägens grening — singelsändnings-grenen ger enkel-mottagar-
mekaniken som kontraktsdel, inte som undantag). Bygget bor i `task-147.10`
("Testmail till mig", åtgärdssidan) + som form-krav i `task-181`
(segment-redesignen). Drivare: Marcus egen sändrädsla vid T55 steg 1-granskningen
— "Lotta kommer känna likadant" — trygghetstriaden preview + adresslista +
testmail är formens golv. Tråden stängs när 147.10 landar (dess AC 4).
