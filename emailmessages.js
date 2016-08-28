/* eslint-env node */

var exports = module.exports = {};

exports.messages = {
    'to_admin': {
        'sponsorship': {
            'deleted': {
                'header': 'Donor requesting removal of their sponsorship.',
                'body': 'A donor is requesting the removal of their sponsorship.'
            },
        },
        'account': {
            'deleted': {
                'header': 'Donor requesting their account be deleted',
                'body': 'A donor is requesting their account be deleted.'
            }
        },
        'letter_received': {
            'header': 'A letter from a donor has arrived!',
            'body': 'Contents of the letter:'
        }
    },
    'to_donor': {
        'forgot_password': {
            'header': 'Su nueva contraseña de AMG Guatemala.',
            'body': 'Hola, su nueva contraseña es:'
        }
    }
};

// email strings
//var emailHeaderSponsor =  'Thank you for your sponsorship';
//var emailBodySponsor = 'You sponsored a child!!!!!';

// error email strings
//var emailErrorHeader = 'Error adding sponsor for donor.';
//var emailErrorBody = 'Error adding sponsorship for donor'; // JSON.stringify(donor);
