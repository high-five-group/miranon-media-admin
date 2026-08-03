---
owner: marcus803
updated: 2026-08-03
review_by: 2027-02-03
status: draft
---

# Inbjudnings-/aktiveringssidor hos branschledare — mönster och konkreta designval (2026-08-03)

> **Proveniens:** avgränsat research-pass (marcus-system:research). Frågan:
> hur ser inbjudnings-/aktiveringssidor faktiskt ut hos branschledande
> produkter 2026, och vilka konkreta designval kan tas med in i
> `AcceptVariantB` (`src/components/dev/prototyp-auth/VariantB.tsx`)?
> Prototypen är läst för kontext men behandlad som kastbar — inget facit.
> Ingen kod rörd, inga paket installerade, inga git-operationer utanför
> denna fil. Alla mätningar (ordräkning, DOM-struktur, källkod) är gjorda
> mot **live-läge/källkod 2026-08-03**, inte mot minnesbild eller antagande.

## Kort svar

Branschledarna löser detta med **radikalt mindre text och en enda
rubriknivå** än vår nuvarande prototyp. Sex mätta live-sidor (Linear,
Vercel, Figma, Notion, Slack, Stripe) har i snitt **~17 ord** löpande
prosa; vår prototyp har **~95** — en faktor 5–6×. Fem av sex mätta sidor
har **exakt en rubrik** (H1), ingen H2; den enda som har två rubriker
(Notion) låter dem bära *olika* information i stället för att båda säga
"du är inbjuden" på olika sätt. Ingen av de sex mätta sidorna använder
foto av människor i själva formulär-ytan. GitLabs faktiska, publika
produktionskällkod för exakt vårt scenario (ny användare accepterar en
inbjudan och sätter lösenord) visar **ett enda lösenordsfält** (ingen
bekräftelse-duplicering) och en **förifylld, oredigerbar** e-postadress
när invite-token finns — samma mönster ADR-092 redan valt åt oss. NN/g:s
forskning säger explicit detsamma om lösenordsfältet: ett fält, inte två.

## 1. Layouten

**Mätt, live, 2026-08-03** (Chrome DevTools MCP, verklig DOM/a11y-träd,
ingen captcha-lösning eller autentisering krävdes för dessa sex):

| Produkt | URL mätt | Layout | Spalter |
|---|---|---|---|
| Linear | `linear.app/signup` | Enspalt, centrerat kort. Ingen bild, ingen sidopanel. | 1 |
| Vercel | `vercel.com/signup` | Enspalt, centrerat. Kundlogotyp-rad längst ned (inte i formuläret). | 1 |
| Figma | `figma.com/signup` | Enspalt, centrerat. Endast logotyp + rubrik + ett fält. | 1 |
| Notion | `app.notion.com/signup` | Enspalt, centrerat. | 1 |
| Slack | `slack.com/get-started` | Enspalt, centrerat, wizard (ett fält per skärm). | 1 |
| Stripe | `dashboard.stripe.com/register` | Enspalt, centrerat, alla fält på en gång. | 1 |

**Alla sex mätta är enspalt centrerat.** Ingen av dem har en bred
kontext-/varumärkes-spalt av den typ vår `KontextSpalt` bygger. Det är
den starkaste enskilda observationen i detta pass, och den är i
**spänning** med vår redan konvergerade tvåspalts-hållning
(`TvaSpalter`/`KontextSpalt` — filens kommentar kallar layouten
"Marcus facit" från konvergens-omgång 2). Jag lägger fram mätningen
öppet; den upphäver inget beslut på egen hand.

Ett viktigt förbehåll: samtliga sex är **signup**-sidor (skapa nytt
konto), inte **invite-accept**-sidor (acceptera en existerande
inbjudan från ett team). Jag nådde ingen live invite-accept-skärm för
något av dessa varumärken utan en verklig invite-token — se
§ Vad jag inte kunde belägga. Layout-mätningen ovan är alltså en
**närmaste tillgängliga proxy**, inte identisk med vårt exakta scenario.

GitLabs källkod (§ 6 nedan) visar dock att **för nya användare är
invite-accept-flödet OCH signup-flödet bokstavligen samma vy** —
`InvitesController` omdirigerar en oautentiserad ny användare rakt till
`new_user_registration_path` med `invite_email` som parameter
([`app/controllers/invites_controller.rb`](https://gitlab.com/gitlab-org/gitlab/-/blob/master/app/controllers/invites_controller.rb),
kommentar: *"New users auto-accept pending invitations during
registration"*). Det stärker proxy-antagandet snarare än att svaga det:
åtminstone hos GitLab är signup-sidan facto invite-accept-sidan för en
ny mottagare.

**Vad GOV.UK Design System säger om spalt-antal, som princip snarare än
skärmdump:** mönstret "one thing per page" motiveras explicit med att
det *"low-confidence users find them easier to use"*, *"work well on
mobile devices"* och är *"better at handling things like errors,
branches, loops and saving progress"*
([designnotes.blog.gov.uk, "One thing per page", 2015-07-03](https://designnotes.blog.gov.uk/2015/07/03/one-thing-per-page/)).
Detta gäller flersidiga formulär snarare än enkelspalt-kontra-tvåspalt
direkt, men underliggande princip (minimera vad ögat måste bearbeta
innan handling) pekar åt samma håll som mätningen: en tung sidopanel
konkurrerar om uppmärksamheten med den enda uppgift sidan finns för.

## 2. Bild eller ingen bild

**Mätt:** ingen av de sex live-sidorna använder foto eller illustration
av människor i formulär-ytan. Vercel har kundlogotyper (Ebay, Stripe)
i en fotnots-rad under formuläret — social proof, inte varumärkes-bild.
Figma, Linear, Slack, Notion, Stripe har noll bilder i a11y-trädet
utöver den egna logotypen.

**Vad bär den visuella tyngden i stället, mätt:** logotyp + en kort
rubrik + OAuth-knappar (Google/GitHub/Apple/SSO) i tydlig visuell
hierarki. Whitespace och knapp-storlek gör jobbet som en bild annars
skulle göra.

**GOV.UK Design System, ordagrant, om fotografi:**

> "Use photography when it's important to show a lifelike representation
> of something."
>
> "Do not use photography to represent abstract concepts, such as to
> convey an impression or emotion to the user."
>
> "Avoid using generic stock photography in your service."
>
> "Avoid using images for unnecessary decoration. Only use images if
> there's a real user need. Services usually work best without relying
> on images. Focus on writing clear, simple content for your service
> first."
>
> — [design-system.service.gov.uk/styles/images](https://design-system.service.gov.uk/styles/images/)

Vårt planerade foto av Roger och Lotta ("`roger-och-lotta.webp`") är
enligt detta test ett gränsfall: det representerar inte ett abstrakt
begrepp och är inte stock-foto (det är de verkliga personerna bakom
avsändaren), men det är inte heller *"a lifelike representation of
something [the user needs to see to complete the task]"* i strikt
GOV.UK-mening — det är ett varumärkes-/tillits-signal-foto, en kategori
GOV.UK inte adresserar direkt eftersom deras tjänster inte har ett
företagsvarumärke att bygga tillit kring på samma sätt en liten,
personlig admin-app har. Jag drar ingen slutsats åt något håll av detta
— det är en ärlig gränsdragning, inte ett facit.

**Shopify Polaris**, som kontrast, använder illustration aktivt men
**enbart i empty-states efter inloggning** (introduktion till en
specifik yta man just öppnat första gången), inte på
konto-/lösenords-skärmen: *"Merchants see an empty state illustration
the first time they access a new part of the experience... Illustrations
frame what each task is for"*
([polaris-react.shopify.com/components/layout-and-structure/empty-state](https://polaris-react.shopify.com/components/layout-and-structure/empty-state)).
Mönstret hos Polaris är alltså: bild används för att förklara en FUNKTION
man ska använda, inte för att hälsa välkommen eller bekräfta en identitet.

## 3. Rubrik-hierarkin — den skarpaste frågan

**Mätt, exakt rubrikstruktur, live 2026-08-03:**

| Produkt | H1 | H2 | Kommentar |
|---|---|---|---|
| Linear | "Create your workspace" | — | Uppgifts-rubrik, ingen hälsning |
| Vercel | "Your first deploy is just a sign-up away." | — | Nytto-löfte, ingen hälsning |
| Figma | "Welcome to Figma" | — | Generisk hälsning (mot varumärket, inte mot personen) |
| Slack | "First, enter your email" | — | Ren instruktion |
| Notion | "Notion: din AI-arbetsyta." | "Registrera dig med din e-postadress för arbetet" | **Enda sidan med två rubriknivåer** |
| Stripe | "Skapa ditt Stripe-konto nu" (ej semantiskt märkt som rubrik i a11y-trädet) | — | — |

**Fem av sex har exakt EN rubriknivå.** Notion är undantaget — men
skillnaden mot vår "kaka på kaka" är strukturell, inte kosmetisk: H1
("Notion: din AI-arbetsyta") är ett **varumärkeslöfte** (vad Notion ÄR),
H2 ("Registrera dig med din e-postadress för arbetet") är den
**faktiska uppgiften** (vad du ska göra just nu). De två rubrikerna
bär olika innehåll — ingen av dem är en omformulering av den andra.

Vår nuvarande H1 ("Välkommen, Lotta") och H2 ("Marcus Johansson har
bjudit in dig till Miranon Media Admin") bär **samma faktum två gånger**:
H1 signalerar implicit "du är inbjuden" (varför annars en personlig
hälsning på en aktiveringssida), och H2 säger det explicit. Det är den
strukturella orsaken till att det läser som redundant — inte en
typografisk fråga (storlek/vikt) utan en informations-arkitektur-fråga:
två rubriker som konkurrerar om att kommunicera samma sak.

**Vad noll av de sex mätta sidorna gör:** ingen av dem hälsar med
mottagarens förnamn i rubriken. "Welcome to Figma" hälsar mot
*varumärket*, inte mot personen. Detta är ett **frånvaro-fynd** (se
§ 6) värt att ta på allvar: personlig namn-hälsning i H1 är inte det
etablerade mönstret hos någon av de mätta produkterna, trots att
flera av dem (Slack, Notion) vet mottagarens namn vid det här laget i
andra flöden.

**GitLabs faktiska produktionsmall** (`app/views/devise/registrations/
new.html.haml`, hämtad via `raw`-vy 2026-08-03) sätter ingen H1 i
formulär-partialen själv — sid-titeln kommer från Rails
`page_title`-direktivet ("Sign up"), och synligt i formuläret är i
stället bara fältgrupperna. Ingen hälsning, ingen andra rubriknivå.

## 4. Hur mycket text

**Metod:** jag räknade löpande prosa (rubriker + hjälptexter +
förklarande meningar) och exkluderade fältetiketter, knapp-text och
universellt cookie-/juridik-boilerplate (som är i praktiken identiskt
över alla produkter och inte en designvariabel). Räkningen är gjord för
hand mot den faktiska texten i respektive a11y-träd/källkod, ord för
ord.

| Sida | Löpande prosa (ord) |
|---|---|
| Figma | 3 |
| Stripe | 8 |
| Slack | 14 |
| Vercel | 20 |
| Linear | 21 |
| Notion | 35 |
| **Snitt (6 sidor)** | **~17** |
| **Vår `AcceptVariantB` (samma metod)** | **~95** |

Vår prototyps ordräkning i detalj (kontext-spalt + formulär-spalt,
exkl. fältetiketter och knapp-text):

- H1 "Välkommen, Lotta" — 2
- H2 "Marcus Johansson har bjudit in dig till Miranon Media Admin" — 9
- Brödtext om roll — 14
- Punktlista (3 rader) — 25
- Fotnot (länk-utgång) — 14
- Formulärets egen H2 "Sätt ditt lösenord" + brödtext — 8
- E-post-beskrivning — 12
- Lösenords-beskrivning — 11

Summa: 95 ord. Även Notion, den enskilt "pratigaste" av de sex mätta
(35 ord), ligger under **hälften** av vad vi har. Det är den mätbara
kärnan i upplevelsen "text överallt, känns som kaos" — det är inte en
subjektiv känsla, det är en faktor 2,7–32× mer text än var och en av de
sex jämförda sidorna.

## 5. Lösenordssättningen

### Vad NN/g:s forskning säger, ordagrant

**Antal fält — ETT, inte två:**

> "Do not repeat fields (e.g., two password fields, two email fields).
> Typing passwords is painful enough; typing them twice is twice as
> painful."
>
> — [nngroup.com, "A Checklist for Registration and Login Forms on Mobile"](https://www.nngroup.com/articles/checklist-registration-login/)

**Krav ska synas HELA tiden fältet är i fokus, inte bakom en länk eller
i placeholder:**

> "State the password requirements, and make sure that the user can see
> them the entire time that the field is selected."
>
> — [nngroup.com, "Password Creation: 3 Ways To Make It Easier"](https://www.nngroup.com/articles/password-creation/)

**Krav ska avslöjas UPPFRONT, inte upptäckas via fel:**

> "Disclose password constraints upfront. Nothing is more annoying than
> having to guess what the site's password requirements might be, and
> later discovering that you guessed wrong."
>
> — samma källa

**Styrke-mätare, inte bara en kryssad kravlista:**

> "Display a strength meter. It will give people real-time feedback
> about the passwords they choose and prompt them to create stronger
> passwords." Forskningsreferens: Egelman et al. (2013) visade att
> *"strength meters motivated users to create stronger passwords."*
>
> — samma källa

**Live/inline-validering: JA för lösenord specifikt, NEJ som
default-beteende för vanliga fält:**

> "[F]or more complex fields, such as those requiring a new password...
> instant inline validation (which appears as the field value is being
> typed) will prevent users from guessing or checking multiple times if
> what they've entered meets the system's guidelines."
>
> För vanliga fält gäller motsatsen: "avoid showing an error until the
> user has finished with the field and moved to the next field."
>
> — [nngroup.com, "10 Design Guidelines for Reporting Errors in Forms"](https://www.nngroup.com/articles/errors-forms-design-guidelines/)

### Vad GOV.UK Design System säger

> "set a minimum length of at least 8 characters" / "do not set a
> maximum length" / "explain any restrictions to users" / "do not allow
> commonly used passwords"
>
> — [design-system.service.gov.uk/patterns/passwords](https://design-system.service.gov.uk/patterns/passwords/)

GOV.UK är **öppet obeslutna** om live-validering hjälper eller inte:
*"More research is needed into whether using inline validation is a
good way of helping users create secure passwords"* — samma sida. Det
är värt att ta med som en **kalibrering**, inte bara NN/g:s mer
kategoriska hållning: den auktoritativa källa som ligger närmast vår
egen designtradition säger uttryckligen att frågan inte är stängd.

### Vad GitLabs faktiska produktionskod gör (2026-08-03, `master`-grenen)

Detta är det närmaste vi kommer ett verkligt, skarpt, öppen källkod
"acceptera inbjudan → sätt lösenord"-flöde:

**Ett enda lösenordsfält, ingen bekräftelse-duplicering**
([`app/views/devise/registrations/_password_input.html.haml`](https://gitlab.com/gitlab-org/gitlab/-/blob/master/app/views/devise/registrations/_password_input.html.haml)):

```haml
- title = safe_format(s_('SignUp|Minimum length is %{minimum_password_length} characters.'),
  minimum_password_length: @minimum_password_length)
= local_assigns.fetch(:form).label :password, _('Password')
%input.form-control.gl-form-input.js-password{ ... }
%p.gl-field-hint-valid.gl-text-subtle
  = title
```

Ett fält, en alltid-synlig hjälptext under fältet ("Minimum length is 8
characters."), ingen andra "bekräfta lösenord"-input.

**Förifylld, oredigerbar e-post när en invite-token finns**
([`app/views/devise/registrations/_signup_box_form.html.haml`](https://gitlab.com/gitlab-org/gitlab/-/blob/master/app/views/devise/registrations/_signup_box_form.html.haml)):

```haml
- if @invite_email.present?
  .form-group
    = f.label :email, _('Email'), class: 'gl-block'
    .gl-font-bold{ 'data-testid': 'invite-email' }
      = @invite_email
    = f.hidden_field :email, value: @invite_email
```

E-postadressen visas som fet, icke-redigerbar text (inte ens ett
`readonly`-inputfält — en ren textnod) plus ett dolt formulärfält.
Detta är exakt samma princip som ADR-092 beslut 2 redan valt åt oss
(förifylld och oredigerbar) — GitLab är oberoende precedens för samma
val, inte en källa vi kopierat från.

## 6. Vad som INTE finns — frånvaro-fynd

Detta är minst lika informativt som det som finns:

1. **Ingen av de sex mätta sidorna hälsar med mottagarens förnamn i
   rubriken.** Se § 3. Personlig namn-hälsning i H1 är inte det
   etablerade mönstret — även produkter som vet användarens namn vid
   det laget (Slack samlar namn i ett senare steg, Notion likaså)
   väljer en uppgifts- eller varumärkes-rubrik i stället.
2. **Ingen bekräftelse-lösenordsfält hos NN/g:s rekommendation eller i
   GitLabs faktiska kod.** Vår `bekrafta`-input (rad 428–438 i
   `VariantB.tsx`) är ett mönster branschledarna aktivt avråder ifrån
   respektive inte bygger.
3. **Ingen av de sex sidorna använder en punktlista av "vad som händer
   nu"-typ** (jämför vår `KontextRad`-lista med tre punkter). De
   kommunicerar nästa steg via en enda knapp-etikett i stället för
   uppräknad text.
4. **Ingen captcha eller extra friktion mot en redan inbjuden,
   känd mottagare** — varken hos NN/g:s rekommendationer, GOV.UK
   ("Do not use CAPTCHA" i `create-accounts`-mönstret) eller i de
   mätta sidornas synliga DOM (Stripes captcha-liknande iovation-iframe
   är en bakgrunds-riskmotor, inte en synlig utmaning för användaren).
5. **Ingen av de mätta sidorna visar en explicit utgångstid för länken
   i brödtexten** på själva sidan (vår fotnot "Länken gäller i 24
   timmar..."). Det kan vara rätt för oss ändå (engångslänkar är ett
   annat riskläge än lösenordsåterställning), men det är inte ett
   kopierat branschmönster — det är en egen, motiverad avvikelse.

## Dom

Tre saker är mätbart sanna och bör vägleda arbetet, i fallande styrka:

1. **Textmängden är det tydligaste, mest åtgärdbara problemet.**
   Faktor 2,7–32× mer löpande prosa än varje enskild mätt jämförelse-
   produkt är inte en smaksak — det är en avvikelse från varje punkt i
   urvalet, inte bara snittet.
2. **Rubrik-redundansen har en namngiven orsak, inte bara en känsla av
   tyngd:** H1 och H2 kommunicerar samma faktum (att en inbjudan skett)
   på två sätt. Lösningen är att ge dem olika jobb (Notion-mönstret),
   inte att bara krympa typografin.
3. **Lösenordsfältets nuvarande form (två fält, bekräftelse-duplicering)
   saknar stöd** i både forskningen (NN/g, explicit avrådan) och den
   enda faktiska produktionskälla jag kunde granska rakt av (GitLab).

Layout (enspalt vs. tvåspalt) och bildfrågan är mätbart i majoritet för
enspalt/ingen-bild bland de sex jämförda — men urvalet är **signup**,
inte **invite-accept**, och vår tvåspalts-hållning med foto är redan ett
konvergerat Marcus-beslut från en tidigare omgång. Jag rapporterar
spänningen öppet (§ 1–2) utan att döma den — det är utanför detta
passets mandat att ändra ett redan fattat designbeslut.

## Vad jag inte kunde belägga

- **Ingen verklig invite-accept-skärm nåddes för något varumärke.**
  Alla sex mätningar i § 1–4 är signup-sidor (nytt konto), inte
  accept-en-inbjudan-sidor — jag har ingen giltig invite-token för
  något av dessa produkter och kan inte generera en utan att skapa
  konton/team på riktigt, vilket vore utanför uppdraget. GitLabs
  källkod (§ 6) är den enda platsen där jag kan visa, med kod snarare
  än gissning, att invite-accept och signup är samma vy för en ny
  användare — men det är belagt för GitLab specifikt, inte generaliserat
  till Linear/Vercel/Notion/Slack/Stripe/Figma.
- **GitHubs signup- och invite-sidor gick inte att nå.** `github.com/
  signup` blockerade den skarpa browser-sessionen med en DataDome-
  captcha ("Vi vill försäkra oss om att vi vänder oss till dig och inte
  till en robot") vid mätningsförsöket 2026-08-03. Jag löste inte
  captchan (skulle kräva att kringgå ett anti-bot-system, utanför vad
  som är rimligt för ett research-pass) och har därför noll direkta
  mätdata för GitHub trots att det var ett av de föreslagna urvalen.
- **GOV.UK One Login** (`signin.account.gov.uk`), den enda *live*
  GOV.UK-produkten med en riktig kontoskapande-skärm, svarade med
  "Sorry, you cannot access GOV.UK One Login from this page" vid direkt
  navigering — sidan kräver troligen en deep-link-parameter från
  en anropande tjänst. Jag har därför bara design-system-**mönstret**
  (auktoritativt i sig, men inte en live-implementation) för GOV.UK,
  inte en skarp skärm.
- **Basecamp** (`basecamp.com/signup`) omdirigerade till en
  pris-/marknadsförings-sida snarare än ett faktiskt formulär vid
  mätningsförsöket — Basecamps signup-flöde kräver till synes ett
  betalnings-/plan-val först. Inget mätdata för Basecamp i detta pass.
- **Height** uteslöts medvetet ur urvalet: bolaget meddelade själva
  (X/Twitter, @height_app) att produkten stängde ner 2025-09-24, ~11
  månader före detta pass. Att mäta en nedlagd produkt vore att
  rapportera ett dött mönster som levande.
- **Atlassian Design System** gav bara generisk empty-state-vägledning
  (inte kontospecifik) i den tid jag hade — jag nådde ingen dedikerad
  Atlassian-sida för konto-/lösenordsskapande och drar därför inga
  Atlassian-specifika slutsatser om rubrik-hierarki eller textmängd.
- **Om personlig namn-hälsning i H1 aktivt SKADAR eller HJÄLPER
  konvertering/förtroende** är obelagt åt något håll i detta pass —
  frånvaron hos de sex mätta produkterna (§ 6, punkt 1) är ett mönster,
  inte ett kausalt bevisat resultat. Jag hittade ingen NN/g- eller
  GOV.UK-källa som direkt uttalar sig om personlig namn-hälsning i
  rubriker på aktiveringssidor specifikt.

## Konkreta rekommendationer för vår inbjudnings-sida

Numrerade, kod-adresserbara. Varje post pekar mot en konkret plats i
`src/components/dev/prototyp-auth/VariantB.tsx` (rader avser filens
lydelse vid detta passets läsning, 2026-08-03) — eftersom prototypen är
kastbar kommer radnumren inte att stämma exakt i den nyskrivna
implementationen (`TASK-127.3`/`TASK-127.6`), men strukturen/komponent-
namnen gör.

1. **Radbryt H1 och H2 så de bär olika information, Notion-mönstret.**
   Behåll en personlig eller varumärkes-rubrik som H1, men gör H2 (eller
   en vanlig `<p>` — se punkt 2) till den EXPLICITA uppgiften i stället
   för en omformulering av "du är inbjuden". Konkret: byt `AcceptVariantB`
   rad 366–369 från
   `<h1>Välkommen, {namn}</h1><h2>{avsändare} har bjudit in dig...</h2>`
   till `<h1>Välkommen, {namn}</h1>` + en rad som bär den FAKTISKA
   uppgiften: t.ex. "Sätt ett lösenord för att komma igång" — inte
   vem som bjöd in, det hör hemma i brödtexten/fotnoten, inte i en
   rubrik.

2. **Nedgradera den nuvarande H2 till brödtext (`<p>`), inte en andra
   rubriknivå.** Fem av sex mätta sidor har exakt EN rubrik. Om
   avsändarens namn ska synas (rimligt — det är kontext mottagaren
   saknar) hör det hemma som en mening i brödtexten
   ("`{avsändare}` bjöd in dig — sätt ett lösenord så är du igång."),
   inte som en självständig rubrik som konkurrerar med H1 om
   uppmärksamheten.

3. **Skär bort minst hälften av den löpande prosan mot ett mätt mål:
   sikta på 30–40 ord, inte 95.** Konkret, i prioritetsordning för vad
   som stryks eller slås ihop:
   - Slå ihop rubrik-raden (punkt 1–2 ovan) — sparar ~9 ord direkt.
   - Skär `KontextRad`-punktlistan (rad 375–381) från tre punkter till
     högst en, eller ta bort den helt. Ingen av de sex mätta sidorna
     använder en "vad som händer nu"-punktlista; en knapp-etikett
     ("Skapa mitt konto") bär redan den informationen.
     Nuvarande tre punkter (25 ord) väger tyngst i räkningen i § 4.
   - Slå ihop formulär-spaltens egna rubrik+brödtext (rad 386–389,
     "Sätt ditt lösenord" / "Så är du igång direkt.") med
     kontext-spaltens rubrik-rad — de säger i praktiken samma sak två
     gånger till, i en TREDJE plats på sidan.

4. **Ta bort det andra lösenordsfältet (`bekrafta`, rad 336–437).**
   Både NN/g:s explicita rekommendation (§ 5) och GitLabs faktiska
   produktionskod (§ 5) använder ett enda fält. Ersätt med ett
   visa/dölj-lösenord-alternativ (redan etablerat branschmönster, se
   NN/g "Show the Input") så mottagaren kan verifiera sin inmatning
   utan en andra skriv-omgång. Detta enkelspårar också valideringslogiken
   (`langdOk`/`matchar`, rad 340–341) till en enda regel.

5. **Behåll den förifyllda, oredigerbara e-postadressen (rad 400–408)
   — den är redan rätt.** GitLabs kod visar oberoende precedens för
   exakt samma mönster (fet text + dolt fält, § 5). Ingen ändring
   rekommenderas här; det är en bekräftelse, inte ett fynd som kräver
   åtgärd.

6. **Gör lösenords-kraven alltid synliga under fältet, inte bara vid
   fel (rad 425 gör redan detta rätt — behåll).** `description="Minst
   8 tecken..."` under `Input`-primitiven matchar NN/g:s "synligt hela
   tiden fältet är valt" och GitLabs alltid-synliga
   `.gl-field-hint-valid`-hint. Enda ändringen: överväg att INTE visa
   den generiska felboxen ("Något stämmer inte", rad 440–448) för
   längd-kravet specifikt — NN/g rekommenderar disclose-upfront snarare
   än fel-efter-submit för just detta krav, så ett submit-fel om
   längden är den enda platsen där vi motsäger egen redan-god disclosure
   ovanför.

7. **Överväg en lätt live-validering av lösenordslängd (inte bara
   matchning), eftersom vi tar bort bekräftelsefältet (punkt 4).**
   NN/g rekommenderar explicit inline-validering för just lösenordsfält
   (§ 5) till skillnad från vanliga fält. GOV.UK är öppet obeslutna om
   nyttan (§ 5) — så detta ska vägas som "sannolikt värt det, inte en
   garanterad vinst", och kan landa som en enkel checkmark/state-ändring
   på hjälptexten när `langdOk` blir sant, utan att bygga en
   styrke-mätare (som varken ADR-093 eller detta pass ger stöd för
   utöver längd-golvet).

8. **Rör inte tvåspalts-layouten eller foto-halvan baserat på detta
   pass ensamt.** Mätningen i § 1–2 pekar mot enspalt/ingen-bild, men
   urvalet är signup snarare än invite-accept, och layouten är redan
   ett konvergerat beslut från en tidigare Marcus-omgång. Om layouten
   ska omprövas hör det till en egen grillning/konvergens-runda, inte
   till en tyst ändring under detta passets täckmantel — men ta med
   § 1–2 som underlag om den frågan kommer upp igen.

9. **Fotnoten om länkens giltighetstid (rad 358–363) är en motiverad
   egen avvikelse — behåll den, men flytta den inte upp i huvudflödet.**
   Ingen av de mätta sidorna visar en sådan text i brödtexten, men vårt
   scenario (engångs-aktiveringslänk, inte lösenordsåterställning) har
   ett annat riskläge. Nuvarande placering (diskret fotnot i
   kontext-spalten, inte i formulär-flödet) är redan rätt avvägning —
   den konkurrerar inte med huvuduppgiften.

## Källförteckning

**Auktoritativa förstapartskällor:**

- [GOV.UK Design System — Passwords](https://design-system.service.gov.uk/patterns/passwords/)
- [GOV.UK Design System — Create accounts](https://design-system.service.gov.uk/patterns/create-accounts/)
- [GOV.UK Design System — Images](https://design-system.service.gov.uk/styles/images/)
- [GOV.UK Design System backlog — Password input component](https://components.publishing.service.gov.uk/component-guide/password_input)
- [designnotes.blog.gov.uk — "One thing per page" (2015-07-03)](https://designnotes.blog.gov.uk/2015/07/03/one-thing-per-page/)
- [Nielsen Norman Group — Password Creation: 3 Ways To Make It Easier](https://www.nngroup.com/articles/password-creation/)
- [Nielsen Norman Group — A Checklist for Registration and Login Forms on Mobile](https://www.nngroup.com/articles/checklist-registration-login/)
- [Nielsen Norman Group — 10 Design Guidelines for Reporting Errors in Forms](https://www.nngroup.com/articles/errors-forms-design-guidelines/)
- [Nielsen Norman Group — Disclosing Password Constraints in the UI (video)](https://www.nngroup.com/videos/disclosing-password-constraints/)
- GitLab (öppen källkod, `master`-grenen, hämtad 2026-08-03):
  - [`app/controllers/invites_controller.rb`](https://gitlab.com/gitlab-org/gitlab/-/blob/master/app/controllers/invites_controller.rb)
  - [`app/views/devise/registrations/new.html.haml`](https://gitlab.com/gitlab-org/gitlab/-/blob/master/app/views/devise/registrations/new.html.haml)
  - [`app/views/devise/registrations/_signup_box_form.html.haml`](https://gitlab.com/gitlab-org/gitlab/-/blob/master/app/views/devise/registrations/_signup_box_form.html.haml)
  - [`app/views/devise/registrations/_password_input.html.haml`](https://gitlab.com/gitlab-org/gitlab/-/blob/master/app/views/devise/registrations/_password_input.html.haml)
- [Shopify Polaris — Empty state](https://polaris-react.shopify.com/components/layout-and-structure/empty-state)
- [IBM Carbon Design System — Login pattern](https://carbondesignsystem.com/patterns/login-pattern/)

**Live produkt-mätningar (Chrome DevTools MCP, a11y-snapshot, 2026-08-03):**

- [linear.app/signup](https://linear.app/signup)
- [vercel.com/signup](https://vercel.com/signup)
- [figma.com/signup](https://www.figma.com/signup)
- [app.notion.com/signup](https://www.notion.com/signup)
- [slack.com/get-started](https://slack.com/get-started)
- [dashboard.stripe.com/register](https://dashboard.stripe.com/register)

**Sekundära/tertiära källor (lägre vikt, använda för orientering, inte
för bärande påståenden):**

- [Atlassian Design — Empty state component](https://atlassian.design/components/empty-state)
- [Height (@height_app) shutdown announcement, X/Twitter](https://x.com/height_app/status/1903820182557999555)

**Internt refererat (kontext, inte extern källa):**

- `src/components/dev/prototyp-auth/VariantB.tsx` — prototypen detta
  passet svarar in i
- `docs/decisions/ADR-092-invite-identitetsmodellen-anvandarinbjudan.md` —
  beslut 2 (förifylld/oredigerbar e-post), bekräftat kompatibelt med
  GitLab-precedensen i § 5
- `docs/decisions/ADR-093-auth-faktor-strategin-losenord-passkey.md` —
  ASVS 5.0 V6-golvet (min 8 tecken, 15 rekommenderat), bekräftat
  kompatibelt med GOV.UK-mönstret i § 5
