module.exports = function (grunt) {
    grunt.initConfig({
        eslint: {
            src: ['*.js',
                  'auto/*.js',
                  'data/*.js',
                  'public/js/checkout.js',
                  'public/js/children.js',
                  'test/**/*.js']
        },
        mochaTest: {
            test: {
                options: {
                    reporter: 'spec',
                    quiet: false
                },
                src: ['test/**/*.js']
            }
        }
    });

    grunt.loadNpmTasks('gruntify-eslint');
    grunt.loadNpmTasks('grunt-mocha-test');

    grunt.registerTask('default', ['eslint', 'mochaTest']);
    grunt.registerTask('checkstyle', ['eslint']);
    grunt.registerTask('test', 'mochaTest');
};
