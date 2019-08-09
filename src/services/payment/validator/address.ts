import ValidatorInterface from '@validator/validator.interface';
import { AddressFormatError, NotFoundError } from '@validator/errors';
import User from '@models/user.model';

const { wallet } = require('@cityofzion/neon-js');

export class AddressValidator implements ValidatorInterface {

    async validate(data: any) {
        let address = null;
        if (typeof data === 'string') {
            address = data;
        } else {
            address = data.address;
        }
        if (!wallet.isAddress(address)) {
            throw new AddressFormatError();
        }
        const exists = await User.findOne({ neo_wallet: address });
        if (!exists) {
            throw new NotFoundError();
        }
        return true;
    }
}


export class MerchantAddressValidator extends AddressValidator {

    async validate(data: any) {
        const { merchant_address } = data;
        return await super.validate(merchant_address);
    }
}

export class NeoAddressValidator extends AddressValidator {

    async validate(data: any) {
        const { neo_wallet } = data;
        return await super.validate(neo_wallet);
    }
}