import { JsonSerializer } from '@serializer/serializer';
import User, { IUser } from '@models/user.model';
import { UserSerializer } from '@serializer/user.serializer';

const SYSTEM_USER = {
    _id: 'system',
    display_name: 'System'
};

export class NotificationSerializer extends JsonSerializer {
    user: IUser;
    constructor(user: IUser) {
        super();
        this.fields = [
            '_id', 'type', 'verb', 'actor',
            'read', 'archived', 'payload',
            'created_at', 'message', 'title'
        ];
        this.user = user;
    }

    private async created_at(data: any) {
        return data.createdAt;
    }

    private async actor(data: any): Promise<any> {
        const actorId = data.actor_id;
        if (actorId === 'system') {
            return SYSTEM_USER;
        }
        const actor = await this.getUser(actorId);
        if (!actor) {
            return null;
        }
        return new UserSerializer().serialize(actor);
    }

    private async getUser(userId: string): Promise<IUser | null> {
        try {
            return await User.findById(userId);
        } catch (error) {
            return null;
        }
    }
}