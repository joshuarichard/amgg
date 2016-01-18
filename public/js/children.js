/* eslint-env browser */
/* eslint no-undef: 0 */

$(document).ready(function () {
    // load all unsponsored kids into a demo array
    // and put one randomly in checkout.html
    function data(callback) {
            // get child data using api
        $.getJSON('/api/v1/children/' + id, function(res) {
            var td = document.createElement('td');
            tr.id = id;

            // set up all child info as vars
            var monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo',
                              'Junio', 'Julio', 'Agosto', 'Septiembre',
                              'Octubre', 'Noviembre', 'Diciembre'];
            var date = new Date(res[id].cumpleaños);
            var birthday = monthNames[date.getMonth()] + ' ' +
                             date.getDate() + ', ' + date.getFullYear();
            var name = res[id].nombre;
            var age = res[id].años;
            var gender = res[id].género;
            var center = res[id].centro_de_ninos;

            $(".child-name span").text("name");

            // create div elements
            var div = document.createElement('td');
            div.className = 'child-info-group';

            var nameDiv = document.createElement('div');
            var ageDiv = document.createElement('div');
            var birthdayDiv = document.createElement('div');
            var genderDiv = document.createElement('div');
            var centerDiv = document.createElement('div');

            // assign classes
            nameDiv.className = 'child-info';
            ageDiv.className = 'child-info';
            birthdayDiv.className = 'child-info';
            genderDiv.className = 'child-info';
            centerDiv.className = 'child-info';

            // assign values
            nameDiv.innerHTML = 'Nombre: ' + name;
            ageDiv.innerHTML = 'Años: ' + age;
            birthdayDiv.innerHTML = 'Cumpleaños: ' + birthday;
            genderDiv.innerHTML = 'Género: ' + gender;
            centerDiv.innerHTML = 'Centro de Ninos: ' + center;

            // append children to div
            td.appendChild(nameDiv);
            td.appendChild(ageDiv);
            td.appendChild(birthdayDiv);
            td.appendChild(genderDiv);
            td.appendChild(centerDiv);

            div.appendChild(td);
            tr.appendChild(div);

            callback();
        });
    }

    $('.child-picture').click(function() {
        localStorage['children'] = ids.toString();
        console.log(localStorage['children']);
    });
});
