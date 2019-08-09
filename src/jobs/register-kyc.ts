const debug = require('debug')('jobs.register.kyc.schedule.all');
import JobKYC from '@services/kyc/job-kyc';

const processUser = async (agenda: any, user: any) => {
    try {
        await JobKYC.registerKYC({user_id: user._id});
    } catch (e) {
        debug(e.message);
        console.log("ERROR:", e);
    }
};

const executeJob = async (agenda: any, job: any) => {
    console.log('REGISTER KYC SCHEDULER RUNNING....');
    const users = await JobKYC.getNewUsers();
    const promises = users.map((user: any) => processUser(agenda, user));
    return await Promise.all(promises);
};

export default (agenda: any) => {
    agenda.define('register.kyc.schedule.all', async (job: any, done: any) => {
        await executeJob(agenda, job);
        done();
    });
};
