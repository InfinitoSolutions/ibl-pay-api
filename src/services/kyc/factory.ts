import { KYC_LEVEL, USER_ROLE, KYC_SUBMIT_STATUS } from '@models/constant';

import { NonTypeService } from './non-type-service';
import { BuyerKYC1Service } from './buyer-kyc1';
import { BuyerKYC3Service } from './buyer-kyc3';
import { BuyerKYC13Service } from './buyer-kyc13';
import { MerchantKYC1Service } from './merchant-kyc1';
import { MerchantKYC3Service } from './merchant-kyc3';
import { MerchantKYC13Service } from './merchant-kyc13';
import { KYCService } from './abstract-kyc';
import { IUserDocument } from '@models/user.model';

export class KYCServiceFactory {
    /**
     * Create an instant of KYC Service
     */
    static instance(user: IUserDocument, agenda: any): KYCService {
        switch (user.role) {
            case USER_ROLE.BUYER:
                switch (`${user.kyc1_submit}.${user.kyc3_submit}`) {
                    case `${KYC_SUBMIT_STATUS.NEW}.${KYC_SUBMIT_STATUS.NEW}`:
                    case `${KYC_SUBMIT_STATUS.NEW}.${KYC_SUBMIT_STATUS.FAILED}`:
                    case `${KYC_SUBMIT_STATUS.FAILED}.${KYC_SUBMIT_STATUS.NEW}`:
                    case `${KYC_SUBMIT_STATUS.FAILED}.${KYC_SUBMIT_STATUS.FAILED}`:
                        return new BuyerKYC13Service(agenda);
                }
                switch (`${user.kyc1_submit}`) {
                    case `${KYC_SUBMIT_STATUS.NEW}`:
                    case `${KYC_SUBMIT_STATUS.FAILED}`:
                        return new BuyerKYC1Service(agenda);
                }
                switch (`${user.kyc3_submit}`) {
                    case `${KYC_SUBMIT_STATUS.NEW}`:
                    case `${KYC_SUBMIT_STATUS.FAILED}`:
                        return new BuyerKYC3Service(agenda);
                }
                return new NonTypeService(agenda);
            case USER_ROLE.MERCHANT:
                switch (`${user.kyc1_submit}.${user.kyc3_submit}`) {
                    case `${KYC_SUBMIT_STATUS.NEW}.${KYC_SUBMIT_STATUS.NEW}`:
                    case `${KYC_SUBMIT_STATUS.NEW}.${KYC_SUBMIT_STATUS.FAILED}`:
                    case `${KYC_SUBMIT_STATUS.FAILED}.${KYC_SUBMIT_STATUS.NEW}`:
                    case `${KYC_SUBMIT_STATUS.FAILED}.${KYC_SUBMIT_STATUS.FAILED}`:
                        return new MerchantKYC13Service(agenda);
                }
                switch (`${user.kyc1_submit}`) {
                    case `${KYC_SUBMIT_STATUS.NEW}`:
                    case `${KYC_SUBMIT_STATUS.FAILED}`:
                        return new MerchantKYC1Service(agenda);
                }
                switch (`${user.kyc3_submit}`) {
                    case `${KYC_SUBMIT_STATUS.NEW}`:
                    case `${KYC_SUBMIT_STATUS.FAILED}`:
                        return new MerchantKYC3Service(agenda);
                }
                return new NonTypeService(agenda);
            default:
                return new NonTypeService(agenda);
        }
    }

    /**
     * Create an instant of KYC Service
     */
    static instanceP(user: IUserDocument, payload: any, agenda: any): KYCService {
        switch (user.role) {
            case USER_ROLE.BUYER:
                if (user.kyc_level === KYC_LEVEL.BASIC) {
                    if (payload.birthday && payload.document_type) {
                        return new BuyerKYC13Service(agenda);
                    } else if (payload.birthday) {
                        return new BuyerKYC1Service(agenda);
                    }
                    return new BuyerKYC3Service(agenda);
                } else if (user.kyc_level === KYC_LEVEL.ENGAGED) {
                    return new BuyerKYC3Service(agenda);
                } else {
                    return new NonTypeService(agenda);
                }
            case USER_ROLE.MERCHANT:
                if (user.kyc_level === KYC_LEVEL.BASIC) {
                    if (payload.current_address && payload.document_type) {
                        return new MerchantKYC13Service(agenda);
                    } else if (payload.current_address) {
                        return new MerchantKYC1Service(agenda);
                    }
                    return new MerchantKYC3Service(agenda);
                } else if (user.kyc_level === KYC_LEVEL.ENGAGED) {
                    return new MerchantKYC3Service(agenda);
                } else {
                    return new NonTypeService(agenda);
                }
            default:
                return new NonTypeService(agenda);
        }
    }
}
