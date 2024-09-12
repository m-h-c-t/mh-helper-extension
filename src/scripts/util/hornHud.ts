/**
 * Utility class to assist in interacting with/gathering info on the horn in the HUD
 * This class can only be uses from contexts that have access to DOM.
 */
export class HornHud {
    private static messageQueue: { message: string, type: 'success' | 'warning' | 'error' }[] = [];
    private static isProcessingQueue = false;

    public static async showMessage(
        message: string,
        type: 'success' | 'warning' | 'error' = 'success'
    ) {
        this.messageQueue.push({message, type});

        if (!this.isProcessingQueue) {
            await this.processQueue();
        }
    }

    private static async processQueue() {
        this.isProcessingQueue = true;

        while (this.messageQueue.length > 0) {
            const {message, type} = this.messageQueue.shift()!;
            await this.displayMessage(message, type);
        }

        this.isProcessingQueue = false;
    }

    private static async displayMessage(
        message: string,
        type: 'success' | 'warning' | 'error'
    ) {
        const messageDom = this.getMessageDOM();
        if (messageDom === null) {
            return;
        }

        const messageTitle = 'MHCT';
        const duration = 2000 + 2000 * (type !== 'success' ? 1 : 0);

        // if there is already a message active, we'll restore it later
        const hasPreviousMessage = this.isMessageActive();
        const previousMessage = messageDom.innerHTML;

        const messageView = document.createElement('div');
        messageView.classList.add(
            'huntersHornMessageView',
            `huntersHornMessageView--mhct_${type}`
        );

        const title = document.createElement('div');
        title.classList.add('huntersHornMessageView__title');
        title.textContent = messageTitle;
        messageView.appendChild(title);

        const content = document.createElement('div');
        content.classList.add('huntersHornMessageView__content');
        const text = document.createElement('div');
        text.classList.add('huntersHornMessageView__text');
        text.textContent = message;
        content.appendChild(text);
        messageView.appendChild(content);

        const countdown = document.createElement('button');
        countdown.classList.add('huntersHornMessageView__countdown');
        countdown.innerHTML = `
            <div class="huntersHornMessageView__countdownButtonImage"></div>
            <svg class="huntersHornMessageView__countdownSVG">
                <circle r="46%" cx="50%" cy="50%" class="huntersHornMessageView__countdownCircleTrack"></circle>
                <circle r="46%" cx="50%" cy="50%" class="huntersHornMessageView__countdownCircle" style="animation-duration: ${duration}ms;"></circle>
            </svg>
        `;

        const removeMessage = async () => {
            countdown.classList.add(
                'huntersHornMessageView__countdown--complete'
            );
            messageDom.classList.remove('huntersHornView__message--active');

            if (hasPreviousMessage) {
                await new Promise((r) => setTimeout(r, 300));
                messageDom.innerHTML = previousMessage;
                messageDom.classList.add('huntersHornView__message--active');
            }
        };

        countdown.addEventListener('click', removeMessage);
        messageView.appendChild(countdown);

        // Allow previous message to animate out before replacing
        if (hasPreviousMessage) {
            messageDom.classList.remove('huntersHornView__message--active');
            await new Promise((r) => setTimeout(r, 300));
        }

        messageDom.replaceChildren(messageView);
        messageDom.classList.add('huntersHornView__message--active');

        await new Promise((r) => setTimeout(r, duration));
        await removeMessage();
    }

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
        return !this.isMessageActive() && this.isHornReady() && !this.isHornSounding();
    }

    /**
     * Check if there is a reward puzzle message active
     */
    public static isPuzzleActive() {
        return this.getMessageTitle() === 'You have a King\'s Reward!';
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
        hornDOM.dispatchEvent(new MouseEvent('mousedown', {bubbles: true}));
        await new Promise(r => setTimeout(r, 250));
        hornDOM.dispatchEvent(new MouseEvent('mouseup', {bubbles: true}));

        return;
    }

    private static getHornContainer() {
        return document.querySelector<HTMLElement>('.huntersHornView');
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
            return this.getMessageDOM()?.querySelector<HTMLElement>('.huntersHornMessageView__title')?.textContent ?? null;
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
