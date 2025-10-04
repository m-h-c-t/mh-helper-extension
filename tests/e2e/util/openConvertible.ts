import qs from 'qs';

export const openConvertible = (item_type: string, quantity: number) => {
    return fetch('https://www.mousehuntgame.com/managers/ajax/users/useconvertible.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        },
        body: qs.stringify({
            sn: 'Hitgrab',
            hg_is_ajax: '1',
            item_type: item_type,
            quantity: `${quantity}`,
            uh: 'hashbrowns'
        })
    });
};
