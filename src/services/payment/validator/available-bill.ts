import ValidatorInterface from '@validator/validator.interface';
import { BillAlreadyConfirmError } from '@services/payment/errors';
import { IBill } from '@models/bill.model';

export class AvailableBillValidator implements ValidatorInterface {
    constructor(protected bill: IBill) { }

    async validate(data: any) {
        const buyers = this.bill.buyers;
        if (buyers && Array.isArray(buyers) && buyers.length > 0) {
            throw new BillAlreadyConfirmError();
        }
        return true;
    }
}
