# Autoloke LT + DK greitas skelbimo įkėlimas

Įkelk šiuos failus į savo Next.js projektą.

## Failai

- `src/components/QuickUploadPage.tsx`
- `src/app/parduoti/page.tsx`
- `src/app/saelg/page.tsx`
- `src/app/greitai/page.tsx`
- `src/app/opret-annonce/page.tsx`

## Nuorodos

LT Facebook postams:

`https://autoloke.lt/greitai`

arba tiesiogiai:

`https://autoloke.lt/parduoti`

DK Facebook postams:

`https://autoloke.dk/saelg`

arba:

`https://autoloke.dk/opret-annonce`

## Kaip veikia

- `autoloke.lt/greitai` nukreipia į `/parduoti`.
- `autoloke.dk/greitai` nukreipia į `/saelg`.
- Pagal domeną `.dk` puslapis automatiškai rodo danų kalbą.
- Į Firestore `ads` įrašo `country: LT` arba `country: DK`.
- LT naudoja `currency: EUR`.
- DK naudoja `currency: DKK`.
- Nuotraukas kelia į Firebase Storage.

## Deploy

Terminale:

```bash
npm run build
```

Jei klaidų nėra:

```bash
git add .
git commit -m "Add LT and DK quick upload pages"
git push
```

Vercel po `git push` paleis automatiškai.
