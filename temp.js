// var JSHINT = require("jshint").JSHINT;
// var jetpack = require('fs-jetpack');
// var _ = require("lodash");

// var source = jetpack.read('api/services/User.js');
// JSHINT(source, {
//     undef: false,
//     maxdepth: 1
// });
// var report = JSHINT.data();
// jetpack.write("demo.json", report);




function abc() {
    console.log(arguments);
}

abc.apply(null, [1, 2, 3, 4, 5, "Chintan", function () {
    console.log(123);
}]);