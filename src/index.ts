"use strict";

// Set default timezone
process.env.TZ = 'UTC';

require('module-alias/register');
require('dotenv').config();

import Server from '@bootstrap/server';

(async () => {
    try {
        const server = Server.instance();
        await server.start();
    } catch (err) {
        console.log('Error: ', err);
    }
})();
