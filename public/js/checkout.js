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

            $.getJSON('/api/v1/pictures/' + id, function(res) {
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
            $.getJSON('/api/v1/children/' + id, function(res) {
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
            var data = {
                'nombre': firstName,
                'apellido': lastName,
                'teléfono': phone,
                'correo_electrónico': email,
                'calle': street,
                'ciudad': city,
                'país': country
            };

            // insert donor, update children with sponsored flag and donor _id
            $.post('/api/v1/donors', data, function(result) {
                if(result.n + result.ok === 2) {
                    // get the _id of the donor just inserted.
                    // make use of the data var
                    $.getJSON('/api/v1/finddonor/' + JSON.stringify(data),
                        function(doc) {
                        // TODO: for loop should always just run once, just an
                        // easier way to get the donorId. make a check at the
                        // end that this only ran once, and log out to admin
                        // that a duplicate was inserted.
                            for (var donorId in doc) {
                                var ids = sessionStorage.getItem('cart')
                                                        .split(',');
                                // for each child in sessionStore add the donor
                                // _id
                                ids.forEach(function(id) {
                                    // TODO: right now donor_id is only going to
                                    // be a string. look into storing this as a
                                    // real ObjectId.
                                    var changes = {
                                        'changes': {
                                            'status': 'Sponsored',
                                            'donor_id': donorId
                                        }
                                    };
                                    // ajax PUT on /api/v1/children/:id with
                                    // changes
                                    $.ajax({
                                        url: '/api/v1/children/' + id,
                                        type: 'PUT',
                                        data: changes,
                                        // this success was happening even when
                                        // getting a "changes = null" error from
                                        // mongo. really need to look into http
                                        // response error codes (401, 404, etc.)
                                        success: function() {
                                            window.location = 'contribution.html';
                                        }
                                    });
                                });
                            }
                        });
                } else {
                    console.log('Something bad happened on donor insert.');
                }
            });
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
    /* eslint-disable */
    var addButton = document.createElement('button');
    addButton.className = 'btn btn-primary btn-md child-intro-btn-sponsor sponsor-button';
    addButton.onclick = function() {
        window.location = 'children.html';
    };
    /* eslint-enable */

    addButton.appendChild(document.createTextNode('agregar otro niño'));
    container.appendChild(addButton);
});
