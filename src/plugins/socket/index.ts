import * as hapi from 'hapi';
import SocketIO from 'socket.io';
import {initAdapter} from './adapter';

const Config = require('config');

const register = async (server: hapi.Server, options: any) => {
    const BROADCAST_CHANNEL = Config.get('server.socket.broadcastChannel');
    const io = SocketIO(server.listener);
    if (initAdapter) {
        const adapter = initAdapter();
        io.adapter(adapter);

        adapter.pubClient.on('error', function (e: Error) {
            server.log(['socket.adapter.pubClient', 'error'], e.message);
        });
        adapter.subClient.on('error', function (e: Error) {
            server.log(['socket.adapter.subClient', 'error'], e.message);
        });
    }

    server.expose('io', io);

    io.on('connection', (socket: any) => {
        // Join broadcast channel
        socket.join(BROADCAST_CHANNEL);
        socket.emit('connect', 'Hey there!, you are connected');

        socket.on('join', (userId: string) => {
            socket.join(userId);
            socket.userId = userId;

            // Broadcast to
            io.to(BROADCAST_CHANNEL).emit('join', `User ${userId} has joined`);
            server.log(['socket.join', 'info'], `User [${userId}] was joined`);
        });

        socket.on('disconnect', () => {
            server.log(['socket.disconnect', 'info'], `User [${socket.userId}] was disconnected`);
        });
    });
};

const name = 'c2c-socket-io';
const version = '0.0.1';

export default { register, name, version };