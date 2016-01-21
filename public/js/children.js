/* eslint-env browser */
/* eslint no-undef: 0 */

$(document).ready(function () {
    var id = '';
    
    function pic() {
        // get the picture and load it in
        $.ajax({
            type: 'GET',
            url: '/api/v1/pictures/' + id,
            beforeSend: function (xhr) {
                xhr.overrideMimeType('text/plain; charset=x-user-defined');
            },
            success: function (result, textStatus, jqXHR) {
                var data = jqXHR.responseText;
                $('#child-picture').attr('src','data:image/image;base64,'+data);
            }
        });
    }

    function data(callback) {
        // get all unsponsored kids and pick one to display in the carousel
        $.getJSON('/api/v1/unsponsored', function(res) {

            //loop through all the slides
            for (x=1; x <= $(".child-slide").length; x++) {

                // calculate the resLength for random child bounds
                var key, resLength = 0;
                for(key in res) {
                    if(res.hasOwnProperty(key)) {
                        resLength++;
                    }
                }

                // use the resLength to randomly pick one of the unsponsored
                // children within the bounds
                var ran = Math.floor(Math.random() * (resLength - 1) + 1);

                // now iterate over the res with an index (i) and match it to the
                // random number.
                var i = 0;
                for (key in res) {
                    // if index === random number then pick this child
                    if (i === ran && res.hasOwnProperty(key)) {
                        id = key;
                        console.log('child-name' + x);
                        document.getElementById('child-name' + x).innerHTML = res[id].nombre;
                        console.log('child-name' + x);
                        document.getElementById('child-age' + x).innerHTML = res[id].años;
                        console.log('child-age' + x);
                        document.getElementById('child-gender' + x).innerHTML = res[id].género;
                        console.log('child-gender' + x);
                        document.getElementById('child-location' + x).innerHTML = res[id].centro_de_ninos;
                        console.log('child-location' + x);
                        break;
                    } else {
                        i++;
                    }
                }
                callback();
            }

        });
    }    
    

    function insertChildIntoCarousel() {
        data(function() {
            pic();
        });
    }

    insertChildIntoCarousel();

    $('#sponsor-button').click(function() {
        if(sessionStorage.getItem('cart') === null ||
           sessionStorage.getItem('cart') === '') {
            sessionStorage.setItem('cart', id);
        } else {
            var existingStorage = sessionStorage.getItem('cart');
            sessionStorage.setItem('cart', existingStorage + ',' + id);
        }
    });
});
