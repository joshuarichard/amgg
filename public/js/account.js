/* eslint-env browser */
/* eslint no-undef: 0 */

$(document).ready(function() {
    /* get the element to put the tabs in */
    var container = document.getElementById('tab-content');

    /* check to see that there is a login token
     *   if not, prompt user to login
     */
    if (sessionStorage.getItem('token') != null && sessionStorage.getItem('token') != '') {

        /* create the tabs */
        var tabA = document.createElement('div');
        tabA.id = 'sectionA';
        tabA.className = 'tab-pane fade in active';
        var tabB = document.createElement('div');
        tabB.id = 'sectionB';
        tabB.className = 'tab-pane fade in';
        var tabC = document.createElement('div');
        tabC.id = 'sectionC';
        tabC.className = 'tab-pane fade in';

        /* create the content for tabA */
        var tabAHeader = document.createElement('span');
        tabAHeader.className = 'header';
        tabAHeader.innerHTML = 'niños apadrinados';

        var tabAHeaderhr = document.createElement('hr');
        tabA.appendChild(tabAHeader);
        tabA.appendChild(tabAHeaderhr);

        //create table that will contain a child
        var table = document.createElement('table');
        table.className = 'table table-hover child-selections';
        var tbody = document.createElement('tbody');

        // recreate pending spinner and add to page
        spinnerDiv = document.createElement('div');
        bounceDiv1 = document.createElement('div');
        bounceDiv2 = document.createElement('div');
        bounceDiv3 = document.createElement('div');

        spinnerDiv.className = 'spinner';
        bounceDiv1.className = 'bounce1';
        bounceDiv2.className = 'bounce2';
        bounceDiv3.className = 'bounce3';

        spinnerDiv.appendChild(bounceDiv1);
        spinnerDiv.appendChild(bounceDiv2);
        spinnerDiv.appendChild(bounceDiv3);

        tabA.appendChild(spinnerDiv, tabA.childNodes[0]);

        /*
         * create content for tabC
         * We have to create tabC before tabB becuase we will be
         * appending info from DB to elements in tabC
         * this will save us from having to send another request to
         * the DB when creating tabC
         */
        //create header
        tabCHeader = document.createElement('span');
        tabCHeader.className = 'header';
        tabCHeader.innerHTML = 'Letter to Child';
        // eslint says this is never being used... is it needed?
        // var tabCHeaderhr = document.createElement('hr');
        //create letter form
        var letterForm = document.createElement('form');
        letterForm.className = 'letter-form col-md-10';
        var letter = document.createElement('textarea');
        letter.className = 'letter';
        var submitLetter = document.createElement('button');
        submitLetter.className = 'letter-submit pull-right';
        submitLetter.title = 'Send letter to your sponsored child';
        submitLetter.innerHTML = 'Send';

        //create child select table
        var childrenSelectContainer = document.createElement('div');
        childrenSelectContainer.className = 'col-md-2';

        letterForm.appendChild(letter);
        letterForm.appendChild(submitLetter);
        tabC.appendChild(tabCHeader);
        tabC.appendChild(tabAHeaderhr);
        tabC.appendChild(letterForm);
        tabC.appendChild(childrenSelectContainer);

        /* get children using donor id */
        $.ajax({
            url: '/api/v1/donor/id/' + sessionStorage.getItem('id'),
            type: 'POST',
            data: {
                'token' : sessionStorage.getItem('token'),
                'id' : sessionStorage.getItem('id')
            },
            success: function(res) {
                if (res.hasOwnProperty('niños_patrocinadoras')) {
                    if (res.niños_patrocinadoras.length > 0) {
                        for (var i = 0; i < res.niños_patrocinadoras.length; i++) {
                            var id = res.niños_patrocinadoras[i];
                            addChildToDonorList(id);
                            tabA.appendChild(table);
                        }
                    } else {
                        $('.spinner').remove();
                    }
                } else {
                    $('.spinner').remove();
                }

            },
            error: function() {
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

        /* Create content for tabB */
        $.ajax({
            url: '/api/v1/donor/id/' + sessionStorage.getItem('id'),
            type: 'POST',
            data: {
                'token' : sessionStorage.getItem('token'),
                'id' : sessionStorage.getItem('id')
            },
            success: function(res) {
                /* create content for tabB */
                var infoWrapper = document.createElement('div');
                infoWrapper.id = 'tabB-content';
                infoWrapper.className = 'content-wrapper row row-centered';
                //tabB header
                tabBHeader = document.createElement('span');
                tabBHeader.className = 'header';
                tabBHeader.innerHTML = 'datos de facturación';
                var tabBHeaderhr = document.createElement('hr');

                //create container for user info
                var userInfoContainer = document.createElement('div');
                userInfoContainer.className = 'user-info-container col-md-10';

                //create container for buttons to the right of user info
                var userInfoSidebar = document.createElement('div');
                userInfoSidebar.className = 'user-info-sidebar col-md-2';

                //create first name
                var firstNameGroup = document.createElement('div');
                firstNameGroup.className = 'form-group';
                var firstNameLabel = document.createElement('label');
                firstNameLabel.className = 'col-md-4 control-label';
                firstNameLabel.innerHTML = 'Nombre';
                var firstNameWrapper = document.createElement('div');
                firstNameWrapper.className = 'info-form col-md-6';
                var firstName = document.createElement('input');
                firstName.id = 'form-first-name';
                firstName.className = 'form-control';
                firstName.type = 'text';
                firstName.name = 'first-name';
                firstName.value = res.nombre;

                //combine everything into one element
                firstNameWrapper.appendChild(firstName);
                firstNameGroup.appendChild(firstNameLabel);
                firstNameGroup.appendChild(firstNameWrapper);

                //create last name
                var lastNameGroup = document.createElement('div');
                lastNameGroup.className = 'form-group';
                var lastNameLabel = document.createElement('label');
                lastNameLabel.className = 'col-md-4 control-label';
                lastNameLabel.innerHTML = 'Apellido';
                var lastNameWrapper = document.createElement('div');
                lastNameWrapper.className = 'info-form col-md-6';
                var lastName = document.createElement('input');
                lastName.id = 'form-last-name';
                lastName.className = 'form-control';
                lastName.type = 'text';
                lastName.name = 'last-name';
                lastName.value = res.apellido;

                //combine everything into one element
                lastNameWrapper.appendChild(lastName);
                lastNameGroup.appendChild(lastNameLabel);
                lastNameGroup.appendChild(lastNameWrapper);

                //create phone number
                var phoneGroup = document.createElement('div');
                phoneGroup.className = 'form-group';
                var phoneLabel = document.createElement('label');
                phoneLabel.className = 'col-md-4 control-label';
                phoneLabel.innerHTML = 'Tel&#233;fono';
                var phoneWrapper = document.createElement('div');
                phoneWrapper.className = 'info-form col-md-6';
                var phone = document.createElement('input');
                phone.id = 'form-phone';
                phone.className = 'form-control';
                phone.type = 'text';
                phone.name = 'phone';
                phone.value = res.teléfono;

                //combine everything into one element
                phoneWrapper.appendChild(phone);
                phoneGroup.appendChild(phoneLabel);
                phoneGroup.appendChild(phoneWrapper);

                //create email
                var emailGroup = document.createElement('div');
                emailGroup.className = 'form-group';
                var emailLabel = document.createElement('label');
                emailLabel.className = 'col-md-4 control-label';
                emailLabel.innerHTML = 'Correo Electrónico';
                var emailWrapper = document.createElement('div');
                emailWrapper.className = 'info-form col-md-6';
                var email = document.createElement('input');
                email.id = 'form-email';
                email.className = 'form-control';
                email.type = 'text';
                email.name = 'email';
                email.value = res.correo_electrónico;

                //combine everything into one element
                emailWrapper.appendChild(email);
                emailGroup.appendChild(emailLabel);
                emailGroup.appendChild(emailWrapper);

                //create street
                var streetGroup = document.createElement('div');
                streetGroup.className = 'form-group';
                var streetLabel = document.createElement('label');
                streetLabel.className = 'col-md-4 control-label';
                streetLabel.innerHTML = 'Dirección';
                var streetWrapper = document.createElement('div');
                streetWrapper.className = 'info-form col-md-6';
                var street = document.createElement('input');
                street.id = 'form-street';
                street.className = 'form-control';
                street.type = 'text';
                street.name = 'street';
                street.value = res.calle;

                //combine everything into one element
                streetWrapper.appendChild(street);
                streetGroup.appendChild(streetLabel);
                streetGroup.appendChild(streetWrapper);

                //create city
                var cityGroup = document.createElement('div');
                cityGroup.className = 'form-group';
                var cityLabel = document.createElement('label');
                cityLabel.className = 'col-md-4 control-label';
                var cityWrapper = document.createElement('div');
                cityWrapper.className = 'info-form col-md-6';
                var city = document.createElement('input');
                city.id = 'form-city';
                city.className = 'form-control';
                city.type = 'text';
                city.name = 'city';
                city.value = res.ciudad;

                //combine everything into one element
                cityWrapper.appendChild(city);
                cityGroup.appendChild(cityLabel);
                cityGroup.appendChild(cityWrapper);

                //create old password form
                var oldPasswordGroup = document.createElement('div');
                oldPasswordGroup.className = 'form-group';
                var oldPasswordLabel = document.createElement('label');
                oldPasswordLabel.className = 'col-md-4 control-label';
                oldPasswordLabel.innerHTML = 'Old Password';
                var oldPasswordWrapper = document.createElement('div');
                oldPasswordWrapper.className = 'info-form col-md-6';
                var oldPassword = document.createElement('input');
                oldPassword.id = 'form-old-password';
                oldPassword.className = 'form-control password-form';
                oldPassword.type = 'password';

                //combine password elements into one element
                oldPasswordWrapper.appendChild(oldPassword);
                oldPasswordGroup.appendChild(oldPasswordLabel);
                oldPasswordGroup.appendChild(oldPasswordWrapper);

                //create password form
                var contraseñaGroup = document.createElement('div');
                contraseñaGroup.className = 'form-group';
                var contraseñaLabel = document.createElement('label');
                contraseñaLabel.className = 'col-md-4 control-label';
                contraseñaLabel.innerHTML = 'Contraseña';
                var contraseñaWrapper = document.createElement('div');
                contraseñaWrapper.className = 'info-form col-md-6';
                var contraseña = document.createElement('input');
                contraseña.id = 'form-contraseña';
                contraseña.className = 'form-control password-form';
                contraseña.type = 'password';

                //combine password elements into one element
                contraseñaWrapper.appendChild(contraseña);
                contraseñaGroup.appendChild(contraseñaLabel);
                contraseñaGroup.appendChild(contraseñaWrapper);

                //create confirm password form
                var confirmarContraseñaGroup = document.createElement('div');
                confirmarContraseñaGroup.className = 'form-group';
                var confirmarContraseñaLabel = document.createElement('label');
                confirmarContraseñaLabel.className = 'col-md-4 control-label';
                confirmarContraseñaLabel.innerHTML = 'Confirmar Contraseña';
                var confirmarContraseñaWrapper = document.createElement('div');
                confirmarContraseñaWrapper.className = 'info-form col-md-6';
                var confirmarContraseña = document.createElement('input');
                confirmarContraseña.id = 'form-confirmarContraseña';
                confirmarContraseña.className = 'form-control password-form';
                confirmarContraseña.type = 'password';

                //combine password elements into one element
                confirmarContraseñaWrapper.appendChild(confirmarContraseña);
                confirmarContraseñaGroup.appendChild(confirmarContraseñaLabel);
                confirmarContraseñaGroup.appendChild(confirmarContraseñaWrapper);

                //submit button for password changes
                var submitContainer = document.createElement('div');
                submitContainer.className = 'col-md-11';
                var submitPasswordChanges = document.createElement('button');
                submitPasswordChanges.id = 'submit-new-password';
                submitPasswordChanges.className = 'btn btn-primary btn-sm pull-right';
                submitPasswordChanges.innerHTML = 'submit password';
                submitContainer.appendChild(submitPasswordChanges)

                //combine the password elements into one block so we can target them together with css
                var contraseñaContainer = document.createElement('div');
                contraseñaContainer.className = 'contraseña-container';
                contraseñaContainer.style.display = 'none';
                contraseñaContainer.appendChild(oldPasswordGroup);
                contraseñaContainer.appendChild(contraseñaGroup);
                contraseñaContainer.appendChild(confirmarContraseñaGroup);
                contraseñaContainer.appendChild(submitContainer);

                //append content to tab B
                infoWrapper.appendChild(tabBHeader);
                infoWrapper.appendChild(tabBHeaderhr);
                userInfoContainer.appendChild(firstNameGroup);
                userInfoContainer.appendChild(lastNameGroup);
                userInfoContainer.appendChild(phoneGroup);
                userInfoContainer.appendChild(emailGroup);
                userInfoContainer.appendChild(streetGroup);
                userInfoContainer.appendChild(cityGroup);
                userInfoContainer.appendChild(contraseñaContainer);

                // delete account button
                var deleteAccountButton = document.createElement('button');
                deleteAccountButton.className = 'btn btn-danger btn-sm';
                deleteAccountButton.appendChild(document.createTextNode('delete account'));
                userInfoSidebar.appendChild(deleteAccountButton);

                //change password button
                var changePasswordButton = document.createElement('button');
                changePasswordButton.id = 'change-password-button';
                changePasswordButton.className = 'btn btn-success btn-sm';
                changePasswordButton.appendChild(document.createTextNode('change password'));
                userInfoSidebar.appendChild(changePasswordButton);

                //toggle the password form
                changePasswordButton.onclick = function() {
                    if (contraseñaContainer.style.display === 'none') {
                        // if the edit info submit button is there, we want to remove it and replace if
                        // with the new password changes submit button
                        if (document.getElementById('edit-info-submit') != null) {
                            $('#edit-info-submit').remove();
                        }
                        contraseñaContainer.style.display = 'block';
                    }
                    else {
                        contraseñaContainer.style.display = 'none';
                    }   
                }

                // check that their old password is correct, then update donor
                // doc with new password
                submitPasswordChanges.onclick = function() {
                    var password = document.getElementById('form-old-password').value
                    $.ajax({
                        url: '/api/v1/donor/auth',
                        type: 'POST',
                        data: {
                            'correo_electrónico': document.getElementById('form-email').value,
                            'password': password
                        },
                        success: function(res) {
                            //update the users token and id which will reset their session timer
                            sessionStorage.setItem('token', res.token);
                            sessionStorage.setItem('id', res.id);

                            //make sure their new password is not '' and make sure
                            //the two passwords match, then send new password to db
                            if (password !== confirmPassword) {
                                alert('las contraseñas no coinciden.');
                            } else if (password === '') {
                                alert('por favor ingrese una contraseña.');) 
                            }
                            else{
                                $.ajax({
                                    url: '/api/v1/donor/id/' + sessionStorage.getItem('id'),
                                    type: 'PUT',
                                    data: {
                                        'token' : sessionStorage.getItem('token'),
                                        'changes' : {
                                            'password': document.getElementById('form-contraseña').value
                                        }
                                    },
                                    success: function(res) {
                                        console.log(res);
                                        alert('Password successful changed');
                                    },
                                    error: function(res) {
                                        alert('Something went wrong when submitting your new password');
                                    }
                                });
                            }
                        },
                        error: function() {
                            alert('Something went wrong when trying to authenticate your old password');
                        }
                    });
                };

                // set on click button function
                deleteAccountButton.onclick = function() {
                    var yesUnsponsor = confirm('Are you sure you want to delete your account?');
                    if (yesUnsponsor == true) {
                        $.ajax({
                            url: '/api/v1/donor/delete',
                            type: 'POST',
                            data: {
                                'token' : sessionStorage.getItem('token'),
                                'donor_id' : sessionStorage.getItem('id')
                            },
                            success: function(res) {
                                if (res.success === true) {
                                    alert('your request for the removal of your account has been submitted. you will receive an email when the process has been completed.');
                                }
                            },
                            error: function() {
                                alert('your request was not received. please try again.');
                            }
                        });
                    }
                };

                infoWrapper.appendChild(userInfoContainer);
                infoWrapper.appendChild(userInfoSidebar);
                tabB.appendChild(infoWrapper);

                infoChange();
            }
        });

        //append tabs to the page
        container.appendChild(tabA);
        container.appendChild(tabB);
        container.appendChild(tabC);
    } else {
        console.log('No login information found, please login');
        document.getElementById('myTab').remove();
        alert('entra en la cuenta para acceder a esta página.');
    }

    function submitInfoChanges() {
        $.ajax({
            url: '/api/v1/donor/id/' + sessionStorage.getItem('id'),
            type: 'PUT',
            data: {
                'token' : sessionStorage.getItem('token'),
                'changes' : {
                    'nombre': document.getElementById('form-first-name').value,
                    'apellido': document.getElementById('form-last-name').value,
                    'teléfono': document.getElementById('form-phone').value,
                    'calle': document.getElementById('form-street').value,
                    'ciudad': document.getElementById('form-city').value,
                    'correo_electrónico': document.getElementById('form-email').value
                }
            },
            success: function(res) {
                console.log(res);
                // TODO: need to actually confirm success from the res here
                alert('Su información ha sido actualizada.');
            },
            error: function(res) {
                if (res.status === 409) {
                    alert('el correo electrónico ya está asociada a una cuenta.');
                }

                //put old info back in
                $.ajax({
                    url: '/api/v1/donor/id/' + sessionStorage.getItem('id'),
                    type: 'POST',
                    data: {
                        'token' : sessionStorage.getItem('token'),
                        'id' : sessionStorage.getItem('id')
                    },
                    success: function(res) {
                        document.getElementById('form-first-name').value = res.nombre;
                        document.getElementById('form-last-name').value = res.apellido;
                        document.getElementById('form-phone').value = res.teléfono;
                        document.getElementById('form-email').value = res.correo_electrónico;
                        document.getElementById('form-street').value = res.calle;
                        document.getElementById('form-city').value = res.ciudad;
                    }
                });
            }
        });
    }

    function createButton () {
        if ($('.contraseña-container').css('display') == 'block') {
            $('.contraseña-container').hide();
        }
        var editInfoSubmit = document.createElement('button');
        editInfoSubmit.id = 'edit-info-submit';
        editInfoSubmit.className = 'col-md-12 btn btn-primary pull-right';
        editInfoSubmit.innerHTML = 'enviar';
        editInfoSubmit.title = 'submit changes to your information';
        editInfoSubmit.onclick = function() {
            submitInfoChanges();
        };
        $('#tabB-content').append(editInfoSubmit);
    }

    function infoChange () {
        var nameInput = document.getElementById('form-first-name');
        nameInput.oninput = function() {
            if (document.getElementById('edit-info-submit')) {
                return;
            } else {
                createButton();
            }
        };
        var lastNameInput = document.getElementById('form-last-name');
        lastNameInput.oninput = function() {
            if (document.getElementById('edit-info-submit')) {
                return;
            } else {
                createButton();
            }
        };
        var phoneInput = document.getElementById('form-phone');
        phoneInput.oninput = function() {
            if (document.getElementById('edit-info-submit')) {
                return;
            } else {
                createButton();
            }
        };
        var emailInput = document.getElementById('form-email');
        emailInput.oninput = function() {
            if (document.getElementById('edit-info-submit')) {
                return;
            } else {
                createButton();
            }
        };
        var streetInput = document.getElementById('form-street');
        streetInput.oninput = function() {
            if (document.getElementById('edit-info-submit')) {
                return;
            } else {
                createButton();
            }
        };
        var cityInput = document.getElementById('form-city');
        cityInput.oninput = function() {
            if (document.getElementById('edit-info-submit')) {
                return;
            } else {
                createButton();
            }
        };
    }

    function addChildToDonorList(id) {
        // create child's table row
        var tr = document.createElement('tr');

        function pic(id, callback) {
            //create elements for child picture
            var picTD = document.createElement('td');
            var picIMG = document.createElement('img');
            picIMG.className = 'child-img';

            //get child picture
            $.getJSON('/api/v1/pictures/id/' + id, function(res) {
                if (res.data.hasOwnProperty('err')){
                    console.log(res.data.err);
                } else if (res.data !== undefined) {
                    picIMG.src = 'data:image/image;base64,' + res.data;
                    picTD.appendChild(picIMG);
                    tr.appendChild(picTD);
                    callback(true);
                }
            });
        }

        function data(id, callback) {
            // get child data using api
            $.getJSON('/api/v1/children/id/' + id, function(res) {
                if(res.hasOwnProperty('err')) {
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
                    nameDiv.innerHTML = '<b> nombre: </b>' + name;
                    ageDiv.innerHTML = '<b> años:  </b>' + age;
                    birthdayDiv.innerHTML = '<b> cumpleaños:  </b>' + birthday;
                    genderDiv.innerHTML = '<b> género:  </b>' + gender;
                    provinciaDiv.innerHTML = '<b> provincia: </b>' + provincia;
                    centerDiv.innerHTML = '<b> centro de ninos:  </b>' + center;
                    aficionesDiv.innerHTML = '<b> aficiones: </b>' + aficiones;

                    // append children to div
                    dataTD.appendChild(nameDiv);
                    dataTD.appendChild(ageDiv);
                    dataTD.appendChild(birthdayDiv);
                    dataTD.appendChild(genderDiv);
                    dataDiv.appendChild(dataTD);
                    dataTD.appendChild(provinciaDiv);
                    dataTD.appendChild(centerDiv);
                    dataTD.appendChild(aficionesDiv);

                    //append child info
                    tr.appendChild(dataDiv);

                    //also create child list for tabC
                    var inputGroup = document.createElement('div');
                    inputGroup.className = 'input-group';
                    var inputGroupSpan = document.createElement('span');
                    inputGroupSpan.className = 'input-group-btn';
                    var selectChild = document.createElement('button');
                    selectChild.className = 'btn btn-primary child-letter-select';
                    selectChild.type = 'button';
                    // this will change the header on tabC based on the child selected
                    selectChild.onclick = function() {
                        tabCHeader.innerHTML = 'Letter to ' + this.innerHTML;
                    };
                    selectChild.innerHTML = name;
                    inputGroupSpan.appendChild(selectChild);
                    inputGroup.appendChild(inputGroupSpan);
                    childrenSelectContainer.appendChild(selectChild);

                    callback(true);
                }
            });
        }

        pic(id, function(success) {
            if(success === true) {
                // then append data
                data(id, function(success)  {
                    if(success === true) {
                        $('.spinner').remove();

                        var buttonTD = document.createElement('td');

                        // remove child sponsorship button
                        // create button, add classname for styling, append text
                        var button = document.createElement('button');
                        button.className = 'btn btn-primary btn-sm';
                        button.appendChild(document.createTextNode('eliminar'));

                        // set on click button function
                        button.onclick = function() {
                            var yesUnsponsor = confirm('Are you sure you want to remove your sponsorship for this child?');
                            if (yesUnsponsor == true) {
                                $.ajax({
                                    url: '/api/v1/donor/unsponsor',
                                    type: 'POST',
                                    data: {
                                        'token' : sessionStorage.getItem('token'),
                                        'donor_id' : sessionStorage.getItem('id'),
                                        'child_id': button.parentNode.parentNode.id
                                    },
                                    success: function(res) {
                                        if (res.success === true) {
                                            alert('your request for the removal of your sponsorship has been submitted. you will receive an email when the process has been completed.');
                                            button.disabled = true;
                                            button.title = 'Your request has been received, please wait for it to be processed by an AMG admin';
                                        }
                                    },
                                    error: function() {
                                        alert('your request was not received. please try again.');
                                    }
                                });
                            }
                        };

                        // add button to table entry and add table entry to row
                        buttonTD.appendChild(button);
                        tr.appendChild(buttonTD);
                        tbody.appendChild(tr);
                        table.appendChild(tbody);
                    }
                });
            }
        });
    }

    if (sessionStorage.getItem('token') != null && sessionStorage.getItem('token') != '') {
        document.getElementById('toggle-login').href = 'children.html';
        document.getElementById('toggle-login').innerHTML = 'Logout';
        $('#toggle-login').click(logout);
    } else {
        /* When login link is clicked, call toggleLogin */
        $('#toggle-login').click(toggleLogin);

        /* When the log in button is clicked, validate credentials
           and if valid send the user to account.html and but the
           token returned by server into session storage */
        $('.login-submit').click(login);
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
        loginRequest.error(function(httpObj) {
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
                window.location = 'account.html';
            }
        });
    }

    function logout() {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('id');
    }
});
