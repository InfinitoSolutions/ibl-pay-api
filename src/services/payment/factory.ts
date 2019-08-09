import { BILL_TYPE } from '@models/constant';

import {
    InstantPayment,
    SinglePayment,
    ScheduledPayment,
    SharedPayment,
    NonTypePayment,
    AbstractPaymentMethod
} from './payment';

export class PaymentServiceFactory {
    /**
     * Create an instant of Payment Service
     * @param {string} type Payment Type
     */
    static instance(type?: string): AbstractPaymentMethod {
        switch (type) {
            case BILL_TYPE.INSTANT:
                return new InstantPayment();
            case BILL_TYPE.SINGLE:
                return new SinglePayment();
            case BILL_TYPE.SCHEDULE:
                return new ScheduledPayment();
            case BILL_TYPE.SHARE:
                return new SharedPayment();
            default:
                return new NonTypePayment();
        }
    }
}
