import { NOTIFICATION_TYPE } from '@models/constant';
import { AbstractTransactionMessage } from '@services/payment/message/transaction';
import utils from '@utils/index';
import { INotificationRecipient } from '@services/notification/interface';

export class TransferTransactionConfirmedMessage extends AbstractTransactionMessage {
    TO_SENDER = 'You have confirmed fund transfer transaction to %s.';
    TO_RECEIVER = '%s have confirmed fund transfer transaction to you.';

    get verb(): string {
        return 'transfer.confirmed';
    }

    get title(): string {
        return 'Confirmed Send Fund Transfer';
    }

    get payload(): any {
        return {
            _id: String(this.tran._id),
            ot: 'transaction',
            tt: this.tran.tran_type
        };
    }

    get type(): string {
        return NOTIFICATION_TYPE.TRANSFER;
    }

    async getTitleFor(recipient: INotificationRecipient): Promise<string> {
        if (String(this.tran.from_user) === String(recipient._id)) {
            return 'Confirmed Send Fund Transfer';
        }
        return 'Confirmed Receive Fund Transfer';
    }

    async getMessageFor(recipient: INotificationRecipient): Promise<string> {
        if (String(this.tran.from_user) === String(recipient._id)) {
            const receiver = await this.getReceiver();
            const receiverName = receiver ? receiver.display_name : '';
            return utils.string.format(this.TO_SENDER, receiverName);
        }
        const sender = await this.getSender();
        const senderName = sender ? sender.display_name : '';
        return utils.string.format(this.TO_RECEIVER, senderName);
    }
}
