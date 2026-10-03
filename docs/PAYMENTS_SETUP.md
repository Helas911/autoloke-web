# Autoloke mokėjimų paleidimas

Transporto skelbimas – 1 EUR už 30 dienų. Detalių skelbimai nemokami.
Mokėjimo valiuta EUR nepriklauso nuo automobilio kainos valiutos: DK skelbimų kainos lieka DKK.
Esami transporto skelbimai be patvirtinto mokėjimo viešai nerodomi; savininkas gali juos apmokėti „Mano skelbimuose“.
Pakartotinis jau apmokėto skelbimo mokėjimas / pratęsimas šioje versijoje nenumatytas.

## Prieš paleidimą

1. Vercel aplinkoje nustatyti serverio kintamuosius (jokių slaptų raktų GitHub ar pokalbyje):
   - `STRIPE_SECRET_KEY` (pirma testinis, vėliau tikras)
   - `STRIPE_WEBHOOK_SECRET`
   - `FIREBASE_SERVICE_ACCOUNT_KEY` (Firebase tarnybinės paskyros JSON arba base64 JSON; galima naudoti esamus `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_PROJECT_ID`)
   - `FIREBASE_STORAGE_BUCKET` arba esamas `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `CRON_SECRET` – atsitiktinis stiprus serverio raktas.
   Vieši `NEXT_PUBLIC_FIREBASE_*` kintamieji turi nurodyti tą patį Firebase projektą.
2. Stripe sukurti webhook viename kanoniniame domene: `https://autoloke.lt/api/payments/webhook`.
   Įjungti `checkout.session.completed` ir `checkout.session.async_payment_succeeded`.
   Naudoti šio endpoint parašo raktą kaip `STRIPE_WEBHOOK_SECRET`. Testinio ir tikro režimo raktai skiriasi.
   Webhook API versija: `2026-09-30.endive` (Stripe SDK 23).
3. Firebase Console patikrinti esamas Firestore taisykles. Šis repozitorius iki šiol jų neturėjo.
   `firestore.rules` apima `ads`, `parts`, `partRequests`; kitos kolekcijos uždraustos.
   Jei ta pačia baze naudojasi kitos programos / kolekcijos, suderinti taisykles prieš diegiant.
4. Įdiegti indeksus, palaukti kol jie bus paruošti; tuomet suderintai diegti puslapio kodą ir taisykles:
   `npx firebase deploy --only firestore:indexes --project FIREBASE_PROJECT_ID`
   `npx firebase deploy --only firestore:rules --project FIREBASE_PROJECT_ID`
   Senas puslapis skaito visą ads kolekciją, todėl griežtos taisyklės senam klientui neleidžia užklausų.
5. Paleisti Vercel versiją. Su Stripe testine kortele patikrinti prisijungimą, naują transporto skelbimą,
   atšaukimą ir grįžimą į „Mano skelbimai“, pakartotinį apmokėjimą, aktyvavimą ir nemokamą detalę.
   Pakeisti Stripe į tikro režimo raktus tik po patikros.

## Automatinis valymas

`vercel.json` nustato patikrą kasdien 03:00 UTC; faktinis vykdymas priklauso nuo Vercel plano.
Transportas slepiamas po 30 dienų, dokumentas ir jo nuotraukos šalinami po 31 dienos nuo apmokėjimo,
per artimiausią kasdienį vykdymą. Neapmokėti skelbimai ir detalės – po 31 dienos nuo sukūrimo.
Valymas pagal nutylėjimą išjungtas. Peržiūrėjus dabartinius `deleteAt` laukus ir atsarginę kopiją,
Vercel nustatyti `LISTING_CLEANUP_ENABLED=true`. Senų skelbimų be `deleteAt` užduotis neliečia.
Vienas vykdymas apdoroja iki 50 skelbimų kiekvienoje kolekcijoje; stebėti klaidas ir eilės dydį.
Nuotraukų trynimo klaidos palieka dokumentą kitam bandymui. Rankinis mokėjimo patvirtinimo endpoint išjungtas.

## Patikros

- `npm test` – mokėjimo logikos patikros.
- `npm run test:rules` – Firestore emuliatorius: teisių taisyklės ir pasirašyti Stripe pranešimai (be tikrų mokėjimų).
- `npm run build` – produkcinis surinkimas.

Esamoje aplinkoje Java 17 emuliatoriui naudojamas Firebase CLI 14.x.
Tikro Stripe mokėjimo ir produkcinės Firebase konfigūracijos automatizuoti testai nepakeičia.
