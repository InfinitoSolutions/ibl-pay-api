import ValidatorInterface from '@validator/validator.interface';
import {MerchantAddressValidator} from '@services/payment/validator/address';
import {AmountValidator, MaxFundValidator} from '@services/payment/validator/rules/amount';
import {CurrencyValidator} from '@services/payment/validator/currency';
import {BillTypeValidator} from '@services/payment/validator/bill-type';
import {BuyersValidator} from '@services/payment/validator/buyers';
import {RecurringDateValidator} from '@services/payment/validator/recurring-date';
import {LimitAmountValidator} from '@services/deposit/validator/limitAmount';
import {IUser} from '@models/user.model';
import {CanCreateBillValidator} from '@validator/permission';

export class CreateBillRequestValidator implements ValidatorInterface {
    rules: ValidatorInterface[];

    constructor(protected user: IUser) {
        this.rules = [
            new CanCreateBillValidator(this.user),
            new MerchantAddressValidator(),
            new AmountValidator(),
            new CurrencyValidator(),
            new BuyersValidator(),
            new BillTypeValidator(),
            new MaxFundValidator(),
            new RecurringDateValidator(),
            new LimitAmountValidator()
        ];
    }

    async validate(data: any) {
        if (this.rules.length === 0) {
            return true;
        }
        for (let i = 0; i < this.rules.length; i++) {
            await this.rules[i].validate(data);
        }
        const { is_recurring } = data;
        if (is_recurring !== true) {
            // Remove KYC Limit validator
            // await new MerchantKycLimitValidator(this.user).validate(data);
        }
        return true;
    }
}
