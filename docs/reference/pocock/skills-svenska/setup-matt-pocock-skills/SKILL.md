---
name: setup-matt-pocock-skills
description: Konfigurera detta repo för engineering-skillsen — sätt upp issue-tracker, vokabulär för triageetiketter och layout för domändokument. Kör en gång före första användningen av övriga engineering-skills.
disable-model-invocation: true
---

# Sätt upp Matt Pococks skills

Skapa den per-repo-konfiguration som engineering-skillsen förutsätter:

- **Issue-tracker** — var issues finns (GitHub som standard; lokal Markdown stöds direkt).
- **Triageetiketter** — strängarna för de fem kanoniska triagerollerna.
- **Domändokument** — var `CONTEXT.md` och ADR:er finns och reglerna för att läsa dem.

Detta är en promptstyrd skill, inte ett deterministiskt skript. Utforska, presentera vad du hittade, bekräfta med användaren och skriv sedan.

## Process

### 1. Utforska

Undersök repots utgångsläge. Läs det som finns; anta inget:

- `git remote -v` och `.git/config` — är detta ett GitHub-repo, och vilket?
- `AGENTS.md` och `CLAUDE.md` i repots rot — finns någon, och har någon redan avsnittet `## Agent skills`?
- `CONTEXT.md` och `CONTEXT-MAP.md` i roten.
- `docs/adr/` och alla kataloger `src/*/docs/adr/`.
- `docs/agents/` — finns tidigare utdata från denna skill redan?
- `.scratch/` — tecken på att en lokal Markdown-konvention för issue-tracker redan används.

### 2. Presentera fynd och fråga

Sammanfatta vad som finns och vad som saknas. Gå sedan igenom de tre besluten **ett i taget**: presentera ett avsnitt, invänta användarens svar och gå först därefter vidare. Dumpa inte alla tre samtidigt.

Utgå från att användaren inte kan termerna. Börja varje avsnitt med en kort förklaring av vad det är, varför skillsen behöver det och vad olika val förändrar. Visa sedan valen och standardvalet.

**Avsnitt A — Issue-tracker.**

> Förklaring: Issue-trackern är platsen där ärenden för detta repo finns. Skills som `to-issues`, `triage`, `to-prd` och `qa` läser och skriver där. De måste veta om de ska anropa `gh issue create`, skriva en Markdown-fil under `.scratch/` eller följa ett annat arbetsflöde. Välj platsen där arbetet faktiskt spåras.

Standardläget är GitHub. Pekar `git remote` mot GitHub, föreslå det. Pekar den mot GitLab, föreslå GitLab. Erbjud annars, eller om användaren föredrar det:

- **GitHub** — issues i repots GitHub Issues via `gh` CLI.
- **GitLab** — issues i GitLab Issues via [`glab`](https://gitlab.com/gitlab-org/cli) CLI.
- **Lokal Markdown** — issues som filer under `.scratch/<feature>/` i repot; bra för soloprojekt eller repos utan remote.
- **Annat** (Jira, Linear och liknande) — be användaren beskriva arbetsflödet i ett stycke och dokumentera det som fri prosa.

Om, och bara om, användaren väljer **GitHub** eller **GitLab**, ställ följdfrågan:

> Förklaring: Open source-repos tar ofta emot funktionsförfrågningar som pull requests, inte bara issues. Om detta aktiveras drar `/triage` in *externa* PR:er i samma kö och kör dem genom samma etiketter och tillstånd som issues. Medarbetares pågående PR:er lämnas ifred. Låt det vara av om PR:er inte är en förfrågningsyta.

- **PR:er som förfrågningsyta** — ja / nej (standard: nej). Dokumentera svaret i `docs/agents/issue-tracker.md`. För lokal Markdown och andra trackers: hoppa över frågan; där finns inga PR:er.

**Avsnitt B — Vokabulär för triageetiketter.**

> Förklaring: När `triage` hanterar ett inkommande issue flyttar den ärendet genom en tillståndsmaskin: behöver utvärderas, väntar på rapportör, redo för AFK-agent, redo för människa eller kommer inte att fixas. Den behöver etiketter som motsvarar strängar som redan är konfigurerade i repot. Om andra namn redan används, till exempel `bug:triage` i stället för `needs-triage`, mappa dem här så att skillen använder rätt etiketter och inte skapar dubbletter.

De fem kanoniska rollerna:

- `needs-triage` — underhållare behöver utvärdera.
- `needs-info` — väntar på rapportör.
- `ready-for-agent` — fullt specificerat och AFK-redo.
- `ready-for-human` — behöver mänsklig implementation.
- `wontfix` — kommer inte åtgärdas.

Standard: varje rolls sträng är dess namn. Fråga om användaren vill åsidosätta något. Saknar trackern befintliga etiketter fungerar standardvärdena bra.

**Avsnitt C — Domändokument.**

> Förklaring: Vissa skills (`improve-codebase-architecture`, `diagnosing-bugs`, `tdd`) läser `CONTEXT.md` för projektets domänspråk och `docs/adr/` för tidigare arkitekturbeslut. De måste veta om repot har en global kontext eller flera, till exempel separata frontend-/backend-kontexter i ett monorepo, så att de läser på rätt plats.

Bekräfta layouten:

- **En kontext** — en `CONTEXT.md` och `docs/adr/` i repots rot. Vanligast.
- **Flera kontexter** — `CONTEXT-MAP.md` i roten pekar på `CONTEXT.md` per kontext, vanligen i ett monorepo.

### 3. Bekräfta och redigera

Visa användaren ett utkast av:

- Blocket `## Agent skills` som ska läggas till i den `CLAUDE.md` eller `AGENTS.md` som redigeras.
- Innehållet i `docs/agents/issue-tracker.md`, `docs/agents/triage-labels.md` och `docs/agents/domain.md`.

Låt användaren redigera innan något skrivs.

### 4. Skriv

**Välj fil att redigera:**

- Finns `CLAUDE.md`, redigera den.
- Annars, om `AGENTS.md` finns, redigera den.
- Finns ingen av dem, fråga användaren vilken som ska skapas. Välj inte åt dem.

Skapa aldrig `AGENTS.md` när `CLAUDE.md` redan finns, eller tvärtom. Redigera alltid den fil som redan finns.

Finns redan ett block `## Agent skills` i den valda filen, uppdatera dess innehåll på plats i stället för att lägga till en dubblett. Skriv inte över användarens ändringar i omgivande avsnitt.

Blocket:

```markdown
## Agent skills

### Issue tracker

[enradssammanfattning av var issues spåras och om externa PR:er är en triageyta]. See `docs/agents/issue-tracker.md`.

### Triageetiketter

[enradssammanfattning av etikettvokabulären]. See `docs/agents/triage-labels.md`.

### Domändokument

[enradssammanfattning av layouten — "single-context" eller "multi-context"]. See `docs/agents/domain.md`.
```

Skriv sedan de tre dokumentfilerna med start i mallarna i denna skill:

- [issue-tracker-github.md](./issue-tracker-github.md) — GitHub-issue-tracker.
- [issue-tracker-gitlab.md](./issue-tracker-gitlab.md) — GitLab-issue-tracker.
- [issue-tracker-local.md](./issue-tracker-local.md) — lokal Markdown-issue-tracker.
- [triage-labels.md](./triage-labels.md) — etikettmappning.
- [domain.md](./domain.md) — konsumentregler och layout för domändokument.

För andra issue-trackers, skriv `docs/agents/issue-tracker.md` från grunden utifrån användarens beskrivning.

### 5. Klart

Berätta för användaren att setupen är klar och vilka engineering-skills som nu läser dessa filer. Nämn att de senare kan redigera `docs/agents/*.md` direkt; kör bara om denna skill om de vill byta issue-tracker eller börja om från grunden.
