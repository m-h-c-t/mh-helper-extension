import qs from 'qs';

export const soundHorn = () => {
    // fetches must be correctly formed as if they came from ajax (www-form-urlencoded)
    // so that the interceptor.service picks them up.
    return fetch('https://www.mousehuntgame.com/managers/ajax/turns/activeturn.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        },
        body: qs.stringify({
            sn: 'Hitgrab',
            hg_is_ajax: '1',
            last_read_journal_entry_id: '1337',
            uh: 'hashbrowns'
        })
    });
};
