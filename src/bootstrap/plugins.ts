import * as hapi from 'hapi';
import jwt from './jwt';
import apiKey from './api-key';

const path = require('path');
const Inert = require('inert');
const Vision = require('vision');
const Pack = require('../../package');

const AGENDA_MONGO_URL = process.env.AGENDA_MONGO_URL || '';

export default class Plugins {
    static async register(server: hapi.Server): Promise<void> {
        await this.auth(server);
        await this.authApiKey(server);
        await this.socket(server);
        await this.logging(server);
        await this.agenda(server);
        await this.initViews(server);
    }

    static async auth(server: hapi.Server) {
        await server.register(require('hapi-auth-jwt2'));
        server.auth.strategy('jwt', 'jwt', jwt.jwtAuthPolicy);
        server.auth.strategy('buyer', 'jwt', jwt.jwtBuyerPolicy);
        server.auth.strategy('merchant', 'jwt', jwt.jwtMerchantPolicy);
        server.auth.strategy('user', 'jwt', jwt.jwtUserPolicy);
        server.auth.default('jwt');
    }

    static async authApiKey(server: hapi.Server) {
        await server.register(require('@plugins/api-key').default);
        server.auth.strategy('api-key', 'api-key', apiKey);
    }

    static async socket(server: hapi.Server) {
        server.events.removeAllListeners('request');
        await server.register(require('@plugins/socket').default);
    }

    static async logging(server: hapi.Server) {
        await server.register(require('@plugins/logging').default);
    }

    static async agenda(server: hapi.Server) {
        // Agenda Jobs
        await server.register({
            plugin: require('@plugins/agenda'),
            options: {
                mongoUrl: AGENDA_MONGO_URL,
                jobDir: path.join(__dirname, '../jobs')
            }
        });
    }

    static async initViews(server: any) {
        // Views
        server.views({
            engines: {
                html: require('handlebars')
            },
            relativeTo: __dirname,
            path: '../views',
            layoutPath: '../views/layout',
            layout: true
        });
    }
}
