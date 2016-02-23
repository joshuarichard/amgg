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

    // variables up here to make eslint happy
    var currentYear, startYear, endYear, i, j,
        gteDate, ltDate, birthday, currentOrs = [], ranges = [];

    // selector swizzingly here we go......

    // if looking for age, cast the age from a string to an int
    if (selector.hasOwnProperty('años')) {
        selector['años'] = parseInt(selector['años']);
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
                gteDate = new Date(i + '-' +
                                   pad(parseInt(selector['mes_de_nacimiento'])
                                   + 1, 2) + '-01T00:00:00');
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
                gteDate = new Date(i + '-' +
                                   pad(parseInt(selector['mes_de_nacimiento'])
                                   + 1, 2) + '-01T00:00:00');
                ltDate = new Date(i + '-' +
                                   pad(parseInt(selector['mes_de_nacimiento'])
                                   + 2, 2) +'-01T00:00:00');

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
        var orMonths = {
            '$or': ranges
        };

        // get whatever is currently or'ed into the query and add to it
        currentOrs = selector['$and'];
        currentOrs.push(orMonths);
        selector['$and'] = currentOrs;
    }

    // if looking for the birth day...
    if (selector.hasOwnProperty('día_del_nacimiento')) {
        /*
        // AMGG only takes in kids 3-18. do 1-18 just in case.
        currentYear = new Date().getFullYear();
        startYear = currentYear - 18;
        endYear = currentYear - 1;

        // array to hold all month ranges for each year
        ranges = [];

        // for every year in the range
        for (i = startYear; i < endYear; i++) {
            for (j = 1; j < 13; j++) {
                if (parseInt(selector['día_del_nacimiento']) === 31) {
                    // create a birthday json object with
                    // the month for that year
                    if (j !== 2 && j !== 4 && j !== 6 && j !== 11) {
                        if (j === 12) {
                            // eslint-disable
                            var gteDateStr = i + '-' + pad(j, 2) + '-31T00:00:00';
                            var ltDateStr = i + '-' + pad(1, 2) + '-01T00:00:00';
                            gteDate = new Date(gteDateStr);
                            ltDate = new Date(ltDateStr);

                            console.log('this gteq string ' + gteDateStr + ' produces this date ' + gteDate);
                            console.log('this less string ' + ltDateStr + ' produces this date ' + ltDate);

                            birthday = {
                                'cumpleaños': {
                                    $gte: new Date(i, j, 31, 0, 0, 0, 0),
                                    $lt: new Date(i, 1, 1, 0, 0, 0, 0)
                                }
                            };

                            // and push it to the ranges array
                            ranges.push(birthday);
                        }
                    } else {
                        var gteDateStr = i + '-' + pad(j, 2) + '-31T00:00:00';
                        var ltDateStr = i + '-' + pad(j+1, 2) + '-01T00:00:00';
                        gteDate = new Date(gteDateStr);
                        ltDate = new Date(ltDateStr);

                        console.log('this one');
                        console.log('this gteq string ' + gteDateStr + ' produces this date ' + new Date(gteDateStr));
                        console.log('this less string ' + ltDateStr + ' produces this date ' + new Date(ltDateStr));
                        console.log('this two');

                        birthday = {
                            'cumpleaños': {
                                $gte: new Date(i, j, 31, 0, 0, 0, 0),
                                $lt: new Date(i, 1, 1, 0, 0, 0, 0)
                            }
                        };

                        // and push it to the ranges array
                        ranges.push(birthday);
                    }
                } else if (parseInt(selector['día_del_nacimiento']) > 28) {
                    if (j!== 2) {
                        var gteDateStr = i + '-' + pad(j, 2) + '-31T00:00:00';
                        var ltDateStr = i + '-' + pad(j+1, 2) + '-01T00:00:00';
                        gteDate = new Date(gteDateStr);
                        ltDate = new Date(ltDateStr);

                        console.log('this gteq string ' + gteDateStr + ' produces this date ' + gteDate);
                        console.log('this less string ' + ltDateStr + ' produces this date ' + ltDate);

                        // eslint-enable
                        birthday = {
                            'cumpleaños': {
                                $gte: gteDate,
                                $lt: ltDate
                            }
                        };

                        // and push it to the ranges array
                        ranges.push(birthday);
                    }
                } else {
                    // create a birthday json object with
                    // the month for that year
                    gteDate = new Date(i + '-' + pad(j, 2) + '-' +
                                   pad(parseInt(selector['día_del_nacimiento']),
                                   2) + 'T00:00:00');
                    ltDate = new Date(i + '-' + pad(j, 2) + '-' +
                                    pad(parseInt(selector['día_del_nacimiento'])
                                    + 1, 2) +'T00:00:00');

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
        }
        */

        // delete día_del_nacimiento from the selector. we don't need it anymore
        // and it's not in the child docs
        delete selector['día_del_nacimiento'];

        // then put all of the ranges into an or
        /*
        var orDays = {
            '$or': ranges
        };

        // get whatever is currently or'ed into the query and add to it
        currentOrs = selector['$and'];
        currentOrs.push(orDays);
        selector['$and'] = currentOrs;
        */
    }

    return selector;
};
