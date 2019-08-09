import {ScheduledPaymentReminderMessage} from '@services/payment/message';
import Transaction from '@models/transaction.model';
import {TRANSACTION_STATUS, TRANSACTION_TYPE} from '@models/constant';
import NotificationManager from '@services/notification/manager';
import Bill from '@models/bill.model';

const executeJob = async (job: any, done: any) => {
    try {
        const tran_id = job.attrs.data.tran_id;
        if (!tran_id) {
            console.log('Tran ID was not found');
            return done();
        }
        const tran = await Transaction.findById(tran_id);
        if (!tran || !tran.bill_id || tran.tran_type !== TRANSACTION_TYPE.PAYMENT) {
            console.log('Tran was not found');
            return done();
        }
        if (tran.status !== TRANSACTION_STATUS.PENDING) {
            console.log("Transaction is invalid");
            return done();
        }
        const bill = await Bill.findById(tran.bill_id);
        if (!bill || !bill.is_recurring) {
            console.log("Bill is invalid");
            return done();
        }
        const recipients = [{
            _id: tran.to_user
        }];
        const actor = {
            _id: tran.to_user
        };
        const message = new ScheduledPaymentReminderMessage(actor, bill, [String(tran_id)]);
        await new NotificationManager().send(message, recipients);
    } catch (e) {
        console.log("ERROR:", e);
    } finally {
        done();
    }
};

export default (agenda: any) => {
    agenda.define('schedule.bill.reminder', executeJob);
};
