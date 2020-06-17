Ext.ns("Extensive.grid");
Extensive.grid.WorkitemInstaller=Ext.extend(Ext.grid.RowSelectionModel,{width:30,sortable:false,dataIndex:0,menuDisabled:true,fixed:true,id:"workiteminstaller",dtype:"",setDType:function(a){if(a&&a.length>0){this.dtype=a
}},initEvents:function(){Extensive.grid.WorkitemInstaller.superclass.initEvents.call(this);
this.grid.on("cellclick",function(b,f,c,d){if(c==b.getColumnModel().getIndexById("workiteminstaller")){var a=b.getStore().getAt(f);
Ext.MessageBox.confirm("Install",ORYX.I18N.view.installSelectedWorkitem,function(e){if(e=="yes"){ORYX.EDITOR._pluginFacade.raiseEvent({type:ORYX.CONFIG.EVENT_INSTALL_WORKITEM,dtype:this.dtype,rcd:a,mn:a.get("name"),cat:a.get("category")})
}}.bind(this))
}}.bind(this))
},renderer:function(b,c,a,d){return'<div class="extensive-install" style="width: 15px; height: 16px;" title="Install"></div>'
}});