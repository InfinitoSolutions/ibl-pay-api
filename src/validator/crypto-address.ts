import ValidatorInterface from './validator.interface';
import { DuplicatedAddress, RequiredCryptoCurrencies } from './errors';
import User from '@models/user.model';

export class CryptoAddressValidator implements ValidatorInterface {
    async validate(data: any) {
        const { crypto_currencies } = data;
        if (crypto_currencies.length === 0) {
            throw new RequiredCryptoCurrencies();
        }
        const listAddress = crypto_currencies.map(({ address }) => address)
        const address = await User.findOne({ 'crypto_currencies.address': listAddress })
        if (address) {
            throw new DuplicatedAddress();
        }
        return true;
    }
}
