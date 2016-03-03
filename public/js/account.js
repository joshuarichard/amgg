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
        var tabCHeaderhr = document.createElement('hr');
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
        childrenSelectContainer.className = "col-md-2";

        letterForm.appendChild(letter);
        letterForm.appendChild(submitLetter);
        tabC.appendChild(tabCHeader);
        tabC.appendChild(tabAHeaderhr);
        tabC.appendChild(letterForm);
        tabC.appendChild(childrenSelectContainer);

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
                    dataDiv.appendChild(dataTD);
                    
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
                    //this will change the header on tabC based on the child selected
                    selectChild.onclick = function() { tabCHeader.innerHTML = 'Letter to ' +  $('.child-letter-select').text() };
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
                            tbody.appendChild(tr);
                            table.appendChild(tbody);
                        }
                    });
                }
            });
        }

        /* get children using donor id */
        selector = {'donor_id': sessionStorage.getItem('id')};
        $.ajax({
            url: '/api/v1/donor/id/' + sessionStorage.getItem('id'),
            type: 'POST',
            data: {
                'token' : sessionStorage.getItem('token'),
                'id' : sessionStorage.getItem('id') 
            },
            success: function(res) {
                for (var i = 0; i < res.data.niños_patrocinadoras.length; i++) {
                    var id = res.data.niños_patrocinadoras[i];
                    addChildToDonorList(id);
                    tabA.appendChild(table);
                }
                
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
                var id = res.key;

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
                firstNameWrapper.className = 'col-md-6';
                var firstName = document.createElement('span');
                firstName.id = 'form-first-name';
                firstName.className = 'form-control';
                firstName.type = 'text';
                firstName.name = 'first-name';
                firstName.innerHTML = res.data.nombre;
                //create edit button for first name
                var editFirstNameContainer = document.createElement('div');
                editFirstNameContainer.className = "edit-button-container";
                var editFirstName = document.createElement('button');
                editFirstName.className = 'col-md-2 glyphicon glyphicon-edit edit-button';
                editFirstName.id = 'editFirstName';
                //combine everything into one element
                editFirstNameContainer.appendChild(editFirstName);
                firstNameWrapper.appendChild(firstName);      
                firstNameGroup.appendChild(firstNameLabel);
                firstNameGroup.appendChild(firstNameWrapper);  
                firstNameGroup.appendChild(editFirstNameContainer);
                //create last name
                var lastNameGroup = document.createElement('div');
                lastNameGroup.className = 'form-group';
                var lastNameLabel = document.createElement('label');
                lastNameLabel.className = 'col-md-4 control-label';
                lastNameLabel.innerHTML = 'Apellido';
                var lastNameWrapper = document.createElement('div');
                lastNameWrapper.className = 'col-md-6';
                var lastName = document.createElement('span');
                lastName.className = 'form-control';
                lastName.innerHTML = res.data.apellido;
                //create edit button for last name
                var editLastNameContainer = document.createElement('div');
                editLastNameContainer.className = "edit-button-container";
                var editLastName = document.createElement('button');
                editLastName.className = 'col-md-2 glyphicon glyphicon-edit edit-button';
                //combine everything into one element
                editLastNameContainer.appendChild(editLastName);
                lastNameWrapper.appendChild(lastName);      
                lastNameGroup.appendChild(lastNameLabel);
                lastNameGroup.appendChild(lastNameWrapper);
                lastNameGroup.appendChild(editLastNameContainer);
                //create phone number
                var phoneGroup = document.createElement('div');
                phoneGroup.className = 'form-group';
                var phoneLabel = document.createElement('label');
                phoneLabel.className = 'col-md-4 control-label';
                phoneLabel.innerHTML = 'Tel&#233;fono';
                var phoneWrapper = document.createElement('div');
                phoneWrapper.className = 'col-md-6';
                var phone = document.createElement('span');
                phone.className = 'form-control';
                phone.innerHTML = res.data.teléfono;
                //create edit button for phone number
                var editPhoneContainer = document.createElement('div');
                editPhoneContainer.className = "edit-button-container";
                var editPhone = document.createElement('button');
                editPhone.className = 'col-md-2 glyphicon glyphicon-edit edit-button';
                //combine everything into one element
                editPhoneContainer.appendChild(editPhone);
                phoneWrapper.appendChild(phone);      
                phoneGroup.appendChild(phoneLabel);
                phoneGroup.appendChild(phoneWrapper);
                phoneGroup.appendChild(editPhoneContainer);
                //create email
                var emailGroup = document.createElement('div');
                emailGroup.className = 'form-group';
                var emailLabel = document.createElement('label');
                emailLabel.className = 'col-md-4 control-label';
                emailLabel.innerHTML = 'Correo Electrónico';
                var emailWrapper = document.createElement('div');
                emailWrapper.className = 'col-md-6';
                var email = document.createElement('span');
                email.className = 'form-control';
                email.innerHTML = res.data.correo_electrónico;
                //create edit button for email
                var editEmailContainer = document.createElement('div');
                editEmailContainer.className = "edit-button-container";
                var editEmail = document.createElement('button');
                editEmail.className = 'col-md-2 glyphicon glyphicon-edit edit-button';
                //combine everything into one element
                editEmailContainer.appendChild(editEmail);
                emailWrapper.appendChild(email);      
                emailGroup.appendChild(emailLabel);
                emailGroup.appendChild(emailWrapper);
                emailGroup.appendChild(editEmailContainer);
                //create street
                var streetGroup = document.createElement('div');
                streetGroup.className = 'form-group';
                var streetLabel = document.createElement('label');
                streetLabel.className = 'col-md-4 control-label';
                streetLabel.innerHTML = 'Dirección';
                var streetWrapper = document.createElement('div');
                streetWrapper.className = 'col-md-6';
                var street = document.createElement('span');
                street.className = 'form-control';
                street.innerHTML = res.data.calle;
                //create edit button for address, this will control street and city
                var editAddressContainer = document.createElement('div');
                editAddressContainer.className = "edit-button-container";
                var editAddress = document.createElement('button');
                editAddress.className = 'col-md-2 glyphicon glyphicon-edit edit-button';
                //combine everything into one element
                streetWrapper.appendChild(street);      
                editAddressContainer.appendChild(editAddress);
                streetGroup.appendChild(streetLabel);
                streetGroup.appendChild(streetWrapper);
                streetGroup.appendChild(editAddressContainer);
                //create city
                var cityGroup = document.createElement('div');
                cityGroup.className = 'form-group';
                var cityLabel = document.createElement('label');
                cityLabel.className = 'col-md-4 control-label';
                var cityWrapper = document.createElement('div');
                cityWrapper.className = 'col-md-6';
                var city = document.createElement('span');
                city.className = 'form-control';
                city.innerHTML = res.data.ciudad;
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
            }
        });

        //append tabs to the page
        container.appendChild(tabA);
        container.appendChild(tabB);
        container.appendChild(tabC);
    }
    else {
        alert('No login information found, please login');
    }
});
