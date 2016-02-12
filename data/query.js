/* eslint-env node */

var exports = module.exports = {};

exports.format = function(selector) {
    /* eslint-disable */
    // pad function for formatting ISO dates correctly.
    // source: http://stackoverflow.com/questions/10073699/pad-a-number-with-leading-zeros-in-javascript
    /* eslint-enable */

    function pad(n, width) {
        n = n + '';
        return n.length >= width ? n : new Array(width - n.length + 1).join(0)
               + n;
    }

    // selector swizzingly here we go

    // if looking for age, cast the age from a string to an int
    if (selector.hasOwnProperty('años')) {
        selector['años'] = parseInt(selector['años']);
    }

    // if looking for the birth month...
    if (selector.hasOwnProperty('mes_de_nacimiento')) {
        // AMGG only takes in kids 3-18. do 1-18 just in case.
        var currentYear = new Date().getFullYear();
        var startYear = currentYear - 18;
        var endYear = currentYear - 1;

        // array to hold all month ranges for each year
        var ranges = [];

        // for every year in the range
        for (var i = startYear; i < endYear; i++) {

          var gteDate = new Date(i + '-' +
                             pad(parseInt(selector['mes_de_nacimiento']) + 1, 2)
                             + '-01T00:00:00');
          var ltDate = new Date(i + '-' +
                             pad(parseInt(selector['mes_de_nacimiento']) + 2, 2)
                             +'-01T00:00:00');

            // create a birthday json object with the month for that year
            var birthday = {
                'cumpleaños': {
                    $gte: gteDate,
                    $lt: ltDate
                }
            };

            // and push it to the ranges array
            ranges.push(birthday);
        }

        // delete mes_de_nacimiento from the selector. we don't need it anymore
        // and it's not in the child docs
        delete selector['mes_de_nacimiento'];

        // then put all of the ranges into an or
        var orMonths = {
            '$or': ranges
        };

        // get whatever is currently or'ed into the query and add to it
        var currentOrs = selector['$and']
        currentOrs.push(orMonths);
        selector['$and'] = currentOrs;

    }

    // if looking for the birth day...
    if (selector.hasOwnProperty('día_del_nacimiento')) {
        // AMGG only takes in kids 3-18. do 1-18 just in case.
        var currentYear = new Date().getFullYear();
        var startYear = currentYear - 18;
        var endYear = currentYear - 1;

        // array to hold all month ranges for each year
        var ranges = [];

        // for every year in the range
        for (var i = startYear; i < endYear; i++) {
            for (var j = 1; j < 13; j++) {
                // create a birthday json object with the month for that year
                var gteDate = new Date(i + '-' + pad(j, 2) + '-' +
                                   pad(parseInt(selector['día_del_nacimiento']),
                                   2) + 'T00:00:00');
                var ltDate = new Date(i + '-' + pad(j, 2) + '-' +
                                    pad(parseInt(selector['día_del_nacimiento'])
                                    + 1, 2) +'T00:00:00');

                var birthday = {
                    'cumpleaños': {
                      $gte: gteDate,
                      $lt: ltDate
                    }
                };

                // and push it to the ranges array
                ranges.push(birthday);
            }
        }

        // delete día_del_nacimiento from the selector. we don't need it anymore
        // and it's not in the child docs
        delete selector['día_del_nacimiento'];

        // then put all of the ranges into an or
        var orDays = {
            '$or': ranges
        };

        // get whatever is currently or'ed into the query and add to it
        var currentOrs = selector['$and']
        currentOrs.push(orDays);
        selector['$and'] = currentOrs;
    }

    return selector;
}
