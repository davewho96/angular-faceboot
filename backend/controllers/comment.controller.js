'use strict'

var path = require('path');
var fs = require('fs'); // librería de NodeJS para trabajar con arvhivos
var mongoosePaginate = require('mongoose-pagination');
var moment = require('moment');

var Comment = require('../schema/comment.schema');
var Follow = require('../schema/seguir.schema');
var User = require('../schema/usuario.schema');



/*** Método de pruebas ***/
function probando(req, res){
	res.status(200).send({message: 'Hola desde el controlador de Comentarios'});
}

/*** Método para guardar nuevas publicaciones ***/
function saveComment(req, res){
	var params = req.body;

	if(!params.text) return res.status(200).send({message: 'ERROR: Debes enviar un texto'});
	var comment = new Comment();
	comment.text = params.text;
	comment.file = null;
	comment.user = req.user.sub;
	comment.created_at = moment().unix();

	comment.save((err, commentStored) => {
		if(err) return res.status(500).send({message: 'ERROR al guardar la publicación!!!'});
		if(!commentStored) return res.status(404).send({message: 'ERROR: la publicación no ha sido guardada'});

		return res.status(200).send({commentStored});
	});
}

/*** Método para devolver las publicaciones de los usuarios que estoy siguiendo ***/
function getComments(req, res){

	var page = 1;
	if(req.params.page){
		page = req.params.page;
	}

	var items_per_page = 5;

	Follow.find({user: req.user.sub}).exec((err,follows) => {
		if(err) return res.status(500).send({message: 'ERROR al devolver el seguimiento!!!'});

		var follows_clean = [];

		follows.forEach((follow) => {
			follows_clean.push(follow.followed);
		});
		follows_clean.push(req.user.sub); // Añado también mis publicaciones

		Comment.find({user: {'$in': follows_clean}}).sort('-created_at').populate('user', 'name surname image _id').paginate(page, items_per_page, (err, comments, total) => {
			if(err) return res.status(500).send({message: 'ERROR al devolver publicaciones!!!'});
			if(total == 0) return res.status(404).send({message: 'NO hay publicaciones'});

			return res.status(200).send({
				total_items: total,
				pages: Math.ceil(total/items_per_page),
				page: page,
				items_per_page: items_per_page,
				comments
			})
		});
	});
}

/*** Método para devolver las publicaciones de un usuario concreto ***/
function getCommentsByUser(req, res){
	var user_id;
	var page = 1;

	if(!req.params.id){
		return res.status(500).send({message: 'ERROR al devolver publicaciones!!!'});
	}else{
		user_id  = req.params.id;
	}
	if(req.params.page){
		page = req.params.page;
	}

	var items_per_page = 5;

	Comment.find({user: user_id}).sort('-created_at').populate('user', 'name surname image _id').paginate(page, items_per_page, (err, comments, total) => {
		if(err) return res.status(500).send({message: 'ERROR al devolver publicaciones!!!'});
		if(total == 0) return res.status(404).send({message: 'NO hay publicaciones'});

		return res.status(200).send({
			total_items: total,
			pages: Math.ceil(total/items_per_page),
			page: page,
			items_per_page: items_per_page,
			comments
		})
	});
}

/*** Método para devolver una publicación por su id ***/
function getComment(req, res){
	var comment_id = req.params.id;

	Comment.findById(comment_id, (err, comment) => {
		if(err) return res.status(500).send({message: 'ERROR al devolver la publicacion!!!'});
		if(comment.length == 0) res.status(404).send({message: 'NO existe la publiación!!'});

		return res.status(200).send({comment});
	});
}

function deleteComment(req, res){
	var comment_id = req.params.id;

	Comment.findOneAndRemove({user: req.user.sub, '_id':comment_id},(err, commentRemoved) => {
		if(err) return res.status(500).send({message: 'ERROR al borrar la publicacion!!!'});
		if(!commentRemoved) res.status(404).send({message: 'NO se ha borrado la publicación!! Comprueba que seas su autor.'});

		return res.status(200).send({message: 'Publicación eliminada correctamente'});
	});
}

/*** Método para subir archivos a la publicación ***/
function uploadImage(req, res){
	var comment_id = req.params.id;

	if(req.files){ //comprobamos que hay archivos para subir
		var file_path = req.files.image.path;
		var file_split = file_path.split('\\'); // devuelve un array con los elementos separados donde había una '\'

		var file_name = file_split[2];

		var ext_split = file_name.split('\.');
		var file_ext = ext_split[1];

		if(file_ext == 'png' || file_ext == 'jpg' || file_ext == 'jpeg' || file_ext == 'gif'){

			Comment.findOne({'user': req.user.sub, '_id':comment_id}).exec((err, comment) => {
				if (comment){
					Comment.findByIdAndUpdate(comment_id, {file: file_name}, {new:true}, (err, commentUpdated) => {
						if(err) return res.status(500).send({message: 'Error en la petición!!'});
						if(!commentUpdated) return res.status(404).send({message: 'NO se ha podido actualizar la publicación!!'});

						return res.status(200).send({comment: commentUpdated});
					});
				}else{
					return removeFilesUploads(res, file_path, 'No tienes permiso para actualizar esta publicación!!');
				}
			});

		} else {
			return removeFilesUploads(res, file_path, 'Extensión no válida!!');
		}

	} else {
		return res.status(200).send({message: 'NO se han subido archivos!!!'});
	}
}

/*** Método para mostrar el archivo de la publicación ***/
function getImageFile(req, res){
	var image_file = req.params.imageFile;
	var path_file = './uploads/comments/'+image_file;

	fs.exists(path_file, (exists) => {
		if(exists){
			res.sendFile(path.resolve(path_file));
		}else{
			res.status(200).send({message: 'NO existe la imagen!!!'});
		}
	});
}


module.exports = {
	probando,
	saveComment,
	getComments,
	getCommentsByUser,
	getComment,
	deleteComment,
	uploadImage,
	getImageFile,
}


//** FUNCIONES AUXILIARES **//

/*** Método auxiliar para borrar ficheros subidos ***/
function removeFilesUploads(res, file_path, message){
	fs.unlink(file_path, (err) => {
		return res.status(200).send({message: message});
	});
}