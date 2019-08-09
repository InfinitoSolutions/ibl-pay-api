import Bill from '@models/bill.model';
import Transaction from "@models/transaction.model";
import {BILL_STATUS, TRANSACTION_STATUS} from '@models/constant';
import ScheduledPaymentReminder from '@services/payment/reminder';

const scheduleBill = async (agenda: any, bill: any) => {
    try {
        if (await Transaction.findOne({ bill_id: bill._id, status: {$ne: TRANSACTION_STATUS.PROCESSING }})) {
            await Bill.findOneAndUpdate({ _id: bill._id }, {status: BILL_STATUS.CANCELLED});
            await Transaction.findOneAndUpdate({ bill_id: bill._id}, {status: TRANSACTION_STATUS.CANCELLED});
        }
    } catch (e) {
        console.log('error: ', e);
    }
};

const executeJob = async (agenda: any, job: any) => {
    console.log('PULL BILL CHECKING RUNNING....');
    const bills = await ScheduledPaymentReminder.getInactiveScheduledBills();
    const promises = bills.map((bill: any) => scheduleBill(agenda, bill));
    return await Promise.all(promises);
};

export default (agenda: any) => {
    agenda.define('update.pull.request', async (job: any, done: any) => {
        await executeJob(agenda, job);
        done();
    });
};
