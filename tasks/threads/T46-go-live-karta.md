# T46 — Go-live-karta: konsoliderad avstånd-till-live per leverans-väg

- Tillstånd: paused
- Uppstod: Session 41

Två-vägs-distinktionen (Skool-export = access-grant, ej consent-gatead / mail =
consent-gatead) och vad som gatear varje väg till prod är durabelt dokumenterat men
SPRITT över ≥5 ytor (segment-arkitektur.md, ADR-062, ADR-067, T44, BUILD-LOG/session-
carries). Ingen yta ger den operativt viktigaste vyn: per leverans-väg — vad är byggt,
vad gatear prod, vem äger grinden, hur nära är användaren. En framtida läsare måste
assembla bilden ur fem–sex källor.

Resolutions-väg (konkret, vid prod-deploy-session-designen): rita kartan (byggplan §4
eller dedikerat docs/reference/go-live.md) med per-väg-rader:

- Skool-export: byggt+auditerat (6g L1–L4); gate = prod-deploy av compute-segment/
  save-segment/get-segments; ägare Code-at-prod-deploy; inga externa deps.
- Mail 6h: byggt+auditerat (L0–L3 + avvikelse-fix); gate = T44 M3 (prod-Resend-nyckel +
  verifierad miranon.dev, psionautics-DNS-korsjämförelse) + Code-at-prod-deploy; ägare
  Marcus (provisionering) + Code (deploy).

Klass: dok-konsolidering / operativ-vy. Blockerar ej; värdefullt (ADR-053: registrera,
förkasta aldrig tyst). Relaterat: T44, ADR-062, ADR-067, segment-arkitektur.md.
