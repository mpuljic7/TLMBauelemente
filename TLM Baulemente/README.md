# TLM Bauelemente

Dovršena dvojezična prezentacijska stranica u HTML-u, CSS-u i običnom JavaScriptu. Nema frameworka, paketa, npm-a ni postupka izgradnje. Sadržaj je zapisan u HTML-u i dostupan bez JavaScripta.

## Otvaranje

Otvorite `index.html` u pregledniku. Hrvatska verzija je u `hr/index.html`. Za vjernu provjeru ponašanja hostinga može se pokrenuti lokalni statički poslužitelj, primjerice `python -m http.server 8080`, pa otvoriti `http://localhost:8080`. Python nije potreban za stranicu ili hosting.

## Struktura

```text
index.html                 Njemačka početna stranica
impressum.html             Njemački nacrt pravnih podataka
datenschutz.html           Njemački nacrt zaštite podataka
hr/                       Sve tri hrvatske stranice
assets/css/styles.css     Zajednički responzivni stilovi
assets/js/config.js       Odredište obrasca i potvrđene dodatne usluge
assets/js/main.js         Izbornik, jezik i kontaktni obrazac
assets/images/            Originalni izrez logotipa i lokalne fotografije
robots.txt                Indeksiranje isključeno do dovršetka sadržaja
sitemap.xml               Pripremljeno za konačnu domenu
docs/OBJAVA.md             Podaci, pretpostavke i koraci prije objave
docs/FOTOGRAFIJE.md        Izvori fotografija i potrebne stvarne fotografije
docs/PROVJERE.md           Rezultati provjera i ograničenja
tools/                    Neobvezni alati za provjeru, nisu dio web-stranice
.qa/                      Lokalni rezultati provjere, ne učitavati na hosting
```

## Statički hosting

U korijenski javni direktorij hostinga kopirajte šest HTML stranica (uz zadržavanje mape `hr`), mapu `assets`, `robots.txt` i `sitemap.xml`. HTTPS i posluživanje `index.html` kao početne datoteke dovoljno su za prikaz. Nisu potrebna posebna preusmjeravanja. Nemojte objavljivati `tools`, `.qa`, `docs`, izvorni brief ili radne datoteke.

Prije javne objave obvezno prođite `docs/OBJAVA.md`. Trenutačno nema stvarnih kontakata ni poslužitelja za obradu upita, pa je slanje jasno isključeno. Pravne stranice su nacrti. Nije izvršena javna objava.

## Uređivanje

Tekst se mijenja izravno u odgovarajućim HTML datotekama za oba jezika. Dizajn je u `styles.css`; boje i osnovni razmaci definirani su CSS varijablama. Fotografije imaju lokalne responzivne izvore. Zadržite oznake da su fotografije ilustrativne dok ih ne zamijenite stvarnim odobrenim radovima.

Obrazac se povezuje u `assets/js/config.js`. Dokumentiran ugovor za poslužitelj i način uključivanja dodatnih usluga nalaze se u `docs/OBJAVA.md`.
