import ValidatorInterface from '@validator/validator.interface';
import { AmountValidator } from '@services/payment/validator/rules/amount';
import { AvailableBillValidator } from '@services/payment/validator/available-bill';
import { BillTypeValidator } from '@services/payment/validator/bill-type';
import { ExistsBuyerAddressValidator } from '@services/payment/validator/buyers';
import { IBill } from '@models/bill.model';

export class AddBuyerForBillRequestValidator implements ValidatorInterface {
    rules: ValidatorInterface[];
    constructor(protected bill: IBill) {
        this.bill = bill;

        this.rules = [
            new AvailableBillValidator(this.bill),
            new ExistsBuyerAddressValidator(),
            new AmountValidator(),
            new BillTypeValidator()
        ];
    }

    async validate(data: any) {
        if (this.rules.length === 0) {
            return true;
        }
        for (let i = 0; i < this.rules.length; i++) {
            await this.rules[i].validate(data);
        }
        return true;
    }
}
