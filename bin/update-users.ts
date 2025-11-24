import {exit} from 'process';
import {randomUUID} from 'crypto';
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  writeBatch,
} from 'firebase/firestore';
import {getAuth, signInWithEmailAndPassword} from 'firebase/auth';
import {WebClient} from '@slack/web-api';
import {createFirebaseApp, Env} from '../src/utils/firebase';
import {Account} from '../src/models';

// Minimal Slack Member type definition for our needs
type Member = {
  id?: string;
  name?: string;
  deleted?: boolean;
  is_bot?: boolean;
  profile?: {
    email?: string;
    image_192?: string;
  };
};

// Validate token
const token = process.env.SLACK_BOT_TOKEN;
if (!token) {
  console.error('Error: SLACK_BOT_TOKEN environment variable required');
  console.error('Set it with: export SLACK_BOT_TOKEN=xoxb-your-token-here');
  exit(1);
}

// Dry-run mode (default: true for safety)
const isDryRun = process.env.DRY_RUN !== 'false';

// Initialize services
const slack = new WebClient(token);
const app = createFirebaseApp(Env.DEV);
const firestore = getFirestore(app);
const auth = getAuth(app);

type AccountAction =
  | {type: 'DELETE'; reason: string; account: Account}
  | {
      type: 'UPDATE';
      account: Account;
      changes: {isEmployee?: boolean; pictureUrl?: string};
    }
  | {type: 'CREATE'; slackUser: Member}
  | {type: 'NO_CHANGE'};

const isActiveEmployee = (slackUser: Member | undefined): boolean => {
  if (!slackUser || slackUser.deleted) return false;

  const email = slackUser.profile?.email;
  if (!email) return false;

  return email.endsWith('@akeneo.com') || email.endsWith('@getakeneo.com');
};

const determineAction = (
  account: Account,
  slackUser: Member | undefined,
): AccountAction => {
  const isEmployee = isActiveEmployee(slackUser);
  const slackPictureUrl = slackUser?.profile?.image_192;

  // Deletion case: not in Slack + no purchase history
  if (!slackUser || slackUser.deleted) {
    if (account.activity.totalPurchased === 0) {
      return {
        type: 'DELETE',
        reason: 'no-slack-no-purchases',
        account,
      };
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
    ? {type: 'UPDATE', account, changes}
    : {type: 'NO_CHANGE'};
};

const applyActions = async (actions: AccountAction[]) => {
  const updates = actions.filter((a) => a.type === 'UPDATE');
  const deletes = actions.filter((a) => a.type === 'DELETE');
  const creates = actions.filter((a) => a.type === 'CREATE');

  console.log('Applying changes...');

  const allOperations = [...creates, ...updates, ...deletes];
  const batchSize = 500;
  const batches = Math.ceil(allOperations.length / batchSize);

  for (let i = 0; i < batches; i++) {
    const batchOps = allOperations.slice(i * batchSize, (i + 1) * batchSize);
    const batch = writeBatch(firestore);

    for (const op of batchOps) {
      if (op.type === 'CREATE') {
        const accountId = randomUUID();
        const accountRef = doc(firestore, 'accounts', accountId);

        const fullName =
          op.slackUser.profile?.email?.split('@')[0]?.replace(/[._]/g, ' ') ??
          op.slackUser.name ??
          'Unknown';

        const newAccount: Account = {
          id: accountId,
          slack: {
            id: op.slackUser.id ?? '',
            name: fullName,
            username: op.slackUser.name ?? '',
            pictureUrl:
              op.slackUser.profile?.image_192 ?? 'https://placehold.co/150',
          },
          activity: {
            totalPurchased: 0,
            totalPaid: 0,
            lastPurchaseTimestamp: 0,
            lastPaymentTimestamp: 0,
          },
          isEmployee: true,
        };

        batch.set(accountRef, newAccount);
        console.log(
          `+ Created: ${newAccount.slack.name} (${newAccount.slack.id})`,
        );
      } else if (op.type === 'UPDATE') {
        const accountRef = doc(firestore, 'accounts', op.account.id);
        const updateData: Record<string, string | boolean> = {};

        if (op.changes.isEmployee !== undefined) {
          updateData.isEmployee = op.changes.isEmployee;
        }

        if (op.changes.pictureUrl) {
          updateData['slack.pictureUrl'] = op.changes.pictureUrl;
        }

        batch.update(accountRef, updateData);

        // Log the update
        const changeParts = [];
        if (op.changes.isEmployee !== undefined) {
          changeParts.push(`isEmployee→${String(op.changes.isEmployee)}`);
        }
        if (op.changes.pictureUrl) {
          changeParts.push('picture');
        }
        console.log(
          `✓ Updated ${changeParts.join(', ')}: ${op.account.slack.name} (${op.account.slack.id})`,
        );
      } else {
        // DELETE case
        const accountRef = doc(firestore, 'accounts', op.account.id);
        batch.delete(accountRef);
        console.log(
          `✗ Deleted: ${op.account.slack.name} (${op.account.slack.id})`,
        );
      }
    }

    console.log(
      `Batch ${String(i + 1)}/${String(batches)} (${String(batchOps.length)} operations)`,
    );
    await batch.commit();
  }
};

const main = async () => {
  // Sign in to Firebase Auth
  await signInWithEmailAndPassword(auth, 'michel@chaquip.com', 'michel');

  if (isDryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be applied');
    console.log('   Set DRY_RUN=false to apply changes\n');
  }

  console.log('Fetching data...');

  // Fetch all Slack users with pagination support
  const allSlackMembers: Member[] = [];
  let cursor: string | undefined;

  do {
    const response = await slack.users.list({
      cursor,
      limit: 1000, // Max allowed by Slack API
    });

    if (!response.members) {
      console.error('Error: Failed to fetch Slack users');
      exit(1);
    }

    allSlackMembers.push(...response.members);
    cursor = response.response_metadata?.next_cursor;
  } while (cursor);

  // Fetch Firestore accounts
  const accountsSnapshot = await getDocs(collection(firestore, 'accounts'));

  console.log(`✓ Found ${String(allSlackMembers.length)} Slack users`);
  console.log(`✓ Found ${String(accountsSnapshot.size)} accounts in Firestore`);

  // Index Slack users by ID
  const slackUserMap = new Map<string, Member>();
  for (const member of allSlackMembers) {
    // Skip bots
    if (member.is_bot) continue;

    if (member.id) {
      slackUserMap.set(member.id, member);
    }

    // Warn about missing email
    if (!member.profile?.email && !member.deleted) {
      console.warn(
        `⚠ User ${member.id ?? 'unknown'} (${member.name ?? 'unknown'}) has no email, treating as non-employee`,
      );
    }
  }

  // Process all accounts
  console.log('\nProcessing accounts...');
  const actions: AccountAction[] = [];

  // Track existing account Slack IDs
  const existingSlackIds = new Set<string>();

  for (const accountDoc of accountsSnapshot.docs) {
    const account = accountDoc.data() as Account;
    existingSlackIds.add(account.slack.id);
    const slackUser = slackUserMap.get(account.slack.id);
    const action = determineAction(account, slackUser);
    actions.push(action);
  }

  // Find new employees to create accounts for
  for (const [slackId, slackUser] of slackUserMap) {
    if (!existingSlackIds.has(slackId) && isActiveEmployee(slackUser)) {
      actions.push({type: 'CREATE', slackUser});
    }
  }

  // Summarize actions
  const toCreate = actions.filter((a) => a.type === 'CREATE');
  const toDelete = actions.filter((a) => a.type === 'DELETE');
  const toUpdate = actions.filter((a) => a.type === 'UPDATE');
  const toUpdateEmployee = toUpdate.filter(
    (a) => a.changes.isEmployee !== undefined,
  );
  const toUpdatePicture = toUpdate.filter(
    (a) => a.changes.pictureUrl !== undefined,
  );
  const unchanged = actions.filter((a) => a.type === 'NO_CHANGE');

  console.log(
    `→ ${String(toCreate.length)} accounts to create (new employees)`,
  );
  console.log(
    `→ ${String(toDelete.length)} accounts to delete (no Slack + no purchases)`,
  );
  console.log(
    `→ ${String(toUpdateEmployee.length)} accounts to update (isEmployee changes)`,
  );
  console.log(
    `→ ${String(toUpdatePicture.length)} accounts to update (picture URLs)`,
  );
  console.log(`→ ${String(unchanged.length)} accounts unchanged\n`);

  // Apply changes
  const operationalActions = actions.filter((a) => a.type !== 'NO_CHANGE');

  if (operationalActions.length === 0) {
    console.log('No changes needed.');
  } else if (isDryRun) {
    console.log('🔍 DRY RUN - Changes identified but not applied:');
    console.log(
      `   ${String(operationalActions.length)} total operations would be performed`,
    );
    console.log(`   Run with DRY_RUN=false to apply changes`);
  } else {
    await applyActions(operationalActions);
    console.log(
      `\n✓ Complete! ${String(operationalActions.length)} changes applied.`,
    );
  }

  exit(0);
};

main().catch((error: unknown) => {
  console.error('Error:', error);
  exit(1);
});
