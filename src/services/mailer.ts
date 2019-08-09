'use strict';

const debug = require('debug')('mailer.service');
const Fs = require('fs');
const Path = require('path');
const Boom = require('boom');
const Util = require('util');
const Nodemailer = require('nodemailer');
const Handlebars = require('handlebars');
const ReadFile = Util.promisify(Fs.readFile);
const HtmlToText = require('html-to-text');
const SendGridTransport = require('nodemailer-sendgrid');
const Transporter = Nodemailer.createTransport(SendGridTransport({
    apiKey: process.env.SENDGRID_API_KEY
}));

const Templates = Path.resolve(__dirname, '../views', 'email-templates');

/**
 * filename: email template name, without ".html" file ending. Email templates are located within "server/email-templates"
 * options: data which will be used to replace the placeholders within the template
 **/
async function prepareTemplate(filename: any, options = {}) {
    try {
        const templatePath = Path.resolve(Templates, `${filename}.html`);
        const content = await ReadFile(templatePath, 'utf8');

        // use handlebars to render the email template
        // handlebars allows more complex templates with conditionals and nested objects, etc.
        // this way we have much more options to customize the templates based on given data
        const template = Handlebars.compile(content);
        const html = template(options);

        // generate a plain-text version of the same email
        const text = HtmlToText.fromString(html);

        return {
            html,
            text
        };
    } catch (error) {
        throw new Boom('Cannot read the email template content.');
    }
}

export const send = async (template: string, email: string, subject: string, data: any) => {
    const { html, text } = await prepareTemplate(template, data);

    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: subject,
        html,
        text
    };

    try {
        return await Transporter.sendMail(mailOptions);
    } catch (err) {
        debug(err);
        throw err;
    }
};

export default {
    send
};