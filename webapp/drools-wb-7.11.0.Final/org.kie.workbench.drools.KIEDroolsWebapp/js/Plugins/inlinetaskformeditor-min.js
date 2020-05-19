if(!ORYX.Plugins){ORYX.Plugins={}
}if(!ORYX.Config){ORYX.Config={}
}ORYX.Plugins.InlineTaskFormEditor=Clazz.extend({sourceMode:undefined,taskformeditor:undefined,taskformsourceeditor:undefined,taskformcolorsourceeditor:undefined,hlLine:undefined,construct:function(a){this.facade=a;
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_TASKFORM_EDIT,this.chooseFormEditorLoad.bind(this));
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_TASKFORM_GENERATE,this.chooseFormEditorStore.bind(this));
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_TASKFORM_GENERATE_ALL,this.chooseFormEditorStoreAll.bind(this))
},chooseFormEditorLoad:function(a){this.chooseFormEditor(a,"load")
},chooseFormEditorStore:function(a){this.chooseFormEditor(a,"store")
},chooseFormEditorStoreAll:function(a){this.chooseFormEditor(a,"storeall")
},chooseFormEditor:function(a,b){if(!ORYX.PROCESS_SAVED){Ext.Msg.show({title:ORYX.I18N.inlineTaskFormEditor.processMustBeSavedTitle,msg:ORYX.I18N.inlineTaskFormEditor.processMustBeSavedDesc,buttons:Ext.Msg.OK,icon:Ext.MessageBox.INFO})
}else{ORYX.FORMSTYPE="frm";
if(b=="load"){this.showTaskFormEditor(ORYX.FORMSTYPE,a)
}else{if(b=="store"){this.generateTaskForm(ORYX.FORMSTYPE,a)
}else{if(b=="storeall"){this.generateAllTaskForms(ORYX.FORMSTYPE,a)
}else{this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_NOTIFICATION_SHOW,ntype:"error",msg:ORYX.I18N.inlineTaskFormEditor.errorInitiatingEditor+".",title:""})
}}}}},generateTaskForm:function(c,b){if(b&&b.tn&&b.taskid){var a=b.tn;
if(a&&a.length>0){a=a.replace(/\&/g,"");
a=a.replace(/\s/g,"");
if(/^\w+$/.test(a)){Ext.Ajax.request({url:ORYX.PATH+"taskforms",method:"POST",success:function(d){if(d.responseText.length>0&&d.responseText!="fail"){this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_NOTIFICATION_SHOW,ntype:"success",msg:ORYX.I18N.forms.successGenTask,title:""})
}else{this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_NOTIFICATION_SHOW,ntype:"error",msg:ORYX.I18N.forms.failGenTask,title:""})
}}.createDelegate(this),failure:function(){this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_NOTIFICATION_SHOW,ntype:"error",msg:ORYX.I18N.forms.failGenTask,title:""})
}.createDelegate(this),params:{profile:ORYX.PROFILE,uuid:window.btoa(encodeURI(ORYX.UUID)),json:ORYX.EDITOR.getSerializedJSON(),ppdata:ORYX.PREPROCESSING,taskid:b.taskid,formtype:c,sessionid:ORYX.SESSION_ID}})
}else{ORYX.Config.FACADE.raiseEvent({type:ORYX.CONFIG.EVENT_NOTIFICATION_SHOW,ntype:"error",msg:ORYX.I18N.forms.failInvalidTaskName,title:""})
}}else{ORYX.Config.FACADE.raiseEvent({type:ORYX.CONFIG.EVENT_NOTIFICATION_SHOW,ntype:"error",msg:ORYX.I18N.forms.failNoTaskName,title:""})
}}else{this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_NOTIFICATION_SHOW,ntype:"error",msg:ORYX.I18N.inlineTaskFormEditor.taskNameNotSpecified,title:""})
}},generateAllTaskForms:function(b,a){Ext.Ajax.request({url:ORYX.PATH+"taskforms",method:"POST",success:function(c){if(c.responseText.length>0&&c.responseText!="fail"){this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_NOTIFICATION_SHOW,ntype:"success",msg:ORYX.I18N.forms.successGenProcAndTask,title:""})
}else{this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_NOTIFICATION_SHOW,ntype:"error",msg:ORYX.I18N.forms.failGenProcAndTask,title:""})
}}.createDelegate(this),failure:function(){this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_NOTIFICATION_SHOW,ntype:"error",msg:ORYX.I18N.forms.failGenProcAndTask,title:""})
}.createDelegate(this),params:{profile:ORYX.PROFILE,uuid:window.btoa(encodeURI(ORYX.UUID)),json:ORYX.EDITOR.getSerializedJSON(),ppdata:ORYX.PREPROCESSING,formtype:b,sessionid:ORYX.SESSION_ID}});
ORYX.CONFIG.TASKFORMS_URL=function(d,c){if(d===undefined){d=ORYX.UUID
}if(c===undefined){c=ORYX.PROFILE
}return ORYX.PATH+"taskforms?uuid="+window.btoa(encodeURI(d))+"&profile="+c
}
},showTaskFormEditor:function(b,a){if(a&&a.tn){Ext.Ajax.request({url:ORYX.PATH+"taskformseditor",method:"POST",success:function(c){try{var f=c.responseText.split("|");
parent.designeropenintab(f[0],encodeURI(f[1]))
}catch(d){this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_NOTIFICATION_SHOW,ntype:"error",msg:ORYX.I18N.inlineTaskFormEditor.errorInitiatingEditor+": "+d,title:""})
}}.bind(this),failure:function(){this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_NOTIFICATION_SHOW,ntype:"error",msg:ORYX.I18N.inlineTaskFormEditor.errorInitiatingEditor+".",title:""})
},params:{formtype:b,action:"load",taskname:window.btoa(encodeURI(a.tn)),profile:ORYX.PROFILE,uuid:window.btoa(encodeURI(ORYX.UUID)),json:ORYX.EDITOR.getSerializedJSON(),ppdata:ORYX.PREPROCESSING,taskid:a.taskid,sessionid:ORYX.SESSION_ID}})
}else{this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_NOTIFICATION_SHOW,ntype:"error",msg:ORYX.I18N.inlineTaskFormEditor.taskNameNotSpecified,title:""})
}}});