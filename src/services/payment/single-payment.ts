import {
    BILL_TYPE,
} from '@models/constant';
import { AbstractPaymentMethod } from './abstract-payment';

export class SinglePayment extends AbstractPaymentMethod {
    getBillType(): string | null {
        return BILL_TYPE.SINGLE;
    }

    allowsRecurring(): boolean {
        return false;
    }
}
