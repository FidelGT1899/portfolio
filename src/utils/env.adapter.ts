import 'dotenv/config';
import env from 'env-var';
const { get } = env;


export const envs = {
    // MAILER_SERVICE: get('MAILER_SERVICE').required().asString(),
    MAILER_TO: get('MAILER_TO').required().asEmailString(),
    MAILER_SECRET_KEY: get('MAILER_SECRET_KEY').asString(),
    SMTP_HOST: get('SMTP_HOST').required().asString(),
    SMTP_PORT: get('SMTP_PORT').required().asIntPositive(),
    SMTP_USER: get('SMTP_USER').required().asString(),
    SMTP_PASS: get('SMTP_PASS').required().asString(),
}



