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

        /* get children using donor id */
        selector = {'donor_id': sessionStorage.getItem('id')};
        $.ajax({
            url: '/api/v1/children/find/' + JSON.stringify(selector),
            type: 'GET',
            success: function(res) {
                for (var key in res) {
                    var id = key;

                    // create child's table row
                    var tr = document.createElement('tr');

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
                        }
                    });

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
                    dataDiv.appendChild(dataTD);
                    //append picture
                    tr.appendChild(picTD);
                    //append child info
                    tr.appendChild(dataDiv);

                    // append the row to the tbody, and
                    // add the tbody to the table
                    tbody.appendChild(tr);
                    table.appendChild(tbody);
                }
            }
        });

        /* Create content for tabB */
        $.ajax({
            url: '/api/v1/donor/id/' + sessionStorage.getItem('id'),
            type: 'POST',
            data: {
                'token' : sessionStorage.getItem('token'),
                'id' : sessionStorage.getItem('id')},
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
                firstNameWrapper.className = 'col-md-8';
                var firstName = document.createElement('span');
                firstName.id = 'form-first-name';
                firstName.className = 'form-control';
                firstName.type = 'text';
                firstName.name = 'first-name';
                firstName.innerHTML = res.data.nombre;
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
                lastName.innerHTML = res.data.apellido;
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
                phone.innerHTML = res.data.teléfono;
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
                email.innerHTML = res.data.correo_electrónico;
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
                street.innerHTML = res.data.calle;
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

        /* create content for tabC */

        table.appendChild(tbody);
        tabA.appendChild(table);


        //append tabs to the page
        container.appendChild(tabA);
        container.appendChild(tabB);
        container.appendChild(tabC);

    }
    else {
        alert('No login information found, please login');
    }
});
