describe('Test FileProcess in a whole', function() {

    beforeEach(function(){
        this.addMatchers({
            toEqualData: function(expected) {
                return angular.equals(this.actual, expected);
            }
        });
    });

    beforeEach(module('angularFileProcess'));

    var $rootScope, $fileProcess, timeNow, fileProcessor, itemList;
});