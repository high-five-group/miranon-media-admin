# En grind som mekaniserar ett förbud måste mekanisera dess föreskrivna undantag i samma andetag [UNIVERSAL]

**Ett förbud har nästan alltid ett föreskrivet undantag — "aldrig X, utom
efter Y". Mekaniseras bara förbudet blir grinden grön i åratal, eftersom
ingen ännu nått undantaget, och fäller sedan på den FÖRSTA som gör exakt det
processen kräver. Felet ser då ut som ett fel i arbetet, inte i grinden.
Fråga vid varje ny grind: vad är det tillåtna slutläget, och kan grinden
skilja det från överträdelsen?**

Instans (S110, 2026-08-22, miranon-media-admin): `check-facit.sh` invariant
(b) krävde att varje `kallor`-sökväg i ett facit-manifest finns på disk.
`ADR-103` B2 steg 4 FÖRESKRIVER att prototyp-substratet rivs efter Marcus
stämpel — vilket gör sökvägen död med avsikt. Invarianten skrevs 2026-08-06,
var grön i sexton dagar, och fällde `PR #1769` (`TASK-285.11`) 2026-08-22:
den första rivning som någonsin nådde steget. Fyra familjer till stod på tur
mot samma vägg — 22 prototyp-källor i fem stämplade manifest.

**Vad som gjorde undantaget svårt att se:** grinden var byggd av samma
sessioner som skrev processen, och båda var korrekta var för sig. Förbudet
("riv aldrig före stämpeln", invariant c) hade en mekanism; slutläget
("rivningen ÄR steg 4") hade ingen, eftersom ingen ännu hade utfört det. En
grind kan inte testas mot ett tillstånd som inte finns än — den måste
KONSTRUERAS mot det.

**Formen som löste det, generaliserbar:** härled undantaget ur ett spår som
redan finns, i stället för att beskriva det med en handhållen lista. Här var
det stämpelns commit-SHA, som varje godkänt manifest redan bar: fanns filen
vid stämpeln och är borta nu, är frånvaron det föreskrivna slutläget. Fanns
den inte heller där, är sökvägen trasig. Alternativet — en mönsterlista över
"vad som räknas som prototyp" — hade burit två fel samtidigt: den accepterar
en sökväg som aldrig funnits, och den glider isär från verkligheten. Samma
klass som repot redan mätt två gånger i markörlistan (`TASK-192` döda
markörer, `TASK-287` saknade). Beslut och mätserie:
`ADR-102` § Updates 2026-08-22 (Rivna prototyp-källor).

**Relaterat, men inte samma sak:** fragmentet
`facit-kallor-ompekas-fore-stampeln.md` ger den operativa omvägen — peka om
`kallor` i flip-skivan medan manifestet ännu är skrivbart. Den räcker bara
när prototypfilen har en skarp EFTERTRÄDARE att peka på. Mätt 2026-08-22:
hem- och svep-familjerna har 6 av 6 källor som är rent prototyp-substrat utan
efterträdare, och segment-familjen 7 av 9 — där finns ingenting att peka om
till, och omvägen är strukturellt otillgänglig. En operativ omväg som bara
täcker halva fallmängden är inte en lösning på grindens lucka.
