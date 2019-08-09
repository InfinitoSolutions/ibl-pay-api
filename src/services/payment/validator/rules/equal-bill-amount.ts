import ValidatorInterface from '@validator/validator.interface';
import { AvailableBalanceError, NotFoundError } from '@validator/errors';
import Bill, { IBill } from '@models/bill.model';

export class EqualBillAmountValidator implements ValidatorInterface {
    bill: IBill;
    constructor(bill: IBill) {
        this.bill = bill;
    }

    async validate(data: any) {
        const { amount } = data;
        const bill = await Bill.findOne({ _id: this.bill._id });
        if (!bill) {
            throw new NotFoundError();
        }
        if (amount !== bill.amount) {
            throw new AvailableBalanceError();
        }
        return true;
    }
}