/* eslint-env browser */
/* eslint no-undef: 0 */

$(document).ready(function() {
    /* get the element to put the tabs in */
    var container = document.getElementsByClassName('tab-content');

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
    tabAHeader.appendChild('tabAHeaderhr');
    //create table that will contain a child
    var table = document.createElement('table');
    table.className = 'table table-hover child-selections';
    var tbody = document.createElement('tbody');

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

    // insert all children in session storage into the cart
    if (sessionStorage.getItem('cart') != null &&
        sessionStorage.getItem('cart') != '') {
        var ids = sessionStorage.getItem('cart').split(',');
        for (var i = 0; i < ids.length; i++) {
            addChildToTable(ids[i]);
            container.appendChild(table);
        }
    }

    // after all that append the 'add a child' button
    var addButton = document.createElement('button');
    addButton.className = 'btn btn-primary btn-md child-intro-btn-sponsor sponsor-button';
    addButton.onclick = function() {
        window.location = 'children.html';
    };

    addButton.appendChild(document.createTextNode('agregar otro niño'));
    container.appendChild(addButton);
});
