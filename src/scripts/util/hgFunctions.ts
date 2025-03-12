/* eslint-disable @typescript-eslint/ban-ts-comment */

export async function getItemsByClass(itemClassifications: string[], forceRefresh = false): Promise<{
    name: string,
    item_id: number
}[]> {
    return await new Promise((resolve, reject) => {
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        return hg.utils.UserInventory.getItemsByClass(itemClassifications, forceRefresh, resolve, reject);
    });
}
