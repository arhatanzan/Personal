exports.handler = async function(event, context) {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const { ADMIN_PASSWORD } = process.env;
        const { password } = JSON.parse(event.body);

        if (!ADMIN_PASSWORD) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "ADMIN_PASSWORD not set in environment variables" })
            };
        }

        if (password === ADMIN_PASSWORD) {
            return {
                statusCode: 200,
                body: JSON.stringify({ message: "Authenticated" })
            };
        } else {
            return {
                statusCode: 401,
                body: JSON.stringify({ error: "Invalid password" })
            };
        }
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Server Error" })
        };
    }
};
