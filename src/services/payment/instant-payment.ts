import {
    BILL_TYPE
} from '@models/constant';

import { AbstractPaymentMethod } from './abstract-payment';

export class InstantPayment extends AbstractPaymentMethod {
    getBillType(): string | null {
        return BILL_TYPE.INSTANT;
    }

    allowsRecurring(): boolean {
        return false;
    }
}
