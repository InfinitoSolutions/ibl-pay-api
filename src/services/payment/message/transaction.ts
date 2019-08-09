import { IBill } from '@models/bill.model';
import { ITransaction } from '@models/transaction.model';
import { NOTIFICATION_TYPE, BILL_TYPE, RECURRING_TYPE } from '@models/constant';
import utils from '@utils/index';
import moment from 'moment-timezone';
import User, { IUser } from '@models/user.model';
import {
    INotificationMessage,
    INotificationActor,
    INotificationRecipient
} from '@services/notification/interface';
import Config from 'config';


export abstract class AbstractTransactionMessage implements INotificationMessage {
    actor: INotificationActor;
    tran: ITransaction;
    payloads: any;

    constructor(actor: INotificationActor, tran: ITransaction, payloads?: any) {
        this.actor = actor;
        this.tran = tran;
        this.payloads = payloads;
    }

    abstract get verb(): string;
    abstract async getMessageFor(recipient: INotificationRecipient): Promise<string>;

    async getTitleFor(recipient: INotificationRecipient): Promise<string> {
        return this.title;
    }

    get type(): string {
        return NOTIFICATION_TYPE.PAYMENT;
    }

    get title(): string {
        return '';
    }

    get visible(): boolean {
        return true;
    }

    get payload(): any {
        return {
            _id: String(this.tran._id),
            ot: 'transaction',
            tt: this.tran.tran_type,
            bt: this.tran.bill_type || null,
            dt: this.dateTime
        };
    }

    get service(): string {
        const s = this.tran.description ? this.tran.description : '';
        return utils.string.removeNewLines(s);
    }

    get dateTime(): string {
        const localTime = moment().tz(Config.dateTime.TIME_ZONE).format(Config.dateTime.DATE_TIME_FORMAT);
        return localTime;
        // return utils.date.formatDateTime(this.tran.confirmed_at);
    }

    get scheduleCycle(): string {
        const { bill_type, schedule_time, schedule_type } = this.tran;
        if (bill_type !== BILL_TYPE.SCHEDULE || !schedule_time) {
            return '';
        }
        if (schedule_type === RECURRING_TYPE.MONTHLY) {
            return utils.date.formatMonthYear(schedule_time);
        }
        return utils.date.formatDate(schedule_time);
    }

    async getSender(): Promise<IUser | null> {
        try {
            return await User.findById(this.tran.from_user);
        } catch (error) {
            return null;
        }
    }

    async getReceiver(): Promise<IUser | null> {
        try {
            return await User.findById(this.tran.to_user);
        } catch (error) {
            return null;
        }
    }
}

export class TransactionDeclineMessage extends AbstractTransactionMessage {
    BUYER: string = 'Your scheduled payment transaction cancellation request was rejected by %s';

    get visible(): boolean {
        return false;
    }

    get verb(): string {
        return 'transaction.declined';
    }

    async getMessageFor(recipient: INotificationRecipient): Promise<string> {
        const merchant = await this.getReceiver();
        const merchantName = merchant ? merchant.display_name : '';
        return utils.string.format(this.BUYER, merchantName);
    }
}

export class BillOverLoadMaxFundMessage extends AbstractTransactionMessage {
    amount: number;
    BUYER: string = 'The transaction amount of your scheduled payment with %s' +
        'for cycle %s exceeds max fund. Please confirm for processing.';

    constructor(actor: INotificationActor, tran: ITransaction, amount: number) {
        super(actor, tran);
        this.amount = amount;
    }

    get visible(): boolean {
        return true;
    }

    get verb(): string {
        return 'schedule.over-max-fund';
    }

    get title(): string {
        return 'Scheduled Payment Exceeds Max Fund';
    }

    get payload(): any {
        return {
            _id: String(this.tran._id),
            ot: 'transaction',
            cid: this.tran.confirm_tx_id,
            tt: this.tran.tran_type,
            bt: this.tran.bill_type || null,
            dt: this.dateTime
        };
    }


    async getMessageFor(recipient: INotificationRecipient): Promise<string> {
        const merchant = await this.getReceiver();
        const merchantName = merchant ? merchant.display_name : '';
        return utils.string.format(this.BUYER, merchantName, this.scheduleCycle);
    }
}

export class PulledScheduledPaymentMessage extends AbstractTransactionMessage {
    BUYER: string = 'Your scheduled payment transaction with %s was successful.';
    MERCHANT: string = 'Your scheduled payment transaction for %s was successful.';

    get visible(): boolean {
        return false;
    }

    get verb(): string {
        return 'schedule.pulled';
    }

    async getMessageFor(recipient: INotificationRecipient): Promise<string> {
        if (String(this.tran.from_user) === String(recipient._id)) {
            const merchant = await this.getReceiver();
            const merchantName = merchant ? merchant.display_name : '';
            return utils.string.format(this.BUYER, merchantName);
        }
        return utils.string.format(this.MERCHANT, this.service);
    }
}

export class BillSharedMessage implements INotificationMessage {
    actor: INotificationActor;
    bill: IBill;

    constructor(actor: INotificationActor, bill: IBill) {
        this.actor = actor;
        this.bill = bill;
    }

    get verb(): string {
        return 'bill.shared';
    }

    get visible(): boolean {
        return false;
    }

    get title(): string {
        return '';
    }

    get payload(): any {
        return {
            _id: this.bill._id,
            object_type: 'bill',
            bill_type: this.bill.bill_type,
        };
    }

    get type(): string {
        return NOTIFICATION_TYPE.PAYMENT;
    }

    async getTitleFor(recipient: INotificationRecipient): Promise<string> {
        return this.title;
    }

    async getMessageFor(recipient: INotificationRecipient): Promise<string> {
        return '';
    }
}

export class InstantPaymentSuccessMessage extends AbstractTransactionMessage {
    BUYER: string = 'Your instant payment transaction for %s with %s was successful.';
    MERCHANT: string = 'Your instant payment transaction for %s with %s was successfully received.';

    get verb(): string {
        return 'instant.success';
    }

    get title(): string {
        return 'Successful Instant Payment';
    }

    async getMessageFor(recipient: INotificationRecipient): Promise<string> {
        try {
            const receiver = await User.findById(recipient._id) as IUser;
            return await this.getPaymentMessage(receiver);
        } catch (error) {
            return '';
        }
    }

    async getPaymentMessage(receiver: IUser): Promise<string> {
        if (String(this.tran.to_user) === String(receiver._id)) {
            const sender = await this.getSender();
            const senderName = sender ? sender.display_name : '';
            return utils.string.format(
                this.MERCHANT,
                this.tran.description,
                senderName
            );
        }
        const merchant = await this.getReceiver();
        const merchantName = merchant ? merchant.display_name : '';
        return utils.string.format(
            this.BUYER,
            this.tran.description,
            merchantName
        );
    }
}

export class SinglePaymentSuccessMessage extends AbstractTransactionMessage {
    BUYER: string = 'Your single payment transaction for %s with %s was successful.';
    MERCHANT: string = 'Your single payment transaction for %s with %s was successfully received.';

    get verb(): string {
        return 'single.success';
    }

    get title(): string {
        return 'Successful Single Payment';
    }

    async getMessageFor(recipient: INotificationRecipient): Promise<string> {
        try {
            const receiver = await User.findById(recipient._id) as IUser;
            return await this.getPaymentMessage(receiver);
        } catch (error) {
            return '';
        }
    }

    async getPaymentMessage(receiver: IUser): Promise<string> {
        if (String(this.tran.to_user) === String(receiver._id)) {
            const sender = await this.getSender();
            const senderName = sender ? sender.display_name : '';
            return utils.string.format(
                this.MERCHANT,
                this.tran.description,
                senderName
            );
        }
        const merchant = await this.getReceiver();
        const merchantName = merchant ? merchant.display_name : '';
        return utils.string.format(
            this.BUYER,
            this.tran.description,
            merchantName
        );
    }
}

export class ScheduledPaymentSuccessMessage extends AbstractTransactionMessage {
    BUYER: string = 'Your scheduled payment transaction for %s with %s was successful.';
    MERCHANT: string = 'Your scheduled payment transaction for %s with %s was successfully received.';

    get verb(): string {
        return 'schedule.success';
    }

    get title(): string {
        return 'Successful Scheduled Payment Transaction';
    }

    async getMessageFor(recipient: INotificationRecipient): Promise<string> {
        try {
            const receiver = await User.findById(recipient._id) as IUser;
            return await this.getPaymentMessage(receiver);
        } catch (error) {
            return '';
        }
    }

    async getPaymentMessage(receiver: IUser): Promise<string> {

        if (String(this.tran.to_user) === String(receiver._id)) {
            const sender = await this.getSender();
            const senderName = sender ? sender.display_name : '';
            return utils.string.format(
                this.MERCHANT,
                this.tran.description,
                senderName
            );
        }
        const merchant = await this.getReceiver();
        const merchantName = merchant ? merchant.display_name : '';
        return utils.string.format(
            this.BUYER,
            this.tran.description,
            merchantName,
        );
    }
}

export class TransferSuccessMessage extends AbstractTransactionMessage {
    SENDER: string = 'Your fund transfer transaction to %s was successfully sent.';
    RECEIVER: string = 'Your fund transfer transaction from %s was successfully received.';

    get verb(): string {
        return 'transfer.success';
    }

    get title(): string {
        return 'Successful Fund Transfer';
    }

    get type(): string {
        return NOTIFICATION_TYPE.TRANSFER;
    }

    async getTitleFor(recipient: INotificationRecipient): Promise<string> {
        if (String(this.tran.from_user) === String(recipient._id)) {
            return 'Successful Fund Transfer';
        }
        return 'Successful Receive Fund Transfer';
    }

    async getMessageFor(recipient: INotificationRecipient): Promise<string> {
        try {
            if (String(recipient._id) === String(this.tran.from_user)) {
                const receiver = await this.getReceiver();
                const receiverName = receiver ? receiver.display_name : '';
                return utils.string.format(
                    this.SENDER,
                    receiverName
                );
            }

            const sender = await this.getSender();
            const senderName = sender ? sender.display_name : '';
            return utils.string.format(
                this.RECEIVER,
                senderName
            );
        } catch (error) {
            return '';
        }
    }
}

export class DepositSuccessMessage extends AbstractTransactionMessage {
    DEPOSIT: string = 'Your fund deposit transaction was successful.';

    get verb(): string {
        return 'deposit.success';
    }

    get title(): string {
        return 'Successful Fund Deposit';
    }

    get type(): string {
        return NOTIFICATION_TYPE.DEPOSIT;
    }

    async getMessageFor(recipient: INotificationRecipient): Promise<string> {
        try {
            const receiver = await User.findById(recipient._id) as IUser;
            return await this.getDepositMessage(receiver);
        } catch (error) {
            return '';
        }
    }

    async getDepositMessage(receiver: IUser): Promise<string> {
        return utils.string.format(this.DEPOSIT, this.dateTime);
    }
}

export class RefundSuccessedMessage extends AbstractTransactionMessage {
    REFUND: string = 'You receive a refund because your withdrawal was rejected at %s';

    get verb(): string {
        return 'refund.success';
    }

    get title(): string {
        return 'Successful withdrawal refund';
    }

    get type(): string {
        return NOTIFICATION_TYPE.REFUND;
    }

    async getMessageFor(recipient: INotificationRecipient): Promise<string> {
        try {
            const receiver = await User.findById(recipient._id) as IUser;
            return await this.getRefundMessage(receiver);
        } catch (error) {
            return '';
        }
    }

    async getRefundMessage(receiver: IUser): Promise<string> {
        return utils.string.format(this.REFUND, this.dateTime);
    }
}

export class InstantPaymentFailedMessage extends AbstractTransactionMessage {
    BUYER: string = 'Your instant payment transaction for %s with %s was failed.';
    MERCHANT: string = 'Your instant payment transaction for %s with %s was failed.';

    get verb(): string {
        return 'instant.failed';
    }

    get title(): string {
        return 'Unsuccessful Instant Payment';
    }

    async getMessageFor(recipient: INotificationRecipient): Promise<string> {
        try {
            return await this.getPaymentMessage(recipient);
        } catch (error) {
            return '';
        }
    }

    async getPaymentMessage(receiver: INotificationRecipient): Promise<string> {
        if (String(this.tran.to_user) === String(receiver._id)) {
            const sender = await this.getSender();
            const senderName = sender ? sender.display_name : '';
            return utils.string.format(
                this.MERCHANT,
                this.tran.description,
                senderName
            );
        }
        const merchant = await this.getReceiver();
        const merchantName = merchant ? merchant.display_name : '';
        return utils.string.format(
            this.BUYER,
            this.tran.description,
            merchantName
        );
    }
}

export class SinglePaymentFailedMessage extends InstantPaymentFailedMessage {
    BUYER: string = 'Your single payment transaction for %s with %s was failed.';
    MERCHANT: string = 'Your single payment transaction for %s with %s was failed.';

    get verb(): string {
        return 'single.failed';
    }

    get title(): string {
        return 'Unsuccessful Single Payment';
    }
}

export class ScheduledPaymentFailedMessage extends InstantPaymentFailedMessage {
    BUYER: string = 'Your scheduled payment transaction with %s on %s was failed.';
    MERCHANT: string = 'Your scheduled payment transaction for %s on %s was failed.';

    get verb(): string {
        return 'schedule.failed';
    }

    get title(): string {
        return 'Unsuccessful Scheduled Payment Transaction';
    }
}

export class ScheduledRejectMaxfundMessage extends AbstractTransactionMessage {
    BUYER: string = 'You have rejected scheduled payment transaction for service %s with %s of cycle %s.';
    MERCHANT: string = 'Your scheduled payment transaction for service %s of cycle %s exceeds max fund was rejected by %s.';

    get verb(): string {
        return 'schedule.over-max-fund';
    }

    get title(): string {
        return 'Rejected Scheduled Payment Transaction';
    }

    async getMessageFor(recipient: INotificationRecipient): Promise<string> {
        try {
            if (String(this.tran.to_user) === String(recipient._id)) {
                const sender = await this.getSender();
                const senderName = sender ? sender.display_name : '';
                return utils.string.format(
                    this.MERCHANT,
                    this.service,
                    this.scheduleCycle,
                    senderName
                );
            }
            const merchant = await this.getReceiver();
            const merchantName = merchant ? merchant.display_name : '';
            return utils.string.format(
                this.BUYER,
                this.service,
                merchantName,
                this.scheduleCycle
            );
        } catch (error) {
            return '';
        }
    }
}

export class TransferFailedMessage extends AbstractTransactionMessage {
    SENDER: string = 'Your fund transfer transaction to %s was fail to send.';
    RECEIVER: string = 'Your fund transfer transaction from %s was fail to receive.';

    get verb(): string {
        return 'transfer.failed';
    }

    get title(): string {
        return 'Unsuccessful Fund Transfer';
    }

    get type(): string {
        return NOTIFICATION_TYPE.TRANSFER;
    }

    async getTitleFor(recipient: INotificationRecipient): Promise<string> {
        if (String(this.tran.from_user) === String(recipient._id)) {
            return 'Unsuccessful Fund Transfer';
        }
        return 'Unsuccessful Receive Fund Transfer';
    }

    async getMessageFor(recipient: INotificationRecipient): Promise<string> {
        try {
            if (String(recipient._id) === String(this.tran.from_user)) {
                const receiver = await this.getReceiver();
                const receiverName = receiver ? receiver.display_name : '';
                return utils.string.format(
                    this.SENDER,
                    receiverName
                );
            }

            const sender = await this.getSender();
            const senderName = sender ? sender.display_name : '';
            return utils.string.format(
                this.RECEIVER,
                senderName
            );

        } catch (error) {
            return '';
        }
    }
}

export class InstantPaymentConfirmedMessage extends AbstractTransactionMessage {
    BUYER: string = 'You have confirmed instant payment transaction for %s with %s.';
    MERCHANT: string = 'Your instant payment transaction for %s was confirmed by %s.';

    get verb(): string {
        return 'instant.confirmed';
    }

    get title(): string {
        return 'Confirmed Instant Payment';
    }

    async getMessageFor(recipient: INotificationRecipient): Promise<string> {
        try {
            if (String(this.tran.to_user) === String(recipient._id)) {
                const sender = await this.getSender();
                const senderName = sender ? sender.display_name : '';
                return utils.string.format(
                    this.MERCHANT,
                    this.service,
                    senderName
                );
            }
            const merchant = await this.getReceiver();
            const merchantName = merchant ? merchant.display_name : '';
            return utils.string.format(
                this.BUYER,
                this.service,
                merchantName
            );
        } catch (error) {
            return '';
        }
    }
}

export class SinglePaymentConfirmedMessage extends InstantPaymentConfirmedMessage {
    BUYER: string = 'You have confirmed single payment transaction for %s with %s.';
    MERCHANT: string = 'Your single payment transaction for %s was confirmed by %s.';

    get verb(): string {
        return 'single.confirmed';
    }

    get title(): string {
        return 'Confirmed Single Payment';
    }
}

export class WithdrawApproveMessage extends AbstractTransactionMessage {
    WITHDRAWAL: string = 'Your fund withdrawal transaction was approved at %s';

    get verb(): string {
        return 'withdraw.approved';
    }

    get title(): string {
        return 'Approved Fund Withdrawal';
    }

    get type(): string {
        return NOTIFICATION_TYPE.WITHDRAW;
    }

    async getMessageFor(recipient: INotificationRecipient): Promise<string> {
        try {
            const receiver = await User.findById(recipient._id) as IUser;
            return await this.getWithdrawalMessage(receiver);
        } catch (error) {
            return '';
        }
    }

    async getWithdrawalMessage(receiver: IUser): Promise<string> {
        return utils.string.format(this.WITHDRAWAL, this.dateTime);
    }
}

export class WithdrawBlockMessage extends AbstractTransactionMessage {
    WITHDRAWAL: string = 'Your fund withdrawal transaction was blocked at %s.';

    get verb(): string {
        return 'withdraw.blocked';
    }

    get title(): string {
        return 'Blocked Fund Withdrawal';
    }

    get type(): string {
        return NOTIFICATION_TYPE.WITHDRAW;
    }

    async getMessageFor(recipient: INotificationRecipient): Promise<string> {
        try {
            const receiver = await User.findById(recipient._id) as IUser;
            return await this.getWithdrawalMessage(receiver);
        } catch (error) {
            return '';
        }
    }

    async getWithdrawalMessage(receiver: IUser): Promise<string> {
        return utils.string.format(this.WITHDRAWAL, this.dateTime);
    }
}

export class WithdrawConfirmedMessage extends AbstractTransactionMessage {
    WITHDRAWAL: string = 'You have requested a fund withdrawal';

    get verb(): string {
        return 'withdrawal.confirmed';
    }

    get title(): string {
        return 'New Fund Withdrawal';
    }

    get type(): string {
        return NOTIFICATION_TYPE.WITHDRAW;
    }

    async getMessageFor(recipient: INotificationRecipient): Promise<string> {
        try {
            const receiver = await User.findById(recipient._id) as IUser;
            return await this.getWithdrawalMessage(receiver);
        } catch (error) {
            return '';
        }
    }

    async getWithdrawalMessage(receiver: IUser): Promise<string> {
        return this.WITHDRAWAL;
    }
}

export class WithdrawSuccessedMessage extends AbstractTransactionMessage {
    WITHDRAWAL: string = 'Your fund withdrawal transaction was successful at %s.';

    get verb(): string {
        return 'withdrawal.successed';
    }

    get title(): string {
        return 'Successful Fund Withdrawal';
    }

    get type(): string {
        return NOTIFICATION_TYPE.WITHDRAW;
    }

    async getMessageFor(recipient: INotificationRecipient): Promise<string> {
        try {
            const receiver = await User.findById(recipient._id) as IUser;
            return await this.getWithdrawalMessage(receiver);
        } catch (error) {
            return '';
        }
    }

    async getWithdrawalMessage(receiver: IUser): Promise<string> {
        return utils.string.format(this.WITHDRAWAL, this.dateTime);
    }
}

export class WithdrawFailedMessage extends AbstractTransactionMessage {
    WITHDRAWAL: string = 'Your fund withdrawal transaction was failed at %s.';
    NOTE: string = 'The transaction is being processed.';

    get verb(): string {
        return 'withdraw.failed';
    }

    get title(): string {
        return 'Unsuccessful Fund Withdrawal';
    }

    get type(): string {
        return NOTIFICATION_TYPE.WITHDRAW;
    }

    get payload(): any {
        return {
            _id: String(this.tran._id),
            ot: 'transaction',
            tt: this.tran.tran_type,
            bt: this.tran.bill_type || null,
            dt: this.dateTime,
            note: this.NOTE
        };
    }

    async getMessageFor(recipient: INotificationRecipient): Promise<string> {
        return utils.string.format(this.WITHDRAWAL, this.dateTime);
    }
}
