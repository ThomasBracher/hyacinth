(function() {
	'use strict';

	var assert = chai.assert;

	describe('Hyacinth', function() {
		describe('Globals', function() {
			it('should always have a version', function() {
				assert.isString(Hyacinth.version);
				assert.match(Hyacinth.version, /^\d+.\d+.\d+(-beta|-dev)?/);
			});
		});
	});
})();
