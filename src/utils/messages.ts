const EMAIL_SUPPORT = process.env.EMAIL_SUPPORT;

const MESSAGES = {
    ACTIVATION_INVALID: 'Activation code has been expired or invalid',
    INVALID_EMAIL_FORMAT: 'Email is invalid format',
    EMAIL_EXISTS: 'Email is already existed',
    LOGIN_FAILED: `Email or password is incorret.\n Please try your entries again`,
    EMAIL_NOT_REGISTER: `Your email has not been registered with InfinitoPay yet.\n Please sign up to register for using InfinitoPay services.`,
    ACCOUNT_IS_PRE_ACTIVE: `Your account is not activated yet. Please check email and click on activation link.\n If you have not received activation link in your mailbok or your activation link is expired, you can request to Resend Activation Link below.`,
    ACCOUNT_IS_INACTIVE: `Your account status is inactive. Please contact our Customer Service team at ${EMAIL_SUPPORT} for support.`,
    LOGIN_FAILED_OTHER: `Sorry, an unexpected error occured, Please try agian later.`,
    BLOCKED_LOGIN: `You have reached {numberLogin} failed login attempts.\n Your account is locked due to too many attempts to sing in. You can try to sign in again after {timeExpire} minutes.\n For urgent needs, please contact our Customer Service team at ${EMAIL_SUPPORT} for support`,
    RECEIVER_ADDRESS_NOT_FOUND: 'Receiver address is not found',
    PAYER_ADDRESS_NOT_FOUND: 'Payer address is not found',
    INVALID_TOTAL_AMOUNT: 'Total amount of share payment must be equal to amount of Bill',
    INVALID_BALANCE: "Balance is not enough",
    INVALID_SAVE_TRANSACTION: 'Transaction is not save',
    IO_UNDEFINED: 'IO is undefined',
    EMAIL_NOT_EXISTS: 'Email does not exist',
    TOKEN_EXPIRED: 'Token expired',
    TOKEN_INVALID: 'Token invalid',
    PASSWORD_RESET_TOKEN_INVALID: 'Password reset token is invalid',
    OLD_PASSWORD_WRONG: 'Old password is wrong',
    CREATE_TRANSACTION_SUCCESS: 'Transaction created successfully',
    CAPTCHA_NOT_MATCH: 'Captcha does not match',
    INVALID_NEO_WALLET: 'Invalid NEO wallet address',
    BILL_NOT_EXIST: 'Bill does not exist',
    TRANSACTION_INVALID: 'Transaction is invalid',
    CURRENCY_NOT_SUPPORT: 'Currency does not support',
    BILL_TYPE_NOT_SUPPORT: 'Bill type does not support',
    TRANSACTION_EXIST: 'Transaction is already existed',
    BILL_ALREADY_CONFIRM: 'Bill is already confirm',
    AMOUNT_GREATER_THAN_BILL_MAX_FUND: 'Amount is greater than max fund, Buyer is need confirm again',
    BILL_QR_INVALID: 'QR code buyer have just scanned is invalid',
    INVALID_DATA_SOURCE: 'Data source is invalid',
    BUYER_AGREEMENT_ALREADY: 'Buyer is agreement already',
    BUYER_NOT_AGREEMENT: 'Buyer is not agreement',
    BILL_RECURRING_DATE_INVALID: 'Recurring date is invalid',
    RECURRING_BILL_NOT_ALLOW_TYPE: 'Recurring bill does not allow this type',
    BILL_EXISTS: 'Bill already exists',
    BILL_SCHEDULE_MAX_FUND_NOT_FOUND: 'Schedule bill not found max fund',
    OVER_MAX_FUND_MUST_GREATER_THAN_MAX_FUND: 'Over max fund must greater than max fund of this bill',
    UNAUTHORIZED: 'Your account status is blocked/frozen',
    RECEIVER_NOT_FOUND: 'Receiver not found',
    WITHDRAW_REQUEST_INVALID: "Withdrawal request is invalid",
    MINIMUM_AMOUNT_INVALID: "Mount must greater than minimum amount",
    AVAILABLE_BALANCE_INVALID: "Available balance is invalid",
    NO_KYC_ACCOUNT: "KYC Account is unregistered",
    INVALID_AMOUNT: 'Invalid amount',
    INVALID_DATA: 'Invalid data',
    BUYER_ADDRESS_NOT_EXIST: 'Buyer address does not exist',
    INVALID_CURRENCY: 'Unsupported currency',
    KYC_LIMIT: 'You have reached limitation of your KYC Level',
    MISSING_CRYPTO_ADDRESS: 'KYC crypto address is required.',
    FILE_TOO_SMALL: 'File too small',
    WRONG_PASSWORD: 'Password is wrong',
    LOCKED_ACCOUNT: 'Your account has been temporarily locked because you\'ve entered the wrong password too many times',
    DUPLICATED_ADDRESS: 'Your Cryto Currency Address is duplicated',
    REQUIRED_CRYPTO_CURRENCIES: 'Required crypto currency address',
    NEW_PASSWORD_NOT_SAME: 'New password and confirm password should not be same as current password',
    LIMIT_AMOUNT: 'Invalid amount, amount must less than 1000',
    BILL_SCHEDULE_TIME_INVALID: 'Please set start time of schedule at least 3 minutes from current time'
};

export default MESSAGES;