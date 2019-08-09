'use strict'

const glob = require('glob')
const path = require('path')
const _ = require('lodash')

// add ping route by default for health check
const routes = [{
    method: 'GET',
    path: '/ping',
    handler: (request, reply) => {
        return reply.response('pong')
    },
    config: {
        tags: ['api'],
        description: 'Test API',
        auth: false
    }
}];

// add all routes from all modules to the routes array manually or write your routes inside a folder inside the server folder
// with suffix as routes.js e.g user.routes.js
glob.sync(path.join(__dirname, './app/routes/**/*routes.js')).forEach((file) => {
    routes.push(require(path.resolve(file)))
});

// export routes
module.exports = _.flattenDeep(routes);
