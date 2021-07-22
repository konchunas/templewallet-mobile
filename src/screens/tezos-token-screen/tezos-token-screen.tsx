import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { HeaderCardActionButtons } from '../../components/header-card-action-buttons/header-card-action-buttons';
import { HeaderCard } from '../../components/header-card/header-card';
import { PublicKeyHashText } from '../../components/public-key-hash-text/public-key-hash-text';
import { TokenEquityValue } from '../../components/token-equity-value/token-equity-value';
import { TokenScreenContentContainer } from '../../components/token-screen-content-container/token-screen-content-container';
import { loadSelectedBakerActions } from '../../store/baking/baking-actions';
import { useTokensExchangeRatesSelector } from '../../store/currency/currency-selectors';
import { loadActivityGroupsActions, loadTezosBalanceActions } from '../../store/wallet/wallet-actions';
import { useSelectedAccountSelector, useTezosTokenSelector } from '../../store/wallet/wallet-selectors';
import { formatSize } from '../../styles/format-size';
import { TEZ_TOKEN_METADATA } from '../../token/data/tokens-metadata';
import { TezosTokenHistory } from './tezos-token-history/tezos-token-history';
import { TezosTokenInfo } from './tezos-token-info/tezos-token-info';

export const TezosTokenScreen = () => {
  const dispatch = useDispatch();
  const selectedAccount = useSelectedAccountSelector();
  const tezosToken = useTezosTokenSelector();
  const { tokensExchangeRates } = useTokensExchangeRatesSelector();

  useEffect(() => {
    dispatch(loadTezosBalanceActions.submit(selectedAccount.publicKeyHash));
    dispatch(loadActivityGroupsActions.submit(selectedAccount.publicKeyHash));
    dispatch(loadSelectedBakerActions.submit(selectedAccount.publicKeyHash));
  }, []);

  return (
    <>
      <HeaderCard>
        <TokenEquityValue exchangeRate={tokensExchangeRates.data[TEZ_TOKEN_METADATA.name]} token={tezosToken} />

        <PublicKeyHashText publicKeyHash={selectedAccount.publicKeyHash} marginBottom={formatSize(16)} />

        <HeaderCardActionButtons token={tezosToken} />
      </HeaderCard>

      <TokenScreenContentContainer historyComponent={<TezosTokenHistory />} infoComponent={<TezosTokenInfo />} />
    </>
  );
};
