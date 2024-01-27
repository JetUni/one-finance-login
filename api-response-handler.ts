import { EventEmitter } from 'events';
import { Pockets, Transactions, TransactionsResponse } from './model.interface';

export const pockets: Pockets[] = [];
export const transactions: Transactions[] = [];

export function pocketsEventHandler(apiEventEmitter: EventEmitter) {
  apiEventEmitter.on('pockets', (responseBody) => {
    const pocketsResponse = JSON.parse(responseBody);
    pockets.push(...pocketsResponse);
  });
}

export function transactionsEventHandler(apiEventEmitter: EventEmitter) {
  apiEventEmitter.on('transactions', (responseBody) => {
    const transactionsResponse: TransactionsResponse = JSON.parse(responseBody);
    transactions.push(...transactionsResponse.transactions);
    console.log(
      `fetched ${transactionsResponse.transactions.length} transactions for ${transactionsResponse.transactions[0]?.pocket_name}`
    );
    if (!transactionsResponse.next && transactionsResponse.transactions?.length > 0) {
      console.log('last page for pocket:', transactionsResponse.transactions[0].pocket_name);
    }
  });
}
