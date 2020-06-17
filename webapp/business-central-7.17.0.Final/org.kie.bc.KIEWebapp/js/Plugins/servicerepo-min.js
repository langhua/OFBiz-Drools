if(!ORYX.Plugins){ORYX.Plugins={}
}if(!ORYX.Config){ORYX.Config={}
}ORYX.Plugins.ServiceRepoIntegration=Clazz.extend({repoDialog:undefined,repoContent:undefined,construct:function(a){this.facade=a;
if(!(ORYX.READONLY==true||ORYX.VIEWLOCKED==true)){this.facade.offer({name:ORYX.I18N.View.connectServiceRepo,functionality:this.jbpmServiceRepoConnect.bind(this),group:"servicerepogroup",icon:ORYX.BASE_FILE_PATH+"images/repository_rep.gif",description:ORYX.I18N.View.connectServiceRepoDesc,index:4,minShape:0,maxShape:0,isEnabled:function(){return !(ORYX.READONLY==true||ORYX.VIEWLOCKED==true)
}.bind(this)})
}this.facade.registerOnEvent(ORYX.CONFIG.EVENT_INSTALL_WORKITEM,this.installworkitem.bind(this))
},jbpmServiceRepoConnect:function(){this._showInitialRepoScreen()
},installworkitem:function(c){ORYX.EDITOR._pluginFacade.raiseEvent({type:ORYX.CONFIG.EVENT_NOTIFICATION_SHOW,ntype:"info",msg:ORYX.I18N.View.installingRepoItem,title:""});
var a=c.mn;
var b=c.cat;
Ext.Ajax.request({url:ORYX.PATH+"jbpmservicerepo",method:"POST",success:function(d){try{if(d.responseText=="false"){ORYX.EDITOR._pluginFacade.raiseEvent({type:ORYX.CONFIG.EVENT_NOTIFICATION_SHOW,ntype:"error",msg:ORYX.I18N.View.failInstallation,title:""})
}else{if(d.responseText=="alreadyinstalled"){ORYX.EDITOR._pluginFacade.raiseEvent({type:ORYX.CONFIG.EVENT_NOTIFICATION_SHOW,ntype:"info",msg:ORYX.I18N.View.alreadyInstalled,title:""})
}else{ORYX.EDITOR._pluginFacade.raiseEvent({type:ORYX.CONFIG.EVENT_NOTIFICATION_SHOW,ntype:"success",msg:ORYX.I18N.View.successInstall,title:""})
}}}catch(f){ORYX.EDITOR._pluginFacade.raiseEvent({type:ORYX.CONFIG.EVENT_NOTIFICATION_SHOW,ntype:"error",msg:ORYX.I18N.View.failAssetsInstallation+": "+f,title:""})
}}.createDelegate(this),failure:function(){ORYX.EDITOR._pluginFacade.raiseEvent({type:ORYX.CONFIG.EVENT_NOTIFICATION_SHOW,ntype:"error",msg:ORYX.I18N.View.failAssetsInstallation+".",title:""})
}.createDelegate(this),params:{action:"install",profile:ORYX.PROFILE,uuid:window.btoa(encodeURI(ORYX.UUID)),asset:a,category:b,repourl:this.selectedrepourl}})
},_showInitialRepoScreen:function(){this.repoContent=new Ext.Panel({layout:"table",html:"<br/><br/><br/><br/><center>"+ORYX.I18N.View.noServiceSpecified+"</center>"});
var b=ORYX.Utils.getDialogSize(440,600);
var c=new Ext.Button({text:ORYX.I18N.View.connect,handler:function(){var d="";
var e=this._readCookie("designerservicerepos");
var f=Ext.getCmp("serviceurlfield").getRawValue().replace(/</g,"&lt;").replace(/>/g,"&gt;");
if(e!=null){if(e.indexOf(f)==-1){d=e+","+f
}else{d=e
}}else{d=f
}this._createCookie("designerservicerepos",d,365);
this._updateRepoDialog(f,b.width);
this.selectedrepourl=f
}.bind(this)});
var a=b.width/2;
this.repoDialog=new Ext.Window({autoCreate:true,autoScroll:true,layout:"fit",plain:true,bodyStyle:"padding:5px;",title:ORYX.I18N.View.connectServiceRepoDataTitle,height:b.height,width:b.width,modal:true,fixedcenter:true,shadow:true,proxyDrag:true,resizable:true,items:[this.repoContent],tbar:[this._getRepoCombo(a),c],buttons:[{text:ORYX.I18N.jPDLSupport.close,handler:function(){this.repoDialog.hide();
this.repoDialog.destroy(true);
delete this.repoDialog
}.bind(this)}]});
this.repoDialog.on("hide",function(){if(this.repoDialog){this.repoDialog.destroy(true);
delete this.repoDialog
}});
this.repoDialog.show()
},_getRepoCombo:function(c){var b=new Array();
var h=new Ext.data.SimpleStore({fields:["url","value"],data:[[]]});
var d=this._readCookie("designerservicerepos");
if(ORYX.SERVICE_REPO!==undefined&&ORYX.SERVICE_REPO.length>0){var e=new Array();
e.push(ORYX.SERVICE_REPO);
e.push(ORYX.SERVICE_REPO);
b.push(e);
h.loadData(b);
h.commitChanges()
}if(d!=null){if(d.startsWith(",")){d=d.substr(1,d.length)
}if(d.endsWith(",")){d=d.substr(0,d.length-1)
}var m=d.split(",");
for(var j=0;
j<m.length;
j++){var f=m[j];
if(f.length>=0&&f!=ORYX.SERVICE_REPO){var k=new Array();
k.push(f);
k.push(f);
b.push(k)
}}h.loadData(b);
h.commitChanges()
}else{var a=new Array();
a.push("http://people.redhat.com/tsurdilo/repository");
a.push("http://people.redhat.com/tsurdilo/repository");
b.push(a);
var l=new Array();
l.push("http://people.redhat.com/kverlaen/repository");
l.push("http://people.redhat.com/kverlaen/repository");
b.push(l);
h.loadData(b);
h.commitChanges()
}var g=new Ext.form.ComboBox({id:"serviceurlfield",name:"repourl",forceSelection:false,editable:true,allowBlank:false,displayField:"url",valueField:"value",mode:"local",queryMode:"local",typeAhead:true,value:"",triggerAction:"all",fieldLabel:"Location",width:c,store:h});
return g
},_updateRepoDialog:function(a,b){this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_NOTIFICATION_SHOW,ntype:"info",msg:ORYX.I18N.View.connectServiceRepoConnecting,title:""});
Ext.Ajax.request({url:ORYX.PATH+"jbpmservicerepo",method:"POST",success:function(d){try{if((d.responseText=="false")||(d.responseText.startsWith("false||"))){if(this.repoDialog){this.repoDialog.remove(this.repoContent,true)
}this.repoContent=new Ext.Panel({layout:"table",html:"<br/><br/><br/><br/><center>"+ORYX.I18N.View.noServiceSpecified+".</center>"});
this.repoDialog.add(this.repoContent);
this.repoDialog.doLayout();
if(d.responseText.startsWith("false||")){var c=d.responseText.split("||");
ORYX.EDITOR._pluginFacade.raiseEvent({type:ORYX.CONFIG.EVENT_NOTIFICATION_SHOW,ntype:"error",msg:ORYX.I18N.View.failConnectService+" - "+c[1],title:""})
}else{ORYX.EDITOR._pluginFacade.raiseEvent({type:ORYX.CONFIG.EVENT_NOTIFICATION_SHOW,ntype:"error",msg:ORYX.I18N.View.failConnectService,title:""})
}}else{this._showJbpmServiceInfo(d.responseText,a,b)
}}catch(f){if(this.repoDialog){this.repoDialog.remove(this.repoContent,true)
}this.repoContent=new Ext.Panel({layout:"table",html:"<br/><br/><br/><br/><center>"+ORYX.I18N.View.noServiceSpecified+"</center>"});
this.repoDialog.add(this.repoContent);
this.repoDialog.doLayout();
ORYX.EDITOR._pluginFacade.raiseEvent({type:ORYX.CONFIG.EVENT_NOTIFICATION_SHOW,ntype:"error",msg:ORYX.I18N.View.failConnectService+":"+f,title:""})
}}.createDelegate(this),failure:function(){if(this.repoDialog){this.repoDialog.remove(this.repoContent,true)
}this.repoContent=new Ext.Panel({layout:"table",html:"<br/><br/><br/><br/><center>"+ORYX.I18N.View.noServiceSpecified+"</center>"});
this.repoDialog.add(this.repoContent);
this.repoDialog.doLayout();
ORYX.EDITOR._pluginFacade.raiseEvent({type:ORYX.CONFIG.EVENT_NOTIFICATION_SHOW,ntype:"error",msg:ORYX.I18N.View.failConnectService+".",title:""})
},params:{action:"display",profile:ORYX.PROFILE,uuid:window.btoa(encodeURI(ORYX.UUID)),repourl:a}})
},_showJbpmServiceInfo:function(g,i,c){var k=g.evalJSON();
var e=[];
var d=0;
for(var h in k){e[d]=k[h];
d++
}this.mystore=new Ext.data.SimpleStore({fields:[{name:"name"},{name:"displayName"},{name:"icon"},{name:"category"},{name:"explanation"},{name:"documentation"},{name:"inputparams"},{name:"results"},{name:"defaulthandler"}],data:e});
var a=c/19;
var b=Ext.id();
var f=new Extensive.grid.WorkitemInstaller();
this.mygrid=new Ext.grid.EditorGridPanel({autoScroll:true,autoHeight:true,store:this.mystore,id:b,stripeRows:true,selModel:f,cm:new Ext.grid.ColumnModel([f,{id:"icon",header:ORYX.I18N.View.headerIcon,width:a,sortable:true,dataIndex:"icon",renderer:this._renderIcon.bind(this)},{id:"displayName",header:ORYX.I18N.View.headerName,width:a*2,sortable:true,dataIndex:"displayName",editor:new Ext.form.TextField({allowBlank:true,disabled:true})},{id:"category",header:ORYX.I18N.View.headerCategory,width:a*2,sortable:true,dataIndex:"category",editor:new Ext.form.TextField({allowBlank:true,disabled:true})},{id:"defaulthandler",header:ORYX.I18N.View.headerHandler,width:a*2,sortable:true,dataIndex:"defaulthandler",editor:new Ext.form.TextField({allowBlank:true,disabled:true})},{id:"explanation",header:ORYX.I18N.View.headerExplanation,width:a*2,sortable:true,dataIndex:"explanation",editor:new Ext.form.TextField({allowBlank:true,disabled:true})},{id:"inputparams",header:ORYX.I18N.View.headerInput,width:a*4,sortable:true,dataIndex:"inputparams",editor:new Ext.form.TextField({allowBlank:true,disabled:true})},{id:"results",header:ORYX.I18N.View.headerResults,width:a*4,sortable:true,dataIndex:"results",editor:new Ext.form.TextField({allowBlank:true,disabled:true})},{id:"documentation",header:ORYX.I18N.View.headerDocumentation,width:a*2,sortable:true,dataIndex:"documentation",renderer:this._renderDocs}])});
if(this.repoDialog){this.repoDialog.remove(this.repoContent,true)
}this.repoContent=new Ext.TabPanel({activeTab:0,border:false,width:"100%",height:"100%",tabPosition:"top",layoutOnTabChange:true,deferredRender:false,items:[{title:ORYX.I18N.View.serviceNodes,autoScroll:true,items:[this.mygrid],layout:"fit",margins:"10 10 10 10"}]});
this.repoDialog.add(this.repoContent);
this.repoDialog.doLayout()
},_renderIcon:function(a){if(this.selectedrepourl.startsWith("file:")){return'<img src="data:image/png;base64,'+a+'"/>'
}else{return'<img src="'+a+'"/>'
}},_renderDocs:function(a){return'<a href="'+a+'" target="_blank">link</a>'
},_createCookie:function(c,d,e){if(e){var b=new Date();
b.setTime(b.getTime()+(e*24*60*60*1000));
var a="; expires="+b.toGMTString()
}else{var a=""
}document.cookie=c+"="+d+a+"; path=/"
},_readCookie:function(b){var e=b+"=";
var a=document.cookie.split(";");
for(var d=0;
d<a.length;
d++){var f=a[d];
while(f.charAt(0)==" "){f=f.substring(1,f.length)
}if(f.indexOf(e)==0){return f.substring(e.length,f.length)
}}return null
}});