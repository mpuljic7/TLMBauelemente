# Provjere — 14. listopada 2026.

## Statička provjera

Provjereno šest HTML stranica, 164 lokalne poveznice i 64 slikovne/skriptne reference, uključujući responzivne izvore. Nema nedostajućih datoteka, praznih poveznica, nepostojećih odredišta sekcija ili ponovljenih ID oznaka. Svaka stranica ima jedan H1, odgovarajući jezik, canonical i jezične alternative. Polja imaju povezane oznake, a slike opise i dimenzije.

JavaScript prolazi `node --check`. Nema frameworka, instalacije paketa ni koraka izgradnje.

Provjereno je 12 kombinacija boje teksta i pune podloge. Sve imaju kontrast najmanje 4,5:1; najmanji izmjereni omjer je 4,91:1 za sekundarni tekst na svijetloj podlozi. Smeđa za tekst je tamnija od početne preporuke radi kontrasta. Glavna fotografija ima tamnu podlogu/gradijent; naslov i sitniji tekst pregledani su i vizualno na snimkama. To nije formalni audit svih piksela teksta preko fotografije.

## Preglednik

Prvi prolaz u instaliranom Chromeu: 50 uspješnih provjera. Nakon optimizacije slika završni prolaz u instaliranom Microsoft Edgeu: **54 uspješne provjere, 0 neuspješnih**. Testni poslužitelj radi lokalno, a simulirani kontaktni endpoint ne šalje stvarni e-mail. Detaljni aktualni rezultati nalaze se u `.qa/report.json`, a statički rezultati u `.qa/static-report.json`.

Provjerene su:

- Obje početne stranice na širinama 360, 390, 600, 768, 850, 1024, 1440 i 1920 px, bez horizontalnog pomicanja.
- Mobilni izbornik: otvaranje, `aria-expanded`, zatvaranje tipkom Escape i povrat fokusa, zatvaranje odabirom sekcije.
- Poveznice za jezik koje zadržavaju trenutačnu sekciju.
- Učitavanje svih slika i dostupnost stvarnog HTML sadržaja bez JavaScripta.
- Mobilna navigacija bez JavaScripta.
- Poštovanje `prefers-reduced-motion` za pomicanje i prijelaze.
- Isključen obrazac bez endpointa, bez lažne potvrde.
- Lokalizirane poruke obveznih polja i pogrešnog e-maila.
- Čuvanje podataka nakon HTTP 500.
- Odbijanje lažnog uspjeha nakon HTTP 200 bez `success: true`.
- Prikaz potvrde i pražnjenje obrasca tek nakon potvrđenog odgovora.
- Sve četiri pravne stranice na 360 px.
- Pogreške konzole tijekom provjerenih radnji.

Puni prikazi na 390 i 1440 px spremljeni su u `.qa/de-390.png`, `.qa/de-1440.png` i hrvatskim ekvivalentima. Vizualno su pregledani puni rasporedi i povećani gornji dijelovi za oba jezika.

## Preostala ograničenja

- Lighthouse nije pokrenut; ocjene 90+ nisu izmjerene niti se tvrdi da su postignute.
- Nije provedena provjera na fizičkom mobitelu, Safariju/Firefoxu, čitaču zaslona ili kroz formalni WCAG audit.
- Nije provjerena stvarna e-mail dostava: endpoint i primatelj nisu dostavljeni.
- HTTPS, kompresija, zaglavlja, cache i indeksiranje ovise o konačnom hostingu i moraju se provjeriti nakon postavljanja.
- Kontaktni i pravni podaci, domena i dodatne poslovne tvrdnje čekaju dopunu vlasnika.
- Fotografije su ilustrativne, a pravne stranice nacrti. Stranica još nije javno objavljena.

## Ponovna provjera

Neobvezno, uz već instaliran Node i preglednik, bez npm-a:

```powershell
node tools/check-files.mjs
node --check assets/js/main.js
node --check assets/js/config.js
$env:TLM_QA_BROWSER = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
node tools/check-site.mjs
```

Alat za preglednik pokreće vlastiti privremeni lokalni poslužitelj na portu 4173 i testni preglednik bez vidljivog prozora, s odvojenim profilom i portom 9224. Gasi ih po završetku. Radne profile i rezultate ostavlja u `.qa/`; tu mapu ne objavljivati. Chrome je zadani preglednik ako varijabla `TLM_QA_BROWSER` nije postavljena. U ovom je okruženju ponovljeno pokretanje Chromea zapelo pri inicijalizaciji, pa je završna provjera prebačena na Edge.
