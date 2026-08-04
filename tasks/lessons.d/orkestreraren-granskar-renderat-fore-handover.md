# Fragment — en grön grind mäter körbarhet, inte granskningsbarhet: orkestreraren granskar renderat resultat själv före handover

**[UNIVERSAL]**

**Fångad:** 2026-08-02–2026-08-03, Session 93, orkestreraren, hållplats-prototypens
kedja (`T99`-klassen).

**Vad som hände:** två skarpa instanser i samma session, båda fångade av
orkestrerarens EGEN granskning av renderat/beräknat resultat — ingen av dem av
någon automatisk grind (typecheck, lint, build, API-tester var gröna i båda
fallen).

1. **PR #603** (divergens-passet a/b/c på eventsidan, `?variant=`).
   Orkestreraren handövade till Marcus utan att själv ha sett det renderade
   resultatet. Marcus underkände utfallet ("slarvigt byggd") — berättigat på
   processgrund. Efterföljande egen okulär granskning bekräftade defekterna:
   proto-datat nådde bara två block (sidan motsade sig själv), Anteckningar
   var skrivbar trots att den inte skulle vara det, dubbel-etikettering,
   variant B saknade rail-form, eventinfo var inte avskild.
2. **PR #660** (byggkravs-vågen). `Betalningar`-blockets `slutMottagna`
   räknade strikt MOTTAGEN medan `slutSaknasAntal` räknade via `slutKlar` —
   två olika definitioner i samma block sedan `task-18.8` (2026-07-22).
   Orkestrerar-granskningen fällde en 3-vs-2-motsägelse i fixtur-läget — en
   semantisk motsägelse ingen grind kan uttrycka som ett predikat. Rättad i
   `betalningsSplit()`.

Åtgärden efter instans 1 blev en ny stående regel (PR #613): orkestreraren
granskar samtliga varianter i RENDERAD form före armering — inte bara efter
att koden kompilerar och testerna är gröna.

**Lärdomen:** en grön uppsättning grindar bevisar att koden KÖR — inte att
den producerar rätt renderat resultat eller rätt beräknat tal. Körbarhet och
granskningsbarhet är olika egenskaper, och ingen mängd automatiska grindar
ersätter att en människa (eller orkestreraren, som Marcus mänskliga motpart)
faktiskt TITTAR på det renderade/beräknade resultatet före handover. Släkt
med tråden `T87`s syskon `T99` (natt-bygge-skillens kärnfråga): "har du
granskat subagenternas output själv, eller litat på deras sammanfattning?" —
S93 gav den frågan två skarpa svar på en och samma session.

**Vad som INTE är gjort:** regeln ("granska renderat före handover") är
antecknad som stående praxis efter PR #613, men den är inte mekaniserad —
den vilar på omdöme i stunden, samma svaghetsklass ADR-043 kodade bort för
lifecycle. Ingen grind i repot verifierar i dag att en handover föregåtts av
en renderad granskning.

**Varför `[UNIVERSAL]`:** gäller varje agent-orkestrerar-arbetsflöde, oavsett
repo eller domän — CI-grindar mäter alltid en smal, mekaniskt uttryckbar
delmängd av "korrekt", aldrig hela ytan en människa skulle bedöma.
