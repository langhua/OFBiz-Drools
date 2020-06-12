if(!ORYX.Plugins){ORYX.Plugins=new Object()
}if(typeof(Storage)!=="undefined"){Storage.prototype.setObject=function(a,b){this.setItem(a,Ext.encode(b))
};
Storage.prototype.getObject=function(a){var b=this.getItem(a);
return Ext.decode(b)
}
}ORYX.Plugins.Edit=Clazz.extend({construct:function(a){this.facade=a;
this.clipboard=new ORYX.Plugins.Edit.ClipBoard();
if(!(ORYX.READONLY==true||ORYX.VIEWLOCKED==true)){this.facade.offer({name:ORYX.I18N.Edit.cut,description:ORYX.I18N.Edit.cutDesc,icon:ORYX.BASE_FILE_PATH+"images/cut.png",keyCodes:[{metaKeys:[ORYX.CONFIG.META_KEY_META_CTRL],keyCode:88,keyAction:ORYX.CONFIG.KEY_ACTION_DOWN}],functionality:this.callEdit.bind(this,this.editCut),group:ORYX.I18N.Edit.group,index:1,minShape:1});
this.facade.offer({name:ORYX.I18N.Edit.copy,description:ORYX.I18N.Edit.copyDesc,icon:ORYX.BASE_FILE_PATH+"images/page_copy.png",keyCodes:[{metaKeys:[ORYX.CONFIG.META_KEY_META_CTRL],keyCode:67,keyAction:ORYX.CONFIG.KEY_ACTION_DOWN}],functionality:this.callEdit.bind(this,this.editCopy,[true,false]),group:ORYX.I18N.Edit.group,index:2,minShape:1});
this.facade.offer({name:ORYX.I18N.Edit.pasteClipboard,description:ORYX.I18N.Edit.pasteClipboardDesc,icon:ORYX.BASE_FILE_PATH+"images/page_paste.png",dropDownGroupIcon:ORYX.BASE_FILE_PATH+"images/page_paste.png",keyCodes:[{metaKeys:[ORYX.CONFIG.META_KEY_META_CTRL],keyCode:86,keyAction:ORYX.CONFIG.KEY_ACTION_DOWN}],functionality:this.callEdit.bind(this,this.editPaste),group:ORYX.I18N.Edit.group,index:3,minShape:0,maxShape:0});
this.facade.offer({name:ORYX.I18N.Edit.pasteLocalStorage,description:ORYX.I18N.Edit.pasteLocalStorageDesc,icon:ORYX.BASE_FILE_PATH+"images/page_paste.png",dropDownGroupIcon:ORYX.BASE_FILE_PATH+"images/page_paste.png",functionality:this.callEdit.bind(this,this.editPasteLocalStore),group:ORYX.I18N.Edit.group,index:3,minShape:0,maxShape:0,isEnabled:function(){return typeof(Storage)!=="undefined"&&localStorage.getObject("designerclipboard")!=null
}.bind(this)});
this.facade.offer({name:ORYX.I18N.Edit.del,description:ORYX.I18N.Edit.delDesc,icon:ORYX.BASE_FILE_PATH+"images/cross.png",keyCodes:[{metaKeys:[ORYX.CONFIG.META_KEY_ALT],keyCode:ORYX.CONFIG.KEY_CODE_D,keyAction:ORYX.CONFIG.KEY_ACTION_DOWN}],functionality:this.callEdit.bind(this,this.editDelete),group:ORYX.I18N.Edit.group,index:4,minShape:1})
}this.facade.registerOnEvent(ORYX.CONFIG.EVENT_FACADE_SELECTION_DELETION_REQUEST,this.editDelete.bind(this))
},callEdit:function(b,a){window.setTimeout(function(){b.apply(this,(a instanceof Array?a:[]))
}.bind(this),1)
},handleMouseDown:function(a){if(this._controlPressed){this._controlPressed=false;
this.editCopy();
this.editPaste();
a.forceExecution=true;
this.facade.raiseEvent(a,this.clipboard.shapesAsJson)
}},getAllShapesToConsider:function(b,d){var a=[];
var c=[];
b.each(function(f){isChildShapeOfAnother=b.any(function(i){return i.hasChildShape(f)
});
if(isChildShapeOfAnother){return
}a.push(f);
if(f instanceof ORYX.Core.Node){var h=f.getOutgoingNodes();
h=h.findAll(function(i){return !b.include(i)
});
a=a.concat(h)
}c=c.concat(f.getChildShapes(true));
if(d&&!(f instanceof ORYX.Core.Edge)){var g=f.getIncomingShapes().concat(f.getOutgoingShapes());
g.each(function(i){if(i instanceof ORYX.Core.Edge&&i.properties["oryx-conditionexpression"]&&i.properties["oryx-conditionexpression"]!=""){return
}if(f instanceof ORYX.Core.Node&&i instanceof ORYX.Core.Node){return
}a.push(i)
}.bind(this))
}}.bind(this));
var e=this.facade.getCanvas().getChildEdges().select(function(f){if(a.include(f)){return false
}if(f.getAllDockedShapes().size()===0){return false
}return f.getAllDockedShapes().all(function(g){return g instanceof ORYX.Core.Edge||c.include(g)
})
});
a=a.concat(e);
return a
},editCut:function(){this.editCopy(false,true);
this.editDelete(true);
return false
},editCopy:function(c,a){var b=this.facade.getSelection();
if(b.length==0){return
}this.clipboard.refresh(b,this.getAllShapesToConsider(b),this.facade.getCanvas().getStencil().stencilSet().namespace(),a);
this.editPaste(true);
if(c){this.facade.updateSelection()
}},editPasteLocalStore:function(){this.clipboard.shapesAsJson=[];
this.editPaste()
},editPaste:function(c){if(typeof(Storage)!=="undefined"){if(this.clipboard.shapesAsJson.length<=0&&localStorage.getObject("designerclipboard")!=null){this.facade.importJSON(localStorage.getObject("designerclipboard"));
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_PASTE_NOTEMPTY_END});
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_PASTE_END});
return
}}var b={childShapes:this.clipboard.shapesAsJson,stencilset:{namespace:this.clipboard.SSnamespace}};
Ext.apply(b,ORYX.Core.AbstractShape.JSONHelper);
var a=b.getChildShapes(true).pluck("resourceId");
var d={};
b.eachChild(function(e,f){e.outgoing=e.outgoing.select(function(g){return a.include(g.resourceId)
});
e.outgoing.each(function(g){if(!d[g.resourceId]){d[g.resourceId]=[]
}d[g.resourceId].push(e)
});
return e
}.bind(this),true,true);
b.eachChild(function(e,f){if(e.target&&!(a.include(e.target.resourceId))){e.target=undefined;
e.targetRemoved=true
}if(e.dockers&&e.dockers.length>=1&&e.dockers[0].getDocker&&((e.dockers[0].getDocker().getDockedShape()&&!a.include(e.dockers[0].getDocker().getDockedShape().resourceId))||!e.getShape().dockers[0].getDockedShape()&&!d[e.resourceId])){e.sourceRemoved=true
}return e
}.bind(this),true,true);
b.eachChild(function(e,f){if(this.clipboard.useOffset){e.bounds={lowerRight:{x:e.bounds.lowerRight.x+ORYX.CONFIG.COPY_MOVE_OFFSET,y:e.bounds.lowerRight.y+ORYX.CONFIG.COPY_MOVE_OFFSET},upperLeft:{x:e.bounds.upperLeft.x+ORYX.CONFIG.COPY_MOVE_OFFSET,y:e.bounds.upperLeft.y+ORYX.CONFIG.COPY_MOVE_OFFSET}}
}if(e.dockers){e.dockers=e.dockers.map(function(h,g){if((e.targetRemoved===true&&g==e.dockers.length-1&&h.getDocker)||(e.sourceRemoved===true&&g==0&&h.getDocker)){h=h.getDocker().bounds.center()
}if((g==0&&h.getDocker instanceof Function&&e.sourceRemoved!==true&&(h.getDocker().getDockedShape()||((d[e.resourceId]||[]).length>0&&(!(e.getShape() instanceof ORYX.Core.Node)||d[e.resourceId][0].getShape() instanceof ORYX.Core.Node))))||(g==e.dockers.length-1&&h.getDocker instanceof Function&&e.targetRemoved!==true&&(h.getDocker().getDockedShape()||e.target))){return{x:h.x,y:h.y,getDocker:h.getDocker}
}else{if(this.clipboard.useOffset){return{x:h.x+ORYX.CONFIG.COPY_MOVE_OFFSET,y:h.y+ORYX.CONFIG.COPY_MOVE_OFFSET,getDocker:h.getDocker}
}else{return{x:h.x,y:h.y,getDocker:h.getDocker}
}}}.bind(this))
}else{if(e.getShape() instanceof ORYX.Core.Node&&e.dockers&&e.dockers.length>0&&(!e.dockers.first().getDocker||e.sourceRemoved===true||!(e.dockers.first().getDocker().getDockedShape()||d[e.resourceId]))){e.dockers=e.dockers.map(function(h,g){if((e.sourceRemoved===true&&g==0&&h.getDocker)){h=h.getDocker().bounds.center()
}if(this.clipboard.useOffset){return{x:h.x+ORYX.CONFIG.COPY_MOVE_OFFSET,y:h.y+ORYX.CONFIG.COPY_MOVE_OFFSET,getDocker:h.getDocker}
}else{return{x:h.x,y:h.y,getDocker:h.getDocker}
}}.bind(this))
}}return e
}.bind(this),false,true);
this.clipboard.useOffset=true;
if(c&&c==true){if(typeof(Storage)!=="undefined"){localStorage.removeItem("designerclipboard");
localStorage.setObject("designerclipboard",b)
}}else{this.facade.importJSON(b);
if(this.clipboard.shapesAsJson.length>0){this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_PASTE_NOTEMPTY_END})
}this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_PASTE_END})
}},editDelete:function(){var a=this.facade.getSelection();
var b=new ORYX.Plugins.Edit.ClipBoard();
b.refresh(a,this.getAllShapesToConsider(a,true));
var c=new ORYX.Plugins.Edit.DeleteCommand(b,this.facade);
this.facade.executeCommands([c])
}});
ORYX.Plugins.Edit.ClipBoard=Clazz.extend({construct:function(){this.shapesAsJson=[];
this.selection=[];
this.SSnamespace="";
this.useOffset=true
},isOccupied:function(){if(this.shapesAsJson.length>0){return true
}else{if(typeof(Storage)!=="undefined"){if(localStorage.getObject("designerclipboard")!=null){return true
}}return false
}},refresh:function(d,b,c,a){this.selection=d;
this.SSnamespace=c;
this.outgoings={};
this.parents={};
this.targets={};
this.useOffset=a!==true;
this.shapesAsJson=b.map(function(e){var f=e.toJSON();
f.parent={resourceId:e.getParentShape().resourceId};
f.parentIndex=e.getParentShape().getChildShapes().indexOf(e);
return f
})
}});
ORYX.Plugins.Edit.DeleteCommand=ORYX.Core.Command.extend({construct:function(b,a){this.clipboard=b;
this.shapesAsJson=b.shapesAsJson;
this.facade=a;
this.dockers=this.shapesAsJson.map(function(g){var e=g.getShape();
var f=e.getIncomingShapes().map(function(h){return h.getDockers().last()
});
var d=e.getOutgoingShapes().map(function(h){return h.getDockers().first()
});
var c=e.getDockers().concat(f,d).compact().map(function(h){return{object:h,referencePoint:h.referencePoint,dockedShape:h.getDockedShape()}
});
return c
}).flatten()
},execute:function(){this.shapesAsJson.each(function(a){var b=this.facade.deleteShape(a.getShape())
}.bind(this));
this.facade.setSelection([]);
this.facade.getCanvas().update();
this.facade.updateSelection()
},rollback:function(){this.shapesAsJson.each(function(c){var a=c.getShape();
var b=this.facade.getCanvas().getChildShapeByResourceId(c.parent.resourceId)||this.facade.getCanvas();
b.add(a,a.parentIndex)
}.bind(this));
this.dockers.each(function(a){a.object.setDockedShape(a.dockedShape);
a.object.setReferencePoint(a.referencePoint)
}.bind(this));
this.facade.setSelection(this.selectedShapes);
this.facade.getCanvas().update();
this.facade.updateSelection()
}});