const Config = require('config');

import utils from '@utils/index';
import moment from 'moment';
import Bill, { IBillDocument, IBill } from '@models/bill.model';
import NotificationManager from '@services/notification/manager';
import { PaymentScheduler } from '@services/payment/scheduler';
import { ScheduledPayment } from '@services/payment/payment';
import { ScheduledPaymentReminderMessage } from '@services/payment/message';
import { RECURRING_TYPE, BILL_STATUS } from '@models/constant';
import { ITransaction } from '@models/transaction.model';
import { CanSchedulePaymentValidator } from '@validator/permission';
import { CancelScheduledBillCommand } from '@services/payment/commands';
import {getTransactionSequence} from '@services/transaction';

export default class ScheduledPaymentReminder {
    /**
     * Find active recurring bills
     */
    static async getActiveScheduledBills(): Promise<IBillDocument[]> {
        const now = utils.date.nowUTC();
        const scheduleNotify = Config.get('payment.schedule') || {};
        const daily = moment().subtract(scheduleNotify.dailyDurationHours, 'hours').toDate();
        const weekly = moment().subtract(scheduleNotify.weeklyDurationDays, 'days').toDate();
        const monthly = moment().subtract(scheduleNotify.monthlyDurationDays, 'days').toDate();

        // Filter bills which were not scheduled
        const filter = {
            'parent_id': null,
            'is_recurring': true,
            'status': { $eq: BILL_STATUS.CONFIRMED },
            'agreement_id': { $exists: true, $ne: null },
            'recurring.locked_at': null,
            'recurring.start_date': {
                $lte: now
            },
            'buyers': { $exists: true, $ne: [] },
            $or: [{
                $and: [
                    { 'recurring.recurring_type': RECURRING_TYPE.DAILY },
                    { 'recurring.next_run_at': { $lte: now } },
                    { 'recurring.next_run_at': { $gte: daily } }
                ]
            }, {
                $and: [
                    { 'recurring.recurring_type': RECURRING_TYPE.WEEKLY },
                    { 'recurring.next_run_at': { $lte: now } },
                    { 'recurring.next_run_at': { $gte: weekly } }
                ]
            }, {
                $and: [
                    { 'recurring.recurring_type': RECURRING_TYPE.MONTHLY },
                    { 'recurring.next_run_at': { $lte: now } },
                    { 'recurring.next_run_at': { $gte: monthly } }
                ]
            }]
        };
        return await Bill.find(filter);
    }

    /**
     * Find inactive recurring bills
     */
    static async getInactiveScheduledBills(): Promise<IBillDocument[]> {
        const now = utils.date.nowUTC();
        const scheduleNotify = Config.get('payment.schedule') || {};
        const daily = moment().subtract(scheduleNotify.dailyDurationHours, 'hours').toDate();
        const weekly = moment().subtract(scheduleNotify.weeklyDurationDays, 'days').toDate();
        const monthly = moment().subtract(scheduleNotify.monthlyDurationDays, 'days').toDate();

        // Filter bills which were not scheduled
        const filter = {
            'parent_id': { $ne: null },
            'is_recurring': true,
            'status': { $eq: BILL_STATUS.CONFIRMED },
            'agreement_id': { $exists: true, $ne: null },
            'recurring.locked_at': null,
            'recurring.start_date': {
                $lte: now
            },
            'buyers': { $exists: true, $ne: [] },
            $or: [{
                $and: [
                    { 'recurring.recurring_type': RECURRING_TYPE.DAILY },
                    { 'recurring.next_run_at': { $lt: daily } }
                ]
            }, {
                $and: [
                    { 'recurring.recurring_type': RECURRING_TYPE.WEEKLY },
                    { 'recurring.next_run_at': { $lt: weekly } }
                ]
            }, {
                $and: [
                    { 'recurring.recurring_type': RECURRING_TYPE.MONTHLY },
                    { 'recurring.next_run_at': { $lt: monthly } }
                ]
            }]
        };
        return await Bill.find(filter);
    }

    static async lock(bill: IBill): Promise<void> {
        if (!bill.is_recurring) {
            return;
        }
        const query = {
            _id: bill._id,
            locked_at: null
        };
        const updates = {
            locked_at: new Date()
        };
        await Bill.findOneAndUpdate(query, updates);
    }

    static async schedule(billId: string): Promise<any> {
        // Get bill
        const paymentService = new ScheduledPayment();
        const bill: IBillDocument = await paymentService.load(billId);
        if (!bill || !bill.is_recurring) {
            return;
        }

        // Clone scheduled Bill
        const clonedBill = bill.toObject();
        delete clonedBill._id;
        clonedBill.parent_id = bill._id;
        clonedBill.recurring.run_at = new Date();
        clonedBill.tx_seq = await getTransactionSequence();
        clonedBill.parent_tx_seq = bill.tx_seq;

        // Update next schedule time
        const scheduler = PaymentScheduler.factory(bill.recurring);
        scheduler.schedule();
        bill.recurring.last_run_at = bill.recurring.next_run_at || null;
        bill.recurring.next_run_at = scheduler.getNextScheduledTime();
        bill.recurring.run_at = new Date();

        // Unlock
        bill.recurring.locked_at = null;

        // Update parent bill
        await bill.save();

        // Create a recurring bill instance
        const scheduledBill = await Bill.create(clonedBill);
        const isValid = await this.validate(scheduledBill);
        if (!isValid) {
            return await new CancelScheduledBillCommand(scheduledBill).execute();
        }

        // create pending transaction
        const trans = await paymentService.createPendingTransactions(scheduledBill);

        // Send notification
        const tran_ids = trans.map((t: ITransaction) => String(t._id));
        const actor = {
            _id: bill.merchant_id
        };

        const recipients = [{
            _id: bill.merchant_id
        }];
        const message = new ScheduledPaymentReminderMessage(actor, scheduledBill, tran_ids);
        await new NotificationManager().send(message, recipients);

        return scheduledBill;
    }

    static async validate(bill: IBill): Promise<boolean> {
        try {
            return new CanSchedulePaymentValidator(bill).validate(null);
        } catch (e) {
            return false;
        }
    }
}
