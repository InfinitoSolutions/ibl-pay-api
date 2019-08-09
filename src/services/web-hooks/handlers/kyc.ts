import {
    WEB_HOOK_STATUS
} from '@models/constant';
import { IWebHookHandler } from './handler.interface';
import JobKYC from '@services/kyc/job-kyc';

export class KYCWebHookHandler implements IWebHookHandler {

    async execute(event: any) {
        try {
            const { data } = event;

            // {user_id: "", status: "APPROVED/REJECTED"}
            await JobKYC.webhookKYC(data);

            // Update event
            event.status = WEB_HOOK_STATUS.COMPLETED;
            await event.save();
        } catch (error) {
            console.log('KYCWebHookHandler::FAILED: ', error);
        }
    }
}

export default KYCWebHookHandler;