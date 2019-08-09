import User, {IUserDocument} from '@models/user.model';
import * as Errors from '@validator/errors';
import {KYCSerializer} from './serializer';

export abstract class KYCService {
    abstract validate(payload: any): void;
    serializer: KYCSerializer;
    agenda: any;
    kyc_new: any;
    kyc_reg: any;
    kyc_fail: any;

    constructor(s: KYCSerializer, a: any) {
        this.serializer = s;
        this.agenda = a;
    }

    preUpdate(data: any): any {
        return data;
    }

    async update(userId: string, payload: any): Promise<any> {
        // Update user profile
        let user = await User.findOneAndUpdate(
            { _id: userId },
            { ...payload,  ...this.kyc_new },
            { new: true }
        );
        if (user == null) {
            throw new Errors.NotFoundError();
        }
        return user;
    }

    async process(userId: string, payload: any): Promise<any> {
        try {
            // Validation
            this.validate(payload);

            // pre-update data
            payload = this.preUpdate(payload);

            // Update DB
            let user = await this.update(userId, payload);

            // Call job
            const jobData = {
                user_id: String(user._id)
            };
            this.agenda.now('submit.kyc.schedule.one', jobData);

            return user;
        } catch (e) {
            throw e;
        }
    }

    abstract async updateKYC(kyc_account: string, data: any): Promise<any>;

    async processKYC(user: IUserDocument): Promise<any> {
        try {
            if (user.kyc_account == null) {
                throw new Errors.NoKYCAccount();
            }
            // Submit to KYC
            let data = await this.serializer.serialize(user);
            return await this.updateKYC(user.kyc_account, data);
        } catch (e) {
            throw e;
        }
    }

    abstract async call(userId: any, payload: any): Promise<any>;

}
