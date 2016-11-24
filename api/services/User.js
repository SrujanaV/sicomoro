var schema = new Schema({
    name: {
        type: String,
        required: true,
        excel: true
    },
    email: {
        type: String,
        validate: validators.isEmail(),
        excel: "User Email"
    },
    dob: {
        type: Date,
        excel: {
            name: "Birthday",
            modify: function (val, data) {
                return moment(val).format("MMM DD YYYY");
            }
        }
    },
    photo: {
        type: String,
        default: "",
        excel: [{
            name: "Photo Val"
        }, {
            name: "Photo String",
            modify: function (val, data) {
                return "http://abc/" + val;
            }
        }, {
            name: "Photo Kebab",
            modify: function (val, data) {
                return data.name + " " + moment(data.dob).format("MMM DD YYYY");
            }
        }]
    },
    password: {
        type: String,
        default: ""
    },
    forgotPassword: {
        type: String,
        default: ""
    },
    mobile: {
        type: String,
        default: ""
    },
    otp: {
        type: String,
        default: ""
    },
    accessToken: {
        type: [String],
        index: true
    },
    googleAccessToken: String,
    googleRefreshToken: String,
    oauthLogin: {
        type: [{
            socialId: String,
            socialProvider: String
        }],
        index: true
    },
    accessLevel: {
        type: String,
        default: "User",
        enum: ['User', 'Admin']
    }
});

schema.plugin(deepPopulate, {
    populate: {
        'user': {
            select: 'name _id'
        }
    }
});
schema.plugin(uniqueValidator);
schema.plugin(timestamps);

module.exports = mongoose.model('User', schema);

var exports = _.cloneDeep(require("sails-wohlig-service")(schema, "user", "user"));
var model = {

    generateExcel: function (name, res) {
        console.log(name);
        var Model = this;
        Model.find().exec(function (err, data) {

            var data3 = _.map(data, function (data2) {
                return modifyForExcel(data2);
            });

            function schamaObjectValConversion(newObj, schExcel, obj, key, value) {
                var name = key;
                if (schExcel.name) {
                    name = schExcel.name;
                }
                if (schExcel.modify) {
                    newObj[name] = schExcel.modify(value, obj);
                } else {
                    newObj[name] = value;
                }
            }

            function modifyForExcel(obj) {
                var newObj = {};

                _.each(schema.obj, function (sch, key) {

                    var value = obj[key];
                    switch (typeof sch.excel) {

                        case "boolean":
                            {
                                newObj[key] = value;
                            }
                            break;
                        case "string":
                            {
                                newObj[sch.excel] = value;
                            }
                            break;
                        case "object":
                            {
                                if (_.isArray(sch.excel)) {
                                    _.each(sch.excel, function (singleExcel) {
                                        schamaObjectValConversion(newObj, singleExcel, obj, key, value);
                                    });

                                } else {
                                    schamaObjectValConversion(newObj, sch.excel, obj, key, value);

                                }
                            }
                            break;
                    }

                });
                return newObj;
            }


            Config.generateExcel(name, data3, res);

        });
    },
    existsSocial: function (user, callback) {
        var Model = this;
        Model.findOne({
            "oauthLogin.socialId": user.id,
            "oauthLogin.socialProvider": user.provider,
        }).exec(function (err, data) {
            if (err) {
                callback(err, data);
            } else if (_.isEmpty(data)) {
                var modelUser = {
                    name: user.displayName,
                    accessToken: [uid(16)],
                    oauthLogin: [{
                        socialId: user.id,
                        socialProvider: user.provider,
                    }]
                };
                if (user.emails && user.emails.length > 0) {
                    modelUser.email = user.emails[0].value;
                    var envEmailIndex = _.indexOf(env.emails, modelUser.email);
                    if (envEmailIndex >= 0) {
                        modelUser.accessLevel = "Admin";
                    }
                }
                modelUser.googleAccessToken = user.googleAccessToken;
                modelUser.googleRefreshToken = user.googleRefreshToken;
                if (user.image && user.image.url) {
                    modelUser.photo = user.image.url;
                }
                Model.saveData(modelUser, function (err, data2) {
                    if (err) {
                        callback(err, data2);
                    } else {
                        data3 = data2.toObject();
                        delete data3.oauthLogin;
                        delete data3.password;
                        delete data3.forgotPassword;
                        delete data3.otp;
                        console.log(data3);
                        callback(err, data3);
                    }
                });
            } else {
                delete data.oauthLogin;
                delete data.password;
                delete data.forgotPassword;
                delete data.otp;
                data.googleAccessToken = user.googleAccessToken;
                data.save(function () {});
                console.log(data);
                callback(err, data);
            }
        });
    },
    profile: function (data, callback, getGoogle) {
        var str = "name email photo mobile accessLevel";
        if (getGoogle) {
            str += " googleAccessToken googleRefreshToken";
        }
        User.findOne({
            accessToken: data.accessToken
        }, str).exec(function (err, data) {
            if (err) {
                callback(err);
            } else if (data) {
                callback(null, data);
            } else {
                callback("No Data Found", data);
            }
        });
    },
    updateAccessToken: function (id, accessToken) {
        User.findOne({
            "_id": id
        }).exec(function (err, data) {
            data.googleAccessToken = accessToken;
            data.save(function () {});
        });
    }

};
module.exports = _.assign(module.exports, exports, model);