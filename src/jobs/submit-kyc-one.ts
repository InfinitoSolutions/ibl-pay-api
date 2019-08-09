import JobKYC from '@services/kyc/job-kyc';

const executeJob = async (job: any, agenda: any) => {
    console.log('SCHEDULE SUBMIT KYC RUNNING....');
    const { user_id } = job.attrs.data;
    try {
        if (!user_id) {
            console.log('User ID was not found');
            return Promise.resolve();
        }
        await JobKYC.submitKYC(user_id);
    } catch (e) {
        console.log("ERROR:", e);
        // // Retry again
        // await agenda.now('submit.kyc.schedule.one', { user_id });
    }
};

export default (agenda: any) => {
    agenda.define('submit.kyc.schedule.one', async (job: any, done: any) => {
        await executeJob(job, agenda);
        done();
    });
};
