(function(global){
	"use strict";
	
	global.IO = global.IO || {};
	global.IO.DTSim = global.IO.DTSim || {};
	global.IO.DTSim.GetJobSkillLength = GetJobSkillLength; //GetJobSkillLength(jobBit:String):Number
	
	var jobSkillLength = {"10000":23,"10001":21,"10010":19,"10011":22,"10100":23,"10101":20,"00000":28,"00001":26,"00010":26,"00011":26,"00100":32,"00101":27,"00110":36,"00111":41,"01000":35,"01001":28,"01010":22,"01011":28,"01100":28,"01101":27,"01110":22,"01111":24};
	
	function GetJobSkillLength(jobBit){
		var output = jobSkillLength[jobBit];
		if(!isFinite(output)) throw new Error("IO.DTSim.GetJobSkillLength: jobBitのデコードに失敗しました("+jobBit+")");
		return output;
	}
})((this || 0).self || global);