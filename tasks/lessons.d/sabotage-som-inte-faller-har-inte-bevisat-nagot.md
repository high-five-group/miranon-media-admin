# Ett sabotage som inte fäller har inte bevisat att vakten är svag [UNIVERSAL]

**När du saboterar för att pröva en grind och den förblir grön — misstänk först
att du missade målet, inte att grinden är trasig.**

**Empiri (S91, 2026-07-28, `TASK-59.8` steg 3):** hermetik-vakten skulle prövas
genom att en handler togs bort ur normalläget. Två försök i rad gav grönt, och
båda gångerna var slutsatsen "vakten fäller inte" **fel**:

1. `get-persons` togs bort — men filen överskuggar den handlern lokalt, så
   normalläget den saknade användes aldrig. Sabotaget träffade en yta filen inte
   rörde.
2. `get-event-formats` togs bort — men den funktionen hör till event-*skapande*,
   inte till anmälan. Filen anropade den aldrig.

Först när **både** den delade handlern och filens egen överskuggning togs bort
blev anropet genuint omockat, och då fällde vakten omedelbart, med adressen
namngiven och rätt granne föreslagen.

**Varför felslutet är lätt att göra:** grönt utfall efter ett sabotage *ser ut*
som ett svar. Men det är ett svar på frågan "nåddes vakten?", inte på frågan
"fungerar vakten?". Skillnaden syns bara om man först belägger att saboterade
kodvägen faktiskt körs.

**Motmedlet:** belägg att målet används innan du sätter tilltro till utfallet.
Konkret — spåra att den borttagna vägen faktiskt anropas av det du kör (grep
efter anroparen, eller kör med instrumentering först). Ett negativt bevis kräver
samma stränghet som ett positivt.
