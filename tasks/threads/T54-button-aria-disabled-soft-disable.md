# T54 — Button-primitiven saknar ren aria-disabled-soft-disable

- **Tillstånd:** `paused`
- **Uppstod:** Session 45 (T50 arch-audit, ADR-058 område v residual)
- **Commit-tagg:** `git log --grep "\[T54\]"`

## Scope

`Button`-primitiven ([`src/components/primitives/Button.tsx`](../../src/components/primitives/Button.tsx))
mappar `isDisabled` → native `disabled`-attribut (react-aria-components). Det finns
ingen ren `aria-disabled`-soft-disable som håller knappen **fokuserbar** (kvar i
tab-ordningen) medan den är låst och annonserar VARFÖR den är låst.

För villkorligt-låsta knappar — särskilt faro-/destruktiva som T50:s "Skicka till N
personer" som låses upp via skriv-för-att-bekräfta — betyder native `disabled` att en
skärmläsar-användare som tabbar igenom **inte landar på knappen** för att höra dess
tillstånd direkt; upptäckbarheten bärs i stället av synlig (men inaktiv) knapp +
fält-instruktion + aria-live-avisering.

## Varför denna tråd

T50:s arch-audit (Session 45, ADR-058 område v) registrerade detta som en **residual,
EJ en AVVIKELSE**: a11y-golvet är mött (axe-0 grön i CI; WCAG AA/AAA; operabel +
annonserad). En `aria-disabled`-soft-disable vore en **beyond-golv-förfining** som
lyfter villkorligt-låsta knappar från "fungerande" till "optimal upptäckbarhet".

Tvärsnitt: rör **alla villkorligt-disablade knappar** i appen (och framtida produkter
via Mm Component Library), inte bara T50:s faro-knapp → primitiv-nivå-arbete, ej en
vy-fix.

## Options-rymd för senare beslut

- **(A) Lämna som är** — native `isDisabled` + aria-live + fält-instruktion (golvet
  mött; ingen primitiv-ändring).
- **(B) Utöka Button** med ett `softDisabled`-läge (`aria-disabled=true` + behåller
  fokuserbarhet + guardar `onPress` + `data-`-styling för låst-utseende) — opt-in,
  bakåtkompatibelt med dagens `isDisabled`.
- **(C) Annat** — t.ex. ett separat mönster/wrapper för type-to-confirm-knappar.

## Relaterat

- [session-45](../sessions/2026-06-29-session-45.md) § Del 2 (arch-audit-residualen).
- [T50](T50-ui-hardning-sand-grind.md) — första konkreta konsumenten (faro-knappen).
- KVALITETSDEFINITIONER-11-REACT.md (a11y-axeln) + ADR-058 (arch-audit område v).
