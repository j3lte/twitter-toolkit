module.exports = function (grunt) {
    "use strict";
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jslint: { // configure the task
          // lint your project's client code
            client: {
                src: [
                    'Gruntfile.js',
                    'app.js'
                ],
                directives: {
                    node: true,
                    regexp: true,
                    plusplus: true,
                    nomen: true,
                    stupid: true
                },
                options: {
                    jslintXml: 'out/client-jslint.xml',
                    log: 'out/client-lint.log',
                    junit: 'out/client-junit.xml',
                    errorsOnly: true, // only display errors
                    failOnError: false // defaults to true 
                }
            }
        },
        jshint: {
            all: [
                "Gruntfile.js",
                "app.js",
                "config.js",
                "example-config.js"
            ],
            options: {
                "node"     : true,
                "browser"  : false,
                "boss"     : false,
                "curly"    : true,
                "debug"    : false,
                "devel"    : false,
                "eqeqeq"   : true,
                "eqnull"   : true,
                "evil"     : false,
                "forin"    : false,
                "immed"    : false,
                "laxbreak" : false,
                "newcap"   : true,
                "noarg"    : true,
                "noempty"  : false,
                "nonew"    : false,
                "onevar"   : true,
                "plusplus" : false,
                "regexp"   : false,
                "undef"    : true,
                "sub"      : true,
                "strict"   : false,
                "white"    : true
            }
        },
        watch : {
            jslint : {
                files : '<%= jslint.client.src %>',
                tasks: ['jslint']
            },
            jshint : {
                files : '<%= jshint.all %>',
                tasks: ['jshint']
            }
        }
    });

    // grunt.loadTasks("tasks");

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-jslint');
    grunt.loadNpmTasks('grunt-contrib-watch');

    // Default task.
    grunt.registerTask('default', ['jshint', 'jslint']);

    grunt.registerTask('dev', ['jshint', 'jslint', 'watch']);
};