/*
  angular-file-process v0.0.1
  https://github.com/madwyn/angular-file-process
 */
(function(angular, factory) {
    if (typeof define === 'function' && define.amd) {
        define('angular-file-process', ['angular'], function(angular) {
            return factory(angular);
        });
    } else {
        return factory(angular);
    }
}(angular || null, function(angular) {
var app = angular.module('angularFileProcess', []);
// It is attached to an element that catches the event drop file
app.directive('ngFileDrop', ['$fileProcess', function ($fileProcess) {
    'use strict';

    return {
        // don't use drag-n-drop files in IE9, because not File API support
        link: !$fileProcess.isHTML5 ? angular.noop : function (scope, element, attributes) {
            element
                .bind('drop', function (event) {
                    var dataTransfer = event.dataTransfer ?
                        event.dataTransfer :
                        event.originalEvent.dataTransfer; // jQuery fix;
                    if (!dataTransfer) return;
                    event.preventDefault();
                    event.stopPropagation();
                    scope.$broadcast('file:removeoverclass');
                    scope.$emit('file:add', dataTransfer.files, scope.$eval(attributes.ngFileDrop));
                })
                .bind('dragover', function (event) {
                    var dataTransfer = event.dataTransfer ?
                        event.dataTransfer :
                        event.originalEvent.dataTransfer; // jQuery fix;

                    event.preventDefault();
                    event.stopPropagation();
                    dataTransfer.dropEffect = 'copy';
                    scope.$broadcast('file:addoverclass');
                })
                .bind('dragleave', function () {
                    scope.$broadcast('file:removeoverclass');
                });
        }
    };
}]);
// It is attached to an element which will be assigned to a class "ng-file-over" or ng-file-over="className"
app.directive('ngFileOver', function () {
    'use strict';

    return {
        link: function (scope, element, attributes) {
            scope.$on('file:addoverclass', function () {
                element.addClass(attributes.ngFileOver || 'ng-file-over');
            });
            scope.$on('file:removeoverclass', function () {
                element.removeClass(attributes.ngFileOver || 'ng-file-over');
            });
        }
    };
});
// It is attached to <input type="file"> element like <ng-file-select="options">
app.directive('ngFileSelect', [ '$fileProcess', function ($fileProcess) {
    return {
        link: function(scope, element, attributes) {
            if ($fileProcess.isHTML5) {
                // TODO after binding the change event this way, the file select will display "No file chosen" label even if there are files been selected
                element.bind('change', function() {
                    var data = this.files;
                    var options = scope.$eval(attributes.ngFileSelect);

                    scope.$emit('file:add', data, options);

                    if (element.attr('multiple')) {
                        element.prop('value', null);
                    }
                });
            }
            else {
                // The multiple attribute is new in HTML5.
                element.removeAttr('multiple');
                element.bind('change', function() {
                    var data = this;
                    var options = scope.$eval(attributes.ngFileSelect);

                    scope.$emit('file:add', data, options);
                });
            }

            element.prop('value', null); // FF fix
        }
    };
}]);
app.factory('$fileProcess', ['$rootScope', '$window', function($rootScope, $window) {
    'use strict';

    /**
     * The file process constructor
     * @param params
     * @constructor
     */
    function Process(params) {

        // default parameters
        angular.extend(this, {
            // settings
            autoStart:          false,          // start processing automatically after loading the files
            removeAfterProc:    false,          // remove the tem from the queue after processing
            Processor:          {               // a dummy file processor, all its elements must be defined
                    // construct(extend) an item
                    _construct:  function(){},
                    // destroy an item
                    _destruct:   function(){},
                    // process an item, it should at least trigger IN_SUCCESS event
                    _process:    function(){this.proc.trigger(EVT.IN_SUCCESS, this)},
                    // abort the processing, it should at least trigger IN_ABORT event
                    _abort:      function(){this.proc.trigger(EVT.IN_ABORT, this)}
            },
            scope:              $rootScope,         // the variable working scope
            itemList:           new ItemList({}),   // currently only maintain one working list
            filters:            [],                 // the filters
            // private status
            _status:            STAT.UNPROCESSED,
            _timestamp:         Date.now()
        }, params);

        // extend the Item class
        if (typeof this.Processor.prototype === 'undefined') {
            // when the external processor is not well defined
            angular.extend(Item.prototype, this.Processor);
        }
        else {
            angular.extend(Item.prototype, this.Processor.prototype);
        }

        // add the default filters
        this.filters.unshift(this._queueLimitFilter);
        this.filters.unshift(this._emptyFileFilter);

        // bind the file:add event, add the files to the list
        this.scope.$on('file:add', function(event, files, options) {
            event.stopPropagation();
            this.addFiles(files, options);
        }.bind(this));

        // register events
        this.bind(EVT.IN_PROGRESS,  Item.prototype._onProgress);
        this.bind(EVT.IN_ABORT,     Item.prototype._onAbort);
        this.bind(EVT.IN_ERROR,     Item.prototype._onError);
        this.bind(EVT.IN_SUCCESS,   Item.prototype._onSuccess); // other names for _onSuccess
        this.bind(EVT.IN_LOAD,      Item.prototype._onSuccess); // other names for _onSuccess
        this.bind(EVT.IN_COMPLETE,  Item.prototype._onSuccess); // other names for _onSuccess
        this.bind(EVT.PROC_PROGRESS,    this._onProgress);
        this.bind(EVT.PROC_COMPLETE,    this._onComplete);
    }


    Process.prototype = {
        constructor: Process,

        /**
         * Check if the browser supports HTML5
         * @returns {Boolean}
         * @readonly
         */
        isHTML5: !!($window.File && $window.FormData),

        /**
         * Register an event handler
         * @param {String} event
         * @param handler
         * @returns {*|function()}
         */
        bind: function(event, handler) {
            return this.scope.$on(this._timestamp + ':' + event, handler.bind(this));
        },

        /**
         * Trigger and event
         * @param {String} event
         * @param {...*} [some]
         */
        trigger: function(event, some) {
            arguments[0] = this._timestamp + ':' + event;
            this.scope.$broadcast.apply(this.scope, arguments);
        },

        /**
         * Add file(s) to the processing list
         * @param files     The files
         * @param options   The options from directives
         */
        addFiles: function(files, options) {
            var oriLength = this.itemList.length();
            var fileList = 'length' in files ? files : [files];

            // create items based on files
            angular.forEach(fileList,
                function(file) {
                    // use the filters
                    var isValid = !this.filters.length ? true : this.filters.every(function(filter) {
                        return filter.call(this, file);
                    }, this);

                    // create an item from this file
                    var item = new Item(angular.extend({
                        file: file,
                        proc: this
                    }, options));

                    if (isValid) {
                        this.trigger(EVT.BEFORE_ADDING_A_FILE, item);
                        this.itemList.add(item);
                        this.trigger(EVT.AFTER_ADDING_A_FILE, item);
                    }
                    else {
                        this.trigger(EVT.WHEN_ADDING_A_FILE_FAILED, item);
                    }
                }
            , this);

            if (this.itemList.length() > oriLength) {
                this.trigger(EVT.AFTER_ADDING_ALL, this.itemList);
                // set progress
                this._updateProgress();
            }
            else {
                this._render();
            }

            if (this.autoStart) {
                this.processAll();
            }
        },

        /**
         * Process one given item
         * @param item
         */
        processItem: function(item) {
            item.process();
        },

        /**
         * Process all the unprocessed items
         */
        processAll: function() {
            // filter the unprocessed items
            this.findItemsReadyToBeProcessed().forEach(function(item) {
                // mark them as TO_BE_PROCESSED
                item.setToBeProcessed();
            });

            this._status = STAT.PROCESSING;
            this.trigger(EVT.BEFORE_PROCESSING_ALL, this);
            this._processNextItem();
        },

        /**
         * Abort the processing of the given item
         * @param item
         */
        abortItem: function(item) {
            item.abort();
        },

        /**
         * Abort all processing task for all
         */
        abortAll: function() {
            this.trigger(EVT.ABORT_ALL, this);

            // make the working list stop
            this._status = STAT.ABORTED;

            // also stop the current working one
            this.findItemsInProcessing().forEach(function(item) {
                item.abort();
            });
        },

        /**
         * Remove an item from the list
         * @param {Item} item
         */
        removeItem: function(item) {
            item.destruct();
            this.itemList.remove(item);
            this._updateProgress();
        },

        /**
         * Remove all the items from the list
         */
        removeAll: function() {
            // maybe abort first?
            this.itemList.clear();
            this._updateProgress();
        },

        /**
         * Process the next item
         */
        _processNextItem: function() {
            // if processing
            if (this._status === STAT.PROCESSING) {
                // find one item to process
                var item = this.findOneItemToBeProcessed();

                // if there is an item to be processed
                if (item != null) {
                    this.processItem(item);
                }
                // if there is no more item to be processed
                else {
                    // mark the status as SUCCEEDED
                    this._status = STAT.SUCCEEDED;
                    // trigger all completed
                    this._onComplete(EVT.PROC_COMPLETE, item);
                }
            }
        },

        /**
         * Handle the event PROC_PROGRESS
         * @param {String} event
         * @param {Item}   item  The item which made progress
         */
        _onProgress: function(event, item) {
            // progress the whole
            this._updateProgress(item.progress);
        },

        /**
         * Handle the event PROC_COMPLETE, complete processing an item
         * @param {String}    event
         * @param {Item/null} item  it could be null and it is not in use at the moment
         */
        _onComplete: function(event, item) {

            if (this.removeAfterProc) {
                this.removeItem(item);
            }

            this._updateProgress();

            switch (this._status) {
                // currently is processing items, then continue to process next if there is any
                case STAT.PROCESSING: {
                    // process next
                    this._processNextItem();
                    return;
                }
                // if the ABORT command was performed, then the queue should stop and mark the remaining TO_BE_PROCESSED as aborted
                case STAT.ABORTED: {
                    // mark the TO_BE_PROCESSED items as aborted
                    this.findItemsToBeProcessed().forEach(function(item) {
                        item.abort();
                    });
                    return;
                }
                case STAT.SUCCEEDED:
                case STAT.ERROR: {
                    // completed, trigger COMPLETE_ALL event
                    this.trigger(EVT.COMPLETE_ALL, this.itemList);
                    return;
                }
                default: {
                    return;
                }
            }
        },


        /**
         * Update the overall progress, when:
         *      1. The number of files changed (add/remove)
         *      2. An item is progressing
         *      3. Processing is completed (Success/Error)
         * @param {int} itemProgress [0, 100]
         * @private
         */
        _updateProgress: function(itemProgress) {

            if (this.removeAfterProc) {
                this.progress = (itemProgress || 0);
            }
            else {
                var total     = this.itemList.length();
                var processed = this.countItemsProcessed();
                var ratio     = 100 / total;
                var current   = (itemProgress || 0) * ratio / 100;

                this.progress = Math.round(processed * ratio + current);
            }

            this.trigger(EVT.PROGRESS_ALL, this, this.progress);

            this._render();
        },

        /**
         * Update the angular scope
         * TODO need to learn more about $digest(), why and when to use
         * @private
         */
        _render: function() {
            if (!this.scope.$$phase) this.scope.$digest();
        },

        /**
         * Find the items ready to be processed
         * @returns {Array}
         */
        findItemsReadyToBeProcessed: function() {
            return this.itemList.filter(function(item) {
                return item.isReady();
            });
        },

        /**
         * Find one item to be processed
         * @returns {Item/null}
         */
        findOneItemToBeProcessed: function() {
            // loop should be faster than filter
            for (var i = 0; i < this.itemList.length(); i++) {
                if (this.itemList.get(i).isToBeProcessed())
                    return this.itemList.get(i);
            }

            return null;
        },

        /**
         * Find the items marked as to be processed
         * @returns {Array}
         */
        findItemsToBeProcessed: function() {
            return this.itemList.filter(function(item) {
                return item.isToBeProcessed();
            })
        },

        /**
         * Find the items been processing
         * @returns {Array}
         */
        findItemsInProcessing: function() {
            return this.itemList.filter(function(item) {
                return item.isProcessing();
            })
        },

        /**
         * Count the processed item
         * @returns {number}
         */
        countItemsProcessed: function() {
            var num = 0;

            this.itemList.list.forEach(function(item) {
                if (item.isProcessed()) {
                    num++;
                }
            });

            return num;
        },

        /**
         * Return "true" if an item is DOMElement or a file with size > 0
         * @param {File|Input} file
         * @returns {Boolean}
         * @private
         */
        _emptyFileFilter: function(file) {
            return angular.isElement(file) ? true : !!file.size;
        },

        /**
         * Return "true" if the limit has not been reached
         * @returns {Boolean}
         * @private
         */
        _queueLimitFilter: function() {
            return this.itemList.length() < this.itemList.limit;
        }
    };


    /**
     * The ItemList class
     * @param {Object} params
     * @constructor
     */
    function ItemList(params) {
        // default parameters
        angular.extend(this, {
            list:           [],                 // the item queue array
            limit:          Number.MAX_VALUE,   // the maximum items a queue can hold
            _nextItemIdx:   0                   // the index of next item
        }, params);
    }


    ItemList.prototype = {
        constructor: ItemList,

        /**
         * Add an item to the list
         * @param {Item} item
         */
        add: function(item) {
            this.list.push(item);
        },

        /**
         * Remove an item from the list
         * @param {Item} item
         */
        remove: function(item) {
            var index = this.list.indexOf(item);
            this.removeByIndex(index);
        },

        /**
         * Get an item by its index
         * @param {int} index
         * @returns {*}
         */
        get: function(index) {
            return this.list[index];
        },

        /**
         * Append another list
         * @param {Array} _list
         */
        appendArray: function(_list) {
            this.list = this.list.concat(_list);
        },

        /**
         * Remove an item by its position in the list
         * @param {int} index The position of the item
         */
        removeByIndex: function(index) {
            if (index > -1)
                this.list.splice(index, 1);
        },

        /**
         * Clear the list
         */
        clear: function() {
            while (this.list.length > 0) {
                this.list.pop();
            }
        },

        /**
         * Use a filter to get selected items
         * @param {function} itemFilter
         * @returns {boolean}
         */
        filter: function(itemFilter) {
            return this.list.filter(function(item) {
                return itemFilter(item);
            });
        },

        /**
         * Get the length of the current list
         * @returns {int}
         */
        length: function() {
            return this.list.length;
        },

        /**
         * Get the index of an item
         * @param item
         * @returns {int}
         */
        indexOf: function(item) {
            return this.list.indexOf(item);
        }
    };

    // the unique ID generator
    var uid = (function(){var id=0;return function(){if(arguments[0]===0)id=0;return id++;}})();

    /**
     * The file item constructor
     * @param {Object} params
     * @constructor
     */
    function Item(params) {

        // the ID of the item
        this.uid = uid();

        angular.extend(this, {
            file:           null,
            proc:           {
                removeItem: function(item) {},
                trigger:    function(event, item) {}
            },
            progress:       0,
            _status:        STAT.UNPROCESSED
        }, params);

        // extend the item using externally defined constructor
        this._construct();
    }


    Item.prototype = {
        constructor: Item,

        // to be used externally

        destruct: function() {
            // stop the work if the item is been processed
            if (this.isProcessing()) {
                this.abort();
            }

            // call the destructor
            this._destruct();
        },

        /**
         * remove an item
         */
        remove: function() {
            // call PROC to remove the item from the list
            this.proc.removeItem(this);
        },

        /**
         * process an item
         */
        process: function() {
            // only unprocessed and aborted are ready
            // only to_be_processed and above can be processed
            if (this.isReady() || this.isToBeProcessed()) {

                // trigger before process event
                this.proc.trigger(EVT.BEFORE_PROCESSING_ITEM, this);

                this._status = STAT.PROCESSING;

                this._process();
            }
        },

        /**
         * Abort an item
         */
        abort: function() {
            if (this.isProcessing()) {
                // call the external abort function
                this._abort();
            }
            else {
                // call the IN_ABORT event handler
                this._onAbort(EVT.IN_ABORT, this);
            }
        },

        isReady: function() {
            return ((this._status === STAT.UNPROCESSED) || (this._status === STAT.ABORTED));
        },

        isSuccess: function() {
            return (this._status === STAT.SUCCEEDED);
        },

        isError: function() {
            return (this._status === STAT.ERROR);
        },

        isAborted: function() {
            return (this._status === STAT.ABORTED);
        },

        isProcessed: function() {
            return (this._status === STAT.SUCCEEDED) || (this._status === STAT.ERROR);
        },

        isProcessing: function() {
            return this._status === STAT.PROCESSING;
        },

        isToBeProcessed: function() {
            return this._status === STAT.TO_BE_PROCESSED;
        },

        setToBeProcessed: function() {
            this._status = STAT.TO_BE_PROCESSED;
        },

        /**
         * handle EVT.IN_PROGRESS
         * @param {String} event
         * @param {Item}   item
         * @param {float}  progress
         * @private
         */
        _onProgress: function(event, item, progress) {
            item.progress = progress;
            item.proc.trigger(EVT.PROC_PROGRESS, item);
            item.proc.trigger(EVT.PROGRESS_ITEM, item, progress);
        },

        /**
         * handle EVT.IN_ABORT
         * @param {String} event
         * @param {Item}   item
         * @private
         */
        _onAbort: function(event, item) {
            item._status = STAT.ABORTED;
            item.proc.trigger(EVT.PROC_COMPLETE, item);
            item.proc.trigger(EVT.ABORT_ITEM, item);
        },

        /**
         * handle the following events:
         *      EVT.IN_SUCCESS
         *      EVT.IN_LOAD
         *      EVT.IN_COMPLETE
         *
         * @param {String} event
         * @param {Item}   item
         * @private
         */
        _onSuccess: function(event, item) {
            item._status = STAT.SUCCEEDED;
            item.proc.trigger(EVT.PROC_COMPLETE, item);
            item.proc.trigger(EVT.SUCCESS_ITEM, item);
        },

        /**
         * handle EVT.IN_ERROR
         * @param {String} event
         * @param {Item}   item
         * @private
         */
        _onError: function(event, item) {
            item._status = STAT.ERROR;
            item.proc.trigger(EVT.PROC_COMPLETE, item);
            item.proc.trigger(EVT.ERROR_ITEM, item);
        }
    };


    // status
    var STAT = {
        UNPROCESSED     : 'unprocessed',
        ABORTED         : 'aborted',
        TO_BE_PROCESSED : 'to_be_processed',
        PROCESSING      : 'processing',
        SUCCEEDED       : 'succeeded',
        ERROR           : 'error'
    };


    // the event names
    var EVT = {
        // external events triggered by proc
        ABORT_ITEM                  : 'abort_item',
        ABORT_ALL                   : 'abort_all',
        ERROR_ITEM                  : 'error_item',
        SUCCESS_ITEM                : 'success_item',
        PROGRESS_ITEM               : 'progress_item',
        PROGRESS_ALL                : 'progress_all',
        COMPLETE_ALL                : 'complete_all',
        BEFORE_ADDING_A_FILE        : 'before_adding_a_file',
        AFTER_ADDING_A_FILE         : 'after_adding_a_file',
        WHEN_ADDING_A_FILE_FAILED   : 'when_adding_a_file_failed',
        AFTER_ADDING_ALL            : 'after_adding_all',
        BEFORE_PROCESSING_ITEM      : 'before_processing_item',
        BEFORE_PROCESSING_ALL       : 'before_processing_all',

        // events for Item
        IN_PROGRESS : 'in:progress',
        IN_ABORT    : 'in:abort',
        IN_ERROR    : 'in:error',
        IN_SUCCESS  : 'in:success',
        IN_LOAD     : 'in:load',
        IN_COMPLETE : 'in:complete',

        // events for proc
        PROC_PROGRESS : 'proc:progress',
        PROC_COMPLETE : 'proc:complete'
    };


    var api = {};

    /**
     * Create a file process instance
     * @param params
     * @returns {Process}
     */
    api.create = function(params) {
        return new Process(params);
    };

    api.isHTML5 = Process.prototype.isHTML5;

    // export events
    api.EVT = EVT;

    /* test-code */
    api.Item = Item;
    api.Process = Process;
    api.ItemList = ItemList;
    /* end-test-code */

    // static functions
    return api;
}]);

    return app;
}));