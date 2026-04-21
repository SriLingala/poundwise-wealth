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
- Password reset for Firebase accounts

## Use

Open `index.html` in a browser. Users sign in before using the app. Data is stored locally first, syncs to Firebase Firestore after changes, and checks for updates from other browsers/devices automatically.

## Firebase Sync

The app is configured for Firebase project `poundwise-493918`.

1. Enable Firebase Authentication with Email/Password sign-in.
2. Create a Firestore database.
3. Apply the rules in `firestore.rules`.
4. In the app, create an account or sign in.
5. Keep the same account signed in on each browser/device to sync budget data automatically.

Each Firebase user stores budget data under their own user ID, so multiple people can use the same hosted app without seeing each other's data.
If a user adds data before signing in, the app merges local entries with existing cloud data on first sync.
