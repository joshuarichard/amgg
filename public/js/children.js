/* eslint-env browser */
/* eslint no-undef: 0 */

$(document).ready(function () {
    // load all unsponsored kids into a demo array
    // and put one randomly in checkout.html
    var ids = [], i = 0;
    $.getJSON('/api/v1/unsponsored', function(res) {
        for (var key in res) {
            if(i < 3) {
                console.log('pushing ' + key);
                ids.push(key);
            }
            i++;
        }
    });

    $('.child-picture').click(function() {
        localStorage['children'] = ids.toString();
        console.log(localStorage['children']);
    });
});
