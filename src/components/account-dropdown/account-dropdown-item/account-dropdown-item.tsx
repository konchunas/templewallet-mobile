import React, { FC } from 'react';
import { Text, View } from 'react-native';

import { emptyWalletAccount, WalletAccountInterface } from '../../../interfaces/wallet-account.interface';
import { formatSize } from '../../../styles/format-size';
import { conditionalStyle } from '../../../utils/conditional-style';
import { isDefined } from '../../../utils/is-defined';
import { getTezosToken } from '../../../utils/wallet.utils';
import { DropdownListItemComponent } from '../../dropdown/dropdown';
import { HideBalance } from '../../hide-balance/hide-balance';
import { Icon } from '../../icon/icon';
import { IconNameEnum } from '../../icon/icon-name.enum';
import { PublicKeyHashText } from '../../public-key-hash-text/public-key-hash-text';
import { RobotIcon } from '../../robot-icon/robot-icon';
import { TokenValueText } from '../../token-value-text/token-value-text';
import { useAccountDropdownItemStyles } from './account-dropdown-item.styles';

interface Props {
  account?: WalletAccountInterface;
  showFullData?: boolean;
  actionIconName?: IconNameEnum;
}

export const AccountDropdownItem: FC<Props> = ({
  account = emptyWalletAccount,
  showFullData = true,
  actionIconName
}) => {
  const styles = useAccountDropdownItemStyles();

  return (
    <View style={styles.root}>
      <RobotIcon seed={account.publicKeyHash} />
      <View style={styles.infoContainer}>
        <View style={[styles.upperContainer, conditionalStyle(showFullData, styles.upperContainerFullData)]}>
          <Text style={styles.name}>{account.name}</Text>
          {isDefined(actionIconName) && <Icon name={actionIconName} size={formatSize(24)} />}
        </View>
        <View style={styles.lowerContainer}>
          <PublicKeyHashText publicKeyHash={account.publicKeyHash} />

          {showFullData && (
            <HideBalance style={styles.balanceText}>
<<<<<<< HEAD
              {account?.tezosBalance.data} {TEZ_TOKEN_METADATA.symbol}
=======
              <TokenValueText token={getTezosToken(account?.tezosBalance.data)} />
>>>>>>> 4a8b805355b38151b514090b8ba56443d278f585
            </HideBalance>
          )}
        </View>
      </View>
    </View>
  );
};

export const renderAccountListItem: DropdownListItemComponent<WalletAccountInterface> = ({ item, isSelected }) => (
  <AccountDropdownItem account={item} {...(isSelected && { actionIconName: IconNameEnum.Check })} />
);
