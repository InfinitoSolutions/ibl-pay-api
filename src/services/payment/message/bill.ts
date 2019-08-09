import { IBill } from '@models/bill.model';
import utils from '@utils/index';
import User, { IUser } from '@models/user.model';
import { NOTIFICATION_TYPE } from '@models/constant';
import {
    INotificationMessage,
    INotificationActor,
    INotificationRecipient
} from '@services/notification/interface';
import Transaction from '@models/transaction.model';
import moment from 'moment';


export abstract class AbstractBillMessage implements INotificationMessage {
    actor: INotificationActor;
    bill: IBill;

    constructor(actor: INotificationActor, bill: IBill) {
        this.actor = actor;
        this.bill = bill;
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
            _id: String(this.bill._id),
            ot: 'bill',
            bt: this.bill.bill_type
        };
    }

    get service(): string {
        const s = this.bill.service ? this.bill.service : '';
        return utils.string.removeNewLines(s);
    }

    get dateTime(): string {
        return utils.date.formatDateTime(this.bill.updatedAt);
    }

    async getMerchant(): Promise<IUser | null> {
        try {
            return await User.findById(this.bill.merchant_id);
        } catch (error) {
            return null;
        }
    }

    async getActorUser(): Promise<IUser | null> {
        try {
            return await User.findById(this.actor._id);
        } catch (error) {
            return null;
        }
    }
}

export class BillCreatedMessage extends AbstractBillMessage {

    get verb(): string {
        return 'bill.created';
    }

    get visible(): boolean {
        return false;
    }

    async getMessageFor(recipient: INotificationRecipient): Promise<string> {
        const display_name = this.actor.display_name ? this.actor.display_name : '';
        return `${display_name} has created a payment for ${this.bill.service}`;
    }
}

export class BillProceededMessage extends AbstractBillMessage {

    get verb(): string {
        return 'bill.proceeded';
    }

    get visible(): boolean {
        return false;
    }

    async getMessageFor(recipient: INotificationRecipient): Promise<string> {
        return ``;
    }
}

export class SetupScheduledPaymentConfirmedMessage extends AbstractBillMessage {
    BUYER = 'You have confirmed scheduled payment setup for %s with %s.';
    MERCHANT = 'Buyer %s has confirmed scheduled payment setup for %s.';

    get verb(): string {
        return 'schedule-setup.confirmed';
    }

    get title(): string {
        return 'Confirmed Scheduled Payment Setup';
    }

    get payload(): any {
        return {
            _id: String(this.bill._id),
            ot: 'bill',
            bt: this.bill.bill_type,
            agreement_id: this.bill.agreement_id
        };
    }

    async getMessageFor(recipient: INotificationRecipient): Promise<string> {
        if (String(this.bill.merchant_id) === String(recipient._id)) {
            const buyer = await this.getBuyer();
            const buyerName = buyer ? buyer.display_name : '';
            return utils.string.format(this.MERCHANT, buyerName, this.service);
        }
        const merchant = await this.getMerchant();
        const merchantName = merchant ? merchant.display_name : '';
        return utils.string.format(this.BUYER, this.service, merchantName);
    }

    async getBuyer(): Promise<IUser | null> {
        try {
            return await User.findById(this.actor._id);
        } catch (error) {
            return null;
        }
    }

    async getMerchant(): Promise<IUser | null> {
        try {
            return await User.findById(this.bill.merchant_id);
        } catch (error) {
            return null;
        }
    }
}

export class SetupScheduledPaymentSuccessMessage extends AbstractBillMessage {
    BUYER = 'Your scheduled payment transaction for %s with %s was successfully setup.';
    MERCHANT = 'Your scheduled payment for %s with %s was successfully setup.';

    get verb(): string {
        return 'schedule-setup.success';
    }

    get title(): string {
        return 'Successful Scheduled Payment Setup';
    }

    get payload(): any {
        return {
            _id: String(this.bill._id),
            ot: 'bill',
            bt: this.bill.bill_type,
            agreement_id: this.bill.agreement_id
        };
    }

    async getMessageFor(recipient: INotificationRecipient): Promise<string> {
        if (String(this.bill.merchant_id === recipient._id)) {
            const merchant = await this.getMerchant();
            const merchantName = merchant ? merchant.display_name : '';
            return utils.string.format(this.MERCHANT, this.service, merchantName);
        }
        const buyer = await this.getBuyer();
        const buyerName = buyer ? buyer.display_name : '';
        return utils.string.format(this.BUYER, this.service, buyerName);
    }

    async getBuyer(): Promise<IUser | null> {
        try {
            return await User.findById(this.actor._id);
        } catch (error) {
            return null;
        }
    }

    async getMerchant(): Promise<IUser | null> {
        try {
            return await User.findById(this.bill.merchant_id);
        } catch (error) {
            return null;
        }
    }
}

export class SetupScheduledPaymentFailedMessage extends AbstractBillMessage {
    BUYER = 'Your scheduled payment setup for %s with %s was failed.';
    MERCHANT = 'Your scheduled payment setup for %s with %s was failed.';

    get verb(): string {
        return 'schedule-setup.failed';
    }

    get title(): string {
        return 'Unsuccessful Scheduled Payment Setup';
    }

    get payload(): any {
        return {
            _id: String(this.bill._id),
            ot: 'bill',
            bt: this.bill.bill_type,
            agreement_id: this.bill.agreement_id
        };
    }

    async getMessageFor(recipient: INotificationRecipient): Promise<string> {
        if (String(this.bill.merchant_id === recipient._id)) {
            const merchant = await this.getMerchant();
            const merchantName = merchant ? merchant.display_name : '';
            return utils.string.format(this.MERCHANT, this.service, merchantName);
        }
        const buyer = await this.getBuyer();
        const buyerName = buyer ? buyer.display_name : '';
        return utils.string.format(this.BUYER, this.service, buyerName);
    }

    async getBuyer(): Promise<IUser | null> {
        try {
            return await User.findById(this.actor._id);
        } catch (error) {
            return null;
        }
    }

    async getMerchant(): Promise<IUser | null> {
        try {
            return await User.findById(this.bill.merchant_id);
        } catch (error) {
            return null;
        }
    }
}

export class ScheduledPaymentReminderMessage extends AbstractBillMessage {
    tran_ids: string[] = [];
    MERCHANT: string = "It's time to pull fund of your scheduled payment for %s with %s.";

    constructor(actor: INotificationActor, bill: IBill, tran_ids: string[]) {
        super(actor, bill);
        this.tran_ids = tran_ids;
    }

    get verb(): string {
        return 'schedule.reminded';
    }

    get title(): string {
        return 'Pull Scheduled Payment Reminder';
    }

    get payload(): any {
        return {
            _id: String(this.bill._id),
            ot: 'bill',
            bt: this.bill.bill_type,
            max_fund: this.bill.recurring.max_fund,
            tran_ids: this.tran_ids
        };
    }

    async getMessageFor(recipient: INotificationRecipient): Promise<string> {
        const tranId = this.tran_ids[0];
        const tran = await Transaction.findById(tranId);
        let buyerName: any = '';
        if (tran) {
            const buyer = await User.findById(tran.from_user);
            buyerName = buyer ? buyer.display_name : '';
        }
        return utils.string.format(this.MERCHANT, this.service, buyerName);
    }
}

export class RejectedInstantPaymentMessage extends AbstractBillMessage {
    BUYER: string = 'You have rejected instant payment transaction for %s with %s.';
    MERCHANT: string = 'Your instant payment transaction for %s was rejected by %s.';

    get verb(): string {
        return 'instant.rejected';
    }

    get title(): string {
        return 'Rejected Instant Payment';
    }

    async getMessageFor(recipient: INotificationRecipient): Promise<string> {
        if (String(this.bill.merchant_id) === String(recipient._id)) {
            const buyer = await this.getActorUser();
            const buyerName = buyer ? buyer.display_name : '';
            return utils.string.format(this.MERCHANT, this.service, buyerName);
        }
        const merchant = await this.getMerchant();
        const merchantName = merchant ? merchant.display_name : '';
        return utils.string.format(this.BUYER, this.service, merchantName);
    }
}

export class RejectedSinglePaymentMessage extends RejectedInstantPaymentMessage {
    BUYER: string = 'You have rejected single payment transaction for %s with %s.';
    MERCHANT: string = 'Your single payment transaction for %s was rejected by %s.';

    get verb(): string {
        return 'single.rejected';
    }

    get title(): string {
        return 'Rejected Single Payment';
    }
}

export class RejectedScheduledPaymentSetupMessage extends AbstractBillMessage {
    BUYER: string = 'You have rejected scheduled payment setup for %s with %s.';
    MERCHANT: string = 'Buyer %s has rejected scheduled payment setup for %s.';

    get verb(): string {
        return 'schedule-setup.rejected';
    }

    get title(): string {
        return 'Rejected Scheduled Payment Setup';
    }

    async getMessageFor(recipient: INotificationRecipient): Promise<string> {
        if (String(this.bill.merchant_id) === String(recipient._id)) {
            const buyer = await this.getActorUser();
            const buyerName = buyer ? buyer.display_name : '';
            return utils.string.format(this.MERCHANT, buyerName, this.service);
        }
        const merchant = await this.getMerchant();
        const merchantName = merchant ? merchant.display_name : '';
        return utils.string.format(this.BUYER, this.service, merchantName);
    }
}

export class CancelScheduledBillDueToFrozenBlockedMerchantMessage extends AbstractBillMessage {
    BUYER: string = 'Your scheduled payment transaction for cycle %s of %s was cancelled due to merchant is frozen/blocked.';
    MERCHANT: string = 'Your scheduled payment transaction for cycle %s of %s was cancelled because your account is frozen/blocked.';

    get verb(): string {
        return 'merchant.frozen-blocked';
    }

    get title(): string {
        return 'Frozen/Blocked Merchant';
    }

    get dateTime(): string {
        const runAt = this.bill.recurring.next_run_at;
        if (!runAt) {
            return '';
        }
        return utils.date.formatDateTime(runAt);
    }

    async getMessageFor(recipient: INotificationRecipient): Promise<string> {
        if (String(this.bill.merchant_id) === String(recipient._id)) {
            return utils.string.format(this.MERCHANT, this.dateTime, this.service);
        }
        return utils.string.format(this.BUYER, this.dateTime, this.service);
    }
}

export class CancelScheduledBillDueToFrozenBlockedBuyerMessage extends CancelScheduledBillDueToFrozenBlockedMerchantMessage {
    BUYER: string = 'Your scheduled payment transaction for cycle %s of %s was cancelled because your account is frozen/blocked.';
    MERCHANT: string = 'Your scheduled payment transaction for cycle %s of %s was cancelled due to buyer is frozen/blocked.';

    get verb(): string {
        return 'buyer.frozen-blocked';
    }

    get title(): string {
        return 'Frozen/Blocked Buyer';
    }
}

export class BillRequestCancelMessage extends AbstractBillMessage {
    BUYER: string = 'Your scheduled payment transaction for cycle %s to %s of %s was requested to cancel by receiver. Please confirm for processing.';
    MERCHANT: string = 'Your scheduled payment transaction for cycle %s to %s of %s was requested to cancel by payer. Please confirm for processing.';

    get verb(): string {
        return 'bill.request-cancel-bill';
    }

    get title(): string {
        return 'Request Cancel Schedule Bill';
    }

    get start(): string {
        const date = moment(this.bill.recurring.start_date).format('YYYY-MM-DD')
        const time = moment.utc(this.bill.recurring.schedule_time, "HH:mm:ss").local().format('HH:mm:ss')
        return utils.date.formatDateTime(moment(`${date} ${time}`).toDate());
    }

    get end(): string {
        const date = moment(this.bill.recurring.end_date).format('YYYY-MM-DD')
        const time = moment.utc(this.bill.recurring.schedule_time, "HH:mm:ss").local().format('HH:mm:ss')
        return utils.date.formatDateTime(moment(`${date} ${time}`).toDate());
    }

    async getMessageFor(recipient: INotificationRecipient): Promise<string> {
        const message = String(this.bill.merchant_id) === String(recipient._id) ? this.MERCHANT : this.BUYER
        return utils.string.format(message, this.start, this.end, this.service);
    }
}

export class BillRejectRequestCancelMessage extends AbstractBillMessage {
    BUYER: string = 'Your scheduled payment transaction for cycle %s to %s of %s was rejected to cancel by receiver.';
    MERCHANT: string = 'Your scheduled payment transaction for cycle %s to %s of %s was rejected to cancel by payer.';

    get verb(): string {
        return 'bill.reject-cancel-bill';
    }

    get title(): string {
        return 'Rejected Cancel Request Schedule Bill';
    }

    get start(): string {
        const date = moment(this.bill.recurring.start_date).format('YYYY-MM-DD')
        const time = moment.utc(this.bill.recurring.schedule_time, "HH:mm:ss").local().format('HH:mm:ss')
        return utils.date.formatDateTime(moment(`${date} ${time}`).toDate());
    }

    get end(): string {
        const date = moment(this.bill.recurring.end_date).format('YYYY-MM-DD')
        const time = moment.utc(this.bill.recurring.schedule_time, "HH:mm:ss").local().format('HH:mm:ss')
        return utils.date.formatDateTime(moment(`${date} ${time}`).toDate());
    }

    async getMessageFor(recipient: INotificationRecipient): Promise<string> {
        const message = String(this.bill.merchant_id) === String(recipient._id) ? this.MERCHANT : this.BUYER
        return utils.string.format(message, this.start, this.end, this.service);
    }
}

export class BillApproveRequestCancelMessage extends AbstractBillMessage {
    BUYER: string = 'Your scheduled payment transaction for cycle %s to %s of %s was approved to cancel by receiver.';
    MERCHANT: string = 'Your scheduled payment transaction for cycle %s to %s of %s was approved to cancel by payer.';

    get verb(): string {
        return 'bill.approve-cancel-bill';
    }

    get title(): string {
        return 'Approved Cancel Request Schedule Bill';
    }

    get start(): string {
        const date = moment(this.bill.recurring.start_date).format('YYYY-MM-DD')
        const time = moment.utc(this.bill.recurring.schedule_time, "HH:mm:ss").local().format('HH:mm:ss')
        return utils.date.formatDateTime(moment(`${date} ${time}`).toDate());
    }

    get end(): string {
        const date = moment(this.bill.recurring.end_date).format('YYYY-MM-DD')
        const time = moment.utc(this.bill.recurring.schedule_time, "HH:mm:ss").local().format('HH:mm:ss')
        return utils.date.formatDateTime(moment(`${date} ${time}`).toDate());
    }

    async getMessageFor(recipient: INotificationRecipient): Promise<string> {
        const message = String(this.bill.merchant_id) === String(recipient._id) ? this.MERCHANT : this.BUYER
        return utils.string.format(message, this.start, this.end, this.service);
    }
}
