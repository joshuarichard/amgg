/* Create account function for AMGG website
 * 
 * Creates a new donor with the information from the form
 *
 * requires formValidation.js for form checking (checkForm(form))
 */
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