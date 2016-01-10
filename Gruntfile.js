module.exports = function (grunt) {
    grunt.initConfig({
        eslint: {
            src: ['*.js',
                  'auto/*.js',
                  'data/*.js',
                  'public/js/checkout.js',
                  'public/js/children.js']
        }
    });

    grunt.loadNpmTasks('gruntify-eslint');

    grunt.registerTask('default', ['eslint']);
    grunt.registerTask('checkstyle', ['eslint']);
};
