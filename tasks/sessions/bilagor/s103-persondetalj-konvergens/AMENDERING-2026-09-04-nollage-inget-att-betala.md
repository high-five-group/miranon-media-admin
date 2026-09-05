# Amendering 2026-09-04 — nolläget "Inget kvar att betala" → "Inget att betala"

**Yta:** `persondetaljen` i
`tasks/sessions/bilagor/s103-persondetalj-konvergens/facit.json`. Skarp
källa: `src/components/betalningar/PersonBetalningar.tsx` rad ~94
(`oversikt.rader.length === 0 ? 'Inget att betala.' : …`) — samma komponent
som `AMENDERING-2026-09-01-just-nu-utan-guld-och-betalningssektionens-nya-form.md`
§ 3 redan bokför under rubriken "Terminologin".

**Klass:** ren terminologi-revision, TASK-391 (S120, 2026-09-04).

**Vad som ändras:** `AMENDERING-2026-09-01-…`s rad 174 dokumenterar
2026-09-01-bytet *"'Inget öppet belopp enligt basen' → 'Inget kvar att
betala'"* som gällande formulering. Den formuleringen är nu HISTORIK, inte
nuläge: TASK-391 bytte nolläget vidare till **"Inget att betala"** — "kvar"
förutsatte att något funnits att betala, medan nolläget (`saknas === null`,
alltid `rader.length === 0`) inte vet det (aldrig haft pris ELLER helt
betald, ovisst vilket). "Inget att betala" är neutralt och täcker båda
fallen. Detta gäller ENDAST personkortets nolläge — `2025-09-01`-radens
övriga poster (etiketten "Kvar att betala", `Förfallen`-pillen, "kvarvarande"
i inkorgens strängar) är ORÖRDA.

**Divergens öppet bokförd (ADR-086):** TASK-391s eget kort namngav bara
`s103-persondetalj-konvergens` och `s83-anmalningsvyn-konvergens` som
kandidater att prova. `s83-anmalningsvyn-konvergens` bär INTE strängen (dess
amenderingar rör avbokning/ombokning, inte betalningar) — bokfört i
TASK-391s notes med grep-bevis i stället för en amenderings-fil där.
Samma grepp mot hela `tasks/sessions/bilagor/` visade dessutom att
`s93-atgardssida-promovering/AMENDERING-2026-09-01-pricka-av-vertikalen-riven.md`
rad 174 bär exakt samma citat — den bilagan namngavs INTE av kortet och
rörs därför INTE av denna leverans; flaggat i byggagentens slutrapport för
orkestrerarens beslut om ett eget litet uppföljningskort.
