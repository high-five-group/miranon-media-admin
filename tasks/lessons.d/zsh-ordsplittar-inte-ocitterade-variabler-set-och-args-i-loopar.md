# zsh ordsplittar inte ocitterade variabler: `set -- $p` och `$args` blir ETT argument

**[UNIVERSAL] I zsh expanderas en ocitterad variabel till ett enda ord,
inte till flera som i bash. `for p in "444 #2491 sha"; do set -- $p` ger
`$1` = hela strängen, och `npm run bl -- task edit $id $args` skickar
`" --check-dod 1 --check-dod 2"` som ETT argument ("too many arguments").
Skriv `read -r id pr sha <<< "$p"` för att dela en rad, och bygg
argumentlistor som arrayer (`a+=(--check-dod "$i")`, sedan `"${a[@]}"`).**
Mätt 2026-09-17 (S125): tre loopar i rad föll tyst på detta — kortflippar
444/448/449 gav exit 1 utan statusändring, och loop-skript fick sin
usage-text i stället för argument — innan rotorsaken lästes ur felraden.
Samma klass som PIPESTATUS-fragmentet: den interaktiva shellen är zsh, och
bash-vanor faller utan felmeddelande i det första ledet.
