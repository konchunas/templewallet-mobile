import * as Keychain from 'react-native-keychain';
import { BehaviorSubject } from 'rxjs';

import { biometryKeychainOptions } from '../utils/keychain.utils';

export const mockShelter = {
  lockApp: jest.fn(() => {
    mockShelter._isLocked$.next(true);
  }),
  getBiometryPassword: jest.fn(() => Keychain.getGenericPassword(biometryKeychainOptions)),
  _isLocked$: new BehaviorSubject<boolean>(true),
  unlockApp$: jest.fn(() => {
    mockShelter._isLocked$.next(false);

    return new BehaviorSubject(true);
  })
};

jest.mock('./shelter', () => ({
  Shelter: mockShelter
}));
