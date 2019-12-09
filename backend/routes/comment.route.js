'use strict'

var express = require('express');
var CommentController = require('../controllers/comment.controller');
var api = express.Router();
var md_auth = require('../middlewares/authenticated');

var multipart = require('connect-multiparty');
var md_upload = multipart({uploadDir: './uploads/comments/'});

api.get('/probando-pub', md_auth.ensureAuth, CommentController.probando);
api.post('/comment', md_auth.ensureAuth, CommentController.saveComment);
api.get('/comments/:page?', md_auth.ensureAuth, CommentController.getComments);
api.get('/comments-user/:id/:page?', md_auth.ensureAuth, CommentController.getCommentsByUser);
api.get('/comment/:id', md_auth.ensureAuth, CommentController.getComment);
api.delete('/comment/:id', md_auth.ensureAuth, CommentController.deleteComment);
api.post('/upload-image-pub/:id', [md_auth.ensureAuth,md_upload], CommentController.uploadImage);
api.get('/get-image-pub/:imageFile', CommentController.getImageFile);


module.exports = api;