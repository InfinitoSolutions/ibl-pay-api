const Config = require('config');
import mailer from '@services/mailer';

const passwordResetJob = async (job: any, done: any) => {
    const { email, password } = job.attrs.data;

    let subject = Config.get('resetPassword.email.subject');
    let template = Config.get('resetPassword.email.template');
    const emailData = {
        username: email,
        password: password
    };

    await mailer.send(template, email, subject, emailData);
    done();
};

export default (agenda: any) => {
    agenda.define('user.password-reset.email', passwordResetJob);
};
