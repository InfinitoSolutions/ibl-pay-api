import Pagination from './pagination';
const moment = require('moment');
const DATE_TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

export default class QueryBuilder {
    from_date: string | null = null;
    to_date: string | null = null;
    sorts: any = {};

    constructor() {
        this.from_date = null;
        this.to_date = null;
        this.sorts = {};
    }

    fromDate(date: string) {
        this.from_date = date;
        return this;
    }

    toDate(date: string) {
        const d = moment(date);
        if (d.isValid()) {
            d.hour(23).minute(59).second(59);
            this.to_date = d.format(DATE_TIME_FORMAT);
        } else {
            this.to_date = null;
        }
        return this;
    }

    today() {
        return this.fromDate(moment().startOf('date').toDate());
    }

    thisWeek() {
        return this.fromDate(moment().startOf('week').toDate());
    }

    thisMonth() {
        return this.fromDate(moment().startOf('month').toDate());
    }

    sort(sorts: any = {}) {
        this.sorts = sorts;
        return this;
    }

    buildQuery(): any {
        throw new Error('Not implemented yet');
    }

    async query(): Promise<any> {
        return await this.buildQuery()
            .sort(this.sorts)
            .exec();
    }

    async paginate(limit: number, page: number) {
        limit = Number(limit);
        page = Number(page);

        const query = this.buildQuery();
        const count = await query.countDocuments();
        const skip = (page - 1) * limit;
        const results = await this.buildQuery()
            .limit(limit)
            .skip(skip)
            .sort(this.sorts)
            .exec();

        return new Pagination(count, results, page, limit);
    }

    async count(): Promise<number> {
        const query = this.buildQuery();
        const count = await query.countDocuments();
        return count;
    }
}
