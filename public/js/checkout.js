/* eslint-env browser */
/* eslint no-undef: 0 */

$(document).ready(function() {
    // get the element to put the table and create the table
    var container = document.getElementById('children-to-sponsor');
    var table = document.createElement('table');
    table.className = 'table table-hover child-selections';
    var tbody = document.createElement('tbody');

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
                    var birthday = monthNames[date.getMonth()] + ' ' +
                                     date.getDate() + ', ' + date.getFullYear();
                    var name = res[id].nombre;
                    var age = res[id].años;
                    var gender = res[id].género;
                    var center = res[id].centro_de_ninos;

                    // create elements for each piece of info
                    var dataDiv = document.createElement('td');
                    dataDiv.className = 'child-info-group';

                    var nameDiv = document.createElement('div');
                    var ageDiv = document.createElement('div');
                    var birthdayDiv = document.createElement('div');
                    var genderDiv = document.createElement('div');
                    var centerDiv = document.createElement('div');

                    // assign classes to those elements
                    nameDiv.className = 'child-info';
                    ageDiv.className = 'child-info';
                    birthdayDiv.className = 'child-info';
                    genderDiv.className = 'child-info';
                    centerDiv.className = 'child-info';

                    // assign values
                    nameDiv.innerHTML = '<b> nombre: </b>' + name;
                    ageDiv.innerHTML = '<b> años:  </b>' + age;
                    birthdayDiv.innerHTML = '<b> cumpleaños:  </b>' + birthday;
                    genderDiv.innerHTML = '<b> género:  </b>' + gender;
                    centerDiv.innerHTML = '<b> centro de ninos:  </b>' + center;

                    // append children to div
                    dataTD.appendChild(nameDiv);
                    dataTD.appendChild(ageDiv);
                    dataTD.appendChild(birthdayDiv);
                    dataTD.appendChild(genderDiv);
                    dataTD.appendChild(centerDiv);

                    // append dataTD to the dataDiv for styling, then append to
                    // row
                    dataDiv.appendChild(dataTD);
                    tr.appendChild(dataDiv);

                    callback(true);
                }
            });
        }

        function deleteButton(callback) {
            var buttonTD = document.createElement('td');

            // create button, add classname for styling, append text
            /* eslint-disable */
            var button = document.createElement('button');
            button.className = 'btn btn-primary btn-sm child-intro-btn-sponsor sponsor-button';
            button.appendChild(document.createTextNode('eliminar'));
            /* eslint-enable */

            // set on click button function
            button.onclick = function() {
                // remove child from sessionStorage
                var ids = sessionStorage.getItem('cart').split(',');
                var id = button.parentNode.parentNode.id;
                if (ids.indexOf(id) != -1) {
                    ids.splice(ids.indexOf(id), 1);
                    sessionStorage.setItem('cart', ids.toString());
                }

                // remove child from table
                button.parentNode.parentNode.remove();
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

    $('#checkout-submit').click(function() {
        // get all form info
        var firstName = document.getElementById('form-first-name').value;
        var lastName = document.getElementById('form-last-name').value;
        var phone = document.getElementById('form-phone').value;
        var street = document.getElementById('form-address-street').value;
        var city = document.getElementById('form-address-city').value;
        var country = document.getElementById('form-country').value;
        var email = document.getElementById('form-email').value;
        var password = document.getElementById('form-password').value;
        var confirmPassword = document.getElementById('form-password-confirm')
                                      .value;

        /* credit information - need to fix expiration so leaving out for now
        var credit = document.getElementById('form-credit').value;
        // expiration doesn't work? - jake any ideas?
        var expiration = document.getElementById('form-expiration-1').value +
                         '/' +
                         document.getElementById('form-expiration-2').value;
        var nameOnCard = document.getElementById('form-name-on-card').value;
        */

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
        /*
        if (credit === '') {
            nullFields.push('Credit field empty.');
        }
        if (expiration === '/') {
            nullFields.push('Expiration field is empty.');
        }
        if (nameOnCard === '') {
            nullFields.push('Name on card field empty.');
        }
        */

        // if anything is null then alert, else submit a post with donor info
        if (nullFields.length > 0) {
            var alertMessage = 'You are missing some fields: \n';
            for (var i = 0; i < nullFields.length; i++) {
                alertMessage += nullFields[i];
                alertMessage += '\n';
            }
            alert(alertMessage);
        } else {
            if (password !== confirmPassword) {
                alert('las contraseñas no coinciden.');
            } else if (password === '') {
                alert('por favor ingrese una contraseña.');
            } else if (sessionStorage.getItem('cart') === null ||
                       sessionStorage.getItem('cart') === '') {
                alert('no hay niños en el carrito.');
            } else {
                // POST /api/v1/donor/sponsor
                var insert = $.ajax({
                    url: '/api/v1/donor/sponsor',
                    type: 'POST',
                    data: {
                        'nombre': firstName,
                        'apellido': lastName,
                        'teléfono': phone,
                        'calle': street,
                        'ciudad': city,
                        'país': country,
                        'correo_electrónico': email,
                        'password': password,
                        'niños_patrocinadoras':
                                       sessionStorage.getItem('cart').split(',')
                    }
                });

                insert.success(function(res) {
                    if(res.success === true) {
                        if (displayed === false) {
                            displayed = true;
                            displaySuccess();
                        }
                    }
                });

                insert.error(function(httpObj) {
                    var mongoError = JSON.parse(httpObj.responseText);
                    // email already exists exeption
                    if (httpObj.status === 409 && mongoError.code === 11000) {
                        /* eslint-disable */
                        alert('el correo electrónico ya está asociada a una cuenta.');
                        /* eslint-enable */
                    }
                });
            }
        }
    });

    // insert all children in session storage into the cart
    if (sessionStorage.getItem('cart') != null &&
        sessionStorage.getItem('cart') != '') {
        var ids = sessionStorage.getItem('cart').split(',');
        for (var i = 0; i < ids.length; i++) {
            addChildToCart(ids[i]);
            container.appendChild(table);
        }
    }

    // after all that append the 'add a child' button
    var addButton = document.createElement('button');
    /* eslint-disable */
    addButton.className = 'btn btn-primary btn-md child-intro-btn-sponsor sponsor-button';
    /* eslint-enable */
    addButton.onclick = function() {
        window.location = 'children.html';
    };

    addButton.appendChild(document.createTextNode('agregar otro niño'));
    container.appendChild(addButton);

    /* if the user is already logged in, change the login button
     * to a go to account page link, else create login overlay
     */
    if (sessionStorage.getItem('token') != null && sessionStorage.getItem('token') != '') {
        document.getElementById('toggle-login').href = 'account.html';
        document.getElementById('toggle-login').innerHTML = 'Mi Cuenta';
    }
    else {
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
    } 

    var displayed = false;
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
        h1Thing.innerHTML = "¡Muchas gracias!";
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
        if (sessionStorage.getItem('token') != null &&
                sessionStorage.getItem('token') != '') {
            $.ajax({
                url: '/api/v1/donor/id/' + sessionStorage.getItem('id'),
                type: 'POST',
                data: {
                    'token' : sessionStorage.getItem('token'),
                    'id' : sessionStorage.getItem('id')
                },
                success: function(res) {
                    $('#form-first-name').val(res.data.nombre);
                    $('#form-first-name').prop('disabled', true);
                    $('#form-last-name').val(res.data.apellido);
                    $('#form-last-name').prop('disabled', true);
                    $('#form-phone').val(res.data.teléfono);
                    $('#form-phone').prop('disabled', true);
                    $('#form-address-street').val(res.data.calle);
                    $('#form-address-street').prop('disabled', true);
                    $('#form-address-city').val(res.data.ciudad);
                    $('#form-address-city').prop('disabled', true);
                    $('#form-email').val(res.data.correo_electrónico);
                    $('#form-email').prop('disabled', true);
                    $('#form-country').prop('disabled', true);
                },
                error: function() {
                    alert('Unable to retrieve your account information');
                }
            });
        }
        else {
            alert('You are not logged in, please log in to sponsor a child');
        }
    }
    $(document).ready(autoPopulate());
});
