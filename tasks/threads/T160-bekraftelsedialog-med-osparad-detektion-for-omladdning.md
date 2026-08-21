---
owner: marcus803
updated: 2026-08-21
review_by: 2026-11-21
status: stable
lifecycle: paused
---

# T160 — Bekräftelsedialog med osparad-detektion för omladdning

> Registrerad i `TASK-285.4` (spec-skörden), ur `ADR-121` § 8:s öppna fråga.
> Detta är en skuld som redan bokfördes en gång vid S109:s andra paus
> (`tasks/sessions/2026-08-20-session-109.md` § PAUSLÄGE → CARRY / ÖPPNA
> TRÅDAR: *"Osparad-detektion (ADR-121 § 8, dialog-vägen) ska registreras
> som tråd — EJ GJORT vid paus ... Görs i 285.4 ... eller som första
> docs-handling vid resume."*) och som denna skiva betalar.

## Vad den skulle göra

Ersätta databesked-varningen som i dag bor i chunk-bannern
(*"Har du skrivit något som inte är sparat, kopiera det först"*) med en
`Dialog` ("Ladda om ändå" / "Avbryt") som visas **när användaren trycker
"Ladda om" medan ett formulär har osparade ändringar** — och laddar om
tyst, utan fråga, om ingenting är osparat.

Motivet är research-passets (`docs/research/uppdateringsnotisens-form-och-notisfamiljen-2026-08-20.md`
§ 7, Huvudförslag): NN/g *"Preserve the user's input"* och GOV.UK *"Do not
clear any form fields"* lägger bevarandet på systemet, inte på
användaren — en läst varning som Lotta kanske aldrig hinner läsa är ett
svagare skydd än ett system som redan vet.

## Varför den inte byggs nu

Formen kräver **osparad-detektion**: mekanik som vet vilka formulär i
appen som har osparade ändringar, oavsett var i appen omladdningen
triggas ifrån. Den mekaniken finns inte i koden i dag — **noll träffar**
på dirty-state, en blocker-mekanism eller `beforeunload`-lyssnare
(mätt vid `ADR-121`:s skrivning och åter vid denna tråds registrering).

Det är exakt den invändning som redan fällde `ADR-121`:s förkastade
`Alternativ 2` (*"visa ingenting, ladda om vid nästa säkra brytpunkt"*):
*"avgöra vilken navigering som är 'säker' kräver att vi vet var formulär
har osparade ändringar, vilket är verklig ny mekanik."* Samma mekanik kan
inte vara diskvalificerande i ett alternativ och gratis i ett annat —
`ADR-121` § Updates 2026-08-21 stänger § 8 med Marcus verbatim
(*"Kör på dina rekommendationer"*) genom att i stället lägga varningen
kvar i chunk-bannern, den enda av de tre vägda vägarna som inte kräver
ny mekanik.

## Trigger för omprövning

Tråden tas upp igen om **något av dessa** inträffar:

1. En generell dirty-state-mekanik byggs av ett annat skäl (t.ex. en
   app-bred "osparade ändringar"-varning vid navigering) — då blir
   dialog-vägen en marginalkostnad i stället för en ny mekanism.
2. Chunk-bannerns varning visar sig otillräcklig i praktiken — Lotta
   förlorar mätbart osparad text trots varningen.
3. Antalet formulär i appen växer till en punkt där en läst
   textvarning bedöms som ett för svagt skydd (omdöme, ingen tröskel
   nedskriven här).

## Skarv

- [`ADR-121`](../../docs/decisions/ADR-121-notistrappan-form-per-klass-i-notisfamiljen.md)
  § 8 (öppnad) + § Updates 2026-08-21 (stängd, denna tråd är
  fortsättningen).
- [`DESIGN-SYSTEM-SPEC`](../../docs/specs/DESIGN-SYSTEM-SPEC.md) § 21
  Notistrappan — chunk-bannerns rad bär varningen tills denna tråd
  eventuellt ändrar det.
- `TASK-285` (PRD, Utanför omfattningen) och `TASK-285.5` (chunk-bannerns
  flytt och kortning, som bygger den nuvarande, enklare formen) —
  databesked-varningen byggs där, inte här.
- `ADR-047` § Amendering (S105) — omladdningsbeslutet ligger hos
  användaren; denna tråd rör ENDAST var varningen visas, inte om
  omladdningen är frivillig.
