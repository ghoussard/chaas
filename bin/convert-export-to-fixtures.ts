import * as fs from 'fs';
import * as path from 'path';
import {randomUUID} from 'crypto';
import {fileURLToPath} from 'url';
import type {Account, Item, Transaction} from '../src/models';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Export file types
type ExportUser = {
  id: string; // Slack user ID
  name: string; // username
  profile: {
    first_name: string;
    last_name: string;
    image_192: string;
    email?: string;
    position?: string;
    team?: string;
    city?: string;
    first_day?: string;
  };
};

type ExportItem = {
  enabled: boolean;
  name: string;
  order: number;
  picture: string;
  price: number; // in cents
  volume: number;
};

type ExportClient = {
  id: string; // Slack user ID
  identifier: string;
  name: string;
  avatar: string;
  purchases: number;
  payments: number;
};

type ExportPurchase = {
  id: string;
  time: number; // milliseconds
  canceled: boolean;
  client: ExportClient;
  item: ExportItem;
};

type ExportPayment = {
  id: string;
  time: number; // milliseconds
  amount: number; // in cents
  canceled: boolean;
  client: ExportClient;
};

type ExportData = {
  barels?: unknown;
  clientTabs?: unknown;
  drinkTypes?: unknown;
  users: Record<string, ExportUser>;
  items: Record<string, ExportItem>;
  purchases: Record<string, ExportPurchase>;
  payments: Record<string, ExportPayment>;
};

// Get export file path from command line arguments
const exportFilePath = process.argv[2];

if (!exportFilePath) {
  console.error('Error: Export file path is required');
  console.error('Usage: yarn convert-fixtures <path-to-export.json>');
  process.exit(1);
}

// Resolve to absolute path
const absoluteExportPath = path.isAbsolute(exportFilePath)
  ? exportFilePath
  : path.resolve(process.cwd(), exportFilePath);

// Check if file exists
if (!fs.existsSync(absoluteExportPath)) {
  console.error(`Error: Export file not found at ${absoluteExportPath}`);
  process.exit(1);
}

console.log(`Reading export file: ${absoluteExportPath}\n`);

// Read export file
const exportData = JSON.parse(
  fs.readFileSync(absoluteExportPath, 'utf-8'),
) as ExportData;

console.log('Export data loaded:');
console.log(`- Users: ${Object.keys(exportData.users).length.toString()}`);
console.log(`- Items: ${Object.keys(exportData.items).length.toString()}`);
console.log(
  `- Purchases: ${Object.keys(exportData.purchases).length.toString()}`,
);
console.log(
  `- Payments: ${Object.keys(exportData.payments).length.toString()}`,
);

// Step 1: Generate account mappings (Slack ID -> Account UUID)
console.log('\n[1/5] Generating account mappings...');
const slackIdToAccountId = new Map<string, string>();
const accounts: Account[] = [];

for (const [slackId, user] of Object.entries(exportData.users)) {
  const accountId = randomUUID();
  slackIdToAccountId.set(slackId, accountId);

  const fullName =
    user.profile.first_name && user.profile.last_name
      ? `${user.profile.first_name} ${user.profile.last_name}`
      : user.name;

  const isEmployee =
    user.profile.email?.endsWith('@akeneo.com') ??
    user.profile.email?.endsWith('@getakeneo.com') ??
    false;

  const account: Account = {
    id: accountId,
    slack: {
      id: slackId,
      name: fullName,
      username: user.name,
      pictureUrl: user.profile.image_192 || 'https://placehold.co/150',
    },
    activity: {
      totalPurchased: 0,
      totalPaid: 0,
      lastPurchaseTimestamp: 0,
      lastPaymentTimestamp: 0,
    },
    isEmployee,
  };

  accounts.push(account);
}

console.log(`Generated ${accounts.length.toString()} accounts`);

// Step 2: Generate item mappings (Item Name -> Item UUID)
console.log('\n[2/5] Generating item mappings...');
const itemNameToItemId = new Map<string, string>();
const items: Item[] = [];

// First, collect all unique items from purchases (includes historical items)
const itemsFromPurchases = new Map<
  string,
  {name: string; price: number; enabled: boolean; picture: string}
>();

for (const [, purchase] of Object.entries(exportData.purchases)) {
  if (!purchase.canceled) {
    const name = purchase.item.name;
    if (!itemsFromPurchases.has(name)) {
      itemsFromPurchases.set(name, {
        name: name,
        price: purchase.item.price / 100, // cents to euros
        enabled: false, // default to disabled for historical items
        picture: 'chaquip_logo.png', // default picture
      });
    }
  }
}

// Merge with items from items list, preserving enabled status and picture
for (const [, exportItem] of Object.entries(exportData.items)) {
  itemsFromPurchases.set(exportItem.name, {
    name: exportItem.name,
    price: exportItem.price / 100, // cents to euros
    enabled: exportItem.enabled,
    picture: exportItem.picture || 'chaquip_logo.png',
  });
}

// Generate UUIDs and create final items list
for (const [name, itemData] of itemsFromPurchases) {
  const itemId = randomUUID();
  itemNameToItemId.set(name, itemId);

  const item: Item = {
    id: itemId,
    name: itemData.name,
    price: itemData.price,
    enabled: itemData.enabled,
    picture: itemData.picture,
  };

  items.push(item);
}

console.log(
  `Generated ${items.length.toString()} items (${Object.keys(exportData.items).length.toString()} current, ${(items.length - Object.keys(exportData.items).length).toString()} historical)`,
);

// Step 3: Transform purchases and track account activity
console.log('\n[3/5] Transforming purchases...');
const transactions: Transaction[] = [];
let canceledPurchases = 0;
let missingAccountPurchases = 0;

// Track activity for each account
const accountActivity = new Map<
  string,
  {
    totalPurchased: number;
    totalPaid: number;
    lastPurchaseTimestamp: number;
    lastPaymentTimestamp: number;
  }
>();

for (const [, purchase] of Object.entries(exportData.purchases)) {
  if (purchase.canceled) {
    canceledPurchases++;
    continue;
  }

  const accountId = slackIdToAccountId.get(purchase.client.id);
  if (!accountId) {
    missingAccountPurchases++;
    continue;
  }

  const itemId = itemNameToItemId.get(purchase.item.name);
  if (!itemId) {
    console.warn(
      `Warning: Item not found for purchase ${purchase.id}: ${purchase.item.name}`,
    );
    continue;
  }

  const itemData = itemsFromPurchases.get(purchase.item.name);
  if (!itemData) {
    console.warn(
      `Warning: Item data not found for purchase ${purchase.id}: ${purchase.item.name}`,
    );
    continue;
  }

  const transaction: Transaction = {
    id: purchase.id,
    type: 'purchase',
    timestamp: purchase.time, // keep as milliseconds
    account: accountId,
    item: {
      id: itemId,
      name: purchase.item.name,
      price: purchase.item.price / 100, // cents to euros
      enabled: purchase.item.enabled,
      picture: itemData.picture,
    },
  };

  transactions.push(transaction);

  // Update account activity for purchases
  const activity = accountActivity.get(accountId) || {
    totalPurchased: 0,
    totalPaid: 0,
    lastPurchaseTimestamp: 0,
    lastPaymentTimestamp: 0,
  };
  activity.totalPurchased += purchase.item.price / 100; // cents to euros
  activity.lastPurchaseTimestamp = Math.max(
    activity.lastPurchaseTimestamp,
    purchase.time,
  );
  accountActivity.set(accountId, activity);
}

console.log(
  `Transformed ${transactions.length.toString()} purchases (skipped ${canceledPurchases.toString()} canceled, ${missingAccountPurchases.toString()} missing accounts)`,
);

// Step 4: Transform payments and update account activity
console.log('\n[4/5] Transforming payments...');
let canceledPayments = 0;
let missingAccountPayments = 0;
const initialTransactionCount = transactions.length;

for (const [, payment] of Object.entries(exportData.payments)) {
  if (payment.canceled) {
    canceledPayments++;
    continue;
  }

  const accountId = slackIdToAccountId.get(payment.client.id);
  if (!accountId) {
    missingAccountPayments++;
    continue;
  }

  const transaction: Transaction = {
    id: payment.id,
    type: 'payment',
    timestamp: payment.time, // keep as milliseconds
    account: accountId,
    amount: payment.amount / 100, // cents to euros
  };

  transactions.push(transaction);

  // Update account activity for payments
  const activity = accountActivity.get(accountId) || {
    totalPurchased: 0,
    totalPaid: 0,
    lastPurchaseTimestamp: 0,
    lastPaymentTimestamp: 0,
  };
  activity.totalPaid += payment.amount / 100; // cents to euros
  activity.lastPaymentTimestamp = Math.max(
    activity.lastPaymentTimestamp,
    payment.time,
  );
  accountActivity.set(accountId, activity);
}

console.log(
  `Transformed ${(transactions.length - initialTransactionCount).toString()} payments (skipped ${canceledPayments.toString()} canceled, ${missingAccountPayments.toString()} missing accounts)`,
);

// Step 5: Update accounts with calculated activity
console.log('\n[5/6] Updating accounts with activity data...');
for (const account of accounts) {
  const activity = accountActivity.get(account.id);
  if (activity) {
    account.activity = activity;
  }
}
console.log(`Updated ${accountActivity.size.toString()} accounts with activity data`);

// Step 6: Write fixture files
console.log('\n[6/6] Writing fixture files...');
const fixturesDir = path.join(
  __dirname,
  '..',
  'src',
  'utils',
  'fixtures',
  'datasets',
  'prod',
);

// Ensure directory exists
if (!fs.existsSync(fixturesDir)) {
  fs.mkdirSync(fixturesDir, {recursive: true});
}

// Write accounts
fs.writeFileSync(
  path.join(fixturesDir, 'accounts.json'),
  JSON.stringify(accounts, null, 2),
);
console.log(
  `✓ Written ${accounts.length.toString()} accounts to accounts.json`,
);

// Write items
fs.writeFileSync(
  path.join(fixturesDir, 'items.json'),
  JSON.stringify(items, null, 2),
);
console.log(`✓ Written ${items.length.toString()} items to items.json`);

// Group transactions by account
console.log('Grouping transactions by account...');
const transactionsByAccount = new Map<string, Transaction[]>();

for (const transaction of transactions) {
  const accountTransactions = transactionsByAccount.get(transaction.account) || [];
  accountTransactions.push(transaction);
  transactionsByAccount.set(transaction.account, accountTransactions);
}

// Sort accounts by transaction count (descending) for balanced distribution
const accountsWithCounts = Array.from(transactionsByAccount.entries())
  .map(([accountId, txns]) => ({
    accountId,
    transactions: txns,
    count: txns.length,
  }))
  .sort((a, b) => b.count - a.count);

console.log(`Grouped into ${accountsWithCounts.length.toString()} accounts`);

// Distribute accounts across 10 files using round-robin
const numberOfFiles = 10;
const fileTransactions: Transaction[][] = Array.from({length: numberOfFiles}, () => []);

accountsWithCounts.forEach((account, index) => {
  const fileIndex = index % numberOfFiles;
  fileTransactions[fileIndex].push(...account.transactions);
});

// Write 10 transaction files
for (let i = 0; i < numberOfFiles; i++) {
  const fileName = `transactions-${(i + 1).toString()}.json`;
  fs.writeFileSync(
    path.join(fixturesDir, fileName),
    JSON.stringify(fileTransactions[i], null, 2),
  );
  console.log(
    `✓ Written ${fileTransactions[i].length.toString()} transactions to ${fileName}`,
  );
}

// Summary
console.log('\n=== Conversion Complete ===');
console.log(`Total accounts: ${accounts.length.toString()}`);
console.log(`Total items: ${items.length.toString()}`);
console.log(`Total transactions: ${transactions.length.toString()}`);
console.log(
  `  - Purchases: ${transactions.filter((t) => t.type === 'purchase').length.toString()}`,
);
console.log(
  `  - Payments: ${transactions.filter((t) => t.type === 'payment').length.toString()}`,
);
console.log('\nFixtures written to: src/utils/fixtures/datasets/prod/');
console.log('  - 1 accounts.json file');
console.log('  - 1 items.json file');
console.log('  - 10 transactions-*.json files (grouped by account)');
console.log(
  '\nNote: Account activity has been calculated from the export data.',
);
console.log(
  'If you load only a subset of transaction files, activity may not match.',
);
