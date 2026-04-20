# Poundwise Wealth

Poundwise Wealth is a private, installable budgeting system for tracking every pound, recurring bills, savings, investments, and progress toward a six-figure wealth goal.

## Features

- Needs, Wants + Future You budgeting framework
- Monthly income, budget targets, and category limits
- Daily transaction entry in GBP
- Recurring monthly bills such as rent, council tax, water, energy, and subscriptions
- Savings and investment rate tracking
- Six-figure wealth progress tracking
- Monthly dashboards with pie charts, daily bars, and insights
- Custom categories with editable framework bucket and colour
- CSV export
- Progressive Web App setup for iPhone Home Screen installation
- Firebase/Google Cloud sync across devices with separate data per user

## Use

Open `index.html` in a browser. Data is stored locally first and can sync through Firebase Firestore when a user signs in. Signed-in users also get separate local caches on shared devices.

## Firebase Sync

The app is configured for Firebase project `poundwise-493918`.

1. Enable Firebase Authentication with Email/Password sign-in.
2. Create a Firestore database.
3. Apply the rules in `firestore.rules`.
4. In the app, open **Budgets & Recurring**, create an account or sign in.
5. Use **Upload now** to push this device or **Download cloud** to pull existing cloud data.

Each Firebase user stores budget data under their own user ID, so multiple people can use the same hosted app without seeing each other's data.
