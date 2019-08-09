import ValidatorInterface from '@validator/validator.interface';
import {RecurringDateInValidError} from '@services/payment/errors';

const moment = require('moment');
const TIME_FORMAT = "HH:mm:ss";
const DATE_FORMAT = "MM/DD/YYYY";

export class RecurringDateValidator implements ValidatorInterface {

    async validate(data: any) {
        const {is_recurring} = data;
        if (!is_recurring) {
            return true;
        }
        const {recurring} = data;
        if (!recurring) {
            return true;
        }
        const {start_date, end_date, schedule_time} = data.recurring;
        if (String(schedule_time).length !== 8 || !moment(schedule_time, TIME_FORMAT, true).isValid()) {
            throw new RecurringDateInValidError();
        }

        if (moment(end_date).isBefore(start_date)) {
            throw new RecurringDateInValidError();
        }
        let start_datetime = moment.utc(`${moment(start_date).format(DATE_FORMAT)} ${schedule_time}`);
        let n = moment().add(3, 'minutes');
        if (start_datetime.isBefore(n)) {
            throw new RecurringDateInValidError();
        }
        return true;
    }

}
