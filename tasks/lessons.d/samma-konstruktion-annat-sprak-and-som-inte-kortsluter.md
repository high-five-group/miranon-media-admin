# En konstruktion som är korrekt i ett språk kan vara fel i ett annat med samma semantik på ytan

**[UNIVERSAL] `AND()` som inte kortsluter är ingen bugg — det är en annan
språkfamilj. En guard som är vattentät i JavaScript (`if (a === '') return`
före ett uttryck som kan kasta) är verkningslös i en Airtable-formel, där
alla argument evalueras oavsett.**

Instansen (`T168`, S110): `REGEX_EXTRACT` utan träff ger fel, inte blank.
I JavaScript var den första rättningen korrekt (`.match()` ger `null`); i
formeln evaluerades uttrycket även när tomt-guarden redan var falsk →
`#ERROR!`. Den form som ersatte den — kollaps-i-normaliseringen — valdes
inte för att den är elegantare utan för att den **inte har någon funktion
som kan fela** och därför inte behöver någon guard alls.

Regeln vid portering mellan ytor som ska bedöma likadant (här: formel och
skript): porta inte guarden — porta invarianten, och välj en konstruktion
som håller i det svagare språket. Det svagare språket sätter formen.
