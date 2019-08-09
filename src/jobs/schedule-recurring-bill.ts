import ScheduledPaymentReminder from '@services/payment/reminder';

const executeJob = async (job: any, done: any) => {
    console.log('SCHEDULE RECURRING BILL RUNNING....');
    try {
        const billId = job.attrs.data.bill_id;
        if (!billId) {
            console.log('Bill ID was not found');
            return done();
        }
        await ScheduledPaymentReminder.schedule(billId);
    } catch (e) {
        console.log("ERROR:", e);
    } finally {
        done();
    }
};

export default (agenda: any) => {
    agenda.define('schedule.recurring.bill', executeJob);
};
