import { OpKind, WalletParamsWithKind } from '@taquito/taquito';
import { BigNumber } from 'bignumber.js';
import { combineEpics } from 'redux-observable';
import { EMPTY, forkJoin, from, Observable, of } from 'rxjs';
import { catchError, concatMap, delay, map, switchMap, withLatestFrom } from 'rxjs/operators';
import { Action } from 'ts-action';
import { ofType, toPayload } from 'ts-action-operators';

import { betterCallDevApi, tzktApi } from '../../api.service';
import { ActivityTypeEnum } from '../../enums/activity-type.enum';
import { ConfirmationTypeEnum } from '../../interfaces/confirm-payload/confirmation-type.enum';
import { GetAccountTokenBalancesResponseInterface } from '../../interfaces/get-account-token-balances-response.interface';
import { GetAccountTokenTransfersResponseInterface } from '../../interfaces/get-account-token-transfers-response.interface';
import { OperationInterface } from '../../interfaces/operation.interface';
import { ModalsEnum } from '../../navigator/enums/modals.enum';
import { StacksEnum } from '../../navigator/enums/stacks.enum';
import { showErrorToast, showSuccessToast } from '../../toast/toast.utils';
import { TEZ_TOKEN_METADATA } from '../../token/data/tokens-metadata';
import { groupActivitiesByHash } from '../../utils/activity.utils';
import { currentNetworkId$, tezos$ } from '../../utils/network/network.util';
import { mapOperationsToActivities } from '../../utils/operation.utils';
import { paramsToPendingActions } from '../../utils/params-to-actions.util';
import { mutezToTz } from '../../utils/tezos.util';
import { getTokenMetadata } from '../../utils/token-metadata.utils';
import { getTransferParams$ } from '../../utils/transfer-params.utils';
import { mapTransfersToActivities } from '../../utils/transfer.utils';
import { sendTransaction$, withSelectedAccount } from '../../utils/wallet.utils';
import { loadSelectedBakerActions } from '../baking/baking-actions';
import { navigateAction } from '../root-state.actions';
import {
  addPendingOperation,
  approveInternalOperationRequestAction,
  loadActivityGroupsActions,
  loadEstimationsActions,
  loadTezosBalanceActions,
  loadTokenBalancesActions,
  loadTokenMetadataActions,
  sendAssetActions,
  waitForOperationCompletionAction
} from './wallet-actions';
import { WalletRootState } from './wallet-state';

const loadTokenAssetsEpic = (action$: Observable<Action>) =>
  action$.pipe(
    ofType(loadTokenBalancesActions.submit),
    toPayload(),
    withLatestFrom(currentNetworkId$),
    switchMap(([address, currentNetworkId]) =>
      from(
        betterCallDevApi.get<GetAccountTokenBalancesResponseInterface>(
          `/account/${currentNetworkId}/${address}/token_balances`,
          {
            params: { size: 10, offset: 0 }
          }
        )
      ).pipe(
        switchMap(({ data }) =>
          forkJoin(
            data.balances.map(balance =>
              from(getTokenMetadata(balance.contract, balance.token_id)).pipe(
                map(tokenMetadata => ({
                  ...balance,
                  decimals: tokenMetadata.decimals,
                  symbol: tokenMetadata.symbol,
                  name: tokenMetadata.name,
                  thumbnail_uri: tokenMetadata.thumbnailUri
                })),
                catchError(() => of(balance))
              )
            )
          )
        ),
        map(balances => loadTokenBalancesActions.success(balances)),
        catchError(err => of(loadTokenBalancesActions.fail(err.message)))
      )
    )
  );

const loadTezosAssetsEpic = (action$: Observable<Action>) =>
  action$.pipe(
    ofType(loadTezosBalanceActions.submit),
    toPayload(),
    withLatestFrom(tezos$),
    switchMap(([address, tezos]) =>
      from(tezos.tz.getBalance(address)).pipe(
        map(balance => loadTezosBalanceActions.success(mutezToTz(balance, TEZ_TOKEN_METADATA.decimals).toString())),
        catchError(err => of(loadTezosBalanceActions.fail(err.message)))
      )
    )
  );

const loadTokenMetadataEpic = (action$: Observable<Action>) =>
  action$.pipe(
    ofType(loadTokenMetadataActions.submit),
    toPayload(),
    concatMap(({ id, address }) =>
      from(getTokenMetadata(address, id)).pipe(
        map(tokenMetadata =>
          loadTokenMetadataActions.success({
            id,
            address,
            decimals: tokenMetadata.decimals,
            symbol: tokenMetadata.symbol ?? tokenMetadata.name?.substring(8) ?? '???',
            name: tokenMetadata.name ?? tokenMetadata.symbol ?? 'Unknown Token',
            iconUrl: tokenMetadata.thumbnailUri
          })
        ),
        catchError(err => of(loadTokenMetadataActions.fail(err.message)))
      )
    )
  );

const sendAssetEpic = (action$: Observable<Action>, state$: Observable<WalletRootState>) =>
  action$.pipe(
    ofType(sendAssetActions.submit),
    toPayload(),
    withLatestFrom(tezos$),
    withSelectedAccount(state$),
    switchMap(([[{ asset, receiverPublicKeyHash, amount }, tezos], selectedAccount]) =>
      getTransferParams$(asset, selectedAccount, receiverPublicKeyHash, new BigNumber(amount), tezos).pipe(
        map((transferParams): WalletParamsWithKind[] => [{ ...transferParams, kind: OpKind.TRANSACTION }]),
        map(opParams =>
          navigateAction(ModalsEnum.Confirmation, { type: ConfirmationTypeEnum.InternalOperations, opParams })
        )
      )
    )
  );

const loadEstimationsEpic = (action$: Observable<Action>) =>
  action$.pipe(
    ofType(loadEstimationsActions.submit),
    toPayload(),
    withLatestFrom(tezos$),
    switchMap(([{ sender, opParams }, tezos]) =>
      from(tezos.estimate.batch(opParams.map(param => ({ ...param, source: sender.publicKeyHash })))).pipe(
        map(estimates =>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          estimates.map(({ suggestedFeeMutez, gasLimit, storageLimit, minimalFeePerStorageByteMutez }: any) => ({
            suggestedFeeMutez,
            gasLimit,
            storageLimit,
            minimalFeePerStorageByteMutez
          }))
        ),
        map(loadEstimationsActions.success),
        catchError(err => {
          showErrorToast({ description: 'Warning! The transaction is likely to fail!' });

          return of(loadEstimationsActions.fail(err.message));
        })
      )
    )
  );

const approveInternalOperationRequestEpic = (action$: Observable<Action>, state$: Observable<WalletRootState>) =>
  action$.pipe(
    ofType(approveInternalOperationRequestAction),
    toPayload(),
    withSelectedAccount(state$),
    switchMap(([opParams, sender]) =>
      sendTransaction$(sender, opParams).pipe(
        switchMap(({ opHash }) => {
          showSuccessToast({ description: 'Successfully sent!' });

          return [
            navigateAction(StacksEnum.MainStack),
            waitForOperationCompletionAction({ opHash, sender: sender.publicKeyHash }),
            addPendingOperation(paramsToPendingActions(opParams, opHash, sender.publicKeyHash))
          ];
        }),
        catchError(err => {
          showErrorToast({ description: err.message });

          return EMPTY;
        })
      )
    )
  );

const BCD_INDEXING_DELAY = 15000;

const waitForOperationCompletionEpic = (action$: Observable<Action>) =>
  action$.pipe(
    ofType(waitForOperationCompletionAction),
    toPayload(),
    withLatestFrom(tezos$),
    switchMap(([{ opHash, sender }, tezos]) =>
      from(tezos.operation.createOperation(opHash)).pipe(
        switchMap(operation => operation.confirmation(1)),
        delay(BCD_INDEXING_DELAY),
        concatMap(() => [
          loadTezosBalanceActions.submit(sender),
          loadTokenBalancesActions.submit(sender),
          loadActivityGroupsActions.submit(sender),
          loadSelectedBakerActions.submit(sender)
        ]),
        catchError(err => {
          showErrorToast({ description: err.message });

          return EMPTY;
        })
      )
    )
  );

const loadActivityGroupsEpic = (action$: Observable<Action>) =>
  action$.pipe(
    ofType(loadActivityGroupsActions.submit),
    toPayload(),
    withLatestFrom(currentNetworkId$),
    switchMap(([address, currentNetworkId]) =>
      forkJoin([
        from(
          tzktApi.get<OperationInterface[]>(
            `accounts/${address}/operations?limit=100&type=${ActivityTypeEnum.Delegation},${ActivityTypeEnum.Origination},${ActivityTypeEnum.Transaction}`
          )
        ).pipe(map(({ data }) => mapOperationsToActivities(address, data))),
        from(
          betterCallDevApi.get<GetAccountTokenTransfersResponseInterface>(
            `/tokens/${currentNetworkId}/transfers/${address}`,
            { params: { max: 100, start: 0 } }
          )
        ).pipe(map(({ data }) => mapTransfersToActivities(address, data.transfers)))
      ]).pipe(
        map(([operations, transfers]) => groupActivitiesByHash(operations, transfers)),
        map(activityGroups => loadActivityGroupsActions.success(activityGroups)),
        catchError(err => of(loadActivityGroupsActions.fail(err.message)))
      )
    )
  );

export const walletEpics = combineEpics(
  loadTezosAssetsEpic,
  loadTokenAssetsEpic,
  loadTokenMetadataEpic,
  sendAssetEpic,
  loadEstimationsEpic,
  waitForOperationCompletionEpic,
  loadActivityGroupsEpic,
  approveInternalOperationRequestEpic
);
