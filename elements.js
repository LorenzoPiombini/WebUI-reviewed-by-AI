
/* HTML element base object*/

var element = {
	type : null,
	prop : {style: null},
	children: [
		{
			type : null,
			prop : {style: null},
			children:[]
		}
	]
}

/* elements */
export var navbar = JSON.parse(JSON.stringify(element));
export var para = JSON.parse(JSON.stringify(element));
export var div = JSON.parse(JSON.stringify(element));
export var h1 = JSON.parse(JSON.stringify(element));
export var data_list = JSON.parse(JSON.stringify(element));


para.type = "p";
div.type = "div";
h1.type = "h1";
data_list.type = "datalist";

