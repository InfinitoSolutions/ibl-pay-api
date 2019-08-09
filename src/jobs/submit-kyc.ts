const debug = require('debug')('jobs.submit.kyc.schedule.all');
import JobKYC from '@services/kyc/job-kyc';

const processUser = async (agenda: any, user: any) => {
    try {
        await JobKYC.submitKYC(user._id);
    } catch (e) {
        debug(e.message);
        console.log("ERROR:", e);
    }
};

const executeJob = async (agenda: any, job: any) => {
    console.log('SUBMIT KYC SCHEDULER RUNNING....');
    const users = await JobKYC.getSubmitUsers();
    const promises = users.map((user: any) => processUser(agenda, user));
    return await Promise.all(promises);
};

export default (agenda: any) => {
    agenda.define('submit.kyc.schedule.all', async (job: any, done: any) => {
        await executeJob(agenda, job);
        done();
    });
};
