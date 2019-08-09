import { NOTIFICATION_TYPE } from '@models/constant';
import { AbstractTransactionMessage } from '@services/payment/message/transaction';
import { INotificationRecipient } from '@services/notification/interface';

export class RequestWithdrawalMessage extends AbstractTransactionMessage {
    SENDER = 'You have requested a fund withdrawal.';

    get verb(): string {
        return 'withdraw.requested';
    }

    get title(): string {
        return 'New Fund Withdrawal';
    }

    get payload(): any {
        return {
            _id: String(this.tran._id),
            ot: 'transaction',
            tt: this.tran.tran_type
        };
    }

    get type(): string {
        return NOTIFICATION_TYPE.WITHDRAW;
    }

    async getMessageFor(recipient: INotificationRecipient): Promise<string> {
        return this.SENDER;
    }
}

export class PendingWithdrawalRequestMessage extends AbstractTransactionMessage {
    STATUS: string = 'Pending';
    NOTE: string = `Should you have any queries, please contact our operator via following email address: ${process.env.EMAIL_SUPPORT}`;

    get verb(): string {
        return 'withdraw.pending';
    }

    get type(): string {
        return NOTIFICATION_TYPE.WITHDRAW;
    }

    get title(): string {
        return 'Pending Fund Withdrawal';
    }

    get payload(): any {
        return {
            _id: String(this.tran._id),
            ot: 'transaction',
            tt: this.tran.tran_type,
            dt: this.dateTime,
            pl: this.payloads,
            status: this.STATUS,
            note: this.NOTE,
        };
    }

    async getMessageFor(recipient: INotificationRecipient): Promise<string> {
        return 'Your fund withdrawal transaction was pending.';
    }
}

export class RejectedWithdrawalRequestMessage extends AbstractTransactionMessage {
    STATUS: string = 'Rejected';
    NOTE: string = `Should you have any queries, please contact our operator via following email address: ${process.env.EMAIL_SUPPORT}`;

    get verb(): string {
        return 'withdraw.rejected';
    }

    get type(): string {
        return NOTIFICATION_TYPE.WITHDRAW;
    }

    get title(): string {
        return 'Rejected Fund Withdrawal';
    }

    get payload(): any {
        return {
            _id: String(this.tran._id),
            ot: 'transaction',
            tt: this.tran.tran_type,
            dt: this.dateTime,
            pl: this.payloads,
            status: this.STATUS,
            note: this.NOTE,
        };
    }

    async getMessageFor(recipient: INotificationRecipient): Promise<string> {
        return 'Your fund withdrawal transaction was rejected.';
    }
}


export class BlockedWithdrawalRequestMessage extends AbstractTransactionMessage {
    STATUS: string = 'Blocked';
    NOTE: string = `Should you have any queries, please contact our operator via following email address: ${process.env.EMAIL_SUPPORT}`;

    get verb(): string {
        return 'withdraw.blocked';
    }

    get type(): string {
        return NOTIFICATION_TYPE.WITHDRAW;
    }

    get title(): string {
        return 'Blocked Fund Withdrawal';
    }

    get payload(): any {
        return {
            _id: String(this.tran._id),
            ot: 'transaction',
            tt: this.tran.tran_type,
            dt: this.dateTime,
            pl: this.payloads,
            status: this.STATUS,
            note: this.NOTE
        };
    }

    async getMessageFor(recipient: INotificationRecipient): Promise<string> {
        return 'Your fund withdrawal transaction was blocked.';
    }
}


export class ApprovedWithdrawalRequestMessage extends AbstractTransactionMessage {
    STATUS: string = 'Approved';
    NOTE: string = 'Your fund willbe sent to receive address soon.';

    get verb(): string {
        return 'withdraw.approved';
    }

    get type(): string {
        return NOTIFICATION_TYPE.WITHDRAW;
    }

    get title(): string {
        return 'Approved Fund Withdrawal';
    }

    get payload(): any {
        return {
            _id: String(this.tran._id),
            ot: 'transaction',
            tt: this.tran.tran_type,
            dt: this.dateTime,
            pl: this.payloads,
            status: this.STATUS,
            note: this.NOTE
        };
    }

    async getMessageFor(recipient: INotificationRecipient): Promise<string> {
        return 'Your fund withdrawal transaction was approved.';
    }
}
