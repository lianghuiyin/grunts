Hsc.OrganizationsRoute = Ember.Route.extend({
    renderTemplate: function() {
        this.render({ outlet: 'organizations' });
    },
    beforeModel: function() {
        
    },
    model: function () {
        return this.store.peekAll('organization');
    },
    afterModel: function(model, transition) {
    },
    activate:function(){
        //这里要run.next的原因是要等view加载到页面后才能执行navigablePush，即要等view.didInsertElement执行完毕
        Ember.run.next(this,function(){
            var controller = this.controllerFor("organizations");
            controller.send("navigablePush");
        });
        return this;
    },
    deactivate:function(){
        var controller = this.controllerFor("organizations");
        controller.send("navigablePop");
        return this;
    },
    actions:{
        goBack:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('start.setting');
        },
        goOrganization:function(organization){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('organization',organization);
        },
        goNew:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('organizations.new');
        }
    }
});
Hsc.OrganizationsNewRoute = Ember.Route.extend({
    controllerName: 'organization',
    renderTemplate: function(controller) {
        controller.set("isEditing",true);
        controller.set("isNew",true);
        controller.set("pannelTitle",Hsc.get("newModelTag").fmt(controller.get("modelName")));
        this.render('organization', {outlet: 'organization',controller: controller});
    },
    beforeModel: function() {
    },
    model:function(){
        return this.controllerFor("organizations").createRecord();
    },
    afterModel: function(model, transition) {
    },
    activate:function(){
        //这里要run.next的原因是要等view加载到页面后才能执行navigablePush，即要等view.didInsertElement执行完毕
        Ember.run.next(this,function(){
            var controller = this.controllerFor("organization");
            controller.send("navigablePush");
        });
        return this;
    },
    deactivate:function(){
        var controller = this.controllerFor("organization");
        var model = controller.get("model");
        model && model.rollbackAttributes();
        controller.send("navigablePop");
        return this;
    },
    actions:{
        goBack:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('organizations');
        }
    }
});
Hsc.OrganizationRoute = Ember.Route.extend({
    controllerName: 'organization',
    beforeModel: function() {
    },
    model:function(params,transition){
        var curId = params.organization_id;
        var organization = this.store.peekRecord('organization', curId);
        if(!organization && curId.indexOf("fixture") == 0){
            //如果没有找到记录，并且是fixture开头的新记录则创建一个新记录来匹配
            return this.controllerFor("organizations").createRecord();
        }
        else{
            //注意，这里如果没有找到记录，并且不是fixture开头的新记录，将返回null
            return organization;
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
            var controller = this.controllerFor("organization");
            controller.send("navigablePush");
        });
        return this;
    },
    deactivate:function(){
        var controller = this.controllerFor("organization");
        controller.send("navigablePop");
        return this;
    },
    actions:{
        goBack:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('organizations');
        }
    }
});
Hsc.OrganizationIndexRoute = Ember.Route.extend({
    controllerName: 'organization',
    renderTemplate: function(controller) {
        controller.set("isEditing",false);
        controller.set("isNew",false);
        controller.set("pannelTitle",Hsc.get("detailModelTag").fmt(controller.get("modelName")));
        this.render('organization',{ outlet: 'organization',controller: controller });
    },
    afterModel: function(model, transition) {
    },
    activate:function(){
        return this;
    },
    deactivate:function(){
        //在这个路由中可能出现删除失败的情况，所以也需要回滚
        var controller = this.controllerFor("organization");
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
            this.transitionTo('organization.edit');
        }
    }
});
Hsc.OrganizationEditRoute = Ember.Route.extend({
    controllerName: 'organization',
    renderTemplate: function(controller) {
        controller.set("isEditing",true);
        controller.set("isNew",false);
        controller.set("pannelTitle",Hsc.get("editModelTag").fmt(controller.get("modelName")));
        this.render('organization', {outlet: 'organization',controller: controller});
    },
    afterModel: function(model, transition) {
    },
    deactivate:function(){
        var controller = this.controllerFor("organization");
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
            this.transitionTo('organization.index');
        }
    }
});


Hsc.Organization = DS.Model.extend({
    name: DS.attr('string'),
    is_car_owners: DS.attr('boolean', {defaultValue: false}),
    is_bedstand_owners: DS.attr('boolean', {defaultValue: false}),
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
    searchKeys:function(){
        if(!this.get("id")){
            return [];
        }
        return [this.get("name").toLowerCase()];
    }.property("name"),
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
                var isRepeated = this.store.peekAll('organization').filter(function (organization) {
                    return organization.get("id") != curId && organization.get("name") == name;
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

Hsc.OrganizationsView = Ember.View.extend({
    classNames:['start-setting-organizations','navigable-pane','collapse']
});

Hsc.OrganizationView = Ember.View.extend({
    classNames:['start-setting-organizations-organization','navigable-pane','collapse']
});

Hsc.OrganizationsController = Ember.ArrayController.extend({
    needs:["application"],
    // sortProperties: ['created_date','id'],
    // sortAscending: true,
    createdDateSorting: ['created_date:asc','id'],
    createdDateSortingDesc: ['created_date:desc','id'],
    modifiedDateSortingDesc: ['modified_date:desc'],
    arrangedResult: Ember.computed.sort('filteredResult', 'createdDateSorting'),
    searchKey:"",
    filteredResult:function(){
        var searchKey = this.get("searchKey").toLowerCase();
        searchKey = searchKey.replace(/\\/g,"");
        var arrangedContent = this.get("model.arrangedContent");
        if(!arrangedContent){
            return [];
        }
        if(searchKey){
            return arrangedContent.mapBy("record").filter(function(item){
                return item.get("searchKeys").find(function(key){
                    return key.search(searchKey) >= 0;
                });
            });
        }
        else{
            return arrangedContent.mapBy("record");
        }
    }.property("model.@each.searchKeys","searchKey"),
    createRecord:function(){
        var organization = this.store.createRecord('organization', {
            name: '新组织',
            description:'',
            creater: Hsc.get("currentUser.id"),
            created_date: new Date(),
            modifier: Hsc.get("currentUser.id"),
            modified_date: new Date()
        });
        return organization;
    },
    actions:{
        navigablePush:function(){
            $(".start-setting.navigable-pane").navigablePush({
                targetTo:".start-setting-organizations.navigable-pane",
                animation:Hsc.transitionAnimation
            });
            Hsc.transitionAnimation = "none";
        },
        navigablePop:function(){
            $(".start-setting-organizations.navigable-pane").navigablePop({
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

Hsc.OrganizationController = Ember.ObjectController.extend({
    needs:["application"],
    isEditing:false,
    isNew:false,
    modelName:"组织",
    pannelTitle:"组织详情",
    currentStateNameBinding:Ember.Binding.oneWay("model.currentState.stateName"),
    afterRecordIsDeleted:function(){
        //当记录被删除时，返回上一个界面，这里的删除包括当前用户删除及从服务器中push过来的删除
        var currentStateName = this.get("model.currentState.stateName");
        if(currentStateName == "root.deleted.saved"){
            var currentRouteName = this.get("controllers.application.currentRouteName");
            if(currentRouteName == "organization.index" 
                || currentRouteName == "organization.edit.index"){
                this.send("goBack");
            }
        }
    }.observes("currentStateName"),
    isNeedToShowFix:function(){
        return !(this.get("isNew") || this.get("isEditing"));
    }.property("isNew","isEditing"),
    helpInfo:"只有车辆负责组的组织内用户才能创建和退役车辆。",
    actions:{
        navigablePush:function(){
            var controller = this;
            $(".start-setting-organizations.navigable-pane").navigablePush({
                targetTo:".start-setting-organizations-organization.navigable-pane",
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
            $(".start-setting-organizations-organization.navigable-pane").navigablePop({
                targetTo:".start-setting-organizations.navigable-pane",
                animation:Hsc.transitionAnimation
            });
            Hsc.transitionAnimation = "none";
        },
        edit: function () {
            this.send("goEdit");
        },
        setIsCarOwners:function(value){
            this.get('model').set("is_car_owners",value);
        },
        setIsBedstandOwners:function(value){
            this.get('model').set("is_bedstand_owners",value);
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