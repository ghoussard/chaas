# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

React + TypeScript + Vite application using Firebase (Firestore + Authentication) with Chakra UI for the component library. The application appears to be a purchase/account tracking system ("Chaquip as a Service").

## Development Commands

### Running the Application
- `yarn dev` - Start development server with Firebase emulators (runs both concurrently)
- `yarn build` - Build for production (TypeScript compilation + Vite build)
- `yarn preview` - Preview production build

### Firebase Emulators
- `yarn emulators` - Run Firebase emulators (Firestore on port 8080, Auth on port 9099)
  - Imports data from `.emulators` directory on start
  - Exports data to `.emulators` on exit
- `yarn fixtures` - Load development fixtures into emulators (creates test user and sample data)

### Testing
- `yarn test:unit` - Run unit tests once
- `yarn test:unit:watch` - Run unit tests in watch mode
- `yarn test:integration` - Run integration tests with Firebase emulators
- `yarn test:integration:watch` - Run integration tests in watch mode

Note: Integration tests automatically start Firebase emulators. Unit tests do not require emulators.

### Code Quality
- `yarn lint` - Run ESLint
- `yarn lint:fix` - Run ESLint with auto-fix
- `yarn prettier` - Check code formatting
- `yarn prettier:fix` - Auto-format code with Prettier

## Architecture

### Store Pattern
The app uses a custom subscription-based store pattern for managing Firestore data:
- **Store Interface**: Located in `src/store/`
- **Pattern**: Each store implements `subscribe()` and `snapshot()` methods
  - `subscribe(callback)` - Subscribe to changes, returns unsubscribe function
  - `snapshot()` - Get current data or null if not subscribed
- **Implementation**: `FirestoreAccountStore` wraps Firestore's `onSnapshot` to provide a consistent interface
- **Example**: [src/store/account.ts](src/store/account.ts)

### Context Architecture
React Context provides dependency injection throughout the app:
- **StoreContext**: Provides access to stores (currently only AccountStore)
  - Created via `createStoreContextValue(firestore)` which initializes all stores
- **AuthContext**: Provides authentication state and Firebase Auth instance
- **ItemsContext**: Provides enabled items loaded once on app mount via ItemsProvider
- **FocusableElementRefContext**: Manages keyboard focus for shortcuts
- Access via custom hooks: `useAccountStore()`, `useAuth()`, `useItems()`, `useFocusableElementRef()`

### Firebase Configuration
Environment-based configuration in [src/utils/firebase.ts](src/utils/firebase.ts):
- **Env.PROD**: Uses environment variables (VITE_FIREBASE_*)
- **Env.DEV**: Uses `chaas-dev` project with local emulators
- **Env.TEST**: Uses `chaas-test` project with local emulators
- Non-production environments automatically connect to emulators (Firestore: localhost:8080, Auth: localhost:9099)

### Data Models
Type definitions in `src/models/`:
- **Account**: User account with Slack profile and activity metrics (totalPurchased, totalPaid, timestamps)
- **Item**: Purchasable items
- **Transaction**: Purchase/payment records
- **DOM**: DOM-related types for keyboard handling

### Custom Hooks
- `useAccountStore()` - Access AccountStore from context (throws if not initialized)
- `useAuth()` - Access authentication state and Auth instance
- `useAccounts()` - Subscribe to account list with search/filtering
- `useFocusableElementRef()` - Access ref for keyboard shortcuts
- `useOnKeyboardShortcuts()` - Register keyboard shortcut handlers
- `useItems()` - Access items from ItemsContext (throws if not loaded or error)

## Testing Strategy

### Unit Tests
- **Pattern**: `*.unit.test.ts(x)` files
- **Environment**: jsdom
- **Setup**: [vitest.setup.unit.ts](vitest.setup.unit.ts) includes React Testing Library cleanup and jest-dom matchers
- **Utils**: [src/utils/tests.tsx](src/utils/tests.tsx) provides `renderWithChakra()` helper
- **Run**: Tests run directly without Firebase emulators

### Integration Tests
- **Pattern**: `*.integration.test.ts(x)` files
- **Environment**: jsdom with Firebase emulators
- **Setup**: Tests use Vitest fixtures to create Firebase app and load test data
- **Example Pattern** (from [src/store/account.integration.test.ts](src/store/account.integration.test.ts)):
  ```typescript
  const it = base.extend<{firestore: Firestore}>({
    firestore: async ({}, use) => {
      const app = createFirebaseApp(Env.TEST);
      const firestore = getFirestore(app);
      // Load fixtures
      await loadAccounts(firestore, Dataset.TEST);
      await use(firestore);
      await deleteApp(app);
    },
  });
  ```
- **Run**: Firebase emulators are automatically started via `firebase emulators:exec`

### Test Configuration
- **Workspace**: [vitest.workspace.ts](vitest.workspace.ts) defines two test projects
- Both projects extend base Vite config for proper module resolution
- Unit tests have dedicated setup file, integration tests do not

## Key Implementation Patterns

### Store Subscription Lifecycle
1. Store starts with `snapshot() === null`
2. Call `subscribe(callback)` to start Firestore listener
3. Store updates internal state and calls callback on changes
4. `snapshot()` returns current data array
5. Call returned unsubscribe function to clean up
6. After unsubscribe, `snapshot()` returns null again

### Authentication Flow
- App checks `isLoggedIn` from `useAuth()` hook
- Shows Login page when not authenticated, AccountGrid when authenticated
- Firebase Auth emulator used in development with test credentials

### Fixtures System
- Located in `src/utils/fixtures/`
- Provides functions to load test data: `loadAccounts()`, `loadItems()`, `loadTransactions()`, `updateAccountActivity()`
- Supports different datasets (Dataset.DEV, Dataset.TEST)
- `createUser()` helper for creating auth users in emulators

## POS (Point of Sale) System

### Overview
The app functions as a bar POS system for charging drinks and managing customer payments/credits. Core workflow: search customer → open drawer → charge drinks or add payment.

### Items Management
**ItemsContext Pattern:**
- `ItemsProvider` loads enabled items once on app mount
- Items fetched from Firestore: `where('enabled', '==', true)`
- Managed through Firebase console (no in-app management)
- Access via `useItems()` hook (throws if items not loaded)
- Pattern in [src/store/item.ts](src/store/item.ts) and [src/contexts/ItemsProvider.tsx](src/contexts/ItemsProvider.tsx)

### Transaction Service
**Location:** [src/services/transaction.ts](src/services/transaction.ts)

**Three core functions:**
```typescript
chargePurchase(firestore, accountId, item)      // Single purchase
chargePurchases(firestore, accountId, items[])  // Batch purchases
addPayment(firestore, accountId, amount)        // Payment/credit
```

**Pattern - Atomic Updates:**
- Uses Firestore `writeBatch()` for atomicity
- Writes transaction document AND updates account activity in single batch
- Updates use `increment()` for safe concurrent modifications
- Example: `'activity.totalPurchased': increment(item.price)`
- No queries needed - direct incremental updates scale to any number of accounts

### AccountDrawer POS Interface
**Structure:**
- Two tabs: "Charge Drinks" (default) | "Add Payment"
- Balance display in header (green if positive credit, red if debt)
- Props include `accountId`, `totalPaid`, `totalPurchased` for transaction processing

**Charge Drinks Tab:**
- Displays `DrinkCard` components in 3-column grid
- Two charging modes:
  1. **Quick charge**: Click drink image → immediately charges 1 item → drawer closes
  2. **Batch charge**: Use +/- buttons → build cart → click "Charge" button → drawer closes
- Loading state shows spinner during transaction processing
- Errors shown via Chakra toast, drawer stays open for retry

**Add Payment Tab:**
- Input pre-fills with current debt amount (if exists)
- Live "New balance" calculation as user types
- Validation: amount > 0 required
- Successful payment closes drawer

### DrinkCard Component
**Features:**
- Drink image (clickable for quick charge)
- Name and price display
- +/- buttons for quantity adjustment
- Quantity badge (appears when > 0)
- Located in [src/components/DrinkCard.tsx](src/components/DrinkCard.tsx)

### State Management in AccountDrawer
- `quantities` - Map<itemId, count> for batch charging
- `paymentAmount` - String for controlled input
- `isCharging` / `isProcessingPayment` - Loading states
- Effect resets payment amount when drawer opens (defaults to debt if exists)
- `resetQuantities()` clears drink quantities after successful charge

### Error Handling
- Immediate error display via toast (no silent retries)
- Drawer remains open on error for manual retry
- Appropriate for single-POS operation with reliable network
