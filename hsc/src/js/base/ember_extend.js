Ember.Application.reopen({
    currentUser:null,
    syncToken:null,
    serializedSyncToken:null,//反序列化syncToken值，用于把syncToken值提交给服务器
    syncTokenDidChange:function(){
        var syncToken = this.get("syncToken");
        if(syncToken){
            var delayedSyncToken = Ember.copy(syncToken);
            //因为每次服务器接收请求更改数据到更改完成存在一个时间过程，比如慢的多表级联操作存储过程执行可能需要好几秒时间
            //这样会造成数据库中每条记录的ModifiedDate属性值存在延时误差，为了兼顾这种误差
            //在实际抓取changeset时，根据syncToken值提前20秒(一个修改请求应该不会超过20秒)
            //这样虽然会多抓取20秒内的数据造成一定的性能损失，但可以最大程度保证changeset不漏抓
            //把前后台时间误差的bug解决后就不需要这个逻辑了
            // delayedSyncToken.addSeconds(-20);
            this.set("serializedSyncToken",Hsc.DateTransform.prototype.serialize.call(null,delayedSyncToken));
        }
    }.observes("syncToken"),
    generateUUID:function(versionNumber){
        var prefix = this.get("currentUser.phone");
        return "V%@_%@_%@".fmt(versionNumber.toString(),parseInt(prefix).toString(32).toUpperCase(),new Date().getTime().toString(32)).toUpperCase();
    }
});
// DS.Errors.reopen({
//     add:function (attribute, messages){
//         var wasEmpty=this.get("isEmpty");
//         messages=this._findOrCreateMessages(attribute, messages);
//         this.get("content").addObjects(messages);
//         this.notifyPropertyChange(attribute);
//         this.enumerableContentDidChange();
//         if(wasEmpty&&!this.get("isEmpty")){
//             this.trigger("becameInvalid")
//         }
//     },
//     trigger:function(name){
//         var length = arguments.length;
//         var args = new Array(length - 1);

//         for (var i = 1; i < length; i++) {
//           args[i - 1] = arguments[i];
//         }

//         Ember.sendEvent(this, name, args);
//     }
// });
// DS.Model.reopen({
//     adapterDidCommit:function(e){
//             // this.restoreStateForHasManyKeys();
//         this._super(e);
//         // Ember.run.next(this,function(){
//         // });
//         this.restoreStateForHasManyKeys();
//     },
//     restoreStateForHasManyKeys:function(){
//         //解决成功提交model后，如果其中有hasMany记录的话，其hasMany的子记录isDirty状态没有还原成false
//         //把其转成loaded.saved即可，这样可以解决后台返回添加一条记录成功后，那条记录无故消失的问题
//         var hasManyKeys = Em.get(this.constructor,"relationshipNames").hasMany;
//         var model = this;
//         hasManyKeys.forEach(function(key){
//             var canonicalState = model.get(key).get("canonicalState");
//             var currentState = model.get(key).get("currentState");
//             var deleteds = canonicalState.filterBy("dirtyType","deleted");
//             deleteds.forEach(function(child){
//                 child.transitionTo("deleted.saved");
//             });
//             var updateds = model.get(key).filter(function(item){
//                 if(item.get("dirtyType") == "created" || item.get("dirtyType") == "updated"){
//                     return true;   
//                 }
//                 else{
//                     return false;
//                 }
//             });
//             updateds.forEach(function(child){
//                 child.transitionTo("loaded.saved");
//             });
//             if(canonicalState.mapBy("id").join(",") != currentState.mapBy("id").join(",")){
//                 // model.get(key).set("canonicalState",currentState);
//             }
//         });
//     },
//     /**
//      * [rollback model的回滚函数]
//      * 由于ember对于belongsTo关联属性在changedAttributes及rollback上有bug，
//      * 这里通过强行把changedAttributes中所有belongsTo关联属性的更新记录还原到更新前的值，
//      * 注意由于ember的这个bug同样存在于changedAttributes属性的更新（其会忽略掉belongsTo关联属性），
//      * 所以需要手动把belongsTo关联属性的更改添加到changedAttributes集合中。
//      */
//     rollback: function() {
//         //联合fixChangedAttributesBugForKey函数解决belongsTo字段不能回滚的问题
//         var belongsTos = Em.get(this.constructor,"relationshipNames").belongsTo,//array
//             hasManys = Em.get(this.constructor,"relationshipNames").hasMany,
//             oldValue,typeForRelationship;
//         var changedAttributes = this.changedAttributes();
//         belongsTos.forEach(function(belongsTo){
//             if(changedAttributes[belongsTo]){
//                 typeForRelationship = this.constructor.typeForRelationship(belongsTo);
//                 oldValue = changedAttributes[belongsTo][0];
//                 if(oldValue && oldValue.constructor != typeForRelationship){
//                     oldValue = this.store.getById(typeForRelationship,oldValue);
//                 }
//                 this.set(belongsTo, oldValue);
//             }
//         },this);
//         hasManys.forEach(function(hasMany){
//             if(changedAttributes[hasMany]){
//                 // typeForRelationship = this.constructor.typeForRelationship(hasMany);
//                 oldValue = changedAttributes[hasMany][0];
//                 this.get(hasMany).clear();
//                 this.get(hasMany).pushObjects(oldValue);
//                 // if(oldValue && oldValue.constructor != typeForRelationship){
//                 //     oldValue = this.store.getById(typeForRelationship,oldValue);
//                 // }
//                 // this.set(hasMany, oldValue);
//             }
//         },this);
//         //回滚前先统一清除所有错误信息
//         //这里一定要在上述代码执行完成后再执行clear，因为上述this.set可能还会触发errors.add增加新的错误信息
//         //对于删除的记录回滚不清除errors，因为要显示出来，其errors在离开的时候再次执行rollback时再清除errors
//         if(!this.get("isDeleted")){
//             if(this.get("currentState.stateName") == "root.loaded.saved" && this.get("errors.length") > 0){
//                 //当出现currentState.stateName为正常状态，即isValid为true，isDirty为false等，errors.length却大于0这种不正常现象时
//                 //需要清除errors集合，但又不能触发becameValid函数，因为那样会报错
//                 //目前已知会出现那种情况的为执行删除操作后台返回错误信息
//                 this.clearErrorsWithoutBecameValid();
//             }
//             else{
//                 this.get("errors").clear();
//             }
//         }
//         // if(this.get("isDeleted")){
//         //     Ember.run.next(this,function(){
//         //         //这里加next的目的是因为已删除记录执行errors.clear会报错：
//         //         //Attempted to handle event `becameInvalid` on ... while in state root.deleted.inFlight.
//         //         //而且这里把删除状态改成updated.inFlight也没用，只能等回滚完成后再执行相关操作
//         //         this.get("errors").clear();
//         //     });
//         // }
//         // else{
//         //     this.get("errors").clear();
//         // }
//         return this._super();
//     },
//     clearErrorsWithoutBecameValid:function(){
//         //执行this.get("errors").clear函数中除了this.trigger("becameValid")外的语句
//         //因为删除失败的记录在rollback后，如果执行get("errors").clear会报错：
//         //Attempted to handle event `becameValid` while in state root.loaded.saved.
//         var errors = this.get("errors");
//         if(errors.get("isEmpty")){
//             return;
//         }
//         errors.get("content").clear();
//         errors.enumerableContentDidChange();
//     },
//     fixChangedAttributesBugForKey:function(key){
//         //由于ember对于belongsTo关联属性在changedAttributes及rollback上有bug
//         //这里通过强行把belongsTo关联属性的更新记录到更新属性集合_attributes中
//         //其会自动反映到changedAttributes集合中，从而可以正确的执行rollback
//         if(!this.get("isDeleted")){
//             this._attributes[key] = this.get(key);
//             this.send('becomeDirty');
//         }
//     },
//     adapterDidInvalidate: function(errors) {
//         // var recordErrors = this.get('errors');
//         // function addError(name) {
//         //     if (errors[name]) {
//         //         recordErrors.add(name, errors[name]);
//         //     }
//         // }
//         // this.eachAttribute(addError);
//         // this.eachRelationship(addError);
//         //上述是ember默认代码，只支持model属性的错误信息，不支持属性之外的特别错误信息，比如登录失败
//         //如果后台返回登录信息失效，跳转到登录界面
//         if(errors.is_session_lost){
//             errors.server_side_error = "登录信息失效，即将自动跳转到登录界面";
//             delete errors.is_session_lost;
//             var sessionController = this.container.lookup("controller:session");
//             if(!sessionController.get("isSessionLost")){
//                 sessionController.set("isSessionLost",true);
//             }
//         }
//         //解决当后台返回删除失败时会出现报错的问题
//         this.fixDeletedErrorBugForErrorsAdd();
//         //增加下面代码可以把属性之外的特别错误信息也加入到errors中
//         var recordErrors = this.get('errors');
//         Ember.keys(errors).forEach(function (key) {
//             recordErrors.add(Ember.String.underscore(key), errors[key]);
//         });
//         //下面的代码解决从服务器端返回errors后，为捕捉errors,RESTAdapter.ajaxError函数需要返回InvalidError
//         //这会造成其changedAttributes数据丢失并无法正常rollback的问题
//         //只要对比新老数据，把不同于老数据的新属性值重新记录到_attributes属性中即可，其会自动反应到changedAttributes中
//         var oldData = this.get("_data"),
//             newData = this.toJSON();
//         for(var k in oldData){
//             if(oldData[k] != newData[k]){
//                 this._attributes[k] = newData[k];
//             }
//         }
//         //解决提交后，如果model中有belongsTo属性，后台返回错误时，用户点击返回或取消时，无法把新建记录通过rollback来删除的问题
//         var belongsTos = Em.get(this.constructor,"relationshipNames").belongsTo;//array
//         belongsTos.forEach(function(belongsTo){
//             this.fixChangedAttributesBugForKey(belongsTo);
//         },this);
//     },
//     fixDeletedErrorBugForErrorsAdd:function(){
//         if(this.get("isDeleted")){
//             //该函数完全是为了让已删除的记录支持错误信息显示用
//             //方法是先让记录转成非删除状态，等添加完错误信息后再次转回删除状态，以方便后续回滚能再次还原记录
//             //当后台返回删除失败时，执行recordErrors.add语句会报以下错误信息:
//             //Attempted to handle event `becameInvalid` on ... while in state root.deleted.inFlight.
//             //这会造成currentState.stateName一直于root.deleted.inFlight从而isSaving一直为true
//             //这应该是ember的bug，只要把状态从deleted.inFlight改成updated.inFlight即可把isSaving还原为false，从而解决这个bug
//             //会出现这个问题的原因是ember中root.deleted.inFlight这个state中没有becameInvalid这个函数造成报错，程序无法正常执行下去
//             //所以解决办法是把currentState切换到一个带有becameInvalid函数的state即可
//             this.transitionTo("loaded.updated.inFlight");
//             Ember.run.next(this,function(){
//                 //一定要在执行完errors.add后还愿为已删除状态，这样就可以回滚时还原记录。
//                 this.transitionTo("deleted.uncommitted");
//                 //删除失败的记录如果不执行rollback会再现beloangTo属性变成空的现在，只能rollback了
//                 this.rollback();
//             });
//         }
//         //类似isDeleted，当记录中有hasMany属性时，后台返回保存失败的话，会报出同样的错误信息
//         //所以需要找到其被删除的子项，同样把其子项的state切换到loaded.updated.inFlight，这样就不会再报错了。
//         //注意，这里在子项同样调用了fixDeletedErrorBug，所以有递归效果，无论多少层hasMany子项都会得到执行
//         var hasManyKeys = Em.get(this.constructor,"relationshipNames").hasMany;
//         var model = this;
//         hasManyKeys.forEach(function(key){
//             var deletedChildren = model.get(key).get("canonicalState").filterBy("isDeleted",true);
//             deletedChildren.forEach(function(deletedChild){
//                 deletedChild.fixDeletedErrorBugForErrorsAdd();
//             });
//         });
//     },
//     isDeepDirty:false,
//     isDeepValid:true,
//     isUnSavable: function(){
//         var errors = this.get("errors");
//         var hasServerSideError = errors.has("server_side_error");
//         var isSaving = this.get("isSaving"),
//             isDirty = this.get("hasDirtyAttributes"),
//             isValid = this.get("isValid"),
//             isDeepDirty = this.get("isDeepDirty"),
//             isDeepValid = this.get("isDeepValid");
//         if(isSaving){
//             return true;
//         }
//         else{
//             if(hasServerSideError && errors.get("length") == 1){
//                 //当只有服务器错误的时候允许保存
//                 return false;
//             }
//             else{
//                 if(isDirty || isDeepDirty){
//                     if(isValid && isDeepValid){
//                         return false;
//                     }
//                     else{
//                         return true;
//                     }
//                 }
//                 else{
//                     return true;
//                 }
//             }

//         }
//     }.property("errors.length","errors.server_side_error","isValid","isDirty","isDeepValid","isDeepDirty","isSaving"),
//     deleteRecord:function(){
//         //必须在删除前清除errors
//         //否则在后续的save函数中执行this.get("errors").remove会报错:
//         //"Uncaught Error: Attempted to handle event `becameValid` on <Hsc.Role:ember805:1> while in state root.deleted.uncommitted."
//         //原因是执行deleteRecord后state变成了deleted.uncommitted，而这个state中是没有becameValid函数的
//         this.get("errors").clear();
//         this._super();
//     },
//     save:function(isSkipVali){
//         if(isSkipVali){
//             return this._super();
//         }
//         //在执行保存前先触发验证函数，只有验证通过才继续保存
//         this.get("errors").remove('server_side_error');
//         this.validate();
//         if(!this.get("isUnSavable")){
//             return this._super();
//         }
//         else{
//             return Ember.RSVP.reject();
//         }
//     },
//     validate:function(){
//         var model = this;
//         //这里不可以用notifyAllPropertyChange，
//         //因为当后台有返回错误的时候，执行model.notifyPropertyChange函数会造成model内属性值全部重置为默认值
//         //这应该是ember的bug，可以通过手动调用sendEvent来触发model的observes函数
//         //从而挠过调用notifyAllPropertyChange函数造成的问题
//         Ember.get(model.constructor,"fields").forEach(function(kind,field){
//             // console.log("kind:%@,field:%@".fmt(kind,field));
//             Ember.sendEvent(model,field + ":change",[model,field]);
//             if(kind == "hasMany"){
//                 //如果有hasMany字段，则把其每个子记录都执行一次验证
//                 //注意每个子记录中如果有hasMany则会继续找到其下层的hasMany并执行对应的validate，不会漏掉
//                 model.get(field).forEach(function(item){
//                     item.validate();
//                 });
//             }
//         });
//     },
//     notifyAllPropertyChange:function(){
//         var model = this;
//         Ember.get(model.constructor,"fields").forEach(function(kind,field){
//             model.notifyPropertyChange(field);
//         });
//     }
// });



DS.Model.reopen({
    rollback:function(){
        this.rollbackAttributes();
    },
    rollbackAttributes:function(){
        this._super();
        if(this.get("isRelationshipsChanged")){
            this.rollbackRelations();
        }
    },
    rollbackRelations:function(){
        var changedRelationships = this.get("changedRelationships");
        var model = this;
        changedRelationships.forEach(function(relationship){
            model.rollbackRelation(relationship);
        });
    },
    rollbackRelation:function(relationship){
        var kind = relationship.relationshipMeta.kind;
        if(kind === "hasMany"){
            this.set(relationship.key,relationship.manyArray.canonicalState.mapBy("record"));
        }
        else if(kind === "belongsTo"){
            this.set(relationship.key,relationship.canonicalMembers.list.mapBy("record")[0]);
        }
        this.send("propertyWasReset");
    },
    relationshipsDidChange:Ember.observer("isRelationshipsChanged",function(){
        //由于ember对于belongsTo关联属性在changedAttributes及rollback上有bug
        //这里通过判断relationships是变化来正确设置其hasDirtyAttributes值
        if(this.get("isDeleted")){
            return;
        }
        if(this.get("isRelationshipsChanged")){
            this.send('becomeDirty');
        }
        else{
            this.send("propertyWasReset");
        }
    }),
    hasDirtyAttributesDidChange:Ember.observer("hasDirtyAttributes",function(){
        var model = this;
        Ember.run.next(function(){
            //以下两种情况会需要hasDirtyAttributes变化时重新计算isRelationshipsChanged
            //1、当save请求后台完成后hasDirtyAttributes会变成false，这时需要重新计算isRelationshipsChanged值
            //2、当用户修改Attributes造成hasDirtyAttributes属性从true变成false时要重新计算isRelationshipsChanged值
            model.notifyPropertyChange("isRelationshipsChanged");
        });
    }),
    isRelationshipsChanged:Ember.computed(function(){
        if(this.get("isDeleted")){
            return false;
        }
        this.set("changedRelationships",[]);
        var relationships = this.get("_internalModel._relationships");
        // var relationships = this.get("_relationships");
        var relationship,isNoneChanged = true;
        var model = this;
        this.eachRelationship(function(name, descriptor){
            // relationship = relationships[descriptor.key];
            relationship = relationships.get(descriptor.key);
            if(model.isRelationshipChanged(relationship)){
                isNoneChanged = false;
            }
        });
        return !isNoneChanged;
    }),
    changedRelationships:[],
    isRelationshipChanged:function(relationship){
        var kind = relationship.relationshipMeta.kind;
        var isChanged = false;
        if(kind === "hasMany"){
            var curIds = relationship.manyArray.currentState.mapBy("id").sort();
            var canonicalIds = relationship.manyArray.canonicalState.mapBy("id").sort();
            isChanged = curIds.join(",") !== canonicalIds.join(",");
        }
        else if(kind === "belongsTo"){
            var curIds = relationship.members.list.mapBy("id");
            var canonicalIds = relationship.canonicalMembers.list.mapBy("id");
            isChanged = curIds.join(",") !== canonicalIds.join(",");
        }
        var changedRelationships = this.get("changedRelationships");
        if(isChanged){
            changedRelationships.pushObject(relationship);
        }
        else{
            changedRelationships.removeObject(relationship);
        }
        return isChanged;
    },
    isDeepDirty:false,
    isDeepValid:true,
    isUnSavable: Ember.computed("errors.length","errors.server_side_error","isValid","hasDirtyAttributes","isDeepValid","isDeepDirty","isSaving",function(){
        var errors = this.get("errors");
        var hasServerSideError = errors.has("server_side_error");
        var isSaving = this.get("isSaving"),
            hasDirtyAttributes = this.get("hasDirtyAttributes"),
            isValid = this.get("isValid"),
            isDeepDirty = this.get("isDeepDirty"),
            isDeepValid = this.get("isDeepValid");
        if(isSaving){
            return true;
        }
        else{
            if(hasServerSideError && errors.get("length") === 1){
                //当只有服务器错误的时候允许保存
                return false;
            }
            else{
                if(hasDirtyAttributes || isDeepDirty){
                    if(isValid && isDeepValid){
                        return false;
                    }
                    else{
                        return true;
                    }
                }
                else{
                    return true;
                }
            }

        }
    }),    
    isErrorsEmptyDidChanged: Ember.observer("errors.isEmpty",function(){
        Ember.run.next(this,function(){
            //解决有时errors某个属性被移除至errors变成isEmpty时，isValid属性没有变成true的bug
            if(this.get("errors.isEmpty") && !this.get("isValid")){
                this.send("becameValid");
            }
        });
    }),
    save:function(isSkipVali){
        if(isSkipVali){
            return this._super();
        }
        //在执行保存前先触发验证函数，只有验证通过才继续保存
        this.get("errors").remove('server_side_error');
        this.validate();
        if(!this.get("isUnSavable")){
            return this._super();
        }
        else{
            return Ember.RSVP.reject();
        }
    },
    validate:function(){
        var model = this;
        // 这里不可以用notifyAllPropertyChange，
        // 因为当后台有返回错误的时候，执行model.notifyPropertyChange函数会造成model内属性值全部重置为默认值
        // 这应该是ember的bug，可以通过手动调用sendEvent来触发model的observes函数
        // 从而挠过调用notifyAllPropertyChange函数造成的问题
        Ember.get(model.constructor,"fields").forEach(function(kind,field){
            // console.log("kind:%@,field:%@".fmt(kind,field));
            Ember.sendEvent(model,field + ":change",[model,field]);
            if(kind === "hasMany"){
                //如果有hasMany字段，则把其每个子记录都执行一次验证
                //注意每个子记录中如果有hasMany则会继续找到其下层的hasMany并执行对应的validate，不会漏掉
                model.get(field).forEach(function(item){
                    item.validate();
                });
            }
        });
    },
    notifyAllPropertyChange:function(){
        var model = this;
        Ember.get(this.constructor,"fields").forEach(function(kind,field){
            model.notifyPropertyChange(field);
        });
    }
});


Ember.View.reopen({
  init: function() {
    this._super();
    var self = this;

    // bind attributes beginning with 'data-'
    Em.keys(this).forEach(function(key) {
      if (key.substr(0, 5) === 'data-') {
        self.get('attributeBindings').pushObject(key);
      }
    });
  }
});

Ember.TextField.reopen({
    placeHolderFunction : function(){
        this.$().placeholder();
    }.on('didInsertElement'),
    placeholderDidChange:function(){
        //如果浏览器不支持placeholder功能，则重新绑定一次placeholder插件
        if(!$.fn.placeholder.support){
            Ember.run.next(this,function(){
                if(!this.get("value")){
                    this.set("value","");
                    this.$().val(this.get("placeholder"));
                }
                this.$().placeholder();
            });
        }
    }.observes("placeholder")
});

Ember.Handlebars.helper('car_status', function(value,options) {
    var text = "";
    var stepName = options.hash.stepName;
    switch(value){
        case "unused":
            text = "闲置";
            break;
        case "turning":
            text = "流转中";
            if(stepName){
                text = stepName;
            }
            break;
        case "retired":
            text = "退役";
            break;
    }
    return '%@'.fmt(text);
});

Ember.Handlebars.helper('color', function(value,options) {
    var text = options.hash.text;
    var tip = options.hash.tip;
    if(!text){
        switch(value){
            case "gray":
                text = "灰色";
                break;
            case "green":
                text = "绿色";
                break;
            case "yellow":
                text = "黄色";
                break;
            case "red":
                text = "红色";
                break;
        }
    }
    var tipText = tip ? "[%@]".fmt(tip) : "";
    return new Handlebars.SafeString('<span class="timeout-color timeout-color-%@">%@%@</span>'.fmt(value,text,tipText));
});

Ember.Handlebars.helper('form_power_text', function(value,options) {
    var text = "",
        color = "";
    switch(value){
        case "editable":
            text = "可编辑";
            color = "text-warning";
            break;
        case "readonly":
            text = "只读";
            color = "text-success";
            break;
        case "none":
            color = "text-muted";
            text = "无";
            break;
        default:
            text = "只读";
            color = "text-success";
            break;
    }
    return new Handlebars.SafeString('<span class="%@">%@</span>'.fmt(color,text));
});

Ember.Handlebars.helper('bedstand_status', function(value,options) {
    var text = "";
    var stepName = options.hash.stepName;
    switch(value){
        case "unused":
            text = "闲置";
            break;
        case "turning":
            text = "流转中";
            if(stepName){
                text = stepName;
            }
            break;
        case "retired":
            text = "退役";
            break;
    }
    return '%@'.fmt(text);
});

Ember.Handlebars.helper('bedstand_running_state_text', function(value,options) {
    var text = "",
        color = "";
    var isTable = options.hash.isTable;
    switch(value){
        case "waiting":
            text = "<span class=\"glyphicon glyphicon-time mr4\"></span>待样";
            color = "text-warning";
            break;
        case "running":
            text = "<span class=\"glyphicon glyphicon-stats mr4\"></span>运行";
            color = "text-success";
            break;
        case "repairing":
            color = "text-muted";
            text = "<span class=\"glyphicon glyphicon-lock mr4\"></span>检修";
            break;
        case "rating":
            color = "text-muted";
            text = "<span class=\"glyphicon glyphicon-lock mr4\"></span>标定";
            break;
        case "upkeeping":
            color = "text-muted";
            text = "<span class=\"glyphicon glyphicon-lock mr4\"></span>保养";
            break;
        default:
            text = "<span class=\"glyphicon glyphicon-time mr4\"></span>待样";
            color = "text-warning";
            break;
    }
    if(isTable){
        color = "";
    }
    return new Handlebars.SafeString('<span class="%@">%@</span>'.fmt(color,text));
});

Ember.Handlebars.helper('next_step_default_text', function(value,options) {
    var text = "",
        color = "";
    switch(value){
        case "start":
            text = "开始";
            color = "text-success";
            break;
        case "end":
            text = "结束";
            color = "text-danger";
            break;
        case "none":
            color = "text-muted";
            text = "无";
            break;
    }
    return new Handlebars.SafeString('<span class="%@">%@</span>'.fmt(color,text));
});

Ember.Handlebars.helper('history_line', function(value,options) {
    var isFinished = options.hash.isFinished;
    return new Handlebars.SafeString('<div class="history-line timeout-color-%@ %@"></div>'.fmt(value,isFinished ? "" : "t5"));
});

Ember.Handlebars.helper('step_type', function(value,isTextNeeded) {
    var glyphicon = "",
        typeText = "";
    switch(value){
        case "start":
            glyphicon = "glyphicon-play green";
            typeText = "开始";
            break;
        case "end":
            glyphicon = "glyphicon-stop red";
            typeText = "结束";
            break;
        case "process":
            glyphicon = "glyphicon-random";
            typeText = "中间";
            break;
        case "abort":
            //中止流转后会流转到的步骤
            glyphicon = "glyphicon-remove red";
            typeText = "强制结束";
            break;
        case "upgrade":
            //版本升级的工作单会流转到的步骤
            glyphicon = "glyphicon-import gray";
            typeText = "版本升级";
            break;
        case "recove":
            //版本升级后的新工作单将以该步骤作为第一个步骤重新开始流转
            glyphicon = "glyphicon-export green";
            typeText = "恢复流转";
            break;
    }
    if(isTextNeeded){
        typeText = '<span>%@</span>'.fmt(typeText);
    }
    else{
        typeText = "";
    }
    return new Handlebars.SafeString('%@ <span class="glyphicon %@"></span>'.fmt(typeText,glyphicon));
});
Ember.Handlebars.helper('step_handler_org_type', function(value) {
    var typeText = "";
    switch(value){
        case "fix_organization":
            typeText = "指定组织";
            break;
        case "relate_testtype":
            typeText = "试验类型关联组织";
            break;
        case "relate_bedstand":
            typeText = "台架关联组织";
            break;
    }
    return '%@'.fmt(typeText);
});
Ember.Handlebars.helper('step_handler_type', function(value) {
    var typeText = "";
    switch(value){
        case "fix_user":
            typeText = "指定人员";
            break;
        case "reserve_user":
            typeText = "处理时预定人员";
            break;
        case "empty":
            typeText = "空";
            break;
    }
    return '%@'.fmt(typeText);
});
Ember.Handlebars.helper('step_next_step_type', function(value) {
    var typeText = "";
    switch(value){
        case "all_step":
            typeText = "自由流转";
            break;
        case "last_step":
            typeText = "返回上一步";
            break;
    }
    return '%@'.fmt(typeText);
});
Ember.Handlebars.helper('boolean', function(value,options) {
    var yes = options.hash.yes;
    var no = options.hash.no;
    yes = yes ? yes : "是";
    no = no ? no : "否";
    var text = value ? yes : no;
    return '%@'.fmt(text);
});
Ember.Handlebars.helper('timefmt', function(value) {
    // console.log("timefmt:%@".fmt(value));
    if(value instanceof Date){
        return value.format("yyyy-MM-dd hh:mm:ss");
    }
    else{
        var date = HOJS.lib.parseDate(value);
        return date ? date.format("yyyy-MM-dd hh:mm:ss") : "";
    }
});
Ember.Handlebars.helper('datefmt', function(value) {
    // console.log("timefmt:%@".fmt(value));
    if(value instanceof Date){
        return value.format("yyyy-MM-dd");
    }
    else{
        var date = HOJS.lib.parseDate(value);
        return date ? date.format("yyyy-MM-dd") : "";
    }
});
Ember.Handlebars.helper('chip_state', function(value,color) {
    var text = value == "on" ? "已激活" : "已停止";
    return new Handlebars.SafeString('<span class="%@">%@</span>'.fmt(color,text));
});
Ember.Handlebars.helper('chip_state_icon', function(value,color) {
    var icon = value == "on" ? "ok" : "remove";
    return new Handlebars.SafeString('<span class="glyphicon glyphicon-%@ %@" aria-hidden="true"></span>'.fmt(icon,color));
});

Ember.Handlebars.helper('organizations_name', function(value) {
    var className = "organizations_name";
    var names = value ? value.map(function(n){
        return n.get("name");
    }).join(",") : "";
    if(!names){
        className = "text-danger";
        names = "未选择组织";
    }
    return new Handlebars.SafeString('<span title = "%@" class="%@">%@</span>'.fmt(names,className,names));
});
Ember.Handlebars.helper('organizations_checked_icon', function(value,organizations) {
    var icon = "";
    if(organizations.contains(value)){
        icon = "glyphicon glyphicon-ok";
    }
    return new Handlebars.SafeString('<span class="%@ %@"></span>'.fmt("organizations_checked_icon pull-right text-success",icon));
});


// DS.JSONSerializer.reopen({
//     serializeBelongsTo: function(record, json, relationship) {
//         var key = relationship.key,
//             belongsTo = Ember.get(record, key);
//         key = this.keyForRelationship ? this.keyForRelationship(key, "belongsTo") : key;
        
//         if (relationship.options.embedded === 'always') {
//             json[key] = belongsTo.serialize();
//         }
//         else {
//             return this._super(record, json, relationship);
//         }
//     },
//     serializeHasMany: function(record, json, relationship) {
//         var key = relationship.key,
//             hasMany = Ember.get(record, key),
//             relationshipType = DS.RelationshipChange.determineRelationshipType(record.constructor, relationship);
        
//         if (relationship.options.embedded === 'always') {
//             if (hasMany && relationshipType === 'manyToNone' || relationshipType === 'manyToMany' ||
//                 relationshipType === 'manyToOne') {
                
//                 json[key] = [];
//                 hasMany.forEach(function(item, index){
//                     json[key].push(item.serialize());
//                 });
//             }
        
//         }
//         else {
//             return this._super(record, json, relationship);
//         }
//     }
// });


// DS.JSONSerializer.reopen({
//   serializeHasMany: function(record, json, relationship) {
//     var key = relationship.key;
//     if (key === 'steps') {
//       return;
//     } else {
//       this._super.apply(this, arguments);
//     }
//   }
// });



