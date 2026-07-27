# Verifiera med CI:s exakta kommando, inte en svagare lokal variant

**En lokal grind-körning bevisar ingenting om den kör en svagare variant än CI —
och "jag körde verktyget" räcker inte som verifiering, bara "jag körde CI:s
exakta kommando".** `[UNIVERSAL]`

**Empiri (S91, 2026-07-27, PR #273 — två instanser i samma PR):**

1. **Biome.** Jag körde aldrig Biome före commit, trots att commiten införde tre
   nya filer och ändrade JSONC. Sub-disciplinen som föreskriver
   `biome check --write` före `git add` finns skriven i `session-start`-skillen —
   den lästes inte. CI föll på steg 6.
2. **shellcheck.** Jag körde `shellcheck <filer>` och fick **exit 0**. CI kör
   `shellcheck --severity=style --enable=all` (ADR-033, kravet är 0/0/0/0) och
   fick **SC2312 × 6**. Samma binär, samma filer, motsatt utfall — skillnaden var
   två flaggor jag inte visste att grinden bar.

Instans 2 är den intressanta, eftersom den ser ut som verifiering. Jag hade ett
grönt exit att peka på. Det gröna gällde bara en annan fråga än den grinden
ställer.

**Motmedlet är inte att komma ihåg flaggorna** utan att läsa dem ur grinden och
köra dem verbatim: `grep -A12 '<grind-namn>' .github/workflows/ci.yml`, kopiera
kommandot, kör det. Det tar en tool-call och ersätter en gissning.

Kostnaden när det inte görs är inte bara ett rött jobb: PR #273 körde full svit
med skarp staging **tre gånger** innan den var grön, vilket är ~30 minuter genom
den globala mutexen — samma flaskhals sessionen ägnats åt att mäta.

**Skärpningen mot närliggande lärdomar:** [[L322]]-klassen handlar om grindar som
är fail-open; detta handlar om *verifieringen* av dem. Och där CLAUDE.md redan
säger "lokal exit 0 garanterar inte grön CI" om Biome specifikt, är den generella
formen bredare: **varje grind vars lokala anrop skiljer sig från CI:s är en
grind du inte har kört.**
