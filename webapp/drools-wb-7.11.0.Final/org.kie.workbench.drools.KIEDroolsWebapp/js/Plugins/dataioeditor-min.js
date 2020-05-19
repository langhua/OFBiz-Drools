if(!ORYX.Plugins){ORYX.Plugins=new Object()
}ORYX.Plugins.DataIOEditorPlugin={currentElement:undefined,construct:function(a){this.facade=a;
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_DATAIOEDITOR_SHOW,this.showDataIOEditor.bind(this))
},showDataIOEditor:function(a){this.currentElement=a.element;
this.getDataTypesForDataIOEditor(this.currentElement)
},getDataTypesForDataIOEditor:function(b){var a=ORYX.EDITOR.getSerializedJSON();
var c=jsonPath(a.evalJSON(),"$.properties.package");
var d=jsonPath(a.evalJSON(),"$.properties.id");
Ext.Ajax.request({url:ORYX.PATH+"calledelement",method:"POST",success:function(g){try{if(g.responseText.length>=0&&g.responseText!="false"){var f=Ext.decode(g.responseText);
this.doShowDataIOEditor(b,f)
}else{this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_NOTIFICATION_SHOW,ntype:"error",msg:"Unable to find Data Types.",title:""})
}}catch(h){this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_NOTIFICATION_SHOW,ntype:"error",msg:"Error retrieving Data Types info  :\n"+h,title:""})
}}.bind(this),failure:function(){this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_NOTIFICATION_SHOW,ntype:"error",msg:"Error retrieving Data Types info.",title:""})
},params:{profile:ORYX.PROFILE,uuid:ORYX.UUID,ppackage:c,pid:d,action:"showdatatypes"}})
},doShowDataIOEditor:function(a,d){var e="";
var v=new Array();
for(var A in d){var s=d[A];
v.push(s)
}v.sort();
for(var g=0;
g<v.length;
g++){var b=v[g];
var h=b.split(".");
var u=h[h.length-1];
var f=b.substring(0,b.length-(u.length+1));
var n=u+" ["+f+"]:"+b;
e=e+n;
if(g<v.length-1){e=e+","
}}var c="";
var z="String:String, Integer:Integer, Boolean:Boolean, Float:Float, Object:Object, ******:******,"+c+e;
var r=a.getStencil();
var m=this.getCustomAssignmentProperties(r.properties());
var w=undefined;
if(r.property("oryx-name")!==undefined){w=a.properties["oryx-name"]
}var y=undefined;
if(r.property("oryx-datainput")!==undefined){y=a.properties["oryx-datainput"]
}var o=undefined;
if(r.property("oryx-datainputset")!==undefined){o=a.properties["oryx-datainputset"]
}var p=undefined;
if(r.property("oryx-dataoutput")!==undefined){p=a.properties["oryx-dataoutput"]
}var x=undefined;
if(r.property("oryx-dataoutputset")!==undefined){x=a.properties["oryx-dataoutputset"]
}var l=undefined;
if(r.property("oryx-assignments")!==undefined){l=a.properties["oryx-assignments"]
}else{if(r.property("oryx-datainputassociations")!==undefined){l=a.properties["oryx-datainputassociations"]
}else{if(r.property("oryx-dataoutputassociations")!==undefined){l=a.properties["oryx-dataoutputassociations"]
}}}var k=ORYX.DataIOEditorUtils.getProcessVars(a);
var q=ORYX.DataIOEditorUtils.getDisallowedPropertyNames(a);
parent.designersignalshowdataioeditor(w,y,o,p,x,k,l,z,q,m,function(E){var F=JSON.parse(E);
var B=this.currentElement;
var C=B.getStencil();
var t=new Hash();
var D=new Hash();
if(C.property("oryx-datainput")!==undefined){t["oryx-datainput"]=F.inputVariables;
D["oryx-datainput"]=B.properties["oryx-datainput"]
}if(C.property("oryx-datainputset")!==undefined){t["oryx-datainputset"]=F.inputVariables;
D["oryx-datainputset"]=B.properties["oryx-datainputset"]
}if(C.property("oryx-dataoutput")!==undefined){t["oryx-dataoutput"]=F.outputVariables;
D["oryx-dataoutput"]=B.properties["oryx-dataoutput"]
}if(C.property("oryx-dataoutputset")!==undefined){t["oryx-dataoutputset"]=F.outputVariables;
D["oryx-dataoutputset"]=B.properties["oryx-dataoutputset"]
}if(C.property("oryx-assignments")!==undefined){t["oryx-assignments"]=F.assignments;
D["oryx-assignments"]=B.properties["oryx-assignments"]
}else{if(C.property("oryx-datainputassociations")!==undefined){t["oryx-datainputassociations"]=F.assignments;
D["oryx-datainputassociations"]=B.properties["oryx-datainputassociations"]
}else{if(C.property("oryx-dataoutputassociations")!==undefined){t["oryx-dataoutputassociations"]=F.assignments;
D["oryx-dataoutputassociations"]=B.properties["oryx-dataoutputassociations"]
}}}if(C.property("oryx-assignments")!==undefined){t["oryx-assignmentsview"]=F.variablecountsstring;
D["oryx-assignmentsview"]=B.properties["oryx-assignmentsview"]
}else{if(C.property("oryx-datainputassociations")!==undefined){t["oryx-datainputassociationsview"]=F.variablecountsstring;
D["oryx-datainputassociationsview"]=B.properties["oryx-datainputassociationsview"]
}else{if(C.property("oryx-dataoutputassociations")!==undefined){t["oryx-dataoutputassociationsview"]=F.variablecountsstring;
D["oryx-dataoutputassociationsview"]=B.properties["oryx-dataoutputassociationsview"]
}}}this.addCustomAssignmentProperties(B,t,D);
ORYX.DataIOEditorUtils.setElementProperties(this.facade,B,t,D)
}.bind(this))
},getCustomAssignmentProperties:function(b){var d="";
for(i=0;
i<b.length;
i++){var c=b[i];
if(c.customassignment()){d=d+c.title()+":";
var a=c.items();
if(a.length>0){for(j=0;
j<a.length;
j++){d=d+a[j].value()+";"
}}d=d+","
}}return d
},addCustomAssignmentProperties:function(d,c,b){var f=new Object();
if(c["oryx-assignments"]!==undefined){f=this.parseCustomAssignments(c["oryx-assignments"])
}var l=d.getStencil();
var g=l.properties();
for(i=0;
i<g.length;
i++){var k=g[i];
var e="oryx-"+k.id();
if(k.customassignment()){var h=d.properties[e];
var a="";
if(f[k.id()]!==undefined){a=f[k.id()]
}b[e]=h;
c[e]=a
}}},parseCustomAssignments:function(e){var g=new Object();
if(e!==undefined){var d=e.split(",");
if(d.length>0){for(i=0;
i<d.length;
i++){var c=d[i];
if(c.startsWith("[din]")){c=c.substring(5,c.length);
if(c.indexOf("=")>=0){var b=c.split("=");
var f;
var h;
if(b.length>1){f=b[1]
}if(b.length>0){h=b[0].toLowerCase();
g[h]=f
}}else{if(c.indexOf("->")>=0){var b=c.split("->");
var f;
var h;
if(b.length>1){f=b[0];
h=b[1].toLowerCase();
g[h]=f
}}}}}}}return g
}};
ORYX.Plugins.DataIOEditorPlugin=ORYX.Plugins.AbstractPlugin.extend(ORYX.Plugins.DataIOEditorPlugin);
ORYX.DataIOEditorUtils={hasDataIOProperty:function(d){var f=d.getStencil();
var c=["oryx-assignmentsview","oryx-datainputassociationsview","oryx-dataoutputassociationsview","oryx-datainput","oryx-datainputset","oryx-dataoutput","oryx-dataoutputset"];
for(var b=0;
b<c.length;
b++){if(f.property(c[b])!==undefined){var g=f.property(c[b]);
if((g.visible()&&g.visible()==true)&&g.hidden()!=true){var e=d.properties["oryx-tasktype"];
if(g.fortasktypes()&&g.fortasktypes().length>0){var a=g.fortasktypes().split("|");
for(var b=0;
b<a.size();
b++){if(a[b]==e){return true
}}}else{return true
}}}}return false
},getDisallowedPropertyNames:function(a){if(a.properties["oryx-tasktype"]!==undefined&&a.properties["oryx-tasktype"]=="User"){return"GroupId,Skippable,Comment,Description,Priority,Content,TaskName,Locale,CreatedBy,NotCompletedReassign,NotStartedReassign,NotCompletedNotify,NotStartedNotify"
}else{return""
}},getProcessVars:function(c){var f="** "+ORYX.I18N.DataIOEditorPlugin.VariableDefinitions+" **,";
var g="** "+ORYX.I18N.DataIOEditorPlugin.CaseFileDefinitions+" **,";
var b="";
if(c&&c.parent){var d=this.getParentVars(c.parent);
if(d&&d.length>0){f=f+d
}}var e="";
var h="";
var k=ORYX.EDITOR.getSerializedJSON();
var a=jsonPath(k.evalJSON(),"$.properties.vardefs");
if(a){a.forEach(function(m){if(m.length>0){var n=m.split(",");
for(var l=0;
l<n.length;
l++){if(n[l].startsWith("caseFile_")){h+=n[l]+","
}else{e+=n[l]+","
}}}})
}if(h&&h.length>0){b=b+g+h
}if(e&&e.length>0){b=b+f+e
}else{if(f&&f.length>0){b=b+f
}}return b
},getParentVars:function(c){var d="";
if(c){if(c._stencil._jsonStencil.id=="http://b3mn.org/stencilset/bpmn2.0#MultipleInstanceSubprocess"||c._stencil._jsonStencil.id=="http://b3mn.org/stencilset/bpmn2.0#Subprocess"||c._stencil._jsonStencil.id=="http://b3mn.org/stencilset/bpmn2.0#EventSubprocess"||c._stencil._jsonStencil.id=="http://b3mn.org/stencilset/bpmn2.0#AdHocSubprocess"){var f=c.properties["oryx-vardefs"];
if(f&&f.length>0){d=d+this.sortVarsString(f)
}if(c._stencil._jsonStencil.id=="http://b3mn.org/stencilset/bpmn2.0#MultipleInstanceSubprocess"){var b=c.properties["oryx-multipleinstancedatainput"];
if(b&&b.length>0){d=d+this.sortVarsString(b)
}var a=c.properties["oryx-multipleinstancedataoutput"];
if(a&&a.length>0){d=d+this.sortVarsString(a)
}}}if(c.parent){var e=this.getParentVars(c.parent);
if(e&&e.length>0){d=d+e
}}}return d
},sortVarsString:function(d){if(!d||d.length<1){return""
}var b=d.split(",");
b.sort();
var c="";
for(var a=0;
a<b.length;
a++){c=c+b[a]+","
}return c+","
},setAssignmentsViewProperty:function(f){var k=f.getStencil();
var c=undefined;
if(k.property("oryx-datainput")!==undefined){c=f.properties["oryx-datainput"]
}var d=undefined;
if(k.property("oryx-datainputset")!==undefined){d=f.properties["oryx-datainputset"]
}var l=undefined;
if(k.property("oryx-dataoutput")!==undefined){l=f.properties["oryx-dataoutput"]
}var e=undefined;
if(k.property("oryx-dataoutputset")!==undefined){e=f.properties["oryx-dataoutputset"]
}var a=undefined;
if(k.property("oryx-assignments")!==undefined){a=f.properties["oryx-assignments"]
}else{if(k.property("oryx-datainputassociations")!==undefined){a=f.properties["oryx-datainputassociations"]
}else{if(k.property("oryx-dataoutputassociations")!==undefined){a=f.properties["oryx-dataoutputassociations"]
}}}var h=this.getProcessVars(f);
var g=this.getDisallowedPropertyNames(f);
var b=parent.designersignalgetassignmentsviewproperty(c,d,l,e,h,a,g);
if(b&&b.length>0){if(k.property("oryx-assignmentsview")!==undefined){f.setProperty("oryx-assignmentsview",b)
}else{if(k.property("oryx-datainputassociationsview")!==undefined){f.setProperty("oryx-datainputassociationsview",b)
}else{if(k.property("oryx-dataoutputassociationsview")!==undefined){f.setProperty("oryx-dataoutputassociationsview",b)
}}}}},setElementProperties:function(d,c,a,e){this.facade=d;
var b=ORYX.Core.Command.extend({construct:function(){this.newProperties=a;
this.oldProperties=e;
this.selectedElements=[c];
this.facade=d
},execute:function(){this.newProperties.each(function(g){if(!c.getStencil().property(g.key).readonly()){c.setProperty(g.key,g.value)
}}.bind(this));
this.facade.setSelection(this.selectedElements);
this.facade.getCanvas().update();
this.facade.updateSelection()
},rollback:function(){this.oldProperties.each(function(g){if(!c.getStencil().property(g.key).readonly()){c.setProperty(g.key,g.value)
}}.bind(this));
this.facade.setSelection(this.selectedElements);
this.facade.getCanvas().update();
this.facade.updateSelection()
}});
var f=new b();
this.facade.executeCommands([f]);
a.each(function(g){this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_PROPWINDOW_PROP_CHANGED,elements:[c],key:g.key,value:g.value})
}.bind(this))
},setAssignmentsPropertyForCustomAssignment:function(o,g,n,a,b){var h=g.getStencil().property(n).title();
var m=g.properties["oryx-assignments"];
var f="[din]"+h+"="+a;
var e=h+"="+a;
var k="[din]"+a+"->"+h;
var l="[din]"+h+"="+b;
var p;
if(m!==undefined&&m.length>0){if(m.indexOf(f)>=0){p=m.replace(f,l)
}else{if(m.indexOf(e+",")>=0||m.endsWith(e)){p=m.replace(e,l)
}else{if(m.indexOf(k)>=0){p=m.replace(k,l)
}else{p=m+","+l
}}}}else{p=l
}var d=new Hash();
var c=new Hash();
d["oryx-assignments"]=p;
c["oryx-assignments"]=p;
this.setElementProperties(o,g,d,c)
}};