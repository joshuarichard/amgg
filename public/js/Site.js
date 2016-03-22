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
                success: function(res) {
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
                            alert("Your account has successful been created, you are now logged in");
                        },
                        error: function(res) {
                            alert("Your account has been created but we were unable to log you in at this time, please try again later");
                        }
                    });
                },
                statusCode: {
                    404: function() {
                      alert( "page not found" );
                    },
                    409: function() {
                        alert("An account already exists under this email, please log in");
                    },
                    500: function() {
                        alert("An error occured, please try again or contact an admin");
                    }
                }
            });
        }
    }
}
$('.create-account-submit').click(createAccount);
$('.close-create-account-overlay').click(toggleCreateAccount);
