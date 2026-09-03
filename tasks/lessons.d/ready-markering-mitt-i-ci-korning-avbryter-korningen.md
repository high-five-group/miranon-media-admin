# Draft → ready mitt i en CI-körning avbryter körningen, med alla steg gröna

**[UNIVERSAL] Att sätta en draft-PR till ready medan dess CI-körning pågår
gör att GitHub avbryter körningen (`conclusion: cancelled`) trots att varje
steg lyckats — och ingen ny körning startas automatiskt. Aggregatorn ser
sedan `cancelled` som rött, svepet larmar RÖTT, och armeringen står still
tills någon kör om.** Mätt 2026-09-03 (S116, PR `#2237`, run `33738181818`:
alla 17 steg `success`, jobbet `cancelled`, ready-markeringen skedde 09:19Z
mitt i körningen; omkörd med `gh run rerun` → grön). Svepets
armerings-regel ("draft eller armera i samma andetag") och review-grindens
ordning (push → granskning → ready → armera) kolliderar därför i tid: draft
under granskning är rätt, men ready ska sättas FÖRST NÄR PR:ens senaste run
är klar. Regel: före `gh pr ready`, kontrollera `gh pr checks <nr>` — ingen
`pending` → ready + armera; annars vänta in körningen (en `until`-loop i
bakgrunden räcker). Hittar du en `cancelled`-run med gröna steg: `gh run
rerun <id>`, gissa inte att koden är trasig.
