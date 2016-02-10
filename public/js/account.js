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

        //create the heading for tabA
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
        table.appendChild(tbody);
        tabA.appendChild(table);

        /* create content for tabB */
        var infoWrapper = document.createElement('div');
        infoWrapper.className = 'content-wrapper row row-centered';
        //tabB header
        tabBHeader = document.createElement('span');
        tabBHeader.className = 'header';
        tabBHeader.innerHTML = 'datos de facturación';
        var tabBHeaderhr = document.createElement('hr');
        //create first name
        var firstNameGroup = document.createElement('div');
        firstNameGroup.className = 'form-group';
        var firstNameLabel = document.createElement('label');
        firstNameLabel.className = 'col-md-4 control-label';
        firstNameLabel.innerHTML = 'Nombre';
        var firstNameWrapper = document.createElement('div');
        firstNameWrapper.className = 'col-md-8';
        var firstName = document.createElement('span');
        firstName.id = 'form-first-name';
        firstName.className = 'form-control';
        firstName.type = 'text';
        firstName.name = 'first-name';
        firstName.innerHTML = '[get from DB]';
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
        lastNameWrapper.className = 'col-md-8';
        var lastName = document.createElement('span');
        lastName.className = 'form-control';
        lastName.innerHTML = '[get from DB]';
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
        phoneWrapper.className = 'col-md-8';
        var phone = document.createElement('span');
        phone.className = 'form-control';
        phone.innerHTML = '[get from DB]';
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
        emailWrapper.className = 'col-md-8';
        var email = document.createElement('span');
        email.className = 'form-control';
        email.innerHTML = '[get from DB]';
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
        streetWrapper.className = 'col-md-8';
        var street = document.createElement('span');
        street.className = 'form-control';
        street.innerHTML = '[get from DB]';
        streetWrapper.appendChild(street);      
        streetGroup.appendChild(streetLabel);
        streetGroup.appendChild(streetWrapper); 
        //create city
        var cityGroup = document.createElement('div');
        cityGroup.className = 'form-group';
        var cityLabel = document.createElement('label');
        cityLabel.className = 'col-md-4 control-label';
        var cityWrapper = document.createElement('div');
        cityWrapper.className = 'col-md-8';
        var city = document.createElement('span');
        city.className = 'form-control';
        city.innerHTML = '[get from DB]';
        cityWrapper.appendChild(city);      
        cityGroup.appendChild(cityLabel);
        cityGroup.appendChild(cityWrapper); 

        //append content to tab B
        infoWrapper.appendChild(tabBHeader);
        infoWrapper.appendChild(tabBHeaderhr);
        infoWrapper.appendChild(firstNameGroup);
        infoWrapper.appendChild(lastNameGroup);
        infoWrapper.appendChild(phoneGroup);
        infoWrapper.appendChild(emailGroup);
        infoWrapper.appendChild(streetGroup);
        infoWrapper.appendChild(cityGroup);
        tabB.appendChild(infoWrapper);
        /* create content for tabC */

        //get children using donor id and login token

        //add sponsored children to the table in tabA
        function addChildToTable(id) {
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
                var button = document.createElement('button');
                button.className = 'btn btn-primary btn-sm child-intro-btn-sponsor sponsor-button';
                button.appendChild(document.createTextNode('eliminar'));

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

        //append tabs to the page
        container.appendChild(tabA);
        container.appendChild(tabB);
        container.appendChild(tabC);

    }
    else {
        alert('No login information found, please login');
    }
});
