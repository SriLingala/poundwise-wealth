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
- Optional Supabase cloud sync across devices

## Use

Open `index.html` in a browser. Data is stored locally in the browser and can be synced through Supabase.

## Supabase Sync

1. Create a Supabase project.
2. In Supabase SQL Editor, run `supabase-schema.sql`.
3. In the app, open **Cloud database**, enter your Supabase Project URL and anon public key.
4. Create an account or sign in.
5. Use **Upload now** to push this device or **Download cloud** to pull existing cloud data.
