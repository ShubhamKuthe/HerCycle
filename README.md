# HerCycle

HerCycle is a cross-platform React Native (Expo) period tracking app built for PCOD/PCOS-friendly care, with cycle predictions, spotting and symptom tracking, weight logs, fertility estimates, medical store lookup, Firebase sync, and doctor-ready PDF reports.

## Features

- Multi-step onboarding with PCOD/PCOS-aware cycle setup
- Period start, period end, and spotting-only tracking
- Mood, pain, symptom, flow, and doctor note logging
- Fertility window estimates with gentle health flags
- Weight tracker and report charts
- Nearby medical store lookup via Google Maps
- Firebase Authentication and Firestore sync
- Doctor-ready PDF export
- Dark mode and animated intro branding

## Tech Stack

- Expo SDK 54
- React Native
- React Navigation
- AsyncStorage
- Expo Notifications
- Expo Print / Sharing
- Firebase Auth + Firestore REST APIs

## Getting Started

```bash
npm install
npx expo start
```

## Build

Android and iOS builds are configured with EAS.

```bash
npx eas build -p android --profile preview
npx eas build -p ios --profile preview
```
