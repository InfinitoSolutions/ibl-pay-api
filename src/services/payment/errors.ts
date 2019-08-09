import {BaseError} from '@validator/errors';
import MESSAGES from '@utils/messages';

export class BillNotFoundError extends BaseError {
    constructor(...args: any[]) {
        super(...args);
        this.errorCode = 'bill_not_found';
    }
}

export class NegativeAmountError extends BaseError {
    constructor(...args: any[]) {
        super(...args);
        this.errorCode = 'amount_negative';
    }
}

export class CurrencyNotSupportError extends BaseError {
    constructor(...args: any[]) {
        super(...args);
        this.message = MESSAGES.CURRENCY_NOT_SUPPORT;
        this.errorCode = 'currency_not_support';
    }
}

export class BillTypeNotSupportError extends BaseError {
    constructor(...args: any[]) {
        super(...args);
        this.message = MESSAGES.BILL_TYPE_NOT_SUPPORT;
        this.errorCode = 'bill_type_not_support';
    }
}

export class TransactionExistError extends BaseError {
    constructor(...args: any[]) {
        super(...args);
        this.message = MESSAGES.TRANSACTION_EXIST;
        this.errorCode = 'transaction_exist';
    }
}

export class TransactionConfirmAgainError extends BaseError {
    constructor(...args: any[]) {
        super(...args);
        this.message = MESSAGES.BILL_ALREADY_CONFIRM;
        this.errorCode = 'bill_already_confirm';
    }
}

export class GreaterThanMaxFundError extends BaseError {
    constructor(...args: any[]) {
        super(...args);
        this.message = MESSAGES.AMOUNT_GREATER_THAN_BILL_MAX_FUND;
        this.errorCode = 'bill_over_max_fund';
    }
}

export class RecurringDateInValidError extends BaseError {
    constructor(...args: any[]) {
        super(...args);
        this.message = MESSAGES.BILL_RECURRING_DATE_INVALID;
        this.errorCode = 'bill_recurring_date_invalid';
    }
}

export class ScheduleTimeInvalidError extends BaseError {
    constructor(...args: any[]) {
        super(...args);
        this.message = MESSAGES.BILL_SCHEDULE_TIME_INVALID;
        this.errorCode = 'bill_schedule_time_invalid';
    }
}

export class AgreementAlreadyError extends BaseError {
    constructor(...args: any[]) {
        super(...args);
        this.message = MESSAGES.BUYER_AGREEMENT_ALREADY;
        this.errorCode = 'buyer_already_agreement';
    }
}

export class BuyerNotAgreementError extends BaseError {
    constructor(...args: any[]) {
        super(...args);
        this.message = MESSAGES.BUYER_NOT_AGREEMENT;
        this.errorCode = 'buyer_not_agreement';
    }
}

export class RecurringBillNotSupportTypeError extends BaseError {
    constructor(...args: any[]) {
        super(...args);
        this.message = MESSAGES.RECURRING_BILL_NOT_ALLOW_TYPE;
        this.errorCode = 'recurring_bill_not_allow_type';
    }
}

export class BillExistsError extends BaseError {
    constructor(...args: any[]) {
        super(...args);
        this.message = MESSAGES.BILL_EXISTS;
        this.errorCode = 'bill_exists';
    }
}

export class BillMaxFundNotFoundError extends BaseError {
    constructor(...args: any[]) {
        super(...args);
        this.message = MESSAGES.BILL_SCHEDULE_MAX_FUND_NOT_FOUND;
        this.errorCode = 'bill_schedule_max_fund_not_found';
    }
}

export class AllowMaxFundInvalidError extends BaseError {
    constructor(...args: any[]) {
        super(...args);
        this.message = MESSAGES.OVER_MAX_FUND_MUST_GREATER_THAN_MAX_FUND;
        this.errorCode = 'over_max_fund_must_greater_than_max_fund';
    }
}

export class UnauthorizedError extends BaseError {
    constructor(...args: any[]) {
        super(...args);
        this.message = MESSAGES.UNAUTHORIZED;
        this.errorCode = 'unauthorized';
    }
}

export class BillAlreadyConfirmError extends BaseError {
    constructor(...args: any[]) {
        super(...args);
        this.errorCode = 'bill_already_confirm';
        this.message = MESSAGES.BILL_ALREADY_CONFIRM;
    }
}

export class NotExistBuyerAddressError extends BaseError {
    constructor(...args: any[]) {
        super(...args);
        this.errorCode = 'buyer_address_not_exist';
        this.message = MESSAGES.BUYER_ADDRESS_NOT_EXIST;
    }
}

export class InvalidCurrencyError extends BaseError {
    constructor(...args: any[]) {
        super(...args);
        this.errorCode = 'invalid_currency';
        this.message = MESSAGES.INVALID_CURRENCY;
    }
}

export class KycPaymentLimitError extends BaseError {
    constructor(...args: any[]) {
        super(...args);
        this.errorCode = 'kyc_limit';
        this.message = MESSAGES.KYC_LIMIT;
    }
}

export class MissingWithdrawalAddressError extends BaseError {
    constructor(...args: any[]) {
        super(...args);
        this.errorCode = 'missing_crypto_address';
        this.message = MESSAGES.MISSING_CRYPTO_ADDRESS;
    }
}