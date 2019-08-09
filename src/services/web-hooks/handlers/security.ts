import { IWebHookHandler } from './handler.interface';
import { IWebHook } from '@models/web-hook.model';
import Transaction from '@models/transaction.model';
import { TRANSACTION_STATUS } from '@models/constant';

export default class SecurityHandler implements IWebHookHandler {
  async execute(hook: IWebHook) {
    const { data } = hook;
    // @ts-ignore
    const { txId, msg, isError, refundHash, type, hash, index } = data;
    let filter: any = { tx_id: txId };
    let updateTx: any = {
      status: TRANSACTION_STATUS.COMPLETED,
      bot_status: TRANSACTION_STATUS.PROCESSED,
      reason: '',
      btc_id: hash,
      btc_d: index
    };
    if (isError) {
      // E101 is not enough fund on master account
      if (msg.trim() === 'E101') {
        updateTx = {
          status: TRANSACTION_STATUS.PENDING,
          bot_status: TRANSACTION_STATUS.APPROVED,
          reason: 'Account master not enough fund'
        };
      } else {
        updateTx = {
          status: TRANSACTION_STATUS.FAILED,
          bot_status: TRANSACTION_STATUS.FAILED,
          reason: msg
        };
      }
    } else {
      switch (type) {
        case 'REFUND':
          updateTx = { refundHash };
          break;
        case 'WITHDRAW.FEE':
          updateTx = { withdraw_fee: parseFloat(msg) };
          break;
        case 'DEPOSIT.TX':
          filter = { btc_id: txId };
          updateTx = { tx_id: msg };      
          break;
      }
    }
    await Transaction.findOneAndUpdate(filter, updateTx);
  }
}
