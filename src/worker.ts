"use strict";

// Set default timezone
process.env.TZ = 'UTC';

require('module-alias/register');
require('dotenv').config();
const config = require('config');

import { queues, jobHandlers } from './queues';
import * as db from '@bootstrap/mongoose';
import * as FirebaseAdmin from 'firebase-admin';
import * as rabbitmq from '@bootstrap/rabbitmq';

const start = async () => {
    try {
        // 1. connect DB
        const MONGO_URL = process.env.MONGO_URL || '';
        await db.connect(MONGO_URL);

        // 2. Init Firebase 
        const serviceAccount = config.get('server.fcm');
        FirebaseAdmin.initializeApp({
            credential: FirebaseAdmin.credential.cert(serviceAccount),
            projectId: serviceAccount.project_id
        });

        // 3. Process queue
        for (let queueName in queues) {
            if (!queueName) {
                continue;
            }
            const queue = queues[queueName];
            const handler = jobHandlers[queueName];
            console.log(`Worker listening to '${queueName}' queue`);
            queue.process(handler);
        }

        // 4. Rabbitmq queue
        rabbitmq.connect().then(conn => {
            console.log('rabbitmq connect success');
            process.once('SIGINT', () => {
                conn.close();
            });
            conn.createChannel().then(channel => {
                // for (let queue of queues) {
                // }
            })
            .catch(error => {
                console.log('error: ', error);
            });
        });
    } catch (e) {
        console.log('WORKER ERROR: ', e);
    }
};
start();