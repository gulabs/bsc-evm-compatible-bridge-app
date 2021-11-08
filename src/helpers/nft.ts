import { formatUnits } from 'ethers/lib/utils';
import { getDataFromTokenUri } from 'src/apis/nft';
import {
  Chain,
  CovalentData,
  INFTParsedTokenAccount,
  NFTStandard,
  NFTStandardData,
  NFT_STANDARD_OPTIONS,
} from 'src/interfaces/nft';

export const parseNFTData = async (
  walletAddress: string,
  tokenList: CovalentData[],
  standard: NFTStandard,
  chain: Chain
): Promise<INFTParsedTokenAccount[]> => {
  const tokens = tokenList.reduce((arr, covalent) => {
    if (covalent.nft_data) {
      covalent.nft_data.forEach((data) =>
        arr.push({
          walletAddress,
          contractAddress: covalent.contract_address,
          amount: data.token_balance,
          decimals: covalent.contract_decimals,
          uiAmount: Number(
            formatUnits(data.token_balance, covalent.contract_decimals)
          ),
          uiAmountString: formatUnits(
            data.token_balance,
            covalent.contract_decimals
          ),
          symbol: covalent.contract_ticker_symbol,
          name: covalent.contract_name,
          logo: covalent.logo_url,
          tokenId: data.token_id,
          uri: data.token_url,
          animation_url: data.external_data.animation_url,
          external_url: data.external_data.external_url,
          image: data.external_data.image,
          image_256: data.external_data.image_256,
          nftName: data.external_data.name,
          description: data.external_data.description,
          standard,
          chain,
        })
      );
    }
    return arr;
  }, [] as INFTParsedTokenAccount[]);

  return Promise.all(
    tokens.map(async (token) => {
      let image = token.image;
      if (!image) {
        const data = await getDataFromTokenUri(token.uri!);
        image = data.image;
      }
      return {
        ...token,
        image,
      };
    })
  );
};

export const getNFTStandard = (standard: NFTStandard): NFTStandardData => {
  return NFT_STANDARD_OPTIONS.find((item) => item.value === standard)!;
};

export enum TransferStatus {
  NotStart = 'not_start',
  InProgress = 'in_progress',
  Done = 'done',
  Error = 'error',
}

export enum SwapState {
  RequestOngoing = 'request_ongoing',
  RequestRejected = 'request_rejected',
  RequestConfirmed = 'request_confirmed',
  FillTxDryRunFailed = 'fill_tx_dry_run_failed',
  FillTxCreated = 'fill_tx_created',
  FillTxSent = 'fill_tx_sent',
  FillTxConfirmed = 'fill_tx_confirmed',
  FillTxFailed = 'fill_tx_failed',
  FillTxMissing = 'fill_tx_missing',
}

export const ERROR_STATE = [
  SwapState.FillTxFailed,
  SwapState.FillTxMissing,
  SwapState.RequestRejected,
  SwapState.FillTxDryRunFailed,
];

export const getNFTStatusFromState = (state: SwapState) => {
  if (state === SwapState.FillTxConfirmed) {
    return TransferStatus.Done;
  } else if (ERROR_STATE.includes(state)) {
    return TransferStatus.Error;
  }
  return TransferStatus.InProgress;
};
