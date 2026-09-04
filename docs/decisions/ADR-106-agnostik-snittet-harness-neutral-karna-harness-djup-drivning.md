# ADR-106: Agnostik-snittet — harness-neutral kärna, harness-djup drivning

- Status: Accepted (ställningstagande-grillning A, S101 2026-08-09 —
  tre-delat beslut kvitterat; kanonisk trail:
  `tasks/sessions/archive/2026-08/2026-08-09-session-101.md` Del 8; Marcus kvittens
  verbatim: *"Kvitterar snitt-principen, kör grillning B"*)
- Datum: 2026-08-09
- Fas: Session 101 — processform (ingen byggfas-status-ändring)

## Kontext

L8-kartläggningen
([`l8-workflow-kartlaggningen-2026-08-09.md`](../research/l8-workflow-kartlaggningen-2026-08-09.md)
§ C.4-1) reste spänningen: Kun Chens mest upprepade princip är strikt
agent-agnostik (*"I have been very strict about making my workflow agent
agnostic"*; hela hans setup är medvetet harness-neutral via
AGENTS.md-symlänkar), medan vårt kvalitetsgolv vilar på Claude
Code-SPECIFIK mekanisering — PreToolUse-hooks, output-styles,
plugin-autoladdning (ADR-035), Monitor-/Agent-primitiverna.

Två fakta avgjorde snittet. (1) K4-researchen
([`k4-firstmate-arkitektur-2026-08-09.md`](../research/k4-firstmate-arkitektur-2026-08-09.md))
visade agnostikens PRIS: FirstMates ~180 shellskript existerar till stor
del för att simulera harness-agnostiskt vad vårt harness ger inbyggt —
uppströms Issue #27 slår fast att turn-injection är en harness-förmåga,
och Claude Code pekas ut som ett av få harness som bär den. (2) Kuns
agnostik har en faktisk användare (fyra harnesses i daglig drift); vår
vore spekulation — över-engineering-vakten förbjuder abstraktion utan
nuvarande användare. Samtidigt är Kuns motargument verkligt (landskapet
ändras fort), och `ADR-104` är prejudikatet för hur CC-beroende hanteras
ärligt: beslutet vilar öppet på en harness-mätning med rivningsklausul.

## Beslut

1. **Principen: harness-neutral kärna, harness-djup drivning.**
   Kunskaps- och tillståndsartefakter (ADR:er, lessons, kort,
   sessionsdok, config-filer, tillstånds-taxonomier) hålls
   harness-neutrala — de är systemets överlevnad. Mekanisering (hooks,
   output-styles, harness-primitiver) förblir harness-djup där den
   betalar sig i mätta skyddsräcken. NYA mekanismer designas så att
   KONTRAKTET (filerna, tillstånden, reglerna) är neutralt och DRIVAREN
   utbytbar — exekverings-hubben (K4) är första tillämpningen.
2. **Ingen retroaktiv agnostifiering.** Ingen AGENTS.md-symlänk, ingen
   ombyggnad av befintliga mekanismer — ingen andra harness är i drift,
   och abstraktion utan faktisk användare är förbjuden spekulation.
3. **Omprövnings-trigger.** Snittet omprövas när en faktisk andra
   harness tas i drift, ELLER när en harness-ändring falsifierar en
   mekanism vi vilar på (`ADR-104`-klausulens mönster) — inte förr.

## Konsekvenser

- K4-grillningen ärver beslut 1 som designkrav: hubbens
  tillstånds-taxonomi och kontrakt specas harness-neutralt även när
  drivaren är Claude Code.
- Bedömningen att harness-djupet "betalar sig" vilar på lokal empiri
  (fångstraterna, L328-klassen: regler utan mekanism efterlevs inte) —
  falsifieras den av triggern i beslut 3 rivs snittet öppet mot det nya
  läget.
