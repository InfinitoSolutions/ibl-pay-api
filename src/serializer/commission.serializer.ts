import { JsonSerializer } from './serializer';

export class CommissionSerializer extends JsonSerializer {
    constructor() {
        super();
        this.fields = ['_id', 'type', 'fee_percentage'];
    }
}