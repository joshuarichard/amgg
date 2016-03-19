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
        if (sessionStorage.getItem('cart') != null && sessionStorage.getItem('cart') != '') {
            cart = sessionStorage.getItem('cart').split(',');
        }

        // if the child isn't in the cart and also isn't in the slider
        if (cart.indexOf(id) === -1 && childrenCurrentlyInSlider.indexOf(id) === -1) {

            // then add the child to the slider
            var name = childPool[id].nombre;
            var age = childPool[id].años;
            var gender = childPool[id].género;
            var location = childPool[id].provincia;
            var aficiones = childPool[id].aficiones;
            var biodata = childPool[id].biodata;

            // get the picture and load it in
            $.getJSON('/api/v1/pictures/id/' + id, function(res) {
                var child = {
                    'id': id,
                    'name': name,
                    'age': age,
                    'gender': gender,
                    'location': location,
                    'aficiones': aficiones,
                    'biodata': biodata,
                    'picture': res.data
                };
                childrenCurrentlyInSlider.push(id);
                callback(child);
            });
        } else {
             // if the child is already in the slider or cart but there
             // are more children in the child pool
            if (childrenCurrentlyInSlider.length !== ids.length && childrenCurrentlyInSlider.length < ids.length && cart.indexOf(id) === -1) {
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
     *    aficiones: string,
     *    biodata: string,
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
        var aficiones = child.aficiones;
        var biodata = child.biodata;

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
        var divData = document.createElement('div');
        divData.className = 'col-xs-6';
        var hData = document.createElement('h1');
        hData.innerHTML = 'Hola, me llamo <span id =\'child-name\'>' + name + '</span>!';
        divData.appendChild(hData);
        var divDescription = document.createElement('div');
        divDescription.className = 'child-description';
        var pData1 = document.createElement('p');
        pData1.className = 'lead';
        pData1.innerHTML = 'I\'m a <span id=\'child-age\'>' + age + '</span>-year-old <span id=\'child-gender\'>' + gender + '</span> from <span id=\'child-location\'>' + location + '</span>, and you can change my world for good!';
        var pData2 = document.createElement('p');
        pData2.innerHTML = 'Make me part of your family, and help me reach my God-given potential. $<span id=\'child-cost\'>39</span> a month can help transform my community and change my world.';
        var pData3 = document.createElement('p');
        pData3.innerHTML = 'My hobbies include ' + aficiones;
        var pData4 = document.createElement('p');
        pData4.innerHTML = 'You should sponsor me because ' + biodata;
        divDescription.appendChild(pData1);
        divDescription.appendChild(pData2);
        divDescription.appendChild(pData3);
        divDescription.appendChild(pData4);
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

        $('#slides').append(slide);
        callback(slide);
    }

    $('.nav-buttons').hide();

    // add a slide to the carousel given slide html
    function addSlide(slide) {
        // remove the pending spinner
        $('.spinner').remove();
        $('.nav-buttons').show();
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

        var container = document.getElementById('spinner');
        container.insertBefore(spinnerDiv, container.childNodes[0]);

        // empty the array that keeps track of the children in the slider
        childrenCurrentlyInSlider = [];

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

    /* if the user is already logged in, change the login button
     * to a go to account page link, else create login overlay
     */
    if (sessionStorage.getItem('token') != null && sessionStorage.getItem('token') != '') {
        document.getElementById('toggle-login').href = 'account.html';
        document.getElementById('toggle-login').innerHTML = 'Mi Cuenta';
    } else {
        /* When login link is clicked, call toggleLogin */
        $('#toggle-login').click(toggleLogin);

        /* When the log in button is clicked, validate credentials
           and if valid send the user to account.html and but the
           token returned by server into session storage */
        $('.login-submit').click(function(event) {
            event.preventDefault();
            var worked = false;
            var email = $('.donor-email').val();
            var password = $('.donor-password').val();

            // define the request
            $.ajax({
                url: '/api/v1/donor/auth',
                type: 'POST',
                data: {
                    'correo_electrónico': email,
                    'password': password
                },
                // on successful login, save token and donor id
                // in session storage and go to the donor portal
                success: function(res) {
                    //save login token to session storage
                    sessionStorage.setItem('token', res.token);
                    sessionStorage.setItem('id', res.id);
                    worked = true;
                },
                error: function(httpObj) {
                    if(httpObj.status === 401) {
                        alert('correo o contraseña incorrectos.');
                    } else {
                        console.log(JSON.stringify(httpObj));
                        alert('see console for error info.');
                    }
                    worked = false;
                },
                complete: function() {
                    if (worked === true) {
                        window.location = 'account.html';
                    }
                }
            });
        });
    }

    /* Toggle the login box when login link is clicked */
    function toggleLogin () {
        if ($('.login').css('display') == 'none') {
            $('.login').show();
        }
        else {
            $('.login').hide();
        }
    }

    function toggleCreateAccount () {
        if ($('.create-account-overlay').css('display') == 'none') {
            $('.create-account-overlay').show();
            $('.login').hide();
        }
        else {
            $('.create-account-overlay').hide();
        }
    }
    $('.create-account').click(toggleCreateAccount);

    function createAccount() {
        // get all form info
        var firstName = document.getElementById('create-account-first-name').value;
        var lastName = document.getElementById('create-account-last-name').value;
        var phone = document.getElementById('create-account-phone').value;
        var street = document.getElementById('create-account-address-street').value;
        var city = document.getElementById('create-account-address-city').value;
        var country = document.getElementById('create-account-country').value;
        var email = document.getElementById('create-account-email').value;
        var password = document.getElementById('create-account-password').value;
        var confirmPassword = document.getElementById('create-account-password-confirm').value;

        // manage any null fields and throw errors accordingly
        var nullFields = [];

        if(firstName === '') {
            nullFields.push('First name field empty.');
        }
        if (lastName === '') {
            nullFields.push('Last name field empty.');
        }
        if (phone === '') {
            nullFields.push('Phone number field empty.');
        }
        if (email === '') {
            nullFields.push('Email field empty.');
        }
        if (street === '') {
            nullFields.push('Street field empty.');
        }
        if (city === '') {
            nullFields.push('City field empty.');
        }
        if (country === '') {
            nullFields.push('Country field empty.');
        }

        // if anything is null then alert, else submit a post with donor info
        if (nullFields.length > 0) {
            var alertMessage = 'You are missing some fields: \n';
            for (var i = 0; i < nullFields.length; i++) {
                alertMessage += nullFields[i];
                alertMessage += '\n';
            }
            alert(alertMessage);
        } else if (password !== confirmPassword) {
            alert('las contraseñas no coinciden.');
        } else if (password === '') {
            alert('por favor ingrese una contraseña.');
        } else {
            if (sessionStorage.getItem('assignedDonorID') !== null || sessionStorage.getItem('assignedDonorID') === '') {
                var deleteCart = confirm('you are currently in the process of sponsoring children. please create your account by completing the sponsorship process. if you would like to create an account without sponsoring a child, please click yes below and your cart will be deleted.');
                if (deleteCart === true) {
                    // we shouldn't have to do this, but right now we do
                    sessionStorage.removeItem('assignedDonorID');
                    sessionStorage.removeItem('cart');
                }
            } else {
                var donor = {
                    'assigned_donor_id': sessionStorage.getItem('assignedDonorID'),
                    'nombre': firstName,
                    'apellido': lastName,
                    'teléfono': phone,
                    'calle': street,
                    'ciudad': city,
                    'país': country,
                    'correo_electrónico': email,
                    'password': password
                };

                // POST /api/v1/donor/create
                $.ajax({
                    url: '/api/v1/donor/create',
                    type: 'POST',
                    data: donor,
                    success: function() {
                        $('.create-account-overlay').hide();
                        //log user into their new account
                        $.ajax({
                            url: '/api/v1/donor/auth',
                            type: 'POST',
                            data: {
                                'correo_electrónico': email,
                                'password': password
                            },
                            success: function(res) {
                                //put token and donor id into sessionStorage
                                sessionStorage.setItem('token', res.token);
                                sessionStorage.setItem('id', res.id);
                                //change login button to account button
                                document.getElementById('toggle-login').href = 'account.html';
                                document.getElementById('toggle-login').innerHTML = 'Mi Cuenta';
                                //notify user they are now logged into their new account
                                alert('Your account has successful been created, you are now logged in');
                            },
                            error: function() {
                                alert('Your account has been created but we were unable to log you in at this time, please try again later');
                            }
                        });
                    },
                    statusCode: {
                        404: function() {
                            alert('page not found');
                        },
                        409: function() {
                            alert('An account already exists under this email, please log in');
                        },
                        500: function() {
                            alert('An error occured, please try again or contact an admin');
                        }
                    }
                });
            }
        }
    }
    $('.create-account-submit').click(createAccount);
    $('.close-create-account-overlay').click(toggleCreateAccount);
});
