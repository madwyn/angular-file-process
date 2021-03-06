(function(angular, factory) {
    if (typeof define === 'function' && define.amd) {
        define('angular-file-process', ['angular'], function(angular) {
            return factory(angular);
        });
    } else {
        return factory(angular);
    }
}(angular || null, function(angular) {