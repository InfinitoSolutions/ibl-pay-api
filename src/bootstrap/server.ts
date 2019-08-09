"use strict";

import * as hapi from 'hapi';
import * as db from './mongoose';
import routes from './routes';
import Plugins from './plugins';
import * as rabbitmq from './rabbitmq';
import * as FirebaseAdmin from 'firebase-admin';

const config = require('config');

const MONGO_URL = process.env.MONGO_URL || '';
const PORT = process.env.PORT;

export default class Server {
    private static _instance: Server;
    private server: hapi.Server;

    private defaultOptions = {
        port: PORT,
        host: '0.0.0.0'
    };

    private constructor(options: any = {}) {
        options = Object.assign({}, this.defaultOptions, options);
        this.server = new hapi.Server(options);
    }

    get plugins(): any {
        return this.server.plugins;
    }

    getPluginByName(name: string, key: string): any {
        const plugins = this.plugins;
        if (name in plugins && key in plugins[name]) {
            return plugins[name][key];
        }
        return null;
    }

    static instance(options: any = {}): Server {
        if (!Server._instance) {
            Server._instance = new Server(options);
        }
        return Server._instance;
    }

    private async init(): Promise<void> {
        await this.initDb();
        await this.initPlugins();
        await this.initRoutes();
        await this.initFirebase();
        // await this.initRabbitMq();

    }

    private async initDb() {
        await db.connect(MONGO_URL);
        console.log('mongodb connect:', MONGO_URL);
        console.log('server listening on port:', PORT);
    }

    private async initRoutes(): Promise<void> {
        const promises = routes.map((route: any) => {
            if (!route.config) {
                route.config = {};
            }
            route.config.cors = {
                origin: ['*'],
                additionalHeaders: ['cache-control', 'x-requested-with']
            };
            return route;
        });
        const newRoutes = await Promise.all(promises);
        await this.addRoutes(newRoutes);
    }

    private async initPlugins(): Promise<void> {
        await Plugins.register(this.server);
    }

    private async initFirebase(): Promise<void> {
        const serviceAccount = config.get('server.fcm');
        FirebaseAdmin.initializeApp({
            credential: FirebaseAdmin.credential.cert(serviceAccount),
            projectId: serviceAccount.project_id
        });
    }

    private async initRabbitMq(): Promise<void> {
        await rabbitmq.connect().then(conn => {
            console.log('rabbitmq connect success');
            process.once('SIGINT', () => {
                conn.close();
            });
        });
    }

    async addRoutes(routes: any): Promise<void> {
        this.server.route(routes);
    }

    async start(): Promise<void> {
        await this.init();
        await this.server.start();
    }
}
