import Bill, { IBillDocument, IBill } from '@models/bill.model';
import Transaction from '@models/transaction.model';
import User, { IUser } from '@models/user.model';
import {
    BILL_TYPE,
    BILL_STATUS,
    TRANSACTION_STATUS,
} from '@models/constant';
import {
    BillProceededMessage,
    BillSharedMessage,
} from './message';
import { AbstractPaymentMethod } from './abstract-payment';
import NotificationManager from '@services/notification/manager';

export class SharedPayment extends AbstractPaymentMethod {
    getBillType(): string | null {
        return BILL_TYPE.SHARE;
    }

    async proceed(user: IUser, bill: IBillDocument, payload: any): Promise<IBillDocument | null> {
        bill.status = BILL_STATUS.COMPLETED;
        const result = await bill.save();
        await this.onProceeded(user, bill);
        return result;
    }

    async confirm(user: IUser, bill: any, payload: any): Promise<IBillDocument> {
        return super.confirm(user, bill, payload);
    }

    async onShared(user: IUser, bill: any, address: any) {
        const recipients = await User.find({ neo_wallet: address });
        await new NotificationManager().send(new BillSharedMessage(user, bill), recipients);
    }

    async onProceeded(user: IUser, bill: any) {
        const recipients = await this.getBuyers(bill);
        await new NotificationManager().send(new BillProceededMessage(user, bill), recipients);
    }

    async updateBuyers(user: IUser, bill: IBill, payload: any, buyerAddress: string): Promise<any> {
        const { address, amount } = payload;
        let buyers: any = bill.buyers || [];
        const found = (buyers.filter((b: any) => b.address === buyerAddress).length > 0);

        if (found) {
            await this.cancelTrans(bill, buyerAddress);
            const a = await Bill.update({
                _id: bill._id,
            }, { '$pull': { buyers: { address: buyerAddress } } });
        }

        if (address) {
            buyers['$push'] = { buyers: { address, amount } };
            await Bill.update({ _id: bill._id }, { '$push': { buyers: { address: address, amount: amount } } });
            await this.onShared(user, bill, address);
        }
        return bill;
    }

    async cancelTrans(bill: IBill, address: string) {
        let tran: any = await Transaction.findOne({ bill_id: bill._id, from_address: address });
        tran.status = TRANSACTION_STATUS.CANCELLED;
        await tran.save();
    }
}
