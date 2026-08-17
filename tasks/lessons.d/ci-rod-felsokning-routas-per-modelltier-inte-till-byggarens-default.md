# CI-röd-felsökning routas per modelltier — inte tillbaka till byggarens default

**När en byggagents PR blir CI-röd är felsökningen en ANNAN uppgiftsklass än
bygget. ADR-089:s roll-tabell sätter Opus@xhigh på "svår felsökning" — men
den intuitiva reflexen är att skicka rödan tillbaka till SAMMA agent som
byggde (Sonnet-default via frontmatter), vilket är default-drift, inte
routing. Klassa om uppgiften vid återkopplingen: rotorsakning av en
oväntat bred fällning (217/233-klassen) är felsöknings-raden, inte
implementations-raden.** [UNIVERSAL]-kandidat.

Mätt 2026-08-17 (S104 natt-orkestreringen): 249.5:s CI-röd (hermetik-
självtestet fällde 217/233 med `OmockadRequestError`) skickades tillbaka
till Sonnet-byggaren — utfallet blev korrekt (rotorsak + precedent-fix),
men Marcus-pushbacken i realtid ("svårare uppgifter till Opus, Sonnet-
agenter gör ibland ful-lösningar") pekade på att routingen aldrig
klassades om. Efterföljande svåra uppdrag (249.6-rivningen med referens-
re-låsning, 249.9, publik-utredningen, 259, K1) kördes Opus@xhigh med
bokförd avvikelse + sanity-check i slutrapporten — fem instanser, noll
tysta nedgraderingar.

Adversariell dubbelkoll av en Sonnet-fix är komplementet, inte
alternativet: 249.5-fixen friades genom diff-klassning mot fusk-klasserna
(tystad rigg, breda skip, försvagade assertioner, CI-villkorade hopp) plus
precedent-verifiering — den granskningen är orkestrerarens egen yta
oavsett vilken modell som byggde.

Instanser: S104 sessionsdok Del 10 § Vågorna + § Modell-routingen;
Marcus-pushback verbatim i S104-chatten 2026-08-17.
