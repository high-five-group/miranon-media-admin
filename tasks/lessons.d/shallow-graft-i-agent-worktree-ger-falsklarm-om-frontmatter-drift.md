# En shallow-graft i en agent-worktree ger falsklarm om frontmatter-drift, differentiera innan dom

**[UNIVERSAL] En git-worktree vars historik bär en shallow-graft (`.git/shallow`)
har en trunkerad fil-historik, vilket gör att kommandon som `git log -- <fil>`
kan returnera fel eller tomt resultat för filer vars faktiska historik
sträcker sig längre tillbaka än graftens gräns. En dokumentationsgrind som
läser filhistorik för att upptäcka frontmatter-drift kan då larma falskt om
en fil den faktiskt inte kan se historiken för.** Mätt 2026-09-01 (S113
resume 7, `tasks/sessions/2026-08-29-session-113.md` rad 2099 till 2101): en
agent-worktree med en shallow-graft gav `check:docs` ett falsklarm om
frontmatter-drift på en fil vars historik i verkligheten var oförändrad.
Besläktat men skilt från den äldre, redan dokumenterade shallow-clone-buggen
i frontmatter-validatorn (fetch-depth i CI), detta gäller worktree-lokal
graft, inte CI:s fetch-depth. Regel: innan ett `check:docs`-larm om
frontmatter-drift godtas som en äkta regression, verifiera att worktreen
inte bär en shallow-graft (`git log -1 --format=%H -- <fil>` mot en fullt
klonad checkout av samma commit) och differentiera falsklarm från äkta
drift innan domen fälls.
