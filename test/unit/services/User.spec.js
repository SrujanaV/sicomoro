require('../../../config/globals.js');

global.Config = require('../../../api/services/Config');
var User = require('../../../api/services/User');
var allCases = require('../../cases/User.cases');
var sinon = require('sinon');
var assert = require('assert');

describe('Checking User Service', function () {
    _.each(allCases, function (sinCase) {
        describe(sinCase.funcName + "()", function () {
            if (sinCase.type == "callback") {
                _.each(sinCase.cases, function (test) {
                    it(test.name, function (done) {
                        var testCallback = function () {
                            var retVal = true;
                            var returnArr = [];
                            _.each(arguments, function (arg, index2) {
                                var testVal = test.expected[index2](arg);
                                returnArr.push(testVal);
                                retVal = retVal && testVal;
                            });
                            if (retVal) {
                                done();
                            } else {
                                done(returnArr);
                            }
                        };
                        User.findOne.apply(User, _.concat(test.args, testCallback));
                    });
                });
            } else if (sinCase.type == "return") {
                _.each(sinCase.cases, function (test) {
                    it(test.name, function () {
                        var res = User[sinCase.funcName].apply(null, test.args);
                        assert.equal(res, test.expected);
                    });
                });
            }
        });
    });
});