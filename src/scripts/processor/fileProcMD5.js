(function(angular, factory) {
    if (typeof define === 'function' && define.amd) {
        define('angular-file-process-cal-md5', ['angular'], function(angular) {
            return factory(angular);
        });
    } else {
        return factory(angular);
    }
}(angular || null, function(angular) {
    var app = angular.module('fileProcMD5', []);

    app.factory('$fileProcMD5', ['$fileProcess', function($fileProcess) {
        'use strict';

        function FileMD5Calculator() {}

        FileMD5Calculator.prototype = {
            constructor: FileMD5Calculator,

            _construct: function() {

                // extend the item
                var item = angular.extend(this,
                    {
                        md5: "",
                        _reader: new FileReader()
                    }
                );

                var proc   = item.proc;
                var reader = item._reader;

                reader.onprogress = function(event) {
                    var progress = event.lengthComputable ? event.loaded * 100 / event.total : 0;
                    proc.trigger($fileProcess.EVT.IN_PROGRESS, item, Math.round(progress));
                };

                reader.onload = (function(theFile) {
                    return function(event) {
                        item.md5 = md5(event.target.result);
                        proc.trigger($fileProcess.EVT.IN_LOAD, item, reader);
                    };
                })(item.file);

                reader.onerror = function() {
                    proc.trigger($fileProcess.EVT.IN_ERROR, item, reader);
                };

                reader.onabort = function() {
                    proc.trigger($fileProcess.EVT.IN_ABORT, item, reader);
                };
            },

            _destruct: function() {},

            _process: function() {
                this._reader.readAsBinaryString(this.file);
            },

            _abort: function() {
                this._reader.abort();
            }
        };

        return FileMD5Calculator;
    }]);

    return app;
}));
