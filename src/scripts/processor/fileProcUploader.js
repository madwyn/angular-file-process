(function(angular, factory) {
    if (typeof define === 'function' && define.amd) {
        define('angular-file-process-uploader', ['angular'], function(angular) {
            return factory(angular);
        });
    } else {
        return factory(angular);
    }
}(angular || null, function(angular) {
    var app = angular.module('fileProcUploader', []);

    app.factory('$fileProcUploader', ['$fileProcess', function($fileProcess) {
        'use strict';

        function FileUploader() {}

        FileUploader.prototype = {
            constructor: FileUploader,

            /**
             * Extend the file item with uploading variables
             */
            _construct: function() {
                angular.extend(this, {
                    url:        '/',
                    alias:      "file",
                    method:     'POST',
                    headers:    {},
                    formData:   [],
                    _reader:    new FileReader()
                });
            },

            /**
             * Destruct the item
             * @private
             */
            _destruct: function() {
                this._form && this._form.remove();
                this._input && this._input.remove();
                delete this._form;
                delete this._input;
            },

            /**
             * Upload the item
             */
            _process: function() {
                var transport = this.proc.isHTML5 ? '_xhrTransport' : '_iframeTransport';
                this[transport](this);
            },

            /**
             * Abort the uploading
             */
            _abort: function() {
                var prop = this.proc.isHTML5 ? '_xhr' : '_form';
                if (this[prop]) this[prop].abort();
            },

            /**
             * The XMLHttpRequest transport
             * @private
             */
            _xhrTransport: function(item) {
                var xhr = item._xhr = new XMLHttpRequest();
                var form = new FormData();
                var that = item.proc;

                item.formData.forEach(function(obj) {
                    angular.forEach(obj, function(value, key) {
                        form.append(key, value);
                    });
                });

                form.append(item.alias, item.file);

                xhr.upload.onprogress = function(event) {
                    var progress = event.lengthComputable ? event.loaded * 100 / event.total : 0;
                    that.trigger($fileProcess.EVT.IN_PROGRESS, item, Math.round(progress));
                };

                xhr.onload = function() {
                    var response = this._transformResponse(xhr.response);
                    var event    = this._isSuccessCode(xhr.status) ? $fileProcess.EVT.IN_SUCCESS : $fileProcess.EVT.IN_ERROR;
                    that.trigger(event, item, xhr, response);
                };

                xhr.onerror = function() {
                    that.trigger($fileProcess.EVT.IN_ERROR, item, xhr);
                };

                xhr.onabort = function() {
                    that.trigger($fileProcess.EVT.IN_ABORT, item, xhr);
                };

                xhr.open(item.method, item.url, true);

                xhr.withCredentials = item.withCredentials;

                angular.forEach(item.headers, function(value, name) {
                    xhr.setRequestHeader(name, value);
                });

                console.log("this is: " + item.file.name);

                xhr.send(form);
            },

            /**
             * The IFrame transport
             * @private
             */
            _iframeTransport: function(item) {
                var form = angular.element('<form style="display: none;" />');
                var iframe = angular.element('<iframe name="iframeTransport' + Date.now() + '">');
                var input = item._input;
                var that = item.proc;

                if (item._form) item._form.replaceWith(input); // remove old form
                item._form = form; // save link to new form

                input.prop('name', item.alias);

                item.formData.forEach(function(obj) {
                    angular.forEach(obj, function(value, key) {
                        form.append(angular.element('<input type="hidden" name="' + key + '" value="' + value + '" />'));
                    });
                });

                form.prop({
                    action: item.url,
                    method: 'POST',
                    target: iframe.prop('name'),
                    enctype: 'multipart/form-data',
                    encoding: 'multipart/form-data' // old IE
                });

                iframe.bind('load', function() {
                    // fixed angular.contents() for iframes
                    var html = iframe[0].contentDocument.body.innerHTML;
                    var xhr = {response: html, status: 200, dummy: true};
                    var response = this._transformResponse(xhr.response);
                    that.trigger($fileProcess.EVT.IN_LOAD, item, xhr, response);
                });

                form.abort = function() {
                    var xhr = {status: 0, dummy: true};
                    iframe.unbind('load').prop('src', 'javascript:false;');
                    form.replaceWith(input);
                    that.trigger($fileProcess.EVT.IN_ABORT, item, xhr);
                };

                input.after(form);
                form.append(input).append(iframe);

                form[0].submit();
            },

            /**
             * Checks whether upload successful
             * @param {Number} status
             * @returns {Boolean}
             * @private
             */
            _isSuccessCode: function(status) {
                return (status >= 200 && status < 300) || status === 304;
            },

            /**
             * Transforms the server response
             * @param {*} response
             * @returns {*}
             * @private
             */
            _transformResponse: function(response) {
                $http.defaults.transformResponse.forEach(function(transformFn) {
                    response = transformFn(response);
                });
                return response;
            }
        };

        return FileUploader;
    }]);

    return app;
}));
