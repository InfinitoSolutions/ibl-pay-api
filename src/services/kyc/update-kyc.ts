import { KYC_SUBMIT_STATUS } from '../../models/constant';

interface IKyc {
    approve(): any;
    reject(): any;
    incomplete(): any;
}

abstract class KycUpdate implements IKyc {
    _user: any;
    constructor(user: any) {
        this._user = user;
    }

    approve() { }
    reject() { }
    incomplete() { }

    update(user: any) {
        return this._user.save();
    }

    process(status: any) {
        switch (status) {
            case KYC_SUBMIT_STATUS.APPROVED:
                this.approve();
                break;
            case KYC_SUBMIT_STATUS.REJECTED:
                this.reject();
                break;
            case KYC_SUBMIT_STATUS.INCOMPLETE:
                this.incomplete();
                break;
            default:
                break;
        }
        return this._user.save();
    }
}

class Kyc0 extends KycUpdate {
    approve() {
        this._user.kyc_level = 1;
        this._user.kyc_register = KYC_SUBMIT_STATUS.REGISTERED;
        this._user.kyc1_submit = KYC_SUBMIT_STATUS.APPROVED;
    }
    reject() {
        this._user.kyc1_submit = KYC_SUBMIT_STATUS.REJECTED;
    }
    incomplete() {
        this._user.kyc1_submit = KYC_SUBMIT_STATUS.INCOMPLETE;
    }
}

class Kyc1 extends KycUpdate {
    approve() {
        this._user.kyc_level = 3;
        this._user.kyc1_submit = KYC_SUBMIT_STATUS.APPROVED;
        this._user.kyc3_submit = KYC_SUBMIT_STATUS.APPROVED;
    }
    reject() {
        this._user.kyc1_submit = KYC_SUBMIT_STATUS.REJECTED;
    }
    incomplete() {
        this._user.kyc1_submit = KYC_SUBMIT_STATUS.INCOMPLETE;
    }
}

class Kyc3 extends KycUpdate {
    approve() {
        this._user.kyc3_submit = KYC_SUBMIT_STATUS.APPROVED;
    }
    reject() {
        this._user.kyc3_submit = KYC_SUBMIT_STATUS.REJECTED;
    }
    incomplete() {
        this._user.kyc3_submit = KYC_SUBMIT_STATUS.INCOMPLETE;
    }
}

function KycFactory(user: any) {
    switch (user.kyc_level) {
        case 1:
            return new Kyc1(user);
        case 3:
            return new Kyc3(user);
        default:
            return new Kyc0(user);
    }
}

export default KycFactory;
