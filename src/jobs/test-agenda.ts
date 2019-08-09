
const jobHandler = async (job: any, done: any) => {
    console.log('=========== THIS IS A TEST JOB ============: ', job.attrs);
    setTimeout(() => done(), 1000);
};

export default (agenda: any) => {
    agenda.define('agenda.test', jobHandler);
};
