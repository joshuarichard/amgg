/* eslint-env browser */
/* eslint no-undef: 0 */

$(document).ready(function () {
    // load all unsponsored kids into a demo array
    // and put one randomly in checkout.html

    function pic(callback) {    
        // get the picture and load it in
        $.ajax({
            type: 'GET',
            url: '/api/v1/pictures/' + id,
            beforeSend: function (xhr) {
                xhr.overrideMimeType('text/plain; charset=x-user-defined');
            },
            success: function (result, textStatus, jqXHR) {
                var data = jqXHR.responseText;
                // picIMG.src = 'data:image/image;base64,' + data;
                $(".child-picture").attr("src",'data:image/image;base64,' + data);                
                callback();
            }
        });        
    }

    console.log("hello");
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

            // create div elements
            var div = document.createElement('td');
            div.className = 'child-info-group';

            $("#child-name").text(name);
            $("#child-age").text(age);
            $("#child-gender").text(gender);
            $("#child-location").text(center);
            // $(".child-picture").attr("src","../image/nino-1.png");

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

            //load values onto page


            callback();
        });
    }    

    $('.child-picture').click(function() {
        localStorage['children'] = ids.toString();
        console.log(localStorage['children']);
    });
});
