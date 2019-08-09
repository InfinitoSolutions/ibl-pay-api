const debug = require('debug')('jobs.recurring-bill-scheduler');
import ScheduledPaymentReminder from '@services/payment/reminder';

const scheduleBill = async (agenda: any, bill: any) => {
    try {
        const jobName = 'schedule.recurring.bill';
        const jobData = {
            bill_id: String(bill._id)
        };

        // Schedule Job
        await agenda.now(jobName, jobData);

        // Lock bill to avoid duplicated schedule
        await ScheduledPaymentReminder.lock(bill);
    } catch (e) {
        debug(e.message);
    }
};

const executeJob = async (agenda: any, job: any) => {
    console.log('RECURRING BILL SCHEDULER RUNNING....');
    const bills = await ScheduledPaymentReminder.getActiveScheduledBills();
    const promises = bills.map((bill: any) => scheduleBill(agenda, bill));
    return await Promise.all(promises);
};

export default (agenda: any) => {
    agenda.define('recurring.bill.scheduler', async (job: any, done: any) => {
        await executeJob(agenda, job);
        done();
    });
};
