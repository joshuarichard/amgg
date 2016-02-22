/* eslint-env browser */
/* eslint no-undef: 0 */

$(document).ready(function() {
    // define a child pool to fill on an api call and reuse continuously
    var childPool = {};

    // fill the child pool based on a given selector
    function fillChildPool(selector, callback) {
        selector['$or'] = [{'status': 'Waiting for Sponsor - No Prior Sponsor'},
                           {'status': 'Waiting for Sponsor - Discontinued'},
                           {'status': 'Additional Sponsor Needed'}];
        // get all unsponsored kids and pick one to display in the
        // carousel
        $.getJSON('/api/v1/children/find/' + JSON.stringify(selector),
            function(res){
                if(res.err !== undefined) {
                    // TODO: fix error on connection
                    callback();
                } else if (JSON.stringify(res) === '{}') {
                    /* eslint-disable */
                    alert('no hay niños que coincidan con sus criterios de búsqueda.');
                    /* eslint-enable */
                    callback();
                } else {
                    childPool = res;
                    callback();
                }
            });
    }

    // select a child from the childPool variable
    function selectChild(callback) {
        // calculate the resLength for random child bounds
        var key, resLength = 0;
        for(key in childPool) {
            if(childPool.hasOwnProperty(key)) {
                resLength++;
            }
        }

        // use the resLength to randomly pick one of the
        // unsponsored children within the bounds
        // ---------------------------------------------------------
        // TODO: this doesn't work when the response is a low number
        // (años = 3 returns 2 children from call but only ever shows augustin)
        var ran = Math.floor(Math.random() * (resLength - 0 + 1) + 1);

        // now iterate over the res with an index (i) and match it
        // to the random number.
        var i = 0;
        for (key in childPool) {
            // if index === random number then pick this child
            if (i === ran && childPool.hasOwnProperty(key) &&
                             $('#' + key).length === 0) {
                var id = key;
                var name = childPool[id].nombre;
                var age = childPool[id].años;
                var gender = childPool[id].género;
                var location = childPool[id].centro_de_ninos;
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
                    callback(child);
                });
                break;
            } else {
                i++;
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
        var item = document.createElement('div');
        item.className = 'item';
        item.appendChild(slide);
        owl.data('owlCarousel').addItem(item);
    }

    /* 4 step process for adding a child
     * 1. fill the child pool based on a selector  - fillChildPool()
     * 2. select a child from that pool            - selectChild()
     * 3. build the html for that child            - buildHTMLforSlide()
     * 4. add the html to the slider               - addSlide()
     *
     * all of these are handled by insertChild()
     */
    function insertChildren(selector, numOfChildren, callback) {
        fillChildPool(selector, function() {
            for (var x = 0; x < numOfChildren; x++) {
                selectChild(function(child) {
                    buildHTMLforSlide(child, function(slide) {
                        addSlide(slide);
                        callback();
                    });
                });
            }
        });
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

    // initially load 5 children onto the page
    insertChildren({}, 5, function() {
        console.log('initially loaded one child.');
    });

    // add a child to the slide button
    $('#add-button').click(function() {
        insertChildren({}, 1, function() {
            console.log('inserted child.');
        });
    });

    /**
     * find a child panel
     */
    $('#search-button').click(function() {
        var selector = {};
        if($('#genderSearch').text() !== 'Género') {
            selector['género'] = $('#genderSearch').text();
        }
        if($('#locationSearch').text() !== 'Provincia') {
            selector['provincia'] = $('#locationSearch').text();
        }
        if($('#ageSearch').text() !== 'Años') {
            selector['años'] = $('#ageSearch').text();
        }
        /*
        if($('#search-birthmonth').text() !== 'Birth Month') {
            selector[''] = $('#search-birthmonth').text();
        }
        if($('#search-birthday').text() !== 'Birth Day') {
            selector[''] = $('#search-birthday').text();
        }
        */

        // empty the owl carousel (minus the last slide...)
        while (owl.data('owlCarousel').owl.owlItems.length !== 1) {
            owl.data('owlCarousel').removeItem();
        }
        // owl doesn't delete the last slide for some reason, so do it manually
        if (owl.data('owlCarousel').owl.owlItems.length === 1) {
            owl.data('owlCarousel').removeItem();
        }

        // loop 5 times for 5 different kids
        insertChildren(selector, 5, function() {
            if ($('.child-slide').length === 0) {
                insertChildren({}, 5, function() {
                    console.log('no children matched search criteria.');
                });
            }
            console.log('inserted search children.');
        });
    });

    /* Dropdown functionality, this while change the title of the
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

    /* Toggle the login box when login link is clicked */
    function toggleLogin () {
        if ($('.login').css('display') == 'none') {
            $('.login').show();
        }
        else {
            $('.login').hide();
        }
    }
    /* When login link is clicked, call toggleLogin */
    $('#toggle-login').click(toggleLogin);

    /* When the log in button is clicked, validate credentials and if valid
       send the user to account.html and but the token returned by server into
       session storage */
    $('.login-submit').click(login);

    function login () {
        var email = $('.donor-email').val();
        var password = $('.donor-password').val();

        // define the request
        var loginRequest = $.ajax({
            url: '/api/v1/donor/auth',
            type: 'POST',
            data: {
                'correo_electrónico': email,
                'password': password
            }
        });

        // on successful login, save token and donor id in session storage and
        // go to the donor portal
        loginRequest.success(function(res) {
              //save login token to session storage
            sessionStorage.setItem('token', res.token);
            sessionStorage.setItem('id', res.id);
            window.location = 'account.html';
        });

        // on login error, check error and inform user accordingly
        loginRequest.error(function(httpObj, textStatus) {
            if (httpObj.status !== 200) {
                if(httpObj.status === 401) {
                    /* eslint-disable */
                    alert('correo o contraseña incorrectos - email or password incorrect');
                    /* eslint-enable */
                } else {
                    console.log(httpObj + ' ' + textStatus);
                    alert('internal server error. see console for error info.');
                }
            }
        });
    }
});
