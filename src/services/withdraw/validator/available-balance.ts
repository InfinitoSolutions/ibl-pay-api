import ValidatorInterface from '@validator/validator.interface';
import { AvailableBalanceError, NotFoundError } from '@validator/errors';
import { Balance } from '@utils/balance';
import Wallet from '@models/wallet.model';
import { IUser } from '@models/user.model';

export class AvailableBalanceValidator implements ValidatorInterface {
    constructor(protected user: IUser) { }

    async validate(data: any) {
        const { amount, wallet: { currency } } = data;
        const wallet: any = await Wallet.findOne({ user_id: this.user._id, currency: currency });
        if (!wallet) {
            throw new NotFoundError();
        }
        const availableBalance = await Balance.getAvailableBalance(wallet);
        if (amount <= 0 || amount > availableBalance) {
            throw new AvailableBalanceError();
        }
        return true;
    }
}
