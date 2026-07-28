# Samma etikett kan bära två olika planer i två dokument [UNIVERSAL]

**När ett arbetsnamn lever i flera dokument driver innebörden isär utan att
namnet gör det. Läs alla bärare innan du planerar mot etiketten — inte den du
råkar öppna.**

**Empiri (S91, 2026-07-28):** repot beskrev "T85 våg 3" på två ställen:

- **design-doket** (2026-07-23): run-ID-scoping **i Airtable**, samdesignad med
  bas-maximeringen — *"därefter avvecklas mutexen helt"*
- **`airtable-constraints.md` P26** (2026-07-27): per-körning-instansierad
  **Postgres**, vid Fas E — *"När det är på plats avvecklas den globala mutexen
  (T85 våg 3)"*

Samma etikett, två mekanismer, två tidpunkter. Och ett **tredje** dokument hade
sedan avgjort sakfrågan mot båda: `P4`:s andra manifestation slår fast att
Airtables 5 req/s-tak är delat per bas, vilket gör parallellisering verkningslös
*"även med perfekt dataområdes-isolering"*. Run-scoping löser alltså
kollisionerna men köper ingen genomströmning — vilket ingen av de två planerna
hade tagit höjd för.

**Hur det upptäcktes:** inte genom läsning, utan genom att Marcus invände mot en
mening i ett svar (*"vad har basmaximeringen med klonbarheten att göra?"*).
Invändningen var riktad mot formuleringen; den avslöjade att sammanblandningen
fanns i repots egna dokument.

**Varför det uppstår:** ett arbetsnamn mintas i ett designdokument och citeras
sedan i ett annat, av en annan författare vid en annan tidpunkt. Citatet ärver
etiketten men inte innehållet, och ingen grind jämför dem — en länkkontroll ser
att referensen finns, aldrig att den betyder samma sak.

**Motmedlet:** vid planering mot ett arbetsnamn, `grep` efter etiketten i hela
repot och läs **varje** träff innan arbetet formas. Divergerar bärarna: skriv om
den styrande så att den blir entydig, och lämna en pekare från de övriga.
