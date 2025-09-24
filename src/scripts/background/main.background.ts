import {ConsoleLogger} from "@scripts/services/logging";
import RuntimeBackground from "./runtime.background";

export default class MainBackground {
    logger: ConsoleLogger;
    runtimeBackground: RuntimeBackground;

    constructor() {
        const isDev = process.env.ENV === "development";

        this.logger = new ConsoleLogger(isDev);
        this.runtimeBackground = new RuntimeBackground(this.logger);
    }

    async bootstrap() {
        this.logger.info("Bootstrapping background service...");

        await this.runtimeBackground.init();
    }
}
