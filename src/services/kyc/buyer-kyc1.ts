const Joi = require('joi');
import ProfileBuyerKYC1ValidateSchema from '@validator/profile.buyer.kyc1';
import { KYCService } from './abstract-kyc';
import { KYC } from '../api/kyc';
import { ApiConfiguration } from '../api/http/config';
import { ProfileBuyerKYC1Serializer } from '@serializer/profile.serializer';
import { KYCSerializer } from './serializer';
import { KYC_SUBMIT_STATUS } from '../../models/constant';
import FormData from 'form-data';

export class Serializer extends KYCSerializer {
    constructor() {
        super();
        this.fields = ['birthday', 'country_code', 'phone_number', 'current_address', 'permanent_address'];
    }
}

export class BuyerKYC1Service extends KYCService {
    constructor(agenda: any) {
        super(new Serializer(), agenda);
        this.kyc_new = { kyc1_submit: KYC_SUBMIT_STATUS.NEW };
        this.kyc_reg = { kyc1_submit: KYC_SUBMIT_STATUS.REGISTERED };
        this.kyc_fail = { kyc1_submit: KYC_SUBMIT_STATUS.FAILED };
    }

    validate(payload: any): void {
        const { error, values } = Joi.validate(payload, ProfileBuyerKYC1ValidateSchema);
        if (error !== null) {
            throw error;
        }
    }

    async updateKYC(kyc_account: string, data: any): Promise<any> {
        let form = [{ "level": ApiConfiguration.FORM_BUYER_BASIC, "content": data }];
        const formData = new FormData();
        formData.append('information', JSON.stringify(form));
        await KYC.update(kyc_account, formData);
    }

    async call(userId: string, payload: any): Promise<any> {
        let user = await this.process(userId, payload);
        return await new ProfileBuyerKYC1Serializer().serialize(user);
    }

}
