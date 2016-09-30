/* eslint-env node */

var exports = module.exports = {};

// pad function for formatting ISO dates correctly.
// source: http://stackoverflow.com/questions/10073699/pad-a-number-with-leading-zeros-in-javascript
function pad(n, width) {
    n = n + '';
    return n.length >= width ? n : new Array(width-n.length + 1).join(0)+n;
}

exports.format = function(selector) {
    // variables up here to make eslint happy
    var currentYear, startYear, endYear, i, gteDate, ltDate, birthday, currentOrs = [], ranges = [], orMonths = {};

    // selector swizzingly here we go......

    // if looking for age...
    if (selector.hasOwnProperty('años')) {
        var ageRequested = parseInt(selector['años']);
        currentYear = new Date().getFullYear();
        var yearToLookFor = currentYear - ageRequested;
        gteDate = new Date();
        gteDate.setFullYear(yearToLookFor - 1);
        gteDate.setDate(gteDate.getDate() - 1);
        ltDate  = new Date();
        ltDate.setFullYear(yearToLookFor);

        var year = {
            'cumpleaños': {
                $gte: gteDate,
                $lt: ltDate
            }
        };

        ranges = [year];

        delete selector['años'];

        // then put all of the ranges into an or
        orMonths = {
            '$or': ranges
        };

        // get whatever is currently or'ed into the query and add to it
        currentOrs = selector['$and'];
        currentOrs.push(orMonths);
        selector['$and'] = currentOrs;
    }

    // if looking for the birth month...
    if (selector.hasOwnProperty('mes_de_nacimiento')) {
        // AMGG only takes in kids 3-18. do 1-18 just in case.
        currentYear = new Date().getFullYear();
        startYear = currentYear - 18;
        endYear = currentYear - 1;

        // array to hold all month ranges for each year
        ranges = [];

        // for every year in the range
        for (i = startYear; i < endYear; i++) {
            // if december
            if (parseInt(selector['mes_de_nacimiento']) + 1 === 12) {
                gteDate = new Date(i + '-' + pad(parseInt(selector['mes_de_nacimiento']) + 1, 2) + '-01T00:00:00');
                ltDate = new Date((i + 1) + '-' + '01-01T00:00:00');

                // create a birthday json object with the month for that year
                birthday = {
                    'cumpleaños': {
                        $gte: gteDate,
                        $lt: ltDate
                    }
                };

                // and push it to the ranges array
                ranges.push(birthday);
            } else {
                gteDate = new Date(i + '-' + pad(parseInt(selector['mes_de_nacimiento']) + 1, 2) + '-01T00:00:00');
                ltDate = new Date(i + '-' + pad(parseInt(selector['mes_de_nacimiento']) + 2, 2) +'-01T00:00:00');

                // create a birthday json object with the month for that year
                birthday = {
                    'cumpleaños': {
                        $gte: gteDate,
                        $lt: ltDate
                    }
                };

                // and push it to the ranges array
                ranges.push(birthday);
            }
        }

        // delete mes_de_nacimiento from the selector. we don't need it anymore
        // and it's not in the child docs
        delete selector['mes_de_nacimiento'];

        // then put all of the ranges into an or
        orMonths = {
            '$or': ranges
        };

        // get whatever is currently or'ed into the query and add to it
        currentOrs = selector['$and'];
        currentOrs.push(orMonths);
        selector['$and'] = currentOrs;
    }
    return selector;
};
