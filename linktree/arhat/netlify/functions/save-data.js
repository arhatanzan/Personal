exports.handler = async function(event, context) {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const { GITHUB_TOKEN, REPO_OWNER, REPO_NAME, ADMIN_PASSWORD } = process.env;

        if (!GITHUB_TOKEN || !REPO_OWNER || !REPO_NAME) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "Missing environment variables on Netlify (GITHUB_TOKEN, REPO_OWNER, REPO_NAME)" })
            };
        }

        const body = JSON.parse(event.body);
        
        // Check for password if ADMIN_PASSWORD is set
        if (ADMIN_PASSWORD && body.password !== ADMIN_PASSWORD) {
             return {
                statusCode: 401,
                body: JSON.stringify({ error: "Unauthorized: Invalid Password" })
            };
        }

        const newData = body.data;
        if (!newData) {
             return {
                statusCode: 400,
                body: JSON.stringify({ error: "Missing data payload" })
            };
        }

        const commitMessage = body.message || "content: update site data via admin panel";

        // Helper to update file
        const updateFile = async (path, content, message, sha = null) => {
            const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
            
            if (!sha) {
                const getResponse = await fetch(apiUrl, {
                    headers: {
                        "Authorization": `Bearer ${GITHUB_TOKEN}`,
                        "Accept": "application/vnd.github.v3+json"
                    }
                });
                if (!getResponse.ok) throw new Error(`GitHub API Error (Get ${path}): ${getResponse.statusText}`);
                const fileData = await getResponse.json();
                sha = fileData.sha;
            }

            const putResponse = await fetch(apiUrl, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${GITHUB_TOKEN}`,
                    "Accept": "application/vnd.github.v3+json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    message: message,
                    content: Buffer.from(content).toString('base64'),
                    sha: sha
                })
            });

            if (!putResponse.ok) throw new Error(`GitHub API Error (Put ${path}): ${putResponse.statusText}`);
        };

        // 1. Update data.json
        const fileContent = JSON.stringify(newData, null, 4);
        const dataFilePath = "linktree/arhat/public/data.json"; 
        await updateFile(dataFilePath, fileContent, commitMessage);

        // 2. Update changelog.html
        try {
            const changelogPath = "linktree/arhat/public/admin/changelog.html";
            const changelogApiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${changelogPath}`;
            
            const getChangelogResponse = await fetch(changelogApiUrl, {
                headers: {
                    "Authorization": `Bearer ${GITHUB_TOKEN}`,
                    "Accept": "application/vnd.github.v3+json"
                }
            });

            if (getChangelogResponse.ok) {
                const changelogData = await getChangelogResponse.json();
                let changelogContent = Buffer.from(changelogData.content, 'base64').toString('utf-8');
                
                const now = new Date();
                const dateStr = now.toLocaleDateString('en-US', { timeZone: 'UTC' });
                const timeStr = now.toLocaleTimeString('en-US', { timeZone: 'UTC' });
                
                const newEntry = `
                            <tr>
                                <td>${dateStr}</td>
                                <td>${timeStr}</td>
                                <td>${commitMessage}</td>
                            </tr>`;
                
                if (changelogContent.includes('<!-- CHANGELOG_START -->')) {
                    changelogContent = changelogContent.replace('<!-- CHANGELOG_START -->', '<!-- CHANGELOG_START -->' + newEntry);
                    await updateFile(changelogPath, changelogContent, "chore: update changelog", changelogData.sha);
                }
            }
        } catch (e) {
            console.error("Failed to update changelog:", e);
            // Don't fail the whole request if changelog update fails
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
