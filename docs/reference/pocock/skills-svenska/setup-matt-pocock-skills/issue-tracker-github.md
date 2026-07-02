# Issue-tracker: GitHub

Issues och PRD:er för detta repo finns som GitHub-issues. Använd `gh` CLI för alla operationer.

## Konventioner

- **Skapa ett issue:** `gh issue create --title "..." --body "..."`. Använd heredoc för brödtexter på flera rader.
- **Läs ett issue:** `gh issue view <number> --comments`; filtrera kommentarer med `jq` och hämta även etiketter.
- **Lista issues:** `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` med lämpliga filter för `--label` och `--state`.
- **Kommentera:** `gh issue comment <number> --body "..."`.
- **Lägg till/ta bort etiketter:** `gh issue edit <number> --add-label "..."` / `--remove-label "..."`.
- **Stäng:** `gh issue close <number> --comment "..."`.

Härled repot från `git remote -v`; `gh` gör detta automatiskt inuti en klon.

## Pull requests som triageyta

**PR:er som förfrågningsyta: no.** _(Sätt till `yes` om detta repo behandlar externa PR:er som funktionsförfrågningar; `/triage` läser flaggan.)_

När värdet är `yes` går PR:er genom samma etiketter och tillstånd som issues med `gh pr`-motsvarigheter:

- **Läs en PR:** `gh pr view <number> --comments` samt `gh pr diff <number>` för diffen.
- **Lista externa PR:er för triage:** `gh pr list --state open --json number,title,body,labels,author,authorAssociation,comments`; behåll bara `authorAssociation` `CONTRIBUTOR`, `FIRST_TIME_CONTRIBUTOR` eller `NONE` och filtrera bort `OWNER`/`MEMBER`/`COLLABORATOR`.
- **Kommentera / etiketter / stäng:** `gh pr comment`, `gh pr edit --add-label`/`--remove-label`, `gh pr close`.

GitHub delar nummerserie mellan issues och PR:er, så ett ensamt `#42` kan vara båda. Slå upp med `gh pr view 42` och fall tillbaka till `gh issue view 42`.

## När en skill säger ”publicera i issue-trackern”

Skapa ett GitHub-issue.

## När en skill säger ”hämta relevant ärende”

Kör `gh issue view <number> --comments`.
