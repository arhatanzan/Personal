import fs from 'fs';
import path from 'path';

export const handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { password, data, commitMessage } = JSON.parse(event.body);
        const correctPassword = process.env.ADMIN_PASSWORD;

        if (password !== correctPassword) {
            return {
                statusCode: 401,
                body: JSON.stringify({ success: false, message: 'Unauthorized' })
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: 'Data saved (simulation)' })
        };

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: error.message })
        };
    }
};
