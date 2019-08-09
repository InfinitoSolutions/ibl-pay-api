import { ITransaction } from "@models/transaction.model";
import { TRANSACTION_TYPE, BILL_TYPE } from '@models/constant';
import {
    TransferFailedMessage,
    InstantPaymentFailedMessage,
    SinglePaymentFailedMessage,
    ScheduledPaymentFailedMessage,
    WithdrawFailedMessage,
    TransferSuccessMessage,
    WithdrawSuccessedMessage,
    WithdrawApproveMessage,
    WithdrawBlockMessage,
    InstantPaymentSuccessMessage,
    SinglePaymentSuccessMessage,
    ScheduledPaymentSuccessMessage,
    DepositSuccessMessage,
    InstantPaymentConfirmedMessage,
    SinglePaymentConfirmedMessage,
    ScheduledRejectMaxfundMessage
} from "@services/payment/message/transaction";
import { INotificationActor, INotificationMessage } from "@services/notification/interface";
import { IBill } from "@models/bill.model";
import {
    RejectedInstantPaymentMessage,
    RejectedSinglePaymentMessage,
    RejectedScheduledPaymentSetupMessage
} from "@services/payment/message/bill";

export class PaymentNotificationMessageFactory {

    static createApprovedTransactionMessage(actor: INotificationActor, tran: ITransaction): INotificationMessage | null {
        const tranType = tran.tran_type;

        switch (true) {
            case (tranType === TRANSACTION_TYPE.WITHDRAW):
                return new WithdrawApproveMessage(actor, tran);
            default:
                return null;
        }
    }

    static createBlockedTransactionMessage(actor: INotificationActor, tran: ITransaction): INotificationMessage | null {
        const tranType = tran.tran_type;

        switch (true) {
            case (tranType === TRANSACTION_TYPE.WITHDRAW):
                return new WithdrawBlockMessage(actor, tran);
            default:
                return null;
        }
    }

    static createSuccessTransactionMessage(actor: INotificationActor, tran: ITransaction): INotificationMessage | null {
        const tranType = tran.tran_type;
        const billType = tran.bill_type;

        switch (true) {
            case (tranType === TRANSACTION_TYPE.TRANSFER):
                return new TransferSuccessMessage(actor, tran);
            case (tranType === TRANSACTION_TYPE.WITHDRAW):
                return new WithdrawSuccessedMessage(actor, tran);
            case (tranType === TRANSACTION_TYPE.DEPOSIT):
                return new DepositSuccessMessage(actor, tran);
            case (billType === BILL_TYPE.INSTANT):
                return new InstantPaymentSuccessMessage(actor, tran);
            case (billType === BILL_TYPE.SINGLE):
                return new SinglePaymentSuccessMessage(actor, tran);
            case (billType === BILL_TYPE.SCHEDULE):
                return new ScheduledPaymentSuccessMessage(actor, tran);
            default:
                return null;
        }
    }

    static createFailedTransactionMessage(actor: INotificationActor, tran: ITransaction): INotificationMessage | null {
        const tranType = tran.tran_type;
        const billType = tran.bill_type;

        switch (true) {
            case (tranType === TRANSACTION_TYPE.TRANSFER):
                return new TransferFailedMessage(actor, tran);
            case (tranType === TRANSACTION_TYPE.WITHDRAW):
                return new WithdrawFailedMessage(actor, tran);
            case (billType === BILL_TYPE.INSTANT):
                return new InstantPaymentFailedMessage(actor, tran);
            case (billType === BILL_TYPE.SINGLE):
                return new SinglePaymentFailedMessage(actor, tran);
            case (billType === BILL_TYPE.SCHEDULE):
                return new ScheduledPaymentFailedMessage(actor, tran);
            case (tranType === TRANSACTION_TYPE.DEPOSIT):
            default:
                return null;
        }
    }

    static createRejectMaxfunxTransactionMessage(actor: INotificationActor, tran: ITransaction): INotificationMessage | null {
        const billType = tran.bill_type;

        switch (true) {
            case (billType === BILL_TYPE.SCHEDULE):
                return new ScheduledRejectMaxfundMessage(actor, tran);
            default:
                return null;
        }
    }

    static createRejectedBillMessage(actor: INotificationActor, bill: IBill): INotificationMessage | null {
        const billType = bill.bill_type;
        switch (billType) {
            case BILL_TYPE.INSTANT:
                return new RejectedInstantPaymentMessage(actor, bill);
            case BILL_TYPE.SINGLE:
                return new RejectedSinglePaymentMessage(actor, bill);
            case BILL_TYPE.SCHEDULE:
                return new RejectedScheduledPaymentSetupMessage(actor, bill);
            default:
                return null;
        }
    }

    static createConfirmedBillMessage(actor: INotificationActor, tran: ITransaction): INotificationMessage | null {
        const billType = tran.bill_type;
        switch (billType) {
            case BILL_TYPE.INSTANT:
                return new InstantPaymentConfirmedMessage(actor, tran);
            case BILL_TYPE.SINGLE:
                return new SinglePaymentConfirmedMessage(actor, tran);
            default:
                return null;
        }
    }
}
