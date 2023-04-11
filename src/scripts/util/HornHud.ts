/**
 * Utility class to assist in interacting with/gathering info on the horn in the HUD
 * This class can only be uses from contexts that have access to DOM.
 */
export class HornHud {
    // This class was crafting by looking through app.js in the mousehunt source code

    /**
     * Get the horn timer text.
     * @returns 'Ready' if the horn is ready or the timer if not ready. Null if the user is logged out.
     */
    public static getTimerText(): 'Ready' | string | null {
        // The ready text is held in a different node
        if (this.canSoundHorn()) {
            return 'Ready';
        }

        return this.getHornContainer()?.querySelector<HTMLElement>('.huntersHornView__countdown')?.textContent ?? null;
    }

    /**
     * Check if the horn can be sounded if it's ready and not currently animated
     */
    public static canSoundHorn() {
        return this.isHornReady() && !this.isHornSounding();
    }

    /**
     * Check if there is a reward puzzle message active
     */
    public static isPuzzleActive() {
        return this.getMessageTitle() === 'You have a King\'s Reward!'
    }

    /**
     * Sound the horn by simulating a mouse events on the horn DOM
     */
    public static async soundHorn() {
        if (!this.canSoundHorn()) {
            return;
        }

        // Body event via 'h'
        // document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'h' }));

        // or simulate click?
        const hornDOM = this.getHornDOM();
        if (hornDOM === null) {
            return;
        }

        // It must be done this way now. The 'click' event is specificly set to do nothing on the horn.
        // app.js defines that the 'mousedown' starts animation followed by 'mouseup' to end animation
        // and to take an active turn
        hornDOM.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        await new Promise(r => setTimeout(r, 250));
        hornDOM.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

        return;
    }

    private static getHornContainer() {
        return document.querySelector<HTMLElement>('.huntersHornView')
    }

    private static getHornDOM() {
        return this.getHornContainer()?.querySelector<HTMLElement>('.huntersHornView__horn') ?? null;
    }

    private static getMessageDOM() {
        return this.getHornContainer()?.querySelector<HTMLElement>('.huntersHornView__message') ?? null;
    }

    /**
     * Gets the current hunter's horn message title
     * @returns The title, or null if a message is not active
     */
    private static getMessageTitle() {
        // Should only return title if the message is actively displaying to user
        if (this.isMessageActive()) {
            return this.getMessageDOM()?.querySelector<HTMLElement>('.huntersHornView__messageTitle')?.textContent ?? null;
        }

        return null;
    }

    private static getTimerDOM() {
        return this.getHornContainer()?.querySelector<HTMLElement>('.huntersHornView__timer') ?? null;
    }

    /**
     * Check if the horn is in the ready state
     */
    private static isHornReady() {
        return this.getTimerDOM()?.classList.contains('ready') ?? false;
    }

    /**
     * Check if the horn is in the progress of sounding (animating)
     */
    private static isHornSounding() {
        return this.getHornDOM()?.classList.contains('huntersHornView__horn--sounding') ?? false;
    }

    /**
     * Check if a message is showing in the horn area
     */
    private static isMessageActive() {
        const messageDOM = this.getMessageDOM();
        if (messageDOM === null) {
            return false;
        }

        return messageDOM.classList.contains('huntersHornView__message--active');
    }
}
