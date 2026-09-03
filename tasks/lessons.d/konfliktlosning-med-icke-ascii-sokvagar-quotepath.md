# Konfliktlösning med icke-ASCII-sökvägar kräver `core.quotepath=false` — annars missas filen och konfliktmarkörer kan committas

**[UNIVERSAL] `git diff --name-only` citerar sökvägar med icke-ASCII-tecken
som oktal-escapade strängar som standard, så ett skript som matchar
sökvägen rakt av (t.ex. `checkout --theirs -- "$fil"`) missar filen
tyst.** Mätt 2026-09-03 (S115, `tasks/sessions/2026-09-03-session-115.md`
Del 7 § Landnings-incidenter, `#2268`): en instrumenteringslogg (löst som
union av rader) och kortet `368.4` (mains version plus CLI-återapplicering)
konfliktade mot `main`. Första lösningsförsöket citerade den icke-ASCII
sökvägen fel, `checkout --theirs` missade filen, och det efterföljande
`git add backlog/tasks/` committade kortet MED kvarvarande
konfliktmarkörer rakt in på `main` (`0ef24ce5`, pushad). Rättat i
`512c7a09` med `git -c core.quotepath=false ls-files` (namnen synliga
okvoterade), `git show origin/main:<fil>` (läs den andra sidans version
explicit i stället för att lita på `checkout --theirs`) och manuell
CLI-editering. Regel: lös alltid konflikter fil för fil, aldrig med en
katalog-bred `git add`, och kör `git grep -l '^<<<<<<<'` som sista
kontroll före varje konflikt-commit.
