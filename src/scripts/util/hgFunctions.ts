/* eslint-disable @typescript-eslint/ban-ts-comment */

export async function getItemsByClass(itemClassifications: string[], forceRefresh = false): Promise<{
    name: string,
    item_id: number
}[]> {
    return await new Promise((resolve, reject) => {
        // @ts-ignore
        return hg.utils.UserInventory.getItemsByClass(itemClassifications, forceRefresh, resolve, reject);
    });
}
