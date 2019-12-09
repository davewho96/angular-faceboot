'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = Schema({
	name: String,
	surname: String,
	nick: String,
	email: String,
	role: String,
	sex: String,
	birth: Date,
	password: String,
	image: String,
	status: String,
	music: String,
	movies: String
});

module.exports = mongoose.model('User', UserSchema);