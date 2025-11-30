# User Sync Button Feature Design

**Date:** 2025-11-29
**Status:** Approved

## Overview

Add a Firebase Cloud Function that can be triggered from the UI to sync Slack workspace members with Firestore accounts. The function will execute the existing update-users script logic and return detailed results to display in the UI.

## Requirements

- Any authenticated user can trigger the sync
- Button appears on the Account Grid page
- Always executes real changes (DRY_RUN=false)
- Shows detailed results of all changes made

## Architecture: Callable Function Approach

We chose the Firebase Callable Function approach because:

- Simplest implementation for synchronous operations
- Direct request/response pattern fits the use case
- Built-in authentication handling via Firebase SDK
- Should complete well within the 60-second timeout limit
- Easy to migrate to background processing if needed later

### Alternative Approaches Considered

**Background Function + Status Document:** More complex, better for very large operations with real-time progress. Overkill for current needs.

**Direct Script Execution:** Doesn't meet requirement for in-app UI control.

## Implementation

### 1. Firebase Functions Setup

Since the project currently has no Cloud Functions, we need to initialize the functions infrastructure.

**Project Structure:**

```
functions/
├── package.json          # Node.js dependencies for functions
├── tsconfig.json         # TypeScript config for functions
├── src/
│   ├── index.ts         # Main entry point, exports all functions
│   ├── updateUsers.ts   # The callable function
│   └── shared/          # Shared code between functions
│       └── updateUsersLogic.ts  # Extracted logic from bin/update-users.ts
```

**Dependencies:**

- `firebase-functions` - Cloud Functions SDK
- `firebase-admin` - Admin SDK for Firestore/Auth access
- `@slack/web-api` - Slack API client
- TypeScript tooling (`typescript`, `@types/node`)

**Configuration:**

- Update `firebase.json` to include functions config
- Configure `SLACK_BOT_TOKEN` environment variable via Firebase config
- Set up separate dev/prod function deployments

**Code Reuse:**
The existing `bin/update-users.ts` script will be refactored into a reusable module in `functions/src/shared/updateUsersLogic.ts`. This allows:

1. Firebase callable function to use it (for UI-triggered syncs)
2. Potential scheduled function to use it (for automatic daily syncs)
3. Original bin script to use it (for manual CLI usage)

### 2. The Firebase Callable Function

**Function Signature:**

```typescript
// functions/src/updateUsers.ts
import {onCall, HttpsError} from 'firebase-functions/v2/https';
import {executeUpdateUsers} from './shared/updateUsersLogic';

export const updateUsers = onCall(async (request) => {
  // Authentication check
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be logged in');
  }

  // Execute the sync logic with DRY_RUN=false
  const results = await executeUpdateUsers({dryRun: false});

  // Return detailed results
  return results;
});
```

**Results Format:**

```typescript
{
  summary: {
    created: 5,    // Number of new accounts created
    updated: 12,   // Number of accounts updated
    deleted: 2,    // Number of accounts deleted
    total: 19      // Total operations performed
  },
  details: {
    created: [
      {
        id: 'U123',
        name: 'John Doe',
        email: 'john@akeneo.com',
        reason: 'New Slack member'
      }
    ],
    updated: [
      {
        id: 'U456',
        name: 'Jane Smith',
        changes: ['profile_picture', 'isEmployee'],
        before: { isEmployee: false, profilePicture: 'old.jpg' },
        after: { isEmployee: true, profilePicture: 'new.jpg' }
      }
    ],
    deleted: [
      {
        id: 'U789',
        name: 'Bob Jones',
        reason: 'No Slack presence, no purchases'
      }
    ]
  },
  executedAt: '2025-11-29T10:30:00Z',
  slackWorkspace: 'Akeneo'
}
```

**Error Handling:**

- **Unauthenticated requests**: Throw `HttpsError('unauthenticated')`
- **Slack API failures**: Return error with descriptive message
- **Firestore write failures**: Return partial results + error details
- **Invalid SLACK_BOT_TOKEN**: Clear error message
- All errors logged to Cloud Functions logs for debugging

**Security:**

- Built-in authentication check via Firebase SDK
- User token verified automatically by callable function framework
- No additional authorization needed (any authenticated user allowed)
- `SLACK_BOT_TOKEN` stored securely in Firebase environment config

### 3. UI Implementation

**Button Location:**
Add to `AccountGrid` page (`src/pages/AccountGrid.tsx`), positioned prominently in a toolbar area above the account cards grid.

**Component State:**

```typescript
const [isUpdating, setIsUpdating] = useState(false);
const [results, setResults] = useState<SyncResults | null>(null);
const [error, setError] = useState<string | null>(null);

const handleUpdateUsers = async () => {
  setIsUpdating(true);
  setError(null);
  try {
    const updateUsers = httpsCallable(functions, 'updateUsers');
    const response = await updateUsers();
    setResults(response.data as SyncResults);
  } catch (err) {
    setError(err.message || 'Failed to sync users');
  } finally {
    setIsUpdating(false);
  }
};
```

**User Experience Flow:**

1. **Initial State**

   - Button shows "Sync Users from Slack" with refresh icon
   - Enabled for all authenticated users
   - Styled to match existing Chakra UI components

2. **During Execution** (5-15 seconds typically)

   - Button disabled with spinner
   - Shows "Syncing..." text
   - User cannot trigger multiple syncs simultaneously

3. **After Completion**
   - Modal/drawer opens showing detailed results
   - Account grid automatically refreshes to show updated data
   - Button returns to initial state

**Results Display (Modal):**

**Header:**

- Title: "User Sync Results"
- Timestamp: When the sync was executed

**Summary Section:**

- Color-coded cards/badges showing counts:
  - Green: "3 Created"
  - Blue: "5 Updated"
  - Red: "1 Deleted"
  - Total: "9 Changes"

**Detailed Lists (Expandable Sections):**

**Created Users:**

```
[Avatar] John Doe
john@akeneo.com
New Slack member

[Avatar] Jane Smith
jane@akeneo.com
New Slack member
```

**Updated Users:**

```
[Avatar] Bob Wilson
• Profile picture updated
• Marked as employee

[Avatar] Alice Johnson
• Profile picture updated
```

**Deleted Users:**

```
[Avatar] Tom Brown
Inactive, no purchases

[Avatar] Sarah Davis
Not in Slack workspace, no purchases
```

**Footer:**

- "Close" button to dismiss modal
- Account grid refreshes automatically when modal closes

**Styling:**

- Use Chakra UI components: `Button`, `Modal`, `ModalOverlay`, `ModalContent`, `Badge`, `List`, `ListItem`, `Avatar`
- Color scheme:
  - Green badges/accents for created users
  - Blue badges/accents for updated users
  - Red badges/accents for deleted users
- Compact, scannable format
- Consistent with existing AccountGrid design

**Error Handling:**

- Show error toast (Chakra UI `useToast`) for failures
- Display user-friendly error messages
- Preserve error details for debugging

## Deployment Strategy

**Development:**

1. Test locally using Firebase emulators
2. Deploy to dev environment first
3. Verify function works with dev Slack workspace

**Production:**

1. Configure production `SLACK_BOT_TOKEN` via Firebase config
2. Deploy functions alongside existing hosting deployment
3. Update CI/CD pipeline to include function deployment

**Environment Variables:**

- Dev: Use test Slack workspace token
- Prod: Use production Slack workspace token
- Both stored securely in Firebase environment config

## Testing Strategy

**Unit Tests:**

- Test `updateUsersLogic` module independently
- Mock Slack API and Firestore calls
- Verify correct CREATE/UPDATE/DELETE logic

**Integration Tests:**

- Test callable function with test auth context
- Verify results format matches expected structure
- Test error handling paths

**Manual Testing:**

- Test in Firebase emulator with mock Slack data
- Verify UI shows loading states correctly
- Verify results modal displays all details
- Test error scenarios (invalid token, network failures)

## Future Enhancements

Potential improvements not included in initial implementation:

1. **Scheduled Automatic Syncs:** Add a scheduled function to run sync daily/weekly
2. **Sync History:** Store sync results in Firestore for audit trail
3. **Admin-Only Access:** Add role-based access control if needed
4. **Dry Run Mode:** Add option to preview changes before applying
5. **Progress Updates:** Migrate to background function with real-time progress if workspace grows large
6. **Selective Sync:** Allow syncing specific users or departments
7. **Slack Event Webhooks:** Real-time sync when users join/leave Slack

## Success Criteria

- ✅ Any authenticated user can click button on AccountGrid page
- ✅ Button triggers Firebase callable function
- ✅ Function executes update-users logic with real changes
- ✅ Detailed results returned and displayed in modal
- ✅ Account grid refreshes after sync completes
- ✅ Error handling for all failure scenarios
- ✅ Function deploys successfully to Firebase
- ✅ Works in both dev and production environments
