import { createEntity } from '../store/create-entity';
import { mockAccountTokens } from '../token/interfaces/account-token.interface.mock';
import { AccountStateInterface } from './account-state.interface';
import { mockAppliedActivityGroups, mockPendingActivityGroups } from './activity.interface.mock';

export const mockAccountState: AccountStateInterface = {
  tezosBalance: createEntity('100'),
  tokensList: mockAccountTokens,
  activityGroups: createEntity(mockAppliedActivityGroups),
  pendingActivities: mockPendingActivityGroups
};
