/* eslint-env browser */
/* eslint no-undef: 0 */

$(document).ready(function() {
    function dummyLoad(id) {
        var monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo',
                          'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre',
                          'Noviembre', 'Diciembre'];

        $.getJSON('/api/v1/children/' + id, function(res) {
            var birthday = new Date(res[id].cumpleaños);
            document.getElementById('child-name').innerHTML = 'Nombre: ' +
                                                              res[id].nombre;

            document.getElementById('child-age').innerHTML = 'Años: ' +
                                                             res[id].años;

            document.getElementById('child-birthday').innerHTML = 'Cumpleaños: '
            + monthNames[birthday.getMonth()] + ' ' + birthday.getDate() + ' ' +
            birthday.getFullYear();

            document.getElementById('child-gender').innerHTML = 'Género: ' +
                                                                res[id].género;
            document.getElementById('child-center').innerHTML =
                                  'Centro De Ninos: ' + res[id].centro_de_ninos;
        });

        // get the picture and load it in
        $.ajax({
            type: 'GET',
            url: '/api/v1/pictures/' + id,
            beforeSend: function (xhr) {
                xhr.overrideMimeType('text/plain; charset=x-user-defined');
            },
            success: function (result, textStatus, jqXHR) {
                var data = jqXHR.responseText;
                $('#child-pic').attr('src', 'data:image/image;base64,'+ data);
            }
        });
    }

    $('#checkout-submit').click(function() {
        var firstName = document.getElementById('form-first-name').value;
        var lastName = document.getElementById('form-last-name').value;
        var phone = document.getElementById('form-phone').value;
        var email = document.getElementById('form-email').value;
        var street = document.getElementById('form-address-street').value;
        var city = document.getElementById('form-address-city').value;
        var country = document.getElementById('form-country').value;

        /* credit information - need to fix expiration so leaving out for now
        var credit = document.getElementById('form-credit').value;
        // expiration doesn't work? - jake any ideas?
        var expiration = document.getElementById('form-expiration-1').value +
                         '/' +
                         document.getElementById('form-expiration-2').value;
        var nameOnCard = document.getElementById('form-name-on-card').value;
        */

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

        if (nullFields.length > 0) {
            var alertMessage = 'You are missing some fields: \n';
            for (var i = 0; i < nullFields.length; i++) {
                alertMessage += nullFields[i];
                alertMessage += '\n';
            }
            alert(alertMessage);
        } else {
            var data = {
                'nombre': firstName,
                'apellido': lastName,
                'teléfono': phone,
                'correo_electrónico': email,
                'calle': street,
                'ciudad': city,
                'país': country
            };

            $.post('/api/v1/donor', data, function(result) {
                if(result.n + result.ok === 2) {
                    console.log('Donor inserted.');
                } else {
                    console.log('Something bad happened on donor insert.');
                }
            });
        }
    });

    dummyLoad('5690ae6d458367e8d28c5152');
});
