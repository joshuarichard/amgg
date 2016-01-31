/* eslint-env browser */
/* eslint no-undef: 0 */

$(document).ready(function() {
    /**
     *  functions:
     *  getUnsponsoredChildData() - get an unsponsored child based on a given
     *                              selector
     *  buildHTMLforSlide() - builds html for a carousel slide based on data
     *                        received from getUnsponsoredChildData()
     *  addSlide() - adds a slide from a slide received from buildHTMLforSlide()
     *  insertFiveChildren() - uses the three above functions to insert 5 kids
     *                         into the carousel
     */
    function getUnsponsoredChildData(selector, callback) {
        selector['status'] = 'Waiting for Sponsor - No Prior Sponsor';
        // get all unsponsored kids and pick one to display in the
        // carousel
        $.getJSON('/api/v1/findchild/' + JSON.stringify(selector),function(res){
            console.log(res);
            if(res.err !== undefined) {
                // TODO: fix error on connection
                callback('{}');
            } else if (JSON.stringify(res) === '{}') {
                callback('{}');
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
                // TODO: this doesn't work when the response is a low number
                // (años = 3 returns 2 children but only ever shows augustin)
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
                        // get the picture and load it in
                        $.getJSON('/api/v1/pictures/' + id, function(res) {
                              var data = {
                                  'id': id,
                                  'name': name,
                                  'age': age,
                                  'gender': gender,
                                  'location': location,
                                  'picture': res.data
                              };
                              callback(data);
                        });
                        break;
                    } else {
                        i++;
                    }
                }
            }
        });
    }

    function buildHTMLforSlide(data, callback) {
        // assign all of the data gathered from the api to variables
        var id = data.id;
        var name = data.name;
        var age = data.age;
        var gender = data.gender;
        var location = data.location;
        var picture = data.picture;

        // create the slide
        var slide = document.createElement('div');
        slide.className = 'child-slide';
        slide.id = id;

        // create the picture element
        var divImg = document.createElement('div');
        divImg.className = 'col-xs-4';
        var img = document.createElement('img');
        img.id = 'child-picture';
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
        hData.innerHTML = 'Hola, me llamo <span id =\"child-name\">' + name + '</span>!';
        divData.appendChild(hData);
        var divDescription = document.createElement('div');
        divDescription.className = 'child-description';
        var pData1 = document.createElement('p');
        pData1.className = 'lead';
        pData1.innerHTML = 'I\'m a <span id=\"child-age\">' + age + '</span>-year-old <span id=\"child-gender\">' + gender + '</span> from <span id=\"child-location\">' + location + '</span>, and you can change my world for good!';
        var pData2 = document.createElement('p');
        pData2.innerHTML = 'Make me part of your family, and help me reach my God-given potential. $<span id=\"child-cost\">39</span> a month can help transform my community and change my world.';
        divDescription.appendChild(pData1);
        divDescription.appendChild(pData2);
        divData.appendChild(divDescription);
        var sponsorButton = document.createElement('a');
        sponsorButton.id = 'sponsor-button';
        sponsorButton.className = 'btn btn-primary btn-lg child-intro-btn-sponsor sponsor-button';
        sponsorButton.href = 'checkout.html';
        sponsorButton.innerHTML = 'Conviértase Mi Patrocinador';

        // add the function for the sponsor button. clicking this should add
        // the child's id from the parent-most div into sessionStorage
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
        /*
        if (owl.data('owlCarousel').currentItem !== 0) {
            var div = document.createElement('div');
            div.appendChild(slide);
            $('#slides').append(div);
        } else {
            // append the slide to the carousel directly if it's the first one
            $('#slides').append(slide);
        }
        */
        $('#slides').append(slide);
        callback(slide);
    }

    function addSlide(slide) {
        var item = document.createElement('div');
        item.className = 'item';
        item.appendChild(slide);
        owl.data('owlCarousel').addItem(item);
    }

    function insertFiveChildren() {
        for (var x = 1; x <= 5; x++) {
            // get the unsponsored child data
            getUnsponsoredChildData({}, function(data) {
                // build a slide from it
                buildHTMLforSlide(data, function(slide) {
                    // add the slide to the carousel
                    addSlide(slide);
                });
            });
        }
    }

    //add carousel functionality
    var owl = $('.owl-carousel');
    function buildOwl() {
        owl.owlCarousel({
            navigation : false,
            slideSpeed : 800,
            paginationSpeed : 800,
            autoWidth: true,
            singleItem: true
        });
    }

    // insert 5 child to start
    buildOwl();
    insertFiveChildren();

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
        getUnsponsoredChildData({}, function(data) {
            buildHTMLforSlide(data, function(slide) {
                addSlide(slide);
                owl.trigger('owl.jumpTo',
                            owl.data('owlCarousel').owl.owlItems.length);
            });
        });
    });

    /**
     * find a child panel
     */
    $('#search-button').click(function() {
        var selector = {'status': 'Waiting for Sponsor - No Prior Sponsor'};
        if($('#genderSearch').text() !== 'Género') {
            selector['género'] = $('#genderSearch').text();
        }
        if($('#centerSearch').text() !== 'Centro de Niños') {
            selector['centro_de_ninos'] = $('#centerSearch').text();
        }
        if($('#ageSearch').text() !== 'Años') {
            selector['años'] = $('#ageSearch').text();
        }
        /*
        if($('#search-birthmonth').text() !== 'Birth Month') {
            selector[''] = $('#search-birthmonth').text();
        }
        if($('#search-birthday').text() !== 'Birth Day') {
            selector[''] = $('#search-birthday').text();
        }
        */

        // empty the owl carousel (minus the last slide...)
        while (owl.data('owlCarousel').owl.owlItems.length !== 1) {
            owl.data('owlCarousel').removeItem();
        }

        // owl doesn't delete the last slide for some reason, so do it manually
        if (owl.data('owlCarousel').owl.owlItems.length === 1) {
            owl.data('owlCarousel').removeItem();
        }

        // loop 5 times for 5 different kids
        for (var c = 0; c < 10; c++) {
            getUnsponsoredChildData(selector, function(data) {
                // if there is a child returned by the selector
                if (data !== '{}') {
                    // then also check to make sure the child isn't already in
                    if ($('.child-slide').length === 0) {
                        // but first always insert the first once
                        buildHTMLforSlide(data, function(slide) {
                            addSlide(slide);
                        });
                    } else {
                        // after that always do the check for duplicates
                        var isDuplicate = false;
                        $('.child-slide').each(function() {
                            // if it isn't, then add the child
                            if ($(this).attr('id') === data.id) {
                                isDuplicate = true;
                            }
                        });
                        if (isDuplicate === false) {
                            buildHTMLforSlide(data, function(slide) {
                                addSlide(slide);
                            });
                        }
                    }
                } else if ($('.child-slide').length === 0) {
                    // check to see if the api returned a child matching the
                    // selector. if it didn't, alert the user and insert five
                    // new children
                    if ($('.child-slide').length === 0) {
                        /* eslint-disable */
                        alert('no hay niños que coincidan con sus criterios de búsqueda.')
                        /* eslint-enable */
                        insertFiveChildren();
                    }
                }
           });
        }
    });

    /* Dropdown functionality, this while change the title of the
       dropdown to the option selected by the user */
    $('#search-gender li > a').click(function(e){
        $('#genderSearch').text(this.innerHTML);
    });

    $('#search-center li > a').click(function(e){
        $('#centerSearch').text(this.innerHTML);
    });

    $('#search-age li > a').click(function(e){
        $('#ageSearch').text(this.innerHTML);
    });

    $('#search-birthmonth li > a').click(function(e){
        $('#birthmonthSearch').text(this.innerHTML);
    });

    $('#search-birthday li > a').click(function(e){
        $('#birthdaySearch').text(this.innerHTML);
    });

});
