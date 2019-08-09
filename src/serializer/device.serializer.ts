import { JsonSerializer } from './serializer';

export class DeviceSerializer extends JsonSerializer {
    constructor() {
        super();
        this.fields = ['_id', 'registration_id', 'platform', 'name'];
    }
}