# ADR-104: Godkännande-mekaniken — kanalseparation

- Status: Accepted (grillad samsyn S93 åttonde resumen, 2026-08-08 — fem
  kvitterade beslut + helhetskvittens, kanonisk trail:
  `tasks/sessions/archive/2026-08/2026-08-02-session-93.md` Del 14; Marcus slutkvittens
  verbatim: *"Jag kvitterar helheten, kör!"*)
- Datum: 2026-08-08
- Fas: Session 93 — processform (ingen byggfas-status-ändring)

## Kontext

`ADR-103` B2 gör Marcus godkännande till grinden mellan granskning och
rivning (*"Marcus godkänner"* → *"flaggan/variant-koden rivs mekaniskt"*),
och `ADR-102` B3 förbjuder rivning före godkännande — men båda lämnade
MEKANIKEN öppen: `facit.json` bar fältet `"godkand": null` utan någon regel
för vem som får sätta det eller hur det prövas. En agent som påstår "Marcus
godkände" kunde därmed självbetjäna hela kedjan — exakt den felklass
fångst-raterna (self-review ~9 %, extern fångst dominerar) säger att
konvention inte stoppar. `ADR-103` § "Vad som INTE beslutas här" bokade
frågan som G2-grillningen.

Research-passet
[`godkannande-mekanik-hitl-branschmonster-2026-08-08.md`](../research/godkannande-mekanik-hitl-branschmonster-2026-08-08.md)
(fyra källklasser, förstapartskällor) gav domen som formade besluten:

- **Multi-person-verktygens approve-flöden löser inte solo-fallet.**
  Chromatic/Percy/GitHub-reviews förhindrar självgodkännande genom att
  kräva en ANNAN person — Chromatics FAQ: självgodkännande går inte att
  stänga av. Mätt lokalt: agenten kör samma `marcus803`-konto som Marcus,
  så en GitHub-approval kan agenten utföra själv via `gh`.
  Plattforms-vägen falsifierad för vårt läge.
- **Principen byggd för exakt vårt problem är kanalseparation** (CIBA,
  OpenID Foundation): godkännandet måste komma via en kanal utföraren
  inte kontrollerar — aldrig härledas ur att agenten "vet" vad människan
  sagt.
- **Claude Codes `!`-prefix ÄR den kanalen lokalt** — förstapartsdok:
  kommandot körs utanför agentens loop. Empiriskt mätt i vårt harness
  2026-08-08 (Marcus förstahand): ett kommando som fällde
  PreToolUse-pipe-vakten när agenten körde det passerade orört via `!` —
  `!`-kanalen är strukturellt osynlig för hook-pipelinen, agentens vägar
  (Edit/Write/Bash) är det inte.
- **Precedens-tunnhet öppet deklarerad:** ingen leverantör bär en
  fallstudie för solo-operatör + agent på delat konto. Räkningen fejkas
  inte — mönstret är CIBA-principen tillämpad lokalt, inte en kopierad
  branschlösning.

## Beslut

1. **Granularitet: per manifest/pass.** Ett QA-moment = ett kvitto = ett
   rivnings-GO. Delgodkännande uttrycks som explicit undantag i fältet
   (ytan namnges + skäl), aldrig som per-yta-fält.
2. **Stämplingen är Marcus handling, buren av kanalseparation.** Marcus
   kör själv `npm run facit:godkann -- --pass <namn> --citat "..."` via
   `!`-prefixet. Skriptet stämplar
   `godkand: {av, datum, citat, sha}` — branschens audit-schema
   (identitet + tidsstämpel + artefaktversion + kommentar; GitHub
   Reviews/Temporal-formen). En PreToolUse-hook nekar agent-skrivningar
   mot manifestens `godkand`-fält och matchar **Edit, Write OCH Bash**
   (Edit/Write-only kringgås med heredoc — källbelagt
   "whack-a-mole"-fallet). Kandidat A (agenten bokför verbatim-citat)
   falsifierad som självattestering.
3. **Rivningsprövningen är dubbel.** `TASK-145.6`:s AC kräver satt fält
   (agentens premiss-pass läser det), OCH `check-facit.sh` bär
   invarianten: **`godkand: null` ⇒ ytans variant-markörer måste finnas
   kvar** — en rivning utan godkännande fäller CI mekaniskt och kan inte
   landa genom kön.
4. **Räckvidd: princip, inte mekanik.** Kvittots SHA dokumenterar vad som
   godkändes. Medveten ändring av den promoverade ytan efter godkännande
   är en ny iteration och kräver nytt godkännande (prövas i vanlig
   ordning, ingen staleness-grind). Regressionslåset (ariaSnapshot +
   visual-baslinje, `ADR-103`) är den permanenta vakten efter rivning.
   Staleness-mekanik byggs endast om principen bevisligen bryts —
   mekanisera det irreversibla, principa det reversibla.
5. **Hemvist: denna ADR.** Skriptet, hooken och grind-invarianten citerar
   ADR-104 som styrande huvud. `ADR-103` § "Vad som INTE beslutas här"
   pekar hit.

## Konsekvenser

- Bygg-kortet (`task-167`) levererar: stämplings-skriptet, hooken,
  `check-facit`-invarianten och tvåsidig testsvit för samtliga tre.
- **Hookens skarpbevis är öppen skuld vid leverans** — en hook registrerad
  mitt i en session laddas inte i den (omladdnings-regeln, L450);
  logiken bevisas i byggsessionen (testsvit + manuell körning),
  skarpbeviset betalas som en av nästa sessions första handlingar.
- Marcus per-godkännande-kostnad är EN chattrad med `!`-prefix; all övrig
  mekanik är agent-/CI-buren.
- Termen *kanalseparation* lyfts till hubbens `SYSTEMET.md` §0 vid nästa
  hub-sync (processdomän — ORDLISTA.md är produktdomän, samma snitt som
  *promovering*, `ADR-103` beslut 6).
- Falsifieras `!`-kanalens hook-osynlighet av en framtida harness-ändring
  rivs beslut 2:s form öppet mot ny mätning — mätningen 2026-08-08 är
  beslutets empiriska grund, inte en evig sanning.
