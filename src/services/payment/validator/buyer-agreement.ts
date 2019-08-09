import ValidatorInterface from '@validator/validator.interface';
import {
    AgreementAlreadyError,
    BuyerNotAgreementError
} from '@services/payment/errors';

import Bill, { IBill } from '@models/bill.model';

export class BuyerAgreementAlreadyValidator implements ValidatorInterface {
    constructor(protected bill: IBill) { }

    async validate(data: any) {
        if (!this.bill.is_recurring) {
            return true;
        }
        const result = await Bill.findOne({ _id: this.bill._id, agreement_id: { $exists: true, $ne: null } });
        if (result) {
            throw new AgreementAlreadyError();
        }
        return true;
    }

}

export class BuyerAgreementValidator implements ValidatorInterface {
    constructor(protected bill: IBill) { }

    async validate(data: any) {
        if (!this.bill.is_recurring) {
            return true;
        }
        const result = await Bill.findOne({ _id: this.bill._id, agreement_id: { $exists: true, $ne: null } });
        if (!result) {
            throw new BuyerNotAgreementError();
        }
        return true;
    }

}
