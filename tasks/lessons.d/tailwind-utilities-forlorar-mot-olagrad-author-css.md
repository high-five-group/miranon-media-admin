# Tailwind-utilities förlorar mot olagrad author-CSS — oavsett specificitet

**[UNIVERSAL] En Tailwind v4-utility kan vara korrekt genererad och ha högre
specificitet än en global regel och ÄNDÅ förlora — utilities ligger i
`@layer utilities`, och olagrad author-CSS besegrar varje lagrad regel oavsett
specificitet.** Mätt 2026-08-29 (S113, `414101da`): `focus-visible:outline-none`
på menybehållaren genererades som `.focus-visible\:outline-none:focus-visible`
(0,2,0) men förlorade mot `base.css`:s `*:focus-visible` (0,1,0), eftersom den
senare är olagrad. Fixen bor därför i SAMMA olagrade fil som globalen (en
tredje selektor på den befintliga släckaren), inte som en klass på
komponenten. Regel: när en utility "inte tar" mot en global — kontrollera
lagret innan specificiteten; `getComputedStyle` avgör, inte klassnamnet.
