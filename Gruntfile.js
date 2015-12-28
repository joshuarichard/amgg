module.exports = function (grunt) {
    grunt.initConfig({
        eslint: {
            src: ['*.js', 'auto/*.js', 'src/api/*.js']
        }
    });

    grunt.loadNpmTasks('gruntify-eslint');

    grunt.registerTask('default', ['eslint']);
    grunt.registerTask('checkstyle', ['eslint']);
};
