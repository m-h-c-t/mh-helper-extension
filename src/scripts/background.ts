import MainBackground from './background/main.background';
import { ConsoleLogger } from './services/logging';

const logger = new ConsoleLogger(false);
const mhctMain = new MainBackground();
mhctMain.bootstrap().then(startHeartbeat)
    .catch(error => logger.error(error));

async function runHeartbeat() {
    await chrome.runtime.getPlatformInfo();
}

/**
 * Starts the heartbeat interval which keeps the service worker alive.
 */
async function startHeartbeat() {
    await runHeartbeat();
    setInterval(() => { void runHeartbeat(); }, 20 * 1000);
}
