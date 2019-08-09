import PaymentWebHookHandler from './payment';
import KYCWebHookHandler from './kyc';
import { NotificationWebHookHandler } from '@services/web-hooks/handlers/notification';
import SecurityHandler from './security';

interface IWebHookHandlerRegistry {
    [event: string]: any;
}

const handlers: IWebHookHandlerRegistry = {
    payment_sm: PaymentWebHookHandler,
    kyc_sm: KYCWebHookHandler,
    notification: NotificationWebHookHandler,
    security: SecurityHandler
};

export default handlers;