import { ICommand } from "@services/interface";
import Transaction, { ITransaction } from "@models/transaction.model";
import { TRANSACTION_STATUS, BILL_STATUS } from "@models/constant";
import { PaymentNotificationMessageFactory } from "@services/payment/message/factory";
import NotificationManager from "@services/notification/manager";
import Bill from "@models/bill.model";
import { INotificationMessage } from "@services/notification/interface";
import { IUser } from "@models/user.model";
import { BillOverLoadMaxFundMessage } from "@services/payment/message";
import utils from '@utils/index';
import { Balance } from '@utils/balance';

abstract class AbstractUpdateTransactionCommand implements ICommand {
    constructor(
        protected tran: ITransaction,
        protected gasConsumed?: number,
        protected amountSM?: string
    ) { }

    async execute(): Promise<void> {
        // Update transaction status
        await this.updateTransactionStatus();

        // Push Notification
        await this.sendNotification();

        // Update Bill status
        await this.updateBillStatus();
    }

    async sendNotification(): Promise<void> {
        try {
            const message = this.createNotificationMessage();
            if (message === null) {
                return;
            }
            const recipients = [{
                _id: String(this.tran.from_user)
            }, {
                _id: String(this.tran.to_user)
            }];
            await new NotificationManager().send(message, recipients);
        } catch (err) {
            console.log('notify failed: ', err);
        }
    }

    abstract async updateTransactionStatus(): Promise<void>;
    abstract async updateBillStatus(): Promise<void>;
    abstract createNotificationMessage(): INotificationMessage | null;
}

export class UpdateSuccessTransactionCommand extends AbstractUpdateTransactionCommand {
    async updateTransactionStatus(): Promise<void> {
        const updates: any = {
            status: TRANSACTION_STATUS.COMPLETED,
            completed_at: new Date()
        };
        if (this.gasConsumed) {
            updates.gas_consumed = this.gasConsumed;
        }
        if (this.amountSM) {
            const currency = 'BTC';
            const intAmount = utils.string.tryParseInt(this.amountSM);
            const decimals = await Balance.getDecimalsByCurrency(currency);
            const amount = Balance.toDecimals(intAmount, decimals);
            updates.amount = amount;
        }
        const query = {
            _id: this.tran._id
        };
        await Transaction.findOneAndUpdate(query, updates);
    }

    createNotificationMessage(): INotificationMessage | null {
        const actor = {
            _id: this.tran.from_user
        };
        return PaymentNotificationMessageFactory.createSuccessTransactionMessage(actor, this.tran);
    }

    async updateBillStatus(): Promise<void> {
        if (!this.tran.bill_id) {
            return;
        }
        const query = {
            _id: this.tran.bill_id
        };
        const updates = { status: BILL_STATUS.COMPLETED };
        await Bill.findOneAndUpdate(query, updates);
    }
}

export class UpdateFailedTransactionCommand extends AbstractUpdateTransactionCommand {

    constructor(
        protected tran: ITransaction,
        protected gasConsumed?: number,
        protected error?: string
    ) {
        super(tran, gasConsumed);
    }

    async updateTransactionStatus(): Promise<void> {
        const query = {
            _id: this.tran._id,
        };
        const updates: any = {
            status: TRANSACTION_STATUS.FAILED,
            completed_at: new Date(),
            error: this.error ? this.error : null
        };
        if (this.gasConsumed) {
            updates.gas_consumed = this.gasConsumed;
        }
        if (this.amountSM) {
            const currency = 'BTC';
            const intAmount = utils.string.tryParseInt(this.amountSM);
            const decimals = await Balance.getDecimalsByCurrency(currency);
            const amount = Balance.toDecimals(intAmount, decimals);
            updates.amount = amount;
        }
        await Transaction.findOneAndUpdate(query, updates);
    }

    createNotificationMessage(): INotificationMessage | null {
        const actor = {
            _id: this.tran.from_user
        };
        return PaymentNotificationMessageFactory.createFailedTransactionMessage(actor, this.tran);
    }

    async updateBillStatus(): Promise<void> {
        if (!this.tran.bill_id) {
            return;
        }
        const query = {
            _id: this.tran.bill_id
        };
        const updates = { status: BILL_STATUS.FAILED };
        await Bill.findOneAndUpdate(query, updates);
    }
}

export class NotifyOverMaxFundTransactionCommand implements ICommand {
    constructor(
        protected tran: ITransaction,
        protected confirmTxId: string
    ) { }

    async execute(): Promise<void> {
        const updated = await this.updateTransaction();
        if (!updated) {
            return;
        }
        const recipients = [{
            _id: this.tran.from_user
        }];
        const actor = {
            _id: undefined
        };
        const amount = this.tran.amount;
        const message = new BillOverLoadMaxFundMessage(actor, this.tran, amount);
        new NotificationManager().send(message, recipients);
    }

    async updateTransaction(): Promise<boolean> {
        const query = {
            _id: this.tran._id,
            status: TRANSACTION_STATUS.PROCESSING,
        };
        const updates = {
            confirm_tx_id: this.confirmTxId
        };
        const updateOptions = { new: true };
        const result = await Transaction.findOneAndUpdate(query, updates, updateOptions);
        if (!result) {
            return false;
        }
        return true;
    }
}

export class UpdateRejectedMaxFundAdjustTransactionCommand extends AbstractUpdateTransactionCommand {

    constructor(
        protected tran: ITransaction,
        protected gasConsumed?: number,
        protected error?: string
    ) {
        super(tran, gasConsumed);
    }

    async updateTransactionStatus(): Promise<void> {
        const query = {
            _id: this.tran._id,
        };
        const updates: any = {
            status: TRANSACTION_STATUS.REJECTED,
            completed_at: new Date(),
            error: this.error ? this.error : null
        };
        if (this.gasConsumed) {
            updates.gas_consumed = this.gasConsumed;
        }
        await Transaction.findOneAndUpdate(query, updates);
    }

    createNotificationMessage(): INotificationMessage | null {
        const actor = {
            _id: this.tran.from_user
        };
        return PaymentNotificationMessageFactory.createRejectMaxfunxTransactionMessage(actor, this.tran);
    }

    async updateBillStatus(): Promise<void> {
        if (!this.tran.bill_id) {
            return;
        }
        const query = {
            _id: this.tran.bill_id
        };
        const updates = { status: BILL_STATUS.REJECTED };
        await Bill.findOneAndUpdate(query, updates);
    }
}

export class UpdateApprovedWithdrawalCommand extends AbstractUpdateTransactionCommand {

    async updateTransactionStatus(): Promise<void> {
        const updates: any = {
            status: TRANSACTION_STATUS.PROCESSING,
            completed_at: new Date()
        };
        const query = {
            _id: this.tran._id
        };
        await Transaction.findOneAndUpdate(query, updates);
    }

    createNotificationMessage(): INotificationMessage | null {
        const actor = {
            _id: this.tran.from_user
        };
        return PaymentNotificationMessageFactory.createApprovedTransactionMessage(actor, this.tran);
    }

    async updateBillStatus(): Promise<void> {
        // Withdrawal do not have bill
        return;
    }
}

export class UpdateBlockedWithdrawalCommand extends AbstractUpdateTransactionCommand {

    async updateTransactionStatus(): Promise<void> {
        const updates: any = {
            status: TRANSACTION_STATUS.BLOCKED,
            completed_at: new Date()
        };
        const query = {
            _id: this.tran._id
        };
        await Transaction.findOneAndUpdate(query, updates);
    }

    createNotificationMessage(): INotificationMessage | null {
        const actor = {
            _id: this.tran.from_user
        };
        return PaymentNotificationMessageFactory.createBlockedTransactionMessage(actor, this.tran);
    }

    async updateBillStatus(): Promise<void> {
        // Withdrawal do not have bill
        return;
    }
}
