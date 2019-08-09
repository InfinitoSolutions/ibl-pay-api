import ValidatorInterface from '@validator/validator.interface';
import { RecipientValidator } from '@services/notification/validator/able-to-mark-read';
import { IUser } from '@models/user.model';

export class MarkAsReadNotificationValidator implements ValidatorInterface {
    user: IUser;
    rules: ValidatorInterface[];
    constructor(user: IUser) {
        this.user = user;

        this.rules = [
            new RecipientValidator(this.user),
        ];
    }

    add(rule: ValidatorInterface) {
        this.rules.push(rule);
        return this;
    }

    clear() {
        this.rules = [];
        return this;
    }

    async validate(data: any) {
        if (this.rules.length === 0) {
            return true;
        }
        for (let i = 0; i < this.rules.length; i++) {
            await this.rules[i].validate(data);
        }
        return true;
    }
}
