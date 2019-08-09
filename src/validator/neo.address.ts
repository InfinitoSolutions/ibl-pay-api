import ValidatorInterface from '@validator/validator.interface';
import { AddressFormatError, AddressExistsError } from '@validator/errors';
import { wallet } from '@cityofzion/neon-js';
import User from '@models/user.model';

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
        if (await User.findOne({ neo_wallet: address })) {
            throw new AddressExistsError();
        }
        return true;
    }
}

export class NeoAddressValidator extends AddressValidator {
    async validate(data: any) {
        const { neo_wallet } = data;
        return await super.validate(neo_wallet);
    }
}
