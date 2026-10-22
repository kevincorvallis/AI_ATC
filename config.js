// Controller replies and practice feedback run locally, with no paid API or key.
// Optional browser speech recognition may use the browser vendor's service.
// Live mode is an explicit operator configuration. Use an authenticated HTTPS API.
const ATC_CONFIG = Object.freeze({
    mode: 'demo',
    apiEndpoint: '',
    requestTimeoutMs: 15000
});
