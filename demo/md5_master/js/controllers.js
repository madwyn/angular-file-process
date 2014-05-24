/**
 * Created by Yanan Wen on 28/03/14.
 */
var md5toolApp = angular.module('md5toolApp', ['ui.bootstrap', 'angularFileProcess', 'fileProcMD5']).
controller('MD5UIControl', function($scope) {
    /**
     * The menu tabs
     * @type {{title: string, url: string}[]}
     */
    $scope.tabs = [
        { title:"Text", url: 'tabText.html' },
        { title:"File", url: 'tabFile.html' }
    ];

    /**
     * Save the current tab selection made by user
     */
    $scope.saveCurTab = function(title) {
        // use web storage to remember the last selection
        if (   (typeof(Storage) !== "undefined")
            && (typeof(title) !== 'undefined')) {
            // remember current
            localStorage.setItem("md5LastTab", title);
        }
    };

    /**
     * Restore the last tab selection made by user
     */
    $scope.initFileTabs = function() {

        if (typeof(Storage)!=="undefined") {
            // retrieve the last tab selection from the local storage
            var title = localStorage.getItem("md5LastTab");
            if (title) {
                $scope.tabs.forEach(function(tab) {
                    tab.active = (tab.title === title);
                });
            }
        }
    };
});

// FocusOn directive
md5toolApp.directive('focusOn', function() {
    return function(scope, elem, attr) {
        scope.$on('focusOn', function(e, name) {
            if(name === attr.focusOn) {
                elem[0].focus();
            }
        });
    };
});

md5toolApp.factory('focus', function ($rootScope, $timeout) {
    return function(name) {
        $timeout(function (){
            $rootScope.$broadcast('focusOn', name);
        });
    }
});

// Select Directive
md5toolApp.directive('selectAs', function() {
    return function(scope, elem, attr) {
        scope.$on('selectAs', function(e, name) {
            if(name === attr.selectAs) {
                elem[0].select();
            }
        });
    };
});

md5toolApp.factory('selectIt', function ($rootScope, $timeout) {
    return function(name) {
        $timeout(function (){
            $rootScope.$broadcast('selectAs', name);
        });
    }
});

/**
 * The controller or text to MD5 conversion
 */
md5toolApp.controller('MD5TextControl', function(focus, selectIt) {
    this.txt = '';
    this.md5 = '';

    this.calMD5 = function() {
        this.md5 = md5(this.txt);
        selectIt('MD5Output');
    };

    this.selectMD5 = function() {
        selectIt('MD5Output');
    };

    this.clear = function() {
        this.txt = '';
        this.md5 = '';
        focus('textInput');
    };
});


/**
 * The controller for file to MD5 conversion
 */
md5toolApp.controller('MD5FileControl', function($scope, $filter, $fileProcess, $fileProcMD5) {

    var fileHandler = $scope.fileHandler = $fileProcess.create({
        scope: $scope,  // to automatically update the html. Default: $rootScope,
        Processor: $fileProcMD5,
        filters: [
            function (item) { // first user filter
                console.info('filter1');
                return true;
            }
        ]
    });

    // Add filters
    fileHandler.filters.push(function (item) { // second user filter
        console.info('filter2');
        return true;
    });

    // Register handlers
    fileHandler.bind($fileProcess.EVT.BEFORE_ADDING_A_FILE, function (event, item) {
        console.info('Before adding a file', item);
    });

    fileHandler.bind($fileProcess.EVT.AFTER_ADDING_A_FILE, function (event, item) {
        console.info('After adding a file', item);
    });

    fileHandler.bind($fileProcess.EVT.WHEN_ADDING_A_FILE_FAILED, function (event, item) {
        console.info('When adding a file failed', item);
    });

    fileHandler.bind($fileProcess.EVT.AFTER_ADDING_ALL, function (event, items) {
        console.info('After adding all files', items);
    });

    fileHandler.bind($fileProcess.EVT.BEFORE_PROCESSING_ITEM, function (event, item) {
        console.info('Before processing an item: ', item.file.name);
    });

    fileHandler.bind($fileProcess.EVT.BEFORE_PROCESSING_ALL, function (event, proc) {
        console.info('Before processing all: ' + proc);
    });

    fileHandler.bind($fileProcess.EVT.ABORT_ITEM, function (event, item) {
        console.info('Abort an item' + item);
    });

    fileHandler.bind($fileProcess.EVT.ABORT_ALL, function (event, proc) {
        console.info('Abort all items' + proc);
    });

    fileHandler.bind($fileProcess.EVT.ERROR_ITEM, function (event, item) {
        console.info('Processing item returned error' + item);
    });

    fileHandler.bind($fileProcess.EVT.SUCCESS_ITEM, function (event, item) {
        console.info('Processing item returned success' + item);
    });

    fileHandler.bind($fileProcess.EVT.PROGRESS_ITEM, function (event, item) {
        console.info('Progress an item' + item);
    });

    fileHandler.bind($fileProcess.EVT.PROGRESS_ALL, function (event, proc) {
        console.info('Progress all' + proc);
    });

    fileHandler.bind($fileProcess.EVT.COMPLETE_ALL, function (event, proc) {
        console.info('All processing complete' + proc);
    });

});
