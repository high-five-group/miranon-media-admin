# En subagents returväg dör med sin förälder

**Dör den agent som spawnade en subagent innan barnet blir klart, har barnets
rapport ingen mottagare. Den landar hos orkestreraren — eller ingenstans.
Arbetet är utfört, resultatet är hemlöst.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-30/31):** ett research-pass med mandat att fan-outa
spawnade fem subagenter. Passets egen tur dödades av en API-gräns **två gånger**.
Samtliga fem barnrapporter — tillsammans ~500 000 tokens arbete, inklusive
passets enskilt viktigaste fynd — levererades till **orkestreraren** i stället
för till föräldern som beställt dem.

En av dem sade det rakt ut i sin egen rapport: *"SendMessage kunde inte nå
`research-pass` ('No agent named research-pass is reachable'). Rapporten
levereras därför här, i mitt textutdata."* Kanalen var alltså mätbart bruten,
inte tyst.

Orkestreraren fick vidarebefordra allt fem gånger för hand. Hade den inte råkat
läsa notifieringarna vore fynden förlorade trots att arbetet var utfört och
korrekt.

**Varför det är samma klass som väntan på en signal som aldrig kommer:** en
väntande part antar att ett resultat ska levereras längs en kanal som inte
överlever. Skillnaden är riktningen — här är det *avsändaren* som blir hemlös
i stället för mottagaren som väntar förgäves. Passet som drabbades utredde
just den klassen, och konstaterade om sig självt att felet inträffade **en nivå
ned, under själva utredningen**.

**Formen, i två led.**

1. **Låt barnet skriva till disk när resultatet är dyrt att återskapa.** En fil
   överlever att både förälder och barn dör; ett returvärde gör det inte.
   Scratchpad räcker för ren relä — men filen ska namnges så att den går att
   hitta utan barnets rapport.
2. **Som orkestrerare: läs varje föräldralös rapport som om den vore beställd av
   dig.** Notifieringen är den enda kvarvarande kanalen, och den passerar bara
   en gång.

**Motsatsen till åtgärden är inte att avstå från fan-out.** Parallell sökning är
rätt form för breda frågor; det som saknas är att leveransen inte får hänga på
att beställaren fortfarande lever.

**Skärpningen mot närliggande:**
[[bakgrundsprocess-utan-harness-sparning-notifierar-aldrig]] handlar om en
process harnesset aldrig kände till. Här kände harnesset till barnet, körde det
till slut, och levererade — men adressaten fanns inte längre.
