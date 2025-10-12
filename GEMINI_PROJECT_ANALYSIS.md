# Gemini Project Analysis: SMOV0.1 (WATTLY)

## 1. Project Overview

- **Project Name:** WATTLY (internally SMOV0.1)
- **Description:** A comprehensive React Native mobile application for Smart Meter Operations. It features advanced authentication, real-time data capture, and an offline-first architecture with robust data synchronization.
- **Platform:** React Native with Expo.

## 2. Technology Stack

- **Core:** React Native, Expo SDK, JavaScript (ES6+)
- **Navigation:** React Navigation (`@react-navigation/native-stack`)
- **State Management:** Component state (`useState`, `useEffect`) and context via custom hooks.
- **Database:** Expo's fork of SQLite (`expo-sqlite`) for local offline storage.
- **API Communication:** `fetch` API with a custom `apiService.js` wrapper.
- **Authentication:**
    - Firebase for SMS OTP (currently placeholder credentials).
    - A separate, hardcoded ngrok URL for a custom OTP service.
    - `expo-local-authentication` for Biometric/PIN unlock.
- **Styling:**
    - Stylesheets with a design system defined in `src/constants/index.js` (Colors, Typography, Spacing).
    - Inspired by Material UI and ERPNext themes.
- **Linting & Formatting:** ESLint and Prettier.
- **Testing:** Jest.

## 3. Project Structure

The project follows a standard feature-based structure within the `src/` directory:

```
src/
├── components/      # Reusable UI components (Button, Card, List, etc.)
├── config/          # Global application configuration (e.g., feature toggles).
├── constants/       # Design system, screen names, API config.
├── hooks/           # Custom React hooks for shared logic.
├── screens/         # Top-level screen components for navigation.
├── services/        # Core logic (API, database, sync, auth).
├── styles/          # Shared and modular styling.
└── utils/           # Utility functions and helpers.
```

## 4. Core Services & Data Flow

The application is built around a robust service layer, promoting separation of concerns.

### Data & Sync Architecture (Offline-First)

1.  **`databaseService.js`**:
    - Manages the local SQLite database (`smov_offline.db`).
    - Handles all CRUD operations for tables like `consumer_indexing`, `users`, `captures`, etc.
    - Implements a database migration system based on a version number.
    - **Key Function:** All data modifications (creates, updates) are first written to the local SQLite database.

2.  **`syncService.js`**:
    - Orchestrates the synchronization of local data with the remote server.
    - Uses a `sync_queue` table in the local DB to track pending changes.
    - **On-Demand Sync:** Can be manually triggered (e.g., from the UI). The `performManualSync` utility in `syncUtils.js` specifically syncs the `consumer_indexing` table.
    - **Background Sync:** Configured via `appConfig.js` (currently `autoSync: false`). Uses `expo-background-fetch` to run periodically.
    - **Sync Logic:** Reads items from `sync_queue`, calls the appropriate `apiService` method, and removes the item from the queue on success.

3.  **`apiService.js`**:
    - A wrapper around the `fetch` API for communicating with the backend.
    - Contains methods for all remote API calls (e.g., `updateConsumerSurveyAbsolute`, `sendOTPReal`).
    - **Crucially, it has a `mockMode` flag which is currently `true`.** This means most data-fetching methods (like `getDashboardStats`, `getUserProfile`) are currently short-circuited to fetch data from the local `databaseService` instead of making network calls.
    - The primary "real" API call being used is `updateConsumerSurveyAbsolute`, which performs a `PUT` request to a hardcoded ngrok URL to update consumer survey data.

4.  **`dataService.js`**:
    - Acts as a mediator between UI components and the data sources.
    - Implements a "try local first, then remote" strategy. For example, `getDashboardStats` will first query `databaseService` and, if that fails, will call `apiService`.

### Authentication Flow

1.  **Login:** The user enters a phone number (`LoginScreen`).
2.  **OTP:** The app calls `apiService.sendOTPReal` which hits a custom ngrok endpoint.
3.  **Verification:** The user enters the OTP (`OTPScreen`), and the app calls `apiService.verifyOTPReal`.
4.  **Local Unlock:** For subsequent sessions, `PhoneUnlockScreen` uses `expo-local-authentication` for biometric or PIN/Pattern unlock.

## 5. Key Scripts (`package.json`)

-   `npm start`: Starts the Expo development server.
-   `npm run android`: Runs the app on an Android emulator/device.
-   `npm test`: Runs Jest tests.
-   `npm run lint`: Lints the `src` directory.
-   `npm run format`: Formats the `src` directory with Prettier.
-   `npm run code-quality`: Runs both linting and formatting.

## 6. Build & Configuration

-   **Expo Config:** `app.json` defines the app name (`WATTLY`), version, bundle identifiers, and plugins (`expo-location`, `expo-background-fetch`).
-   **Builds:** EAS Build is configured (`eas.json`) for creating `preview` and `production` Android builds.
-   **Babel/Metro:** `babel.config.js` and `metro.config.js` are configured to handle module resolution and aliases, notably providing fallbacks for `react-native-maps` on the web.

## 7. Summary for Future Tasks

-   **Modifying Features:** Changes should start in the relevant `screens/` component and propagate down to the `services/` layer. For data-related changes, `databaseService.js` must be updated first, especially if schema changes are needed (requiring a version bump and migration).
-   **Bug Fixes:** The issue is likely in a UI component (`screens/` or `components/`), a utility (`utils/`), or a service (`services/`). The data flow (UI -> DataService -> DatabaseService -> SyncService -> ApiService) is the primary path to trace.
-   **API Changes:** All API endpoint interactions are centralized in `apiService.js`. The `updateConsumerSurveyAbsolute` method is the most complex and important one to reference for new API calls.
-   **Dependencies:** Use `npm install` to add new dependencies.
-   **Code Style:** Adhere to the existing ESLint and Prettier configurations. Run `npm run code-quality` before committing.
