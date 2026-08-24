# En promoverad form hämtas ur FACITET, inte ur närmaste granne — grannens form är rätt för grannens innehåll

**Vid promovering är det den GODKÄNDA formen som ska flyttas, och den bor i
prototypen. Att i stället kopiera den befintliga grannraden känns
konsekvensskapande men är en regression: grannens klasser är avvägda mot
grannens innehåll, och samma klass på ett annat innehåll ger ett annat
resultat. Diffa den promoverade ytan mot prototypen, inte mot syskonen — en
regression som ser ut som huskonvention är den svåraste att se.**

Instans (S108, 2026-08-24, `TASK-309.12`): prototypens mall- och generatorrad
bar `flex items-center gap-3 py-3`
(`1ec70a85^:src/components/dokument/prototyp/GenereringsPrototyp.tsx` rad **483**
och **511**, båda disk-verifierade). Den promoverade formen bar
`flex items-start gap-3 py-3` (`1ec70a85:src/components/dokument/DokumentYta.tsx`
rad **1141** och **1176**). Utfallet: raden har tre led i vänsterspalten men
bara EN 44 px-knapp till höger, så chevronen klistrades i överkant.
Commit-meddelandet till fixen (`d9d973d5`) namnger den troliga orsaken:
*"DokumentRadSkals form (fyra knappar, `items-start` med rätta) kopierad till
rader som har en."* `DokumentRadSkal` (samma fil, rad 878) är bilageraden —
där är `items-start` korrekt, eftersom höger-ytan bär flera ikonknappar
(`DokumentAtgardsKnappar` + `LaddaNerKnapp`) mot en flerledad vänsterspalt.
Marcus fann avvikelsen i granskningen; fixen återställde `items-center`.

**Det generella:** promoveringskontraktet gör prototypen till kravspec, vilket
betyder att varje avvikelse mellan skarp yta och facit är ett byggfel — även
när avvikelsen råkar sammanfalla med hur den närmaste befintliga koden ser ut.
Just den sammanfallningen är det som gör felmoden svår: en kopierad
grannklass passerar varje "ser detta ut som resten av huset?"-granskning, för
det gör det. Vad den inte passerar är en jämförelse mot det som godkändes.
Och den som väljer källa i promoveringsögonblicket står inför ett verkligt
val — grannen är närmare till hands och ofta rätt — så regeln måste vara
uttalad: facitet vinner, och när grannens form avviker från facitet är det en
fråga att ställa, inte ett mönster att följa.
