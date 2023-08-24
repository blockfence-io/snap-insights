import { OnTransactionHandler } from '@metamask/snaps-types';
import {
  heading,
  panel,
  text,
  // divider,
} from '@metamask/snaps-ui';
import { Results } from './types/risks';

const VERSION = '0.1.0';
const API_ENDPOINT = 'https://api.blockfence.io/prod/analyze';
const PUBLIC_API_KEY = '6inVA3AEVe9KORFxuIU6r8xgrKiQ1O17myfbpuNa';

// Handle outgoing transactions.
export const onTransaction: OnTransactionHandler = async ({
  transaction,
  chainId,
  transactionOrigin,
}) => {
  if (!transaction.to || typeof transaction.to !== 'string') {
    return { content: text('Missing transaction destination') };
  }

  // Fetch insights
  const response = await fetch(API_ENDPOINT, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': PUBLIC_API_KEY,
    },
    body: JSON.stringify({
      version: VERSION,
      plugin: 'SNAP',
      chain_id: formatChainId(chainId),
      transaction: {
        to: transaction.to,
      },
      browser_data: {
        url: transactionOrigin,
      },
    }),
  });

  if (!response.ok) {
    try {
      const data: Results = await response.json();
      if (data.message) {
        return {
          content: text(data.message),
        };
      }
      // eslint-disable-next-line no-empty
    } catch (error) {}

    return {
      content: text(
        'Unable to fetch results from blockfence, please try again later.',
      ),
    };
  }

  const data: Results = await response.json();

  const formattedInsights = data.insights.map((insight) => [
    text(`**${insight.title}**`),
    text(insight.description),
    // divider(),
  ]);

  const flatInsights = formattedInsights.reduce(
    (acc, curr) => acc.concat(curr),
    [],
  );

  // Display percentage of gas fees in the transaction insights UI.
  return {
    content: panel([heading('Blockfence Analysis'), ...flatInsights]),
  };
};

/**
 * Formats the chain ID string.
 *
 * @param chainId - The chain ID to be formatted.
 * @returns The formatted chain ID string.
 */
function formatChainId(chainId: string): string {
  const parts = chainId.split(':');
  if (parts.length !== 2) {
    return '0x1'; // Mainnet by default
  }
  return `0x${parts[1]}`;
}
