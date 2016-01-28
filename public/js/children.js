/* eslint-env browser */
/* eslint no-undef: 0 */

$(document).ready(function() {

    /**
     * carousel code
     */
    function buildHTMLforSlide(slideNum, callback) {
        function pic(id, childClass, callback) {
            // get the picture and load it in
            $.getJSON('/api/v1/pictures/' + id, function(res) {
                callback(res.data);
            });
        }

        function data(slideNum, callback) {
            // get all unsponsored kids and pick one to display in the
            // carousel
            $.getJSON('/api/v1/unsponsored', function(res) {
                if(res.err !== undefined) {
                    // TODO: fix error on connection
                    callback(false);
                } else {
                    // calculate the resLength for random child bounds
                    var key, resLength = 0;
                    for(key in res) {
                        if(res.hasOwnProperty(key)) {
                            resLength++;
                        }
                    }

                    // use the resLength to randomly pick one of the
                    // unsponsored children within the bounds
                    var ran = Math.floor(Math.random() * (resLength - 1) + 1);

                    // now iterate over the res with an index (i) and match it
                    // to the random number.
                    var i = 0;
                    for (key in res) {
                        // if index === random number then pick this child
                        if (i === ran && res.hasOwnProperty(key)) {
                            var id = key;
                            var name = res[id].nombre;
                            var age = res[id].años;
                            var gender = res[id].género;
                            var location = res[id].centro_de_ninos;
                            pic(id, '#child-picture' + slideNum,
                                function(picture) {
                                    var callbackData = {
                                        'slideNum': slideNum,
                                        'id': id,
                                        'name': name,
                                        'age': age,
                                        'gender': gender,
                                        'location': location,
                                        'picture': picture
                                    };
                                    callback(callbackData);
                                });
                            break;
                        } else {
                            i++;
                        }
                    }
                }
            });
        }

        data(slideNum, function(data) {
            // assign all of the data gathered from the api to variables
            var id = data.id;
            var name = data.name;
            var age = data.age;
            var gender = data.gender;
            var location = data.location;
            var picture = data.picture;
            var slideNum = data.slideNum;

            // create the slide
            var slide = document.createElement('div');
            slide.className = 'child-slide';
            slide.id = id;

            // create the picture element
            var divImg = document.createElement('div');
            divImg.className = 'col-xs-4';
            var img = document.createElement('img');
            img.id = 'child-picture' + x;
            img.className = 'img-responsive center-block child-picture';
            img.src = 'data:image/image;base64,' + picture;
            divImg.appendChild(img);
            slide.appendChild(divImg);

            // create the description element
            // note: need to disable eslint because of html strings
            /* eslint-disable */
            var divData = document.createElement('div');
            divData.className = 'col-xs-6';
            var hData = document.createElement('h1');
            hData.innerHTML = 'Hola, me llamo <span id =\"child-name' + x + '\">' + name + '</span>!';
            divData.appendChild(hData);
            var divDescription = document.createElement('div');
            divDescription.className = 'child-description';
            var pData1 = document.createElement('p');
            pData1.className = 'lead';
            pData1.innerHTML = 'I\'m a <span id=\"child-age' + x + '\">' + age + '</span>-year-old <span id=\"child-gender' + x + '\">' + gender + '</span> from <span id=\"child-location' + x + '\">' + location + '</span>, and you can change my world for good!';
            var pData2 = document.createElement('p');
            pData2.innerHTML = 'Make me part of your family, and help me reach my God-given potential. $<span id=\"child-cost' + x + '\">39</span> a month can help transform my community and change my world.';
            divDescription.appendChild(pData1);
            divDescription.appendChild(pData2);
            divData.appendChild(divDescription);
            var sponsorButton = document.createElement('a');
            sponsorButton.id = 'sponsor-button';
            sponsorButton.className = 'btn btn-primary btn-lg child-intro-btn-sponsor sponsor-button';
            sponsorButton.href = 'checkout.html';
            sponsorButton.innerHTML = 'Conviértase Mi Patrocinador';
            sponsorButton.onclick = function() {
                if(sessionStorage.getItem('cart') === null ||
                   sessionStorage.getItem('cart') === '') {
                    sessionStorage.setItem('cart', this.parentNode.parentNode.id);
                } else {
                    var existingStorage = sessionStorage.getItem('cart');
                    sessionStorage.setItem('cart', existingStorage + ',' + this.parentNode.parentNode.id);
                }
            };
            divData.appendChild(sponsorButton);
            slide.appendChild(divData);
            /* eslint-enable*/

            // check to see if this is the first slide. if it isn't, then wrap
            // it in an empty div for the carousel
            if (slideNum !== 0) {
                var div = document.createElement('div');
                div.appendChild(slide);
                $('#slides').append(div);
            } else {
                // append the slide to the carousel directly if it's the first
                // one
                $('#slides').append(slide);
            }
            callback(slide);
        });
    }

    //add carousel functionality
    var owl = $('.owl-carousel').owlCarousel({
        navigation : false, // Show next and prev buttons
        slideSpeed : 800,
        paginationSpeed : 800,
        autoWidth: true,
        singleItem: true
    });

    function addSlide(slide) {
        var item = document.createElement('div');
        item.className = 'item';
        item.appendChild(slide);
        owl.data('owlCarousel').addItem(item);
    }

    // insert one child to start
    for (var x = 0; x < 5; x++) {
        buildHTMLforSlide(x, function(slide) {
            addSlide(slide);
        });
    }

    // custom previous and next buttons
    $('#prev-button').click(function() {
        owl.trigger('owl.prev');
    });
    $('#next-button').click(function() {
        owl.trigger('owl.next');
    });

    // add a child to the slide button
    $('#add-button').click(function() {
        // start x back where it was and incrememnt once for every added child
        buildHTMLforSlide(x++, function(slide) {
            addSlide(slide);
            owl.trigger('owl.jumpTo',
                        owl.data('owlCarousel').owl.owlItems.length);
        });
    });

    /**
     * find a child panel
     */
    $('#search-button').click(function() {
        var selector = {'género': 'masculino'};
        /*
        if($('#search-gender').text() !== 'Género') {
            selector['género'] = $('#search-gender').text();
        }
        if($('#search-center').text() !== 'Centro de Niño') {
            selector['centro_de_ninos'] = $('#search-center').text();
        }
        if($('#search-age').text() !== 'Años') {
            selector['años'] = $('#search-age').text();
        }
        if($('#search-birthmonth').text() !== 'Birth Month') {
            selector[''] = $('#search-birthmonth').text();
        }
        if($('#search-birthday').text() !== 'Birth Day') {
            selector[''] = $('#search-birthday').text();
        }
        */

        // this is me just messing with carousel slide manipulation
        console.log(owl.data('owlCarousel').owl.owlItems.length);
        for (var d = owl.data('owlCarousel').owl.owlItems.length; d > 1; d--) {
            owl.data('owlCarousel').removeItem();
            console.log(owl.data('owlCarousel').owl.owlItems.length);
        }
        console.log('owl ' + owl.data('owlCarousel').owl.owlItems.length);
        console.log('d ' + d);
        $.getJSON('/api/v1/findchild/' + JSON.stringify(selector), function(res) {
            for (var j = 0; j < res.length; j++) {
                buildHTMLforSlide(j, function(slide) {
                    addSlide(slide);
                });
            }
        });
    });

    /* Dropdown functionality, this while change the title of the 
       dropdown to the option selected by the user */
    $('#search-gender li > a').click(function(e){
        $('#genderSearch').text(this.innerHTML);
        console.log($('#genderSearch').text(this.innerHTML)):
    });

    $('#search-center li > a').click(function(e){
        $('#centerSearch').text(this.innerHTML);
        console.log($('#centerSearch').text(this.innerHTML)):
    });

    $('#search-age li > a').click(function(e){
        $('#ageSearch').text(this.innerHTML);
        console.log($('#ageSearch').text(this.innerHTML)):
    });

    $('#search-birthmonth li > a').click(function(e){
        $('#birthmonthSearch').text(this.innerHTML);
        console.log($('#birthmonthSearch').text(this.innerHTML)):
    });
    
    $('#search-birthday li > a').click(function(e){
        $('#birthdaySearch').text(this.innerHTML);
        console.log($('#birthdaySearch').text(this.innerHTML)):
    });

});
