const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const API_URL = 'https://tvending.khamvong.com/zdm8/reportClientLog';
// const API_URL = 'https://vendingserviceapi.laoapps.com/zdm8/reportClientLog';

const REQUEST_COUNT = 10000; // Number of requests to send
const LOG_DIR = process.env._log_path || './logs';
const LOG_FILE = path.join(LOG_DIR, 'api-performance.log');

// Request payload
const payload = {
    machineId: 'all',
    fromDate: '2025-04-09',
    toDate: '2025-05-21',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7InNpZ25hdHVyZSI6IjA0OTJkNzNmNzRiMDQ1NjMxNGYxNGQ0OGU2ZjBiOTQwOTcyMTBlNGI2MGI0ZDcyMWM4M2E0NDMxOGJjMjgwNTQ2MGI5ZDVmMThjMTc4ZDVhN2QxMzdkNmVjYTI5MmYwNDk2NzAyYzg3NzYzMTU3ZGVmMmE2ZDQxNGEyMDI5ZjRkMjAiLCJwaG9uZU51bWJlciI6Iis4NTYyMDc5OTc5OTk3IiwidXVpZCI6ImFlNmVmNDgwLTBlMTMtMTFmMC04YmViLTk1Y2JkNDYxMTBlOSIsImlwIjoiMTkyLjE2OC44OC44MSIsIm1hY2hpbmUiOiJ3aW5kb3dzIiwib3RoZXJpbmZvIjoibGFvYXBwLmNvbSIsImxvY2F0aW9uIjoidmllbnRpYW5lIn0sImlhdCI6MTc0NTk5NDQ0MCwiZXhwIjozNjAwMDAwMTc0NTk5NDQ0MH0.N-YA6V9dTMC02pROx6DmiPqXR9TIAGoaE0MyuwExO8Y'
};

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
    try {
        fs.mkdirSync(LOG_DIR, { recursive: true });
    } catch (err) {
        console.error('Failed to create log directory:', err);
        process.exit(1);
    }
}

// Function to log messages to file
function logToFile(message) {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(LOG_FILE, `[${timestamp}] ${message}\n`, (err) => {
        if (err) console.error('Failed to write to log file:', err);
    });
}

// Function to send a single POST request and measure latency
async function sendRequest() {
    const startTime = process.hrtime.bigint();
    try {
        const response = await axios.post(API_URL, payload, {
            headers: { 'Content-Type': 'application/json' }
        });
        const endTime = process.hrtime.bigint();
        const latency = Number(endTime - startTime) / 1e6; // Convert to milliseconds
        return { status: response.status, latency };
    } catch (error) {
        const endTime = process.hrtime.bigint();
        const latency = Number(endTime - startTime) / 1e6;
        logToFile(`Request failed: ${error.message}, Latency: ${latency} ms`);
        return { status: error.response?.status || 'N/A', latency, error: error.message };
    }
}

// Main function to run performance test
async function runPerformanceTest() {
    console.log(`Starting performance test for ${REQUEST_COUNT} concurrent requests to ${API_URL}`);

    logToFile(`Starting test with ${REQUEST_COUNT} concurrent requests`);
    const promises = Array(REQUEST_COUNT).fill().map(() => sendRequest());
    const results = await Promise.all(promises);


    // Calculate statistics
    const latencies = results.map(r => r.latency).filter(l => !isNaN(l));
    const avgLatency = latencies.reduce((sum, l) => sum + l, 0) / latencies.length;
    const minLatency = Math.min(...latencies);
    const maxLatency = Math.max(...latencies);
    const successCount = results.filter(r => r.status === 200).length;
    const failureCount = REQUEST_COUNT - successCount;

    // Log results
    const summary = `
Test Summary:
- Total Requests: ${REQUEST_COUNT}
- Successful Requests: ${successCount}
- Failed Requests: ${failureCount}
- Average Latency: ${avgLatency.toFixed(2)} ms
- Min Latency: ${minLatency.toFixed(2)} ms
- Max Latency: ${maxLatency.toFixed(2)} ms
`;
    console.log(summary);
    logToFile(summary);
}

// Run the test
runPerformanceTest().catch(err => {
    console.error('Test failed:', err);
    logToFile(`Test failed: ${err.message}`);
});