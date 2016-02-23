'use strict';

module.exports = function(grunt) {
	grunt.initConfig({
		watch: {
			test: {
				files: ['test/**/*.js'],
				tasks: ['jshint:test']
			},
			lib: {
				files: ['hyacinth.js'],
				tasks: ['jshint:lib']
			}
		},
		jshint: {
			lib: {
				src: 'hyacinth.js'
			},
			test: {
				src: ['test/**/*.js']
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-jshint');

	grunt.registerTask('default', ['jshint']);
	grunt.registerTask('test', ['jshint']);
};
