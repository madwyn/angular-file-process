#angular-file-process

Angular File Process is a file processing module for AngularJS framework.

You can use drag-n-drop and it supports processing progress, validation filters and a file processing queue.

You can use it for file uploading, file reading and other kinds of processing.

You can also write plugins to extend the functionality.

##Dependencies

The [AngularJS](https://github.com/angular/angular.js) framework.

It also relies on HTML5 to fully functional, but it could be modified to support old browsers.

##In the package

###Directives:

- `ngFileSelect`:
- `ngFileDrop`:(TODO)
- `ngFileOver`:(TODO)

###Service:

- `$fileProcess`: controls the processing queue, triggers events and handles actions.

###File Processors:

- `fileProcMD5.js`: contains `$fileMD5` for MD5 calculation of files. Very basic example for writing a file processor. Will require [FastMD5](https://github.com/iReal/FastMD5) to work. Please check the demo for details.
- `fileUploader.js`: contains `$fileUploader` for file upload, quite similar as [angular-file-upload](https://github.com/nervgh/angular-file-upload).

##The `$fileProcess` API

For the time being, please refer to the code and the demo.
(TODO)

##How to use?

For the time being, please refer to the demo.
(TODO)

##How to build?

Please install [node.js](http://nodejs.org/) and [Grunt](http://gruntjs.com/) to build.

Run `grunt deploy` for a release build or `grunt debug` for a debug build.

##How to test?

Please install [Bower](http://bower.io/), [Karma](http://karma-runner.github.io/0.12/index.html) and [karma-jasmine](https://github.com/karma-runner/karma-jasmine) for the testing.

Run `karma start karma.conf.js`

##What else?

This module is extensible. You can write your own file processors to enrich the functionality.

##Inspired by the [angular-file-upload](https://github.com/nervgh/angular-file-upload) project

Great thanks to [nervgh](https://github.com/nervgh) and other developers! I get the most ideas from that project, you can still find these two projects share a lot in common.

##Why build the wheel and what's the difference?

I would like to build a more general file handling module rather than just uploading files. To be more specific, I was learning AngularJS and hoping to write a tiny tool which calculates the MD5 of files locally. That was where all of this started.

The BIG difference is this module is extensible, it is designed to be more generic. It also can be used as a file uploader, all you have to do is to use the $fileUploader.

Some of the small differences:

- Independent `ItemList` class for queue handling, increased testability.
- Improved task queue handling. The functions like `abortAll()` can work with FileReader and other handlers.
- Difference state machine approach for controlling the item status.
- Added tests. Currently only the `ItemList` is tested. More tests will be added.