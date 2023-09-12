/**
 * Record Mini Prize Pack convertible submissions as convertibles in MHCT
 * @param {JQuery.jqXHR} xhr jQuery-wrapped XMLHttpRequest object encapsulating the http request to the remote server (HG).
 */
export function recordPrizePack(xhr, logger, submitConvertible) {
    if (
        !xhr.responseJSON?.kings_giveaway_result ||
        !xhr.responseJSON.inventory || !xhr.responseJSON.kings_giveaway_result.quantity ||
        xhr.responseJSON.kings_giveaway_result.slot !== "bonus"
    ) {
        logger.debug('Skipped mini prize pack submission due to unhandled XHR structure. This is probably fine.');
        window.postMessage({
            "mhct_log_request": 1,
            "is_error": true,
            "kga_2021_response": xhr.responseJSON,
            "reason": "Unable to parse kga 2021 response. This is normal if a pack wasn't opened",
        }, window.origin);
        return;
    }
    const result = xhr.responseJSON.kings_giveaway_result;
    const inventory = xhr.responseJSON.inventory;

    const convertible = {
        name: "King's Mini Prize Pack",
        id: 130008,
        quantity: result.quantity,
    };

    const item_map = {
        "gold_stat_item": 431,
    };

    const items = [];
    result.items.forEach(item => {
        const i = {
            "type": item.type,
            "quantity": parseInt((item.quantity + ",").replace(/,/g, ""), 10),
        };
        if (item.type in inventory && inventory[item.type].item_id) {
            i.id = inventory[item.type].item_id;
        }
        else if (item.type in item_map) {
            i.id = item_map[item.type];
        }
        items.push(i);
    });

    logger.debug("Prizepack: ", {convertible, items});
    submitConvertible(convertible, items);
}
