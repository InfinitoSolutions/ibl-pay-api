import { JsonSerializer } from './serializer';

export class AccountSerializer extends JsonSerializer {
    constructor() {
        super();
        this.fields = ['_id', 'status', 'address', 'currency'];
    }
}