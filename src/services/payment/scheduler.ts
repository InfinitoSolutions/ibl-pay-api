const moment = require('moment');
const config = require('config');
import { RECURRING_TYPE } from '@models/constant';
import { Moment } from 'moment';
import { IRecurring } from '@models/bill.model';
const TIME_FORMAT = 'HH:mm:ss';
const DAILY_SCHEDULE_TS = 1; // Daily
const WEEKLY_SCHEDULE_TS = 2; // Weekly
const MONTHLY_SCHEDULE_TS = 3; // Monthly

const START_TIME_TS_DELTA = 62135596800;

export interface IPaymentScheduler {
    validate(): boolean;
    schedule(): void;
    toJSON(): any;

    /**
     * Scheduled execution time
     */
    getNextScheduledTime(): Date | string | null;

    /**
     * Is available to execute
     */
    isAvailable(): boolean;
}

export class PaymentScheduler {
    static factory(payload: IRecurring): IPaymentScheduler {
        const { recurring_type } = payload;
        switch (recurring_type) {
            case RECURRING_TYPE.DAILY:
                return new DailyScheduler(payload);
            case RECURRING_TYPE.WEEKLY:
                return new WeeklyScheduler(payload);
            case RECURRING_TYPE.MONTHLY:
                return new MonthlyScheduler(payload);
            default:
                throw new Error('Invalid Recurring Type');
        }
    }
}

export abstract class AbstractPaymentScheduler implements IPaymentScheduler {
    start_date: string | null = null;
    end_date: string | null = null;
    recurring_type: string | null = null;
    schedule_time: string | null = null;
    next_run_at: string | null = null;
    last_run_at: string | null = null;
    run_at: string | null = null;
    max_fund: number | null = null;
    duration: number = 0;

    schedule_ts: number = -1;
    start_time_ts: number = -1;
    payload: any;

    [name: string]: any;

    constructor(payload: any) {
        this.payload = payload || {};
        this.init();
    }

    protected abstract reschedule(): void;
    abstract isAvailable(): boolean;

    protected init() {
        const guardFields = [
            'payload',
        ];
        for (let k in this.payload) {
            if ((-1 !== guardFields.indexOf(k)) || !this.hasOwnProperty(k)) {
                continue;
            }
            this[k] = this.payload[k];
        }
        this.ensureStartTimestamp();
    }

    protected ensureStartTimestamp() {
        const st = this.getStartTime();
        if (!st) {
            return;
        }
        this.start_time_ts = st.unix() + START_TIME_TS_DELTA;
    }

    protected getStartTime() {
        let d = moment(this.start_date);
        let t = moment(this.schedule_time, TIME_FORMAT);
        if (!d.isValid() || !t.isValid()) {
            return null;
        }
        d.hour(t.hour()).minute(t.minute()).second(t.second());
        return d;
    }

    protected getEndTime() {
        let d = moment(this.end_date);
        let t = moment(this.schedule_time, TIME_FORMAT);
        if (!d.isValid() || !t.isValid()) {
            return null;
        }
        d.hour(t.hour()).minute(t.minute()).second(t.second());
        return d;
    }

    getNextScheduledTime(): Date | string | null {
        return this.next_run_at;
    }

    getScheduledTime(): Moment | null {
        if (!this.run_at) {
            return null;
        }
        let d = moment(this.run_at);
        let t = moment(this.schedule_time, TIME_FORMAT);
        if (!d.isValid() || !t.isValid()) {
            return null;
        }
        d.hour(t.hour()).minute(t.minute()).second(t.second());
        return d;
    }

    protected calcDuration(unit = 'days') {
        const sd = moment(this.start_date);
        const ed = moment(this.end_date);
        let duration = 0;
        if (sd.isValid() && ed.isValid()) {
            duration = ed.diff(sd, unit);
            if (duration >= 0) {
                duration++;
            }
        }
        return duration;
    }

    schedule() {
        if (this.isEnded()) {
            this.next_run_at = null;
            return;
        }
        this.reschedule();
    }

    isNextSchedule() {
        let d = moment(this.schedule_time, TIME_FORMAT);
        if (this.next_run_at) {
            const nextRunAt = moment(this.next_run_at);
            return d.isSameOrBefore(nextRunAt);
        }
        const st = this.getStartTime();
        return d.isSameOrAfter(st) && st.isBefore(moment());
    }

    isValidScheduledDate(d: any) {
        const t = moment(this.schedule_time, TIME_FORMAT);
        let endTime = moment(this.end_date)
            .hour(t.hour())
            .minute(t.minute())
            .second(t.second());

        if (d.isSameOrBefore(endTime)) {
            return true;
        }
        return false;
    }

    validate() {
        return true;
    }

    isEnded() {
        const d = moment(this.end_date);
        const t = moment(this.schedule_time, TIME_FORMAT);
        d.hour(t.hour()).minute(t.minute()).second(t.second());

        return d.isBefore(moment());
    }

    isStarted() {
        return moment(this.start_date).isSameOrBefore(moment());
    }

    toJSON() {
        return {
            start_date: this.start_date,
            end_date: this.end_date,
            schedule_time: this.schedule_time,
            recurring_type: this.recurring_type,
            last_run_at: this.last_run_at,
            next_run_at: this.next_run_at,
            max_fund: this.max_fund,
            schedule: this.schedule_ts,
            start_time: this.start_time_ts,
            duration: this.duration
        };
    }
}

export class DailyScheduler extends AbstractPaymentScheduler {

    protected reschedule() {
        this.schedule_ts = DAILY_SCHEDULE_TS;
        this.duration = this.calcDuration('days');

        let d = moment(this.schedule_time, TIME_FORMAT);
        if (!d.isValid()) {
            throw new Error('Scheduled Time is invalid format');
        }
        if (this.isNextSchedule()) {
            d.add(1, 'days');
        }
        if (this.isValidScheduledDate(d)) {
            const st = this.getStartTime();
            this.next_run_at = (d.isSameOrAfter(st)) ? d.toDate() : st;
        } else {
            this.next_run_at = null;
        }
        return this.next_run_at;
    }

    isAvailable(): boolean {
        const scheduledTime = this.getScheduledTime();
        if (!scheduledTime) {
            return false;
        }

        const now = moment();
        if (!scheduledTime.isSameOrBefore(now)) {
            return false;
        }
        const duration = config.get('payment.schedule.dailyDurationHours') || 0;
        const dt = scheduledTime.add(duration, 'hours');
        if (dt.isSameOrAfter(now)) {
            return true;
        }
        return false;
    }
}

export class WeeklyScheduler extends AbstractPaymentScheduler {
    protected reschedule() {
        this.schedule_ts = WEEKLY_SCHEDULE_TS;
        this.duration = this.calcDuration('weeks');

        // day_of_week is a number 1: Mon, 7: Sun
        if (this.day_of_week < 1 || this.day_of_week > 7) {
            throw new Error('Day of week must be 1-7');
        }
        let d = moment(this.schedule_time, TIME_FORMAT);
        if (!d.isValid()) {
            throw new Error('Scheduled Time is invalid format');
        }
        if (this.isNextSchedule()) {
            d.add(1, 'weeks').isoWeekday(this.day_of_week);
        }
        if (this.isValidScheduledDate(d)) {
            const st = this.getStartTime();
            this.next_run_at = (d.isSameOrAfter(st)) ? d.toDate() : st;
        } else {
            this.next_run_at = null;
        }
        return this.next_run_at;
    }

    isAvailable(): boolean {
        const scheduledTime = this.getScheduledTime();
        if (!scheduledTime) {
            return false;
        }
        const now = moment();
        if (!scheduledTime.isSameOrBefore(now)) {
            return false;
        }
        const duration = config.get('payment.schedule.weeklyDurationDays') || 0;
        const dt = scheduledTime.add(duration, 'days');

        if (dt.isSameOrAfter(now)) {
            return true;
        }
        return false;
    }
}

export class MonthlyScheduler extends AbstractPaymentScheduler {

    protected reschedule() {
        this.schedule_ts = MONTHLY_SCHEDULE_TS;
        this.duration = this.calcDuration('months');

        if (this.day_of_month < 1 || this.day_of_month > 31) {
            throw new Error('Day of week must be 1-31');
        }
        let d = moment(this.schedule_time, TIME_FORMAT);
        if (!d.isValid()) {
            throw new Error('Scheduled Time is invalid format');
        }
        if (this.isNextSchedule()) {
            d.add(1, 'months');
        }
        let month = d.month();
        d.date(this.day_of_month);
        if (month < d.month()) {
            let h = d.hour();
            let m = d.minute();
            let s = d.second();
            d.month(month).endOf('month').hour(h).minute(m).second(s);
        }
        if (this.isValidScheduledDate(d)) {
            const st = this.getStartTime();
            this.next_run_at = (d.isSameOrAfter(st)) ? d.toDate() : st;
        } else {
            this.next_run_at = null;
        }

        return this.next_run_at;
    }

    isAvailable(): boolean {
        const scheduledTime = this.getScheduledTime();
        if (!scheduledTime) {
            return false;
        }
        const now = moment();
        if (!scheduledTime.isSameOrBefore(now)) {
            return false;
        }
        const duration = config.get('payment.schedule.monthlyDurationDays') || 0;
        const dt = scheduledTime.add(duration, 'days');
        if (dt.isSameOrAfter(now)) {
            return true;
        }
        return false;
    }
}
