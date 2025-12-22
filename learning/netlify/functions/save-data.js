exports.handler = async function(event, context) {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const { GITHUB_TOKEN, REPO_OWNER, REPO_NAME } = process.env;

        if (!GITHUB_TOKEN || !REPO_OWNER || !REPO_NAME) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "Missing environment variables on Netlify (GITHUB_TOKEN, REPO_OWNER, REPO_NAME)" })
            };
        }

        const newData = JSON.parse(event.body);
        const fileContent = `const siteData = ${JSON.stringify(newData, null, 4)};`;
        // IMPORTANT: Update this path if your repo structure changes
        const filePath = "learning/public/assets/js/data.js"; 
        const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`;

        // 1. Get the current file to get its SHA (required for updates)
        const getResponse = await fetch(apiUrl, {
            headers: {
                "Authorization": `Bearer ${GITHUB_TOKEN}`,
                "Accept": "application/vnd.github.v3+json"
            }
        });

        if (!getResponse.ok) {
            throw new Error(`GitHub API Error (Get): ${getResponse.statusText}`);
        }

        const fileData = await getResponse.json();
        const sha = fileData.sha;

        // 2. Commit the update
        const putResponse = await fetch(apiUrl, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${GITHUB_TOKEN}`,
                "Accept": "application/vnd.github.v3+json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: "content: update site data via admin panel",
                content: Buffer.from(fileContent).toString('base64'),
                sha: sha
            })
        });

        if (!putResponse.ok) {
            throw new Error(`GitHub API Error (Put): ${putResponse.statusText}`);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: "Updated successfully! Site is rebuilding..." })
        };

    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
