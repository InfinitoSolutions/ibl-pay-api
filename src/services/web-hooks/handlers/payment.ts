import Transaction, { ITransaction } from '@models/transaction.model';
import {
    TRANSACTION_STATUS, BILL_STATUS, USER_ROLE,
} from '@models/constant';
import { IWebHookHandler } from './handler.interface';
import {
    UpdateSuccessTransactionCommand,
    UpdateFailedTransactionCommand,
    UpdateFailedScheduledPaymentSetupCommand,
    UpdateSuccessSchedulePaymentSetupCommand,
    CreateSuccessDepositTransactionCommand,
    NotifyOverMaxFundTransactionCommand,
    UpdateRejectedMaxFundAdjustTransactionCommand,
    CreateConfirmedWithdrawalCommand,
    CreateFailedWithdrawalCommand,
    CreateSuccessRegisterCommand,
    CreateFailedRegisterCommand
} from '@services/payment/commands';
import { ICommand } from '@services/interface';
import { IWebHook } from '@models/web-hook.model';
import Bill, { IBill } from '@models/bill.model';
import utils from '@utils/index';
import User from '@models/user.model';
import { Balance } from '@utils/balance';

export default class PaymentWebHookHandler implements IWebHookHandler {

    async execute(hook: IWebHook) {
        try {
            const { data } = hook;
            const parser = new PaymentSmartContractParser();
            const result = parser.parse(data);
            if (!result.isValid()) {
                return await this.fails(result);
            }
            return await this.done(result);
        } catch (error) {
            throw error;
        }
    }

    async done(e: PaymentEvent) {
        const txId = e.tx_id;
        if (!txId) {
            return;
        }
        await new PaymentWebHookInvoker().done(e);
    }

    async fails(e: PaymentEvent) {
        const txId = e.tx_id;
        if (!txId) {
            return;
        }
        await new PaymentWebHookInvoker().fails(e);
    }
}

class PaymentSmartContractParser {

    parse(data: any): PaymentEvent {
        const txId = this.getTxId(data);
        const contract = data.contract || null;
        const stack = data.stack;
        const gasConsumed = data.gas_consumed || null;
        const notification = data.notifications || [];
        const event = NotificationEvent.parse(notification);
        const status = data.status;

        const result = new PaymentEvent(
            txId,
            contract,
            gasConsumed,
            stack,
            status,
            event
        );

        return result;
    }

    private getTxId(data: any): string | undefined {
        if ('txid' in data) {
            return data['txid'];
        }
        return undefined;
    }
}

class PaymentEvent {
    tx_id?: string;
    contract?: string;
    gas_consumed?: any;
    stack?: string;
    event?: NotificationEvent;
    status?: string;

    constructor(txId?: string, contract?: string, gasConsumed: number = 0, stack?: string, status?: string, event?: NotificationEvent) {
        this.tx_id = txId;
        this.contract = contract;
        this.gas_consumed = gasConsumed;
        this.stack = stack;
        this.status = status;
        this.event = event;
    }

    isValid(): boolean {
        const stack = this.stack;
        if (stack === '1') {
            return true;
        }
        return false;
    }
}

class NotificationEvent {
    constructor(
        public func: string,
        public name: string,
        public params: any
    ) { }

    get error(): string | undefined {
        if (this.name === 'error' && Array.isArray(this.params) && this.params.length > 0) {
            return this.params[0];
        }
        return undefined;
    }

    static parse(notification: any): NotificationEvent | undefined {
        let e = [], f = [], g = [];
        if (Array.isArray(notification) && notification.length > 0) {
            f = (notification[0]['event'] || '').split(',');
            e = (notification[1]['event'] || '').split(',');

            /**
             * Temporarily fix for Rejected Max Fund Adjust
             * 
             * @todo: Refactor code to handle multiple event or we need to change
             * event structure on NEO Explorer
             */
            if (e[0] === 'max_fund_delete' && notification.length > 2) {
                const e2 = (notification[2]['event'] || '').split(',');
                if (e2.length > 0 && e2[0] === 'max_fund_reject') {
                    e = e2;
                }
            }

            if (f.length > 0) {
                if (f[0] === 'whitelist_new_user') {
                    f[0] = 'register';
                    e = f;
                } else {
                    f = f.slice(1);
                }
            }
        }
        if ((['PRO_PullSchedule', 'TOK_Withdrawl', 'TOK_Issued_By_Deposit'].includes(f[0])) && notification.length > 3) {
            const e2 = (notification[3]['event'] || '').split(',');
            if (e2.length > 0) {
                e = e2;
            }
        }
        if (e.length === 0 || f.length === 0) {
            return undefined;
        }
        return new NotificationEvent(f[0], e[0], e.slice(1));
    }
}

class PaymentWebHookInvoker {
    async done(e: PaymentEvent): Promise<void> {
        const doneCommand = await PaymentWebHookCommandFactory.makeSuccessCommand(e);
        if (doneCommand !== null) {
            await doneCommand.execute();
        }
    }

    async fails(e: PaymentEvent): Promise<void> {
        const failedCommand = await PaymentWebHookCommandFactory.makeFailsCommand(e);
        if (failedCommand !== null) {
            await failedCommand.execute();
        }
    }
}

class PaymentWebHookCommandFactory {
    public static async makeSuccessCommand(e: PaymentEvent): Promise<ICommand | null> {
        const func = e.event ? e.event.func : '';
        switch (func) {
            case 'PRO_InstantPay':
            case 'PRO_SinglePay':
            case 'PRO_PullSchedule':
                return await this.makeSuccessTransactionCommand(e);
            case 'PRO_Agreement':
                return await this.makeSuccessBillCommand(e);
            case 'PRO_MaxFundAdjust':
                return await this.makeSuccessMaxFundAdjustCommand(e);
            case 'TOK_Withdrawl':
                return await this.makeConfirmedWithdrawalCommand(e);
            case 'TOK_Issued_By_Deposit':
                return await this.makeSuccessDepositCommand(e);
            case 'register':
                return await this.makeSuccessRegisterCommand(e);
            default:
                // Fails if wrong function name or params was invoked
                return this.makeFailedTransactionCommand(e);
        }
    }

    private static async makeSuccessTransactionCommand(e: PaymentEvent): Promise<ICommand | null> {
        const txId = e.tx_id;
        if (!txId) {
            return null;
        }
        const tran = await this.findTransaction(txId);
        if (!tran) {
            return null;
        }
        const gasConsumed = e.gas_consumed ? parseFloat(e.gas_consumed) : undefined;
        const amountSM = e.event && e.event.func === 'PRO_PullSchedule' && e.event.name === 'transfer' &&
            e.event.params && e.event.params.length >= 2 ?
            e.event.params[2] : null;
        return new UpdateSuccessTransactionCommand(tran, gasConsumed, amountSM);
    }

    private static async makeSuccessBillCommand(e: PaymentEvent): Promise<ICommand | null> {
        const txId = e.tx_id;
        if (!txId) {
            return null;
        }
        const bill = await this.findScheduledBill(txId);
        if (!bill) {
            return null;
        }
        return new UpdateSuccessSchedulePaymentSetupCommand(bill);
    }

    private static async makeSuccessMaxFundAdjustCommand(e: PaymentEvent): Promise<ICommand | null> {
        const event = e.event;
        const eventName = event ? event.name : null;
        const confirmTxId = (event && event.params.length > 0) ? event.params[0] : null;
        if (!confirmTxId) {
            return null;
        }
        const tran = await this.findMaxFundAdjustTransaction(confirmTxId);
        if (!tran) {
            return null;
        }
        if (eventName === 'max_fund_delete') {
            return new UpdateSuccessTransactionCommand(tran);
        } else if (eventName === 'max_fund_reject') {
            return new UpdateRejectedMaxFundAdjustTransactionCommand(tran);
        }
        return null;
    }

    private static async findTransaction(txId: string): Promise<ITransaction | null> {
        txId = utils.string.reformatTxId(txId);
        return await Transaction.findOne({ tx_id: txId, status: TRANSACTION_STATUS.PROCESSING });
    }

    private static async findMaxFundAdjustTransaction(confirmTxId: string): Promise<ITransaction | null> {
        return await Transaction.findOne({ confirm_tx_id: confirmTxId, status: TRANSACTION_STATUS.CONFIRMED });
    }

    private static async findScheduledBill(txId: string): Promise<IBill | null> {
        txId = utils.string.reformatTxId(txId);
        return await Bill.findOne({ agreement_id: txId, status: BILL_STATUS.PROCESSING });
    }

    public static async makeFailsCommand(e: PaymentEvent): Promise<ICommand | null> {
        const func = e.event ? e.event.func : '';
        switch (func) {
            case 'PRO_InstantPay':
            case 'PRO_SinglePay':
            case 'PRO_PullSchedule':
                return await this.makeFailedTransactionCommand(e);
            case 'PRO_Agreement':
                return await this.makeFailedBillCommand(e);
            case 'PRO_MaxFundAdjust':
                return await this.makeFailedMaxFundAdjustCommand(e);
            case 'TOK_Withdrawl':
                return await this.makeFailedWithdrawalCommand(e);
            case 'register':
                return await this.makeFailedRegisterCommand(e);
        }
        return null;
    }

    private static async makeFailedTransactionCommand(e: PaymentEvent): Promise<ICommand | null> {
        const txId = e.tx_id;
        if (!txId) {
            return null;
        }
        const tran = await this.findTransaction(txId);
        if (!tran) {
            return null;
        }
        const gasConsumed = e.gas_consumed ? parseFloat(e.gas_consumed) : undefined;
        const error = e.event ? e.event.error : undefined;
        const eventName = e.event ? e.event.name : undefined;
        if (eventName === 'max_fund') {
            const confirmTxId = e.event ? e.event.params[0] : null;
            return new NotifyOverMaxFundTransactionCommand(tran, confirmTxId);
        }
        return new UpdateFailedTransactionCommand(tran, gasConsumed, error);
    }

    private static async makeFailedBillCommand(e: PaymentEvent): Promise<ICommand | null> {
        const txId = e.tx_id;
        if (!txId) {
            return null;
        }
        const bill = await this.findScheduledBill(txId);
        if (!bill) {
            return null;
        }
        return new UpdateFailedScheduledPaymentSetupCommand(bill);
    }

    private static async makeFailedMaxFundAdjustCommand(e: PaymentEvent): Promise<ICommand | null> {
        const event = e.event;
        const eventName = event ? event.name : null;
        const confirmTxId = (event && event.params.length > 0) ? event.params[0] : null;
        if (!confirmTxId) {
            return null;
        }
        const tran = await this.findMaxFundAdjustTransaction(confirmTxId);
        if (!tran) {
            return null;
        }
        if (eventName === 'max_fund_reject') {
            return new UpdateRejectedMaxFundAdjustTransactionCommand(tran);
        }
        return null;
    }

    private static async makeFailedWithdrawalCommand(e: PaymentEvent): Promise<ICommand | null> {
        const txId = e.tx_id;
        return new CreateFailedWithdrawalCommand(txId, e.event.params[0]);
    }

    private static async makeSuccessRegisterCommand(e: PaymentEvent): Promise<ICommand | null> {
        return new CreateSuccessRegisterCommand(e.event.params[0]);
    }

    private static async makeFailedRegisterCommand(e: PaymentEvent): Promise<ICommand | null> {
        return new CreateFailedRegisterCommand(e.event.params[0]);
    }

    private static async makeSuccessDepositCommand(e: PaymentEvent): Promise<ICommand | null> {
        if (!e.isValid()) {
            return null;
        }
        if (!e.event) {
            return null;
        }
        const params = e.event.params;
        if (!Array.isArray(params) || params.length < 2) {
            return null;
        }
        const address = params[0];
        const user = await User.findOne({ role: USER_ROLE.BUYER, neo_wallet: address });
        if (!user) {
            return null;
        }
        /**
         * @todo: Currency should be returned from Smart Contract
         */
        const currency = 'BTC';
        const intAmount = utils.string.tryParseInt(params[1]);
        const decimals = await Balance.getDecimalsByCurrency(currency);
        const amount = Balance.toDecimals(intAmount, decimals);

        const txId = utils.string.reformatTxId(e.tx_id || '');
        const payload = {
            tx_id: txId,
            amount,
            currency,
            from_address: address,
        };

        return new CreateSuccessDepositTransactionCommand(user, payload);
    }

    private static async makeConfirmedWithdrawalCommand(e: PaymentEvent): Promise<ICommand | null> {
        if (!e.isValid() || !e.event) {
            return null;
        }
        const params = e.event.params;
        if (!Array.isArray(params) || params.length < 3) {
            return null;
        }
        const address = params[0];
        const user = await User.findOne({ neo_wallet: address });
        if (!user) {
            return null;
        }
        const { tx_id: txId, gas_consumed: gasConsumed } = e;
        return new CreateConfirmedWithdrawalCommand(user, { txId, gasConsumed });
    }
}
