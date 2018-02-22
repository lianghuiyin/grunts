Hsc.WorkshopsRoute = Ember.Route.extend({
    renderTemplate: function() {
        this.render({ outlet: 'workshops' });
    },
    beforeModel: function() {
        
    },
    model: function () {
        return this.store.peekAll('workshop');
    },
    afterModel: function(model, transition) {
    },
    activate:function(){
        //这里要run.next的原因是要等view加载到页面后才能执行navigablePush，即要等view.didInsertElement执行完毕
        Ember.run.next(this,function(){
            var controller = this.get("controller");
            controller.send("navigablePush");
        });
        return this;
    },
    deactivate:function(){
        var controller = this.get("controller");
        controller.send("navigablePop");
        return this;
    },
    actions:{
        goBack:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('start.setting');
        },
        goDetail:function(workshop){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('workshop',workshop);
        },
        goNew:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('workshops.new');
        }
    }
});
Hsc.WorkshopRoute = Ember.Route.extend({
    controllerName: 'workshop',
    beforeModel: function() {
    },
    model:function(params){
        var curId = params.workshop_id;
        var workshop = this.store.peekRecord('workshop', curId);
        if(!workshop && curId.indexOf("fixture") == 0){
            //如果没有找到记录，并且是fixture开头的新记录则创建一个新记录来匹配
            return this.controllerFor("workshops").createRecord();
        }
        else{
            //注意，这里如果没有找到记录，并且不是fixture开头的新记录，将返回null
            return workshop;
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
            var controller = this.controllerFor("workshop");
            controller.send("navigablePush");
        });
        return this;
    },
    deactivate:function(){
        var controller = this.controllerFor("workshop");
        controller.send("navigablePop");
        return this;
    },
    actions:{
        goBack:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('workshops');
        }
    }
});
Hsc.WorkshopIndexRoute = Ember.Route.extend({
    controllerName: 'workshop',
    renderTemplate: function(controller) {
        controller.set("isEditing",false);
        controller.set("isNew",false);
        controller.set("pannelTitle",Hsc.get("detailModelTag").fmt(controller.get("modelName")));
        this.render('workshop',{ outlet: 'workshop',controller: controller });
    },
    afterModel: function(model, transition) {
    },
    deactivate:function(){
        //在这个路由中可能出现删除失败的情况，所以也需要回滚
        var controller = this.controllerFor("workshop");
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
            this.transitionTo('workshop.edit');
        }
    }
});
Hsc.WorkshopEditRoute = Ember.Route.extend({
    controllerName: 'workshop',
    renderTemplate: function(controller) {
        controller.set("isEditing",true);
        controller.set("isNew",false);
        controller.set("pannelTitle",Hsc.get("editModelTag").fmt(controller.get("modelName")));
        this.render('workshop', {outlet: 'workshop',controller: controller});
    },
    afterModel: function(model, transition) {
    },
    deactivate:function(){
        var controller = this.controllerFor("workshop");
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
            this.transitionTo('workshop.index');
        },
    }
});

Hsc.Workshop = DS.Model.extend({
    number: DS.attr('string'),
    organization: DS.belongsTo('organization'),
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
    numberDidChange:function(){
        var number = this.get("number");
        if(this.get("hasDirtyAttributes")){
            if(Ember.isEmpty(number)){
                this.get('errors').add('number', '不能为空');
            }
            else if(number.length > 20){
                this.get('errors').add('number', '长度不能超过20字符');
            }
            else{
                var curId = this.get("id");
                var isRepeated = this.store.peekAll('workshop').filter(function (workshop) {
                    return workshop.get("id") != curId && workshop.get("number") == number;
                }).length > 0;
                if(isRepeated){
                    this.get('errors').add('number', '不能重复');
                }

            }
        }
    }.observes("number"),
    organizationDidChange:function(){
        var organization = this.get("organization");
        if(this.get("hasDirtyAttributes")){
            if(Ember.isEmpty(organization)){
                this.get('errors').add('organization', '不能为空');
            }
            else{
                this.get('errors').remove('organization');
            }
        }
    }.observes("organization"),
    descriptionDidChange:function(){
        var description = this.get("description");
        if(this.get("hasDirtyAttributes")){
            if(!Ember.isEmpty(description) && description.length > 200){
                this.get('errors').add('description', '长度不能超过200字符');
            }
        }
    }.observes("description")
});

Hsc.WorkshopsView = Ember.View.extend({
    classNames:['start-setting-workshops','navigable-pane','collapse']
});
Hsc.WorkshopView = Ember.View.extend({
    classNames:['start-setting-workshops-workshop','navigable-pane','collapse']
});

Hsc.WorkshopsController = Ember.ArrayController.extend({
    needs:["application"],
    pannelTitle:"车间组管理",
    helpInfo:"请选择一个车间组。",
    // sortProperties: ['created_date','id'],
    // sortAscending: true,
    createdDateSorting: ['created_date:asc','id'],
    createdDateSortingDesc: ['created_date:desc','id'],
    modifiedDateSortingDesc: ['modified_date:desc'],
    arrangedResult: Ember.computed.sort('model', 'createdDateSorting'),
    createRecord:function(){
        var workshop = this.store.createRecord('workshop', {
            number: 'New Group'
        });
        return workshop;
    },
    actions:{
        navigablePush:function(){
            $(".start-setting.navigable-pane").navigablePush({
                targetTo:".start-setting-workshops.navigable-pane",
                animation:Hsc.transitionAnimation
            });
            Hsc.transitionAnimation = "none";
        },
        navigablePop:function(){
            $(".start-setting-workshops.navigable-pane").navigablePop({
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

Hsc.WorkshopController = Ember.ObjectController.extend({
    needs:["application"],
    isEditing:false,
    isNew:false,
    modelName:"车间组",
    pannelTitle:"车间组详情",
    currentStateNameBinding:Ember.Binding.oneWay("model.currentState.stateName"),
    afterRecordIsDeleted:function(){
        //当记录被删除时，返回上一个界面，这里的删除包括当前用户删除及从服务器中push过来的删除
        var currentStateName = this.get("model.currentState.stateName");
        if(currentStateName == "root.deleted.saved"){
            var currentRouteName = this.get("controllers.application.currentRouteName");
            if(currentRouteName == "workshop.index" 
                || currentRouteName == "workshop.edit.index"){
                this.send("goBack");
            }
        }
    }.observes("currentStateName"),
    isNeedToShowFix:function(){
        return !(this.get("isNew") || this.get("isEditing"));
    }.property("isNew","isEditing"),
    helpInfo:"在工作单中指定该车间组后将自动关联到该车间组的关联组织，并且将自动发送工作单到该车间组关联组织的工作台。",
    organizations:function(){
        return this.store.peekAll("organization");
    }.property(),
    selectedOrganization:function(k,v){
        var model = this.get('model');
        if (v === undefined) {
            return model.get("organization");
        } else {
            model.set('organization', v);
            model.notifyPropertyChange("isRelationshipsChanged");
            return v;
        }
    }.property("model.organization"),
    // selectedOrganizationBinding:"organization",
    actions:{
        navigablePush:function(){
            var controller = this;
            $(".start-setting-workshops.navigable-pane").navigablePush({
                targetTo:".start-setting-workshops-workshop.navigable-pane",
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
            $(".start-setting-workshops-workshop.navigable-pane").navigablePop({
                targetTo:".start-setting-workshops.navigable-pane",
                animation:Hsc.transitionAnimation
            });
            Hsc.transitionAnimation = "none";
        },
        edit: function () {
            this.send("goEdit");
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
