import JobKYC from '@services/kyc/job-kyc';

const executeJob = async (job: any, agenda: any) => {
    console.log('SCHEDULE REGISTER KYC RUNNING....');
    const { data } = job.attrs;
    try {
        if (!data.user_id) {
            console.log('User ID was not found');
            return Promise.resolve();
        }
        await JobKYC.registerKYC(data);
    } catch (e) {
        console.log("ERROR:", e);
        // // Retry again
        // await agenda.now('register.kyc.schedule.one', data);
    }
};

export default (agenda: any) => {
    agenda.define('register.kyc.schedule.one', async (job: any, done: any) => {
        await executeJob(job, agenda);
        done();
    });
};
