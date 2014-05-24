describe('Test file item definition', function() {

    beforeEach(function(){
        this.addMatchers({
            toEqualData: function(expected) {
                return angular.equals(this.actual, expected);
            }
        });
    });

    function DummyFileProcessor() {}

    DummyFileProcessor.prototype = {

        /**
         * Initialise the item
         */
        _construct: function () {
            this.pig = "pig";
        },

        _destruct: function () {

        },

        _process: function() {},

        _abort: function() {}
    };

    beforeEach(module('angularFileProcess'));

    var $rootScope, $fileProcess, timeNow, fileProcessor, itemList;

    var dummyProcessor = new DummyFileProcessor();

    beforeEach(inject(function(_$rootScope_, _$controller_, _$fileProcess_) {
        // Create a new scope that's a child of the $rootScope
        $rootScope   = _$rootScope_.$new();
        $fileProcess = _$fileProcess_;
    }));

    it('should call construct() when an item is created', function() {

        spyOn(dummyProcessor, '_construct').andCallThrough();

        var fileHandler = $fileProcess.create({
            scope: $rootScope,
            Processor: dummyProcessor
        });

        var param = {};

        var item = new $fileProcess.Item();

        expect(dummyProcessor._construct).toHaveBeenCalled();

        // should add the new attribute when calling construct()
        expect(item.pig).toBe('pig');
    });

    it('should have all the items created with unique id started from 0 with new FileProcess instance', function() {

        var fileHandler = $fileProcess.create({
            scope: $rootScope,
            Processor: dummyProcessor
        });

        var itemNum = 100;
        var sum = 0;

        for (var i = 0; i < itemNum; i++) {
            var item = new $fileProcess.Item();
            sum = sum + item.uid;
        }

        expect(sum).toEqual(99*50);
    });
});