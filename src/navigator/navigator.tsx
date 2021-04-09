import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import { ImportAccount } from '../screens/import-account/import-account';
import { CreateAccount } from '../screens/create-account/create-account';
import { isConfirmation, isLocked } from '../app/app';
import { ScreensEnum, ScreensParamList } from './screens.enum';
import { EnterPassword } from '../screens/enter-password/enter-password';
import { ConfirmationWindow } from '../screens/confirmation-window/confirmation-window';
import { WalletTabs } from './wallet-tabs';
import { Welcome } from '../screens/welcome/welcome';
import { useIsAuthorisedSelector } from '../store/wallet/wallet-selectors';

const Stack = createStackNavigator<ScreensParamList>();

export const Navigator = () => {
  const isAuthorised = useIsAuthorisedSelector();

  return (
    <>
      <Stack.Navigator headerMode="none">
        {!isAuthorised ? (
          <>
            <Stack.Screen name={ScreensEnum.Welcome} component={Welcome} />
            <Stack.Screen name={ScreensEnum.ImportAccount} component={ImportAccount} />
            <Stack.Screen name={ScreensEnum.CreateAccount} component={CreateAccount} />
          </>
        ) : (
          <Stack.Screen name={ScreensEnum.Wallet} component={WalletTabs} />
        )}
      </Stack.Navigator>

      {isAuthorised && (
        <>
          {isLocked && <EnterPassword />}
          {isConfirmation && <ConfirmationWindow />}
        </>
      )}
    </>
  );
};
