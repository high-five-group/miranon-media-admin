---
owner: marcus803
updated: 2026-08-17
review_by: 2026-11-17
status: stable
lifecycle: paused
---

# T144 — Heartbeat-svepet larmar utan ägarskaps-filter, och samma röda PR väcker orkestreraren i timmar

> Registrerad i S106 (2026-08-15), andra instansen mätt i S102 resume 8
> (2026-08-17). Triagerad enligt `ADR-053`: blockerar inte — svepet gör
> annars exakt sitt jobb — men varje väckning för en främmande PR är en
> modell-tur utan handling. Parkerad; ingen åtgärd vidtagen.

## Vad som är MÄTT

| Instans | Session | PR som larmade | Ungefärligt antal väckningar | Ägarskap |
|---|---|---|---|---|
| 1 | S106, 2026-08-15 | `#1343` (S102:s, röd) | ~35 | främmande session |
| 2 | S102 resume 8, 2026-08-17 | `#1488` (Dependabot, röd) | ~30 | parkerad för Marcus review |

Båda gångerna gällde larmet en PR som den larmade sessionen **per regel
inte får röra** — i instans 1 en syskonsessions gren, i instans 2 en
Dependabot-PR som väntar på ett mänskligt beslut. Svepet är
level-triggered per `L443`, alltså rapporteras tillståndet vid varje
svep så länge det håller, inte bara vid övergången. Det är korrekt
design mot den blindhet som missade PR `#572` — och det är just den
egenskapen som gör ett parkerat rött tillstånd till ett återkommande
larm.

## Varför den befintliga undantagslistan inte täcker det

`.heartbeat-svep-policy.conf` bär redan
`HEARTBEAT_EXEMPT_AUTHORS=("dependabot")`. Instans 2 larmade ändå, och
det är **med avsikt** — policyns egen § GRÄNS säger rakt ut:

> *"undantaget gäller ENDAST armerings-kandidat-vägen. En Dependabot-PR
> som genuint går RÖD (trasig CI) eller DIRTY (konflikt) larmar
> OFÖRÄNDRAT — författar-undantaget tystar bara 'ingen aktiv
> auto-merge-begäran', aldrig ett verkligt trädfel."*

Klassen är alltså **inte en lucka i konfigurationen** utan ett
designval som möter verkligheten dåligt när en röd PR står parkerad
över en hel session. Att bara lägga fler författare i listan löser
ingenting; gränsen ligger på en annan axel.

En tidigare paus-handoff bokförde detta som *"undantagslista saknas"* —
det var fel, och felet överlevde eftersom ingen läste policyfilen innan
raden skrevs. Listan fanns hela tiden.

## Kandidater till åtgärd (ingen vald)

1. **Ägarskaps-filter på röda-rapporten** — rapportera bara rött för
   PR:er vars gren sessionen själv äger. Risk: en genuint trasig
   främmande PR blir osynlig för alla utom sin ägare, vilket
   återinför `T108`-klassen (ett tillstånd utan bevakare) om ägaren
   är borta.
2. **Dämpning efter N upprepningar av oförändrat tillstånd** — larma
   fullt första gången, därefter en rutin-rad så länge check-rollup
   och SHA står stilla. Bevarar synligheten, tar bort repetitionen.
   Kräver att svepet håller tillstånd mellan varv.
3. **Utöka exempt-författare till att gälla även RÖTT** — enklast, men
   river policyns medvetna § GRÄNS och gör en genuint trasig
   Dependabot-PR tyst. Avrådes utan att gränsens ursprungliga skäl
   omprövas först.

Kandidat 2 bevarar båda egenskaperna som står i spänning (synlighet vs
brus) och är den enda som inte river ett dokumenterat designval.

## Vad som INTE är utrett

- Om svepet kan hålla tillstånd mellan varv utan att bli beroende av en
  fil som överlever sessionsbyten.
- Vad "oförändrat tillstånd" ska nycklas på — check-rollup ensam räcker
  inte, eftersom en PR kan gå röd på en ny orsak med samma rollup-värde.
- Om samma dämpning bör gälla DIRTY-vägen, som bär samma repetition.
