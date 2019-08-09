import * as hapi from 'hapi';

const Config = require('config');

const Agenda = require('agenda');
const glob = require('glob');
const path = require('path');
const _ = require('lodash');

const defineJobs = (agenda: any, options: any) => {
    const jobDir = options.jobDir;
    glob.sync(path.join(jobDir, './**/*.js')).forEach((file: string) => {
        require(path.resolve(file)).default(agenda);
    });
};

const register = async (server: hapi.Server, options: any) => {
    const mongoUrl = options.mongoUrl || process.env.AGENDA_MONGO_URL;
    const agenda = new Agenda({ db: { address: mongoUrl, options: { useNewUrlParser: true } } });
    agenda.processEvery('30 seconds');

    server.expose('agenda', agenda);
    agenda.on('fail', function (err: Error, job: any) {
        server.log(['agenda', 'error'], { err: err, job: job.attrs });
    });

    // Define Jobs
    defineJobs(agenda, options);

    // Wait for agenda to connect. Should never fail since connection failures
    // should happen in the `await MongoClient.connect()` call.
    await new Promise(resolve => agenda.once('ready', resolve));
    await agenda.start();

    const agendaConfig = Config.get('server.agenda');
    if (agendaConfig.every) {
        for (let interval in agendaConfig.every) {
            if (!agendaConfig.every[interval]) {
                continue;
            }
            let jobNames = agendaConfig.every[interval];
            if (!jobNames || (Array.isArray(jobNames) && jobNames.length === 0)) {
                continue;
            }
            agenda.every(interval, jobNames);
        }
    }
};

const name = 'c2c-agenda';
const version = '0.0.1';
module.exports = { register, name, version };