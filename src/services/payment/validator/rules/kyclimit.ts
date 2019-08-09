import ValidatorInterface from "@validator/validator.interface";
import { IUser } from "@models/user.model";
import { KYC_LEVEL, USER_ROLE } from "@models/constant";
import { PaymentAggregator } from "@services/payment/aggregator";
import { KycPaymentLimitError } from "@services/payment/errors";
const config = require('config');

export class BuyerKycLimitValidator implements ValidatorInterface {
    constructor(protected user: IUser) { }

    async validate(data: any): Promise<boolean> {
        const kycLevel = this.user.getKycLevel();
        const limitAmount = this.getPaymentLimit(kycLevel);
        const transactionLimit = this.getTransactionLimit(kycLevel);

        if (limitAmount !== null) {
            let { amount } = data;
            if (!amount) {
                amount = 0;
            }
            const totalPaymentAmount = await this.getTotalPayment();
            if (totalPaymentAmount + amount > limitAmount) {
                throw new KycPaymentLimitError();
            }
        }
        if (transactionLimit !== null) {
            const totalTransaction = await this.getTotalTransaction();
            if (totalTransaction >= transactionLimit) {
                throw new KycPaymentLimitError();
            }
        }
        return true;
    }

    async getTotalPayment(): Promise<number> {
        return PaymentAggregator.getTotalPaymentOfBuyerInMonth(this.user);
    }

    async getTotalTransaction(): Promise<number> {
        return PaymentAggregator.getTotalTransactionOfBuyerInMonth(this.user);
    }

    getPaymentLimit(kycLevel: number): number | null {
        const level0PaymentLimitKey = 'kycLimit.buyer.basic.payment';
        const level1PaymentLimitKey = 'kycLimit.buyer.engaged.payment';
        const level3PaymentLimitKey = 'kycLimit.buyer.advanced.payment';

        if (kycLevel === KYC_LEVEL.BASIC && config.has(level0PaymentLimitKey)) {
            return config.get(level0PaymentLimitKey);
        } else if (kycLevel === KYC_LEVEL.ENGAGED && config.has(level1PaymentLimitKey)) {
            return config.get(level1PaymentLimitKey);
        } else if (kycLevel === KYC_LEVEL.ADVANCED && config.has(level3PaymentLimitKey)) {
            return config.get(level3PaymentLimitKey);
        }

        return null;
    }

    getTransactionLimit(kycLevel: number): number | null {
        const level0PaymentLimitKey = 'kycLimit.buyer.basic.totalTransaction';
        const level1PaymentLimitKey = 'kycLimit.buyer.engaged.totalTransaction';
        const level3PaymentLimitKey = 'kycLimit.buyer.advanced.totalTransaction';

        if (kycLevel === KYC_LEVEL.BASIC && config.has(level0PaymentLimitKey)) {
            return config.get(level0PaymentLimitKey);
        } else if (kycLevel === KYC_LEVEL.ENGAGED && config.has(level1PaymentLimitKey)) {
            return config.get(level1PaymentLimitKey);
        } else if (kycLevel === KYC_LEVEL.ADVANCED && config.has(level3PaymentLimitKey)) {
            return config.get(level3PaymentLimitKey);
        }

        return null;
    }
}


export class MerchantKycLimitValidator extends BuyerKycLimitValidator {

    async getTotalPayment(): Promise<number> {
        return PaymentAggregator.getTotalPaymentOfMerchantInMonth(this.user);
    }

    async getTotalTransaction(): Promise<number> {
        return PaymentAggregator.getTotalTransactionOfMerchantInMonth(this.user);
    }

    getPaymentLimit(kycLevel: number): number | null {
        const level0PaymentLimitKey = 'kycLimit.merchant.basic.payment';
        const level1PaymentLimitKey = 'kycLimit.merchant.engaged.payment';
        const level3PaymentLimitKey = 'kycLimit.merchant.advanced.payment';

        if (kycLevel === KYC_LEVEL.BASIC && config.has(level0PaymentLimitKey)) {
            return config.get(level0PaymentLimitKey);
        } else if (kycLevel === KYC_LEVEL.ENGAGED && config.has(level1PaymentLimitKey)) {
            return config.get(level1PaymentLimitKey);
        } else if (kycLevel === KYC_LEVEL.ADVANCED && config.has(level3PaymentLimitKey)) {
            return config.get(level3PaymentLimitKey);
        }

        return null;
    }

    getTransactionLimit(kycLevel: number): number | null {
        const level0PaymentLimitKey = 'kycLimit.merchant.basic.totalTransaction';
        const level1PaymentLimitKey = 'kycLimit.merchant.engaged.totalTransaction';
        const level3PaymentLimitKey = 'kycLimit.merchant.advanced.totalTransaction';

        if (kycLevel === KYC_LEVEL.BASIC && config.has(level0PaymentLimitKey)) {
            return config.get(level0PaymentLimitKey);
        } else if (kycLevel === KYC_LEVEL.ENGAGED && config.has(level1PaymentLimitKey)) {
            return config.get(level1PaymentLimitKey);
        } else if (kycLevel === KYC_LEVEL.ADVANCED && config.has(level3PaymentLimitKey)) {
            return config.get(level3PaymentLimitKey);
        }

        return null;
    }
}


export class WithdrawalKycLimitValidator implements ValidatorInterface {
    constructor(protected user: IUser) { }

    async validate(data: any): Promise<boolean> {
        const kycLevel = this.user.getKycLevel();
        const limitWithdrawalAmount = this.getWithdrawalLimit(kycLevel);
        if (limitWithdrawalAmount === null) {
            return true;
        }
        let { amount } = data;
        if (!amount) {
            amount = 0;
        }
        const totalWithdrawalAmount = await this.getTotalWithdrawalAmount();
        if (totalWithdrawalAmount + amount > limitWithdrawalAmount) {
            throw new KycPaymentLimitError();
        }
        return true;
    }

    getWithdrawalLimit(kycLevel: number): number | null {
        if (this.user.role === USER_ROLE.BUYER) {
            return this.getBuyerWithdrawalLimit(kycLevel);
        }
        return this.getMerchantWithdrawalLimit(kycLevel);
    }

    getBuyerWithdrawalLimit(kycLevel: number): number | null {
        const level0PaymentLimitKey = 'kycLimit.buyer.basic.withdrawal';
        const level1PaymentLimitKey = 'kycLimit.buyer.engaged.withdrawal';
        const level3PaymentLimitKey = 'kycLimit.buyer.advanced.withdrawal';

        if (kycLevel === KYC_LEVEL.BASIC && config.has(level0PaymentLimitKey)) {
            return config.get(level0PaymentLimitKey);
        } else if (kycLevel === KYC_LEVEL.ENGAGED && config.has(level1PaymentLimitKey)) {
            return config.get(level1PaymentLimitKey);
        } else if (kycLevel === KYC_LEVEL.ADVANCED && config.has(level3PaymentLimitKey)) {
            return config.get(level3PaymentLimitKey);
        }

        return null;
    }

    getMerchantWithdrawalLimit(kycLevel: number): number | null {
        const level0PaymentLimitKey = 'kycLimit.merchant.basic.withdrawal';
        const level1PaymentLimitKey = 'kycLimit.merchant.engaged.withdrawal';
        const level3PaymentLimitKey = 'kycLimit.merchant.advanced.withdrawal';

        if (kycLevel === KYC_LEVEL.BASIC && config.has(level0PaymentLimitKey)) {
            return config.get(level0PaymentLimitKey);
        } else if (kycLevel === KYC_LEVEL.ENGAGED && config.has(level1PaymentLimitKey)) {
            return config.get(level1PaymentLimitKey);
        } else if (kycLevel === KYC_LEVEL.ADVANCED && config.has(level3PaymentLimitKey)) {
            return config.get(level3PaymentLimitKey);
        }

        return null;
    }

    async getTotalWithdrawalAmount(): Promise<number> {
        return PaymentAggregator.getTotalWithdrawalAmountInMonth(this.user);
    }
}
