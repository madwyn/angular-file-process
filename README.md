#angular-file-process

Angular File Process is a file processing module for the AngularJS framework.

You can use drag-n-drop and it provides processing progress, validation filters and a file processing queue.

You can use it for file uploading, file reading and other kinds of processing.

You can also write plugins to do your own processing.

##Dependencies

- The [AngularJS](https://github.com/angular/angular.js) framework.
- It also relies on HTML5 to fully functional, but it could be modified to support old browsers.

##In the package

###Directives:

- `ngFileSelect`: To be bound to the `<input type="file" />` element. Then the `file:add` events will be sent to the `$fileProcess` module, where the files which passed the filters will be added to the processing queue.
- `ngFileDrop`: 
- `ngFileOver`: 

###Service:

- `$fileProcess`: Controls the processing queue, triggers events and handles actions.

###File Processors:

- `$fileMD5`: Generates md5 of files. Very basic example for writing a file processor. Will require [FastMD5](https://github.com/iReal/FastMD5) to work. Please check the demo for details.
- `$fileUploader`: For file uploading, quite similar as [angular-file-upload](https://github.com/nervgh/angular-file-upload).

##The `$fileProcess` API

###Attributes
- autoStart `boolean`: Start processing automatically after loading the files.
- removeAfterProc `boolean`: Remove the tem from the queue after processing.
- Processor `Object`: The processor plugin will be used for file processing.
- scope `Object`: Scope for the HTML update, the working area.
- itemList `ItemList`: The processing queue contains the file items.
- filters `Array`: The filters to be applies before items adding to the queue.

###Functions

- `addFiles`: Add files to the processing list.
- `processItem`: Process one given item.
- `processAll`: Process all the unprocessed items.
- `abortItem`: Abort the processing of the given item.
- `abortAll`: Abort the processing task for all items.
- `removeItem`: Remove an item from the list.
- `removeAll`: Remove all the items from the list.
- `findItemsReadyToBeProcessed`: Find the items ready to be processed. These includes the unprocessed and aborted items.
- `findItemsToBeProcessed`: Find the items marked as `TO_BE_PROCESSED`. The items will be marked as such before they go processing.
- `findItemsInProcessing`: Find the items being processed.

###Events

The event names are stored in the enum `$fileProcess.EVT`. Access the event name: `$fileProcess.EVT.ABORT_ITEM`.

The internal instance of class `Process` is called `proc`.

    ABORT_ITEM                  : When an item is aborted.
    ABORT_ALL                   : When abortAll() is called.
    ERROR_ITEM                  : When the processor returned error during/after processing.
    SUCCESS_ITEM                : When the processor returned success after processing.
    PROGRESS_ITEM               : When the processor is progressing an item.
    PROGRESS_ALL                : When the proc is updating the over all progress.
    COMPLETE_ALL                : When the task list is complete.
    BEFORE_ADDING_A_FILE        : Before adding a file to the list.
    AFTER_ADDING_A_FILE         : After adding a file to the list.
    WHEN_ADDING_A_FILE_FAILED   : When adding a file failed, usually caused by failure to passing the filter.
    AFTER_ADDING_ALL            : After adding all files.
    BEFORE_PROCESSING_ITEM      : Before processing an item.
    BEFORE_PROCESSING_ALL       : Before processing all items in the list.


##Using it as a file MD5 generator

    var fileHandler = $fileProcess.create({
        scope: $scope,
        Processor: $fileProcMD5
    });

Please refer to the demo for more using details.

##Using it as a file uploader

    var fileHandler = $fileProcess.create({
        scope: $scope,
        Processor: $fileUploader
    });

##Using it your way

To extend the angular-file-process is easy. Just implement the 4 basic functions:

- `_construct`: Will be called during the construction of each Item object, use it as the constructor.
- `_destruct`: Will be called when removing an item.
- `_process`: Process an item, it should at least trigger the `IN_SUCCESS` event.
- `_abort`: Abort the processing, it should at least trigger the `IN_ABORT` event.

For more details, please refer to `fileProcMD5.js` as an example.

##Installing Dependencies

Before building the project, please install and configure the following dependencies:

- [Git](http://git-scm.com/): For source control.
- [Node.js](http://nodejs.org/): For running Grunt.
- [Grunt](http://gruntjs.com/): The build system. Install the grunt command-line tool globally with:

    `npm install -g grunt-cli`
    
- [Bower](http://bower.io/): Manage client-side packages. Install the bower command-line tool globally with:

    `npm install -g bower`

##Building angular-file-process

    # Clone the repository
    git clone https://github.com/madwyn/angular-file-process angular-file-process
    
    # Go to the directory
    cd angular-file-process
    
    # Install node.js dependencies:
    npm install
    
    # Install bower components:
    bower install
    
    # Build angular-file-process:
    grunt package

##Run the unit tests

    karma start karma.conf.js

##Inspired by the [angular-file-upload](https://github.com/nervgh/angular-file-upload) project

Great thanks to [nervgh](https://github.com/nervgh) and other developers! I get the most ideas from that project, you can still find these two projects share a lot in common.

##Why build the wheel and what's the difference?

I would like to build a more general file handling module rather than just uploading files. To be more specific, I was learning AngularJS and hoping to write a tiny tool which calculates the MD5 of files locally. That was where all of this started.

The BIG difference is this module is extensible, it is designed to be more generic.

Some of the small differences:

- Independent `ItemList` class for queue handling, increased testability.
- Improved task queue handling. The functions like `abortAll()` can work with FileReader and other handlers.
- Different state machine approach for controlling the item status.
- Added tests. Currently only the `ItemList` is tested. More tests will be added.