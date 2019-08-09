import { JsonSerializer } from '@serializer/serializer';

export class UserSerializer extends JsonSerializer {
    constructor() {
        super();
        this.fields = ['_id', 'email', 'role',
            'status', 'kyc_level',
            'country', 'neo_wallet',
            'display_name', 'first_name', 'last_name', 'entity_name'
        ];
    }
}

export class TokenSerializer extends JsonSerializer {
    constructor() {
        super();
        this.fields = ['user', 'token', 'first_login'];
    }

    async user(data: any) {
        return await new UserSerializer().serialize(data.user);
    }
}

export class CryptoWalletSerializer extends JsonSerializer {
    constructor() {
        super();
        this.fields = ['address', 'currency', 'name'];
    }
}

export class UserProfileSerializer extends JsonSerializer {
    constructor() {
        super();
        this.fields = [
            '_id', 'email', 'role', 'status', 'kyc_level', 'kyc_expire_date', 'kyc_register', 'kyc1_submit', 'kyc3_submit',
            'country', 'neo_wallet', 'first_name', 'last_name', 'display_name', 'entity_name',
            'crypto_currencies', 'birthday', 'country_code', 'phone_number', 'current_address',
            'permanent_address', 'residence_address', 'business_address', 'mailing_address',
            'business_representative', 'identity_card', 'passport', 'document_type',
            'document_url', 'business_license', 'business_info', 'avatar', 'sm_register'
        ];
    }

    async crypto_currencies(data: any) {
        return await new CryptoWalletSerializer().serialize(data.crypto_currencies, true);
    }
}
