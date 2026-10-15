# Pregled prije objave

## Podaci koje vlasnik treba dostaviti

- Potvrđen naziv pružatelja, pravni oblik, osoba ovlaštena za zastupanje i točna adresa.
- Stvarni telefon i e-mail; do tada nema izmišljenih kontakata, telefonskih poveznica ni `mailto` odredišta.
- Konačna HTTPS domena i hosting.
- Podaci potrebni za pravne stranice, prema stvarnom statusu tvrtke i primjenjivim obvezama.
- Servis ili vlastiti poslužitelj koji prihvaća upite, njegovi uvjeti obrade i čuvanja podataka.
- Po želji stvarni profili društvenih mreža; trenutačno ih nema na stranici.

Nigdje nisu navedeni izmišljeni rezultati, godine iskustva, recenzije, partnerstva, certifikati, jamstva, proizvođači, vlastita proizvodnja ili tehničke performanse.

## Ponuda i poslovne pretpostavke

Jedina aktivna kategorija su prozori. Pripremljeni, ali isključeni prijedlozi su vrata, klizne stijene, rolete, zaštita od sunca, montaža i obnova. Vlasnik mora potvrditi svaku kategoriju i opis prije uključivanja.

U `assets/js/config.js` popisu `confirmedServices` dodajte samo potvrđene identifikatore:

```js
confirmedServices: ["doors", "sliding"]
```

Identifikatori: `doors`, `sliding`, `shutters`, `shading`, `installation`, `renovation`. Pripremljeni članci i opcije obrasca već sadrže oba prijevoda. Za trajnu objavu kategorija tako da budu dostupne i bez JavaScripta, u oba HTML dokumenta uklonite `hidden` s odgovarajućih članaka i `hidden disabled` s opcija; ostavite ih i u popisu potvrđenih usluga. Za potpuno uklanjanje izbrišite pripadajući članak i opciju iz oba HTML dokumenta.

Potvrditi ili prilagoditi i sljedeće:

- O tvrtki: opis razgovora koji polazi od potreba korisnika i situacije na objektu.
- Predloženi proces: upit → savjetovanje i dogovor → ponuda → izvedba. Trenutačni tekst kaže da je to mogući tijek i da se koraci individualno dogovaraju.
- Područje djelovanja: općenito okolica Düsseldorfa; nema točne nepotvrđene lokacije.
- Stvarnu odgovornost za savjetovanje, ponudu, montažu i izvedbu; nije obećana besplatna usluga ni rok odgovora.
- Prijevode i nazive usluga prema stvarnoj ponudi.

## Kontaktni obrazac

Datoteka: `assets/js/config.js`, svojstvo `formEndpoint`. Prazna vrijednost ostavlja gumb isključenim i pokazuje da slanje još nije omogućeno. Nema lažne potvrde ni pohrane upita u lokalnu memoriju preglednika.

Primjer konfiguracije nakon uspostavljanja stvarnog servisa:

```js
formEndpoint: "https://STVARNA-DOMENA/api/contact"
```

Odredište mora primiti `POST` s `Content-Type: application/json` i tijelom:

```json
{
  "name": "Ime klijenta",
  "email": "klijent@example.org",
  "phone": "",
  "projectType": "windows",
  "message": "Opis projekta",
  "language": "de"
}
```

Polje `website` je zamka za robote kada je JavaScript aktivan; legitimno je prazno. Poslužitelj mora validirati podatke, ograničiti učestalost zahtjeva, obraditi neželjene upite i sigurno poslati ili pohraniti poruku. Frontend nije zamjena za poslužiteljsku validaciju. Privatne ključeve nikad ne upisujte u ovaj projekt.

Uspjeh se prikazuje isključivo nakon odgovora HTTP 2xx s JSON tijelom `{"success":true}`. To mora značiti da je poslužitelj prihvatio i obradio upit. HTTP 200 s HTML-om, `{success:false}`, greška mreže ili HTTP 4xx/5xx ne prikazuju uspjeh. Podaci ostaju u obrascu. Zahtjev se prekida nakon 20 sekundi; nakon nejasnog prekida ponovni pokušaj može poslati duplikat, pa servis po potrebi mora podržati deduplikaciju. Preglednik ne šalje kolačiće ni vjerodajnice odredištu. Ako je servis na drugoj domeni, mora podržavati CORS i OPTIONS za domenu stranice. Preusmjeravanja nisu prihvaćena.

Omogućene su lokalizirane poruke provjere, stanje slanja, sprječavanje višestrukog klika te čuvanje podataka pri grešci. Bez JavaScripta slanje ostaje isključeno i postoji objašnjenje. Nema nepotrebnog obveznog potvrdnog okvira koji bi zamjenjivao određivanje stvarne pravne osnove obrade.

Nakon aktivacije dopunite zaštitu podataka, podatke kontakta i tekst za posjetitelje bez JavaScripta u oba HTML-a. Testirajte stvarnu dostavu poruke; test s lokalnim poslužiteljem ne dokazuje dostavu e-maila.

## Domena i indeksiranje

Namjerno se koristi rezervirana zamjenska domena `https://example.invalid`. U svih šest HTML datoteka, `robots.txt` i `sitemap.xml` zamijenite je stvarnom HTTPS domenom bez završne kose crte. Zamjena mora obuhvatiti canonical, sve hreflang oznake, `og:url` i `og:image`. Nema domene skrivene u JavaScriptu niti dinamičkog oslanjanja na JS za SEO oznake.

Njemački je na `/`, hrvatski na `/hr/`; pravne stranice imaju odgovarajuće jezične parove. Prebacivanje jezika zadržava fragment sekcije kad je JavaScript aktivan.

Tek nakon dopune poslovnih i pravnih podataka:

1. Zamijenite `<meta name="robots" content="noindex, nofollow">` s `<meta name="robots" content="index, follow">` u svih šest HTML dokumenata.
2. U `robots.txt` zamijenite `Disallow: /` s `Allow: /` i uklonite komentar za preglednu verziju.
3. Provjerite stvarne canonical i sitemap URL-ove preko HTTPS-a.
4. Uključite prikladan HTTP cache za statične slike, CSS i JS; pri budućim izmjenama vodite računa o osvježavanju cachea.

Strukturirani poslovni podaci nisu dodani jer nedostaju stvarni detalji. Ne dodavati nepotvrđenu adresu, ocjene ili poslovne tvrdnje.

## Pravne stranice

`impressum.html`, `datenschutz.html` i hrvatske inačice su jasno označeni nacrti s nedostajućim informacijama. Prije javne objave tekst treba dovršiti i provjeriti prema stvarnom pružatelju, hostingu, obradi upita i važećim zahtjevima. Nacrti ne predstavljaju pravno mišljenje niti jamstvo usklađenosti.

Kod stranice ne uključuje analitiku, marketinške trackere, vanjske fontove, ugrađene karte ni kolačiće. Pružatelj hostinga ili naknadno dodana usluga mogu promijeniti tu situaciju; ažurirajte dokumentaciju i korisničke informacije prema stvarnoj konfiguraciji.
