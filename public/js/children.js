/* eslint-env browser */
/* eslint no-undef: 0 */

$(document).ready(function () {
    var ids = [];
    $.getJSON('/api/v1/unsponsored', function(res) {
        for (var key in res) {
            ids.push(key);
        }
    });

    $('.child-picture').click(function() {
        sessionStorage.child_id = ids[Math.floor(Math.random() * ids.length)];
    });
});
