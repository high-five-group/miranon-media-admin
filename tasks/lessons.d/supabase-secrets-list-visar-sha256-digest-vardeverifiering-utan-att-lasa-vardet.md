# `supabase secrets list` visar sha256-digest av värdet, ett tredje verifikatshåll utan att läsa värdet

`supabase secrets list` returnerar inte hemligheten i klartext, men den
returnerar en sha256-digest av värdet, vilket gör det möjligt att verifiera
att en hemlighet stämmer mellan flera håll utan att någonsin läsa eller
skriva ut själva värdet. Mätt 2026-09-02 (S113 Del 16,
`tasks/sessions/2026-08-29-session-113.md` rad 1679, 1697 till 1714): en
`INVITE_REDIRECT_URL`-hemlighet verifierades identisk i tre håll (lokalt
beräknad sha256 av URL:en, Vault-digesten, `secrets list`-digesten) utan att
värdet någonsin lästes eller loggades. Regel: när en hemlighets korrekthet
ska bevisas mellan miljöer (lokalt beräknat värde, Vault, `secrets list`),
jämför digester i stället för att exponera värdet. Digest-jämförelse ger
samma bevisstyrka som en värde-jämförelse utan att öka exponeringsytan.
