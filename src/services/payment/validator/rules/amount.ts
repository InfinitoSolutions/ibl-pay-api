import ValidatorInterface from '@validator/validator.interface';
import {
    NegativeAmountError,
    GreaterThanMaxFundError,
    BillMaxFundNotFoundError,
    AllowMaxFundInvalidError
} from '@services/payment/errors';
import { IBill } from '@models/bill.model';

export class AmountValidator implements ValidatorInterface {

    async validate(data: any) {
        let amount = null;
        if (typeof data === 'number') {
            amount = data;
        } else if (!data.amount) {
            return true;
        } else {
            amount = data.amount;
        }
        if (amount < 0) {
            throw new NegativeAmountError();
        }
        return true;
    }
}

export class MaxFundValidator extends AmountValidator {
    async validate(data: any) {
        const { is_recurring } = data;
        if (!is_recurring) {
            return true;
        }
        const { recurring } = data;
        const { max_fund } = data.recurring;
        if (!is_recurring || !recurring || !max_fund) {
            return true;
        }
        return await super.validate(max_fund);
    }
}

export class GreaterMaxFundValidator extends AmountValidator {
    constructor(protected bill: IBill) {
        super();
    }

    async validate(data: any) {
        const { amount } = data;
        if (!this.bill.recurring.max_fund) {
            return true;
        }
        if (amount > this.bill.recurring.max_fund) {
            throw new GreaterThanMaxFundError();
        }
        return await super.validate(amount);
    }
}

export class AllowOverMaxFundValidator extends AmountValidator {
    constructor(protected bill: IBill) {
        super();
    }

    async validate(data: any) {
        const { amount } = data;
        if (!this.bill.recurring.max_fund) {
            throw new BillMaxFundNotFoundError();
        }
        if (this.bill.recurring.max_fund <= amount) {
            throw new AllowMaxFundInvalidError();
        }
        return await super.validate(amount);
    }
}
