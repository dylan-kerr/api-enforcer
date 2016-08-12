'use strict';

module.exports = function (grunt) {

    grunt.initConfig({
        bumpup: [
            'package.json',
            'bower.json'
        ]
    });

    grunt.loadNpmTasks('grunt-bumpup');

};
