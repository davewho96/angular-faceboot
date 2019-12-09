import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { Comment } from '../models/comment';
import { GLOBAL } from './global';

@Injectable({
	providedIn: 'root'
})
export class CommentService {
	public url: string;

	constructor(public _http: HttpClient) { 
		this.url = GLOBAL.url;
	}

	/** Método para AÑADIR una publicación nueva **/
	newComment(token, comment):Observable<any>{
		let params = JSON.stringify(comment);
		let headers = new HttpHeaders().set('Content-Type', 'application/json').set('Authorization', token);

		return this._http.post(this.url+'comment', params, {headers:headers});
	}

	/** Método para sacar LISTA de PUBLICACIONES **/
	getComments(token, page = 1):Observable<any>{
		let headers = new HttpHeaders().set('Content-Type', 'application/json').set('Authorization', token);

		return this._http.get(this.url+'comments/'+page, {headers:headers});
	}

	/** Método para BORRAR una PUBLICACIÓN **/
	deleteComment(token, id):Observable<any>{
		let headers = new HttpHeaders().set('Content-Type', 'application/json').set('Authorization', token);

		return this._http.delete(this.url+'comment/'+id, {headers:headers});
	}

	/** Método para sacar LISTA de PUBLICACIONES de un usuario en concreto **/
	getCommentsByUser(token, page = 1, user_id):Observable<any>{
		let headers = new HttpHeaders().set('Content-Type', 'application/json').set('Authorization', token);

		return this._http.get(this.url+'comments-user/'+user_id+ '/' +page, {headers:headers});
	}
}
