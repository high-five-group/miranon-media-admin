---
owner: marcus803
updated: 2026-07-24
review_by: 2026-10-22
status: stable
lifecycle: active
---

# T86 — Pocock v1.1-integrationen (korpus-bevakning → arbetssätts-delta)

> Tråd-kort (ADR-053). Född 2026-07-24 ur Marcus korpus-bevakning: fyra nya
> YT-transkript (Matts skills-repo v1.1 + prototyp-filosofi + review-skill-
> genomgång + teach-skillen) analyserade mot vårt arbetssätt med pre-K-
> forensik (T71, ADR-068, throwaway-kontraktets DECLINE-lista lästa FÖRE
> förslag). Marcus-direktiv i samma pass: löpande förbättring av
> arbetssättet är en del av Codes identitet — bevakningen är återkommande,
> inte engångs.

- **Tråd-ID:** `T86-pocock-v11-integrationen`
- **Tillstånd:** se frontmatter `lifecycle`
- **Källor:** rå-transkripten
  [docs/reference/pocock/transkript/2026-07-v1.1/](../../docs/reference/pocock/transkript/2026-07-v1.1/)
  · destillat + gap-analys
  [v1.1-delta-och-gap-analys-2026-07-24.md](../../docs/reference/pocock/v1.1-delta-och-gap-analys-2026-07-24.md)
  · v1.0-korpusen (`docs/reference/pocock/`, fryst referens)
- **Besläktad:** `T71` (dynamic workflows i Pocock-arbetssättet; research-
  formen) · `T85` (riskanpassad CI — metrics-instrumenten är review-pilotens
  förkrav; Codex-punkt 2 pekar på samma granskningshål) · `T56` (djupa
  moduler — filstorleks-/kontextpekar-lärdomen) · `T84` (guidad omgranskning
  — angränsande granskningsyta)
- **Commit-historik:** `git log --grep "\[T86\]"` (gäller även hubben
  marcus-system)

## Beslutsläge (2026-07-24)

<!-- markdownlint-disable MD029 -->
<!-- Numreringen 1–7 LÖPER medvetet över klassrubrikerna (LANDAT →
     BEHOVS-TRIGGAT): beslutslägena är EN räknad serie som § Nästa steg
     refererar per nummer ("beslutsläge 3"). Omstart per rubrik hade
     brutit referenserna. Precedent: processgranskningen 2026-07-23. -->

**LANDAT (denna session):**

1. **Hub del 1** (`d369d99`, plugin 1.18.1 → 1.19.0, update + list
   verifierade): grilling-kärnan får fakta/beslut-distinktionen +
   enact-gaten (Matts v1.1-fixar; själv-grillnings-buggen rapporterad
   särskilt på Fable) · do-work steg 4 får valideringskadensen (typecheck +
   berörd testfil löpande, full svit EN gång sist) · NY skill `/research`
   (bakgrunds-pass: EN nedskriven fråga → primärkällor → durabel
   fil-landning per repo-konvention; T71-A-spårets form).
2. **Korpus-landningen** (denna spoke-PR): fyra rå-transkript + destillat/
   gap-analys + detta tråd-kort.

**PARKERAT MED VILLKOR:**

3. **Review-piloten** — subagent-review i do-work-skarven (lokalt grönt →
   review → leverans-commit): EN subagent, två axlar (spec-trohet mot
   kortets AC/Testbeslut + standards mot KVALITETSDEFINITIONER/design-
   system-spec/Fowler-smells/T56), fynd åtgärdas inom kortets scope eller
   avfärdas MED motivering i transparens-rapporten; strukturella fynd
   utanför scope → kort/tråd. AKTIVERAS när T85 våg 2a:s mätinstrument
   (korten 36.x) är levererade — piloten ska mätas från dag ett (lead
   time-nettoeffekt + fångst per skiva över ~10–15 skivor), därefter
   permanentas (sannolikt ADR) eller rivas öppet. Marcus-kvittens på
   pilotformen: "Okej bra, nu står vi på en bra grund" (2026-07-24).

**GRILLNINGSKLASS (egen session vid trigger):**

4. **Wayfinder-mönstret på vårt substrat** — kart-kortklass UPPSTRÖMS om
   PRD-kortet (typade besluts-skivor research/grillning/prototyp/task,
   blocking-ordning, utfall ackumuleras på kartan → to-prd). Vidgar
   substrat-kontraktet → grillning + sannolikt ADR. **Namnfrågan buntas
   här** ("PRD-kort" → "spec-kort"? — Matts rename-argument träffar oss;
   våra "skivor" behålls). Trigger: AT-Max-uppstarten (ADR-063) eller nästa
   stora dimmiga initiativ.

**BEHOVS-TRIGGAT (byggs när behovet aktualiseras):**

5. **Teach-piloten** — stateful lärresa för Marcus (mission + learning
   records + interaktiva HTML-lektioner + ZPD), pilotämne väljs av Marcus
   (Code-kandidat: läsa/granska React-koden i admin-appen — höjer
   pushback-fångstens tak ~27 %). Matts teach-SKILL.md hämtas till korpusen
   vid bygget. Distinktion låst: engångsfrågor får engångssvar; "skriv så
   Roger/Lotta förstår" är guide-builder/Gunilla-materia, INTE teach.
6. **Guide-builder-korsbefruktningen** (ZPD + mission-först + quiz) — EFTER
   teach-piloten visat vad som bär.
7. **Lotta-onboarding som teach-instans** — vid drift-horisonten.

<!-- markdownlint-enable MD029 -->

**MEDVETET AVSTÅTT (över-engineering-vakten; omprövning = ny evidens +
öppen rivning):**

- Implement-skillen (vår do-work är strikt superset).
- Prototyp-som-kopieringskälla (throwaway-kontraktets klausul iv +
  utdrags-undantaget står; S47-beslut).
- Judge-paneler/ultrareview per skiva (T71:s analys står).
- Teach-trigger på vanliga frågor; Wayfinder-bygge före grillningen;
  rename som egen landning.

## Varför tråden finns

Arbetssättet ÄR Pocock-härlett (S47–S50) och Matts repo utvecklas snabbt
(v1.1). Bevakningen fångar deltat; gap-analysen skiljer äkta nyheter från
sådant vi redan har i starkare form; pre-K-forensiken hindrar att medvetna
designval (DECLINE-listor, T71-avvägningar) återföreslås som "nyheter".
Sekvensen mot T85 är designad: processhastighets-spåret (Codex-vågorna)
äger ci.yml/merge-ytan; detta spår äger hub-skills + korpus — noll
överlapp, parallellt körbara.

## Nästa steg

- **A.** Review-piloten aktiveras när 36.x-korten är klara (villkor i
  beslutsläge 3). Aktiveringen är en hub-ändring i do-work + mätrutin.
- **B.** Wayfinder-grillningen vid AT-Max-uppstart eller nästa dimmiga
  initiativ (beslutsläge 4).
- **C.** Marcus väljer teach-pilotämne när han vill öppna det spåret
  (beslutsläge 5).
- **D.** Nästa transkript-släpp från Marcus → samma analysform (gap-analys
  med pre-K-forensik; se memory `kaizen-i-samarbetet`).
