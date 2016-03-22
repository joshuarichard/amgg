﻿/*
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

/* if the user is already logged in, change the login button
 * to a go to account page link, else create login overlay
 */
if (sessionStorage.getItem('token') != null && sessionStorage.getItem('token') != '') {
    document.getElementById('toggle-login').href = '/views/account.html';
    document.getElementById('toggle-login').innerHTML = 'Mi Cuenta';
} else {
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

    console.log(firstName);
    if(firstName.value == "") {
        alert("Error: First name cannot be blank!");
        firstName.focus();
        return false;
    } if(lastName.value == "") {
        alert("Error: Last name cannot be blank!");
        lastName.focus();
        return false;
    } else if(phone.value == "") {
        alert("Error: Phone number cannot be blank!");
        phone.focus();
        return false;
    } else if(street.value == "") {
        alert("Error: Street address cannot be blank!");
        street.focus();
        return false;
    } else if(city.value == "") {
        alert("Error: City cannot be blank!");
        city.focus();
        return false;
    } else if(email.value == "") {
        alert("Error: Email cannot be blank!");
        email.focus();
        return false;
    }
    else if(password.value != "" && password.value == confirmPassword.value) {
        if(password.value.length < 6) {
            alert("Error: Password must contain at least six characters!");
            password.focus();
            return false;
        }
        if(password.value == firstName.value || password.value == lastName.value) {
            alert("Error: Password must be different from your name!");
            password.focus();
            return false;
        }
        re = /[0-9]/;
        if(!re.test(password.value)) {
            alert("Error: password must contain at least one number (0-9)!");
            password.focus();
            return false;
        }
        re = /[a-z]/;
        if(!re.test(password.value)) {
            alert("Error: password must contain at least one lowercase letter (a-z)!");
            password.focus();
            return false;
        }
        re = /[A-Z]/;
        if(!re.test(password.value)) {
            alert("Error: password must contain at least one uppercase letter (A-Z)!");
            password.focus();
            return false;
        }
    } else {
        alert("Error: Please check that you've entered and confirmed your password!");
        password.focus();
        return false;
    }
    //form passed all constraints
    return true;
}

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
