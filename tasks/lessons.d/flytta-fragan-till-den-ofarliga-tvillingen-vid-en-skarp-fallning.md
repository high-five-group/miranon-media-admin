# När en skarp operation faller: flytta frågan till den ofarliga tvillingen — en differential med EN varierad variabel slår varje hypotes

**Ett fel under en prod-operation drar tanken till prod. Rätt första drag är
att reproducera samma operation mot den ofarliga tvillingen (staging) med allt
annat konstant, och sedan variera EN misstänkt variabel i taget. Utfallet
flyttar frågan från "är målet trasigt?" till "är verktyget fel?" utan att röra
det skarpa målet en andra gång.**
`[UNIVERSAL]`

Instans (S108, 2026-08-24, Del 18 § A–B): prod-deployen avbröts efter **18 av
45** funktioner — CLI:t försökte öppna INNEHÅLLET i en 25 kB
enkelrads-strängmodul som om det vore en sökväg. Skript-vägen visade sig köra
två CLI-versioner: det fällande anropsstället kallade den globala binären
(2.75.0), anroparen körde genomgående `npx supabase` (2.115.0). Differentialen
kördes mot SAMMA funktion, SAMMA mål (staging) och samma träd, med
CLI-versionen som enda varierade variabel:

| CLI | Utfall |
|---|---|
| `supabase` 2.75.0 (global binär) | FAIL — identiskt fel, reproducerat |
| `npx supabase` 2.115.0 | EXIT 0 |

Alltså verktyget. Inte prod, inte filen, inte det nyss landade schemat. Att
staging fungerat hela tiden förklarades av att staging-deployerna körts via
`npx`.

**Det generella:** en skarp miljö är det dyraste stället att felsöka i — varje
körning är en riktig mutation, och varje hypotes du inte kan pröva där blir
kvar som osäkerhet i rapporten. Tvillingen är billig och obegränsad.
Giltighetsvillkoret är att allt utom EN variabel hålls konstant: håller du två
(annat mål OCH annan version) mäter du summan och kan inte tillskriva någon av
dem. Det som gjorde differentialen möjlig här var att skillnaden redan låg
nedskriven i koden — två anropsställen i samma kedja använde två olika former
av samma verktyg. Leta efter den asymmetrin först; den är oftare orsaken än
miljön.
