# Härled ur källan — skriv aldrig av ett tal som en annan artefakt påstår

**Ett tal i ett kort, ett uppdrag eller en kommentar är någons uträkning, inte
en mätning. Räkna om det ur koden innan du bygger på det — den som skriver av
ärver felet och ger det ett andra liv.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-28):** `TASK-66`:s bygg-agent skulle dokumentera
retrykedjans tidskostnad. Kortet angav *"~8–10 s"*. Agenten vägrade skriva av
talet och härledde det ur `src/data/utils.ts` och `src/router.ts` i stället.
Uträkningen gav **7,0–8,2 s**, vilket avtäckte att ett **annat** korts räkning
var fel: `TASK-65` angav konstruerat värsta fall `4 × 2100 + 1400 = 9800 ms`,
byggt på antagandet att jittret skalar med den exponentiella delayen.

Källan säger något annat:

```js
const delay = baseDelay * 2 ** attempt + Math.random() * (baseDelay / 2);
```

`baseDelay / 2` är **konstant 0–100 ms** per sleep. Rätt tak är `4 × 1700 +
1400 = 8200 ms`, och marginalen mot timeouten var 3,8 s — inte 2,2 s som kortet
påstod. Två av kortets bärande påståenden föll med rättelsen.

**Beviset låg i kortet hela tiden, oläst:** dess egna fem mätningar
(7901/7904/7916/7941/8401 ms) ligger i 8200-modellens spann och hade varit svåra
att förklara under 9800-modellen. Empirin och räkningen motsade varandra i samma
dokument, och ingen hade jämfört dem.

**Motmedlet är att rätta VID KÄLLAN** — kortets beskrivning i samma commit som
koden — så att nästa läsare inte ärver felet. En rättelse som bara lever i en
agentrapport eller i chatten dör med sessionen.

Besläktad: [[uppdrag-kan-peka-pa-fel-adress-verifiera-mot-koden]]
