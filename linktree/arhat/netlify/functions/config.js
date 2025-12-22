exports.handler = async function(event, context) {
    const timeout = process.env.SESSION_TIMEOUT || '30';
    
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ sessionTimeout: parseInt(timeout) })
    };
};
