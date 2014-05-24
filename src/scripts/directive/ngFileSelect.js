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