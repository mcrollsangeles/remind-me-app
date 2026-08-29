# RemindMeApp

A simple reminder app built with **Expo SDK 57** + **React Native**. It works like an alarm clock, but instead of a ringing alarm it fires a **local push notification** (with the Psyduck sound ) at the time you set.

## Features

- **Reminder list** - see all your active notifications, toggle them on/off, and delete them.
- **Create a reminder** - title, optional message, a specific date & time **or** every day, and an optional "repeat every N minutes" interval.
- **Edit a reminder** - tap any reminder to update its details, or delete it.
- **Custom notification sound** - `assets/psyduck.mp3` plays when the notification arrives.
- **Dark mode** - toggle from the header; your preference is saved on-device.
- **Persistent storage** - reminders are stored locally with AsyncStorage (no database or account needed).

## Screens
| **Reminders (List)** | All reminders with schedule summaries, enable/disable switches, and delete actions. Floating **＋** creates a new one. |
| **New Reminder** | Form to create a notification: title, message, date/time pickers, repeat options, and a sound preview. |
| **Edit Reminder** | Same form, pre-filled, to update or delete an existing reminder. |

## Tech stack

- [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/) - React Native 0.86, React 19
- `expo-notifications` - local notification scheduling (Android/iOS)
- `expo-audio` - in-app Psyduck sound preview
- `@react-navigation/native` + `native-stack` - navigation
- `@react-native-async-storage/async-storage` - local persistence
- `@react-native-community/datetimepicker` - native date/time pickers
- Jest (`jest-expo`) + React Native Testing Library - unit & component tests

## Getting started

Prerequisites: Node.js, and either the Expo Go app on your phone or an emulator.

```sh
npm install
```

Run in development:

```sh
npm start     # Expo dev server (QR to open in Expo Go)
npm run web   # run in the browser
npm test      # run the Jest test suite
```

> **Note:** the custom Psyduck sound only plays in a **development/standalone build** (Expo Go falls back to the default sound). Remote push notifications are unavailable in Expo Go on Android since SDK 53 — this app uses **local** notifications, which do work.

## Building the APK

The app uses **EAS Build** (cloud) — see `eas.json`.

```sh
npm install -g eas-cli
eas login
npm run build:apk   # eas build -p android --profile preview
```

This produces an installable **APK** (the Psyduck icon and sound are bundled automatically). For the Play Store, use the `production` profile (AAB).

Alternatively build locally with Android Studio / SDK:

```sh
npx expo prebuild -p android
cd android
.\gradlew assembleRelease
```

## Project structure

```
App.js                    # App entry: providers + navigation stack
src/
  theme.js                # light/dark palettes + ThemeProvider/useTheme
  context/                # RemindersContext (state + CRUD)
  components/             # ReminderCard, ReminderForm, PlatformDateTimePicker
  screens/                # HomeScreen, CreateReminderScreen, EditReminderScreen
  utils/                  # helpers, storage, ui, notifications (+ .web.js variants)
  **/__tests__/           # Jest tests
eas.json                  # EAS build profiles
```

## How reminders are stored & scheduled

- The reminder list is saved as JSON in AsyncStorage (key `remindme.reminders.v1`); no database.
- Scheduling maps to `expo-notifications` triggers:
  - specific date - `DATE` trigger (fires once)
  - every day - `DAILY` trigger (hour/minute)
  - repeat every N min - `TIME_INTERVAL` trigger (repeats)
- Notifications are scheduled with the OS, so they **fire even when the app is closed** (except if the user force-stops the app in Android settings).

## License

MIT — see [LICENSE](./LICENSE).
