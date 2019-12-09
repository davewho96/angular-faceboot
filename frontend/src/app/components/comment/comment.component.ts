import { Component, OnInit, EventEmitter, Output, DoCheck } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Comment } from '../../models/comment';
import { CommentService } from '../../services/comment.service';
import { UserService } from '../../services/user.service';
import { GLOBAL } from '../../services/global';
import { UploadService } from '../../services/upload.service';

/* jQUERY */
declare var jQuery:any;
declare var $:any;

@Component({
  selector: 'app-comment',
  templateUrl: './comment.component.html',
  styleUrls: ['./comment.component.css'],
  providers: [UserService, CommentService]
})
export class CommentComponent implements OnInit, DoCheck {
	public title       : string;
	public url         : string;
	public comments: Comment[];
	public loading     : boolean;	
	public identity;
	public token;
	public status;
	public page;
	public pages;
	public total;
	public items_per_page;
	public noMore;
	public showImage;
	public comment: Comment;
	public my_stats;

	@Output() commentSended = new EventEmitter();

	constructor(
		private _route             : ActivatedRoute,
		private _router            : Router,
		private _userService       : UserService,
		private _commentService: CommentService,
		private _uploadService     : UploadService
		) { 
		this.title     = 'Muro';
		this.identity  = this._userService.getIdentity();
		this.token     = this._userService.getToken();
		this.url       = GLOBAL.url;
		this.page      = 1;
		this.noMore    = false;
		this.showImage = 0;
		this.loading   = true;
		this.comment = new Comment('', '', '', '', this.identity._id);
		this.my_stats = this._userService.getStats();
	}

	ngOnInit() {
		this.getComments(this.page);
	}

	/** Método para cargar las PUBLICACIONES. Si adding es true entonces añade páginas **/
	getComments(page, adding = false){
		this._commentService.getComments(this.token, page).subscribe(
			response => {
				if(response.comments){
					this.loading = false;
					this.total = response.total_items;
					this.pages = response.pages;
					this.items_per_page = response.items_per_page;

					if(this.pages == 1){
						this.noMore = true;
					}

					if(!adding){
						this.comments = response.comments;
					}else{
						var arrayA = this.comments; 	// lo que tengo hasta ahora
						var arrayB = response.comments;	// la siguiente página que me devuelve
						this.comments = arrayA.concat(arrayB);

						$("html, body").animate({ scrollTop: $('#timeline').prop("scrollHeight")},500);
					}

					if(page > this.pages){
						this._router.navigate(['/home']);
					}
				}else{
					this.loading = false;
					this.status = 'error';
				}

			},
			error => {
				var errorMessage = <any>error;
				console.log(errorMessage);

				if(errorMessage != null){
					this.status = 'error';
					this.loading = false;
				}
			}
			);

	}

	deleteComment(comment_id){
		this._commentService.deleteComment(this.token, comment_id).subscribe(
			response => {
				this._userService.updateMyStats('comments',-1);
				this.refreshComments();
			},
			error => {
				var errorMessage = <any>error;
				console.log(errorMessage);

				if(errorMessage != null){
					this.status = 'error';
				}
			}
			);
	}

	ngDoCheck(){
		this.my_stats = this._userService.getStats();
	}

	onSubmit(form, event){
		this._commentService.newComment(this.token, this.comment).subscribe(
			response => {
				if(response.commentStored){
					this.comment = response.commentStored;
					this.status = 'success';
					this.my_stats.comments += 1;
					this._userService.updateMyStats('comments',1);

					if(this.filesToUpload && this.filesToUpload.length){
						this._uploadService.makeFileRequest(this.url+'upload-image-pub/'+this.comment._id, [], this.filesToUpload, this.token, 'image').then((result: any) => {
							this.comment.file = result.comment.file;
							form.reset();
						});
					}

					form.reset();
					this.commentSended.emit({send:'true'});
					this._router.navigate(['/timeline']);					
				}else{
					this.status = 'error';
				}

			},
			error => {
				var errorMessage = <any>error;
				console.log(errorMessage);

				if(errorMessage != null){
					this.status = 'error';
				}
			}
			);
	}

	public filesToUpload: Array<File>;
	fileChangeEvent(fileInput: any){
		this.filesToUpload = <Array<File>>fileInput.target.files;
	}

	viewMore(){
		this.page += 1;

		if(this.page == this.pages){
			this.noMore = true;
		}

		this.getComments(this.page, true);
	}

	/** Método que captura el evento enviado por sidebar **/
	refreshComments(event = null){
		this.noMore = false;
		this.getComments(1);
	}

	showThisImage(id){
		this.showImage = id;
	}

	hideThisImage(id){
		this.showImage = 0;
	}
}
