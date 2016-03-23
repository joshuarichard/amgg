/* eslint-env browser */
/* eslint no-undef: 0 */

$(document).ready(function() {
    if (sessionStorage.getItem('id') !== null && sessionStorage.getItem('id') !== '' &&
        sessionStorage.getItem('token') !== null && sessionStorage.getItem('token') !== '') {

        document.getElementById('toggle-login').href = 'account.html';
        document.getElementById('toggle-login').innerHTML = 'Mi Cuenta';

        var container = document.getElementById('children-to-sponsor');
        var table = document.createElement('table');
        table.className = 'table table-hover child-selections';
        var tbody = document.createElement('tbody');

        /*
        if (sessionStorage.getItem('cart') != null && sessionStorage.getItem('cart') != '') {
            var ids = sessionStorage.getItem('cart').split(',');
            for (var i = 0; i < ids.length; i++) {
                addChildToCart(ids[i]);
                container.appendChild(table);
            }
        } else {
            $('.spinner').remove();
        }
        */

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
    } else {
        window.location = 'children.html';
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

        // first insert pic
        pic(function(success) {
            if(success === true) {
                // then append data
                data(function(success)  {
                    if(success === true) {
                        tbody.appendChild(tr);
                        table.appendChild(tbody);
                    }
                });
            }
        });
    }

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

    $('#checkout-submit').click(function() {
        console.log('hi');
    });

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
        h1Thing.innerHTML = '¡Muchas gracias!';
        pThing.innerHTML = 'Usted ha cambiado la vida de un niño hoy.';
        h1Thing.appendChild(pThing);
        centerDiv.appendChild(h1Thing);

        $('.content').append(centerDiv);
    }
});
