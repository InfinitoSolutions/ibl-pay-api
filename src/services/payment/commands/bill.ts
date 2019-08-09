import { ICommand } from "@services/interface";
import NotificationManager from "@services/notification/manager";
import Bill, { IBill, IBillDocument } from "@models/bill.model";
import { PaymentNotificationMessageFactory } from "@services/payment/message/factory";
import { BILL_STATUS, SCHEDULE_STATUS } from '@models/constant';
import User, { IUser } from "@models/user.model";
import {
    CancelScheduledBillDueToFrozenBlockedBuyerMessage,
    CancelScheduledBillDueToFrozenBlockedMerchantMessage,
    BillRequestCancelMessage,
    BillRejectRequestCancelMessage,
    BillApproveRequestCancelMessage
} from "@services/payment/message";

export class DeclineBillCommand implements ICommand {
    user: IUser;
    bill: IBill;
    payload: any;
    constructor(user: IUser, bill: IBill, payload: any) {
        this.user = user;
        this.bill = bill;
        this.payload = payload;
        if (!this.bill.bill_type && this.payload && this.payload.bill_type) {
            this.bill.bill_type = this.payload.bill_type;
        }
    }

    async execute(): Promise<void> {
        // update bill status
        await this.updateBillStatus(this.bill);

        // push notification to merchant
        await this.sendNotification();
    }

    async updateBillStatus(bill: IBill): Promise<IBill | null> {
        const query = {
            _id: bill._id,
            status: BILL_STATUS.PENDING
        };
        const updates = {
            status: BILL_STATUS.REJECTED,
            bill_type: this.bill.bill_type,
            buyers: [{
                user_id: this.user._id,
                address: this.user.neo_wallet,
                amount: this.bill.amount
            }],
            rejected_by_id: this.user._id,
            rejected_at: new Date()
        };
        const options = {
            new: true
        };
        return await Bill.findByIdAndUpdate(query, updates, options);
    }

    async sendNotification(): Promise<void> {
        try {
            const actor = {
                _id: this.user._id
            };
            const message = PaymentNotificationMessageFactory.createRejectedBillMessage(actor, this.bill);
            if (message === null) {
                return;
            }
            const recipients = [{
                _id: this.bill.merchant_id
            }, {
                _id: this.user._id
            }];
            await new NotificationManager().send(message, recipients);
        } catch (err) {
            console.log('notify failed: ', err);
        }
    }
}

export class CancelBillCommand implements ICommand {
    bill: IBill;
    constructor(bill: IBill) {
        this.bill = bill;
    }

    async execute(): Promise<void> {
        // update bill status
        await this.updateBillStatus(this.bill);
    }

    async updateBillStatus(bill: IBill): Promise<IBillDocument> {
        const query = {
            _id: bill._id,
            status: BILL_STATUS.PENDING
        };
        const updates = {
            status: BILL_STATUS.CANCELLED
        };
        const options = {
            new: true
        };
        return await Bill.findByIdAndUpdate(query, updates, options) as IBillDocument;
    }
}

export class CancelScheduledBillCommand implements ICommand {
    bill: IBill;
    constructor(bill: IBill) {
        this.bill = bill;
    }

    async execute(): Promise<void> {
        await this.updateBillStatus(this.bill);
        this.sendNotification();
    }

    async updateBillStatus(bill: IBill): Promise<IBillDocument> {
        const query = {
            _id: bill._id,
            status: BILL_STATUS.PENDING
        };
        const updates = {
            status: BILL_STATUS.CANCELLED
        };
        const options = {
            new: true
        };
        return await Bill.findByIdAndUpdate(query, updates, options) as IBillDocument;
    }

    async sendNotification(): Promise<void> {
        const buyer = await User.findById(this.bill.confirmed_by_id) as IUser;
        const recipients = [{
            _id: this.bill.merchant_id
        }, {
            _id: this.bill.confirmed_by_id
        }];
        const actor = {
            _id: undefined
        };
        if (buyer && buyer.isFrozenOrBlocked()) {
            const message = new CancelScheduledBillDueToFrozenBlockedBuyerMessage(actor, this.bill);
            new NotificationManager().send(message, recipients);
            return;
        }
        const merchant = await User.findById(this.bill.merchant_id) as IUser;
        if (merchant && merchant.isFrozenOrBlocked()) {
            const message = new CancelScheduledBillDueToFrozenBlockedMerchantMessage(actor, this.bill);
            new NotificationManager().send(message, recipients);
            return;
        }
    }
}

export class NotifyCancelScheduleCommand implements ICommand {
    bill: IBill;
    requester: IUser;
    payload: any;
    constructor(bill: IBill, user: IUser, payload: any) {
        this.bill = bill;
        this.requester = user;
        this.payload = payload;
    }

    async execute(): Promise<void> {
        await this.updateBillStatus(this.bill);
        this.sendNotification();
    }

    async updateBillStatus(bill: IBill): Promise<IBillDocument> {
        const query = {
            _id: bill._id
        };
        const updates = {$set: {
            "recurring.status": SCHEDULE_STATUS.CANCEL_REQUEST,
            "recurring.cancel_requester": this.requester._id,
            "recurring.transaction_str": this.payload.tranStr
        }};
        const options = {
            new: true
        };
        return await Bill.findByIdAndUpdate(query, updates, options) as IBillDocument;
    }

    async sendNotification(): Promise<void> {
        const isMerchant = this.requester._id.equals(this.bill.merchant_id)
        const recipients = [
            {_id: isMerchant ? this.bill.confirmed_by_id : this.bill.merchant_id}
        ];
        const actor = {
            _id: undefined
        };
        const message = new BillRequestCancelMessage(actor, this.bill);
        new NotificationManager().send(message, recipients);
    }
}

export class UpdateRejectedCancelBillCommand implements ICommand {
    bill: IBill;
    requester: IUser;
    constructor(bill: IBill, user: IUser) {
        this.bill = bill;
        this.requester = user;
    }

    async execute(): Promise<void> {
        await this.updateBillStatus(this.bill);
        this.sendNotification();
    }

    async updateBillStatus(bill: IBill): Promise<IBillDocument> {
        const query = {
            _id: bill._id
        };
        const updates = {
            "recurring.status": null,
            "recurring.cancel_requester": null
        };
        const options = {
            new: true
        };
        return await Bill.findByIdAndUpdate(query, updates, options) as IBillDocument;
    }

    async sendNotification(): Promise<void> {
        const isMerchant = this.requester._id.equals(this.bill.merchant_id)
        const recipients = [
            {_id: isMerchant ? this.bill.confirmed_by_id : this.bill.merchant_id}
        ];
        const actor = {
            _id: undefined
        };
        const message = new BillRejectRequestCancelMessage(actor, this.bill);
        new NotificationManager().send(message, recipients);
    }
}

export class UpdateApprovedCancelBillCommand implements ICommand {
    bill: IBill;
    requester: IUser;
    constructor(bill: IBill, user: IUser) {
        this.bill = bill;
        this.requester = user;
    }

    async execute(): Promise<void> {
        await this.updateBillStatus(this.bill);
        this.sendNotification();
    }

    async updateBillStatus(bill: IBill): Promise<IBillDocument> {
        const query = {
            _id: bill._id
        };
        const updates = {
            "status": BILL_STATUS.CANCELLED,
            "recurring.status": BILL_STATUS.CANCELLED,
            "recurring.next_run_at": null
        };
        const options = {
            new: true
        };
        return await Bill.findByIdAndUpdate(query, updates, options) as IBillDocument;
    }

    async sendNotification(): Promise<void> {
        const isMerchant = this.requester._id.equals(this.bill.merchant_id)
        const recipients = [
            {_id: isMerchant ? this.bill.confirmed_by_id : this.bill.merchant_id}
        ];
        const actor = {
            _id: undefined
        };
        const message = new BillApproveRequestCancelMessage(actor, this.bill);
        new NotificationManager().send(message, recipients);
    }
}
