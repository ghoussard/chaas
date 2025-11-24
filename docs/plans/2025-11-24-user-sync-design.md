# User Sync Script Design

**Date:** 2025-11-24
**Purpose:** Automated script to sync user data from Slack to Firestore accounts

## Overview

A TypeScript script that updates Firestore accounts based on current Slack workspace state. Updates profile pictures, manages employee status, and removes inactive accounts with no transaction history.

## Requirements

### Employee Status Logic

- **`isEmployee: true`** - Active Slack user with `@akeneo.com` or `@getakeneo.com` email
- **Delete account** - Slack user deleted/disabled AND `totalPurchased === 0`
- **`isEmployee: false`** - Slack user deleted/disabled BUT `totalPurchased > 0` (preserve purchase history)

### Picture Updates

- Update `pictureUrl` only when Slack picture URL has changed
- Use `image_192` field from Slack user profile

### Environment

- Works against current Firebase configuration (DEV emulators or PROD)
- Uses `SLACK_BOT_TOKEN` environment variable
- Follows existing `bin/fixtures.ts` pattern

## Architecture

### High-Level Flow

1. **Initialize Services**

   - Create Firebase app using `Env.DEV`
   - Initialize Slack WebClient with token from env
   - Fail fast if token missing

2. **Fetch Data**

   - Get all Slack users via `client.users.list()`
   - Get all Firestore accounts
   - Index Slack users by ID for O(1) lookup

3. **Process Updates**

   - For each account, determine action: UPDATE / DELETE / NO_CHANGE
   - Check employee status based on Slack presence + email domain
   - Compare picture URLs
   - Group operations for reporting

4. **Apply Changes**
   - Use `writeBatch()` for atomic updates (max 500 operations)
   - Log all changes clearly
   - Exit with status code

## Core Logic

### Employee Status Check

```typescript
const isActiveEmployee = (slackUser: User | undefined): boolean => {
  if (!slackUser || slackUser.deleted) return false;

  const email = slackUser.profile?.email;
  if (!email) return false;

  return email.endsWith('@akeneo.com') || email.endsWith('@getakeneo.com');
};
```

### Action Determination

```typescript
type AccountAction =
  | {type: 'DELETE'; reason: 'no-slack-no-purchases'}
  | {type: 'UPDATE'; changes: {isEmployee?: boolean; pictureUrl?: string}}
  | {type: 'NO_CHANGE'};

const determineAction = (
  account: Account,
  slackUser: User | undefined,
): AccountAction => {
  const isEmployee = isActiveEmployee(slackUser);
  const slackPictureUrl = slackUser?.profile?.image_192;

  // Deletion: not in Slack + no purchase history
  if (!slackUser || slackUser.deleted) {
    if (account.activity.totalPurchased === 0) {
      return {type: 'DELETE', reason: 'no-slack-no-purchases'};
    }
  }

  const changes: {isEmployee?: boolean; pictureUrl?: string} = {};

  if (account.isEmployee !== isEmployee) {
    changes.isEmployee = isEmployee;
  }

  if (slackPictureUrl && account.slack.pictureUrl !== slackPictureUrl) {
    changes.pictureUrl = slackPictureUrl;
  }

  return Object.keys(changes).length > 0
    ? {type: 'UPDATE', changes}
    : {type: 'NO_CHANGE'};
};
```

## Performance Strategy

### Data Collection

- Fetch all data upfront using `Promise.all()` to avoid N+1 queries
- Slack API handles pagination internally
- Index Slack users by ID in Map for O(1) lookup
- Use existing `activity.totalPurchased` field (no need to query transactions)

### Batch Operations

- Use Firestore `writeBatch()` for atomic operations
- Max 500 operations per batch
- If >500 operations, create multiple batches sequentially
- Each batch can contain both updates and deletes

### Example Output

```
Fetching data...
✓ Found 127 Slack users
✓ Found 143 accounts in Firestore

Processing accounts...
→ 3 accounts to delete (no Slack + no purchases)
→ 12 accounts to update (isEmployee changes)
→ 24 accounts to update (picture URLs)
→ 104 accounts unchanged

Applying changes...
Batch 1/1 (39 operations)
✓ Deleted: john.doe (U123ABC)
✓ Updated isEmployee→false: jane.smith (U456DEF)
✓ Updated picture: bob.jones (U789GHI)

Complete! 39 changes applied.
```

## Error Handling

### Slack API Errors

- Fail immediately if `SLACK_BOT_TOKEN` missing or invalid
- Clear error if bot lacks required scopes (`users:read`, `users:read.email`)
- Let rate limits bubble up (unlikely with single `users.list` call)

### Firestore Errors

- Batch commit failures: Log which batch failed and exit
- No partial application of changes
- Network errors: Bubble up with stack trace
- No retry logic (script is idempotent, can be re-run)

### Edge Cases

- **Bot users**: Skip entirely (bots don't have employee status)
- **Missing email**: Warn and treat as non-employee
- **Missing `isEmployee` field**: Add during update (backward compatibility)

## Implementation

### Files to Modify

- `src/models/account.ts` - Add `isEmployee: boolean` field
- `bin/update-users.ts` - New script file
- `package.json` - Add `"update-users": "tsx bin/update-users.ts"` script

### Dependencies

- Install `@slack/web-api` (official Slack SDK)
- Already available: `firebase`, `firestore`, `tsx`

### Script Pattern

```typescript
import {exit} from 'process';
import {getFirestore} from 'firebase/firestore';
import {createFirebaseApp, Env} from '../src/utils/firebase';
import {WebClient} from '@slack/web-api';

const token = process.env.SLACK_BOT_TOKEN;
if (!token) {
  console.error('Error: SLACK_BOT_TOKEN environment variable required');
  exit(1);
}

const slack = new WebClient(token);
const app = createFirebaseApp(Env.DEV);
const firestore = getFirestore(app);

// Main logic...

exit(0);
```

### Usage

```bash
# Set token
export SLACK_BOT_TOKEN=xoxb-your-token-here

# Run script
yarn update-users

# Or with emulators
firebase emulators:exec --project chaas-dev \
  --only firestore,auth \
  'tsx bin/update-users.ts'
```

## Required Slack Bot Scopes

- `users:read` - To call `users.list`
- `users:read.email` - To access user email addresses for domain filtering
