# Ultra greitas Autoloke įkėlimas

Įdėk šiuos failus į savo Next.js projektą:

- `src/app/parduoti/page.tsx`
- `src/app/greitai/page.tsx`

Nuorodos:

- `https://autoloke.lt/parduoti`
- `https://autoloke.lt/greitai`

## Ką daro

- leidžia labai greitai įkelti skelbimą telefonu
- svarbiausi laukai: nuotraukos, kaina, telefonas
- papildomi, bet neprivalomi: markė, miestas, komentaras
- saugo į `ads` kolekciją Firestore
- kelia nuotraukas į Firebase Storage
- pažymi šaltinį: `source: "quick_upload"`

## Reikalavimai

Projektas turi turėti šiuos failus ir alias:

- `@/lib/firebase`
- `@/lib/upload`
- `tsconfig` alias `@/*`
- Firebase env reikšmes

## FB postui naudok

`https://autoloke.lt/greitai`

Pvz. tekstas:

> 🚗 Nori parduoti auto? Įkelk skelbimą greitai ir paprastai 👇
> https://autoloke.lt/greitai
