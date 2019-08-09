'use strict';

const glob = require('glob');
const path = require('path');
const _ = require('lodash');
const commitHash = require('child_process')
  .execSync('git rev-parse HEAD', { encoding: 'utf8' })
  .trim();

// add ping route by default for health check
const routes = [{
    method: 'GET',
    path: '/ping',
    handler: (request: any, reply: any) => {
        return reply.response('pong');
    },
    config: {
        tags: ['api'],
        description: 'Test API',
        auth: false
    }
}, {
    method: 'GET',
    path: '/version',
    handler: (request: any, reply: any) => {
        return reply.response(commitHash);
    },
    config: {
        tags: ['api'],
        description: 'API version',
        auth: false,
        cors: {
            origin: ['*'],
            additionalHeaders: ['cache-control', 'x-requested-with']
        }
    }
}, { // Use for test server, must remove in release, must set FILESV_URL = backend url + /upload
    method: 'GET',
    path: '/upload/{file*}',
    handler: {
        directory: {
            path: 'upload/nfs'
        }
    },
    config: {
        auth: false
    }
}];

// add all routes from all modules to the routes array manually or write your routes inside a folder inside the server folder
// with suffix as routes.js e.g user.routes.js
glob.sync(path.join(__dirname, '../routes/**/*routes.js')).forEach((file: string) => {
    routes.push(require(path.resolve(file)).default);
});

// export default routes;
export default _.flattenDeep(routes);
