const fs = require('fs').promises;
const path = require('path');

/**
 * Load a JSON file from disk and parse it.
 * @param {any} filePath
 * @returns {any}
 */
async function loadJson(fileName) {
    const filePath = path.join(__dirname, fileName);
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading or parsing ${fileName}:`, error);
        throw error;
    }
}

/**
 * Get the contacts for a user from the configuration files
 * @param {any} user
 * @returns {any}
 */
async function getContactsForUser(user) {
    try {
        const namesData = await loadJson('names.json');
        const topoData = await loadJson('topo.json');

        const userContactsLetters = topoData.config[user];

        if (!userContactsLetters) {
            throw new Error(`No contacts found for user '${user}' in topo.json.`);
        }

        const namesMap = namesData.config;

        const contacts = userContactsLetters.map(letter => {
            const email = namesMap[letter];
            if (!email) {
                throw new Error(`No email found for contact '${letter}' in names.json.`);
            }
            return email;
        });

        return contacts;
    } catch (error) {
        console.error('Error getting contacts for user:', error);
        return [];
    }
}

module.exports = {
    getContactsForUser
};