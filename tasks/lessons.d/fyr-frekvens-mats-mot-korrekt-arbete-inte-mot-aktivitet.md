# Fyr-frekvens mäts mot KORREKT arbete, inte mot total aktivitet — det avgör grindens form

**En grind ska mätas på hur ofta den fyrar när arbetet görs RÄTT, inte på hur ofta
den rörda ytan i övrigt berörs. De två talen kan skilja sig med hela intervallet,
och det är det första som avgör formen.** `[UNIVERSAL]`

**Formen följer talet, och det är inte en smaksak:**

| Fyrar på korrekt arbete | Form | Varför |
|---|---|---|
| 0 % | `deny` | Gratis. Ingen bedömning, ingen friktion, fångar bara felläget |
| Sällan | `ask` | Kalibrerad. Bedömningen är värd sitt pris |
| Ofta | **ingen grind** | Blir brus → gummistämpel. Approval fatigue, precomputerad |

**Empiri (S91, 2026-07-29):** `backlog/tasks/**` rördes av **11 %** av commitarna
— vilket läser som "för brusigt att grinda". Men alla legitima skrivningar går via
`Bash(backlog task …)`, aldrig via `Edit`/`Write`. Mot KORREKT arbete är talet
alltså **0 %**, och en `deny` på `Edit`/`Write` mot den sökvägen kostar exakt
ingenting samtidigt som den fångar hundra procent av felläget.

Samma mätning gav motsatt svar för prejudikat-filerna: korrekt arbete skriver
där, 8,5 % av commitarna, så `deny` vore fel och `ask` rätt.

**Konsekvens:** en grind vars fyr-frekvens mot korrekt arbete inte är mätt har
inte fått sin form vald — den har fått en gissad.

Besläktad: [[gratis-ar-inte-ett-skal-att-bygga-en-grind]] — låg fyr-frekvens gör
formen billig, men gör den inte motiverad.
