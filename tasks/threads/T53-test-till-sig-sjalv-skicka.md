# T53 — Test-till-sig-själv (skicka test-mail före skarpt utskick)

- **Tillstånd:** `paused`
- **Uppstod:** Session 45 (T50-scope-precisering)
- **Commit-tagg:** `git log --grep "\[T53\]"`

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

- [session-45](../sessions/2026-06-29-session-45.md) § Del 1 "Ej i scope" (den
  precisering som föder denna tråd).
- ADR-067 (bulk-mail-send-kontraktet — segmentIds-only, consent-GOLV).
- [T51](README.md) — Reply-To gold-standard-verifiering (Marcus självtest = den
  människo-synliga riktig-inkorg-verifieringen).
- [T50](T50-ui-hardning-sand-grind.md) — bärande UI-härdning; dess Form-sektions
  "BESLUTAT: med" är det denna tråd reviderar.
