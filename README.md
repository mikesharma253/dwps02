# NYRO — Planet Mission Control

A competition-ready, responsive sustainability web prototype focused on **SDG 4 (Quality Education), SDG 6 (Clean Water and Sanitation), and SDG 13 (Climate Action)**.

## Run it

1. Extract this folder if you downloaded the ZIP.
2. Open `index.html` in a browser, or open this folder in VS Code and use Live Server.
3. Everything is at the project root. **There are no nested asset folders.**

## Features

- Responsive Mission Control dashboard
- Interactive annual footprint scenario model with transparent factors
- Water usage entries and daily reference goal
- Action missions with XP/level progression
- Four-question sustainability knowledge check
- Local progress persistence via browser `localStorage`
- JSON report export
- Demo profile, with an explicit example-data disclaimer
- Keyboard focus styling and reduced-motion support

## Important methodology notes

The carbon model is a rough educational illustration using editable assumptions in `script.js`:

- Car travel: 0.17 kg CO₂ per km
- Electricity: 0.7 kg CO₂ per kWh
- Flight: 0.25 tonnes CO₂ per flight (very rough)

The footprint combines annualized car distance, annual electricity use, and a simplified flight count. It is not a validated personal carbon accounting model. Water entries are user-reported, XP is engagement feedback, and missions are not verified environmental outcomes. The Planet Pulse is a playful prototype indicator, **not an official or scientifically validated sustainability score**.

## Files (flat layout)

- `index.html` — all page structure
- `style.css` — all styling and responsive rules
- `script.js` — app logic and state
- `logo.svg` — supplied project logo
- `signature.png` — supplied signature graphic
- `README.md` — run instructions and model notes

## Before presenting

- Open the site and click through the simulator, missions, water form, quiz and export.
- Test in the browser you'll use on stage.
- Explain which numbers are estimates and which data is user-entered.
- Avoid claiming verified impact, real-time sensor readings or shared community results: those are not implemented in this prototype.
