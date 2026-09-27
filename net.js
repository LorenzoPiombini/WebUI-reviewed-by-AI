/* All API calls stay on this company's origin, including its HTTPS port. */
export async function send(payload, method, resource) {
    try {
        if (!['GET', 'POST'].includes(method)) throw new Error('Unsupported request method');
        if (method === 'POST' && payload == null) throw new Error('Missing request body');
        if (typeof resource !== 'string' || !resource || /[\\\\?#]/.test(resource) ||
            resource.startsWith('/') || /^[a-z][a-z0-9+.-]*:/i.test(resource)) {
            throw new Error('Invalid API resource');
        }
        const url = new URL('/' + resource, window.location.origin);
        if (url.origin !== window.location.origin) throw new Error('Invalid API origin');
        const options = { method, credentials: 'same-origin', redirect: 'error' };
        if (method === 'POST') {
            options.headers = { 'Content-Type': 'application/json' };
            options.body = payload;
        }
        const response = await fetch(new Request(url, options));
        if (!response.ok) {
            return { success: false, status: response.status,
                message: `Request failed (HTTP ${response.status}). Your changes have not been cleared.` };
        }
        const data = await response.json();
        if (data === null) throw new Error('Empty API response');
        return { success: true, status: response.status,
            message: Object.hasOwn(data, 'message') ? data.message : data };
    } catch (err) {
        // A lost response does not prove a POST failed: never automatically retry it.
        return { success: false, status: 0,
            message: `Request could not be confirmed: ${err.message}. Check the saved record before retrying.` };
    }
}
export default send;
