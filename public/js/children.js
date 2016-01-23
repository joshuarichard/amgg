/* eslint-env browser */
/* eslint no-undef: 0 */

    /*
$(document).ready(function() {

    function buildHTMLforSlide(slideNum, callback) {
          function pic(id, childClass, callback) {
              // get the picture and load it in
              $.getJSON('/api/v1/pictures/' + id, function(res) {
                  //$(childClass).attr('src','data:image/image;base64,' + res.data);
                  callback(res.data);
              });
          }
    */
$(document).ready(function () {

    //create the owl carousel
    $(".owl-carousel").owlCarousel({
        navigation : true, // Show next and prev buttons
        slideSpeed : 300,
        paginationSpeed : 400,
        autoWidth:true,
        singleItem:true

        // "singleItem:true" is a shortcut for:
        // items : 1,
        // itemsDesktop : false,
        // itemsDesktopSmall : false,
        // itemsTablet: false,
        // itemsMobile : false

    });

    var id = '';
          function data(slideNum, callback) {
              // get all unsponsored kids and pick one to display in the carousel
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

                      // use the resLength to randomly pick one of the unsponsored
                      // children within the bounds
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
                              pic(id, '#child-picture' + slideNum, function(picture) {
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

              // create the picture element
              var divImg = document.createElement('div');
              divImg.className = 'col-xs-4'
              var img = document.createElement('img');
              img.id = 'child-picture' + x;
              img.className = 'img-responsive center-block child-picture';
              img.src = 'data:image/image;base64,' + picture;
              divImg.appendChild(img);
              slide.appendChild(divImg);

              // create the description element
              var divData = document.createElement('div');
              divData.className = 'col-xs-6';
              var hData = document.createElement('h1');
              hData.innerHTML = 'Hola, me llamo <span id =\"child-name' + x + '\">' + name + '</span>!';
              divData.appendChild(hData);
              var divDescription = document.createElement('div');
              divDescription.className = 'child-description';
              var pData1 = document.createElement('p');
              pData1.className = 'lead';
              pData1.innerHTML = 'I\"m a <span id=\"child-age' + x + '\">' + age + '</span>-year-old <span id=\"child-gender' + x + '\">' + gender + '</span> from <span id=\"child-location' + x + '\">' + location + '</span>, and you can change my world for good!';
              var pData2 = document.createElement('p');
              pData2.innerHTML = 'Make me part of your family, and help me reach my God-given potential. $<span id=\"child-cost' + x + '\">39</span> a month can help transform my community and change my world.';
              divDescription.appendChild(pData1);
              divDescription.appendChild(pData2);
              divData.appendChild(divDescription);
              var aDescription = document.createElement('a');
              aDescription.id = 'sponsor-button';
              aDescription.className = 'btn btn-primary btn-lg child-intro-btn-sponsor sponsor-button';
              aDescription.href = 'checkout.html';
              aDescription.innerHTML = 'Conviértase Mi Patrocinador';
              divData.appendChild(aDescription);
              slide.appendChild(divData);

              // check to see if this is the first slide. if it isn't, then wrap it
              // in an empty div for the carousel
              if (slideNum !== 0) {
                  var div = document.createElement('div');
                  div.appendChild(slide);
                  $('#slides').append(div);
              } else {
                  // append the slide to the carousel directly if it's the first one
                  $('#slides').append(slide);
              }
              callback(slide);
          });
    }

    //add carousel functionality
    var owl = $(".owl-carousel").owlCarousel({
        navigation : true, // Show next and prev buttons
        slideSpeed : 300,
        paginationSpeed : 400,
        autoWidth:true,
        singleItem:true
    });

    // var carousel = document.createElement('div');
    // carousel.className = "span8 owl-carousel owl-theme";
    for (var x = 0; x < 5; x++) {
        // TODO: when dynamically generating HTML tonight from javascript,
        // need to make sure I add the child's _id to the id of the child-slide
        // element
        buildHTMLforSlide(x, function(slide) {
            var item = document.createElement('div');
            item.className = "item";
            item.appendChild(slide);
            owl.data('owlCarousel').addItem(item);
        });
    }
    // $("#find-a-child").before($(carousel));


    $('#sponsor-button').click(function() {
        // TODO: need to fix sessionStorage by getting the ID from the
        // child-slide and putting it into sessionStorage

        if(sessionStorage.getItem('cart') === null ||
           sessionStorage.getItem('cart') === '') {
            sessionStorage.setItem('cart', id);
        } else {
            var existingStorage = sessionStorage.getItem('cart');
            sessionStorage.setItem('cart', existingStorage + ',' + id);
        }
    });
});
