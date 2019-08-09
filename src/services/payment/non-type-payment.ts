import { AbstractPaymentMethod } from './abstract-payment';

/**
 * Merchant creates bill without type
 */
export class NonTypePayment extends AbstractPaymentMethod {
    getBillType(): string | null {
        return null;
    }
}
