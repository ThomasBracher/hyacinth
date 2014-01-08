'use strict';

module.exports = function(grunt) {
	grunt.initConfig({
		watch: {
			test: {
				files: ['test/**/*.js', 'test/**/*.html'],
				tasks: ['jshint:test', 'mocha']
			},
			lib: {
				files: ['hyacinth.js'],
				tasks: ['jshint:lib', 'mocha']
			}
		},
		mocha: {
			test: {
				src: ['test/**/*.html']
			}
		},
		jshint: {
			lib: {
				src: 'hyacinth.js'
			},
			test: {
				src: ['test/**/*.js', '!test/lib/**/*.js']
			}
		}
	});
	
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-mocha');
	grunt.loadNpmTasks('grunt-contrib-jshint');

	grunt.registerTask('default', ['jshint', 'mocha']);
};
