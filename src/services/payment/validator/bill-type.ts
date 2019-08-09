import ValidatorInterface from '@validator/validator.interface';
import {
    BillTypeNotSupportError,
    RecurringBillNotSupportTypeError
} from '@services/payment/errors';

import { BILL_TYPE } from '@models/constant';

export class BillTypeValidator implements ValidatorInterface {

    async validate(data: any) {
        const { bill_type, is_recurring } = data;
        if (!bill_type) {
            return true;
        }
        if (!(bill_type in BILL_TYPE)) {
            throw new BillTypeNotSupportError();
        }
        if (is_recurring && (bill_type === BILL_TYPE.INSTANT || bill_type === BILL_TYPE.SINGLE)) {
            throw new RecurringBillNotSupportTypeError();
        }
        return true;
    }
}
