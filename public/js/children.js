/* eslint-env browser */
/* eslint no-undef: 0 */

$(document).ready(function() {
    // global variable to keep track of the kids in the carousel
    var childrenCurrentlyInSlider = [];

    // fill the child pool based on a given selector
    function fillChildPool(selector, callback) {
        var ors = [{
            '$or': [{'estado': 'Waiting for Sponsor - No Prior Sponsor'},
                    {'estado': 'Waiting for Sponsor - Discontinued'},
                    {'estado': 'Additional Sponsor Needed'}]
        }];

        selector['$and'] = ors;

        // get all unsponsored kids and pick one to display in the carousel
        $.getJSON('/api/v1/children/find/' + JSON.stringify(selector),
            function(res){
                if (res.err !== undefined) {
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
        // get an array of child ids by mapping the keys in the child pool to an array called 'ids'
        var ids = $.map(childPool, function (value, key) {
            return key;
        });

        // randomly pick one of those ids
        var id = ids[Math.floor(Math.random() * ids.length)];

        // init the cart as an array from sessionStorage
        var cart = [];
        if (inStorage('cart') === true) {
            cart = sessionStorage.getItem('cart').split(',');
        }

        // if the child isn't in the cart and also isn't in the slider
        if (cart.indexOf(id) === -1 && childrenCurrentlyInSlider.indexOf(id) === -1) {
            // then add the child to the slider
            var name = childPool[id].nombre;

            var birthday = new Date(childPool[id].cumpleaños);
            var today = new Date();
            var age = today.getFullYear() - birthday.getFullYear();
            birthday.setFullYear(today.getFullYear());
            if (today < birthday) { age--; }

            var gender = childPool[id].género;
            var location = childPool[id].departamento;
            var hobbies = childPool[id].pastiempos;
            var picture = childPool[id].foto;
            var center = childPool[id].centro_de_niños;
            var dreams = childPool[id].sueños;

            var child = {
                'id': id,
                'name': name,
                'age': age,
                'gender': gender,
                'location': location,
                'hobbies': hobbies,
                'center': center,
                'dreams': dreams,
                'picture': picture
            };

            callback(child);
        } else {
             // if the child is already in the slider or cart but there are more children in the child pool
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
     *    pastiempos: string,
     *    picture: base64 string
     * }
     */
    function buildHTMLforSlide(child, callback) {
        // assign all of the data gathered from the api to variables
        var id = child.id;
        var name = child.name;
        var location = child.location;
        var picture = child.picture;
        var center = child.center;
        var dreams = child.dreams;

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
        var hData = document.createElement('h2');
        hData.innerHTML = 'Hola, me llamo <span id =\'child-name\'>' + name + '</span>!';
        divData.appendChild(hData);
        var divDescription = document.createElement('div');
        divDescription.className = 'child-description';
        var pData1 = document.createElement('p');
        pData1.className = 'lead';
        pData1.innerHTML = 'Vivo en ' + location + ' Guatemala y asisto al colegio ' + center + ' de AMG, mis sueños son \"' + dreams + '\"';
        var pData2 = document.createElement('p');
        pData2.innerHTML = 'Con tu aporte mensual tu puedes ayudarme a alcanzar mis sueños.​';
        divDescription.appendChild(pData1);
        divDescription.appendChild(pData2);
        divData.appendChild(divDescription);
        var sponsorButton = document.createElement('a');
        sponsorButton.id = 'sponsor-button';
        sponsorButton.className = 'btn btn-primary btn-lg';
        sponsorButton.href = 'checkout.html';
        sponsorButton.innerHTML = 'Conviértase Mi Padrino';
        //initialize the child counter for the cart
        $(function() {
            var counter = 0;
            var init = 'carte' + '(' + counter + ')';
            var carte = sessionStorage.getItem('cart');
            for(var i = 0; i < carte.length; ++i){
                //count how many commas in the cart
                if(carte[i] == ','){
                    counter++;
                }
            }
                //adds one if there is a child added
            if(carte.length > 1){
                counter++;
            }
            init = '   ' + '(' + counter + ')';

        // Initial Cart in html
            $('.counter').html(init);

        //Function that adds numbers to cart with a little effect thrown in
            function addToBasket() {
                counter++;
                $('.counter').html('   (' + counter + ')').animate({
                    'opacity' : '0'
                },300, function() {
                    $('.counter').delay(300).animate({
                        'opacity' : '1'
                    });
                });
            }

        // add the function for the sponsor button. clicking this should add
        // the child's id from the parent-most div into sessionStorage
            sponsorButton.onclick = function() {
                if(sessionStorage.getItem('cart') === null ||
                    sessionStorage.getItem('cart') === '') {
                    sessionStorage.setItem('cart', this.parentNode.parentNode.id);
                    addToBasket();
                } else {
                    var existingStorage = sessionStorage.getItem('cart');
                    sessionStorage.setItem('cart', existingStorage + ',' + this.parentNode.parentNode.id);
                    addToBasket();
                }
            };
        });
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
        //show slider nav buttons
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
        if($('#locationSearch').text() !== 'departamento') {
            selector['departamento'] = $('#locationSearch').text();
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
    $(document).arrive('.child-slide', {onceOnly: true, existing: true}, function() {
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
                    'email': email,
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
                        alert('Correo o contraseña incorrectos.');
                    } else {
                        console.log(JSON.stringify(httpObj));
                        alert('see console for error info.');
                    }
                    worked = false;
                },
                complete: function() {
                    if (worked === true) {
                        location.reload();
                    }
                }
            });
        });
    }

    /* Toggle the login box when login link is clicked */
    function toggleLogin () {
        if ($('.login').css('display') == 'none') {
            $('.login').slideDown(function() {
                $(this).show();
            });
        }
        else {
            $('.login').slideUp(function() {
                $(this).hide();
            });
        }
    }

    function toggleCreateAccount() {
        if ($('.create-account-overlay').css('display') == 'none') {
            $('.create-account-overlay').show();
            $('.login').hide();
        }
        else {
            $('.create-account-overlay').hide();
        }
    }
    $('.create-account').click(toggleCreateAccount);

    /* Check to make sure all the fields are filled in and ensure the
     * user's password passes the constraints
     */
    function checkForm(form) {
        // get all form info
        var firstName = $('[name=first-name]', form)[0];
        var lastName = $('[name=last-name]', form)[0];
        var phone = $('[name=phone]', form)[0];
        var street = $('[name=address]', form)[0];
        var city = $('[name=address-city]', form)[0];
        var departamento = $('[name=departamento]', form)[0];
        var country = $('[name=country]', form)[0];
        var email = $('[name=email]', form)[0];
        var password = $('[name=password]', form)[0];
        var confirmPassword = $('[name=password-confirm]', form)[0];

        if(firstName.value == '') {
            alert('Error: El primer nombre no puede ir en blanco.');
            firstName.focus();
            return false;
        } else if(lastName.value == '') {
            alert('Error: Apellido no puede ir en blanco.');
            lastName.focus();
            return false;
        } else if(phone.value == '') {
            alert('Error: No. de telefono no debe ir en blanco.');
            phone.focus();
            return false;
        } else if(street.value == '') {
            alert('Error: Calle no puede ir en blanco.');
            street.focus();
            return false;
        } else if(city.value == '') {
            alert('Error: Ciudad no puede ir en blanco.');
            city.focus();
            return false;
        } else if(departamento.value == '') {
            alert('Error: Por favor seleccione una departamento.');
            departamento.focus();
            return false;
        } else if(country.value == '') {
            alert('Error: Por favor seleccione un país.');
            country.focus();
            return false;
        } else if(email.value == '') {
            alert('Error: Correo electrónico no puede ir en blanco.');
            email.focus();
            return false;
        } else if(password.value != '' && password.value == confirmPassword.value) {
            if(password.value.length < 6) {
                alert('Error: La contraseña debe contener al menos 6 carácteres.');
                password.focus();
                return false;
            }
            if(password.value == firstName.value || password.value == lastName.value) {
                alert('Error: La contraseña debe ser diferente a su nombre.');
                password.focus();
                return false;
            }
            re = /[0-9]/;
            if(!re.test(password.value)) {
                alert('Error: La contraseña debe contener al menos un  número (0-9).');
                password.focus();
                return false;
            }
            re = /[a-z]/;
            if(!re.test(password.value)) {
                alert('Error: La contraseña debe contener al menos una letra en minuscula (a-z).');
                password.focus();
                return false;
            }
            re = /[A-Z]/;
            if(!re.test(password.value)) {
                alert('Error: La  contraseña debe contener al menos una letra en mayuscula (A-Z).');
                password.focus();
                return false;
            }
        } else {
            alert('Error: Por favor revise que usted haya ingresado y confirme su contraseña.');
            password.focus();
            return false;
        }
        //form passed all constraints
        return true;
    }

    function createAccount() {
        if (checkForm(document.getElementById('create-account-form'))) {
            var donor = {
                'nombre': document.getElementById('create-account-first-name').value,
                'apellido': document.getElementById('create-account-last-name').value,
                'teléfono': document.getElementById('create-account-phone').value,
                'calle': document.getElementById('create-account-address-street').value,
                'ciudad': document.getElementById('create-account-address-city').value,
                'departamento': document.getElementById('departamento').value,
                'país': document.getElementById('create-account-country').value,
                'correo_electrónico': document.getElementById('create-account-email').value,
                'password': document.getElementById('create-account-password').value
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
                            'email': document.getElementById('create-account-email').value,
                            'password': document.getElementById('create-account-password').value
                        },
                        success: function(res) {
                            //put token and donor id into sessionStorage
                            sessionStorage.setItem('token', res.token);
                            sessionStorage.setItem('id', res.id);
                            //change login button to account button
                            document.getElementById('toggle-login').href = 'account.html';
                            document.getElementById('toggle-login').innerHTML = 'Mi Cuenta';
                            //notify user they are now logged into their new account
                            alert('Su cuenta ha sido creada exitosamente, su sesión ha iniciado');
                        },
                        error: function(res) {
                            console.log(res);
                            alert('Su cuenta ha sido creada pero no hemos podido conectarlo ahora, por favor intente acceder');
                        }
                    });
                },
                statusCode: {
                    404: function() {
                        alert('Página no encontrada.');
                    },
                    409: function() {
                        alert('Ya existe un cuenta con la misma dirección de correo. Por favor ingrese.');
                    },
                    500: function() {
                        alert('An error occured, please try again or contact an admin');
                    }
                }
            });
        }
    }
    $('.create-account-submit').click(createAccount);
    $('.close-create-account-overlay').click(toggleCreateAccount);

    $('.forgot-password').click(function() {
        if ($('.donor-email').val() != '' && $('.donor-email').val() != null) {
            // define the request
            $.ajax({
                url: '/api/v1/donor/reset',
                type: 'POST',
                data: {
                    'correo_electrónico': $('.donor-email').val()
                },
                success: function(res) {
                    if (res.success === true) {
                        alert('Por favor, consultar su correo electrónico para su contraseña temporal.');
                        toggleLogin();
                    }
                },
                error: function(httpObj) {
                    if(httpObj.status === 401) {
                        alert('Correo o contraseña incorrectos.');
                    } else {
                        console.log(JSON.stringify(httpObj));
                        alert('Error.');
                    }
                }
            });
        } else {
            alert('Por favor, introduzca su correo electrónico en el campo de correo electrónico antes de hacer clic "Olvidé mi contraseña".');
        }
    });
});

// helper function - check session storage element
function inStorage(object) {
    if (sessionStorage.getItem(object) !== null && sessionStorage.getItem(object) !== '') {
        return true;
    } else {
        return false;
    }
}
