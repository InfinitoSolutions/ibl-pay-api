import MESSAGES from '@utils/messages';
import stringInject from 'stringinject'
export class BaseError extends Error {
    errorCode: string;
    constructor(...args: any[]) {
        super(...args);
        this.errorCode = 'error';
        Error.captureStackTrace(this, BaseError);
    }
}

export class NotFoundError extends BaseError {
    constructor(...args: any[]) {
        super(...args);
        this.errorCode = 'not_found';
    }
}

export class EmailFormatError extends BaseError {
    constructor(...args: any[]) {
        super(...args);
        this.errorCode = 'email_format';
        this.message = MESSAGES.INVALID_EMAIL_FORMAT;
    }
}

export class EmailTakenError extends BaseError {
    constructor(...args: any[]) {
        super(...args);
        this.errorCode = 'email_taken';
        this.message = MESSAGES.EMAIL_EXISTS;
    }
}

export class EmailNotFoundError extends BaseError {
    constructor(...args: any[]) {
        super(...args);
        this.errorCode = 'email_not_found';
        this.message = MESSAGES.EMAIL_NOT_EXISTS;
    }
}

export class AddressFormatError extends BaseError {
    constructor(...args: any[]) {
        super(...args);
        this.errorCode = 'addr_format';
        this.message = MESSAGES.INVALID_NEO_WALLET;
    }
}

export class AddressExistsError extends BaseError {
    constructor(...args: any[]) {
        super(...args);
        this.errorCode = 'addr_exists';
    }
}

export class CaptchaInvalidError extends BaseError {
    constructor(...args: any[]) {
        super(...args);
        this.errorCode = 'captcha_invalid';
        this.message = MESSAGES.CAPTCHA_NOT_MATCH;
    }
}

export class PasswordResetTokenNotFoundError extends BaseError {
    constructor(...args: any[]) {
        super(...args);
        this.errorCode = 'pwd_token_not_found';
        this.message = MESSAGES.PASSWORD_RESET_TOKEN_INVALID;
    }
}

export class TokenExpired extends BaseError {
    constructor(...args: any[]) {
        super(...args);
        this.errorCode = 'token_expired';
        this.message = MESSAGES.TOKEN_EXPIRED;
    }
}

export class TokenInvalidError extends BaseError {
    constructor(...args: any[]) {
        super(...args);
        this.errorCode = 'token_invalid';
        this.message = MESSAGES.TOKEN_INVALID;
    }
}

export class OldPasswordWrong extends BaseError {
    constructor(...args: any[]) {
        super(...args);
        this.errorCode = 'pwd_old_password_wrong';
        this.message = MESSAGES.OLD_PASSWORD_WRONG;
    }
}

export class ActivationCodeInvalidError extends BaseError {
    constructor(...args: any[]) {
        super(...args);
        this.errorCode = 'activation_invalid';
        this.message = MESSAGES.ACTIVATION_INVALID;
    }
}

export class BillDoesNotExistError extends BaseError {
    constructor(...args: any[]) {
        super(...args);
        this.errorCode = 'bill_not_exist';
        this.message = MESSAGES.BILL_NOT_EXIST;
    }
}

export class TransactionIsInvalidError extends BaseError {
    constructor(...args: any[]) {
        super(...args);
        this.errorCode = 'transaction_invalid';
        this.message = MESSAGES.TRANSACTION_INVALID;
    }
}

export class LoginFailedError extends BaseError {
    constructor(...args: any[]) {
        super(...args);
        this.errorCode = 'sign_in_failed';
        this.message = MESSAGES.LOGIN_FAILED;
    }
}

export class LoginFailedNotExist extends BaseError {
    constructor(...args: any[]) {
        super(...args);
        this.errorCode = 'email_not_registered';
        this.message = MESSAGES.EMAIL_NOT_REGISTER;
    }
}

export class LoginFailedPreactive extends BaseError {
    constructor(...args: any[]) {
        super(...args);
        this.errorCode = 'account_not_activated';
        this.message = MESSAGES.ACCOUNT_IS_PRE_ACTIVE;
    }
}

export class LoginFailedInactive extends BaseError {
    constructor(...args: any[]) {
        super(...args);
        this.errorCode = 'account_is_inactive';
        this.message = MESSAGES.ACCOUNT_IS_INACTIVE;
    }
}

export class LoginFailedOther extends BaseError {
    constructor(...args: any[]) {
        super(...args);
        this.errorCode = 'sign_in_failed';
        this.message = MESSAGES.LOGIN_FAILED_OTHER;
    }
}

export class BlockedLoginError extends BaseError {
    constructor(...args: any[]) {
        super(...args);
        this.errorCode = 'too_many_failed_login_attempts';
        this.message = stringInject(MESSAGES.BLOCKED_LOGIN, { timeExpire: args[0]/60, numberLogin: args[1]});
    }
}

export class BillQRInvalidExistError extends BaseError {
    constructor(...args: any[]) {
        super(...args);
        this.errorCode = 'bill_qr_invalid';
        this.message = MESSAGES.BILL_QR_INVALID;
    }
}

export class ReceiverNotFoundError extends BaseError {
    constructor(...args: any[]) {
        super(...args);
        this.errorCode = 'receiver_not_found';
        this.message = MESSAGES.RECEIVER_NOT_FOUND;
    }
}

export class WithdrawRequestInvalidError extends BaseError {
    constructor(...args: any[]) {
        super(...args);
        this.errorCode = 'withdraw_request_invalid';
        this.message = MESSAGES.WITHDRAW_REQUEST_INVALID;
    }
}

export class MinimumAmountError extends BaseError {
    constructor(...args: any[]) {
        super(...args);
        this.errorCode = 'minimum_amount_invalid';
        this.message = MESSAGES.MINIMUM_AMOUNT_INVALID;
    }
}

export class AvailableBalanceError extends BaseError {
    constructor(...args: any[]) {
        super(...args);
        this.errorCode = 'available_balance_invalid';
        this.message = MESSAGES.AVAILABLE_BALANCE_INVALID;
    }
}

export class UnauthorizedError extends BaseError {
    constructor(...args: any[]) {
        super(...args);
        this.errorCode = 'unauthorized';
        this.message = MESSAGES.UNAUTHORIZED;
    }
}

export class NoKYCAccount extends BaseError {
    constructor(...args: any[]) {
        super(...args);
        this.errorCode = 'no_kyc_account';
        this.message = MESSAGES.NO_KYC_ACCOUNT;
    }
}

export class InvalidData extends BaseError {
    constructor(...args: any[]) {
        super(...args);
        this.errorCode = 'invalid_data';
        this.message = MESSAGES.INVALID_DATA;
    }
}

export class FileTooSmall extends BaseError {
    constructor(...args: any[]) {
        super(...args);
        this.errorCode = 'file_too_small';
        this.message = MESSAGES.FILE_TOO_SMALL;
    }
}

export class LockedAccount extends BaseError {
    constructor(...args: any[]) {
        super(...args);
        this.errorCode = 'locked_password';
        this.message = MESSAGES.LOCKED_ACCOUNT;
    }
}

export class VerifyPassword extends BaseError {
    constructor(...args: any[]) {
        super(...args);
        this.errorCode = 'wrong_password';
        this.message = MESSAGES.WRONG_PASSWORD;
    }
}

export class DuplicatedAddress extends BaseError {
    constructor(...args: any[]) {
        super(...args);
        this.errorCode = 'duplicated_address';
        this.message = MESSAGES.DUPLICATED_ADDRESS;
    }
}

export class RequiredCryptoCurrencies extends BaseError {
    constructor(...args: any[]) {
        super(...args);
        this.errorCode = 'required_crypto_currencies';
        this.message = MESSAGES.REQUIRED_CRYPTO_CURRENCIES;
    }
}

export class NewPasswordNotSame extends BaseError {
    constructor(...args: any[]) {
        super(...args);
        this.errorCode = 'new_password_not_same';
        this.message = MESSAGES.NEW_PASSWORD_NOT_SAME;
    }
}
