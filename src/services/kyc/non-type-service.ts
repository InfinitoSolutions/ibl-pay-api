const Joi = require('joi');
import { KYCService } from './abstract-kyc';
import { KYCSerializer } from './serializer';

export class Serializer extends KYCSerializer {
    constructor() {
        super();
    }
}

export class NonTypeService extends KYCService {
    constructor(agenda: any) {
        super(new Serializer(), agenda);
    }

    validate(payload: any): void {
    }

    async updateKYC(kyc_account: string, payload: any): Promise<any> {
    }

    async call(userId: string, payload: any): Promise<any> {
    }

}
