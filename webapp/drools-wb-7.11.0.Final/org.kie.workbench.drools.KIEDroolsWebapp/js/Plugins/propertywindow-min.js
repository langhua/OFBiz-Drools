if(!ORYX.Plugins){ORYX.Plugins=new Object()
}if(!ORYX.FieldEditors){ORYX.FieldEditors={}
}if(!ORYX.AssociationEditors){ORYX.AssociationEditors={}
}if(!ORYX.LabelProviders){ORYX.LabelProviders={}
}Ext.override(Ext.form.ComboBox,{anyMatch:false,caseSensitive:false,doQuery:function(c,b){if(c===undefined||c===null){c=""
}var a={query:c,forceAll:b,combo:this,cancel:false};
if(this.fireEvent("beforequery",a)===false||a.cancel){return false
}c=a.query;
b=a.forceAll;
if(b===true||(c.length>=this.minChars)){if(this.lastQuery!==c){this.lastQuery=c;
if(this.mode=="local"){this.selectedIndex=-1;
if(b){this.store.clearFilter()
}else{this.store.filter(this.displayField,c,this.anyMatch,this.caseSensitive)
}this.onLoad()
}else{this.store.baseParams[this.queryParam]=c;
this.store.load({params:this.getParams(c)});
this.expand()
}}else{this.selectedIndex=-1;
this.onLoad()
}}}});
ORYX.Plugins.PropertyWindow={facade:undefined,construct:function(a){this.facade=a;
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_SHOW_PROPERTYWINDOW,this.init.bind(this));
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_LOADED,this.onSelectionChanged.bind(this));
this.init()
},init:function(){this.node=ORYX.Editor.graft("http://www.w3.org/1999/xhtml",null,["div"]);
this.currentDateFormat;
this.popularProperties=[];
this.simulationProperties=[];
this.displayProperties=[];
this.customAssignmentsProperties=[];
this.properties=[];
this.shapeSelection=new Hash();
this.shapeSelection.shapes=new Array();
this.shapeSelection.commonProperties=new Array();
this.shapeSelection.commonPropertiesValues=new Hash();
this.updaterFlag=false;
this.columnModel=new Ext.grid.ColumnModel([{header:ORYX.I18N.PropertyWindow.name,dataIndex:"name",width:90,sortable:true,renderer:this.tooltipRenderer.bind(this),css:"font-weight: bold;"},{header:ORYX.I18N.PropertyWindow.value,dataIndex:"value",id:"propertywindow_column_value",width:110,editor:new Ext.form.TextField({allowBlank:true}),renderer:this.renderer.bind(this)},{header:ORYX.I18N.PropertyWindow.desk,dataIndex:"groupname",hidden:true,sortable:true}]);
this.dataSource=new Ext.data.GroupingStore({proxy:new Ext.data.MemoryProxy(this.properties),reader:new Ext.data.ArrayReader({},[{name:"groupname"},{name:"name"},{name:"value"},{name:"icons"},{name:"gridProperties"}]),sortInfo:{field:"name",direction:"ASC"},groupField:"groupname"});
this.dataSource.load();
this.grid=new Ext.grid.EditorGridPanel({autoScroll:true,autoHeight:true,clicksToEdit:1,stripeRows:true,autoExpandColumn:"propertywindow_column_value",width:"auto",colModel:this.columnModel,enableHdMenu:false,view:new Ext.grid.GroupingView({forceFit:false,groupTextTpl:"{[values.rs.first().data.groupname]}"}),store:this.dataSource});
region=this.facade.addToRegion("east",new Ext.Panel({width:400,layout:"anchor",autoScroll:true,autoHeight:true,border:false,items:[this.grid],anchors:"0, -30"}),ORYX.I18N.PropertyWindow.title);
this.grid.on("beforeedit",this.beforeEdit,this,true);
this.grid.on("afteredit",this.afterEdit,this,true);
this.grid.view.on("refresh",this.hideMoreAttrs,this,true);
this.grid.enableColumnMove=false;
Ext.data.Store.prototype.sortData=function(c,d){d=d||"ASC";
var a=this.fields.get(c).sortType;
var b=function(f,e){var h=a(f.data[c]),g=a(e.data[c]);
if(h.toLowerCase){h=h.toLowerCase();
g=g.toLowerCase()
}return h>g?1:(h<g?-1:0)
};
this.data.sort(d,b);
if(this.snapshot&&this.snapshot!=this.data){this.snapshot.sort(d,b)
}}
},selectDiagram:function(){this.shapeSelection.shapes=[this.facade.getCanvas()];
this.setPropertyWindowTitle();
this.identifyCommonProperties();
this.createProperties()
},specialKeyDown:function(b,a){if(b instanceof Ext.form.TextArea&&a.button==ORYX.CONFIG.KEY_Code_enter){return false
}},tooltipRenderer:function(b,c,a){c.cellAttr='title="'+a.data.gridProperties.tooltip+'"';
return b
},renderer:function(b,c,a){this.tooltipRenderer(b,c,a);
if(a.data.gridProperties.labelProvider){return a.data.gridProperties.labelProvider(b)
}if(b instanceof Date){b=b.dateFormat(ORYX.I18N.PropertyWindow.dateFormat)
}else{if(String(b).search("<a href='")<0){b=String(b).gsub("<","&lt;");
b=String(b).gsub(">","&gt;");
b=String(b).gsub("%","&#37;");
b=String(b).gsub("&","&amp;");
if(a.data.gridProperties.type==ORYX.CONFIG.TYPE_COLOR){b="<div class='prop-background-color' style='background-color:"+b+"' />"
}a.data.icons.each(function(d){if(d.name==b){if(d.icon){b="<img src='"+d.icon+"' /> "+b
}}})
}}return b
},beforeEdit:function(c){var d=this.dataSource.getAt(c.row).data.gridProperties.editor;
var a=this.dataSource.getAt(c.row).data.gridProperties.renderer;
if(d){this.facade.disableEvent(ORYX.CONFIG.EVENT_KEYDOWN);
c.grid.getColumnModel().setEditor(1,d);
d.field.row=c.row;
d.render(this.grid);
d.setSize(c.grid.getColumnModel().getColumnWidth(1),d.height)
}else{return false
}var b=this.dataSource.getAt(c.row).data.gridProperties.propId;
this.oldValues=new Hash();
this.shapeSelection.shapes.each(function(e){this.oldValues[e.getId()]=e.properties[b]
}.bind(this))
},afterEdit:function(f){f.grid.getStore().commitChanges();
var g=f.record.data.gridProperties.propId;
var d=this.shapeSelection.shapes;
var h=this.oldValues;
var b=f.value;
var j=this.facade;
var e=ORYX.Core.Command.extend({construct:function(){this.key=g;
this.selectedElements=d;
this.oldValues=h;
this.newValue=b;
this.facade=j
},execute:function(){this.selectedElements.each(function(k){if(!k.getStencil().property(this.key).readonly()){k.setProperty(this.key,this.newValue)
}}.bind(this));
this.facade.setSelection(this.selectedElements);
this.facade.getCanvas().update();
this.facade.updateSelection()
},rollback:function(){this.selectedElements.each(function(k){k.setProperty(this.key,this.oldValues[k.getId()])
}.bind(this));
this.facade.setSelection(this.selectedElements);
this.facade.getCanvas().update();
this.facade.updateSelection()
}});
var c=new e();
this.facade.executeCommands([c]);
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_PROPWINDOW_PROP_CHANGED,elements:d,key:g,value:f.value});
if(d.length==1&&d[0].getStencil().property(g).customassignment()){var a=h[d[0].getId()];
ORYX.DataIOEditorUtils.setAssignmentsPropertyForCustomAssignment(this.facade,d[0],g,a,b)
}},editDirectly:function(a,b){this.shapeSelection.shapes.each(function(d){if(!d.getStencil().property(a).readonly()){d.setProperty(a,b)
}}.bind(this));
var c=this.shapeSelection.shapes;
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_PROPWINDOW_PROP_CHANGED,elements:c,key:a,value:b});
this.facade.getCanvas().update()
},updateAfterInvalid:function(a){this.shapeSelection.shapes.each(function(b){if(!b.getStencil().property(a).readonly()){b.setProperty(a,this.oldValues[b.getId()]);
b.update()
}}.bind(this));
this.facade.getCanvas().update()
},dialogClosed:function(a){var b=this.field?this.field.row:this.row;
this.scope.afterEdit({grid:this.scope.grid,record:this.scope.grid.getStore().getAt(b),value:a});
this.scope.grid.startEditing(b,this.col)
},setPropertyWindowTitle:function(){if(this.shapeSelection.shapes.length==1){var a=this.shapeSelection.shapes.first().getStencil().title();
if(this.shapeSelection.shapes.first()&&this.shapeSelection.shapes.first().properties&&this.shapeSelection.shapes.first().properties["oryx-tasktype"]&&this.shapeSelection.shapes.first().properties["oryx-tasktype"].length>0){a=this.shapeSelection.shapes.first().properties["oryx-tasktype"]
}region.setTitle(ORYX.I18N.PropertyWindow.title+" ("+a+")")
}else{region.setTitle(ORYX.I18N.PropertyWindow.title+" ("+this.shapeSelection.shapes.length+" "+ORYX.I18N.PropertyWindow.selected+")")
}},setCommonPropertiesValues:function(){this.shapeSelection.commonPropertiesValues=new Hash();
this.shapeSelection.commonProperties.each(function(d){var c=d.prefix()+"-"+d.id();
var b=false;
var a=this.shapeSelection.shapes.first();
this.shapeSelection.shapes.each(function(e){if(a.properties[c]!=e.properties[c]){b=true
}}.bind(this));
if(!b){this.shapeSelection.commonPropertiesValues[c]=a.properties[c]
}}.bind(this))
},getStencilSetOfSelection:function(){var a=new Hash();
this.shapeSelection.shapes.each(function(b){a[b.getStencil().id()]=b.getStencil()
});
return a
},identifyCommonProperties:function(){this.shapeSelection.commonProperties.clear();
var d=this.getStencilSetOfSelection();
var c=d.values().first();
var b=d.values().without(c);
if(b.length==0){this.shapeSelection.commonProperties=c.properties()
}else{var a=new Hash();
c.properties().each(function(e){a[e.namespace()+"-"+e.id()+"-"+e.type()]=e
});
b.each(function(e){var f=new Hash();
e.properties().each(function(g){if(a[g.namespace()+"-"+g.id()+"-"+g.type()]){f[g.namespace()+"-"+g.id()+"-"+g.type()]=g
}});
a=f
});
this.shapeSelection.commonProperties=a.values()
}},onSelectionChanged:function(b){this.grid.stopEditing();
this.shapeSelection.shapes=b.elements;
if(b.elements){if(b.elements.length==0){this.shapeSelection.shapes=[this.facade.getCanvas()]
}}else{this.shapeSelection.shapes=[this.facade.getCanvas()]
}if(b.subSelection){this.shapeSelection.shapes=[b.subSelection]
}if(this.shapeSelection.shapes.length==1){if(ORYX.USEOLDDATAASSIGNMENTS==false){var a=this.shapeSelection.shapes[0];
if(ORYX.DataIOEditorUtils.hasDataIOProperty(a)){ORYX.DataIOEditorUtils.setAssignmentsViewProperty(a)
}}}this.setPropertyWindowTitle();
this.identifyCommonProperties();
this.setCommonPropertiesValues();
this.createProperties()
},createProperties:function(){this.properties=[];
this.popularProperties=[];
this.simulationProperties=[];
this.customAssignmentsProperties=[];
this.displayProperties=[];
if(this.shapeSelection.commonProperties){this.shapeSelection.commonProperties.each((function(n,C){var r=n.prefix()+"-"+n.id();
var o=n.title();
var V=[];
var z=this.shapeSelection.commonPropertiesValues[r];
var J=undefined;
var G=null;
var D=false;
var K=ORYX.FieldEditors[n.type()];
if(K!==undefined){J=K.init.bind(this,r,n,V,C)();
if(J==null){return
}J.on("beforehide",this.facade.enableEvent.bind(this,ORYX.CONFIG.EVENT_KEYDOWN));
J.on("specialkey",this.specialKeyDown.bind(this))
}else{if(!n.readonly()){switch(n.type()){case ORYX.CONFIG.TYPE_STRING:if(n.wrapLines()){var d=new Ext.form.TextArea({alignment:"tl-tl",allowBlank:n.optional(),msgTarget:"title",maxLength:n.length()});
d.on("keyup",function(k,j){this.editDirectly(r,k.getValue().replace(/\\n/g,"\n"))
}.bind(this));
J=new Ext.Editor(d)
}else{var A=new Ext.form.TextField({allowBlank:n.optional(),msgTarget:"title",maxLength:n.length()});
A.on("keyup",function(j,k){this.editDirectly(r,j.getValue())
}.bind(this));
A.on("blur",function(j){if(!j.isValid(false)){this.updateAfterInvalid(r)
}}.bind(this));
A.on("specialkey",function(j,k){if(!j.isValid(false)){this.updateAfterInvalid(r)
}}.bind(this));
J=new Ext.Editor(A)
}break;
case ORYX.CONFIG.TYPE_BOOLEAN:var l=new Ext.form.Checkbox();
l.on("check",function(k,j){this.editDirectly(r,j)
}.bind(this));
J=new Ext.Editor(l);
break;
case ORYX.CONFIG.TYPE_INTEGER:var w=new Ext.form.NumberField({allowBlank:n.optional(),allowDecimals:false,msgTarget:"title",minValue:n.min(),maxValue:n.max()});
w.on("keyup",function(j,k){this.editDirectly(r,j.getValue())
}.bind(this));
J=new Ext.Editor(w);
break;
case ORYX.CONFIG.TYPE_FLOAT:var w=new Ext.form.NumberField({allowBlank:n.optional(),allowDecimals:true,msgTarget:"title",minValue:n.min(),maxValue:n.max()});
w.on("keyup",function(j,k){this.editDirectly(r,j.getValue())
}.bind(this));
J=new Ext.Editor(w);
break;
case ORYX.CONFIG.TYPE_COLOR:var T=new Ext.ux.ColorField({allowBlank:n.optional(),msgTarget:"title",facade:this.facade});
J=new Ext.Editor(T);
break;
case ORYX.CONFIG.TYPE_CHOICE:var t=n.items();
var v=[];
if(n.id()=="tasktype"&&ORYX.CALCULATE_CURRENT_PERSPECTIVE()==ORYX.RULEFLOW_PERSPECTIVE){t.each(function(j){if(j.value()==z){z=j.title()
}if(j.refToView()[0]){D=true
}if(j.value()=="Business Rule"||j.value()=="Script"||j.value()=="None"){if(ORYX.I18N.propertyNamesTaskType&&ORYX.I18N.propertyNamesTaskType[j.title()]&&ORYX.I18N.propertyNamesTaskType[j.title()].length>0){v.push([j.icon(),ORYX.I18N.propertyNamesTaskType[j.title()],j.value()])
}else{v.push([j.icon(),j.title(),j.value()])
}if(ORYX.I18N.propertyNamesTaskType&&ORYX.I18N.propertyNamesTaskType[j.title()]&&ORYX.I18N.propertyNamesTaskType[j.title()].length>0){V.push({name:ORYX.I18N.propertyNamesTaskType[j.title()],icon:j.icon()})
}else{V.push({name:j.title(),icon:j.icon()})
}}})
}else{t.each(function(k){if(k.value()==z){z=k.title()
}if(k.refToView()[0]){D=true
}var j="";
if(ORYX.I18N.propertyNamesValue[k.title()]&&ORYX.I18N.propertyNamesValue[k.title()].length>0){j=ORYX.I18N.propertyNamesValue[k.title()]
}else{j=k.title()
}if(!j){j=k.title()
}v.push([k.icon(),j,k.value()]);
V.push({name:j,icon:k.icon()})
})
}var b=new Ext.data.SimpleStore({fields:[{name:"icon"},{name:"title"},{name:"value"}],data:v});
var m=new Ext.form.ComboBox({editable:false,tpl:'<tpl for="."><div class="x-combo-list-item">{[(values.icon) ? "<img src=\'" + values.icon + "\' />" : ""]} {title}</div></tpl>',store:b,displayField:"title",valueField:"value",typeAhead:true,mode:"local",triggerAction:"all",selectOnFocus:true});
if(n.id()=="tasktype"){m.on("select",function(Z,j,k){this.editDirectly(r,Z.getValue());
var X=this.facade.getSelection();
var Y=X.first();
this.facade.setSelection([]);
this.facade.getCanvas().update();
this.facade.updateSelection();
this.facade.setSelection([Y]);
this.facade.getCanvas().update();
this.facade.updateSelection();
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADED,elements:[Y]})
}.bind(this))
}else{m.on("select",function(X,j,k){this.editDirectly(r,X.getValue())
}.bind(this))
}J=new Ext.Editor(m);
break;
case ORYX.CONFIG.TYPE_DYNAMICCHOICE:var t=n.items();
var v=[];
var W=false;
var N="";
t.each(function(ab){if(ab.value()==z){z=ab.title()
}if(ab.refToView()[0]){D=true
}if(ab.needsprop().length>0){W=true;
N=ab.needsprop()
}var Z=ORYX.EDITOR.getSerializedJSON();
var aa=jsonPath(Z.evalJSON(),ab.value());
if(aa){if(aa.toString().length>0){for(var Y=0;
Y<aa.length;
Y++){var ac=aa[Y].split(",");
for(var X=0;
X<ac.length;
X++){if(ac[X].indexOf(":")>0){var k=ac[X].split(":");
v.push([ab.icon(),k[0],k[0]])
}else{if(ac[X].trim().length>0){v.push([ab.icon(),ac[X],ac[X]])
}}}}}}else{this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_NOTIFICATION_SHOW,ntype:"info",msg:ORYX.I18N.PropertyWindow.noDataAvailableForProp,title:""})
}V.push({name:ab.title(),icon:ab.icon()})
});
var b=new Ext.data.SimpleStore({fields:[{name:"icon"},{name:"title"},{name:"value"}],data:v});
var m=new Ext.form.ComboBox({editable:false,tpl:'<tpl for="."><div class="x-combo-list-item">{[(values.icon) ? "<img src=\'" + values.icon + "\' />" : ""]} {title}</div></tpl>',store:b,displayField:"title",valueField:"value",typeAhead:true,mode:"local",triggerAction:"all",selectOnFocus:true});
m.on("select",function(ab,j,X){if(W==true&&N.length>0){var aa=ORYX.EDITOR._pluginFacade.getSelection();
if(aa){var k=aa.first();
var Z="oryx-"+N;
var Y=k.properties[Z];
if(Y!=undefined&&Y.length<1){ORYX.EDITOR._pluginFacade.raiseEvent({type:ORYX.CONFIG.EVENT_NOTIFICATION_SHOW,ntype:"warning",msg:"This property needs the associated property '"+N+"' to be set.",title:""})
}}}this.editDirectly(r,ab.getValue())
}.bind(this));
J=new Ext.Editor(m);
break;
case ORYX.CONFIG.TYPE_DYNAMICDATAINPUT:var v=[];
var p=ORYX.EDITOR._pluginFacade.getSelection();
if(p&&p.length==1){var s=p.first();
var q=s.resourceId;
var U=ORYX.EDITOR.getSerializedJSON();
var L=jsonPath(U.evalJSON(),"$.childShapes.*");
for(var S=0;
S<L.length;
S++){var f=L[S];
if(f.resourceId==q){var M=f.properties.datainputset;
if(M!==undefined){var y=M.split(",");
for(var R=0;
R<y.length;
R++){var h=y[R];
if(h.indexOf(":")>0){var a=h.split(":");
v.push(["",a[0],a[0]])
}else{v.push(["",h,h])
}}}}}}var b=new Ext.data.SimpleStore({fields:[{name:"icon"},{name:"title"},{name:"value"}],data:v});
var m=new Ext.form.ComboBox({editable:false,tpl:'<tpl for="."><div class="x-combo-list-item">{[(values.icon) ? "<img src=\'" + values.icon + "\' />" : ""]} {title}</div></tpl>',store:b,displayField:"title",valueField:"value",typeAhead:true,mode:"local",triggerAction:"all",selectOnFocus:true});
m.on("select",function(X,j,k){this.editDirectly(r,X.getValue())
}.bind(this));
J=new Ext.Editor(m);
break;
case ORYX.CONFIG.TYPE_DYNAMICDATAOUTPUT:var v=[];
var p=ORYX.EDITOR._pluginFacade.getSelection();
if(p&&p.length==1){var s=p.first();
var q=s.resourceId;
var U=ORYX.EDITOR.getSerializedJSON();
var L=jsonPath(U.evalJSON(),"$.childShapes.*");
for(var S=0;
S<L.length;
S++){var f=L[S];
if(f.resourceId==q){var c=f.properties.dataoutputset;
if(c!==undefined){var e=c.split(",");
for(var O=0;
O<e.length;
O++){var h=e[O];
if(h.indexOf(":")>0){var a=h.split(":");
v.push(["",a[0],a[0]])
}else{if(h.length>0){v.push(["",h,h])
}}}}}}}var b=new Ext.data.SimpleStore({fields:[{name:"icon"},{name:"title"},{name:"value"}],data:v});
var m=new Ext.form.ComboBox({editable:false,tpl:'<tpl for="."><div class="x-combo-list-item">{[(values.icon) ? "<img src=\'" + values.icon + "\' />" : ""]} {title}</div></tpl>',store:b,displayField:"title",valueField:"value",typeAhead:true,mode:"local",triggerAction:"all",selectOnFocus:true});
m.on("select",function(X,j,k){this.editDirectly(r,X.getValue())
}.bind(this));
J=new Ext.Editor(m);
break;
case ORYX.CONFIG.TYPE_DYNAMICGATEWAYCONNECTIONS:var Q=ORYX.Config.FACADE.getSelection();
if(Q&&Q.length==1){var v=[];
var s=Q.first();
var q=s.resourceId;
var b=new Ext.data.SimpleStore({fields:[{name:"icon"},{name:"title"},{name:"value"}],data:v});
var m=new Ext.form.ComboBox({editable:false,tpl:'<tpl for="."><div class="x-combo-list-item">{[(values.icon) ? "<img src=\'" + values.icon + "\' />" : ""]} {title}</div></tpl>',store:b,displayField:"title",valueField:"value",typeAhead:true,mode:"local",triggerAction:"all",selectOnFocus:true});
m.on("select",function(X,j,k){this.editDirectly(r,X.getValue())
}.bind(this));
J=new Ext.Editor(m);
this.getGatewayRoutes(q,m)
}break;
case ORYX.CONFIG.TYPE_DATE:var F=ORYX.I18N.PropertyWindow.dateFormat;
if(!(z instanceof Date)){z=Date.parseDate(z,F)
}J=new Ext.Editor(new Ext.form.DateField({allowBlank:n.optional(),format:F,msgTarget:"title"}));
break;
case ORYX.CONFIG.TYPE_TEXT:var B=new Ext.form.ComplexTextField({allowBlank:n.optional(),dataSource:this.dataSource,grid:this.grid,row:C,facade:this.facade});
B.on("dialogClosed",this.dialogClosed,{scope:this,row:C,col:1,field:B});
J=new Ext.Editor(B);
break;
case ORYX.CONFIG.TYPE_ENCODED_TEXT:var B=new Ext.form.ComplexEncodedTextField({allowBlank:n.optional(),dataSource:this.dataSource,grid:this.grid,row:C,facade:this.facade});
B.on("dialogClosed",this.dialogClosed,{scope:this,row:C,col:1,field:B});
J=new Ext.Editor(B);
break;
case ORYX.CONFIG.TYPE_VARDEF:var B=new Ext.form.ComplexVardefField({allowBlank:n.optional(),dataSource:this.dataSource,grid:this.grid,row:C,facade:this.facade});
B.on("dialogClosed",this.dialogClosed,{scope:this,row:C,col:1,field:B});
J=new Ext.Editor(B);
break;
case ORYX.CONFIG.TYPE_EXPRESSION:var B=new Ext.form.ConditionExpressionEditorField({allowBlank:n.optional(),dataSource:this.dataSource,grid:this.grid,row:C,facade:this.facade});
B.on("dialogClosed",this.dialogClosed,{scope:this,row:C,col:1,field:B});
J=new Ext.Editor(B);
break;
case ORYX.CONFIG.TYPE_TEXT_EXPRESSION:var B=new Ext.form.ConditionExpressionEditorTextField({allowBlank:n.optional(),dataSource:this.dataSource,grid:this.grid,row:C,facade:this.facade});
B.on("dialogClosed",this.dialogClosed,{scope:this,row:C,col:1,field:B});
J=new Ext.Editor(B);
break;
case ORYX.CONFIG.TYPE_DOCS_EXPRESSION:var B=new Ext.form.ConditionExpressionEditorDocumentationField({allowBlank:n.optional(),dataSource:this.dataSource,grid:this.grid,row:C,facade:this.facade});
B.on("dialogClosed",this.dialogClosed,{scope:this,row:C,col:1,field:B});
J=new Ext.Editor(B);
break;
case ORYX.CONFIG.TYPE_CALLEDELEMENT:var B=new Ext.form.ComplexCalledElementField({allowBlank:n.optional(),dataSource:this.dataSource,grid:this.grid,row:C,facade:this.facade});
B.on("dialogClosed",this.dialogClosed,{scope:this,row:C,col:1,field:B});
J=new Ext.Editor(B);
break;
case ORYX.CONFIG.TYPE_RULEFLOW_GROUP:var B=new Ext.form.ComplexRuleflowGroupElementField({allowBlank:n.optional(),dataSource:this.dataSource,grid:this.grid,row:C,facade:this.facade});
B.on("dialogClosed",this.dialogClosed,{scope:this,row:C,col:1,field:B});
J=new Ext.Editor(B);
break;
case ORYX.CONFIG.TYPE_CUSTOM:var B=new Ext.form.ComplexCustomField({allowBlank:n.optional(),dataSource:this.dataSource,grid:this.grid,row:C,facade:this.facade,title:(ORYX.I18N.propertyNames[n.id()]&&ORYX.I18N.propertyNames[n.id()].length>0)?ORYX.I18N.propertyNames[n.id()]:n.title(),attr:z});
B.on("dialogClosed",this.dialogClosed,{scope:this,row:C,col:1,field:B});
J=new Ext.Editor(B);
break;
case ORYX.CONFIG.TYPE_ACTION:var B=new Ext.form.ComplexActionsField({allowBlank:n.optional(),dataSource:this.dataSource,grid:this.grid,row:C,facade:this.facade});
B.on("dialogClosed",this.dialogClosed,{scope:this,row:C,col:1,field:B});
J=new Ext.Editor(B);
break;
case ORYX.CONFIG.TYPE_GLOBAL:var B=new Ext.form.ComplexGlobalsField({allowBlank:n.optional(),dataSource:this.dataSource,grid:this.grid,row:C,facade:this.facade});
B.on("dialogClosed",this.dialogClosed,{scope:this,row:C,col:1,field:B});
J=new Ext.Editor(B);
break;
case ORYX.CONFIG.TYPE_IMPORT:var B=new Ext.form.ComplexImportsField({allowBlank:n.optional(),dataSource:this.dataSource,grid:this.grid,row:C,facade:this.facade});
B.on("dialogClosed",this.dialogClosed,{scope:this,row:C,col:1,field:B});
J=new Ext.Editor(B);
break;
case ORYX.CONFIG.TYPE_CASE_ROLES:var B=new Ext.form.ComplexCaseRolesField({allowBlank:n.optional(),dataSource:this.dataSource,grid:this.grid,row:C,facade:this.facade});
B.on("dialogClosed",this.dialogClosed,{scope:this,row:C,col:1,field:B});
J=new Ext.Editor(B);
break;
case ORYX.CONFIG.TYPE_REASSIGNMENT:var B=new Ext.form.ComplexReassignmentField({allowBlank:n.optional(),dataSource:this.dataSource,grid:this.grid,row:C,facade:this.facade});
B.on("dialogClosed",this.dialogClosed,{scope:this,row:C,col:1,field:B});
J=new Ext.Editor(B);
break;
case ORYX.CONFIG.TYPE_NOTIFICATIONS:var B=new Ext.form.ComplexNotificationsField({allowBlank:n.optional(),dataSource:this.dataSource,grid:this.grid,row:C,facade:this.facade});
B.on("dialogClosed",this.dialogClosed,{scope:this,row:C,col:1,field:B});
J=new Ext.Editor(B);
break;
case ORYX.CONFIG.TYPE_DATAINPUT:var B=new Ext.form.ComplexDataInputField({allowBlank:n.optional(),dataSource:this.dataSource,grid:this.grid,row:C,facade:this.facade});
B.on("dialogClosed",this.dialogClosed,{scope:this,row:C,col:1,field:B});
J=new Ext.Editor(B);
break;
case ORYX.CONFIG.TYPE_DATAINPUT_SINGLE:var B=new Ext.form.ComplexDataInputFieldSingle({allowBlank:n.optional(),dataSource:this.dataSource,grid:this.grid,row:C,facade:this.facade});
B.on("dialogClosed",this.dialogClosed,{scope:this,row:C,col:1,field:B});
J=new Ext.Editor(B);
break;
case ORYX.CONFIG.TYPE_DATAOUTPUT:var B=new Ext.form.ComplexDataOutputField({allowBlank:n.optional(),dataSource:this.dataSource,grid:this.grid,row:C,facade:this.facade});
B.on("dialogClosed",this.dialogClosed,{scope:this,row:C,col:1,field:B});
J=new Ext.Editor(B);
break;
case ORYX.CONFIG.TYPE_DATAOUTPUT_SINGLE:var B=new Ext.form.ComplexDataOutputFieldSingle({allowBlank:n.optional(),dataSource:this.dataSource,grid:this.grid,row:C,facade:this.facade});
B.on("dialogClosed",this.dialogClosed,{scope:this,row:C,col:1,field:B});
J=new Ext.Editor(B);
break;
case ORYX.CONFIG.TYPE_DATAASSIGNMENT:var B=new Ext.form.ComplexDataAssignmenField({allowBlank:n.optional(),dataSource:this.dataSource,grid:this.grid,row:C,facade:this.facade,shapes:this.shapeSelection.shapes});
B.on("dialogClosed",this.dialogClosed,{scope:this,row:C,col:1,field:B});
J=new Ext.Editor(B);
break;
case ORYX.CONFIG.TYPE_VISUALDATAASSIGNMENTS:var B=new Ext.form.ComplexVisualDataAssignmentField({allowBlank:n.optional(),dataSource:this.dataSource,grid:this.grid,row:C,facade:this.facade,shapes:this.shapeSelection.shapes});
B.on("dialogClosed",this.dialogClosed,{scope:this,row:C,col:1,field:B});
J=new Ext.Editor(B);
break;
case ORYX.CONFIG.TYPE_COMPLEX:var B=new Ext.form.ComplexListField({allowBlank:n.optional()},n.complexItems(),r,this.facade);
B.on("dialogClosed",this.dialogClosed,{scope:this,row:C,col:1,field:B});
J=new Ext.Editor(B);
break;
case"CPNString":var A=new Ext.form.TextField({allowBlank:n.optional(),msgTarget:"title",maxLength:n.length(),enableKeyEvents:true});
A.on("keyup",function(j,k){this.editDirectly(r,j.getValue())
}.bind(this));
J=new Ext.Editor(A);
break;
default:var A=new Ext.form.TextField({allowBlank:n.optional(),msgTarget:"title",maxLength:n.length(),enableKeyEvents:true});
A.on("keyup",function(j,k){this.editDirectly(r,j.getValue())
}.bind(this));
J=new Ext.Editor(A)
}if(J!==undefined){J.on("beforehide",this.facade.enableEvent.bind(this,ORYX.CONFIG.EVENT_KEYDOWN));
J.on("specialkey",this.specialKeyDown.bind(this))
}}else{if(n.type()===ORYX.CONFIG.TYPE_URL||n.type()===ORYX.CONFIG.TYPE_DIAGRAM_LINK){z=String(z).search("http")!==0?("http://"+z):z;
z="<a href='"+z+"' target='_blank'>"+z.split("://")[1]+"</a>"
}}}if((n.visible()&&n.visible()==true)&&n.hidden()!=true&&(n.id()!="origbordercolor"&&n.id()!="origbgcolor"&&n.id()!="isselectable")){var E=true;
if(this.shapeSelection.shapes.length==1){if(n.fortasktypes()&&n.fortasktypes().length>0){var g=false;
var x=n.fortasktypes().split("|");
for(var S=0;
S<x.size();
S++){if(x[S]==this.shapeSelection.shapes.first().properties["oryx-tasktype"]){g=true
}}if(!g){E=false
}}if(n.ifproptrue()&&n.ifproptrue().length>0){var u=false;
var I=n.ifproptrue();
if(this.shapeSelection.shapes.first().properties["oryx-"+I]&&this.shapeSelection.shapes.first().properties["oryx-"+I]=="true"){u=true
}if(!u){E=false
}}if(n.fordistribution()&&n.fordistribution().length>0){var H=false;
var x=n.fordistribution().split("|");
for(var R=0;
R<x.size();
R++){if(x[R]==this.shapeSelection.shapes.first().properties["oryx-distributiontype"]){H=true
}}if(!H){E=false
}}}if(E){if(n.popular()){n.setPopular()
}if(n.simulation()){n.setSimulation()
}if(n.boundaryonly()){n.setBoundaryonly()
}if(n.customassignment()){n.setCustomassignment()
}if(n.display()){n.setDisplay()
}if(n.extra()){n.setExtra()
}if(n.customassignment()){var P=(ORYX.I18N.propertyNames[n.id()]&&ORYX.I18N.propertyNames[n.id()].length>0)?ORYX.I18N.propertyNames[n.id()]:o;
this.properties.push(["Assignments",P,z,V,{editor:J,propId:r,type:n.type(),tooltip:(ORYX.I18N.propertyNames[n.id()+"_desc"]&&ORYX.I18N.propertyNames[n.id()+"_desc"].length>0)?ORYX.I18N.propertyNames[n.id()+"_desc"]:n.description(),renderer:G,labelProvider:this.getLabelProvider(n)}])
}else{if(n.extra()){var P=(ORYX.I18N.propertyNames[n.id()]&&ORYX.I18N.propertyNames[n.id()].length>0)?ORYX.I18N.propertyNames[n.id()]:o;
this.properties.push([ORYX.I18N.PropertyWindow.moreProps,P,z,V,{editor:J,propId:r,type:n.type(),tooltip:(ORYX.I18N.propertyNames[n.id()+"_desc"]&&ORYX.I18N.propertyNames[n.id()+"_desc"].length>0)?ORYX.I18N.propertyNames[n.id()+"_desc"]:n.description(),renderer:G,labelProvider:this.getLabelProvider(n)}])
}else{if(n.simulation()){var P;
if(n.boundaryonly()){P=(ORYX.I18N.propertyNames[n.id()+"_boundaryonly"]&&ORYX.I18N.propertyNames[n.id()+"_boundaryonly"].length>0)?ORYX.I18N.propertyNames[n.id()+"_boundaryonly"]:o
}else{P=(ORYX.I18N.propertyNames[n.id()]&&ORYX.I18N.propertyNames[n.id()].length>0)?ORYX.I18N.propertyNames[n.id()]:o
}this.simulationProperties.push([ORYX.I18N.PropertyWindow.simulationProps,P,z,V,{editor:J,propId:r,type:n.type(),tooltip:(ORYX.I18N.propertyNames[n.id()+"_desc"]&&ORYX.I18N.propertyNames[n.id()+"_desc"].length>0)?ORYX.I18N.propertyNames[n.id()+"_desc"]:n.description(),renderer:G,labelProvider:this.getLabelProvider(n)}])
}else{if(n.display()){var P=(ORYX.I18N.propertyNames[n.id()]&&ORYX.I18N.propertyNames[n.id()].length>0)?ORYX.I18N.propertyNames[n.id()]:o;
this.displayProperties.push([ORYX.I18N.PropertyWindow.displayProps,P,z,V,{editor:J,propId:r,type:n.type(),tooltip:(ORYX.I18N.propertyNames[n.id()+"_desc"]&&ORYX.I18N.propertyNames[n.id()+"_desc"].length>0)?ORYX.I18N.propertyNames[n.id()+"_desc"]:n.description(),renderer:G,labelProvider:this.getLabelProvider(n)}])
}else{var P=(ORYX.I18N.propertyNames[n.id()]&&ORYX.I18N.propertyNames[n.id()].length>0)?ORYX.I18N.propertyNames[n.id()]:o;
this.popularProperties.push([ORYX.I18N.PropertyWindow.oftenUsed,P,z,V,{editor:J,propId:r,type:n.type(),tooltip:(ORYX.I18N.propertyNames[n.id()+"_desc"]&&ORYX.I18N.propertyNames[n.id()+"_desc"].length>0)?ORYX.I18N.propertyNames[n.id()+"_desc"]:n.description(),renderer:G,labelProvider:this.getLabelProvider(n)}])
}}}}}}}).bind(this))
}this.setProperties()
},getLabelProvider:function(a){lp=ORYX.LabelProviders[a.labelProvider()];
if(lp){return lp(a)
}return null
},hideMoreAttrs:function(a){if(this.properties.length<=0){return
}this.grid.view.un("refresh",this.hideMoreAttrs,this)
},setProperties:function(){var d=this.popularProperties.concat(this.properties);
var a=ORYX.BPSIMDISPLAY==true?d.concat(this.simulationProperties):d;
var c=a.concat(this.customAssignmentsProperties);
var b=c.concat(this.displayProperties);
this.dataSource.loadData(b)
},getSequenceFlowNameForID:function(a){ORYX.EDITOR._canvas.getChildren().each((function(b){this.getSequenceFlowName(b,a)
}).bind(this))
},getGatewayRoutes:function(b,a){Ext.Ajax.request({url:ORYX.PATH+"processinfo",method:"POST",success:function(d){try{if(d.responseText&&d.responseText.length>0){var g=d.responseText.evalJSON();
var f=[];
for(var j=0;
j<g.length;
j++){this.presInfo="";
var h=g[j];
this.getSequenceFlowNameForID(h.sequenceflowinfo);
if(this.presInfo&&this.presInfo.length>0){this.presInfo=this.presInfo+" : "+h.sequenceflowinfo
}else{this.presInfo=h.sequenceflowinfo
}f.push(["",this.presInfo,this.presInfo])
}var c=new Ext.data.SimpleStore({fields:[{name:"icon"},{name:"title"},{name:"value"}],data:f});
a.store=c
}}catch(k){ORYX.EDITOR._pluginFacade.raiseEvent({type:ORYX.CONFIG.EVENT_NOTIFICATION_SHOW,ntype:"error",msg:ORYX.I18N.PropertyWindow.errorDetOutConnections,title:""})
}}.bind(this),failure:function(){ORYX.EDITOR._pluginFacade.raiseEvent({type:ORYX.CONFIG.EVENT_NOTIFICATION_SHOW,ntype:"error",msg:ORYX.I18N.PropertyWindow.errorDetOutConnections,title:""})
},params:{uuid:window.btoa(encodeURI(ORYX.UUID)),ppdata:ORYX.PREPROCESSING,profile:ORYX.PROFILE,gatewayid:b,json:window.btoa(encodeURIComponent(ORYX.EDITOR.getSerializedJSON()))}})
},getSequenceFlowName:function(a,c){if(a instanceof ORYX.Core.Edge){if(a.resourceId==c){if(a.properties["oryx-name"]&&a.properties["oryx-name"].length>0){this.presInfo=a.properties["oryx-name"]
}}}if(a.getChildren().size()>0){for(var b=0;
b<a.getChildren().size();
b++){if(a.getChildren()[b] instanceof ORYX.Core.Edge){this.getSequenceFlowName(a.getChildren()[b],c)
}}}}};
ORYX.Plugins.PropertyWindow=Clazz.extend(ORYX.Plugins.PropertyWindow);
Ext.form.ComplexListField=function(b,a,c,d){Ext.form.ComplexListField.superclass.constructor.call(this,b);
this.items=a;
this.key=c;
this.facade=d
};
Ext.extend(Ext.form.ComplexListField,Ext.form.TriggerField,{triggerClass:"x-form-complex-trigger",readOnly:true,emptyText:ORYX.I18N.PropertyWindow.clickIcon,editable:false,readOnly:true,buildValue:function(){var f=this.grid.getStore();
f.commitChanges();
if(f.getCount()==0){return""
}var d="[";
for(var c=0;
c<f.getCount();
c++){var e=f.getAt(c);
d+="{";
for(var a=0;
a<this.items.length;
a++){var b=this.items[a].id();
d+=b+":"+(""+e.get(b)).toJSON();
if(a<(this.items.length-1)){d+=", "
}}d+="}";
if(c<(f.getCount()-1)){d+=", "
}}d+="]";
d="{'totalCount':"+f.getCount().toJSON()+", 'items':"+d+"}";
return Object.toJSON(d.evalJSON())
},getFieldKey:function(){return this.key
},getValue:function(){if(this.grid){return this.buildValue()
}else{if(this.data==undefined){return""
}else{return this.data
}}},setValue:function(a){if(a.length>0){if(this.data==undefined){this.data=a
}}},keydownHandler:function(a){return false
},dialogListeners:{show:function(){this.onFocus();
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_KEYDOWN,this.keydownHandler.bind(this));
this.facade.disableEvent(ORYX.CONFIG.EVENT_KEYDOWN);
return
},hide:function(){var a=this.dialogListeners;
this.dialog.un("show",a.show,this);
this.dialog.un("hide",a.hide,this);
this.dialog.destroy(true);
this.grid.destroy(true);
delete this.grid;
delete this.dialog;
this.facade.unregisterOnEvent(ORYX.CONFIG.EVENT_KEYDOWN,this.keydownHandler.bind(this));
this.facade.enableEvent(ORYX.CONFIG.EVENT_KEYDOWN);
this.fireEvent("dialogClosed",this.data);
Ext.form.ComplexListField.superclass.setValue.call(this,this.data)
}},buildInitial:function(f,a){var b=new Hash();
for(var c=0;
c<a.length;
c++){var e=a[c].id();
b[e]=a[c].value()
}var d=Ext.data.Record.create(f);
return new d(b)
},buildColumnModel:function(n){var k=[];
for(var d=0;
d<this.items.length;
d++){var a=this.items[d].id();
var e=this.items[d].name();
var b=this.items[d].width();
var j=this.items[d].type();
var f;
if(j==ORYX.CONFIG.TYPE_STRING){f=new Ext.form.TextField({allowBlank:this.items[d].optional(),width:b})
}else{if(j==ORYX.CONFIG.TYPE_CHOICE){var h=this.items[d].items();
var m=ORYX.Editor.graft("http://www.w3.org/1999/xhtml",n,["select",{style:"display:none"}]);
var l=new Ext.Template('<option value="{value}">{value}</option>');
h.each(function(o){l.append(m,{value:o.value()})
});
f=new Ext.form.ComboBox({editable:false,typeAhead:true,triggerAction:"all",transform:m,lazyRender:true,msgTarget:"title",width:b})
}else{if(j==ORYX.CONFIG.TYPE_DYNAMICCHOICE){var h=this.items[d].items();
var m=ORYX.Editor.graft("http://www.w3.org/1999/xhtml",n,["select",{style:"display:none"}]);
var l=new Ext.Template('<option value="{value}">{value}</option>');
var g=false;
var c="";
h.each(function(t){if(t.needsprop()&&t.needsprop().length>0){g=true;
c=t.needsprop()
}var r=ORYX.EDITOR.getSerializedJSON();
var s=jsonPath(r.evalJSON(),t.value());
if(s){if(s.toString().length>0){for(var q=0;
q<s.length;
q++){var u=s[q].split(",");
for(var p=0;
p<u.length;
p++){if(u[p].indexOf(":")>0){var o=u[p].split(":");
l.append(m,{value:o[0]})
}else{l.append(m,{value:u[p]})
}}}}}else{this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_NOTIFICATION_SHOW,ntype:"info",msg:ORYX.I18N.PropertyWindow.noDataAvailableForProp,title:""})
}});
f=new Ext.form.ComboBox({editable:false,typeAhead:true,triggerAction:"all",transform:m,lazyRender:true,msgTarget:"title",width:b});
f.on("select",function(u,o,q){if(g==true&&c.length>0){var t=ORYX.EDITOR._pluginFacade.getSelection();
if(t&&t.length==1){var p=t.first();
var s="oryx-"+c;
var r=p.properties[s];
if(r&&r.length<1){this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_NOTIFICATION_SHOW,ntype:"warning",msg:"This property needs the associated property '"+c+"' to be set.",title:""})
}}}}.bind(this))
}else{if(j==ORYX.CONFIG.TYPE_BOOLEAN){f=new Ext.form.Checkbox({width:b})
}else{if(j=="xpath"){f=new Ext.form.TextField({allowBlank:this.items[d].optional(),width:b})
}}}}}k.push({id:a,header:e,dataIndex:a,resizable:true,editor:f,width:b})
}return new Ext.grid.ColumnModel(k)
},afterEdit:function(a){a.grid.getStore().commitChanges()
},beforeEdit:function(h){var a=this.grid.getView().getScrollState();
var b=h.column;
var p=h.row;
var e=this.grid.getColumnModel().config[b].id;
for(var g=0;
g<this.items.length;
g++){var o=this.items[g];
var m=o.disable();
if(m!=undefined){var n=this.grid.getStore().getAt(p).get(o.id());
for(var d=0;
d<m.length;
d++){var f=m[d];
if(f.value==n){for(var c=0;
c<f.items.length;
c++){var l=f.items[c];
if(l==e){this.grid.getColumnModel().getCellEditor(b,p).disable();
return
}}}}}}this.grid.getColumnModel().getCellEditor(b,p).enable()
},onTriggerClick:function(){if(this.disabled){return
}var dialogWidth=0;
var recordType=[];
for(var i=0;
i<this.items.length;
i++){var id=this.items[i].id();
var width=this.items[i].width();
var type=this.items[i].type();
if((type==ORYX.CONFIG.TYPE_CHOICE)||(type==ORYX.CONFIG.TYPE_DYNAMICCHOICE)){type=ORYX.CONFIG.TYPE_STRING
}dialogWidth+=width;
recordType[i]={name:id,type:type}
}if(dialogWidth>800){dialogWidth=800
}dialogWidth+=22;
var data=this.data;
if(data==""){data="{}"
}var ds=new Ext.data.Store({proxy:new Ext.data.MemoryProxy(eval("("+data+")")),reader:new Ext.data.JsonReader({root:"items",totalProperty:"totalCount"},recordType)});
ds.load();
var cm=this.buildColumnModel();
this.grid=new Ext.grid.EditorGridPanel({autoScroll:true,autoHeight:true,store:ds,cm:cm,stripeRows:true,clicksToEdit:1,selModel:new Ext.grid.CellSelectionModel()});
var toolbar=new Ext.Toolbar([{text:ORYX.I18N.PropertyWindow.add,handler:function(){var ds=this.grid.getStore();
var index=ds.getCount();
this.grid.stopEditing();
var p=this.buildInitial(recordType,this.items);
ds.insert(index,p);
ds.commitChanges();
this.grid.startEditing(index,0)
}.bind(this)},{text:ORYX.I18N.PropertyWindow.rem,handler:function(){var ds=this.grid.getStore();
var selection=this.grid.getSelectionModel().getSelectedCell();
if(selection==undefined){return
}this.grid.getSelectionModel().clearSelections();
this.grid.stopEditing();
var record=ds.getAt(selection[0]);
ds.remove(record);
ds.commitChanges()
}.bind(this)}]);
this.dialog=new Ext.Window({autoScroll:true,autoCreate:true,title:ORYX.I18N.PropertyWindow.complex,height:350,width:dialogWidth,modal:true,collapsible:false,fixedcenter:true,shadow:true,proxyDrag:true,keys:[{key:27,fn:function(){this.dialog.hide
}.bind(this)}],items:[toolbar,this.grid],bodyStyle:"background-color:#FFFFFF",buttons:[{text:ORYX.I18N.PropertyWindow.ok,handler:function(){this.grid.getView().refresh();
this.grid.stopEditing();
this.data=this.buildValue();
this.dialog.hide()
}.bind(this)},{text:ORYX.I18N.PropertyWindow.cancel,handler:function(){this.dialog.destroy()
}.bind(this)}]});
this.dialog.on(Ext.apply({},this.dialogListeners,{scope:this}));
this.dialog.show();
this.grid.on("beforeedit",this.beforeEdit,this,true);
this.grid.on("afteredit",this.afterEdit,this,true);
this.grid.render()
}});
Ext.form.ComplexTextField=Ext.extend(Ext.form.TriggerField,{editable:false,readOnly:true,onTriggerClick:function(){if(this.disabled){return
}var b=new Ext.form.TextArea({anchor:"100% 100%",value:this.value,listeners:{focus:function(){this.facade.disableEvent(ORYX.CONFIG.EVENT_KEYDOWN)
}.bind(this)}});
var c=ORYX.Utils.getDialogSize(500,500);
var a=new Ext.Window({layout:"anchor",autoCreate:true,title:ORYX.I18N.PropertyWindow.text,width:c.width,height:c.height,modal:true,collapsible:false,fixedcenter:true,shadow:true,proxyDrag:true,keys:[{key:27,fn:function(){a.hide()
}.bind(this)}],items:[b],listeners:{hide:function(){this.fireEvent("dialogClosed",this.value);
a.destroy()
}.bind(this)},buttons:[{text:ORYX.I18N.PropertyWindow.ok,handler:function(){var d=b.getValue();
this.setValue(d);
this.dataSource.getAt(this.row).set("value",d);
this.dataSource.commitChanges();
a.hide()
}.bind(this)},{text:ORYX.I18N.PropertyWindow.cancel,handler:function(){a.destroy()
}.bind(this)}]});
a.show();
b.render();
this.grid.stopEditing();
b.focus(false,100)
}});
Ext.form.ComplexEncodedTextField=Ext.extend(Ext.form.TriggerField,{editable:false,readOnly:true,onTriggerClick:function(){if(this.disabled){return
}var b=new Ext.form.TextArea({anchor:"100% 100%",value:Ext.util.Format.htmlDecode(this.value),listeners:{focus:function(){this.facade.disableEvent(ORYX.CONFIG.EVENT_KEYDOWN)
}.bind(this)}});
var c=ORYX.Utils.getDialogSize(500,500);
var a=new Ext.Window({layout:"anchor",autoCreate:true,title:ORYX.I18N.PropertyWindow.text,width:c.width,height:c.height,modal:true,collapsible:false,fixedcenter:true,shadow:true,proxyDrag:true,keys:[{key:27,fn:function(){a.hide()
}.bind(this)}],items:[b],listeners:{hide:function(){this.fireEvent("dialogClosed",this.value);
a.destroy()
}.bind(this)},buttons:[{text:ORYX.I18N.PropertyWindow.ok,handler:function(){var d=Ext.util.Format.htmlEncode(b.getValue());
this.setValue(d);
this.dataSource.getAt(this.row).set("value",d);
this.dataSource.commitChanges();
a.hide()
}.bind(this)},{text:ORYX.I18N.PropertyWindow.cancel,handler:function(){a.destroy()
}.bind(this)}]});
a.show();
b.render();
this.grid.stopEditing();
b.focus(false,100)
}});
Ext.form.ComplexCustomField=Ext.extend(Ext.form.TriggerField,{editable:false,readOnly:true,onTriggerClick:function(){if(this.disabled){return
}Ext.Ajax.request({url:ORYX.PATH+"customeditors",method:"POST",success:function(a){try{if(a.responseText&&a.responseText.length>0){var d=a.responseText.evalJSON();
var c=d.editors;
if(c[this.title]){var g=ORYX.Utils.getDialogSize(300,450);
var b=new Ext.Window({layout:"anchor",autoCreate:true,title:ORYX.I18N.PropertyWindow.customEditorFor+" "+this.title,height:g.height,width:g.width,modal:true,collapsible:false,fixedcenter:true,shadow:true,resizable:true,proxyDrag:true,autoScroll:true,keys:[{key:27,fn:function(){b.hide()
}.bind(this)}],items:[{xtype:"component",id:"customeditorswindow",autoEl:{tag:"iframe",src:c[this.title],width:"100%",height:"100%"}}],listeners:{hide:function(){this.fireEvent("dialogClosed",this.value);
b.destroy()
}.bind(this)},buttons:[{text:ORYX.I18N.PropertyWindow.ok,handler:function(){var e=document.getElementById("customeditorswindow").contentWindow.getEditorValue();
this.setValue(e);
this.dataSource.getAt(this.row).set("value",e);
this.dataSource.commitChanges();
b.hide()
}.bind(this)},{text:ORYX.I18N.PropertyWindow.cancel,handler:function(){b.destroy()
}.bind(this)}]});
b.show();
this.grid.stopEditing()
}else{this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_NOTIFICATION_SHOW,ntype:"error",msg:ORYX.I18N.PropertyWindow.unableFindCustomEditor+" "+this.title,title:""})
}}else{this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_NOTIFICATION_SHOW,ntype:"error",msg:ORYX.I18N.PropertyWindow.invalidCustomEditorData,title:""})
}}catch(f){this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_NOTIFICATION_SHOW,ntype:"error",msg:ORYX.I18N.PropertyWindow.errorApplyingCustomEditor+":\n"+f,title:""})
}}.bind(this),failure:function(){this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_NOTIFICATION_SHOW,ntype:"error",msg:ORYX.I18N.PropertyWindow.errorApplyingCustomEditor+".",title:""})
},params:{profile:ORYX.PROFILE,uuid:ORYX.UUID}})
}});
Ext.form.ComplexNotificationsField=Ext.extend(Ext.form.TriggerField,{editable:false,readOnly:true,onTriggerClick:function(){if(this.disabled){return
}var p=Ext.data.Record.create([{name:"type"},{name:"expires"},{name:"from"},{name:"tousers"},{name:"togroups"},{name:"replyto"},{name:"subject"},{name:"body"}]);
var b=new Ext.data.MemoryProxy({root:[]});
var z=new Ext.data.Store({autoDestroy:true,reader:new Ext.data.JsonReader({root:"root"},p),proxy:b,sorters:[{property:"subject",direction:"ASC"},{property:"from",direction:"ASC"},{property:"tousers",direction:"ASC"},{property:"togroups",direction:"ASC"}]});
z.load();
if(this.value.length>0){this.value=this.value.replace(/\[/g,"");
this.value=this.value.replace(/\]/g,"");
var q=this.value.split("^");
for(var x=0;
x<q.length;
x++){var e=q[x];
if(e.indexOf("@")>0){var t=e.split("@");
var s=t[0];
var k=t[1];
var g=t[2];
var A="";
var l="";
var f="";
var m="";
var h="";
var d="";
if(s.indexOf("|")>0){var C=s.split("|");
for(var v=0;
v<C.length;
v++){var c=C[v].split(/:(.+)?/)[0];
var w=C[v].split(/:(.+)?/)[1];
if(c=="from"){A=w
}else{if(c=="tousers"){l=w
}else{if(c=="togroups"){f=w
}else{if(c=="replyTo"){m=w
}else{if(c=="subject"){h=w
}else{if(c=="body"){d=w.replace(/<br\s?\/?>/g,"\n")
}}}}}}}}else{var c=s.split(/:(.+)?/)[0];
var w=s.split(/:(.+)?/)[1];
if(c=="from"){A=w
}else{if(c=="tousers"){l=w
}else{if(c=="togroups"){f=w
}else{if(c=="replyTo"){m=w
}else{if(c=="subject"){h=w
}else{if(c=="body"){d=w.replace(/<br\s?\/?>/g,"\n")
}}}}}}}z.add(new p({type:g==undefined?"":g,expires:k==undefined?"":k,from:A==undefined?"":A,tousers:l==undefined?"":l,togroups:f==undefined?"":f,replyto:m==undefined?"":m,subject:h==undefined?"":h,body:d==undefined?"":d}))
}}}var n=new Array();
var E=new Array();
E.push("not-started");
E.push("not-started");
n.push(E);
var u=new Array();
u.push("not-completed");
u.push("not-completed");
n.push(u);
var B=ORYX.Utils.getDialogSize(350,900);
var D=(B.width-80)/8;
var r=Ext.id();
var o=new Extensive.grid.ItemDeleter();
var a=new Ext.grid.EditorGridPanel({autoScroll:true,autoHeight:true,store:z,id:r,stripeRows:true,cm:new Ext.grid.ColumnModel([new Ext.grid.RowNumberer(),{id:"type",header:ORYX.I18N.PropertyWindow.type,width:D,dataIndex:"type",editor:new Ext.form.ComboBox({id:"typeCombo",valueField:"name",displayField:"value",labelStyle:"display:none",submitValue:true,typeAhead:false,queryMode:"local",mode:"local",triggerAction:"all",selectOnFocus:true,hideTrigger:false,forceSelection:false,selectOnFocus:true,autoSelect:false,store:new Ext.data.SimpleStore({fields:["name","value"],data:n})})},{id:"expires",header:ORYX.I18N.PropertyWindow.expiresAt,width:D,dataIndex:"expires",editor:new Ext.form.TextField({allowBlank:true,regex:/^[a-z0-9 \#\{\}\-\.\_]*$/i}),renderer:Ext.util.Format.htmlEncode},{id:"from",header:ORYX.I18N.PropertyWindow.from,width:D,dataIndex:"from",editor:new Ext.form.TextField({allowBlank:true,regex:/^[a-z0-9 \#\{\}\-\.\_\,]*$/i}),renderer:Ext.util.Format.htmlEncode},{id:"tousers",header:ORYX.I18N.PropertyWindow.toUsers,width:D,dataIndex:"tousers",editor:new Ext.form.TextField({allowBlank:true,regex:/^[a-z0-9 \#\{\}\-\.\_\,]*$/i}),renderer:Ext.util.Format.htmlEncode},{id:"togroups",header:ORYX.I18N.PropertyWindow.toGroups,width:D,dataIndex:"togroups",editor:new Ext.form.TextField({allowBlank:true,regex:/^[a-z0-9 \#\{\}\-\.\_\,]*$/i}),renderer:Ext.util.Format.htmlEncode},{id:"replyto",header:ORYX.I18N.PropertyWindow.replyTo,width:D,dataIndex:"replyto",editor:new Ext.form.TextField({allowBlank:true,regex:/^[a-z0-9 \#\{\}\-\.\_\,]*$/i}),renderer:Ext.util.Format.htmlEncode},{id:"subject",header:ORYX.I18N.PropertyWindow.subject,width:D,dataIndex:"subject",editor:new Ext.form.TextField({allowBlank:true,regex:/^[a-z0-9 \#\{\}\-\.\_\,]*$/i}),renderer:Ext.util.Format.htmlEncode},{id:"body",header:ORYX.I18N.PropertyWindow.body,width:D,dataIndex:"body",editor:new Ext.form.TextArea({allowBlank:true,disableKeyFilter:true,grow:true}),renderer:Ext.util.Format.htmlEncode},o]),selModel:o,autoHeight:true,tbar:[{text:ORYX.I18N.PropertyWindow.addNotification,handler:function(){z.add(new p({expires:"",from:"",tousers:"",type:"not-started",togroups:"",replyto:"",subject:"",body:""}));
a.fireEvent("cellclick",a,z.getCount()-1,1,null)
}}],clicksToEdit:1,listeners:{beforeedit:function(j){if(j.column!=8){return true
}var F=new Ext.form.TextArea({anchor:"100% 100%",value:j.value});
var G=ORYX.Utils.getDialogSize(300,350);
var H=new Ext.Window({id:"notificationsBodyEditorWindow",layout:"anchor",autoCreate:true,title:ORYX.I18N.PropertyWindow.addNotificationInstructions,height:G.height,width:G.width,modal:true,collapsible:false,fixedcenter:true,shadow:true,proxyDrag:true,items:[F],buttons:[{text:ORYX.I18N.PropertyWindow.ok,handler:function(){var I=F.getValue();
j.record.set("body",I);
H.destroy()
}.bind(this)},{text:ORYX.I18N.PropertyWindow.cancel,handler:function(){H.destroy()
}.bind(this)}]});
H.show();
return false
}.bind(this)}});
var y=new Ext.Window({layout:"anchor",autoCreate:true,title:ORYX.I18N.PropertyWindow.editorForNotifications,height:B.height,width:B.width,modal:true,collapsible:false,fixedcenter:true,shadow:true,resizable:true,proxyDrag:true,autoScroll:true,keys:[{key:27,fn:function(){y.hide()
}.bind(this)}],items:[a],listeners:{hide:function(){this.fireEvent("dialogClosed",this.value);
y.destroy()
}.bind(this)},buttons:[{text:ORYX.I18N.PropertyWindow.ok,handler:function(){var j="";
a.stopEditing();
a.getView().refresh();
z.data.each(function(){if((this.data.tousers.length>0||this.data.togroups.length>0)&&this.data.subject.length>0&&this.data.body.length>0){j+="[from:"+this.data.from+"|tousers:"+this.data.tousers+"|togroups:"+this.data.togroups+"|replyTo:"+this.data.replyto+"|subject:"+this.data.subject+"|body:"+this.data.body.replace(/\r\n|\r|\n/g,"<br />")+"]";
j+="@["+this.data.expires+"]";
j+="@"+this.data.type;
j+="^"
}});
if(j.length>0){j=j.slice(0,-1)
}this.setValue(j);
this.dataSource.getAt(this.row).set("value",j);
this.dataSource.commitChanges();
y.hide()
}.bind(this)},{text:ORYX.I18N.PropertyWindow.cancel,handler:function(){y.destroy()
}.bind(this)}]});
y.show();
a.render();
this.grid.stopEditing();
a.focus(false,100)
}});
Ext.form.ComplexReassignmentField=Ext.extend(Ext.form.TriggerField,{editable:false,readOnly:true,onTriggerClick:function(){if(this.disabled){return
}var c=Ext.data.Record.create([{name:"users"},{name:"groups"},{name:"expires"},{name:"type"}]);
var l=new Ext.data.MemoryProxy({root:[]});
var d=new Ext.data.Store({autoDestroy:true,reader:new Ext.data.JsonReader({root:"root"},c),proxy:l,sorters:[{property:"users",direction:"ASC"},{property:"groups",direction:"ASC"}]});
d.load();
if(this.value.length>0){this.value=this.value.replace(/\[/g,"");
this.value=this.value.replace(/\]/g,"");
var n=this.value.split("^");
for(var t=0;
t<n.length;
t++){var e=n[t];
if(e.indexOf("@")>0){var q=e.split("@");
var p=q[0];
var h=q[1];
var f=q[2];
var g="";
var s="";
if(p.indexOf("|")>0){var x=p.split("|");
var z=x[0];
var m=x[1];
var b=z.split(":");
if(b[0]=="users"){g=b[1]
}else{if(b[0]=="groups"){s=b[1]
}}var u=m.split(":");
if(u[0]=="users"){g=u[1]
}else{if(u[0]=="groups"){s=u[1]
}}}else{var B=p.split(":");
if(B[0]=="users"){g=B[1]
}else{if(B[0]=="groups"){s=B[1]
}}}d.add(new c({users:g,groups:s,expires:h,type:f}))
}}}var j=new Array();
var A=new Array();
A.push("not-started");
A.push("not-started");
j.push(A);
var r=new Array();
r.push("not-completed");
r.push("not-completed");
j.push(r);
var o=Ext.id();
var k=new Extensive.grid.ItemDeleter();
var w=ORYX.Utils.getDialogSize(350,700);
var y=(w.width-80)/4;
var a=new Ext.grid.EditorGridPanel({autoScroll:true,autoHeight:true,store:d,id:o,stripeRows:true,cm:new Ext.grid.ColumnModel([new Ext.grid.RowNumberer(),{id:"users",header:ORYX.I18N.PropertyWindow.users,width:y,dataIndex:"users",editor:new Ext.form.TextField({allowBlank:true,regex:/^[a-z0-9 \#\{\}\-\.\_\,]*$/i}),renderer:Ext.util.Format.htmlEncode},{id:"groups",header:ORYX.I18N.PropertyWindow.groups,width:y,dataIndex:"groups",editor:new Ext.form.TextField({allowBlank:true,regex:/^[a-z0-9 \#\{\}\-\.\_\,]*$/i}),renderer:Ext.util.Format.htmlEncode},{id:"expires",header:ORYX.I18N.PropertyWindow.expiresAt,width:y,dataIndex:"expires",editor:new Ext.form.TextField({allowBlank:true,regex:/^[a-z0-9 \#\{\}\-\.\_]*$/i}),renderer:Ext.util.Format.htmlEncode},{id:"type",header:ORYX.I18N.PropertyWindow.type,width:y,dataIndex:"type",editor:new Ext.form.ComboBox({id:"typeCombo",valueField:"name",displayField:"value",labelStyle:"display:none",submitValue:true,typeAhead:false,queryMode:"local",mode:"local",triggerAction:"all",selectOnFocus:true,hideTrigger:false,forceSelection:false,selectOnFocus:true,autoSelect:false,store:new Ext.data.SimpleStore({fields:["name","value"],data:j})})},k]),selModel:k,autoHeight:true,tbar:[{text:ORYX.I18N.PropertyWindow.addReassignment,handler:function(){d.add(new c({users:"",groups:"",expires:"",type:"not-started"}));
a.fireEvent("cellclick",a,d.getCount()-1,1,null)
}}],clicksToEdit:1});
var v=new Ext.Window({layout:"anchor",autoCreate:true,title:ORYX.I18N.PropertyWindow.editorForReassignment,height:w.height,width:w.width,modal:true,collapsible:false,fixedcenter:true,shadow:true,resizable:true,proxyDrag:true,autoScroll:true,keys:[{key:27,fn:function(){v.hide()
}.bind(this)}],items:[a],listeners:{hide:function(){this.fireEvent("dialogClosed",this.value);
v.destroy()
}.bind(this)},buttons:[{text:ORYX.I18N.PropertyWindow.ok,handler:function(){var C="";
a.stopEditing();
a.getView().refresh();
d.data.each(function(){if((this.data.users.length>0||this.data.groups.length>0)&&this.data.expires.length>0&&this.data.type.length>0){C+="[users:"+this.data.users+"|groups:"+this.data.groups+"]";
C+="@["+this.data.expires+"]";
C+="@"+this.data.type;
C+="^"
}});
if(C.length>0){C=C.slice(0,-1)
}this.setValue(C);
this.dataSource.getAt(this.row).set("value",C);
this.dataSource.commitChanges();
v.hide()
}.bind(this)},{text:ORYX.I18N.PropertyWindow.cancel,handler:function(){v.destroy()
}.bind(this)}]});
v.show();
a.render();
this.grid.stopEditing();
a.focus(false,100)
}});
Ext.form.ComplexImportsField=Ext.extend(Ext.form.TriggerField,{editable:false,readOnly:true,onTriggerClick:function(){if(this.disabled){return
}var a=ORYX.EDITOR.getSerializedJSON();
var b=jsonPath(a.evalJSON(),"$.properties.package");
var c=jsonPath(a.evalJSON(),"$.properties.id");
Ext.Ajax.request({url:ORYX.PATH+"calledelement",method:"POST",success:function(k){try{if(k.responseText.length>=0&&k.responseText!="false"){var w=Ext.decode(k.responseText);
var n=new Array();
var R=new Array();
R.push("String");
R.push("String");
n.push(R);
var j=new Array();
j.push("Integer");
j.push("Integer");
n.push(j);
var F=new Array();
F.push("Boolean");
F.push("Boolean");
n.push(F);
var u=new Array();
u.push("Float");
u.push("Float");
n.push(u);
var B=new Array();
B.push("Object");
B.push("Object");
n.push(B);
var d=new Array();
for(var s in w){var y=w[s];
d.push(y)
}d.sort();
for(var J=0;
J<d.length;
J++){var L=new Array();
var f=d[J];
var v=f.split(".");
var P=v[v.length-1];
var D=f.substring(0,f.length-(P.length+1));
L.push(P+" ["+D+"]");
L.push(d[J]);
n.push(L)
}var G=Ext.data.Record.create([{name:"type"},{name:"classname"},{name:"customclassname"},{name:"wsdllocation"},{name:"wsdlnamespace"}]);
var O=new Ext.data.MemoryProxy({root:[]});
var m=new Ext.data.Store({autoDestroy:true,reader:new Ext.data.JsonReader({root:"root"},G),proxy:O,sorters:[{property:"type",direction:"ASC"}]});
m.load();
if(this.value.length>0){var q=this.value.split(",");
for(var N=0;
N<q.length;
N++){var S="";
var g,r,H;
var p=q[N];
var h=p.split("|");
if(h[1]=="default"){S="default";
g=h[0];
r="";
H=""
}else{S="wsdl";
g="";
r=h[0];
H=h[1]
}var o=false;
for(var s in w){var y=w[s];
if(y==g){o=true
}}if(o){m.add(new G({type:S,classname:g,customclassname:"",wsdllocation:r,wsdlnamespace:H}))
}else{m.add(new G({type:S,classname:"",customclassname:g,wsdllocation:r,wsdlnamespace:H}))
}}}var l=new Extensive.grid.ItemDeleter();
var C=new Array();
var K=new Array();
K.push("default");
K.push("default");
C.push(K);
var z=new Array();
z.push("wsdl");
z.push("wsdl");
C.push(z);
var x=ORYX.Utils.getDialogSize(400,900);
var A=(x.width-80)/5;
var E=Ext.id();
var I=new Ext.grid.EditorGridPanel({autoScroll:true,autoHeight:true,store:m,id:E,stripeRows:true,cm:new Ext.grid.ColumnModel([new Ext.grid.RowNumberer(),{id:"imptype",header:ORYX.I18N.PropertyWindow.importType,width:A,dataIndex:"type",editor:new Ext.form.ComboBox({id:"importTypeCombo",typeAhead:true,anyMatch:true,valueField:"name",displayField:"value",labelStyle:"display:none",submitValue:true,typeAhead:false,queryMode:"local",mode:"local",triggerAction:"all",selectOnFocus:true,hideTrigger:false,forceSelection:false,selectOnFocus:true,autoSelect:false,store:new Ext.data.SimpleStore({fields:["name","value"],data:C})})},{id:"classname",header:"Defined Class Name",width:A,dataIndex:"classname",editor:new Ext.form.ComboBox({id:"customTypeCombo",typeAhead:true,anyMatch:true,valueField:"value",displayField:"name",labelStyle:"display:none",submitValue:true,typeAhead:false,queryMode:"local",mode:"local",triggerAction:"all",selectOnFocus:true,hideTrigger:false,forceSelection:false,selectOnFocus:true,autoSelect:false,store:new Ext.data.SimpleStore({fields:["name","value"],data:n})})},{id:"customclassname",header:"Custom Class Name",width:A,dataIndex:"customclassname",editor:new Ext.form.TextField({allowBlank:true})},{id:"wsdllocation",header:ORYX.I18N.PropertyWindow.wsdlLocation,width:A,dataIndex:"wsdllocation",editor:new Ext.form.TextField({allowBlank:true})},{id:"wsdlnamespace",header:ORYX.I18N.PropertyWindow.wsdlNamespace,width:A,dataIndex:"wsdlnamespace",editor:new Ext.form.TextField({allowBlank:true})},l]),selModel:l,autoHeight:true,tbar:[{text:ORYX.I18N.PropertyWindow.addImport,handler:function(){m.add(new G({type:"default",classname:"",customclassname:"",wsdllocation:"",wsdlnamespace:""}));
I.fireEvent("cellclick",I,m.getCount()-1,1,null)
}}],clicksToEdit:1});
var M=new Ext.Window({layout:"anchor",autoCreate:true,title:ORYX.I18N.PropertyWindow.editorForImports,height:x.height,width:x.width,modal:true,collapsible:false,fixedcenter:true,shadow:true,resizable:true,proxyDrag:true,autoScroll:true,keys:[{key:27,fn:function(){M.hide()
}.bind(this)}],items:[I],listeners:{hide:function(){this.fireEvent("dialogClosed",this.value);
M.destroy()
}.bind(this)},buttons:[{text:ORYX.I18N.PropertyWindow.ok,handler:function(){var e="";
I.getView().refresh();
I.stopEditing();
m.data.each(function(){if(this.data.type=="default"){if(this.data.classname.length>0){e+=this.data.classname+"|"+this.data.type+","
}else{e+=this.data.customclassname+"|"+this.data.type+","
}}if(this.data.type=="wsdl"){e+=this.data.wsdllocation+"|"+this.data.wsdlnamespace+"|"+this.data.type+","
}});
if(e.length>0){e=e.slice(0,-1)
}this.setValue(e);
this.dataSource.getAt(this.row).set("value",e);
this.dataSource.commitChanges();
M.hide()
}.bind(this)},{text:ORYX.I18N.PropertyWindow.cancel,handler:function(){M.destroy()
}.bind(this)}]});
M.show();
I.render();
this.grid.stopEditing();
I.focus(false,100)
}else{this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_NOTIFICATION_SHOW,ntype:"error",msg:"Unable to find Data Types.",title:""})
}}catch(Q){this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_NOTIFICATION_SHOW,ntype:"error",msg:"Error retrieving Data Types info  :\n"+Q,title:""})
}}.bind(this),failure:function(){this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_NOTIFICATION_SHOW,ntype:"error",msg:"Error retrieving Data Types info.",title:""})
},params:{profile:ORYX.PROFILE,uuid:ORYX.UUID,ppackage:b,pid:c,action:"showdatatypes"}})
}});
Ext.form.ComplexCaseRolesField=Ext.extend(Ext.form.TriggerField,{editable:false,readOnly:true,onTriggerClick:function(){if(this.disabled){return
}var d=ORYX.EDITOR.getSerializedJSON();
var q=jsonPath(d.evalJSON(),"$.properties.package");
var h=jsonPath(d.evalJSON(),"$.properties.id");
var o=Ext.data.Record.create([{name:"role"},{name:"cardinality"}]);
var c=new Ext.data.MemoryProxy({root:[]});
var a=new Ext.data.Store({autoDestroy:true,reader:new Ext.data.JsonReader({root:"root"},o),proxy:c,sorters:[{property:"role",direction:"ASC"}]});
a.load();
if(this.value.length>0){var j=this.value.split(",");
for(var m=0;
m<j.length;
m++){var s="";
var f="";
var e=j[m];
if(e.indexOf(":")>0){var l=e.split(":");
s=l[0];
f=l[1]
}else{s=e;
f=""
}a.add(new o({role:s,cardinality:f}))
}}var g=new Extensive.grid.ItemDeleter();
var p=ORYX.Utils.getDialogSize(300,600);
var r=(p.width-80)/5;
var k=Ext.id();
var b=new Ext.grid.EditorGridPanel({autoScroll:true,autoHeight:true,store:a,id:k,stripeRows:true,cm:new Ext.grid.ColumnModel([new Ext.grid.RowNumberer(),{id:"caseroles",header:ORYX.I18N.PropertyWindow.caseRole,width:r,dataIndex:"role",editor:new Ext.form.TextField({allowBlank:true})},{id:"casecardinality",header:ORYX.I18N.PropertyWindow.caseCardinality,width:r,dataIndex:"cardinality",editor:new Ext.form.NumberField({name:"cardinalityValue",allowDecimals:false,allowBlank:true})},g]),selModel:g,autoHeight:true,tbar:[{text:ORYX.I18N.PropertyWindow.addCaseRole,handler:function(){a.add(new o({role:"",cardinality:""}));
b.fireEvent("cellclick",b,a.getCount()-1,1,null)
}}],clicksToEdit:1});
var n=new Ext.Window({layout:"anchor",autoCreate:true,title:ORYX.I18N.PropertyWindow.editorForCaseRoles,height:p.height,width:p.width,modal:true,collapsible:false,fixedcenter:true,shadow:true,resizable:true,proxyDrag:true,autoScroll:true,keys:[{key:27,fn:function(){n.hide()
}.bind(this)}],items:[b],listeners:{hide:function(){this.fireEvent("dialogClosed",this.value);
n.destroy()
}.bind(this)},buttons:[{text:ORYX.I18N.PropertyWindow.ok,handler:function(){var t="";
b.getView().refresh();
b.stopEditing();
a.data.each(function(){if(this.data.role.length>0){if(this.data.cardinality.toString().length>0){t+=this.data.role+":"+this.data.cardinality;
t+=","
}else{t+=this.data.role;
t+=","
}}});
if(t.length>0){t=t.slice(0,-1)
}this.setValue(t);
this.dataSource.getAt(this.row).set("value",t);
this.dataSource.commitChanges();
n.hide()
}.bind(this)},{text:ORYX.I18N.PropertyWindow.cancel,handler:function(){n.destroy()
}.bind(this)}]});
n.show();
b.render();
this.grid.stopEditing();
b.focus(false,100)
}});
Ext.form.ComplexActionsField=Ext.extend(Ext.form.TriggerField,{editable:false,readOnly:true,onTriggerClick:function(){if(this.disabled){return
}var h=Ext.data.Record.create([{name:"action"}]);
var l=new Ext.data.MemoryProxy({root:[]});
var e=new Ext.data.Store({autoDestroy:true,reader:new Ext.data.JsonReader({root:"root"},h),proxy:l,sorters:[{property:"action",direction:"ASC"}]});
e.load();
if(this.value.length>0){var k=this.value.split("|");
for(var g=0;
g<k.length;
g++){var c=k[g];
e.add(new h({action:c}))
}}var j=new Extensive.grid.ItemDeleter();
var d=Ext.id();
var b=ORYX.Utils.getDialogSize(300,450);
var f=b.width-80;
var a=new Ext.grid.EditorGridPanel({autoScroll:true,autoHeight:true,store:e,id:d,stripeRows:true,cm:new Ext.grid.ColumnModel([new Ext.grid.RowNumberer(),{id:"action",header:ORYX.I18N.PropertyWindow.action,width:f,dataIndex:"action",editor:new Ext.form.TextField({allowBlank:true})},j]),selModel:j,autoHeight:true,tbar:[{text:ORYX.I18N.PropertyWindow.addAction,handler:function(){e.add(new h({action:""}));
a.fireEvent("cellclick",a,e.getCount()-1,1,null)
}}],clicksToEdit:1});
var m=new Ext.Window({layout:"anchor",autoCreate:true,title:ORYX.I18N.PropertyWindow.editorForActions,height:b.height,width:b.width,modal:true,collapsible:false,fixedcenter:true,shadow:true,resizable:true,proxyDrag:true,autoScroll:true,keys:[{key:27,fn:function(){m.hide()
}.bind(this)}],items:[a],listeners:{hide:function(){this.fireEvent("dialogClosed",this.value);
m.destroy()
}.bind(this)},buttons:[{text:ORYX.I18N.PropertyWindow.ok,handler:function(){var n="";
a.getView().refresh();
a.stopEditing();
e.data.each(function(){if(this.data.action.length>0){n+=this.data.action+"|"
}});
if(n.length>0){n=n.slice(0,-1)
}this.setValue(n);
this.dataSource.getAt(this.row).set("value",n);
this.dataSource.commitChanges();
m.hide()
}.bind(this)},{text:ORYX.I18N.PropertyWindow.cancel,handler:function(){m.destroy()
}.bind(this)}]});
m.show();
a.render();
this.grid.stopEditing();
a.focus(false,100)
}});
Ext.form.ComplexDataAssignmenField=Ext.extend(Ext.form.TriggerField,{editable:false,readOnly:true,addParentVars:function(h,d,m,c,b,l){if(h){if(h._stencil._jsonStencil.id=="http://b3mn.org/stencilset/bpmn2.0#MultipleInstanceSubprocess"||h._stencil._jsonStencil.id=="http://b3mn.org/stencilset/bpmn2.0#Subprocess"||h._stencil._jsonStencil.id=="http://b3mn.org/stencilset/bpmn2.0#AdHocSubprocess"){var j=h.properties["oryx-vardefs"];
if(j&&j.length>0){var o=j.split(",");
for(var f=0;
f<o.length;
f++){var e=o[f];
var g=new Array();
if(e.indexOf(":")>0){var p=e.split(":");
g.push(p[0]);
g.push(p[0]);
b[p[0]]=p[1];
l.push(p[0])
}else{g.push(e);
g.push(e);
b[e]="java.lang.String";
l.push(e)
}m.push(g);
c.push(g)
}}if(h._stencil._jsonStencil.id=="http://b3mn.org/stencilset/bpmn2.0#MultipleInstanceSubprocess"){var a=h.properties["oryx-multipleinstancedatainput"];
if(a&&a.length>0){var g=new Array();
g.push(a);
g.push(a);
b[a]="java.lang.String";
l.push(g);
m.push(g);
c.push(g)
}var n=h.properties["oryx-multipleinstancedataoutput"];
if(n&&n.length>0){var g=new Array();
g.push(n);
g.push(n);
b[n]="java.lang.String";
l.push(g);
m.push(g);
c.push(g)
}}}if(h.parent){this.addParentVars(h.parent,d,m,c,b,l)
}}},onTriggerClick:function(){if(this.disabled){return undefined
}if(ORYX.USEOLDDATAASSIGNMENTS==false){this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_DATAIOEDITOR_SHOW,element:this.shapes[0]});
return
}var c="";
var f=ORYX.EDITOR.getSerializedJSON();
var G=jsonPath(f.evalJSON(),"$.properties.vardefs");
var m=new Array();
var p=new Array();
var d=new Hash();
var j=new Array();
var b=new Array();
var B=new Array();
var l=new Array();
var o=new Array();
var t=new Array();
p.push("");
var z=false;
var J=ORYX.EDITOR._pluginFacade.getSelection();
if(J){var y=J.first();
if(y&&y.parent){if(y.parent._stencil._jsonStencil.id=="http://b3mn.org/stencilset/bpmn2.0#MultipleInstanceSubprocess"||y.parent._stencil._jsonStencil.id=="http://b3mn.org/stencilset/bpmn2.0#Subprocess"||y.parent._stencil._jsonStencil.id=="http://b3mn.org/stencilset/bpmn2.0#AdHocSubprocess"){p.push("** Process/Subprocess Definitions **");
m.push(p);
j.push(p);
z=true
}this.addParentVars(y.parent,p,m,j,d,b)
}}if(!z){p.push("** Variable Definitions **");
m.push(p);
j.push(p)
}if(G){G.forEach(function(O){if(O.length>0){var L=O.split(",");
for(var N=0;
N<L.length;
N++){var M=new Array();
var P=L[N];
if(P.indexOf(":")>0){var K=P.split(":");
M.push(K[0]);
M.push(K[0]);
d[K[0]]=K[1];
b.push(K[0])
}else{M.push(P);
M.push(P);
d[P]="java.lang.String";
b.push(P)
}m.push(M);
j.push(M)
}}})
}var q=new Array();
q.push("");
q.push("** Data Inputs **");
m.push(q);
B.push(q);
Ext.each(this.dataSource.data.items,function(O){if((O.data.gridProperties.propId=="oryx-datainputset")||(O.data.gridProperties.propId=="oryx-datainput")){var L=O.data.value.split(",");
for(var N=0;
N<L.length;
N++){var P=L[N];
var M=new Array();
if(P.indexOf(":")>0){var K=P.split(":");
M.push(K[0]);
M.push(K[0]);
d[K[0]]=K[1];
l.push(K[0])
}else{M.push(P);
M.push(P);
d[P]="java.lang.String";
l.push(P)
}m.push(M);
B.push(M)
}}});
var s=new Array();
s.push("");
s.push("** Data Outputs **");
m.push(s);
o.push(s);
Ext.each(this.dataSource.data.items,function(O){if((O.data.gridProperties.propId=="oryx-dataoutputset")||(O.data.gridProperties.propId=="oryx-dataoutput")){var M=O.data.value.split(",");
for(var K=0;
K<M.length;
K++){var P=M[K];
var N=new Array();
if(P.indexOf(":")>0){var L=P.split(":");
N.push(L[0]);
N.push(L[0]);
d[L[0]]=L[1];
t.push(L[0])
}else{N.push(P);
N.push(P);
d[P]="java.lang.String";
t.push(P)
}m.push(N);
o.push(N)
}}});
var e=Ext.data.Record.create([{name:"atype"},{name:"from"},{name:"type"},{name:"to"},{name:"tostr"},{name:"dataType"},{name:"assignment"}]);
var E=new Ext.data.MemoryProxy({root:[]});
var I=new Ext.data.Store({autoDestroy:true,reader:new Ext.data.JsonReader({root:"root"},e),proxy:E,sorters:[{property:"atype",direction:"ASC"},{property:"from",direction:"ASC"},{property:"to",direction:"ASC"},{property:"tostr",direction:"ASC"}]});
I.load();
if(this.value.length>0){var w=this.value.split(",");
for(var D=0;
D<w.length;
D++){var g=w[D];
if(g.indexOf("=")>0){var A=g.split("=");
if(A[0].startsWith("[din]")){var r=A[0].slice(5,A[0].length);
var C=d[r];
if(!C){C="java.lang.String"
}A.shift();
var h=A.join("=").replace(/\#\#/g,",");
h=h.replace(/\|\|/g,"=");
I.add(new e({atype:"DataInput",from:r,type:"is equal to",to:"",tostr:h,dataType:C,assignment:"false"}))
}else{if(A[0].startsWith("[dout]")){var r=A[0].slice(6,A[0].length);
var C=d[r];
if(!C){C="java.lang.String"
}A.shift();
var h=A.join("=").replace(/\#\#/g,",");
h=h.replace(/\|\|/g,"=");
I.add(new e({atype:"DataOutput",from:r,type:"is equal to",to:"",tostr:h,dataType:C,assignment:"false"}))
}else{var r=A[0];
var C=d[r];
if(!C){C="java.lang.String"
}A.shift();
var h=A.join("=").replace(/\#\#/g,",");
h=h.replace(/\|\|/g,"=");
I.add(new e({atype:"DataInput",from:r,type:"is equal to",to:"",tostr:h,dataType:C,assignment:"false"}))
}}}else{if(g.indexOf("->")>0){var A=g.split("->");
if(A[0].startsWith("[din]")){var r=A[0].slice(5,A[0].length);
var C=d[r];
if(!C){C="java.lang.String"
}var k="DataInput";
I.add(new e({atype:k,from:r,type:"is mapped to",to:A[1],tostr:"",dataType:C,assignment:"true"}))
}else{if(A[0].startsWith("[dout]")){var r=A[0].slice(6,A[0].length);
var C=d[r];
if(!C){C="java.lang.String"
}var k="DataOutput";
I.add(new e({atype:k,from:r,type:"is mapped to",to:A[1],tostr:"",dataType:C,assignment:"true"}))
}}}else{if(A[0].startsWith("[din]")){var r=A[0].slice(5,A[0].length);
var C=d[r];
if(!C){C="java.lang.String"
}I.add(new e({atype:"DataInput",from:r,type:"is equal to",to:"",tostr:"",dataType:C,assignment:"false"}))
}else{if(A[0].startsWith("[dout]")){var r=A[0].slice(5,A[0].length);
var C=d[r];
if(!C){C="java.lang.String"
}I.add(new e({atype:"DataInput",from:r,type:"is equal to",to:"",tostr:"",dataType:C,assignment:"false"}))
}}var C=d[g]
}}}}I.on("update",function(M,K,L){if(L=="edit"){var N=d[K.get("from")];
if(!N){N="java.lang.String"
}K.set("dataType",N)
}});
var H=new Ext.form.ComboBox({name:"fromCombo",valueField:"name",displayField:"value",typeAhead:true,mode:"local",triggerAction:"all",selectOnFocus:true,store:new Ext.data.SimpleStore({fields:["name","value"],data:m})});
var v=new Ext.form.ComboBox({name:"typeCombo",valueField:"name",displayField:"value",typeAhead:true,mode:"local",triggerAction:"all",selectOnFocus:true,store:new Ext.data.SimpleStore({fields:["name","value"],data:[["is mapped to",ORYX.I18N.PropertyWindow.isMappedTo],["is equal to",ORYX.I18N.PropertyWindow.isEqualTo]]})});
var n=new Ext.form.ComboBox({name:"toCombo",valueField:"name",displayField:"value",typeAhead:true,mode:"local",triggerAction:"all",selectOnFocus:true,store:new Ext.data.SimpleStore({fields:["name","value"],data:m})});
var u=new Extensive.grid.ItemDeleter();
var x=Ext.id();
var a=new Ext.grid.EditorGridPanel({autoScroll:true,autoHeight:true,store:I,id:x,stripeRows:true,cm:new Ext.grid.ColumnModel([new Ext.grid.RowNumberer(),{id:"valueType",header:ORYX.I18N.PropertyWindow.dataType,width:180,dataIndex:"dataType",hidden:"true"},{id:"atype",header:"Assignment Type",width:180,dataIndex:"atype"},{id:"from",header:ORYX.I18N.PropertyWindow.fromObject,width:180,dataIndex:"from",editor:H},{id:"type",header:ORYX.I18N.PropertyWindow.assignmentType,width:100,dataIndex:"type",editor:v},{id:"to",header:ORYX.I18N.PropertyWindow.toObject,width:180,dataIndex:"to",editor:n},{id:"tostr",header:ORYX.I18N.PropertyWindow.toValue,width:180,dataIndex:"tostr",editor:new Ext.form.TextField({name:"tostrTxt",allowBlank:true}),renderer:Ext.util.Format.htmlEncode},u]),selModel:u,autoHeight:true,tbar:[{text:"[ Input Assignment ]",handler:function(){I.add(new e({atype:"DataInput",from:"",type:"",to:"",tostr:"",assignment:"false"}));
c="datainput";
a.fireEvent("cellclick",a,I.getCount()-1,1,null)
}},{text:"[ Input Mapping ]",handler:function(){I.add(new e({atype:"DataInput",from:"",type:"",to:"",tostr:"",assignment:"true"}));
c="datainput";
a.fireEvent("cellclick",a,I.getCount()-1,1,null)
}},{text:"[ Output Mapping ]",handler:function(){I.add(new e({atype:"DataOutput",from:"",type:"",to:"",tostr:"",assignment:"true"}));
c="dataoutput";
a.fireEvent("cellclick",a,I.getCount()-1,1,null)
}}],clicksToEdit:1,listeners:{beforeedit:function(P){if(P.record.data.atype=="DataInput"){var K=P.grid.getColumnModel().getCellEditor(P.column,P.row)||{};
K=K.field||{};
if(K.name=="typeCombo"){K.destroy();
var L;
if(P.record.data.assignment=="true"){L=new Ext.form.ComboBox({name:"typeCombo",valueField:"name",displayField:"value",typeAhead:true,mode:"local",triggerAction:"all",selectOnFocus:true,store:new Ext.data.SimpleStore({fields:["name","value"],data:[["is mapped to",ORYX.I18N.PropertyWindow.isMappedTo]]})})
}else{L=new Ext.form.ComboBox({name:"typeCombo",valueField:"name",displayField:"value",typeAhead:true,mode:"local",triggerAction:"all",selectOnFocus:true,store:new Ext.data.SimpleStore({fields:["name","value"],data:[["is equal to",ORYX.I18N.PropertyWindow.isEqualTo]]})})
}P.grid.getColumnModel().setEditor(P.column,new Ext.grid.GridEditor(L))
}if(K.name=="fromCombo"){K.destroy();
var M;
if(P.record.data.assignment=="true"){M=new Ext.form.ComboBox({name:"fromCombo",valueField:"name",displayField:"value",typeAhead:true,mode:"local",triggerAction:"all",selectOnFocus:true,store:new Ext.data.SimpleStore({fields:["name","value"],data:j})})
}else{M=new Ext.form.ComboBox({name:"fromCombo",valueField:"name",displayField:"value",typeAhead:true,mode:"local",triggerAction:"all",selectOnFocus:true,store:new Ext.data.SimpleStore({fields:["name","value"],data:B})})
}P.grid.getColumnModel().setEditor(P.column,new Ext.grid.GridEditor(M))
}if(K.name=="toCombo"){K.destroy();
var O;
if(P.record.data.assignment=="true"){O=new Ext.form.ComboBox({name:"toCombo",valueField:"name",displayField:"value",typeAhead:true,mode:"local",triggerAction:"all",selectOnFocus:true,store:new Ext.data.SimpleStore({fields:["name","value"],data:B})})
}else{O=new Ext.form.ComboBox({name:"toCombo",disabled:true,valueField:"name",displayField:"value",typeAhead:true,mode:"local",triggerAction:"all",selectOnFocus:true,store:new Ext.data.SimpleStore({fields:["name","value"],data:B})})
}P.grid.getColumnModel().setEditor(P.column,new Ext.grid.GridEditor(O))
}if(K.name=="tostrTxt"){K.destroy();
var N;
if(P.record.data.assignment=="true"){N=new Ext.form.TextField({name:"tostrTxt",allowBlank:true,disabled:true})
}else{N=new Ext.form.TextField({name:"tostrTxt",allowBlank:true})
}P.grid.getColumnModel().setEditor(P.column,new Ext.grid.GridEditor(N))
}}if(P.record.data.atype=="DataOutput"){var K=P.grid.getColumnModel().getCellEditor(P.column,P.row)||{};
K=K.field||{};
if(K.name=="typeCombo"){K.destroy();
var L;
if(P.record.data.assignment=="true"){L=new Ext.form.ComboBox({name:"typeCombo",valueField:"name",displayField:"value",typeAhead:true,mode:"local",triggerAction:"all",selectOnFocus:true,store:new Ext.data.SimpleStore({fields:["name","value"],data:[["is mapped to",ORYX.I18N.PropertyWindow.isMappedTo]]})})
}else{L=new Ext.form.ComboBox({name:"typeCombo",valueField:"name",displayField:"value",typeAhead:true,mode:"local",triggerAction:"all",selectOnFocus:true,store:new Ext.data.SimpleStore({fields:["name","value"],data:[["is equal to",ORYX.I18N.PropertyWindow.isEqualTo]]})})
}P.grid.getColumnModel().setEditor(P.column,new Ext.grid.GridEditor(L))
}if(K.name=="fromCombo"){K.destroy();
var M;
if(P.record.data.assignment=="true"){M=new Ext.form.ComboBox({name:"fromCombo",valueField:"name",displayField:"value",typeAhead:true,mode:"local",triggerAction:"all",selectOnFocus:true,store:new Ext.data.SimpleStore({fields:["name","value"],data:o})})
}else{M=new Ext.form.ComboBox({name:"fromCombo",disabled:true,valueField:"name",displayField:"value",typeAhead:true,mode:"local",triggerAction:"all",selectOnFocus:true,store:new Ext.data.SimpleStore({fields:["name","value"],data:o})})
}P.grid.getColumnModel().setEditor(P.column,new Ext.grid.GridEditor(M))
}if(K.name=="toCombo"){K.destroy();
var O;
if(P.record.data.assignment=="true"){O=new Ext.form.ComboBox({name:"toCombo",valueField:"name",displayField:"value",typeAhead:true,mode:"local",triggerAction:"all",selectOnFocus:true,store:new Ext.data.SimpleStore({fields:["name","value"],data:j})})
}else{O=new Ext.form.ComboBox({name:"toCombo",disabled:true,valueField:"name",displayField:"value",typeAhead:true,mode:"local",triggerAction:"all",selectOnFocus:true,store:new Ext.data.SimpleStore({fields:["name","value"],data:j})})
}P.grid.getColumnModel().setEditor(P.column,new Ext.grid.GridEditor(O))
}if(K.name=="tostrTxt"){K.destroy();
var N;
if(P.record.data.assignment=="true"){N=new Ext.form.TextField({name:"tostrTxt",allowBlank:true,disabled:true})
}else{N=new Ext.form.TextField({name:"tostrTxt",allowBlank:true})
}P.grid.getColumnModel().setEditor(P.column,new Ext.grid.GridEditor(N))
}}}}});
var F=new Ext.Window({layout:"anchor",autoCreate:true,title:ORYX.I18N.PropertyWindow.editorForDataAssignments,height:350,width:890,modal:true,collapsible:false,fixedcenter:true,shadow:true,resizable:true,proxyDrag:true,autoScroll:true,keys:[{key:27,fn:function(){F.hide()
}.bind(this)}],items:[a],listeners:{hide:function(){this.fireEvent("dialogClosed",this.value);
F.destroy()
}.bind(this)},buttons:[{text:ORYX.I18N.PropertyWindow.ok,handler:function(){var K="";
a.getView().refresh();
a.stopEditing();
I.data.each(function(){if(this.data.from.length>0&&this.data.type.length>0){var L=this.data.atype;
if(this.data.type=="is mapped to"){if(L=="DataInput"){K+="[din]"+this.data.from+"->"+this.data.to+","
}else{if(L=="DataOutput"){K+="[dout]"+this.data.from+"->"+this.data.to+","
}}}else{if(this.data.type=="is equal to"){if(this.data.tostr.length>0){var M=this.data.tostr.replace(/,/g,"##");
M=M.replace(/=/g,"||");
if(L=="DataInput"){K+="[din]"+this.data.from+"="+M+","
}else{if(L=="DataOutput"){K+="[dout]"+this.data.from+"="+M+","
}}}else{if(L=="DataInput"){K+="[din]"+this.data.from+"=,"
}else{if(L=="DataOutput"){K+="[dout]"+this.data.from+"=,"
}}}}}}});
if(K.length>0){K=K.slice(0,-1)
}this.setValue(K);
this.dataSource.getAt(this.row).set("value",K);
this.dataSource.commitChanges();
F.hide()
}.bind(this)},{text:ORYX.I18N.PropertyWindow.cancel,handler:function(){F.destroy()
}.bind(this)}]});
F.show();
a.render();
this.grid.stopEditing();
a.focus(false,100);
return a
}});
Ext.form.NameTypeEditor=Ext.extend(Ext.form.TriggerField,{windowTitle:"",addButtonLabel:"",single:false,editable:false,readOnly:true,dtype:"",addCustomKPI:"",addCaseFile:"",onTriggerClick:function(){if(this.disabled){return
}if(ORYX.USEOLDDATAASSIGNMENTS==false){if(this.dtype==ORYX.CONFIG.TYPE_DTYPE_DINPUT||this.dtype==ORYX.CONFIG.TYPE_DTYPE_DOUTPUT){this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_DATAIOEDITOR_SHOW,element:this.facade.getSelection()[0]});
return
}}var a=ORYX.EDITOR.getSerializedJSON();
var b=jsonPath(a.evalJSON(),"$.properties.package");
var c=jsonPath(a.evalJSON(),"$.properties.id");
Ext.Ajax.request({url:ORYX.PATH+"calledelement",method:"POST",success:function(m){try{if(m.responseText.length>=0&&m.responseText!="false"){var C=Ext.decode(m.responseText);
var S=new Array();
var ab=new Array();
ab.push("true");
ab.push("true");
S.push(ab);
var X=new Array();
X.push("false");
X.push("false");
S.push(X);
var B=new Array();
B.push(ab);
B.push(X);
var r=new Array();
var aa=new Array();
aa.push("String");
aa.push("String");
r.push(aa);
var l=new Array();
l.push("Integer");
l.push("Integer");
r.push(l);
var L=new Array();
L.push("Boolean");
L.push("Boolean");
r.push(L);
var z=new Array();
z.push("Float");
z.push("Float");
r.push(z);
var G=new Array();
G.push("Object");
G.push("Object");
r.push(G);
var d=new Array();
for(var y in C){var F=C[y];
d.push(F)
}d.sort();
for(var Q=0;
Q<d.length;
Q++){var R=new Array();
var f=d[Q];
var A=f.split(".");
var Y=A[A.length-1];
var I=f.substring(0,f.length-(Y.length+1));
R.push(Y+" ["+I+"]");
R.push(d[Q]);
r.push(R)
}var M=Ext.data.Record.create([{name:"name"},{name:"stype"},{name:"ctype"},{name:"kpi"},{name:"casefile"}]);
var x=new Ext.data.MemoryProxy({root:[]});
var h=new Ext.data.Store({autoDestroy:true,reader:new Ext.data.JsonReader({root:"root"},M),proxy:x,sorters:[{property:"name",direction:"ASC"}]});
h.load();
if(this.value.length>0){var w=this.value.split(",");
for(var W=0;
W<w.length;
W++){var s=w[W];
if(s.indexOf(":")>0){var g=s.split(":");
var u=false;
for(var V=0;
V<r.length;
V++){var v=r[V];
for(var T=0;
T<v.length;
T++){var N=v[T];
if(N==g[1]){u=true;
break
}}}if(u==true){var H="false";
if(g.length==3){H=g[2]
}var K=g[0];
var o="false";
if(K.startsWith("caseFile_")){K=K.substring(9,K.length);
o="true"
}h.add(new M({name:K,stype:g[1],ctype:"",kpi:H,casefile:o}))
}else{var H="false";
if(g[1]=="true"||g[1]=="false"){var K=g[0];
var o="false";
if(K.startsWith("caseFile_")){K=K.substring(9,K.length);
o="true"
}h.add(new M({name:K,stype:"",ctype:"",kpi:g[1],casefile:o}))
}else{var H="false";
if(g.length==3){H=g[2]
}var K=g[0];
var o="false";
if(K.startsWith("caseFile_")){K=K.substring(9,K.length);
o="true"
}h.add(new M({name:K,stype:"",ctype:g[1],kpi:H,casefile:o}))
}}}else{var K=s;
var o="false";
if(K.startsWith("caseFile_")){K=K.substring(9,K.length);
o="true"
}h.add(new M({name:K,stype:"",ctype:"",kpi:"false",casefile:o}))
}}}var n=new Extensive.grid.ItemDeleter();
n.setDType(this.dtype);
var E=ORYX.Utils.getDialogSize(300,900);
var q=(E.width-80)/7;
var J=Ext.id();
Ext.form.VTypes.inputNameVal=/^[a-z0-9\-\.\_]*$/i;
Ext.form.VTypes.inputNameText="Invalid name";
Ext.form.VTypes.inputName=function(e){return Ext.form.VTypes.inputNameVal.test(e)
};
Ext.form.VTypes.uniqueInputName=function(ac){var j=Ext.form.VTypes.inputNameVal.test(ac);
var t=true;
h.data.each(function(){if((this.data.name.length>0)&&(this.data.name==ac)){t=false
}});
var k=ORYX.EDITOR.getSerializedJSON();
var e=jsonPath(k.evalJSON(),"$.properties.vardefs");
if(e&&t){e.forEach(function(ag){if(ag.length>0){var ae=ag.split(",");
for(var af=0;
af<ae.length;
af++){var ah=ae[af];
if(ah.indexOf(":")>0){var ad=ah.split(":");
var ai=ad[0].trim();
if(ac==ai){t=false
}}}}})
}return j&&t
};
var D=this.addCustomKPI;
var p=this.addCaseFile;
var P=new Ext.grid.EditorGridPanel({autoScroll:true,autoHeight:true,store:h,id:J,stripeRows:true,cm:new Ext.grid.ColumnModel([new Ext.grid.RowNumberer(),{id:"name",header:ORYX.I18N.PropertyWindow.name,width:q,dataIndex:"name",editor:new Ext.form.TextField({allowBlank:true,vtype:"uniqueInputName",regex:/^[a-z0-9\-\.\_]*$/i}),renderer:Ext.util.Format.htmlEncode},{id:"stype",header:"Defined Types",width:q*2,dataIndex:"stype",editor:new Ext.form.ComboBox({typeAhead:true,anyMatch:true,id:"customTypeCombo",valueField:"value",displayField:"name",labelStyle:"display:none",submitValue:true,typeAhead:true,queryMode:"local",mode:"local",triggerAction:"all",selectOnFocus:true,hideTrigger:false,forceSelection:false,selectOnFocus:true,autoSelect:false,editable:true,store:new Ext.data.SimpleStore({fields:["name","value"],data:r})})},{id:"ctype",header:ORYX.I18N.PropertyWindow.customType,width:q,dataIndex:"ctype",editor:new Ext.form.TextField({allowBlank:true}),renderer:Ext.util.Format.htmlEncode},{id:"casefile",header:"Case File",width:q,dataIndex:"casefile",disabled:(p!="true"),editor:new Ext.form.ComboBox({typeAhead:true,anyMatch:true,id:"casefileConbo",valueField:"value",displayField:"name",labelStyle:"display:none",submitValue:true,typeAhead:true,queryMode:"local",mode:"local",disabled:(p!="true"),triggerAction:"all",selectOnFocus:true,hideTrigger:false,forceSelection:false,selectOnFocus:true,autoSelect:false,editable:true,store:new Ext.data.SimpleStore({fields:["name","value"],data:B})})},{id:"kpi",header:"KPI",width:q,dataIndex:"kpi",disabled:(D!="true"),editor:new Ext.form.ComboBox({typeAhead:true,anyMatch:true,id:"kpiConbo",valueField:"value",displayField:"name",labelStyle:"display:none",submitValue:true,typeAhead:true,queryMode:"local",mode:"local",disabled:(D!="true"),triggerAction:"all",selectOnFocus:true,hideTrigger:false,forceSelection:false,selectOnFocus:true,autoSelect:false,editable:true,store:new Ext.data.SimpleStore({fields:["name","value"],data:S})})},n]),selModel:n,autoHeight:true,tbar:[{text:this.addButtonLabel,handler:function(){if(this.single&&h.getCount()>0){this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_NOTIFICATION_SHOW,ntype:"error",msg:ORYX.I18N.PropertyWindow.OnlySingleEntry,title:""})
}else{h.add(new M({name:"",stype:"",ctype:"",kpi:"false",casefile:"false"}));
P.fireEvent("cellclick",P,h.getCount()-1,1,null)
}}.bind(this)}],clicksToEdit:1});
var O=new Ext.Panel({layout:"fit",autoScroll:true,overflowY:"scroll",viewConfig:{forceFit:true},border:false,items:[P]});
var U=new Ext.Window({layout:"fit",autoCreate:true,title:this.windowTitle,height:E.height,width:E.width,modal:true,collapsible:false,fixedcenter:true,shadow:true,resizable:true,proxyDrag:true,autoScroll:true,keys:[{key:27,fn:function(){U.hide()
}.bind(this)}],items:[O],listeners:{hide:function(){this.fireEvent("dialogClosed",this.value);
U.destroy()
}.bind(this)},buttons:[{text:ORYX.I18N.PropertyWindow.ok,handler:function(){var e="";
P.stopEditing();
P.getView().refresh();
var k=this.addCustomKPI;
var j=this.addCaseFile;
h.data.each(function(){if(this.data.name.length>0){if(this.data.stype.length>0){if(this.data.stype=="Object"&&this.data.ctype.length>0){if(j=="true"&&this.data.casefile=="true"){e+="caseFile_"+this.data.name+":"+this.data.ctype
}else{e+=this.data.name+":"+this.data.ctype
}if(k=="true"){e+=":"+this.data.kpi
}e+=","
}else{if(j=="true"&&this.data.casefile=="true"){e+="caseFile_"+this.data.name+":"+this.data.stype
}else{e+=this.data.name+":"+this.data.stype
}if(k=="true"){e+=":"+this.data.kpi
}e+=","
}}else{if(this.data.ctype.length>0){if(j=="true"&&this.data.casefile=="true"){e+="caseFile_"+this.data.name+":"+this.data.ctype
}else{e+=this.data.name+":"+this.data.ctype
}if(k=="true"){e+=":"+this.data.kpi
}e+=","
}else{if(j=="true"&&this.data.casefile=="true"){e+="caseFile_"+this.data.name
}else{e+=this.data.name
}if(k=="true"){e+=":"+this.data.kpi
}e+=","
}}}});
if(e.length>0){e=e.slice(0,-1)
}this.setValue(e);
this.dataSource.getAt(this.row).set("value",e);
this.dataSource.commitChanges();
U.hide()
}.bind(this)},{text:ORYX.I18N.PropertyWindow.cancel,handler:function(){U.destroy()
}.bind(this)}]});
U.show();
P.render();
this.grid.stopEditing();
P.focus(false,100)
}else{this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_NOTIFICATION_SHOW,ntype:"error",msg:"Unable to find Data Types.",title:""})
}}catch(Z){this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_NOTIFICATION_SHOW,ntype:"error",msg:"Error retrieving Data Types info  :\n"+Z,title:""})
}}.bind(this),failure:function(){this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_NOTIFICATION_SHOW,ntype:"error",msg:"Error retrieving Data Types info.",title:""})
},params:{profile:ORYX.PROFILE,uuid:ORYX.UUID,ppackage:b,pid:c,action:"showdatatypes"}})
}});
Ext.form.ComplexVardefField=Ext.extend(Ext.form.NameTypeEditor,{windowTitle:ORYX.I18N.PropertyWindow.editorForVariableDefinitions,addButtonLabel:ORYX.I18N.PropertyWindow.addVariable,dtype:ORYX.CONFIG.TYPE_DTYPE_VARDEF,addCustomKPI:"true",addCaseFile:"true"});
Ext.form.ComplexDataInputField=Ext.extend(Ext.form.NameTypeEditor,{windowTitle:ORYX.I18N.PropertyWindow.editorForDataInput,addButtonLabel:ORYX.I18N.PropertyWindow.addDataInput,dtype:ORYX.CONFIG.TYPE_DTYPE_DINPUT});
Ext.form.ComplexDataOutputField=Ext.extend(Ext.form.NameTypeEditor,{windowTitle:ORYX.I18N.PropertyWindow.editorForDataOutput,addButtonLabel:ORYX.I18N.PropertyWindow.addDataOutput,dtype:ORYX.CONFIG.TYPE_DTYPE_DOUTPUT});
Ext.form.ComplexDataInputFieldSingle=Ext.extend(Ext.form.NameTypeEditor,{windowTitle:ORYX.I18N.PropertyWindow.editorForDataInput,addButtonLabel:ORYX.I18N.PropertyWindow.addDataInput,single:true,dtype:ORYX.CONFIG.TYPE_DTYPE_DINPUT});
Ext.form.ComplexDataOutputFieldSingle=Ext.extend(Ext.form.NameTypeEditor,{windowTitle:ORYX.I18N.PropertyWindow.editorForDataOutput,addButtonLabel:ORYX.I18N.PropertyWindow.addDataOutput,single:true,dtype:ORYX.CONFIG.TYPE_DTYPE_DOUTPUT});
Ext.form.ComplexGlobalsField=Ext.extend(Ext.form.NameTypeEditor,{windowTitle:ORYX.I18N.PropertyWindow.editorForGlobals,addButtonLabel:ORYX.I18N.PropertyWindow.addGlobal,dtype:ORYX.CONFIG.TYPE_DTYPE_GLOBAL});
Ext.form.ConditionExpressionEditorField=Ext.extend(Ext.form.TriggerField,{editable:false,readOnly:true,typemode:"text/x-java",showLineNumbers:true,doLineWrapping:true,doMatchBrackets:true,editorTitle:ORYX.I18N.ConditionExpressionEditorField.simpleTitle,isForDocumentation:false,onTriggerClick:function(){if(this.disabled){return
}function c(k){e.setValue(k);
e.dataSource.getAt(e.row).set("value",k);
e.dataSource.commitChanges();
ac.hide()
}function g(ao){var k=new String("");
var ap="\0";
var am="\0";
var an=false;
for(i=0;
i<ao.length;
i++){am=ap;
ap=ao.charAt(i);
if(ap==="\\"){if(an){k=k+ap;
an=false;
ap="\0"
}else{an=true
}}else{if(an){if(ap==="n"){k=k+"\n"
}else{k=k+ap
}}else{k=k+ap
}}if(am==="\\"){if(an){an=false
}}}return k
}var G=false;
if(!this.isForDocumentation){Ext.each(this.dataSource.data.items,function(k){if(k.data.gridProperties.propId=="oryx-conditionexpressionlanguage"&&k.data.value=="java"){G=true
}})
}var e=this;
var C=true;
var ae=true;
var t;
var p=new Ext.form.TextArea({id:Ext.id(),fieldLabel:ORYX.I18N.PropertyWindow.expressionEditor,value:g(this.value),autoScroll:true});
var X;
var r;
if(!G){t=new Ext.Panel({border:false,items:[p],autoScroll:true})
}else{var w;
var Q=new Ext.Panel({layout:"column",border:false,style:"margin-left:10px;display:block;",items:[new Ext.form.TextField({name:"stringValue"})]});
var h=new Ext.Panel({layout:"column",border:false,style:"margin-left:10px;display:block;",items:[new Ext.form.NumberField({name:"floatValue",allowDecimals:true})]});
var K=new Ext.Panel({layout:"column",border:false,style:"margin-left:10px;display:block;",items:[new Ext.form.NumberField({name:"floatFrom",allowDecimals:true}),new Ext.form.NumberField({name:"floatTo",allowDecimals:true,style:"margin-left:10px;display:block;"})]});
var ah=new Ext.Panel({layout:"column",border:false,style:"margin-left:10px;display:block;",items:[new Ext.form.NumberField({name:"intValue",allowDecimals:false})]});
var ak=new Ext.Panel({layout:"column",border:false,style:"margin-left:10px;display:block;",items:[new Ext.form.NumberField({name:"intForm",allowDecimals:false}),new Ext.form.NumberField({name:"intTo",allowDecimals:false,style:"margin-left:10px;display:block;"})]});
var z=[];
z.push(["contains",ORYX.I18N.ConditionExpressionEditorField.contains,Q,[0]]);
z.push(["endsWith",ORYX.I18N.ConditionExpressionEditorField.endsWith,Q,[0]]);
z.push(["equalsTo",ORYX.I18N.ConditionExpressionEditorField.equalsTo,Q,[0]]);
z.push(["isEmpty",ORYX.I18N.ConditionExpressionEditorField.isEmpty,null,null]);
z.push(["isNull",ORYX.I18N.ConditionExpressionEditorField.isNull,null,null]);
z.push(["startsWith",ORYX.I18N.ConditionExpressionEditorField.startsWith,Q,[0]]);
var H=new Ext.data.SimpleStore({fields:[{name:"value"},{name:"title"},{name:"panel"},{name:"inputs"}],data:z});
var x=[];
x.push(["between",ORYX.I18N.ConditionExpressionEditorField.between,K,[0,1]]);
x.push(["equalsTo",ORYX.I18N.ConditionExpressionEditorField.equalsTo,h,[0]]);
x.push(["greaterThan",ORYX.I18N.ConditionExpressionEditorField.greaterThan,h,[0]]);
x.push(["greaterOrEqualThan",ORYX.I18N.ConditionExpressionEditorField.greaterThanOrEqual,h,[0]]);
x.push(["isNull",ORYX.I18N.ConditionExpressionEditorField.isNull,null,null]);
x.push(["lessThan",ORYX.I18N.ConditionExpressionEditorField.lessThan,h,[0]]);
x.push(["lessOrEqualThan",ORYX.I18N.ConditionExpressionEditorField.lessThanOrEqual,h,[0]]);
var F=new Ext.data.SimpleStore({fields:[{name:"value"},{name:"title"},{name:"panel"},{name:"inputs"}],data:x});
var D=[];
D.push(["between",ORYX.I18N.ConditionExpressionEditorField.between,ak,[0,1]]);
D.push(["equalsTo",ORYX.I18N.ConditionExpressionEditorField.equalsTo,ah,[0]]);
D.push(["greaterThan",ORYX.I18N.ConditionExpressionEditorField.greaterThan,ah,[0]]);
D.push(["greaterOrEqualThan",ORYX.I18N.ConditionExpressionEditorField.greaterThanOrEqual,ah,[0]]);
D.push(["isNull",ORYX.I18N.ConditionExpressionEditorField.isNull,null,null]);
D.push(["lessThan",ORYX.I18N.ConditionExpressionEditorField.lessThan,ah,[0]]);
D.push(["lessOrEqualThan",ORYX.I18N.ConditionExpressionEditorField.lessThanOrEqual,ah,[0]]);
var aj=new Ext.data.SimpleStore({fields:[{name:"value"},{name:"title"},{name:"panel"},{name:"inputs"}],data:D});
var Y=[];
Y.push(["isFalse",ORYX.I18N.ConditionExpressionEditorField.isFalse,null,null]);
Y.push(["isNull",ORYX.I18N.ConditionExpressionEditorField.isNull,null,null]);
Y.push(["isTrue",ORYX.I18N.ConditionExpressionEditorField.isTrue,null,null]);
var s=new Ext.data.SimpleStore({fields:[{name:"value"},{name:"title"},{name:"panel"},{name:"inputs"}],data:Y});
var W=[];
W.push(["isNull",ORYX.I18N.ConditionExpressionEditorField.isNull,null,null]);
var v=new Ext.data.SimpleStore({fields:[{name:"value"},{name:"title"},{name:"panel"},{name:"inputs"}],data:W});
Q.hide();
h.hide();
K.hide();
ah.hide();
ak.hide();
var af=ORYX.EDITOR.getSerializedJSON();
var d=jsonPath(af.evalJSON(),"$.properties.vardefs");
var L=[];
if(d){d.forEach(function(ap){if(ap.length>0){var an=ap.split(",");
for(var ao=0;
ao<an.length;
ao++){var aq=an[ao];
if(aq.indexOf(":")>0){var am=aq.split(":");
var ar=am[0].trim();
var k=am[1].trim();
switch(k){case"String":case"java.lang.String":L.push([ar,k,H]);
break;
case"Integer":case"java.lang.Integer":case"java.math.BigInteger":case"java.lang.Short":case"java.lang.Long":L.push([ar,k,aj]);
break;
case"Float":case"java.math.BigDecimal":case"java.lang.Float":case"java.lang.Double":L.push([ar,k,F]);
break;
case"Boolean":case"java.lang.Boolean":L.push([ar,k,s]);
break;
default:L.push([ar,k,v])
}}}}})
}var al=ORYX.EDITOR._pluginFacade.getSelection();
if(al){var T=al.first();
if(T&&T.parent){var O=T.parent;
if(T._stencil._jsonStencil.id=="http://b3mn.org/stencilset/bpmn2.0#SequenceFlow"){if(T.incoming&&T.incoming.length>0){O=T.incoming[0].parent
}}if(O._stencil._jsonStencil.id=="http://b3mn.org/stencilset/bpmn2.0#MultipleInstanceSubprocess"||O._stencil._jsonStencil.id=="http://b3mn.org/stencilset/bpmn2.0#Subprocess"||O._stencil._jsonStencil.id=="http://b3mn.org/stencilset/bpmn2.0#AdHocSubprocess"){var aa=O.properties["oryx-vardefs"];
if(aa&&aa.length>0){var q=aa.split(",");
for(var ab=0;
ab<q.length;
ab++){var u=q[ab];
if(u.indexOf(":")>0){var b=u.split(":");
var E=b[0].trim();
var a=b[1].trim();
switch(a){case"String":case"java.lang.String":L.push([E,a,H]);
break;
case"Integer":case"java.lang.Integer":case"java.math.BigInteger":case"java.lang.Short":case"java.lang.Long":L.push([E,a,aj]);
break;
case"Float":case"java.math.BigDecimal":case"java.lang.Float":case"java.lang.Double":L.push([E,a,F]);
break;
case"Boolean":case"java.lang.Boolean":L.push([E,a,s]);
break;
default:L.push([E,a,v])
}}}}}}}var B=new Ext.data.SimpleStore({fields:[{name:"value"},{name:"type"},{name:"store"}],data:L});
var l=new Ext.form.ComboBox({editable:false,displayField:"title",valueField:"value",typeAhead:true,mode:"local",triggerAction:"all",selectOnFocus:true,listeners:{select:function(ao,am,an){U();
w=am;
var k=w.get("panel");
if(k!=null){k.show()
}}}});
var ai=new Ext.form.ComboBox({editable:false,store:B,displayField:"value",valueField:"value",typeAhead:true,mode:"local",triggerAction:"all",selectOnFocus:true,listeners:{select:function(an,k,am){l.clearValue();
U();
l.bindStore(k.get("store"))
}}});
var V=new Ext.form.FormPanel({layout:"table",title:ORYX.I18N.ConditionExpressionEditorField.editorTab,layoutConfig:{columns:3},defaults:{border:false},items:[{colspan:3,items:[{style:"font-size:12px;margin:10px;display:block;",anchor:"100%",xtype:"label",html:ORYX.I18N.ConditionExpressionEditorField.editorDescription}]},{style:"font-size:12px;margin:10px;display:block;",anchor:"100%",xtype:"label",html:ORYX.I18N.ConditionExpressionEditorField.processVariable},{colspan:2,items:[ai]},{style:"font-size:12px;margin:10px;display:block;",anchor:"100%",xtype:"label",html:ORYX.I18N.ConditionExpressionEditorField.condition},l,{items:[Q,h,K,ah,ak]}]});
var A=new Ext.Panel({title:ORYX.I18N.ConditionExpressionEditorField.scriptTab,layout:"anchor",defaults:{border:false},items:[p]});
function n(k){var am=ORYX.I18N.ConditionExpressionEditorField.scriptParseError;
am=am.replace("{0}",k);
Ext.MessageBox.show({msg:am,icon:Ext.MessageBox.WARNING,buttons:{ok:ORYX.I18N.PropertyWindow.ok,cancel:ORYX.I18N.PropertyWindow.cancel},fn:function(an){if(an=="ok"){P(true,true)
}else{J(false,false)
}}})
}function ag(k){var am=ORYX.I18N.ConditionExpressionEditorField.scriptGenerationError;
am=am.replace("{0}",k);
Ext.MessageBox.show({msg:am,icon:Ext.MessageBox.WARNING,buttons:{ok:ORYX.I18N.PropertyWindow.ok}})
}var o=function(ar){if(ar.responseText.length>0){var ay=Ext.decode(ar.responseText);
if(ay.errorMessage){if(!ae){n(ay.errorMessage);
return
}else{C=false
}}else{var ap;
var aq;
var ao=[];
ay.conditions.forEach(function(aA){ap=aA.condition;
aA.parameters.forEach(function(aB){if(aq==null){aq=aB
}else{ao.push(aB)
}})
});
var aw=B.find("value",aq);
if(aw==-1){var ax=ORYX.I18N.ConditionExpressionEditorField.nonExistingVariable;
ax=ax.replace("{0}",aq);
n(ax);
return
}else{ai.setValue(aq);
var am=B.getAt(aw);
ai.fireEvent("select",ai,am);
l.setValue(ap);
var an=am.get("store");
aw=an.find("value",ap);
var at=an.getAt(aw);
l.fireEvent("select",l,at);
var k=at.get("panel");
if(k!=null){var av=at.get("inputs");
if(av!=null&&av.length==ao.length){var au;
for(au=0;
au<av.length;
au++){var az=k.getComponent(av[au]).setValue(ao[au])
}}}C=true
}}}ae=false;
if(C){P(true,false)
}else{J(false,false)
}};
var I=function(){J(false,false)
};
function J(ap,ao,aq,am,k,an,ar){if(X){X.toTextArea();
X=null
}if(ao){p.setValue(aq)
}C=ap;
t.setActiveTab(A);
ac.setTitle(ORYX.I18N.ConditionExpressionEditorField.sequenceFlowFullTitle);
R(am,k,an,ar)
}function P(k,am){if(am){m()
}C=k;
t.setActiveTab(V);
ac.setTitle(ORYX.I18N.ConditionExpressionEditorField.sequenceFlowTitle)
}t=new Ext.TabPanel({renderTo:Ext.getBody(),activeTab:0,defaults:{border:false},items:[V,A],listeners:{tabchange:function(an,ao){if(ao.title==ORYX.I18N.ConditionExpressionEditorField.scriptTab){if(C){if(ai.getValue()==""||(ai.getValue()!=""&&l.getValue()=="")){J(false,true,"","text/x-java",true,true,true)
}else{var am=function(ar){C=true;
if(ar.responseText.length>0){var aq=Ext.decode(ar.responseText);
if(aq.errorMessage){ag(aq.errorMessage);
P(true,false)
}else{J(false,true,aq.script,"text/x-java",true,true,true)
}}};
var ap=function(){P(true,false)
};
var k=y(am,ap);
if(k==false){P(true,false)
}}}}else{if(!C){if(X.getValue()==null||X.getValue().trim()==""){P(true,true)
}else{p.setValue(X.getValue());
M({script:X.getValue()})
}}}}}});
function m(){ai.clearValue();
l.clearValue();
U()
}function U(){if(w!=null){var k=w.get("panel");
if(k){var am=w.get("inputs");
if(am!=null){am.forEach(function(an){k.getComponent(an).setValue(null)
})
}k.hide()
}w=null
}}function f(){if(!w){return false
}var k=w.get("panel");
if(k==null){return true
}var an=w.get("inputs");
if(an!=null){var am=[];
an.forEach(function(ao){var ap=k.getComponent(ao).getValue();
if(ap===undefined){return false
}am.push(ap)
});
if(am.length!=an.length){return false
}if(am.length==2){return am[1]>am[0]
}}return true
}function Z(){var ap=ai.getValue();
if(!ap||!f()){return null
}var am=[];
am.push(ap);
var k=w.get("panel");
if(k!=null){var ao=w.get("inputs");
if(ao!=null){ao.forEach(function(aq){am.push(k.getComponent(aq).getValue())
})
}}var an={operator:"AND",conditions:[{condition:l.getValue(),parameters:am}]};
return an
}function j(ao,am,k,an){Ext.Ajax.request({url:ORYX.PATH+"customeditors",method:"POST",params:{expression_editor_command:ao,expression_editor_message:Ext.util.JSON.encode(am)},success:function(ap){k(ap)
}.bind(this),failure:function(){an()
}})
}function M(k){j("parseScript",k,o,I)
}function y(k,am){var an=Z();
if(!an){ag(ORYX.I18N.ConditionExpressionEditorField.paramsError);
return false
}j("generateScript",an,k,am);
return true
}var ad=function(am){if(am.responseText.length>0){var k=Ext.decode(am.responseText);
if(k.errorMessage){ag(k.errorMessage)
}else{c(k.script)
}}};
var S=function(){ag(ORYX.I18N.ConditionExpressionEditorField.saveError)
}
}var N=ORYX.Utils.getDialogSize(430,800);
var ac=new Ext.Window({layout:"fit",autoCreate:true,height:N.height,width:N.width,modal:true,collapsible:false,fixedcenter:true,shadow:true,resizable:true,proxyDrag:true,autoScroll:false,keys:[{key:27,fn:function(){ac.hide()
}.bind(this)}],items:[t],listeners:{hide:function(){this.fireEvent("dialogClosed",this.value);
ac.destroy()
}.bind(this)},buttons:[{text:ORYX.I18N.PropertyWindow.ok,handler:function(){if(G){if(C){y(ad,S)
}else{var k=X.getValue().replace(/\\/g,"\\\\").replace(/\r\n|\r|\n/g,"\\n");
c(k)
}}else{var k=X.getValue().replace(/\\/g,"\\\\").replace(/\r\n|\r|\n/g,"\\n");
c(k)
}}.bind(this)},{text:ORYX.I18N.PropertyWindow.cancel,handler:function(){ac.destroy()
}.bind(this)}]});
function R(am,ao,an,k){this.foldFunc=CodeMirror.newFoldFunction(CodeMirror.braceRangeFinder);
X=CodeMirror.fromTextArea(document.getElementById(p.getId()),{mode:am,lineNumbers:ao,lineWrapping:an,matchBrackets:k,onGutterClick:this.foldFunc,extraKeys:{"Ctrl-Z":function(ap){CodeMirror.hint(ap,CodeMirror.jbpmHint,ac)
}},onCursorActivity:function(){X.setLineClass(r,null,null);
r=X.setLineClass(X.getCursor().line,null,"activeline")
}.bind(this)});
r=X.setLineClass(0,"activeline")
}if(G){if(this.getValue()!=null&&this.getValue()!=""){M({script:this.getValue()})
}else{P(true,false);
ae=false
}}else{ac.setTitle(this.editorTitle)
}ac.show();
t.setHeight(ac.getInnerHeight());
if(!G){R(this.typemode,this.showLineNumbers,this.doLineWrapping,this.doMatchBrackets)
}this.grid.stopEditing()
}});
Ext.form.ConditionExpressionEditorTextField=Ext.extend(Ext.form.ConditionExpressionEditorField,{typemode:"text",showLineNumbers:false,doLineWrapping:false,doMatchBrackets:false,editorTitle:ORYX.I18N.PropertyWindow.text,isForDocumentation:false});
Ext.form.ConditionExpressionEditorDocumentationField=Ext.extend(Ext.form.ConditionExpressionEditorField,{typemode:"text",showLineNumbers:false,doLineWrapping:false,doMatchBrackets:false,editorTitle:ORYX.I18N.PropertyWindow.text,isForDocumentation:true});
Ext.form.ComplexRuleflowGroupElementField=Ext.extend(Ext.form.TriggerField,{editable:true,readOnly:false,onTriggerClick:function(){if(this.disabled){return
}var b=ORYX.EDITOR.getSerializedJSON();
var d=jsonPath(b.evalJSON(),"$.properties.package");
var f=jsonPath(b.evalJSON(),"$.properties.id");
var a=Ext.data.Record.create([{name:"name"},{name:"rules"},{name:"repo"},{name:"project"},{name:"branch"},{name:"fullpath"}]);
var c=new Ext.data.MemoryProxy({root:[]});
var e=new Ext.data.Store({autoDestroy:true,reader:new Ext.data.JsonReader({root:"root"},a),proxy:c,sorters:[{property:"name",direction:"ASC"}]});
e.load();
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_NOTIFICATION_SHOW,ntype:"info",msg:"Loading RuleFlow Groups",title:""});
Ext.Ajax.request({url:ORYX.PATH+"calledelement",method:"POST",success:function(j){try{if(j.responseText.length>0&&j.responseText!="false"){var D=Ext.decode(j.responseText);
for(var J in D){var A=D[J];
var z=new Array();
var s=A.split("||");
var r=s[0];
var m=s[1];
var o="";
var u="";
var h="";
if(m&&m!==undefined){var y=m.split("<<");
if(y&&y!==undefined){for(var B=0;
B<y.length;
B++){var E=y[B].split("^^");
var t=new Array();
t.push(E[0]);
t.push(E[1]);
z.push(t);
var v=y[B];
var l=v.split("^^");
var I=l[1];
var p=I.split("://");
var H=p[1];
var x=H.split("@");
if(h.indexOf(x[0])<0){h+=x[0]+","
}var k=x[1];
if(o.indexOf(k.split("/")[0])<0){o+=k.split("/")[0]+","
}if(u.indexOf(k.split("/")[1])<0){u+=k.split("/")[1]+","
}}}if(o.endsWith(",")){o=o.substr(0,o.length-1)
}if(u.endsWith(",")){u=u.substr(0,u.length-1)
}if(h.endsWith(",")){h=h.substr(0,h.length-1)
}e.add(new a({name:r,rules:z,repo:o,project:u,branch:h,fullpath:I}))
}}e.commitChanges();
var G=ORYX.Utils.getDialogSize(350,860);
var q=(G.width-80)/7;
var w=Ext.id();
var g=new Ext.grid.EditorGridPanel({autoScroll:true,autoHeight:true,store:e,id:w,stripeRows:true,cm:new Ext.grid.ColumnModel([new Ext.grid.RowNumberer(),{id:"rfgname",header:"RuleFlow Group Name",width:q*2,sortable:true,dataIndex:"name",editor:new Ext.form.TextField({allowBlank:true,disabled:true})},{id:"rfrulenames",header:"Rules",width:q*4,sortable:false,renderer:function(P,L,N,O,S,Q){function K(V,X,U,W){new Ext.form.ComboBox({name:"ruleflowscombo",id:W,valueField:"value",displayField:"name",typeAhead:true,mode:"local",triggerAction:"all",selectOnFocus:true,store:new Ext.data.SimpleStore({fields:["name","value"],data:V})}).render(document.getElementById(w),X)
}function R(V,X,U,W){new Ext.Button({text:"view",handler:function(Y,ab){var aa=Ext.getCmp(W).getRawValue();
var Z=Ext.getCmp(W).getValue();
if(aa&&aa.length>0&&Z&&Z.length>0){parent.designeropenintab(aa,Z)
}}}).render(document.getElementById(w),X)
}var M="rulenamescombodiv-"+O;
var T="rncombo-"+O;
K.defer(1,this,[Q.getAt(O).get("rules"),M,N,T]);
R.defer(1,this,[Q.getAt(O).get("rules"),M,N,T]);
return('<div id="'+M+'"></div>')
}},{id:"rfrepository",header:"Repositories",width:q,sortable:true,dataIndex:"repo",editor:new Ext.form.TextField({allowBlank:true,disabled:true})},{id:"rfproject",header:"Projects",width:q,sortable:true,dataIndex:"project",editor:new Ext.form.TextField({allowBlank:true,disabled:true})},{id:"rfbranch",header:"Branches",width:q,sortable:true,dataIndex:"branch",editor:new Ext.form.TextField({allowBlank:true,disabled:true})}])});
g.on("afterrender",function(M){if(this.value.length>0){var K=0;
var N=this.value;
var L=g;
e.data.each(function(){if(this.data.name==N){L.getSelectionModel().select(K,1)
}K++
})
}}.bind(this));
var n=new Ext.Panel({id:"ruleFlowGroupsPanel",title:'<center><p style="font-size:11px"><i>Select RuleFlow Group Name and click on Save</i></p></center>',layout:"fit",items:[g],layoutConfig:{columns:1},defaults:{columnWidth:1}});
var C=new Ext.Window({layout:"fit",autoCreate:true,title:"Editor for RuleFlow Groups",height:G.height,width:G.width,modal:true,collapsible:false,fixedcenter:true,shadow:true,resizable:true,proxyDrag:true,autoScroll:true,items:[n],listeners:{hide:function(){this.fireEvent("dialogClosed",this.value);
C.destroy()
}.bind(this)},buttons:[{text:ORYX.I18N.Save.save,handler:function(){if(g.getSelectionModel().getSelectedCell()!=null){var K=g.getSelectionModel().getSelectedCell()[0];
var L=e.getAt(K).data.name;
g.stopEditing();
g.getView().refresh();
this.setValue(L);
this.dataSource.getAt(this.row).set("value",L);
this.dataSource.commitChanges();
C.hide()
}else{this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_NOTIFICATION_SHOW,ntype:"error",msg:"No data selected.",title:""})
}}.bind(this)},{text:ORYX.I18N.PropertyWindow.cancel,handler:function(){C.destroy()
}.bind(this)}]});
C.show();
g.render();
g.fireEvent("afterrender");
this.grid.stopEditing();
g.focus(false,100)
}else{this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_NOTIFICATION_SHOW,ntype:"error",msg:"Unable to find RuleFlow Groups.",title:""})
}}catch(F){this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_NOTIFICATION_SHOW,ntype:"error",msg:"Error retrieving RuleFlow Groups info  :\n"+F,title:""})
}}.bind(this),failure:function(){this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_NOTIFICATION_SHOW,ntype:"error",msg:"Error retrieving RuleFlow Groups info.",title:""})
},params:{profile:ORYX.PROFILE,uuid:ORYX.UUID,ppackage:d,pid:f,action:"showruleflowgroups"}});
this.grid.stopEditing()
}});
Ext.form.ComplexCalledElementField=Ext.extend(Ext.form.TriggerField,{editable:true,readOnly:false,onTriggerClick:function(){if(this.disabled){return
}var a=Ext.data.Record.create([{name:"name"},{name:"pkgname"},{name:"imgsrc"},{name:"assetname"}]);
var e=new Ext.data.MemoryProxy({root:[]});
var d=new Ext.data.Store({autoDestroy:true,reader:new Ext.data.JsonReader({root:"root"},a),proxy:e,sorters:[{property:"name",direction:"ASC"},{property:"pkgname",direction:"ASC"},{property:"imgsrc",direction:"ASC"},{property:"assetname",direction:"ASC"},]});
d.load();
var b=ORYX.EDITOR.getSerializedJSON();
var c=jsonPath(b.evalJSON(),"$.properties.package");
var f=jsonPath(b.evalJSON(),"$.properties.id");
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_NOTIFICATION_SHOW,ntype:"info",msg:ORYX.I18N.PropertyWindow.loadingProcessInf,title:""});
Ext.Ajax.request({url:ORYX.PATH+"calledelement",method:"POST",success:function(k){try{if(k.responseText.length>0&&k.responseText!="false"){var o=Ext.decode(k.responseText);
for(var q in o){var r=q.split("|");
d.add(new a({name:r[0],pkgname:r[1],assetname:r[2],imgsrc:o[q]}))
}d.commitChanges();
var h=ORYX.Utils.getDialogSize(350,690);
var l=(h.width-30)/4;
var j=Ext.id();
var g=new Ext.grid.EditorGridPanel({autoScroll:true,autoHeight:true,store:d,id:j,stripeRows:true,cm:new Ext.grid.ColumnModel([new Ext.grid.RowNumberer(),{id:"passet",header:ORYX.I18N.PropertyWindow.processAsset,width:l,dataIndex:"assetname",sortable:true,editor:new Ext.form.TextField({allowBlank:true,disabled:true})},{id:"pid",header:ORYX.I18N.PropertyWindow.processId,width:l,dataIndex:"name",sortable:true,editor:new Ext.form.TextField({allowBlank:true,disabled:true})},{id:"pkgn",header:ORYX.I18N.PropertyWindow.packageName,width:l,dataIndex:"pkgname",sortable:true,editor:new Ext.form.TextField({allowBlank:true,disabled:true})},{id:"pim",header:ORYX.I18N.LocalHistory.headertxt.ProcessImage,width:l,dataIndex:"imgsrc",renderer:function(s){if(s&&s.length>0){return'<center><img src="'+ORYX.BASE_FILE_PATH+"images/page_white_picture.png\" onclick=\"new ImageViewer({title: 'Process Image', width: '650', height: '450', autoScroll: true, fixedcenter: true, src: '"+s+"',hideAction: 'close'}).show();\" alt=\"Click to view Process Image\"/></center>"
}else{return ORYX.I18N.LocalHistory.headertxt.ProcessImage.NoAvailable
}}}]),autoHeight:true});
g.on("afterrender",function(u){if(this.value.length>0){var s=0;
var v=this.value;
var t=g;
d.data.each(function(){if(this.data.name==v){t.getSelectionModel().select(s,1)
}s++
})
}}.bind(this));
var p=new Ext.Panel({id:"calledElementsPanel",title:"<center>"+ORYX.I18N.PropertyWindow.selectProcessId+"</center>",layout:"column",items:[g],layoutConfig:{columns:1},defaults:{columnWidth:1}});
var n=new Ext.Window({layout:"anchor",autoCreate:true,title:ORYX.I18N.PropertyWindow.editorForCalledEvents,height:h.height,width:h.width,modal:true,collapsible:false,fixedcenter:true,shadow:true,resizable:true,proxyDrag:true,autoScroll:true,keys:[{key:27,fn:function(){n.hide()
}.bind(this)}],items:[p],listeners:{hide:function(){this.fireEvent("dialogClosed",this.value);
n.destroy()
}.bind(this)},buttons:[{text:ORYX.I18N.Save.save,handler:function(){if(g.getSelectionModel().getSelectedCell()!=null){var s=g.getSelectionModel().getSelectedCell()[0];
var t=d.getAt(s).data.name;
g.stopEditing();
g.getView().refresh();
this.setValue(t);
this.dataSource.getAt(this.row).set("value",t);
this.dataSource.commitChanges();
n.hide()
}else{this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_NOTIFICATION_SHOW,ntype:"error",msg:ORYX.I18N.LocalHistory.LocalHistoryView.msg,title:""})
}}.bind(this)},{text:ORYX.I18N.PropertyWindow.cancel,handler:function(){n.destroy()
}.bind(this)}]});
n.show();
g.render();
g.fireEvent("afterrender");
this.grid.stopEditing();
g.focus(false,100)
}else{this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_NOTIFICATION_SHOW,ntype:"error",msg:ORYX.I18N.PropertyWindow.unableToFindOtherProcess,title:""})
}}catch(m){this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_NOTIFICATION_SHOW,ntype:"error",msg:ORYX.I18N.PropertyWindow.errorResolvingOtherProcessInfo+" :\n"+m,title:""})
}}.bind(this),failure:function(){this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_NOTIFICATION_SHOW,ntype:"error",msg:ORYX.I18N.PropertyWindow.errorResolvingOtherProcessInfo+".",title:""})
},params:{profile:ORYX.PROFILE,uuid:ORYX.UUID,ppackage:c,pid:f}})
}});
Ext.form.ComplexVisualDataAssignmentField=Ext.extend(Ext.form.TriggerField,{editable:false,readOnly:true,onTriggerClick:function(){if(this.disabled){return
}var f=ORYX.EDITOR.getSerializedJSON();
var a=jsonPath(f.evalJSON(),"$.properties.vardefs");
if(!a){a=""
}var c=jsonPath(f.evalJSON(),"$.properties.globals");
if(!c){c=""
}var g="";
var b=jsonPath(f.evalJSON(),"$.childShapes.*");
for(var e=0;
e<b.length;
e++){if(b[e].stencil.id=="DataObject"){g+=b[e].properties.name;
g+=","
}}if(g.endsWith(",")){g=g.substr(0,g.length-1)
}var d=new Ext.Window({layout:"anchor",autoCreate:true,title:ORYX.I18N.PropertyWindow.editorVisualDataAssociations,height:550,width:850,modal:true,collapsible:false,fixedcenter:true,shadow:true,resizable:true,proxyDrag:true,autoScroll:true,keys:[{key:27,fn:function(){d.hide()
}.bind(this)}],items:[{xtype:"component",id:"visualdataassignmentswindow",autoEl:{tag:"iframe",src:ORYX.BASE_FILE_PATH+"customeditors/visualassignmentseditor.jsp?vars="+a+"&globals="+c+"&dobj="+g,width:"100%",height:"100%"}}],listeners:{hide:function(){this.fireEvent("dialogClosed",this.value);
d.destroy()
}.bind(this)},buttons:[{text:ORYX.I18N.PropertyWindow.ok,handler:function(){var h=document.getElementById("visualdataassignmentswindow").contentWindow.getEditorValue();
this.setValue(h);
this.dataSource.getAt(this.row).set("value",h);
this.dataSource.commitChanges();
d.hide()
}.bind(this)},{text:ORYX.I18N.PropertyWindow.cancel,handler:function(){d.destroy()
}.bind(this)}]});
d.show();
this.grid.stopEditing()
}});