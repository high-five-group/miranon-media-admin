# Ett vidarebefordrat påstående — eget från tidigare kontext, eller en granskares — prövas FÖRE det förs vidare

`[UNIVERSAL]`

**Ett påstående som förs vidare i en order eller ett beslut — vare sig det
är orkestrerarens eget från en tidigare kontext, eller citerat från en
granskares fynd — måste prövas mot koden av den som för det vidare, INNAN
det förs vidare. Att det en gång kom från en rimlig källa gör det inte
sant vid vidareförandet.** Samma felklass, två instanser samma session
(S127):

1. **"Basen släpar" togs som given.** Etiketten är förbefintlig
   (`TASK-436`, ADR-128 beslut 5). Orkestreraren prövade förkortningen
   "Släpar" mot Gunilla-principen och fällde den korrekt — men tog
   "Basen släpar" själv som given, trots att flytten till beloppsraden
   gjorde den MER framträdande. Förklaringen låg dessutom i ett
   `title`-attribut, alltså osynlig på pekskärm — ett fel som redan fanns
   men aldrig prövades förrän Marcus själv frågade "vad betyder det?".
2. **Ett granskarpåstående fördes vidare oprövat.** Orkestrerarens order
   förde vidare granskarens påstående att `fetchPersonsRegister` betalar
   en tidsbudget per sida; bygg-agenten prövade det och fällde det
   (fullwalken är server-sidig, klienten gör ETT anrop).

Varför `[UNIVERSAL]`: detta skärper premiss-pass-disciplinen (ADR-086) med
en specifik, lätt missad kant — disciplinen gäller inte bara UPPDRAGETS
premisser utan lika mycket orkestrerarens EGNA tidigare slutsatser och
citerade tredjepartspåståenden (t.ex. en granskares fynd) som förs vidare
i en ny order. Gäller varje spoke som kör flerstegs-orkestrering med
kontextbyten.

Källa: `tasks/sessions/2026-09-18-session-127.md` Del 9 ("Basen släpar —
orkestrerarens eget fel" + "Eget fel: orkestrerarens order förde vidare
granskarens påstående...").
