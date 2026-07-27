# En grön stubbsvit bevisar logiken, inte att den möter verkligheten

**En svit som passerar mot stubbar har bevisat att koden gör vad stubben
beskriver — inte att stubben beskriver verkligheten. Varje ändring i en stubbad
svit ska följas av skarpa körningar mot verkliga ID:n innan den anses bevisad.**
`[UNIVERSAL]`

**Empiri (S91, 2026-07-27):** `ci-wait`-fixens v1 passerade **alla** stubbfall
och föll **direkt** mot skarpt API. Stubben speglade inte det som var själva
poängen: att en aggregator failar som *följd* av det tillstånd testet skulle
klassa. Felet låg alltså inte i koden mot stubben, utan i att stubben var en
förenklad modell av precis den mekanik som skulle testas.

Formen är lömsk eftersom den ser ut som verifiering och ger ett grönt utfall att
peka på. Samma klass som [[verifiera-med-cis-exakta-kommando-inte-svagare-lokal-variant]]:
det gröna gällde en annan fråga än den som ställdes.

**Motmedlet** är inte att sluta stubba — stubbar är rätt för snabb iteration —
utan att aldrig låta en stubbad svit vara *sista* beviset. Ett skarpt anrop mot
ett verkligt ID är en tool-call och stänger frågan.
