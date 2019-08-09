import NotificationManager from "@services/notification/manager";
import { PaymentScheduler } from './scheduler';

import Bill, { IBillDocument, IBill } from '@models/bill.model';
import Transaction, { ITransactionDocument, ITransaction } from '@models/transaction.model';
import User, { IUser } from '@models/user.model';

import {
    TRANSACTION_STATUS,
    USER_ROLE,
    BILL_STATUS,
    BILL_TYPE
} from '@models/constant';

import {
    BillCreatedMessage,
} from './message';
import { PaymentNotificationMessageFactory } from "@services/payment/message/factory";
import { CurrencyConverter } from "@services/currency";
import { getCommissionRate } from '@services/withdraw/commission';
import CommissionFee from '@models/commission.model';
import config from 'config';
import {getTransactionSequence} from '@services/transaction';
import Number from '@utils/number';

/**
 * There are 3 user cases to create a Transaction
 * 
 * USER CASE 1: Merchant scan Buyer's QR code
 * 
 * 1. Merchant create bill
 * 2. Merchant scan Buyer's QR code
 * 3. Merchant calls API to submit bill
 * 4. API store bill and notify all buyers
 * - 4.1. API store bill
 * - 4.2. API create PENDING transaction for each buyers with TX ID = null
 * - 4.3. Send Notification to all buyers
 * 5. Buyer confirm bill
 *  - 5.1. Buyer calls NEO API to create transaction
 *  - 5.2. Buyer calls API to submit transaction and TX ID
 *  - 5.3. API Update tx_id = TX ID, status = PROCESSING
 * 6. API monitor TX ID and notify Merchant once it is confirmed
 * - 6.1. Lock Transaction (set locked_at = new Date())
 * - 6.2. Call NEO API to check status of TX ID (based on block_height)
 * - 6.3. Update status = COMPLETED if transactions has been confirmed on NEO
 * - 6.4. Unlock Transaction
 * 
 * USER CASE 2: Buyer scan bill.
 * 
 * 1. Merchant create bill and generate QR code (There is no PENDING trans at this time)
 * 2. Buyer scan bill
 * 3. Buyer enters amount and confirm Payment
 * - 3.1. Buyer calls NEO API to submit a transaction
 * - 3.2. Buyer calls API to submit transaction and TX ID
 * - 3.3. API create Transaction with tx_id = TX ID, status = PROCESSING
 * 4. API monitor TX ID and notify Merchant once it is confirmed.
 * - 4.1. Lock Transaction (set locked_at = new Date())
 * - 4.2. Call NEO API to check status of TX ID (based on block_height)
 * - 4.3. Update status = COMPLETED if transactions has been confirmed on NEO
 * - 4.4. Unlock Transaction
 * 
 * USER CASE 3: System invoke a Scheduled Payment
 * 
 * 1. System find scheduled Payment
 * 2. System create a PENDING transaction
 * 3. System send notification to Buyer to confirm
 * 4. Buyer confirm Payment
 * - 4.1. Buyer calls NEO API to create Transaction
 * - 4.2. Buyer calls API to submit transaction and TX ID
 * - 4.3. API update transaction tx_id = TX ID, status = PROCESSING
 * 5. System monitor transaction of TX ID on NEO to update status
 * - 5.1. Lock Transaction (set locked_at = new Date())
 * - 5.2. Call NEO API to check status of TX ID (based on block_height)
 * - 5.3. Update status = COMPLETED if transactions has been confirmed on NEO
 * - 5.4. Unlock Transaction
 */

export abstract class AbstractPaymentMethod {
    abstract getBillType(): string | null;

    /**
     * Does Payment Type support recurring?
     */
    allowsRecurring(): boolean {
        return true;
    }

    /**
     * Load Bill model of given ID
     * @param {String} billId
     * @return Bill or throws error if Bill ID does not exist
     */
    async load(billId: string): Promise<IBillDocument> {
        const bill = await Bill.findById(billId);
        if (!bill) {
            throw new Error('Invalid Bill ID');
        }
        return bill;
    }

    async create(user: IUser, payload: any): Promise<IBillDocument> {
        let {
            merchant_address,
            amount,
            currency,
            service,
            bill_type,
            is_recurring,
            recurring
        } = payload;

        const exchange = await CurrencyConverter.convertToUsd(amount, currency);
        const usd_rate = exchange.usd_rate;
        const amount_usd = exchange.amount_usd;
        const merchant = await User.findOne({neo_wallet: merchant_address});

        /**
         * Schedule next_run_at time for recurring bill.
         */
        if (this.allowsRecurring() && is_recurring) {
            recurring = this.normalizeRecurring(recurring);
        } else {
            recurring = null;
        }
        const bill = await Bill.create({
            service: service,
            amount: amount,
            currency: currency,
            merchant_address: merchant_address,
            bill_type: bill_type,
            creator_id: user._id,
            merchant_id: merchant._id,
            is_recurring: is_recurring,
            recurring: recurring || null,
            buyers: [],
            tx_seq: await getTransactionSequence(),
            amount_usd,
            usd_rate
        });
        return bill;
    }

    normalizeRecurring(recurring: any) {
        const scheduler = PaymentScheduler.factory(recurring);
        scheduler.schedule();
        if (!scheduler.validate()) {
            throw new Error('Invalid scheduled time');
        }
        return scheduler.toJSON();
    }

    /**
     * Create PENDING transactions for Bills
     * 
     * @param {IBill} bill
     * @param {Object} buyers = {address, amount}
     */
    async createPendingTransactions(bill: IBill): Promise<ITransactionDocument[]> {
        const merchant = await User.findById(bill.merchant_id);
        const users = await this.getBuyers(bill);

        const amount = bill.amount;
        const exchange = await CurrencyConverter.convertToUsd(amount, bill.currency);
        const usd_rate = exchange.usd_rate;
        const amount_usd = exchange.amount_usd;
        // const fee = await this.getCommissionRate(buyer);
        const commissionRate = await CommissionFee.findOne({ type: 'SCHEDULE' });
        const fee = commissionRate ? commissionRate.fee_percentage : config.get('payment.fee.BTC');

        const trans = await Promise.all(users.map(async (buyer: IUser) => {
            const commissionFee = await Number.roundFee(fee, amount);

            const keywords: string[] = [bill.service];
            if (merchant && merchant.display_name) {
                keywords.push(merchant.display_name);
            }
            if (buyer.display_name) {
                keywords.push(buyer.display_name);
            }
            const address = buyer.neo_wallet;

            let params: any = {
                tx_seq: await getTransactionSequence(),
                bill_id: bill._id,
                bill_type: bill.bill_type,
                to_address: bill.merchant_address,
                to_user: bill.merchant_id,
                from_address: address,
                from_user: buyer._id,
                status: TRANSACTION_STATUS.PENDING,
                amount: amount,
                currency: bill.currency,
                request_amount: amount,
                description: bill.service,
                keywords: keywords,
                amount_usd,
                usd_rate,
                commission_fee: commissionFee,
                commission_percentage: fee,
            };

            if (bill.is_recurring) {
                params['schedule_time'] = bill.recurring.next_run_at;
                params['schedule_type'] = bill.recurring.recurring_type;
            }
            return new Transaction(params);
        }));

        return await Transaction.insertMany(trans);
    }

    /**
     * Buyer confirm a Bill
     * 
     * @param {IUser} user
     * @param {IBillDocument} bill
     * @param {Object} payload = {tx_id, amount}
     */
    async confirm(user: IUser, bill: IBillDocument, payload: any): Promise<IBillDocument> {
        const {
            tx_id,
            amount,
        } = payload;

        const exchange = await CurrencyConverter.convertToUsd(amount, bill.currency);
        const usd_rate = exchange.usd_rate;
        const amount_usd = exchange.amount_usd;

        const address = user.neo_wallet;
        const bill_updated = await this.updateConfirmedBill(user, bill, payload);

        const merchant = await User.findById(bill.merchant_id);
        const keywords: string[] = [bill.service];
        if (merchant && merchant.display_name) {
            keywords.push(merchant.display_name);
        }
        if (user.display_name) {
            keywords.push(user.display_name);
        }

        const tran = await Transaction.create({
            bill_id: bill_updated._id,
            bill_type: bill_updated.bill_type,
            tx_id: tx_id,
            tx_seq: await getTransactionSequence(),
            amount: amount,
            request_amount: amount,
            currency: bill_updated.currency,
            from_user: user._id,
            from_address: address,
            to_address: bill_updated.merchant_address,
            to_user: bill_updated.merchant_id,
            status: TRANSACTION_STATUS.PROCESSING,
            confirmed_at: new Date(),
            description: bill_updated.service,
            keywords,
            amount_usd,
            usd_rate
        });

        await this.onConfirmed(user, bill_updated, tran);
        return bill_updated;
    }

    /**
     * Update bill after Buyer confirmed
     * 
     * @param {User} user
     * @param {Bill} bill
     * @param {Object} payload = {tx_id, amount, address}
     */
    async updateConfirmedBill(user: IUser, bill: IBill, payload: any): Promise<IBillDocument> {
        const { amount } = payload;
        const address = user.neo_wallet;
        let updates: any = {
            bill_type: this.getBillType(),
            confirmed_by_id: user._id,
            confirmed_at: new Date(),
            buyers: [{ address, amount, user_id: user._id }],
            status: BILL_STATUS.CONFIRMED
        };
        const query = {
            status: BILL_STATUS.PENDING,
            _id: bill._id
        };
        const updateOptions = { new: true };
        return await Bill.findOneAndUpdate(query, updates, updateOptions) as IBillDocument;
    }

    /**
     * Merchant scan Buyer address
     * 
     * @param user Merchant who scanned buyer address
     * @param bill 
     * @param payload 
     */
    async addBuyer(user: IUser, bill: IBill, payload: any): Promise<IBill> {
        const { address, amount, bill_type } = payload;
        const buyer = await User.findOne({ neo_wallet: address, role: USER_ROLE.BUYER });
        if (!buyer) {
            return bill;
        }
        const query = {
            _id: bill._id
        };
        const updates = {
            bill_type: bill_type,
            '$push': { buyers: { address: address, amount: amount, user_id: buyer._id } }
        };
        const updateOptions = { new: true };
        const billUpdated = await Bill.findOneAndUpdate(query, updates, updateOptions) as IBill;
        await this.onBuyerAdded(user, billUpdated);
        return billUpdated;
    }

    async getBuyers(bill: IBill): Promise<IUser[]> {
        const buyers = bill.buyers || [];
        if (!Array.isArray(buyers) || buyers.length === 0) {
            return [];
        }
        const userIds = buyers.map(b => b.user_id);
        const users = await User.find({ _id: { $in: userIds }, role: USER_ROLE.BUYER });
        return users;
    }

    async onBuyerAdded(user: IUser, bill: IBill): Promise<void> {
        const recipients = await this.getBuyers(bill);
        await new NotificationManager().send(new BillCreatedMessage(user, bill), recipients);
    }

    async onConfirmed(user: IUser, bill: IBill, tran: ITransaction): Promise<void> {
        const recipients = [{
            _id: bill.merchant_id
        }, {
            _id: user._id
        }];
        const message = PaymentNotificationMessageFactory.createConfirmedBillMessage(user, tran);
        if (message !== null) {
            await new NotificationManager().send(message, recipients);
        }
    }

    async getCommissionRate(user: IUser): Promise<number> {
        const COMISSION_FEE = config.get('payment.fee.BTC');
        try {
            if (user.isBuyer()) {
                return COMISSION_FEE;
            }
            return getCommissionRate(user);
        } catch (e) {
            return 0;
        }
    }
}
