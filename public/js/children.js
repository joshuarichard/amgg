/* eslint-env browser */
/* eslint no-undef: 0 */

$(document).ready(function () {
    var id = '';

    function pic(childClass) {
        // get the picture and load it in
        $.getJSON('/api/v1/pictures/' + id, function(res) {
            $(childClass).attr('src','data:image/image;base64,' + res.data);
        });
    }

    function data(slideNum) {
        // TODO: when dynamically generating HTML tonight from javascript,
        // need to make sure I add the child's _id to the id of the child-slide
        // element

        // get all unsponsored kids and pick one to display in the carousel
        $.getJSON('/api/v1/unsponsored', function(res) {
            if(res.err !== undefined) {
                callback(false);
            } else {
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

                    // now iterate over the res with an index (i) and match it
                    // to the random number.
                    var i = 0;
                    for (key in res) {
                        // if index === random number then pick this child
                        if (i === ran && res.hasOwnProperty(key)) {
                            id = key;
                            $('#child-name' + slideNum).text(res[id].nombre);
                            $('#child-age' + slideNum).text(res[id].años);
                            $('#child-gender' + slideNum).text(res[id].género);
                            $('#child-location' + slideNum).text(res[id].centro_de_ninos);
                            break;
                        } else {
                            i++;
                        }
                    }
                    pic('#child-picture' + slideNum);
                }
            }
        });
    }


    function insertChildIntoCarousel() {
        //loop through all the slides
        for (x=1; x <= $(".child-slide").length; x++) {
            data(x);
        }
    }

    insertChildIntoCarousel();

    $('#sponsor-button').click(function() {
        // TODO: need to fix sessionStorage by getting the ID from the
        // child-slide and putting it into sessionStorage

        if(sessionStorage.getItem('cart') === null ||
           sessionStorage.getItem('cart') === '') {
            sessionStorage.setItem('cart', id);
        } else {
            var existingStorage = sessionStorage.getItem('cart');
            sessionStorage.setItem('cart', existingStorage + ',' + id);
        }
    });
});
