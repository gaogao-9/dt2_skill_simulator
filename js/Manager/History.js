(function(global){
	"use strict";
	
	global.Manager = global.Manager || {};
	global.Manager.History = History; //new History():HistoryObject
	
	History.prototype = Props();
	History.prototype.Oldest = Oldest; //Oldest():{index:Number,value:any}
	History.prototype.Newest = Newest; //Newest():{index:Number,value:any}
	History.prototype.Prev   = Prev;   //Prev():{index:Number,value:any}
	History.prototype.Next   = Next;   //Next():{index:Number,value:any}
	History.prototype.Save   = Save;   //Save(value:any):Boolean
	History.prototype.Delete = Delete; //Delete():void
	History.prototype.Clear  = Clear;  //Clear():void
	History.prototype.Equals = Equals; //Equals(a:any,b:any):Boolean
	History.prototype.on     = on;     //on(eventName:String,callback:Function):void
	History.prototype.off    = off;    //off(eventName:String[,callback:Function]):void
	History.prototype.Invoke = Invoke; //Invoke(eventName:String[,argObj:Object]):void
	
//class	
	function History(){
		if(!(this instanceof History)) return new History();
//public member
		this.CanDuplicate = false;
//private member
		this._events = {};
		this._data = [];
		this._cur = -1;
	}
	
//properly
	function Props(){
		return {
			set index(value){
				if(!isFinite(value)) return;
				var oldValue = this._cur;
				
				if(this._data.length){
					this._cur = Math.max(0,Math.min(this._data.length-1,value-0));
				}
				else{
					this._cur = -1;
				}
				
				if(oldValue === this._cur) return;
				this.Invoke("indexchange",{
					"oldValue": oldValue,
					"value": this._cur
				});
			},
			get index(){
				return this._cur;
			},
			set value(value){
				var oldValue = this.value;
				var isEquals = this.Equals(oldValue,value);
				if(!this.CanDuplicate && isEquals) return;
				
				if(this._cur<0){
					this._data[0] = value;
					this.index = 0;
				}
				this._data[this._cur] = value;
				
				if(isEquals) return;
				this.Invoke("valuechange",{
					"oldValue": oldValue,
					"value": value
				});
			},
			get value(){
				if(this._cur<0) return null;
				return this._data[this._cur];
			},
			get length(){
				return this._data.length;
			},
			get isOldest(){
				if(this._data.length){
					return (this._cur === 0);
				}
				else{
					return (this._cur === -1);
				}
			},
			get isNewest(){
				return (this._cur === (this._data.length-1));
			}
		};
	}
	
//public
	function Oldest(){
		this.index = -1;
		return {
			index: this.index,
			value: this.value
		};
	}
	
	function Newest(){
		this.index = this._data.length - 1;
		return {
			index: this.index,
			value: this.value
		};
	}
	
	function Prev(){
		this.index = this._cur - 1;
		return {
			index: this.index,
			value: this.value
		};
	}
	
	function Next(){
		this.index = this._cur + 1;
		return {
			index: this.index,
			value: this.value
		};
	}
	
	function Save(value){
		var oldValue = this.value;
		var isEquals = this.Equals(oldValue,value);
		if(!this.CanDuplicate && isEquals) return false;
		
		this._data[this._cur+1] = value;
		this._data.splice(this._cur+2,this._data.length);
		
		++this.index;
		if(isEquals) return true;
		this.Invoke("valuechange",{
			"oldValue": oldValue,
			"value": value
		});
		return true;
	}
	
	function Delete(){
		if(this._cur<0) return;
		this._data.splice(this._cur,1);
		this.index = this._cur;
		this.value = this._data[this._cur];
	}
	
	function Clear(){
		this.value = null;
		this.index = -1;
	}
	
	function Equals(a,b){
		return a === b;
	}
	
	function on(eventName,callback){
		switch(eventName){
			case "indexchange":
			case "valuechange":
				if(typeof(callback) !== "function") return;
				this._events[eventName].push(callback);
				break;
		}
	}
	
	function off(eventName,callback){
		var events = this._events[eventName];
		switch(eventName){
			case "indexchange":
			case "valuechange":
				if(typeof(callback) !== "function") delete this._events[eventName];
				for(var i=events.length;i--;){
					if(events[i] !== callback) continue;
					events.splice(i,1);
					break;
				}
				break;
		}
	}
	
	function Invoke(eventName,argObj){
		if(!(eventName in this._events)) return;
		if(typeof argObj !== "object") argObj = {};
		argObj.unixtime = Date.now();
		argObj.type = eventName;
		
		for(var i=0,iLen=this._events[eventName].length;i<iLen;++i){
			if(this._events[eventName][i](argObj) === false) break;
		}
	}
})((this || 0).self || global);