export const handler = async (event, context) => {
    return {
        statusCode: 200,
        body: JSON.stringify({
            sessionTimeout: 30 // minutes
        })
    };
};
