import { AccountInterface } from '../../interfaces/account.interface';
import { createActions } from '../create-actions';

export interface ImportAccountPayload {
  seedPhrase: string;
  password: string;
}

export const importWalletActions = createActions<ImportAccountPayload, AccountInterface, string>('@wallet/import');
export const createWalletActions = createActions<string, AccountInterface, string>('@wallet/create');
