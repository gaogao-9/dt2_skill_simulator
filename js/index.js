(function(){
"use strict";

var jobSelectionList = [];
var nowSkillLvList = [];
var powderNum = 0;
var hManager = null;
var saveDataList = [];

jQuery(function($){
	var template = InitTemplate();
	var dfdArr = LoadJSON("js/",["jobs.json","skills.json","lvs.json"]);	
	
	$.when.apply(null,dfdArr)
		.done(LoadJSONDone.bind(this,template))
		.fail(LoadJSONFail);
});

function LoadJSONDone(template){
	var jobs   = InitJobs(arguments[1]);
	var skills = InitSkills(arguments[2]);
	var lvs    = InitLvs(arguments[3]);
	
	GetJobByName        = GetJobByName.bind(this,jobs);
	GetSkillByName      = GetSkillByName.bind(this,skills);
	RefreshTotalSP      = RefreshTotalSP.bind(this,lvs);
	RefreshSaveData     = RefreshSaveData.bind(this,template);
	RefreshJobSelection = RefreshJobSelection.bind(this,template);
	RefreshSkillTree    = RefreshSkillTree.bind(this,template);
	
	var simContainer = $("#SimulatorContainer");
	var powdernumSelection = MakeTemplateList(template.powderNumItem,256,function(i,e){
		return {
			$value: i,
			powdernum: i
		};
	})
	var jobSelection = MakeTemplateList(template.jobSelectionItem,jobs[0].length,function(i,e){
		return {
			$value: jobs[0][i].name,
			jobname: jobs[0][i].name
		};
	});
	var classList = MakeTemplateList(template.classListItem,jobs.length,function(i,e){
		return {
			jobselection: (i==0)?jobSelection:null,
			classname: ["基本職","15Lv職","30Lv職"][i]
		}
	});
	
	simContainer.Replacer({
		classlist: classList,
		pownumselection:powdernumSelection
	});
	
	simContainer.fadeIn();
	
	InitSaveData();
	InitPowderNum();
	InitJobSelection(jobs);
	InitNowSkillLv();
	InitHistory();
	
	RefreshHistory();
	var _jobSelectionList = jobSelectionList.concat();
	var _nowSkillLvList = nowSkillLvList.concat();
	for(var i=0,iLen=_jobSelectionList.length;i<iLen;++i){
		$("[data-jobselection]").eq(i).val(_jobSelectionList[i]);
		jobSelectionList[i] = _jobSelectionList[i];
		RefreshJobSelection(i);
	}
	RefreshNowSkillLv();
	RefreshPowderNum();
	RefreshTotalSP();
	RefreshSaveData();
	RefreshSaveDataSelection();
	
	simContainer.on("click","[data-prevbtn]",HistoryPrevClick);
	simContainer.on("click","[data-nextbtn]",HistoryNextClick);
	
	simContainer.on("click","[data-sdsavebtn]",SaveDataSaveClick);
	simContainer.on("click","[data-sdloadbtn]",SaveDataLoadClick);
	simContainer.on("click","[data-sddeletebtn]",SaveDataDeleteClick);
	simContainer.on("click","[data-sdrenamebtn]",SaveDataRenameClick);
	simContainer.on("click","[data-sdimportbtn]",SaveDataImportClick);
	simContainer.on("click","[data-sdexportbtn]",SaveDataExportClick);
	
	simContainer.on("click","[data-tweetbtn]",TweetButtonClick);
	
	simContainer.on("change","[data-sdselection]",SaveDataSelectionChange);
	simContainer.on("change","[data-jobselection]",JobSelectionChange.bind(this,jobs));
	simContainer.on("change","[data-pownumselection]",PowderNumberSelectionChange);
	simContainer.on("click","[data-skilllineitem],[data-spreset]",SkillPointClick);
	
	$(window).on("beforeunload",WindowBeforeunload);
}

function LoadJSONFail(err){
	console.log("JSONの取得に失敗したみたい。。。")
	console.log(err.status + ":" + err.responseText);
}

function InitTemplate(){
	var output = {};
	var ele = $("script[type='text/x-template']");
	ele.each(function(i,e){
		e = $(e);
		output[e.attr("id")] = e.html();
	});
	return output;
}

function LoadJSON(base,path){
	var dfdArr = [];
	for(var i=0,iLen=path.length;i<iLen;++i){
		dfdArr.push(MakeDeferred(AjaxDeferred)(base+path[i]));
	}
	return dfdArr;
}

function MakeDeferred(callback){
	var dfd = $.Deferred();
	return callback.bind(this,dfd);
}

function AjaxDeferred(dfd,url){
	$.ajax({
		type: 'GET',
		url: url,
		dataType: "json"
	}).done(function(data){
		dfd.resolve(data);
	}).fail(function(err){
		dfd.reject(err);
	});
	return dfd.promise();
}

function InitJobs(arr){
	var output = [];
	for(var i=arr.length;i--;){
		output[arr[i].lv] = output[arr[i].lv] || [];
		output[arr[i].lv].unshift(arr[i]);
	}
	
	return output.filter(function(e,i){ return e});
}

function InitSkills(arr){
	var output = [];
	for(var i=arr.length;i--;){
		var index = arr[i].name.charCodeAt(0);
		output[index] = output[index] || [];
		output[index].unshift(arr[i]);
	}
	
	return output;
}

function InitLvs(arr){
	var output = arr;
	return output;
}

function InitSaveData(){
	if(!window.localStorage){
		$("[data-sdselection],[data-sdsavebtn],[data-sdloadbtn],[data-sdrenamebtn],[data-sdimportbtn],[data-sdexportbtn]").prop("disabled",true);
		return;
	}
	
	var autotitle    = localStorage["DTSIM_AUTOTITLE"];
	var autosavedata = localStorage["DTSIM_AUTOSAVEDATA"];
	var title        = localStorage["DTSIM_TITLE"];
	var savedata     = localStorage["DTSIM_SAVEDATA"];
	
	var autotitleObj;
	try{
		autotitleObj = JSON.parse(autotitle);
	}
	catch(err){
		autotitleObj = [];
	}
	var autosdObj;
	try{
		autosdObj = JSON.parse(autosavedata);
	}
	catch(err){
		autosdObj = [];
	}
	var titleObj;
	try{
		titleObj = JSON.parse(title);
	}
	catch(err){
		titleObj = [];
	}
	var sdObj;
	try{
		sdObj = JSON.parse(savedata);
	}
	catch(err){
		sdObj = [];
	}
	
	var length;
	saveDataList = [];
	
	saveDataList[0] = [];
	length = Math.min(autotitleObj.length,autosdObj.length);
	for(var i=0,iLen=autosdObj.length;i<iLen;++i){
		saveDataList[0].push({
			title: autotitleObj[i],
			value: autosdObj[i]
		});
	}
	
	saveDataList[1] = [];
	length = Math.min(titleObj.length,sdObj.length);
	for(var i=0;i<length;++i){
		saveDataList[1].push({
			title: titleObj[i],
			value: sdObj[i]
		});
	}
}

function RefreshSaveData(template){
	var autosdList = MakeTemplateList(template.savedataItem,saveDataList[0].length,function(i,e){
		return {
			$value: saveDataList[0][i].value,
			savedata: saveDataList[0][i].title
		};
	});
	var sdList = MakeTemplateList(template.savedataItem,saveDataList[1].length,function(i,e){
		return {
			$value: saveDataList[1][i].value,
			savedata: saveDataList[1][i].title
		};
	});
	$("[data-sdselection]").Replacer({
		usersd: sdList,
		autosd: autosdList
	});
}

function RefreshSaveDataSelection(){
	var ele = $("[data-sdselection]:first");
	if(ele.length===0) return;
	$("[data-sdexportbtn]").prop("disabled",!saveDataList[1].length);
	$("[data-sdloadbtn],[data-sddeletebtn],[data-sdrenamebtn]").prop("disabled",!ele.val());
	if(ele.find("option:selected").parent().attr("data-autosd") === void(0)) return;
	$("[data-sddeletebtn],[data-sdrenamebtn]").prop("disabled",true);
	
}

function StoreSaveData(index,mode){
	index = isFinite(index) ? (index-0) : -1;
	mode  = isFinite(mode) ? Math.max(0,Math.min(mode-0,2)) : 0;
	if((index<0) || (index>1)){
		StoreSaveData(0);
		StoreSaveData(1);
		return;
	}
	
	var titleStr = JSON.stringify(saveDataList[index].map(function(e,i){
		return e.title;
	}));
	var savedataStr = JSON.stringify(saveDataList[index].map(function(e,i){
		return e.value;
	}));
	var key = (index===0) ? "AUTO" : "";
	
	localStorage["DTSIM_"+key+"TITLE"]    = titleStr;
	localStorage["DTSIM_"+key+"SAVEDATA"] = savedataStr;
}

function InitHistory(){
	hManager = new Manager.History();
	hManager.Save(DataSerialize());	
	
	var res = location.search.match(/h=([a-zA-Z0-9\-\*]+)/);
	try{
		IO.DTSim.Decode(res[1]);
		hManager.Save(res[1]);
	}
	catch(err){ } //握りつぶすタイプのエラー
}

function RefreshHistory(){
	var container = $("#SimulatorContainer");
	var val = hManager.value;
	container.find("input[data-tweeturi]").val(location.origin + location.pathname + ((val!==null)?("?h="+val):""));
	container.find("input[data-prevbtn]").prop("disabled",hManager.isOldest);
	container.find("input[data-nextbtn]").prop("disabled",hManager.isNewest);
	
	DataDeserialize(val);
}

function InitPowderNum(){
	powderNum = 0;
}

function RefreshPowderNum(){
	var ele = $("[data-pownumselection]");
	if(ele.length===0) return;
	
	ele.val(powderNum);
}

function RefreshTotalSP(lvs){
	var totalSP,reqSP,reqLv,reqPow,modSP;
	var isLv15 = false;
	var isLv30 = false;
	var tmp;
	reqSP = 0;
	
	for(var i=nowSkillLvList.length;i--;){
		var skillObj = GetSkillByJobName(jobSelectionList[i]);
		for(var j=nowSkillLvList[i].length;j--;){
			tmp = skillObj[j].lv["累計SP"][nowSkillLvList[i][j]-1] || 0;
			if((i==1) && (tmp>0)) isLv15 = true;
			if((i==2) && (tmp>0)) isLv30 = true;
			reqSP += tmp;
		}
	}
	for(var i=0,iLen=lvs.length;i<iLen;++i){
		if((reqSP-powderNum*3)>lvs[i]["累計SP"]) continue;
		break;
	}
	reqLv = i+1;
	reqLv   = Math.max(1,Math.min(reqLv,99));
	if(isLv15) reqLv = Math.max(15,reqLv);
	if(isLv30) reqLv = Math.max(30,reqLv);
	
	totalSP = lvs[reqLv-1]["累計SP"] + powderNum*3;
	reqPow  = (reqLv<99) ? 0 : Math.max(0,Math.ceil((reqSP - totalSP)/3));
	modSP   = (totalSP+reqPow*3) - reqSP;
	$("#SimulatorContainer").find("[data-splist]").Replacer({
		totalsp: reqSP,
		reqlv: reqLv,
		reqpow: reqPow,
		modsp: modSP
	});
}

function InitJobSelection(jobs){
	jobSelectionList[0] = jobs[0][0].name;
	RefreshJobSelection();
}

function RefreshJobSelection(template,cIndex){
	var classIndex = cIndex || 0;
	var ele = $("[data-jobselection]");
	var isMultiJob = false;
	do{
		var selectionValue = jobSelectionList[classIndex];
		
		if(classIndex === 0){
			var selection = ele.eq(classIndex);
			if(!selection.length) break;
			selection.val(selectionValue);
		}
		
		var jobObj = GetJobByName(selectionValue);
		if(!jobObj) break;
		
		if(!isMultiJob){
			RefreshSkillTree(classIndex);
		}
		isMultiJob = false;
		
		var extend = jobObj.extend;
		if(!extend) break;
		
		var nextSelecton = ele.eq(++classIndex);
		if(!nextSelecton.length) break;
		var nextSelectionValue = nextSelecton.val(classIndex);
		jobSelectionList[classIndex] = extend[0];
		
		var jobSelection = MakeTemplateList(template.jobSelectionItem,extend.length,function(i,e){
			return {
				$value: extend[i],
				jobname: extend[i]
			};
		});
		
		nextSelecton.Replacer({
			jobselection: jobSelection
		});
		
		if(~extend.indexOf(nextSelectionValue)){
			nextSelecton.val(nextSelectionValue);
			
			isMultiJob = true;
		}
	}while(true);
}

function RefreshSkillTree(template,cIndex){
	var classIndex = cIndex || 0;
	var ele2 = $("[data-skilltree]");
	
	var skillTree = ele2.eq(classIndex);
	if(!skillTree.length) return;
	
	var skillObj = GetSkillByJobName(jobSelectionList[classIndex]);
	
	var skillTreeList = MakeTemplateList(template.skillTreeItem,skillObj.length,function(i,e){
		var skillLine = MakeTemplateList(template.skillLineItem,skillObj[i].max,function(j,e){
			return {
				$dataValue: classIndex+","+i+","+(j+1)
			};
		});
		$(e).find("[data-spreset]").attr("data-value",classIndex+","+i+","+0)
		return {
			skillname: skillObj[i].name,
			maxlv: skillObj[i].max,
			skillline: skillLine
		};
	});
	
	skillTree.Replacer({
		skilltree: skillTreeList
	});
}

function InitNowSkillLv(cIndex){
	var classIndex = (isFinite(cIndex)) ? (cIndex-0) : -1;
	
	if(classIndex<0){
		for(var i=0,iLen=jobSelectionList.length;i<iLen;++i){
			InitNowSkillLv(i);
		}
		return;
	}
	
	var selectionValue = jobSelectionList[classIndex];
	var skillObj = GetSkillByJobName(selectionValue);
	
	nowSkillLvList[cIndex] = [];
	for(var i=skillObj.length;i--;){
		nowSkillLvList[cIndex][i] = 0;
	}
}

function RefreshNowSkillLv(cIndex,sIndex){
	var classIndex = (isFinite(cIndex)) ? (cIndex-0) : -1;
	var sIndex = (isFinite(sIndex)) ? (sIndex-0) : -1;
	var ele2 = $("[data-skilltree]");
	
	if(classIndex<0){
		for(var i=0,iLen=jobSelectionList.length;i<iLen;++i){
			RefreshNowSkillLv(i);
		}
		return;
	}
	
	var selectionValue = jobSelectionList[classIndex];
	var skillObj = GetSkillByJobName(selectionValue);
	
	var skillTree = ele2.eq(classIndex);
	if(!skillTree.length) return;
	var skillTreeItem = skillTree.find("[data-skilltreeitem]");
	if(!skillTreeItem.length) return;
	
	var SkillReplacer = function(skillObj,cIndex,sIndex){
		var nowLv = nowSkillLvList[cIndex][sIndex];
		if(!isFinite(nowLv)) return;
		skillTreeItem.eq(sIndex).Replacer({
			nowlv: nowLv,
			totalsp: skillObj[sIndex].lv["累計SP"][nowLv-1] || 0,
			nextsp:  skillObj[sIndex].lv["消費SP"][nowLv] || "",
			nextspstr: (skillObj[sIndex].lv["消費SP"][nowLv]) ? "SP" : "MAX"
		}).find("[data-skillline]").find("[data-skilllineitem]").each(function(i,e){
			$(e).prop("checked",i<nowLv);
		});
	}.bind(this,skillObj,classIndex);
	
	if(sIndex !== -1){
		SkillReplacer(sIndex);
	}
	else{
		for(var i=skillTreeItem.length;i--;){
			SkillReplacer(i);
		}
	}
}

function GetSkillByJobName(jobName){
	var jobObj = GetJobByName(jobName);
	if(!jobObj) return null;
	
	var skill = jobObj.skill;
	if(!skill) return null;
	
	var skillObj = [];
	for(var i=skill.length,obj;i--;){
		obj = GetSkillByName(skill[i]);
		if(!obj) continue;
		skillObj.unshift(obj);
	}
	
	return skillObj;
}

function GetJobByName(jobs,name){
	for(var i=jobs.length;i--;){
		for(var j=jobs[i].length;j--;){
			if(jobs[i][j].name !== name) continue;
			
			return jobs[i][j];
		}
	}
	return null;
}

function GetSkillByName(skills,name){
	var index = name.charCodeAt(0);
	var target = skills[index];
	for(var i=target.length;i--;){
		if(target[i].name !== name) continue;
		
		return target[i];
	}
	
	return null;
}


function MakeTemplate(template,args){
	return ReplaceTemplate($(template),args);
}

function MakeTemplateList(template,length,arg){
	var output = [];
	for(var i=length,ele;i--;){
		ele = MakeTemplate(template);
		ele.Replacer((typeof arg === "function") ? arg(i,ele) : arg)
		output.unshift(ele);
	}
	return output;
}

function ReplaceTemplate(ele,args){
	var attrReplacer = function(key,value,i,e){
		var ele = $(e);
		var attr = ele.attr(key);
		if(attr !== void(0) && attr !== false) ele.attr(key,value);
	};
	var htmlReplacer = function(key,value,i,e){
		var ele = $(e);
		var attr = ele.attr("data-"+key);
		if(attr !== void(0) && attr !== false) ele.html(value);
		ele.find("[data-"+key+"]").html(value);
	};
	
	var enumerator;
	var value;
	for(var key in args){
		value = args[key];
		key = key.replace(/[A-Z]/g,function(match){
			return "-"+match.toLowerCase();
		});
		enumerator = (key.charAt(0) === "$") ? attrReplacer.bind(this,key.slice(1)) : htmlReplacer.bind(this,key);
		ele.each(enumerator.bind(this,value));
	}
	return ele;
}

function DataSerialize(){
	var _nowSkillLvList = nowSkillLvList.reduce(function(a,b){return a.concat(b)});
	return IO.DTSim.Encode(jobSelectionList,_nowSkillLvList,powderNum);
}

function DataDeserialize(str){
	if(typeof(str)!=="string") return;
	var res = IO.DTSim.Decode(str);
	jobSelectionList = res[0].concat();
	var _nowSkillLvList = res[1].concat();
	powderNum = res[2];
	
	var k = 0;
	var jobObj;
	nowSkillLvList = [];
	for(var i=0,iLen=jobSelectionList.length;i<iLen;++i){
		jobObj = GetJobByName(jobSelectionList[i]);
		if(!jobObj) continue;
		nowSkillLvList[i] = [];
		for(var j=0,jLen=jobObj.skill.length;j<jLen;++j){
			nowSkillLvList[i][j] = _nowSkillLvList[k];
			k++;
		}
	}
}

function MakeDate(){
	var d = new Date();
	return (d.getFullYear()+"").slice(-2) + "/" + ("00"+(d.getMonth()+1)).slice(-2) + "/" + ("00"+d.getDate()).slice(-2) + " " + ("00"+d.getHours()).slice(-2) + ":" + ("00"+d.getMinutes()).slice(-2);
}

function HistoryPrevClick(eve){
	hManager.Prev();
	
	RefreshHistory();
	var _jobSelectionList = jobSelectionList.concat();
	var _nowSkillLvList = nowSkillLvList.concat();
	for(var i=0,iLen=_jobSelectionList.length;i<iLen;++i){
		$("[data-jobselection]").eq(i).val(_jobSelectionList[i]);
		jobSelectionList[i] = _jobSelectionList[i];
		RefreshJobSelection(i);
	}
	RefreshNowSkillLv();
	RefreshTotalSP();
	RefreshPowderNum();
}

function HistoryNextClick(eve){
	hManager.Next();
	
	RefreshHistory();
	var _jobSelectionList = jobSelectionList.concat();
	var _nowSkillLvList = nowSkillLvList.concat();
	for(var i=0,iLen=_jobSelectionList.length;i<iLen;++i){
		$("[data-jobselection]").eq(i).val(_jobSelectionList[i]);
		jobSelectionList[i] = _jobSelectionList[i];
		RefreshJobSelection(i);
	}
	RefreshNowSkillLv();
	RefreshTotalSP();
	RefreshPowderNum();
}

function SaveDataSaveClick(eve){
	var ele = $("[data-sdselection]:first");
	if(ele.length===0) return;
	var data;
	if(ele.val()){
		data = ele.find("option:selected").text();
	}
	else{
		data = "(無題)";
	}
	var title = prompt("保存するタイトルを入力してください",data);
	if(title===null) return;
	if(!title) title = "(無題)";
	
	var obj = {
		title: title,
		value: DataSerialize()
	};
	
	var index;
	if(saveDataList[1].some(function(e,i){
		if(e.title === title){
			index = i;
			return true;
		}
		return false;
	})){
		if(!confirm(title+" は既に存在しています。上書きしますか？")){
			return;
		}
		saveDataList[1][index] = obj;
	}
	else{
		index = saveDataList[1].length;
		saveDataList[1].push(obj);
	}
	
	StoreSaveData(1);
	RefreshSaveData();
	
	ele.find("[data-usersd] option").eq(index).prop("selected",true);
	RefreshSaveDataSelection();
}

function SaveDataLoadClick(eve){
	var data = $("[data-sdselection]:first").val();
	if(!data) return;
	
	try{
		IO.DTSim.Decode(data);
	}
	catch(err){
		return;
	}
	hManager.Save(data);
	RefreshHistory();
	var _jobSelectionList = jobSelectionList.concat();
	var _nowSkillLvList = nowSkillLvList.concat();
	for(var i=0,iLen=_jobSelectionList.length;i<iLen;++i){
		$("[data-jobselection]").eq(i).val(_jobSelectionList[i]);
		jobSelectionList[i] = _jobSelectionList[i];
		RefreshJobSelection(i);
	}
	RefreshNowSkillLv();
	RefreshTotalSP();
	RefreshPowderNum();
}

function SaveDataDeleteClick(eve){
	var ele = $("[data-sdselection]:first");
	if(ele.length===0) return;
	var data;
	if(!ele.val()) return;
	
	data = ele.find("option:selected").text();
	
	var index;
	if(!saveDataList[1].some(function(e,i){
		if(e.title === data){
			index = i;
			return true;
		}
		return false;
	})) return;
	if(!confirm("【やり直しが効きません】" + data + "を本当に削除しますか？")) return;
	
	saveDataList[1].splice(index,1);
	StoreSaveData(1);
	RefreshSaveData();
	RefreshSaveDataSelection();
}

function SaveDataRenameClick(eve){
	var ele = $("[data-sdselection]:first");
	if(ele.length===0) return;
	var data,newname;
	if(!ele.val()) return;
	
	data = ele.find("option:selected").text();
	
	var index;
	if(!saveDataList[1].some(function(e,i){
		if(e.title === data){
			index = i;
			return true;
		}
		return false;
	})) return;
	
	do{
		newname = prompt("変更後の名前を入力してください",data);
		if(saveDataList[1].some(function(e,i){
			return (e.title!==data) && (e.title === newname);
		})){
			alert(newname+" は既に存在しています。別の名前にしてください");
			continue;
		}
		saveDataList[1][index].title = newname;
		break;
	}while(true);
	
	StoreSaveData(1);
	RefreshSaveData();
	
	ele.find("[data-usersd] option").eq(index).prop("selected",true);
	RefreshSaveDataSelection();
}

function SaveDataImportClick(eve){
	var res = prompt("引き継ぎ元のブラウザ側で出力ボタンを押した時に表示されるテキストを貼り付けてください。\n他ブラウザからユーザー定義のセーブデータリストを引き継ぐことが出来ます。(他PC間でも可)");
	if(!res) return;
	try{
		var tmp = JSON.parse(res);
		if(!(tmp instanceof Array)) throw new Error("配列じゃない");
		for(var i=tmp.length;i--;){
			if(typeof(tmp[i]) !== "object") throw new Error("中身がオブジェクトじゃない");
			if(!("title" in tmp[i])) throw new Error("タイトル情報が含まれていない");
			if(!("value" in tmp[i])) throw new Error("シリアル情報が含まれていない");
			IO.DTSim.Decode(tmp[i].value); //デコード出来なかったら例外が飛ぶ
			
			var isHit = false;
			for(var j=saveDataList[1].length;j--;){
				if(saveDataList[1][j].title !== tmp[i].title) continue;
				isHit = true;
				var res = confirm(tmp[i].title + " が既に存在しています。上書きしますか？");
				if(res) saveDataList[1][j] = tmp[i];
			}
			if(isHit) continue;
			saveDataList[1].push(tmp[i]);
		}
	}
	catch(err){
		alert("入力された情報を認識することが出来ませんでした。\n詳細："+err);
		return;
	}
	
	StoreSaveData(1);
	RefreshSaveData();
	RefreshSaveDataSelection();
}

function SaveDataExportClick(eve){
	prompt(
		"ここに表示されるテキストを引き継ぎ先のブラウザ側で入力ボタンを押した時に表示される入力欄に貼り付けてください。\n他ブラウザへユーザー定義のセーブデータリストを引き継ぐことが出来ます。(他PC間でも可)",
		JSON.stringify(saveDataList[1])
	);
}

function SaveDataSelectionChange(eve){
	RefreshSaveDataSelection();
}

function JobSelectionChange(jobs,eve){
	var ele = $("[data-jobselection]");
	var cIndex = ele.index(eve.target);
	jobSelectionList[cIndex] = $(eve.target).val();
	RefreshJobSelection(cIndex);
	for(var i=cIndex,iLen=ele.length;i<iLen;++i){
		InitNowSkillLv(i);
		RefreshNowSkillLv(i);
	}
	
	hManager.Save(DataSerialize());
	RefreshHistory();
	RefreshTotalSP();
}

function PowderNumberSelectionChange(eve){
	powderNum = $(eve.target).val();
	
	hManager.Save(DataSerialize());
	RefreshHistory();
	RefreshTotalSP();
}

function SkillPointClick(eve){
	var arg = $(eve.target).attr("data-value").split(",").map(function(e,i){ return e-0; });
	nowSkillLvList[arg[0]][arg[1]] = arg[2];
	RefreshNowSkillLv(arg[0],arg[1]);
	
	hManager.Save(DataSerialize());
	RefreshHistory();
	RefreshTotalSP();
}

function TweetButtonClick(eve){
	var ele = $("input[data-tweeturi]:first");
	if(!ele.length) return;
	open(
		"http://twitter.com/intent/tweet?url="+encodeURI(decodeURI(ele.val())),
		"tweetwindow",
		'width=550, height=450, personalbar=0, toolbar=0, scrollbars=1, resizable=1');
	
	return false;
}

function WindowBeforeunload(eve){
	var autosd = saveDataList[0];
	var newValue = DataSerialize();
	
	if((autosd.length>0) && autosd[autosd.length-1].value === newValue) return;
	
	autosd.unshift({
		title: "["+MakeDate()+"]",
		value: newValue
	});
	if(autosd.length>3) autosd.length = 3;
	StoreSaveData(0);
}

(function jqueryReplacer($){
	$.fn.Replacer = function(args){
		return ReplaceTemplate(this,args);
	};
})(jQuery);

})();
