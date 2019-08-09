export default class Pagination {
    count: number = 0;
    results: any[] = [];
    page: number = 0;
    limit: number = 0;

    constructor(count: number = 0, results: any[] = [], page: number = 0, limit: number = 0) {
        this.count = count;
        this.results = results;
        this.page = page;
        this.limit = limit;
    }
}
