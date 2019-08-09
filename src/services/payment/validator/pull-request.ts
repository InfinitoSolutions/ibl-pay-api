import ValidatorInterface from '@validator/validator.interface';
import { NeoTransactionIdValidator } from './neo-transaction-id';
import { MerchantPullValidator } from './buyers';
import { PendingTransactionValidator } from './pending-transaction';
import { ITransaction } from '@models/transaction.model';
import { IUser } from '@models/user.model';
import { MerchantKycLimitValidator } from '@services/payment/validator/rules/kyclimit';
import { CanPullScheduledPaymentValidator } from '@validator/permission';

export class PullRequestValidation implements ValidatorInterface {
    rules: ValidatorInterface[];
    constructor(protected user: IUser, protected tran: ITransaction) {
        this.rules = [
            new NeoTransactionIdValidator(),
            new PendingTransactionValidator(this.tran),
            new MerchantPullValidator(this.user, this.tran)
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

export class PreCheckPullRequestValidation implements ValidatorInterface {
    rules: ValidatorInterface[];
    constructor(protected user: IUser, protected tran: ITransaction) {
        this.rules = [
            new CanPullScheduledPaymentValidator(this.user, this.tran),
            new PendingTransactionValidator(this.tran),
            new MerchantPullValidator(this.user, this.tran),
            // new MerchantKycLimitValidator(this.user) // Remove KYC Limit validator
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
