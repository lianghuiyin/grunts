Hsc.VehicletypesRoute = Ember.Route.extend({
    renderTemplate: function() {
        this.render({ outlet: 'vehicletypes' });
    },
    beforeModel: function() {
        
    },
    model: function () {
        return this.store.peekAll('vehicletype');
    }, 
    afterModel: function(model, transition) {
    },
    activate:function(){
        //这里要run.next的原因是要等view加载到页面后才能执行navigablePush，即要等view.didInsertElement执行完毕
        Ember.run.next(this,function(){
            var controller = this.controllerFor("vehicletypes");
            controller.send("navigablePush");
        });
        return this;
    },
    deactivate:function(){
        var controller = this.controllerFor("vehicletypes");
        controller.send("navigablePop");
        return this;
    },
    actions:{
        goBack:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('start.setting');
        },
        goVehicletype:function(vehicletype){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('vehicletype',vehicletype);
        },
        goNew:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('vehicletypes.new');
        }
    }
});
Hsc.VehicletypesNewRoute = Ember.Route.extend({
    controllerName: 'vehicletype',
    renderTemplate: function(controller) {
        controller.set("isEditing",true);
        controller.set("isNew",true);
        controller.set("pannelTitle",Hsc.get("newModelTag").fmt(controller.get("modelName")));
        this.render('vehicletype', {outlet: 'vehicletype',controller: controller});
    },
    beforeModel: function() {
    },
    model:function(){
        return this.controllerFor("vehicletypes").createRecord();
    },
    afterModel: function(model, transition) {
    },
    activate:function(){
        //这里要run.next的原因是要等view加载到页面后才能执行navigablePush，即要等view.didInsertElement执行完毕
        Ember.run.next(this,function(){
            var controller = this.controllerFor("vehicletype");
            controller.send("navigablePush");
        });
        return this;
    },
    deactivate:function(){
        var controller = this.controllerFor("vehicletype");
        var model = controller.get("model");
        model && model.rollbackAttributes();
        controller.send("navigablePop");
        return this;
    },
    actions:{
        goBack:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('vehicletypes');
        }
    }
});
Hsc.VehicletypeRoute = Ember.Route.extend({
    controllerName: 'vehicletype',
    beforeModel: function() {
    },
    model:function(params){
        var curId = params.vehicletype_id;
        var vehicletype = this.store.peekRecord('vehicletype', curId);
        if(!vehicletype && curId.indexOf("fixture") == 0){
            //如果没有找到记录，并且是fixture开头的新记录则创建一个新记录来匹配
            return this.controllerFor("vehicletypes").createRecord();
        }
        else{
            //注意，这里如果没有找到记录，并且不是fixture开头的新记录，将返回null
            return vehicletype;
        }
    },
    afterModel: function(model, transition) {
        if(!model){
            transition.send("goBack");
        }
    },
    activate:function(){
        //这里要run.next的原因是要等view加载到页面后才能执行navigablePush，即要等view.didInsertElement执行完毕
        Ember.run.next(this,function(){
            var controller = this.controllerFor("vehicletype");
            controller.send("navigablePush");
        });
        return this;
    },
    deactivate:function(){
        var controller = this.controllerFor("vehicletype");
        controller.send("navigablePop");
        return this;
    },
    actions:{
        goBack:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('vehicletypes');
        }
    }
});
Hsc.VehicletypeIndexRoute = Ember.Route.extend({
    controllerName: 'vehicletype',
    renderTemplate: function(controller) {
        controller.set("isEditing",false);
        controller.set("isNew",false);
        controller.set("pannelTitle",Hsc.get("detailModelTag").fmt(controller.get("modelName")));
        this.render('vehicletype',{ outlet: 'vehicletype',controller: controller });
    },
    afterModel: function(model, transition) {
    },
    deactivate:function(){
        //在这个路由中可能出现删除失败的情况，所以也需要回滚
        var controller = this.controllerFor("vehicletype");
        var model = controller.get("model");
        // model && model.rollbackAttributes();
        //删除数据失败需要还原，这里增加hasDirtyAttributes的判断，是因为删除成功的话hasDirtyAttributes为false，这时如果执行rollbackAttributes会造成model显示为没有删除成功
        if(model && model.get("hasDirtyAttributes")){
            model.rollbackAttributes();
        }
        return this;
    },
    actions:{
        goEdit:function(){
            this.transitionTo('vehicletype.edit');
        }
    }
});
Hsc.VehicletypeEditRoute = Ember.Route.extend({
    controllerName: 'vehicletype',
    renderTemplate: function(controller) {
        controller.set("isEditing",true);
        controller.set("isNew",false);
        controller.set("pannelTitle",Hsc.get("editModelTag").fmt(controller.get("modelName")));
        this.render('vehicletype', {outlet: 'vehicletype',controller: controller});
    },
    afterModel: function(model, transition) {
    },
    deactivate:function(){
        var controller = this.controllerFor("vehicletype");
        var model = controller.get("model");
        // model && model.rollbackAttributes();
        //这里要增加删除的判断，是因为如果该记录被其他用户删除然后push过来的话，rollbackAttributes会把删除的记录撤销
        if(model && !model.get("isDeleted")){
            model.rollbackAttributes();
        }
        return this;
    },
    actions:{
        goIndex:function(){
            this.transitionTo('vehicletype.index');
        },
    }
});


Hsc.Vehicletype = DS.Model.extend({
    name: DS.attr('string'),
    is_enabled: DS.attr('boolean', {defaultValue: true}),
    description: DS.attr('string',{defaultValue: ""}),
    creater: DS.attr('string'),
    created_date: DS.attr('date'),
    modifier: DS.attr('string'),
    modified_date: DS.attr('date'),
    createrObject:function(){
        return this.store.peekRecord("user",this.get("creater"));
    }.property("creater"),
    modifierObject:function(){
        return this.store.peekRecord("user",this.get("creater"));
    }.property("creater"),
    nameDidChange:function(){
        var name = this.get("name");
        if(this.get("hasDirtyAttributes")){
            if(Ember.isEmpty(name)){
                this.get('errors').add('name', '不能为空');
            }
            else if(name.length > 20){
                this.get('errors').add('name', '长度不能超过20字符');
            }
            else{
                var curId = this.get("id");
                var isRepeated = this.store.peekAll('vehicletype').filter(function (vehicletype) {
                    return vehicletype.get("id") != curId && vehicletype.get("name") == name;
                }).length > 0;
                if(isRepeated){
                    this.get('errors').add('name', '不能重复');
                }

            }
        }
    }.observes("name"),
    descriptionDidChange:function(){
        var description = this.get("description");
        if(this.get("hasDirtyAttributes")){
            if(!Ember.isEmpty(description) && description.length > 200){
                this.get('errors').add('description', '长度不能超过200字符');
            }
        }
    }.observes("description")
});

Hsc.VehicletypesView = Ember.View.extend({
    classNames:['start-setting-vehicletypes','navigable-pane','collapse']
});
Hsc.VehicletypeView = Ember.View.extend({
    classNames:['start-setting-vehicletypes-vehicletype','navigable-pane','collapse']
});

Hsc.VehicletypesController = Ember.ArrayController.extend({
    needs:["application"],
    // sortProperties: ['created_date','id'],
    // sortAscending: true,
    createdDateSorting: ['created_date:asc','id'],
    createdDateSortingDesc: ['created_date:desc','id'],
    modifiedDateSortingDesc: ['modified_date:desc'],
    arrangedResult: Ember.computed.sort('model', 'createdDateSorting'),
    createRecord:function(){
        var vehicletype = this.store.createRecord('vehicletype', {
            name: '新车型',
            description:'',
            creater: Hsc.get("currentUser.id"),
            created_date: new Date(),
            modifier: Hsc.get("currentUser.id"),
            modified_date: new Date()
        });
        return vehicletype;
    },
    actions:{
        navigablePush:function(){
            $(".start-setting.navigable-pane").navigablePush({
                targetTo:".start-setting-vehicletypes.navigable-pane",
                animation:Hsc.transitionAnimation
            });
            Hsc.transitionAnimation = "none";
        },
        navigablePop:function(){
            $(".start-setting-vehicletypes.navigable-pane").navigablePop({
                targetTo:".start-setting.navigable-pane",
                animation:Hsc.transitionAnimation
            });
            Hsc.transitionAnimation = "none";
        },
        newRecord:function(){
            this.send("goNew");
        }
    }
});

Hsc.VehicletypeController = Ember.ObjectController.extend({
    needs:["application"],
    isEditing:false,
    isNew:false,
    modelName:"车型",
    pannelTitle:"车型详情",
    currentStateNameBinding:Ember.Binding.oneWay("model.currentState.stateName"),
    afterRecordIsDeleted:function(){
        //当记录被删除时，返回上一个界面，这里的删除包括当前用户删除及从服务器中push过来的删除
        var currentStateName = this.get("model.currentState.stateName");
        if(currentStateName == "root.deleted.saved"){
            var currentRouteName = this.get("controllers.application.currentRouteName");
            if(currentRouteName == "vehicletype.index" 
                || currentRouteName == "vehicletype.edit.index"){
                this.send("goBack");
            }
        }
    }.observes("currentStateName"),
    isNeedToShowFix:function(){
        return !(this.get("isNew") || this.get("isEditing"));
    }.property("isNew","isEditing"),
    helpInfo:"为车辆定义不同的车型。",
    actions:{
        navigablePush:function(){
            var controller = this;
            $(".start-setting-vehicletypes.navigable-pane").navigablePush({
                targetTo:".start-setting-vehicletypes-vehicletype.navigable-pane",
                animation:Hsc.transitionAnimation,
                callBack:function(){
                    if(!controller.get("model")){
                        controller.send("goBack");
                    }
                }
            });
            Hsc.transitionAnimation = "none";
        },
        navigablePop:function(){
            $(".start-setting-vehicletypes-vehicletype.navigable-pane").navigablePop({
                targetTo:".start-setting-vehicletypes.navigable-pane",
                animation:Hsc.transitionAnimation
            });
            Hsc.transitionAnimation = "none";
        },
        edit: function () {
            this.send("goEdit");
        },
        setIsEnabled:function(value){
            this.get('model').set("is_enabled",value);
        },
        save:function(){
            var isNew = this.get("isNew");
            this.get('model').save().then(function(answer){
                if(isNew){
                    this.send("goBack");
                }
                else{
                    this.send("goIndex");
                }
            }.switchScope(this), function(reason){
            }.switchScope(this));
        },
        cancel:function(){
            if(this.get("isNew")){
                this.send("goBack");
            }
            else{
                this.send("goIndex");
            }
        },
        deleteRecord:function(){
            this.get("model").deleteRecord();
            this.get("model").save().then(function(answer){
            }.switchScope(this), function(reason){
            }.switchScope(this));
        }
    }
});
