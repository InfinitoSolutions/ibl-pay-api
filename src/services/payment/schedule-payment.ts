import { BILL_TYPE, BILL_STATUS } from '@models/constant';
import { SetupScheduledPaymentConfirmedMessage } from './message';
import { AbstractPaymentMethod } from './abstract-payment';
import { IUser } from '@models/user.model';
import Bill, { IBillDocument, IBill } from '@models/bill.model';
import NotificationManager from '@services/notification/manager';

export class ScheduledPayment extends AbstractPaymentMethod {
    getBillType(): string | null {
        return BILL_TYPE.SCHEDULE;
    }

    /**
     * Buyer confirm a Bill
     * @param {User} user
     * @param {Bill} bill
     * @param {Object} payload = {tx_id, amount}
     */
    async confirm(user: IUser, bill: IBill, payload: any): Promise<IBillDocument> {
        const { tx_id } = payload;
        const updates = {
            bill_type: this.getBillType(),
            agreement_id: tx_id,
            buyers: [{
                address: user.neo_wallet,
                amount: bill.amount,
                user_id: user._id
            }],
            confirmed_by_id: user._id,
            confirmed_at: new Date(),
            status: BILL_STATUS.PROCESSING
        };
        const query = {
            _id: bill._id,
            agreement_id: null,
        };
        const updateOptions = { new: true };
        const confirmedBill = await Bill.findOneAndUpdate(query, updates, updateOptions) as IBillDocument;
        await this.onAgreed(user, confirmedBill);
        return confirmedBill;
    }

    async onAgreed(user: IUser, bill: IBill): Promise<void> {
        const recipients = [{
            _id: bill.merchant_id
        }];
        await new NotificationManager().send(new SetupScheduledPaymentConfirmedMessage(user, bill), recipients);
    }
}
