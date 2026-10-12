
async function checkThreatIntel(url) {
    const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;

    if (!apiKey) {
        return {
            available: false,
            checked: false,
            threats: [],
            message: 'Threat intelligence is not configured.'
        };
    }

    const endpoint =
        'https://safebrowsing.googleapis.com/v4/threatMatches:find' +
        `?key=${encodeURIComponent(apiKey)}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
                client: {
                    clientId: 'safelinker',
                    clientVersion: '1.0.0'
                },
                threatInfo: {
                    threatTypes: [
                        'MALWARE',
                        'SOCIAL_ENGINEERING',
                        'UNWANTED_SOFTWARE',
                        'POTENTIALLY_HARMFUL_APPLICATION'
                    ],
                    platformTypes: ['ANY_PLATFORM'],
                    threatEntryTypes: ['URL'],
                    threatEntries: [{ url }]
                }
            })
        });

        if (!response.ok) {
            return {
                available: true,
                checked: false,
                threats: [],
                message: 'Threat intelligence service returned an error.'
            };
        }

        const data = await response.json();
        const threats = (data.matches || []).map(match => ({
            type: match.threatType,
            platform: match.platformType
        }));

        return {
            available: true,
            checked: true,
            threats,
            message: threats.length
                ? 'A known threat was found.'
                : 'No matching threat was returned by the service.'
        };
    } catch {
        return {
            available: true,
            checked: false,
            threats: [],
            message: 'Threat intelligence service is unavailable.'
        };
    } finally {
        clearTimeout(timeout);
    }
}

module.exports = { checkThreatIntel };
