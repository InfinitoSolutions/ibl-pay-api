import { JsonSerializer } from '@serializer/serializer';

export class ProfileBuyerKYC1Serializer extends JsonSerializer {
    constructor() {
        super();
        this.fields = ['_id', 'kyc_register', 'kyc1_submit', 'kyc3_submit', 'birthday', 'country_code', 'phone_number', 'current_address', 'permanent_address'];
    }
}

export class ProfileBuyerKYC3Serializer extends JsonSerializer {
    constructor() {
        super();
        this.fields = ['_id', 'kyc_register', 'kyc1_submit', 'kyc3_submit', 'identity_card', 'passport', 'document_type', 'document_url'];
    }
}

export class ProfileBuyerKYC13Serializer extends JsonSerializer {
    constructor() {
        super();
        this.fields = ['_id', 'kyc_register', 'kyc1_submit', 'kyc3_submit', 'birthday', 'country_code', 'phone_number', 'current_address', 'permanent_address',
            'identity_card', 'passport', 'document_type', 'document_url'];
    }
}

export class ProfileMerchantKYC1Serializer extends JsonSerializer {
    constructor() {
        super();
        this.fields = [
            '_id', 'kyc_register', 'kyc1_submit', 'kyc3_submit',
            'business_representative',
            'current_address', 'residence_address',
            'business_address', 'mailing_address',
            'business_info'
        ];
    }
}

export class ProfileMerchantKYC3Serializer extends JsonSerializer {
    constructor() {
        super();
        this.fields = [
            '_id', 'kyc_register', 'kyc1_submit', 'kyc3_submit', 'identity_card', 'passport',
            'document_type', 'document_url', 'business_license'
        ];
    }
}

export class ProfileMerchantKYC13Serializer extends JsonSerializer {
    constructor() {
        super();
        this.fields = [
            '_id', 'kyc_register', 'kyc1_submit', 'kyc3_submit',
            'business_representative',
            'current_address', 'residence_address',
            'business_address', 'mailing_address',
            'business_info', 'identity_card', 'passport',
            'document_type', 'document_url', 'business_license'
        ];
    }
}
