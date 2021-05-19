export enum ScreensEnum {
  Welcome = 'Welcome',
  ImportAccount = 'ImportAccount',
  CreateAccount = 'CreateAccount',
  EnterPassword = 'EnterPassword',
  ConfirmationWindow = 'ConfirmationWindow',
  Wallet = 'Wallet',
  TezosTokenScreen = 'TezosTokenScreen',
  TokenScreen = 'TokenScreen',
  DApps = 'DApps',
  Swap = 'Swap',
  Settings = 'Settings',
  CreateHdAccount = 'CreateHdAccount'
}

export type WalletStackScreensParamList = {
  [ScreensEnum.Wallet]: undefined;
  [ScreensEnum.TezosTokenScreen]: undefined;
  [ScreensEnum.TokenScreen]: { slug: string };
};

export type DAppsStackScreensParamList = {
  [ScreensEnum.DApps]: undefined;
};

export type SwapStackScreensParamList = {
  [ScreensEnum.Swap]: undefined;
};

export type SettingsStackScreensParamList = {
  [ScreensEnum.Settings]: undefined;
  [ScreensEnum.CreateHdAccount]: undefined;
};

export type TabScreensParamList = WalletStackScreensParamList &
  DAppsStackScreensParamList &
  SwapStackScreensParamList &
  SettingsStackScreensParamList;

export type ScreensParamList = {
  [ScreensEnum.Welcome]: undefined;
  [ScreensEnum.ImportAccount]: undefined;
  [ScreensEnum.CreateAccount]: undefined;
  [ScreensEnum.EnterPassword]: undefined;
  [ScreensEnum.ConfirmationWindow]: undefined;
} & TabScreensParamList;
