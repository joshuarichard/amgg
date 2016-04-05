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