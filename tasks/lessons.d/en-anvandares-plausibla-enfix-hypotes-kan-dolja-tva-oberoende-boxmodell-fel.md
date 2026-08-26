# En användares plausibla en-fix-hypotes kan dölja två oberoende box-modell-fel — mät båda separat innan du litar på hypotesen

**En icke-teknisk observatör som ser två visuella symptom på samma yta
("ramen är inte centrerad" + "loggan rör ramen") gissar naturligt att EN
orsak/EN fix löser båda. Box-modellen vet inget om den kopplingen: en
förälders POSITION på sidan (t.ex. `.sida--bekraftelse`s topp/botten-padding)
och en förälder-till-barn-marginalen INUTI samma ram (`.yttre-ram`s egen
padding-top) är två helt oberoende CSS-egenskaper. Att flytta hela ramen som
enhet ändrar INTE avståndet mellan ramens egen innerkant och dess första
flex-barn. Pröva hypotesen mot en faktisk mätning (ADR-086) innan du bygger
en enda fix på den.** `[UNIVERSAL]`

Instans (TASK-309.27, 2026-08-26): Marcus, skarp PDF i prod: *"Loggan ligger
i överkant nästan PÅ den blåa ramen OCH den blåa ramen är inte helt centrerad
på pappret, så om du flyttar upp den blåa ramen lite så den är centrerad så
löser det nog båda problemen."* DocRaptor/Prince-rendering mätt via
`pdftocairo -svg` (vektor-koordinater ur PDF:ens egen ring-path, ingen
pixelgissning): ramens topp/botten-marginal var verkligen asymmetrisk
(9,90mm/6,22mm) — MEN loggans topp och ramens innerkant låg på EXAKT samma
sidkoordinat oavsett den asymmetrin, eftersom `.yttre-ram`s egen
`padding-top` var 0 — en helt separat CSS-regel, opåverkad av var ramen
placeras på sidan. Två fixar krävdes: centrera ramen (7,89mm/7,89mm, samma
summa som förut — noll ny sidbrytningsrisk) OCH ge ramen egen `padding-top`
(2,92mm, speglar den redan existerande `padding-bottom`). Bokfört i PR:en som
en prövad-och-falsifierad premiss, inte tyst byggt på.

**Det generella:** en "det löser nog båda"-hypotes om en visuell yta är en
premiss att pröva (ADR-086), inte ett facit att implementera. Identifiera VILKEN
CSS-egenskap styr vartdera symptomet innan du väljer hur många fixar som
behövs — en förälders position på sin egen förälder och ett barns marginal
till SIN förälder är strukturellt oberoende axlar, även när de visuellt ser
ut att höra ihop.
