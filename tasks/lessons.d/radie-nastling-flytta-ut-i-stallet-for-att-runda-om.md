# Radie-nästling: flytta ut elementet i stället för att runda om det

**[UNIVERSAL] En 4 px-form INUTI en 16 px-behållare, bredvid 16 px-syskon,
läser som ett främmande föremål — men botemedlet är sällan att ge formen
behållarens radie (då blir den en annan knappform än husets); det är att ta
den ur nästlingen, så att de två radierna tillhör två olika objektklasser
sida vid sida.** Mätt på Bilagor-ytan 2026-08-30 (S113, `TASK-309.44`):
handlingsradens knappar (`border-radius: 4px`) låg inne i listans grå block
(16 px) bredvid korten (16 px), och sidans primärknapp stod i listans bricka
med tom grå yta till höger — Marcus: *"knapparna inte sitter perfekt … de har
en annan rundning än blocket också"*. Flytten till sidkolumnen (h1 → väljare
→ handlingsrad → block, 16 px-rytm) löste både radie-frågan och
roll-förväxlingen (blocket svarar på "vad finns här?", knapparna på "vad kan
jag göra här?") utan att röra `Button`-primitiven. Samma regel gav ⋯-knappen
sin runda hover-platta: en cirkel kan aldrig krocka med kortets radie.
Fråga vid varje "det ser fel ut men jag kan inte säga varför": hur många
radier finns i nästlingen, och hör elementet verkligen hemma i behållaren?
