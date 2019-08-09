import {ICommand} from "@services/interface";
import NotificationManager from "@services/notification/manager";
import Bill, {IBill} from "@models/bill.model";
import {BILL_STATUS, TRANSACTION_STATUS, TRANSACTION_TYPE} from '@models/constant';
import {DepositSuccessMessage, RefundSuccessedMessage, RegisterFailedMessage, RegisterSuccessMessage, SetupScheduledPaymentFailedMessage, SetupScheduledPaymentSuccessMessage, WithdrawConfirmedMessage, WithdrawFailedMessage} from "@services/payment/message";
import {ApprovedWithdrawalRequestMessage, BlockedWithdrawalRequestMessage, PendingWithdrawalRequestMessage, RejectedWithdrawalRequestMessage} from "@services/withdraw/message";
import walletServices from '@services/wallet';
import Transaction, {ITransaction, ITransactionDocument} from "@models/transaction.model";
import User, {IUser} from "@models/user.model";
import {Double} from "bson";

export abstract class AbstractUpdateScheduledPaymentSetupCommand implements ICommand {
    constructor(
        protected bill: IBill
    ) { }

    async execute(): Promise<void> {
        const bill = await this.updateBillStatus();
        if (bill) {
            await this.sendNotification();
        }
    }

    protected abstract async updateBillStatus(): Promise<IBill | null>;
    protected abstract async sendNotification(): Promise<void>;
}

export class UpdateSuccessSchedulePaymentSetupCommand extends AbstractUpdateScheduledPaymentSetupCommand {

    protected async updateBillStatus(): Promise<IBill | null> {
        const query = {
            _id: this.bill._id,
            status: BILL_STATUS.PROCESSING
        };
        const updates = {
            status: BILL_STATUS.CONFIRMED
        };
        const updateOptions = { new: true };
        return await Bill.findOneAndUpdate(query, updates, updateOptions);
    }

    protected async sendNotification(): Promise<void> {
        const actor = {
            _id: this.bill.confirmed_by_id
        };
        const message = new SetupScheduledPaymentSuccessMessage(actor, this.bill);
        const recipients = [{
            _id: this.bill.confirmed_by_id
        }, {
            _id: this.bill.merchant_id
        }];
        await new NotificationManager().send(message, recipients);
    }
}

export class UpdateFailedScheduledPaymentSetupCommand extends AbstractUpdateScheduledPaymentSetupCommand {
    constructor(
        protected bill: IBill,
        protected error?: string
    ) {
        super(bill);
    }

    protected async updateBillStatus(): Promise<IBill | null> {
        const query = {
            _id: this.bill._id,
            status: BILL_STATUS.PROCESSING
        };
        const updates = {
            status: BILL_STATUS.FAILED,
            notes: this.error ? this.error : null
        };
        const updateOptions = { new: true };
        return await Bill.findOneAndUpdate(query, updates, updateOptions);
    }

    protected async sendNotification(): Promise<void> {
        const actor = {
            _id: this.bill.confirmed_by_id
        };
        const message = new SetupScheduledPaymentFailedMessage(actor, this.bill);
        const recipients = [{
            _id: this.bill.confirmed_by_id
        }, {
            _id: this.bill.merchant_id
        }];
        await new NotificationManager().send(message, recipients);
    }
}

export class UpdatePendingWithdrawalRequestCommand implements ICommand {
    constructor(
        protected tran: ITransaction,
        protected payload: any,
    ) { }

    async execute(): Promise<void> {
        if (!this.tran || ![TRANSACTION_STATUS.PENDING, TRANSACTION_STATUS.NEW].includes(this.tran.bot_status)) {
            return;
        }
        // Update transaction status
        // const updated = await this.updateTransaction();
        // if (!updated) {
        //     return;
        // }

        // update wallet
        await walletServices.updateDebitWallet(this.tran.from_user, this.tran.currency, this.tran.request_amount);

        // Push Notification
        await this.sendNotification();
    }

    async updateTransaction(): Promise<boolean> {
        const query = {
            _id: this.tran._id,
        };
        const updates = {
            status: this.tran.bot_status
        };

        const updated = await Transaction.findOneAndUpdate(query, updates);

        if (updated) {
            return true;
        }
        return false;
    }

    async sendNotification(): Promise<void> {
        try {
            const actor = {
                _id: undefined
            };
            const message = new PendingWithdrawalRequestMessage(actor, this.tran, this.payload);
            if (message === null) {
                return;
            }
            const recipients = [{
                _id: String(this.tran.from_user)
            }];
            await new NotificationManager().send(message, recipients);
        } catch (err) {
            console.log('notify failed: ', err);
        }
    }
}

export class UpdateRejectedWithdrawalRequestCommand extends UpdatePendingWithdrawalRequestCommand {
    async execute(): Promise<void> {
        if (!this.tran || this.tran.bot_status !== TRANSACTION_STATUS.REJECTED) {
            return;
        }
        // Update transaction status
        // const updated = await this.updateTransaction();
        // if (!updated) {
        //     return;
        // }

        // update wallet
        await walletServices.updateDebitWallet(this.tran.from_user, this.tran.currency, this.tran.request_amount);

        // Push Notification
        await this.sendNotification();
    }

    async updateTransaction(): Promise<boolean> {
        const query = {
            _id: this.tran._id,
        };
        const updates = {
            status: this.tran.bot_status
        };

        const updated = await Transaction.findOneAndUpdate(query, updates);

        if (updated) {
            return true;
        }
        return false;
    }

    async sendNotification(): Promise<void> {
        try {
            const actor = {
                _id: undefined
            };
            const message = new RejectedWithdrawalRequestMessage(actor, this.tran, this.payload);
            if (message === null) {
                return;
            }
            const recipients = [{
                _id: String(this.tran.from_user)
            }];
            await new NotificationManager().send(message, recipients);
        } catch (err) {
            console.log('notify failed: ', err);
        }
    }
}

export class UpdateBlockedWithdrawalRequestCommand extends UpdatePendingWithdrawalRequestCommand {
    async execute(): Promise<void> {
        if (!this.tran || this.tran.bot_status !== TRANSACTION_STATUS.BLOCKED) {
            return;
        }
        // Update transaction status
        // const updated = await this.updateTransaction();
        // if (!updated) {
        //     return;
        // }

        // update wallet
        await walletServices.updateDebitWallet(this.tran.from_user, this.tran.currency, this.tran.request_amount);

        // Push Notification
        await this.sendNotification();
    }

    async updateTransaction(): Promise<boolean> {
        const query = {
            _id: this.tran._id,
        };
        const updates = {
            status: this.tran.bot_status
        };

        const updated = await Transaction.findOneAndUpdate(query, updates);

        if (updated) {
            return true;
        }
        return false;
    }

    async sendNotification(): Promise<void> {
        try {
            const actor = {};
            const message = new BlockedWithdrawalRequestMessage(actor, this.tran, this.payload);
            if (message === null) {
                return;
            }
            const recipients = [{
                _id: String(this.tran.from_user)
            }];
            await new NotificationManager().send(message, recipients);
        } catch (err) {
            console.log('notify failed: ', err);
        }
    }
}

export class UpdateApprovedWithdrawalRequestCommand implements ICommand {
    constructor(
        protected tran: ITransaction,
        protected payloads: any
    ) { }

    async execute(): Promise<void> {
        if (!this.tran || this.tran.bot_status !== TRANSACTION_STATUS.APPROVED) {
            return;
        }
        // Update transaction status
        // const updated = await this.updateTransaction();
        // if (!updated) {
        //     return;
        // }

        // update wallet
        await walletServices.updateDebitWallet(this.tran.from_user, this.tran.currency, this.tran.request_amount);

        // Push Notification
        await this.sendNotification();
    }

    async updateTransaction(): Promise<boolean> {
        const query = {
            _id: this.tran._id,
        };
        const updates = {
            status: this.tran.bot_status
        };

        const updated = await Transaction.findOneAndUpdate(query, updates);

        if (updated) {
            return true;
        }
        return false;
    }

    async sendNotification(): Promise<void> {
        try {
            const actor = {
                _id: undefined
            };
            const message = new ApprovedWithdrawalRequestMessage(actor, this.tran, this.payloads);
            if (message === null) {
                return;
            }
            const recipients = [{
                _id: String(this.tran.from_user)
            }];
            await new NotificationManager().send(message, recipients);
        } catch (err) {
            console.log('notify failed: ', err);
        }
    }
}

export interface CreateDepositPayload {
    tx_id: string;
    amount: number;
    currency: string;
    from_address: number;
}

export interface WithdrawalPayload {
    txId: string;
    gasConsumed: Double;
}

export class CreateSuccessDepositTransactionCommand implements ICommand {
    constructor(
        protected user: IUser,
        private payload: CreateDepositPayload
    ) { }

    async processRefund(doc: ITransactionDocument): Promise<void> {
        if (doc.refund) {
            return;
        }
        doc.refund = true;
        doc.save();
         // Push Notification
         const actor = {
            _id: undefined
        };
        const message = new RefundSuccessedMessage(actor, doc);
        const recipients = [this.user];
        await new NotificationManager().send(message, recipients);
    }

    async execute(): Promise<void> {
        const { tx_id } = this.payload;
        const t = await Transaction.findOne({$or: [{tx_id: tx_id}, {refundHash: tx_id}]});
        /**
         * Do nothing if tx_id has been already created. It happens if web-hook
         * is triggered multiple times when restart Explorer
         */
        if (t && t.tran_type === TRANSACTION_TYPE.WITHDRAW) {
            // If transaction is withrawal, it is refund
            await this.processRefund(t);
            return;
        }
        const params = {
            status: TRANSACTION_STATUS.COMPLETED,
            completed_at: new Date()
        };
        const tran = await Transaction.findOneAndUpdate({ tx_id }, { $set: params }, { new: true });
        if (tran) {
            // Push Notification
            const actor = {
                _id: undefined
            };
            const message = new DepositSuccessMessage(actor, tran);
            const recipients = [this.user];
            await new NotificationManager().send(message, recipients);
        }
    }
}

export class CreateConfirmedWithdrawalCommand implements ICommand {
    constructor(
        protected user: IUser,
        private payload: WithdrawalPayload
    ) { }

    async execute(): Promise<void> {
        const { txId, gasConsumed } = this.payload;
        const updateDate = {
            status: TRANSACTION_STATUS.PENDING,
            gas_consumed: gasConsumed
        };
        const t = await Transaction.findOneAndUpdate({tx_id: txId}, updateDate);
        console.log('TRANSACTION', t);
        console.log('DEBUG TRANSACTION', t);
        if (t) {
            // Push notification
            const actor = {
                _id: undefined
            };
            const message = new WithdrawConfirmedMessage(actor, t);
            const recipients = [this.user];
            await new NotificationManager().send(message, recipients);
        }
    }
}

export class CreateFailedWithdrawalCommand implements ICommand {
    constructor(
        private txId: string,
        private reason: string
    ) { }

    async execute(): Promise<void> {
        const t = await Transaction.findOneAndUpdate(
            {tx_id: this.txId},
            {status: TRANSACTION_STATUS.REJECTED, reason: this.reason});
        if (t) {
            // Push notification
            const actor = {
                _id: undefined
            };
            const user = await User.findById(t.from_user);
            const message = new WithdrawFailedMessage(actor, t);
            const recipients = [user];
            await new NotificationManager().send(message, recipients);
        }
    }
}

export class CreateSuccessRegisterCommand implements ICommand {
    constructor(
        private wallet: string
    ) { }

    async execute(): Promise<void> {
        await User.findOneAndUpdate({neo_wallet: this.wallet}, {sm_register: 1}, {new: true});
        // Push notification
        const actor = {
            _id: undefined
        };
        const user = await User.findOne({neo_wallet: this.wallet});
        if (user) {
            const message = new RegisterSuccessMessage(actor, user);
            const recipients = [user];
            await new NotificationManager().send(message, recipients);
        }
    }
}

export class CreateFailedRegisterCommand implements ICommand {
    constructor(
        private wallet: string
    ) { }

    async execute(): Promise<void> {
        // Push notification
        const actor = {
            _id: undefined
        };
        const user = await User.findOne({neo_wallet: this.wallet});
        if (user) {
            const message = new RegisterFailedMessage(actor, user);
            const recipients = [user];
            await new NotificationManager().send(message, recipients);
        }
    }
}
