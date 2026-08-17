# Stämpeln låser formen — den skiljer inte form från rest

**Ett facit-lås (design-stämpel före promovering) bevarar troget ALLT som
står i den godkända ytan — inklusive prototyp-rester (noter, hjälptexter,
dev-copy) som aldrig var menade att promoveras. Stämpeln kan inte skilja
form från rest; det måste ett eget städ-pass göra FÖRE låsningen, annars
promoveras resterna bevisat pixeltroget och upptäcks först av mänsklig QA
i prod.**

Mätt 2026-08-17 (S104): Marcus stämplade prototypformen (`a40f3543`) och
promoveringen levererade den exakt — inklusive PrototypNot-texterna på
fyra ytor, en sök-hjälprad och en steg-instruktion som han sedan fann som
"fel" i prod-QA:n (249.8). Ingen mekanism brast: flippen var pixeltrogen
per kontrakt (ADR-102/103), rivningslistan tog växlar/rigg men noterna
stod inte på den, och QA-steget fångade resten — men en hel fix-skiva
(task-259, PR #1534) hade kunnat undvikas med ett rigg-städ-pass före
stämpeln.

Motmedel för nästa facit-låsning: ett explicit "vad i denna yta är REST,
inte FORM?"-pass före stämpeln — klassa varje not/hjälptext/dev-affordans
som (a) form som promoveras, (b) rigg som rivs (på rivningslistan), eller
(c) sanningsbärande interim (som "ingenting sparades"-noten, vilken ska
BESTÅ tills funktionen är riktig). Data-verklighets-fynd (154 namnlösa)
är däremot INTE stämpelns klass — de kan bara mänsklig QA mot full
prod-data fånga, och det är exakt vad 249.8-steget är till för.

Instanser: S104 sessionsdok Del 10 § Marcus QA; task-259-kortet;
Marcus fråga vid stängningen 2026-08-17 ("Vad var det jag stämplade?").
