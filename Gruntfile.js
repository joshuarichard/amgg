module.exports = function(grunt) {
    grunt.initConfig({
        eslint: {
            src: ['*.js'],
            options: {
                quiet: true
            }
        }
    });

    grunt.loadNpmTasks('grunt-eslint');
 
    grunt.registerTask('default', ['eslint']);
    grunt.registerTask('checkstyle', ['eslint']);

};
