describe('Test item list', function() {

    var uid = (function(){var id=0;return function(){if(arguments[0]===0)id=0;return id++;}})();

    function populateArray(amount) {
        var ar = [];
        for (var i = 0; i < amount; i++) {
            ar.push({x:uid()});
        }
        return ar;
    }

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    beforeEach(function(){
        this.addMatchers({
            toEqualData: function(expected) {
                return angular.equals(this.actual, expected);
            }
        });
    });

    beforeEach(module('angularFileProcess'));

    var $rootScope, $fileProcess, itemList;

    beforeEach(inject(function(_$rootScope_, _$controller_, _$fileProcess_) {
        // Create a new scope that's a child of the $rootScope
        $rootScope = _$rootScope_.$new();
        $fileProcess = _$fileProcess_;

        itemList = new $fileProcess.ItemList();
    }));

    it('should have empty list at the beginning', function() {
        expect(itemList.length()).toBe(0);
    });

    it('should return correct length of the list', function() {
        var arrayNum = 500;
        var intArray = populateArray(arrayNum);
        for (var i = 0; i < arrayNum; ++i) {
            itemList.add(intArray[i]);
            expect(itemList.length()).toEqual(i + 1);
        }
    });

    it('should be able to add one item', function() {
        var firstItem = "firstItem";
        itemList.add(firstItem);
        expect(itemList.length()).toEqual(1);
        expect(itemList.list[0]).toEqual(firstItem);
    });

    it('should be able to add more than one items', function() {
        var arrayNum = 500;
        var intArray = populateArray(arrayNum);
        for (var i = 0; i < arrayNum; ++i) {
            itemList.add(intArray[i]);
        }
        expect(itemList.length()).toEqual(arrayNum);
        expect(itemList.list).toEqualData(intArray);
    });

    it('should be able to remove any amount of items', function() {
        // prepare the test data
        var arrayNum = 500;
        var intArray = populateArray(arrayNum);

        // add the data to the list
        itemList.appendArray(intArray);

        var numItemsToBeRemoved = getRandomInt(1, arrayNum);

        var itemIdx, itemToBeRemoved;

        // generate the removed item list
        for (var i = 0; i < numItemsToBeRemoved; ++i) {
            // generate the index and get the item
            itemIdx = getRandomInt(0, arrayNum - 1 - i);
            itemToBeRemoved = itemList.get(itemIdx);

            // remove the items from the list
            itemList.remove(itemToBeRemoved);

            // the removed item should not be in the list
            expect(itemList.indexOf(itemToBeRemoved)).toBe(-1);
        }

        // the length should be reduced by numItemsToBeRemoved
        expect(itemList.length()).toBe(arrayNum - numItemsToBeRemoved);
    });

    it('should be able to remove none exist items without error', function() {
        // prepare the test data
        var arrayNum = 500;
        var intArray = populateArray(arrayNum);

        // add the data to the list
        itemList.appendArray(intArray);

        // create non-exist item
        var itemUnknown = uid();

        itemList.remove(itemUnknown);

        // the size should not be reduced
        expect(itemList.length()).toBe(arrayNum);
    });

    it('should be able to clear all the items from the list', function() {
        // prepare the test data
        var arrayNum = 500;
        var intArray = populateArray(arrayNum);

        // add the data to the list
        itemList.appendArray(intArray);

        itemList.clear();

        expect(itemList.length()).toBe(0);
    });

    it('should filter the items', function() {

        /**
         * Filter the items which are multipliers of 2
         * @param item
         * @returns {boolean}
         */
        function itemFilter(item) {
            return ((item.x % 2) == 0)
        }

        // prepare the test data
        var arrayNum = 500;
        var intArray = populateArray(arrayNum);

        // add the data to the list
        itemList.appendArray(intArray);

        var filterList = itemList.filter(itemFilter);

        expect(filterList.length).toBe(arrayNum / 2);
    });
});