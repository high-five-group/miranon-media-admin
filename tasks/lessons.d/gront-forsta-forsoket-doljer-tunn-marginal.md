# Grönt på första försöket säger ingenting om marginalen [UNIVERSAL]

**Ett grönt test visar att gränsen inte överskreds — aldrig hur nära den låg.
Där ett tidsvärde eller ett tak är ärvt från en precedent måste marginalen
räknas, inte antas.**

**Empiri (S91, 2026-07-28, `TASK-59.8` steg 4):** en agent skrev ett test mot en
felyta och satte `timeout: 12_000` genom att härma närmaste befintliga rad.
Testet blev grönt på **första körningen**. Där hade arbetet kunnat sluta.

I stället mättes det: fem isolerade körningar gav 7901 · 7904 · 7916 · 7941 ·
8401 ms. Sedan räknades kedjan ur källan — fyra HTTP-försök med jitter plus
QueryClientens tre retries — och gav ett konstruerat värsta fall på **9800 ms**.
Marginalen mot 12 s var alltså **2,2 sekunder**, före CI:s långsammare runner och
parallell workerlast. Det gröna utfallet dolde det fullständigt.

Samma klass hade träffat repot en gång tidigare samma vecka: acceptance-jobbets
tak låg på 480 s medan den värsta observationen var 452 s — **28 sekunders
marginal**, upptäckt först när körningarna mättes per steg.

**Varför precedent-härmning förvärrar det:** raden man kopierar var grön när den
skrevs, så den bär inget varningstecken. Marginalen ärvs osynligt tillsammans med
värdet, och sprids till varje ny rad som härmar den.

**Motmedlet:** när ett tak vaktar något räknebart — retrykedjor, timeouts,
jobb-budgetar — räkna det konstruerade värsta fallet ur källan och skriv ut
räkningen vid värdet. Mät hellre fem gånger än lita på en grön körning; talet du
får är underlaget, inte utfallet.
