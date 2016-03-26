/* eslint-env browser */
/* eslint no-undef: 0 */

$(document).ready(function() {
    // firstly, set a donor id if the user isn't logged in. this will be used to
    // manage their cart and lock children as they add them to the cart.
    var donorID = '';
    // if the donor is not logged in and currently doesn't have an assigned donor id then assign them one
    if (sessionStorage.getItem('cart') !== null && sessionStorage.getItem('cart') !== '' &&
        (sessionStorage.getItem('id') === null || sessionStorage.getItem('id') === '') &&
        (sessionStorage.getItem('assignedDonorID') === null || sessionStorage.getItem('assignedDonorID' === ''))) {
        donorID = generateDonorID();
        sessionStorage.setItem('assignedDonorID', donorID);
    }

    // secondly, check if they have both an assigned ID and a real ID. if they have both, then they've
    // logged in since adding a child to their cart. nuke the cart, delete the assigned ID, and reroute to child page
    if (sessionStorage.getItem('id') !== null && sessionStorage.getItem('id') !== '' &&
        sessionStorage.getItem('assignedDonorID') !== null && sessionStorage.getItem('assignedDonorID') !== '') {
        // we shouldn't have to do this, but right now we do
        sessionStorage.removeItem('assignedDonorID');
        sessionStorage.removeItem('cart');
        window.location = 'children.html';
    }

    // secondly, check the lock status of all children currently in the cart.
    // if the child is locked, remove the child and alert the donor accordingly
    if (sessionStorage.getItem('cart') !== null && sessionStorage.getItem('cart') !== '') {
        var cartArray = sessionStorage.getItem('cart').split(',');

        // check the locked status of every child in the cart. lockedChildren is
        // an array of all children that were in the cart that are locked
        checkCartsLockedStatus(cartArray, function(lockedChildren) {
            if (lockedChildren.length > 0) {
                for (var q = 0; q < lockedChildren.length; q++) {
                    // ... then remove it from the table
                    removeChildFromCart(lockedChildren[q]);
                }
                alert('lo sentimos, pero algunos de los niños en su carrito ya no están disponibles para el patrocinio.');
            }
        });
    }

    // thirdly, send the current cart's contents
    // NOTE: when you remove a child from the table it will send the cart to the
    // db. if it's the case that all children currently in the cart are clear to be
    // sponsored (i.e. they are not locked), then it will not send the cart,
    // therefore, it is required we send the contents of the cart at least once
    if (sessionStorage.getItem('cart') !== null && sessionStorage.getItem('cart') !== '') {
        sendCart(function(result) {
            if (result === true) {
                console.log('successfully sent cart to db.');
            } else {
                console.log('cart not successfully sent to db.');
                $('#checkout-go-to-step-two').prop('disabled', true);
            }
        });
    }

    // fourthly, begin creating the UI and make some api calls to get child
    // and donor data.
    var container = document.getElementById('children-to-sponsor');
    var table = document.createElement('table');
    table.className = 'table table-hover child-selections';
    var tbody = document.createElement('tbody');

    // fifthly, insert all children in session storage into the cart.
    // if no children in the cart, the remove the spinner
    if (sessionStorage.getItem('cart') != null && sessionStorage.getItem('cart') != '') {
        var ids = sessionStorage.getItem('cart').split(',');
        for (var i = 0; i < ids.length; i++) {
            addChildToCart(ids[i]);
            container.appendChild(table);
        }
    } else {
        $('.spinner').remove();
    }

    // after all that append the 'add a child' button
    var addButton = document.createElement('button');
    addButton.className = 'btn btn-primary btn-md';
    addButton.onclick = function() {
        window.location = 'children.html';
    };

    addButton.appendChild(document.createTextNode('Agregar otro Niño'));
    container.appendChild(addButton);

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

    function generateDonorID() {
        var text = '';
        // there are 2^62 possiblities here and they're recycleable after an hour...
        // that should be enough.
        var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

        for(var i = 0; i < 24; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }

        return text;
    }

    // checks the status of all kids in the cart. takes the cart from sessionStorage
    // as an array, not a string.
    function checkCartsLockedStatus(array, callback) {
        array = array.slice(0);

        function checkForLockedStatus() {
            var childID = array.pop();
            var lockedChildren = [];

            var donorIDjson = {};
            if (sessionStorage.getItem('id') !== null && sessionStorage.getItem('id') !== '') {
                donorIDjson = {
                    'donor_id': sessionStorage.getItem('id')
                };
            } else {
                donorIDjson = {
                    'donor_id': sessionStorage.getItem('assignedDonorID')
                };
            }

            $.ajax({
                url: '/api/v1/children/islocked/id/' + childID,
                type: 'POST',
                data: donorIDjson,
                success: function(res) {
                    if (res.islocked === true) {
                        lockedChildren.push(childID);
                    }
                    if(array.length > 0) {
                        checkForLockedStatus();
                    } else {
                        callback(lockedChildren);
                    }
                }
            });
        }

        if(array.length > 0) {
            checkForLockedStatus();
        } else {
            callback(lockedChildren);
        }
    }

    function sendCart(callback) {
        var donorIDinCart = '';
        // if the donor is logged in then use their donor id in the cart doc
        if (sessionStorage.getItem('id') != null && sessionStorage.getItem('id') != '' &&
            sessionStorage.getItem('cart') != null && sessionStorage.getItem('cart') != '') {
            donorIDinCart = sessionStorage.getItem('id');
        // else if the donor has an assigned donor id then use that
        } else if (sessionStorage.getItem('assignedDonorID') && sessionStorage.getItem('assignedDonorID') != '' &&
                   sessionStorage.getItem('cart') != null && sessionStorage.getItem('cart') != '') {
            donorIDinCart = sessionStorage.getItem('assignedDonorID');
        }

        $.ajax({
            url: '/api/v1/donor/cart',
            type: 'POST',
            data: {
                'donor_id' : donorIDinCart,
                'niños_patrocinadoras' : sessionStorage.getItem('cart').split(',')
            },
            success: function() {
                callback(true);
            },
            error: function() {
                callback(false);
            }
        });
    }

    function addChildToCart(id) {
        // create child's table row
        var tr = document.createElement('tr');

        function pic(callback) {
            var picTD = document.createElement('td');
            var picIMG = document.createElement('img');
            picIMG.className = 'child-img';

            $.getJSON('/api/v1/pictures/id/' + id, function(res) {
                if (res.data.hasOwnProperty('err')){
                    console.log(res.data.err);
                    callback(false);
                } else if (res.data !== undefined) {
                    picIMG.src = 'data:image/image;base64,' + res.data;
                    picTD.appendChild(picIMG);
                    tr.appendChild(picTD);
                    callback(true);
                }
            });
        }

        function data(callback) {
            // get child data using api
            $.getJSON('/api/v1/children/id/' + id, function(res) {
                if(res.hasOwnProperty('err')) {
                    console.log(JSON.stringify(data));
                    callback(false);
                } else {
                    var dataTD = document.createElement('td');
                    tr.id = id;

                    // set up all child info as vars
                    var monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril',
                                      'Mayo', 'Junio', 'Julio', 'Agosto',
                                      'Septiembre', 'Octubre', 'Noviembre',
                                      'Diciembre'];
                    var date = new Date(res[id].cumpleaños);
                    var birthday = monthNames[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();
                    var name = res[id].nombre;
                    var age = res[id].años;
                    var gender = res[id].género;
                    var provincia = res[id].provincia;
                    var center = res[id].centro_de_ninos;
                    var aficiones = res[id].aficiones;

                    // create elements for each piece of info
                    var dataDiv = document.createElement('td');
                    dataDiv.className = 'child-info-group';

                    var nameDiv = document.createElement('div');
                    var ageDiv = document.createElement('div');
                    var birthdayDiv = document.createElement('div');
                    var genderDiv = document.createElement('div');
                    var provinciaDiv = document.createElement('div');
                    var centerDiv = document.createElement('div');
                    var aficionesDiv = document.createElement('div');

                    // assign classes to those elements
                    nameDiv.className = 'child-info';
                    ageDiv.className = 'child-info';
                    birthdayDiv.className = 'child-info';
                    genderDiv.className = 'child-info';
                    provinciaDiv.className = 'child-info';
                    centerDiv.className = 'child-info';
                    aficionesDiv.className = 'child-info';

                    // assign values
                    nameDiv.innerHTML = '<b> Nombre: </b>' + name;
                    ageDiv.innerHTML = '<b> Años:  </b>' + age;
                    birthdayDiv.innerHTML = '<b> Cumpleaños:  </b>' + birthday;
                    genderDiv.innerHTML = '<b> Género:  </b>' + gender;
                    provinciaDiv.innerHTML = '<b> Provincia: </b>' + provincia;
                    centerDiv.innerHTML = '<b> Centro de Niños:  </b>' + center;
                    aficionesDiv.innerHTML = '<b> Aficiones: </b>' + aficiones;

                    // append children to div
                    dataTD.appendChild(nameDiv);
                    dataTD.appendChild(ageDiv);
                    dataTD.appendChild(birthdayDiv);
                    dataTD.appendChild(genderDiv);
                    dataTD.appendChild(provinciaDiv);
                    dataTD.appendChild(centerDiv);
                    dataTD.appendChild(aficionesDiv);

                    // append dataTD to the dataDiv for styling, then append to row
                    dataDiv.appendChild(dataTD);
                    tr.appendChild(dataDiv);

                    callback(true);
                    $('.spinner').remove();
                }
            });
        }

        function deleteButton(callback) {
            var buttonTD = document.createElement('td');
            buttonTD.id = 'delete-child-button';

            // create button, add classname for styling, append text
            var button = document.createElement('button');
            button.className = 'btn btn-primary btn-sm';
            button.appendChild(document.createTextNode('Eliminar'));

            // set on click button function
            button.onclick = function() {
                removeChildFromCart(button.parentNode.parentNode.id);
            };

            // add button to table entry and add table entry to row
            buttonTD.appendChild(button);
            tr.appendChild(buttonTD);

            callback(true);
        }

        // first insert pic
        pic(function(success) {
            if(success === true) {
                // then append data
                data(function(success)  {
                    if(success === true) {
                        // then append delete button
                        deleteButton(function() {
                            // append the row to the tbody, and
                            // add the tbody to the table
                            tbody.appendChild(tr);
                            table.appendChild(tbody);
                        });
                    }
                });
            }
        });
    }

    /* Check to make sure all the fields are filled in and ensure the
     * user's password passes the constraints
     */
    function checkForm(form) {
        console.log(form);
        // get all form info
        var firstName = $('[name=first-name]', form)[0];
        var lastName = $('[name=last-name]', form)[0];
        var phone = $('[name=phone]', form)[0];
        var street = $('[name=address]', form)[0];
        var city = $('[name=address-city]', form)[0];
        var email = $('[name=email]', form)[0];
        var password = $('[name=password]', form)[0];
        var confirmPassword = $('[name=password-confirm]', form)[0];

        if(firstName.value == '') {
            alert('Error: First name cannot be blank!');
            firstName.focus();
            return false;
        } else if(lastName.value == '') {
            alert('Error: Last name cannot be blank!');
            lastName.focus();
            return false;
        } else if(phone.value == '') {
            alert('Error: Phone number cannot be blank!');
            phone.focus();
            return false;
        } else if(street.value == '') {
            alert('Error: Street address cannot be blank!');
            street.focus();
            return false;
        } else if(city.value == '') {
            alert('Error: City cannot be blank!');
            city.focus();
            return false;
        } else if(email.value == '') {
            alert('Error: Email cannot be blank!');
            email.focus();
            return false;
        } else if(password.value != '' && password.value == confirmPassword.value) {
            if(password.value.length < 6) {
                alert('Error: Password must contain at least six characters!');
                password.focus();
                return false;
            }
            if(password.value == firstName.value || password.value == lastName.value) {
                alert('Error: Password must be different from your name!');
                password.focus();
                return false;
            }
            re = /[0-9]/;
            if(!re.test(password.value)) {
                alert('Error: password must contain at least one number (0-9)!');
                password.focus();
                return false;
            }
            re = /[a-z]/;
            if(!re.test(password.value)) {
                alert('Error: password must contain at least one lowercase letter (a-z)!');
                password.focus();
                return false;
            }
            re = /[A-Z]/;
            if(!re.test(password.value)) {
                alert('Error: password must contain at least one uppercase letter (A-Z)!');
                password.focus();
                return false;
            }
        } else {
            /* eslint-disable */
            alert("Error: Please check that you've entered and confirmed your password!");
            /*eslint-enable */
            password.focus();
            return false;
        }
        //form passed all constraints
        return true;
    }

    function removeChildFromCart(id) {
        // if the table entry hasn't already been deleted then delete it now
        // but wait for it using arrive.js if it's not there yet
        $(document).arrive('[id=\'' + id + '\']', {onceOnly: true, existing: true}, function() {
            $(this).remove();

            // remove child from sessionStorage
            var ids = sessionStorage.getItem('cart').split(',');
            if (ids.indexOf(id) != -1) {
                ids.splice(ids.indexOf(id), 1);
                sessionStorage.setItem('cart', ids.toString());
            }

            sendCart(function(result) {
                if (result === true) {
                    console.log('successfully sent cart to db.');
                } else {
                    console.log('cart not successfully sent to db.');
                    $('#go-to-step-two').prop('disabled', true);
                }
            });
        });
    }

    $('#go-to-step-two').click(function() {
        // if anything is null then alert, else submit a post with donor info
        // if (checkForm(document.getElementById('donor-info'))) {
        //     if (sessionStorage.getItem('cart') === null ||
        //                sessionStorage.getItem('cart') === '') {
        //         alert('no hay niños en el carrito.');
        //     } else {
        //         var donor = {};
        //         if (sessionStorage.getItem('id') != null) {
        //             donor = {
        //                 'donor_id': sessionStorage.getItem('id'),
        //                 'password': document.getElementById('form-password').value
        //             };
        //         } else if (sessionStorage.getItem('assignedDonorID') != null) {
        //             donor = {
        //                 'assigned_donor_id': sessionStorage.getItem('assignedDonorID'),
        //                 'nombre': document.getElementById('form-first-name').value,
        //                 'apellido': document.getElementById('form-last-name').value,
        //                 'teléfono': document.getElementById('form-phone').value,
        //                 'calle': document.getElementById('form-address-street').value,
        //                 'ciudad': document.getElementById('form-address-city').value,
        //                 'país': document.getElementById('form-country').value,
        //                 'correo_electrónico': document.getElementById('form-email').value,
        //                 'password': document.getElementById('form-password').value
        //             };
        //         }
        //         // POST /api/v1/donor/sponsor
        //         var insert = $.ajax({
        //             url: '/api/v1/donor/sponsor',
        //             type: 'POST',
        //             data: donor
        //         });

        //         insert.success(function(res) {
        //             if(res.success === true) {
        //                 stepTwo();
        //             }
        //         });

        //         insert.error(function(httpObj) {
        //             var mongoError = JSON.parse(httpObj.responseText);
        //             // email already exists exeption
        //             if (httpObj.status === 409 && mongoError.code === 11000) {
        //                 alert('el correo electrónico ya está asociada a una cuenta.');
        //             }
        //         });
        //     }
        // }
        stepTwo();
    });

    function stepOne() {
        $('#donor-info-form').show();
        $('#go-to-step-two').show();
        $('#delete-child-button').show();
        $('#donor-credit-form').hide();
        $('#go-to-step-three').hide();
        $('#go-back-to-step-one').hide();
    }

    function stepTwo() {
        // delete the donor form and the go to step 2 button
        $('#donor-info-form').hide();
        $('#go-to-step-two').hide();
        $('#delete-child-button').hide();
        $('#donor-credit-form').show();
        $('#go-to-step-three').show();
        $('#go-back-to-step-one').show();
        $('#go-to-step-three').click(stepThree);
        $('#go-back-to-step-one').click(stepOne);

        // show the credit form and add naviagtion buttons
        /*
        $('#donor-credit-form').show();
        var aTag1 = document.createElement('a');
        var aTag2 = document.createElement('a');
        var stepTwoContinueButton = document.createElement('button');
        var stepTwoBackButton = document.createElement('button');
        stepTwoContinueButton.id = 'go-to-step-three';
        stepTwoBackButton.id = 'go-back-to-step-two';
        stepTwoContinueButton.type = 'button';
        stepTwoBackButton.type = 'button';
        stepTwoContinueButton.className = 'btn btn-primary btn-md pull-right';
        stepTwoBackButton.className = 'btn btn-primary btn-md pull-right';
        stepTwoContinueButton.appendChild(document.createTextNode('Continuar'));
        stepTwoBackButton.appendChild(document.createTextNode('Anterior'));
        stepTwoContinueButton.onclick = function() {
            stepThree();
        }
        stepTwoBackButton.onclick = function() {
            goBackToStepOne();
        }
        aTag1.appendChild(stepTwoContinueButton);
        aTag2.appendChild(stepTwoBackButton);
        document.getElementById('donor-credit-form').appendChild(aTag1);
        document.getElementById('donor-credit-form').appendChild(aTag2);
        */
    }

    //confirm sponsorship details before submitting
    function stepThree() {
        //hide elements from step twp
        $('#donor-credit-form').hide();
        $('#go-back-to-step-one').hide();
        $('#go-to-step-three').hide();
        //change header
        document.getElementById('right-header').innerHTML = 'Confirm Your Information';
        $('#donor-info-confirmation').show();
        $('#go-back-to-step-two').show();
        $('#submit-sponsorship').show()
        $('.password').hide();
        $('.confirm-password').hide();

        console.log('congrats you\'re at step three');

        // displaySuccess();
    }

    $('#go-back-to-step-two').click(function() {
        $('#go-back-to-step-two').hide();
        $('#submit-sponsorship').hide();
        $('#donor-info-confirmation').hide();
        document.getElementById('right-header').innerHTML = 'Datos de Facturación';
        stepTwo();
    });

    // Displays Success Page after ajax call
    function displaySuccess (){
        // empty child _id's from session storage cart
        sessionStorage.setItem('cart', '');

        $('#children-to-sponsor').remove();
        $('#donor-info').remove();

        var centerDiv = document.createElement('div');
        var h1Thing = document.createElement('h1');
        var pThing = document.createElement('p');

        centerDiv.className = 'center';
        h1Thing.innerHTML = '¡Muchas gracias!';
        pThing.innerHTML = 'Usted ha cambiado la vida de un niño hoy.';
        h1Thing.appendChild(pThing);
        centerDiv.appendChild(h1Thing);

        $('.content').append(centerDiv);
    }

    /* If there is a login token in session storage
     * then the form should be auto-populated with
     * the donors information
     */
    function autoPopulate () {
        if (sessionStorage.getItem('token') != null && sessionStorage.getItem('token') != '') {
            $.ajax({
                url: '/api/v1/donor/id/' + sessionStorage.getItem('id'),
                type: 'POST',
                data: {
                    'token' : sessionStorage.getItem('token')
                },
                success: function(res) {
                    $('#form-first-name').val(res.nombre);
                    $('#form-first-name').prop('disabled', true);
                    $('#form-last-name').val(res.apellido);
                    $('#form-last-name').prop('disabled', true);
                    $('#form-phone').val(res.teléfono);
                    $('#form-phone').prop('disabled', true);
                    $('#form-address-street').val(res.calle);
                    $('#form-address-street').prop('disabled', true);
                    $('#form-address-city').val(res.ciudad);
                    $('#form-address-city').prop('disabled', true);
                    $('#form-email').val(res.correo_electrónico);
                    $('#form-email').prop('disabled', true);
                    $('#form-country').prop('disabled', true);
                },
                error: function(res) {
                    alert('Your session has expired. Please login again.');
                    // if getting in here that means that the id and token has
                    // been set but it's since expired. nuke everything and
                    // make them login again.
                    if (sessionStorage.getItem('token') != null && sessionStorage.getItem('token') != '') {
                        sessionStorage.removeItem('token');
                    }
                    if (sessionStorage.getItem('cart') != null && sessionStorage.getItem('cart') != '') {
                        sessionStorage.removeItem('cart');
                    }
                    if (sessionStorage.getItem('id') != null && sessionStorage.getItem('id') != '') {
                        sessionStorage.removeItem('id');
                    }
                    // this shouldn't be set but check anyway
                    if (sessionStorage.getItem('assignedDonorID') != null && sessionStorage.getItem('assignedDonorID') != '') {
                        sessionStorage.removeItem('assignedDonorID');
                    }
                    window.location = 'children.html';
                }
            });
        }
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
        if (checkForm(document.getElementById('create-account-form'))) {
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
                    'nombre': document.getElementById('create-account-first-name').value,
                    'apellido': document.getElementById('create-account-last-name').value,
                    'teléfono': document.getElementById('create-account-phone').value,
                    'calle': document.getElementById('create-account-address-street').value,
                    'ciudad': document.getElementById('create-account-address-city').value,
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
                                'correo_electrónico': document.getElementById('create-account-email').value,
                                'password': document.getElementById('create-account-password').value
                            },
                            success: function() {
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
                    if (res.status === 200) {
                        alert('Please check your email for your temporary password');
                        toggleLogin();
                    }
                },
                error: function(httpObj) {
                    if(httpObj.status === 401) {
                        alert('correo o contraseña incorrectos.');
                    } else {
                        console.log(JSON.stringify(httpObj));
                        alert('see console for error info.');
                    }
                }
            });
        } else {
            alert('Please enter your email into the email field before clicking Forgot Password');
        }
    });

    $(document).ready(autoPopulate());
});
