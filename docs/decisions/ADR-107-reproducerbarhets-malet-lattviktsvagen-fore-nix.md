# ADR-107: Reproducerbarhets-målet — lättviktsvägen före Nix

- Status: Accepted (ställningstagande-grillning B, S101 2026-08-09 —
  tre-delat beslut kvitterat; kanonisk trail:
  `tasks/sessions/archive/2026-08/2026-08-09-session-101.md` Del 8; Marcus kvittens
  verbatim: *"Kvitterar B, kör landningen"*)
- Datum: 2026-08-09
- Fas: Session 101 — processform (ingen byggfas-status-ändring)

## Kontext

Dev-Environment-transkriptet (korpus:
[`l8-devenv-transkript-2026-08-09.txt`](../research/l8-devenv-transkript-2026-08-09.txt);
destillat: kartläggningen § AD.2) visar Kun Chens helt deklarativa
maskinmiljö — Determinate Nix + nix-darwin + Home Manager +
nix-homebrew med `cleanup = zap` (paket utanför konfigen avinstalleras
vid rebuild: allt TVINGAS genom koden), pinnade versioner, dotfiles-repo
med symlänkar som versionsspårar runtime-ändringar. Hans uttalade motiv
är agent-erans katastrofscenario, citerat: *"if my AI agent did
something stupid and completely destroyed my system, can I recover it
instantly?"*

Vårt läge (disk-fakta): kunskaps- och processlagret ligger i git
(reproducerbart), plugin-lagret distribueras via `ADR-035` — men
MASKINLAGRET är oversionerat: `~/.claude`-konfigen, brew-verktygen,
VS Code-uppsättningen. Marcus maskin är det operativa lagrets single
point of failure, och varje mekanism transformationen bygger (hooks,
monitors, worktree-pool) ökar det lagrets värde. Samtidigt: Marcus
arbetar i VS Code, inte terminal-först; Nix bär verklig inlärningskurva
och egna felmoder; över-engineering-vakten skiljer golv från
spekulation.

## Beslut

1. **Målet: JA.** Maskinlagrets reproducerbarhet är ett uttalat
   systemmål (kartläggningens P12) — agent-katastrofskydd + kontinuitet,
   direkt kopplat till Fem Kvaliteters *Kontinuitet* och *Odödlighet*.
2. **Formen, fas 1: lättviktsvägen — inte Nix.** Ett versionsstyrt
   setup-repo: Brewfile + `~/.claude`-konfigen + versionsfiler + en
   återställnings-runbook som BEVISAS en gång (en återställning är inte
   reproducerbar förrän den demonstrerats). Nix bokförs öppet som
   eskaleringskandidat — inte fas 1. Medvetet byte, öppet deklarerat:
   vi avstår Kuns garanti (`cleanup = zap` — inget kan existera utanför
   konfigen) mot enkelhet och reversibilitet; golvet är
   versionskontrollerad konfig + bevisad återväg.
3. **Trigger för Nix-omprövning:** en andra maskin tas i verklig
   drift · en faktisk recovery-händelse visar att lättviktsformen inte
   räckte · eller Dev-Env-spåret (terminal-flytten, kartläggningen
   § C.4-3) aktiveras som helhet. Då görs Nix-frågan om mot det läget
   med devenv-transkriptet som underlag.

## Konsekvenser

- Arbetet blir ett eget kort i Marcus våg-prioritering — blockerar
  inte K1/K2.
- Secrets-hanteringen ingår INTE (K9:s fråga, Atomic Vault-klassen) —
  detta beslut gäller konfig och verktyg; snittet är öppet bokfört.
- Runbook-beviset är beslutets hårda kant: ett setup-repo utan bevisad
  återställning uppfyller inte målet i beslut 1.
