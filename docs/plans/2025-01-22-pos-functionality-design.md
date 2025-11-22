# POS Functionality Design

**Date:** 2025-01-22
**Status:** Approved

## Overview

Add Point of Sale functionality to enable bartenders to charge drinks and add payments/credits to customer accounts. The app becomes a single-POS bar management system.

## Requirements

- Search customers by name (already exists)
- Charge drinks to customers (few drinks only)
- Add credits/payments to customers (support both paying off debt and prepaid credits)
- Single POS operation (no concurrent access concerns)
- Drinks managed through Firebase console (no in-app management)

## Architecture

### Component Structure

**AccountDrawer Enhancement:**
- Becomes the main POS interface
- Two tabs using Chakra Tabs component:
  - "Charge Drinks" (default, `index={0}`)
  - "Add Payment" (`index={1}`)

**New Components:**
- `DrinkCard` - Individual drink item with image, +/- buttons, quantity display

### State Management

**Items Context (New):**
- New context provider in `src/contexts/ItemsContext.ts`
- Fetches enabled items once on app mount
- Provides items via `useItems()` hook
- Pattern matches existing `AccountStore` / `useAccountStore()`

**Drawer Local State:**
- Current tab index
- Drink quantities (Map of itemId → count)
- Payment amount (controlled input)
- Loading/error states

### Data Flow

1. User clicks AccountCard → opens drawer with account ID
2. Drawer displays current balance (`totalPaid - totalPurchased`)
3. **Charge flow**:
   - Select drinks → write Purchase transaction(s) → increment account activity → AccountStore subscription updates → balance refreshes → drawer closes
4. **Payment flow**:
   - Enter amount → write Payment transaction → increment account activity → AccountStore updates → balance refreshes → drawer closes

## UI Design

### Charge Drinks Tab

```
┌─────────────────────────────────────┐
│ [Customer Name]            [X Close]│
├─────────────────────────────────────┤
│ Balance: +20€  (or -15€ in red)     │
├─────────────────────────────────────┤
│ [Charge Drinks] [Add Payment]       │
├─────────────────────────────────────┤
│ ┌─────┐  ┌─────┐  ┌─────┐           │
│ │Beer │  │Wine │  │Soft │           │
│ │ 3€  │  │ 4€  │  │ 2€  │           │
│ │ [-][0][+]│ [-][0][+]│ [-][0][+]   │
│ └─────┘  └─────┘  └─────┘           │
│                                     │
│         [Charge Button]             │
└─────────────────────────────────────┘
```

**Interactions:**
- **Click drink image**: Immediately writes 1x Purchase, closes drawer (fast path)
- **+/- buttons**: Increment/decrement local quantity state (min: 0)
- **Count badge**: Shows quantity when > 0
- **Charge button**: Enabled only when total quantity > 0, writes all purchases as batch, closes drawer on success
- **Error**: Show error toast, keep drawer open for retry

### Add Payment Tab

```
┌─────────────────────────────────────┐
│ [Customer Name]            [X Close]│
├─────────────────────────────────────┤
│ Balance: -15€                       │
├─────────────────────────────────────┤
│ [Charge Drinks] [Add Payment]       │
├─────────────────────────────────────┤
│                                     │
│  Current debt: 15€                  │
│                                     │
│  Payment amount:                    │
│  ┌─────────────────────┐           │
│  │ 15              € │           │
│  └─────────────────────┘           │
│                                     │
│  New balance: 0€                    │
│                                     │
│         [Add Payment]               │
│                                     │
└─────────────────────────────────────┘
```

**Interactions:**
- **Default value**: Pre-fills with current debt amount (`Math.abs(totalPurchased - totalPaid)`) if debt exists, otherwise empty
- **Live calculation**: Show "New balance: X€" as user types (green if positive, red if negative)
- **Add Payment button**: Writes Payment transaction, closes drawer on success
- **Validation**: Amount must be > 0
- **Error**: Show toast, keep drawer open for retry

## Data Layer

### Items Loading

**ItemStore (`src/store/item.ts`):**
```typescript
export type ItemStore = {
  items: Item[] | null;
  isLoading: boolean;
  error: Error | null;
};
```

**Implementation:**
- Fetch enabled items once on mount: `query(collection, where('enabled', '==', true), orderBy('name'))`
- No subscription needed (reload page if drinks change)
- Wrap app in ItemsContext.Provider in `main.tsx`

**Loading States:**
- While loading: Show spinner in drinks tab
- Error: Show error message, disable charging
- Empty: Show "No drinks configured"

### Transaction Service

**File:** `src/services/transaction.ts`

**Functions:**

```typescript
// Single purchase (quick charge - click image)
async function chargePurchase(
  firestore: Firestore,
  accountId: string,
  item: Item
): Promise<void>

// Batch purchases (using +/- buttons)
async function chargePurchases(
  firestore: Firestore,
  accountId: string,
  items: Array<{item: Item, quantity: number}>
): Promise<void>

// Payment
async function addPayment(
  firestore: Firestore,
  accountId: string,
  amount: number
): Promise<void>
```

**Implementation Pattern (example for chargePurchase):**

```typescript
const batch = writeBatch(firestore);
const transactionRef = doc(collection(firestore, 'transactions'));
const accountRef = doc(firestore, 'accounts', accountId);
const timestamp = Date.now();

batch.set(transactionRef, {
  id: transactionRef.id,
  type: 'purchase',
  item,
  account: accountId,
  timestamp
});

batch.update(accountRef, {
  'activity.totalPurchased': increment(item.price),
  'activity.lastPurchaseTimestamp': timestamp
});

await batch.commit();
```

**Why Batch + Increment:**
- Atomic: Transaction and account update happen together
- Fast: No queries needed
- Scales: Works with any number of accounts
- Real-time: AccountStore subscription triggers immediately

**Error Handling:**
- Let errors bubble up to caller
- Drawer catches errors and shows toast with Chakra useToast
- Drawer stays open for manual retry

## Balance Display

- Formula: `totalPaid - totalPurchased`
- Positive (credit): Green, format "+20€"
- Negative (debt): Red, format "-15€"
- Display prominently in drawer header

## Edge Cases

- **Zero payment**: Validation prevents 0€ payments
- **Negative payment**: Input type="number" with min="0"
- **Network offline**: Toast shows "Network error, please retry"
- **No items enabled**: Show "No drinks available" message
- **Drawer close**: Reset all quantities and payment field

## Testing Strategy

### Unit Tests

1. **AccountDrawer.unit.test.tsx**
   - Two tabs render, "Charge Drinks" is default
   - Balance displays correctly (color coding)
   - Drink cards render from mocked items
   - +/- buttons update quantities
   - Charge button disabled when quantities = 0
   - Payment input validation

2. **DrinkCard.unit.test.tsx**
   - Renders item details
   - Click image triggers quick charge
   - +/- buttons update quantity

3. **useItems.unit.test.tsx**
   - Returns items from context
   - Throws if context not initialized

### Integration Tests

1. **transaction.integration.test.ts**
   - `chargePurchase()` writes transaction and updates account
   - `chargePurchases()` batch updates correctly
   - `addPayment()` writes payment and updates account
   - Verify atomic updates (transaction + account)

## Future Considerations (Not Implementing Now)

- Transaction history view per account
- Daily sales reports
- Drink inventory tracking
- Multiple POS support
- Offline mode

## Implementation Order

1. Create ItemsContext and ItemStore
2. Create transaction service functions
3. Update AccountDrawer with tabs
4. Build Charge Drinks tab with DrinkCard components
5. Build Add Payment tab
6. Add balance display to drawer header
7. Write tests
8. Update CLAUDE.md with POS patterns
