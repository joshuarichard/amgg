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

        var worked = false;
        // on successful login, save token and donor id
        // in session storage and go to the donor portal
        loginRequest.success(function(res) {
            //save login token to session storage
            sessionStorage.setItem('token', res.token);
            sessionStorage.setItem('id', res.id);
            worked = true;
        });

        // on login error, check error and inform user accordingly
        loginRequest.error(function(httpObj, textStatus) {
            if(httpObj.status === 401) {
                alert('correo o contraseña incorrectos.');
            } else {
                console.log(JSON.stringify(httpObj));
                alert('see console for error info.');
            }
            worked = false;
        });

        loginRequest.complete(function() {
            if (worked === true) {
                window.location = '/views/account.html';
            }
        });
    }
}
