/**
 * /!\ This scripts works only with the old schema.
 * It fetches client tabs, filter those which have a debt
 * superior or equals to the minimum debt and notify them on Slack
 * to pay using the sumup link.
 * Use it like that:
 * yarn tsx --env-file=scripts/.env --env-file=scripts/.env.local scripts/notifyDebtors.ts [minimum_debt] [sumup_link]
 */

import bolt from '@slack/bolt';
import {argv, exit} from 'process';

const getMinimumDebt = (): number => {
  const minimumDebtArg = argv[2] ?? null;

  if (minimumDebtArg === null) {
    console.error('Please, provide the minimum debt as first argument');
    exit(0);
  }

  const minimumDebt = parseInt(minimumDebtArg);

  if (Number.isNaN(minimumDebt)) {
    console.error('Please, provide a number for the minimum debt');
    exit(0);
  }

  return minimumDebt;
};

const getSumupLink = (): string => {
  const sumupLink = argv[3] ?? null;

  if (sumupLink === null) {
    console.error('Please, provide the sumup link as second argument');
    exit(1);
  }

  return sumupLink;
};

const isDryRun = (): boolean => {
  return argv.includes('--dry-run');
};

const sumupLink = getSumupLink();
const minimumDebt = getMinimumDebt();

const blocks = (debt: number) => [
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: ':chaquip-cat: *Hey dear Chaquiper!* :chaquip-cat:',
    },
  },
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `:money_with_wings: This is an automatic message from the Chaquip team because *your tab has gone over ${minimumDebt}€.*`,
    },
  },
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `You owe *${debt}€* to the Chaquip.`,
    },
  },
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `We’re sure you’ll drop by soon, but if not, you can settle up with this link: ${sumupLink}`,
    },
  },
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: ':warning: *Make sure to include your name when paying (so we don’t have to play detective to credit your account).*',
    },
  },
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: 'No worries, this message is 100% legit! If you’re unsure or you have any question, feel free to check with any of the Chaquip staff members.',
    },
  },
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: 'Bisous',
    },
  },
];

const sendDmToUser = async (slackUserId: string, debt: number) => {
  try {
    const response = await slackApp.client.conversations.open({
      users: slackUserId,
    });

    const channelId = response.channel?.id ?? null;

    if (channelId === null) {
      throw new Error('Returned channel ID is null');
    }

    await slackApp.client.chat.postMessage({
      channel: channelId,
      text: 'Chaquip reminder',
      blocks: blocks(debt),
    });

    console.info(`Slack user (id: ${slackUserId}) notified`);
  } catch (e: any) {
    console.warn(
      `Unable to notify Slack user (id: ${slackUserId}): ${e.message}`,
    );
  }
};

type RawClientTab = {
  id: string;
  purchases: number;
  payments: number;
};

type ClientTab = {
  slackUserId: string;
  debt: number;
};

const isRawClientTabs = (
  value: unknown,
): value is Record<string, RawClientTab> => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidates = Object.values(value);
  for (const candidate of candidates) {
    const isRawClientTab =
      'id' in candidate && 'purchases' in candidate && 'payments' in candidate;
    if (!isRawClientTab) {
      return false;
    }
  }

  return true;
};

const fetchClientsTabs = async (): Promise<ClientTab[]> => {
  const url = `${process.env.FIREBASE_URL}/clientTabs.json`;
  const response = await fetch(url);
  const clientTabs = await response.json();

  if (!isRawClientTabs(clientTabs)) {
    console.error('Unable to fetch client tabs');
    exit(0);
  }

  return Object.values(clientTabs).map(({id, payments, purchases}) => ({
    slackUserId: id,
    debt: (purchases - payments) / 100,
  }));
};

type User = {
  name: string;
  profile: {
    first_name?: string;
    last_name?: string;
  };
};

const isUsers = (value: unknown): value is Record<string, User> => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidates = Object.values(value);

  for (const candidate of candidates) {
    const isUser = 'name' in candidate && 'profile' in candidate;
    if (!isUser) {
      return false;
    }
  }

  return true;
};

const printDebtors = async (clientTabs: ClientTab[]) => {
  const url = `${process.env.FIREBASE_URL}/users.json`;
  const response = await fetch(url);
  const users = await response.json();

  if (!isUsers(users)) {
    console.error('Unable to fetch users');
    return;
  }

  clientTabs.forEach(({slackUserId, debt}) => {
    const user = users[slackUserId];
    console.info(
      `${user.profile.first_name ?? ''} ${user.profile.last_name ?? ''} (id: ${slackUserId}, username: @${user.name}) owe us ${debt}€`,
    );
  });
};

const slackApp = new bolt.App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

const clientTabs = await fetchClientsTabs();
const clientTabsWhichNeedsToPay = clientTabs.filter(
  ({debt}) => debt >= minimumDebt,
);

console.info('The following debtors will be notified:\n');

await printDebtors(clientTabsWhichNeedsToPay);

console.info();

if (isDryRun()) {
  console.info('Command ran with dry-run mode, no one will be notified');
  exit(0);
}

console.info('Starting to notify debtor one by one...');

for (const clientTab of clientTabsWhichNeedsToPay) {
  await sendDmToUser(clientTab.slackUserId, clientTab.debt);
}

console.info('Finished!');

exit(0);
