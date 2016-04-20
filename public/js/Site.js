/*
* rwdImageMaps jQuery plugin v1.5
*
* Allows image maps to be used in a responsive design by recalculating the area coordinates to match the actual image size on load and window.resize
*
* Copyright (c) 2013 Matt Stow
* https://github.com/stowball/jQuery-rwdImageMaps
* http://mattstow.com
* Licensed under the MIT license
*/
;(function(a){a.fn.rwdImageMaps=function(){var c=this;var b=function(){c.each(function(){if(typeof(a(this).attr("usemap"))=="undefined"){return}var e=this,d=a(e);a("<img />").load(function(){var g="width",m="height",n=d.attr(g),j=d.attr(m);if(!n||!j){var o=new Image();o.src=d.attr("src");if(!n){n=o.width}if(!j){j=o.height}}var f=d.width()/100,k=d.height()/100,i=d.attr("usemap").replace("#",""),l="coords";a('map[name="'+i+'"]').find("area").each(function(){var r=a(this);if(!r.data(l)){r.data(l,r.attr(l))}var q=r.data(l).split(","),p=new Array(q.length);for(var h=0;h<p.length;++h){if(h%2===0){p[h]=parseInt(((q[h]/n)*100)*f)}else{p[h]=parseInt(((q[h]/j)*100)*k)}}r.attr(l,p.toString())})}).attr("src",d.attr("src"))})};a(window).resize(b).trigger("resize");return this}})(jQuery);

    /* Initialize updateCart and then call it
     * 1. If there is an id in sessionStorage then the user is logged in and
     *    we need to check the DB for a cart
     * 2. If not, check sessionStorage for a cart
     * 3. Otherwise leave the cart at its initialized 0 state
     */
    function updateCart() {
        if (inStorage('id')) {
            $.ajax({
                url: '/api/v1/donor/cart/id/' + sessionStorage.getItem('id'),
                type: 'GET',
                success: function(res) {
                    if (JSON.stringify(res) !== '{}') {
                        var kidsInCartInDB = [];
                        if (inStorage('cart')) {
                            var kidsInCartOnPage = sessionStorage.getItem('cart').split(',');
                            for (var key in res) {
                                kidsInCartInDB = res[key]['kids_in_cart'];
                                for (var c = 0; c < kidsInCartInDB.length; c++) {
                                    if (kidsInCartOnPage.indexOf(kidsInCartInDB[c]) === -1) {
                                        kidsInCartOnPage.push(kidsInCartInDB[c]);
                                    }
                                }
                                sessionStorage.setItem('cart', kidsInCartOnPage.toString());
                                $('.counter').html(' (' + sessionStorage.getItem('cart').split(',').length + ')');
                            }
                        } else {
                            for (key in res) {
                                kidsInCartInDB = res[key]['kids_in_cart'];
                                sessionStorage.setItem('cart', kidsInCartInDB.toString());
                                $('.counter').html(' (' + sessionStorage.getItem('cart').split(',').length + ')');
                            }
                        }
                    } else if (inStorage('cart')) {
                        $('.counter').html(' (' + sessionStorage.getItem('cart').split(',').length + ')');
                    }
                }
            });
        } else if (inStorage('cart')) {
            $('.counter').html(' (' + sessionStorage.getItem('cart').split(',').length + ')');
        }
    }
    updateCart();

    /* if the user is already logged in, change the login button
     * to a go to account page link, else create login overlay
     */
    if (sessionStorage.getItem('token') != null && sessionStorage.getItem('token') != '') {
        document.getElementById('toggle-login').href = '../views/account.html';
        document.getElementById('toggle-login').innerHTML = 'Mi Cuenta';
    } else {
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
                        alert('correo o contraseña incorrectos.');
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

    /* When the user clicks the create account link load the create
     * account overlay onto the DOM, hide the login overlay, and open
     * the create account overlay
     */
    $('.create-account').click(function() {
        $('#create-account-overlay').load('../views/createAccount.html', '', function() {
            $('.modal').modal('show');
            toggleLogin();
            $('.create-account-submit').click(createAccount);
        });
    });

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
            alert("Error: Por favor revise que usted haya ingresado y confirme su contraseña.");
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
                $('.modal').modal('hide');
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
                        document.getElementById('toggle-login').href = '../views/account.html';
                        document.getElementById('toggle-login').innerHTML = 'Mi Cuenta';
                        //notify user they are now logged into their new account
                        alert('Su cuenta ha sido creada exitosamente, su sesión ha iniciado.');

                        // clear create account form after the account is
                        // successfully created
                        $(':input', '#create-account-form').each(function() {
                            $(this).val('');
                        });
                    },
                    error: function() {
                        alert('Su cuenta ha sido creada pero no hemos podido conectarlo ahora, por favor intente de nuevo más tarde.');
                    }
                });
            },
            error: function() {
                $('.modal').modal('hide');
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

// helper function - check session storage element
function inStorage(object) {
    if (sessionStorage.getItem(object) !== null && sessionStorage.getItem(object) !== '') {
        return true;
    } else {
        return false;
    }
}
