/* eslint-env browser */
/* eslint no-undef: 0 */

$(document).ready(function() {
    // global variable to keep track of the kids in the carousel
    var childrenCurrentlyInSlider = [];

    // fill the child pool based on a given selector
    function fillChildPool(selector, callback) {
        var ors = [{
            '$or': [{'status': 'Waiting for Sponsor - No Prior Sponsor'},
                               {'status': 'Waiting for Sponsor - Discontinued'},
                               {'status': 'Additional Sponsor Needed'}]
        }];

        selector['$and'] = ors;

        // get all unsponsored kids and pick one to display in the carousel
        $.getJSON('/api/v1/children/find/' + JSON.stringify(selector),
            function(res){
                if(res.err !== undefined) {
                    // TODO: fix error on connection
                    callback();
                } else if (JSON.stringify(res) === '{}') {
                    callback({'err': 'no children match that selector'});
                } else {
                    childPool = res;
                    callback(childPool);
                }
            });
    }

    /* get a child from the child pool. returns the child as a json object that
     * looks like this.
     * {
     *    id: string,
     *    name: string,
     *    age: int,
     *    gender: string,
     *    location: string,
     *    picture: base64 string
     * }
     */
    function getChild(childPool, callback) {
        // get an array of child ids by mapping the keys in the child pool
        // to an array called 'ids'
        var ids = $.map(childPool, function (value, key) {
            return key;
        });

        // randomly pick one of those ids
        var id = ids[Math.floor(Math.random() * ids.length)];

        // init the cart as an array from sessionStorage
        var cart = [];
        if (sessionStorage.getItem('cart') != null &&
            sessionStorage.getItem('cart') != '') {
            cart = sessionStorage.getItem('cart').split(',');
        }

        // if the child isn't in the cart and also isn't in the slider
        if (cart.indexOf(id) === -1 &&
            childrenCurrentlyInSlider.indexOf(id) === -1) {

            // then add the child to the slider
            var name = childPool[id].nombre;
            var age = childPool[id].años;
            var gender = childPool[id].género;
            var location = childPool[id].provincia;

            // get the picture and load it in
            $.getJSON('/api/v1/pictures/id/' + id, function(res) {
                var child = {
                    'id': id,
                    'name': name,
                    'age': age,
                    'gender': gender,
                    'location': location,
                    'picture': res.data
                };
                childrenCurrentlyInSlider.push(id);
                callback(child);
            });
        } else {
             // if the child is already in the slider or cart but there
             // are more children in the child pool
            if (childrenCurrentlyInSlider.length !== ids.length &&
               childrenCurrentlyInSlider.length < ids.length &&
               cart.indexOf(id) === -1) {
                getChild(childPool, function(child) {
                    callback(child);
                });
            } else {
                callback({'err': 'no more children available.'});
            }
        }
    }

    /* build the html for a slide to insert into the carousel. takes one child
     * object in the form:
     *
     * {
     *    id: string,
     *    name: string,
     *    age: int,
     *    gender: string,
     *    location: string,
     *    picture: base64 string
     * }
     */
    function buildHTMLforSlide(child, callback) {
        // assign all of the data gathered from the api to variables
        var id = child.id;
        var name = child.name;
        var age = child.age;
        var gender = child.gender;
        var location = child.location;
        var picture = child.picture;

        // create the slide
        var slide = document.createElement('div');
        slide.className = 'child-slide';
        slide.id = id;

        // create the picture element
        var divImg = document.createElement('div');
        divImg.className = 'col-xs-4';
        var img = document.createElement('img');
        img.id = 'child-picture';
        img.className = 'img-responsive center-block child-picture';
        img.src = 'data:image/image;base64,' + picture;
        img.alt = 'foto de niño';
        img.title = 'foto de niño';
        divImg.appendChild(img);
        slide.appendChild(divImg);

        // create the description element
        // note: need to disable eslint because of html strings
        /* eslint-disable */
        var divData = document.createElement('div');
        divData.className = 'col-xs-6';
        var hData = document.createElement('h1');
        hData.innerHTML = 'Hola, me llamo <span id =\"child-name\">' + name + '</span>!';
        divData.appendChild(hData);
        var divDescription = document.createElement('div');
        divDescription.className = 'child-description';
        var pData1 = document.createElement('p');
        pData1.className = 'lead';
        pData1.innerHTML = 'I\'m a <span id=\"child-age\">' + age + '</span>-year-old <span id=\"child-gender\">' + gender + '</span> from <span id=\"child-location\">' + location + '</span>, and you can change my world for good!';
        var pData2 = document.createElement('p');
        pData2.innerHTML = 'Make me part of your family, and help me reach my God-given potential. $<span id=\"child-cost\">39</span> a month can help transform my community and change my world.';
        divDescription.appendChild(pData1);
        divDescription.appendChild(pData2);
        divData.appendChild(divDescription);
        var sponsorButton = document.createElement('a');
        sponsorButton.id = 'sponsor-button';
        sponsorButton.className = 'btn btn-primary btn-lg child-intro-btn-sponsor sponsor-button';
        sponsorButton.href = 'checkout.html';
        sponsorButton.innerHTML = 'Conviértase Mi Patrocinador';

        // add the function for the sponsor button. clicking this should add
        // the child's id from the parent-most div into sessionStorage
        sponsorButton.onclick = function() {
            if(sessionStorage.getItem('cart') === null ||
               sessionStorage.getItem('cart') === '') {
                sessionStorage.setItem('cart', this.parentNode.parentNode.id);
            } else {
                var existingStorage = sessionStorage.getItem('cart');
                sessionStorage.setItem('cart', existingStorage + ',' + this.parentNode.parentNode.id);
            }
        };
        divData.appendChild(sponsorButton);
        slide.appendChild(divData);
        /* eslint-enable*/

        $('#slides').append(slide);
        callback(slide);
    }

    // add a slide to the carousel given slide html
    function addSlide(slide) {
        // remove the pending spinner
        $('.spinner').remove();

        // create the item div
        var item = document.createElement('div');
        item.className = 'item';
        item.appendChild(slide);

        // add the item to the carousel
        owl.data('owlCarousel').addItem(item);
    }

    /* insertChild()
     * 4 step process for adding a child
     * ---------------------------------
     * 1. fill the child pool based on a selector  - fillChildPool()
     * 2. select a child from that pool            - getChild()
     * 3. build the html for that child            - buildHTMLforSlide()
     * 4. add the html to the slider               - addSlide()
     */
    function insertChild(selector, callback) {
        fillChildPool(selector, function(childPool) {
            // if the child pool is empty, return false
            if (childPool.hasOwnProperty('err')) {
                alert('no hay niños de la búsqueda');
                callback({success: false});
            } else {
                getChild(childPool, function(child) {
                    // if there's an err in the response that means the child is
                    // in the cart but there are no more children to display
                    if (child.hasOwnProperty('err')) {
                        alert('no hay niños de la búsqueda');
                        callback({success: false});
                    } else {
                        buildHTMLforSlide(child, function(slide) {
                            addSlide(slide);
                            callback({success: true});
                        });
                    }
                });
            }
        });
    }

    // checks the search panel for queries
    function checkSearchPanel() {
        var selector = {};
        if($('#genderSearch').text() !== 'género') {
            selector['género'] = $('#genderSearch').text();
        }
        if($('#locationSearch').text() !== 'provincia') {
            selector['provincia'] = $('#locationSearch').text();
        }
        if($('#ageSearch').text() !== 'años') {
            selector['años'] = $('#ageSearch').text();
        }
        if($('#birthmonthSearch').text() !== 'mes de nacimiento') {
            var month = $('#birthmonthSearch').text();
            var months = {
                             'enero': '0',
                             'febrero': '1',
                             'marzo': '2',
                             'abril': '3',
                             'mayo': '4',
                             'junio': '5',
                             'julio': '6',
                             'agosto': '7',
                             'septiembre': '8',
                             'octubre': '9',
                             'noviembre': '10',
                             'diciembre': '11'
                         };
             if (months.hasOwnProperty(month)) {
                 var monthInt = months[month];
                 selector['mes_de_nacimiento'] = monthInt;
             }
        }
        if($('#birthdaySearch').text() !== 'día del nacimiento') {
            selector['día_del_nacimiento'] = $('#birthdaySearch').text();
        }

        return selector;
    }

    // add carousel functionality
    var owl = $('.owl-carousel');
    owl.owlCarousel({
        navigation : false,
        slideSpeed : 800,
        paginationSpeed : 800,
        autoWidth: true,
        singleItem: true
    });

    // custom previous and next buttons
    $('#prev-button').click(function() {
        owl.trigger('owl.prev');
    });
    $('#next-button').click(function() {
        owl.trigger('owl.next');
    });

    // initially load a child onto the page
    insertChild({}, function() {
        console.log('initially loaded one child.');
    });

    // add a child to the slide button
    $('#add-button').click(function() {
        var selector = checkSearchPanel();

        insertChild(selector, function(res) {
            if (res.success === true) {
                console.log('inserted child.');
            } else {
                console.log('did not insert a child.');
            }
        });
    });

    /**
     * find a child panel
     */
    $('#search-button').click(function() {
        var selector = checkSearchPanel();

        // empty the owl carousel (minus the last slide...)
        while (owl.data('owlCarousel').owl.owlItems.length !== 1) {
            owl.data('owlCarousel').removeItem();
        }
        // owl doesn't delete the last slide for some reason, so do it manually
        if (owl.data('owlCarousel').owl.owlItems.length === 1) {
            owl.data('owlCarousel').removeItem();
        }

        // recreate pending spinner and add to page
        spinnerDiv = document.createElement('div');
        bounceDiv1 = document.createElement('div');
        bounceDiv2 = document.createElement('div');
        bounceDiv3 = document.createElement('div');

        spinnerDiv.className = 'spinner';
        bounceDiv1.className = 'bounce1';
        bounceDiv2.className = 'bounce2';
        bounceDiv3.className = 'bounce3';

        spinnerDiv.appendChild(bounceDiv1);
        spinnerDiv.appendChild(bounceDiv2);
        spinnerDiv.appendChild(bounceDiv3);

        var container = document.getElementById('spinner-and-slider');
        container.insertBefore(spinnerDiv, container.childNodes[0]);

        // empty the array that keeps track of the children in the slider
        childrenCurrentlyInSlider = [];

        console.log(childPool);

        // insert a child matching the selector
        insertChild(selector, function(res) {
            if (res.success === true) {
                console.log('inserted search child.');
            } else {
                owl.owlCarousel({
                    navigation : false,
                    slideSpeed : 800,
                    paginationSpeed : 800,
                    autoWidth: true,
                    singleItem: true
                });
                insertChild({}, function(res) {
                    if (res.success === true) {
                        console.log('inserted child. search came up empty.');
                    } else {
                        console.log('general unsponsored child not inserted.');
                    }
                });
                console.log('did not insert a child.');
            }
        });
    });

    /* Dropdown functionality, this will change the title of the
       dropdown to the option selected by the user */
    $('#search-gender li > a').click(function(){
        $('#genderSearch').text(this.innerHTML);
    });

    $('#search-center li > a').click(function(){
        $('#locationSearch').text(this.innerHTML);
    });

    $('#search-age li > a').click(function(){
        $('#ageSearch').text(this.innerHTML);
    });

    $('#search-birthmonth li > a').click(function(){
        $('#birthmonthSearch').text(this.innerHTML);
    });

    $('#search-birthday li > a').click(function(){
        $('#birthdaySearch').text(this.innerHTML);
    });

});
