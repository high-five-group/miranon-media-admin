# Issue-tracker: GitLab

Issues och PRD:er för detta repo finns som GitLab-issues. Använd [`glab`](https://gitlab.com/gitlab-org/cli) CLI för alla operationer.

## Konventioner

- **Skapa ett issue:** `glab issue create --title "..." --description "..."`. Använd heredoc för flerradiga beskrivningar. Skicka `--description -` för att öppna redigerare.
- **Läs ett issue:** `glab issue view <number> --comments`. Använd `-F json` för maskinläsbar utdata.
- **Lista issues:** `glab issue list -F json` med lämpliga `--label`-filter.
- **Kommentera:** `glab issue note <number> --message "..."`; GitLab kallar kommentarer för notes.
- **Lägg till/ta bort etiketter:** `glab issue update <number> --label "..."` / `--unlabel "..."`. Flera etiketter kan kommasepareras eller flaggan upprepas.
- **Stäng:** `glab issue close <number>`. Kommandot accepterar ingen stängningskommentar, så skriv först förklaringen med `glab issue note <number> --message "..."` och stäng sedan.
- **Merge requests:** GitLab kallar PR:er merge requests. Använd `glab mr create`, `glab mr view`, `glab mr note` och så vidare — samma form som `gh pr ...`, med `mr` i stället för `pr` och `note`/`--message` i stället för `comment`/`--body`.

Härled repot från `git remote -v`; `glab` gör detta automatiskt inuti en klon.

## Merge requests som triageyta

**MR:er som förfrågningsyta: no.** _(Sätt till `yes` om detta repo behandlar externa merge requests som funktionsförfrågningar; `/triage` läser flaggan.)_

När värdet är `yes` går MR:er genom samma etiketter och tillstånd som issues med `glab mr`-motsvarigheter:

- **Läs en MR:** `glab mr view <number> --comments` och `glab mr diff <number>`.
- **Lista externa MR:er för triage:** `glab mr list -F json`; behåll bara MR:er vars författare inte är projektmedlem eller ägare.
- **Kommentera / etiketter / stäng:** `glab mr note`, `glab mr update --label`/`--unlabel`, `glab mr close`.

Till skillnad från GitHub numrerar GitLab issues och MR:er separat, så `#42` är entydigt när du vet vilken yta underhållaren avser.

## När en skill säger ”publicera i issue-trackern”

Skapa ett GitLab-issue.

## När en skill säger ”hämta relevant ärende”

Kör `glab issue view <number> --comments`.
