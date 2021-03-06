const Joi = require('joi');
import ProfileMerchantKYC13ValidateSchema from '@validator/profile.merchant.kyc13';
import { KYCService } from './abstract-kyc';
import { KYC } from '../api/kyc';
import { ApiConfiguration } from '../api/http/config';
import { ProfileMerchantKYC13Serializer } from '@serializer/profile.serializer';
import { KYCSerializer } from './serializer';
import { KYC_SUBMIT_STATUS } from '../../models/constant';
import FormData from 'form-data';

export class Serializer extends KYCSerializer {
    constructor() {
        super();
        this.fields = ['business_representative', 'current_address', 'residence_address', 'business_address', 'mailing_address', 'business_info'];
        this.fields2 = ['document_type', 'document_url', 'identity_card', 'passport', 'business_license'];
    }
}

export class MerchantKYC13Service extends KYCService {
    constructor(agenda: any) {
        super(new Serializer(), agenda);
        this.kyc_new = { kyc1_submit: KYC_SUBMIT_STATUS.NEW, kyc3_submit: KYC_SUBMIT_STATUS.NEW };
        this.kyc_reg = { kyc1_submit: KYC_SUBMIT_STATUS.REGISTERED, kyc3_submit: KYC_SUBMIT_STATUS.REGISTERED };
        this.kyc_fail = { kyc1_submit: KYC_SUBMIT_STATUS.FAILED, kyc3_submit: KYC_SUBMIT_STATUS.FAILED };
    }

    validate(payload: any): void {
        const { error, values } = Joi.validate(payload, ProfileMerchantKYC13ValidateSchema);
        if (error !== null) {
            throw error;
        }
    }

    preUpdate(data: any): any {
        if (!data.identity_card) {
            data.identity_card = null;
        }
        if (!data.passport) {
            data.passport = null;
        }
        return data;
    }

    async updateKYC(kyc_account: string, data: any): Promise<any> {
        if (!data[1].identity_card) {
            delete data[1].identity_card;
        }
        if (!data[1].passport) {
            delete data[1].passport;
        }
        let form = [
            { "level": ApiConfiguration.FORM_MERCHANT_BASIC, "content": data[0] },
            { "level": ApiConfiguration.FORM_MERCHANT_ENGAGED, "content": data[1] }
        ];
        const formData = new FormData();
        formData.append('information', JSON.stringify(form));
        await KYC.update(kyc_account, formData);
    }

    async call(userId: string, payload: any): Promise<any> {
        let user = await this.process(userId, payload);
        return await new ProfileMerchantKYC13Serializer().serialize(user);
    }

}
