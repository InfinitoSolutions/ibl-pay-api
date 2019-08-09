const Config = require('config');
import mailer from '@services/mailer';

const forgotPasswordJob = async (job: any, done: any) => {
    const { email, token } = job.attrs.data;

    // Send Email
    let subject = Config.get('forgotPassword.email.subject');
    let template = Config.get('forgotPassword.email.template');

    const BASE_URL = process.env.BASE_URL;
    const url = `${BASE_URL}/v1/users/reset-password?token=${token}`;
    const emailData = {
        url: url
    };
    await mailer.send(template, email, subject, emailData);
    done();
};

export default (agenda: any) => {
    agenda.define('user.forgot-password.email', forgotPasswordJob);
};
