
Hsc.FlowsRoute = Ember.Route.extend({
    renderTemplate: function() {
        this.render({ outlet: 'flows' });
    },
    beforeModel: function() {
        
    },
    model: function () {
        return this.store.peekAll('flow');
    },
    afterModel: function(model, transition) {
    },
    activate:function(){
        //这里要run.next的原因是要等view加载到页面后才能执行navigablePush，即要等view.didInsertElement执行完毕
        Ember.run.next(this,function(){
            var controller = this.controllerFor("flows");
            controller.send("navigablePush");
        });
        return this;
    },
    deactivate:function(){
        var controller = this.controllerFor("flows");
        controller.send("navigablePop");
        return this;
    },
    actions:{
        goBack:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('start.setting');
        },
        goFlow:function(flow){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('flow',flow);
        },
        goNew:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('flows.new');
        }
    }
});
Hsc.FlowRoute = Ember.Route.extend({
    controllerName: 'flow',
    beforeModel: function() {
    },
    model:function(params){
        var curId = params.flow_id;
        var flow = this.store.peekRecord('flow', curId);
        if(!flow && curId.indexOf("fixture") == 0){
            //如果没有找到记录，并且是fixture开头的新记录则创建一个新记录来匹配
            return this.controllerFor("flows").createRecord();
        }
        else{
            //注意，这里如果没有找到记录，并且不是fixture开头的新记录，将返回null
            return flow;
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
            var controller = this.controllerFor("flow");
            controller.send("navigablePush");
        });
        return this;
    },
    deactivate:function(){
        var controller = this.controllerFor("flow");
        controller.send("navigablePop");
        return this;
    },
    actions:{
        goBack:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('flows');
        }
    }
});
Hsc.FlowIndexRoute = Ember.Route.extend({
    controllerName: 'flow',
    renderTemplate: function(controller) {
        controller.set("isEditing",false);
        controller.set("isNew",false);
        controller.set("pannelTitle",Hsc.get("detailModelTag").fmt(controller.get("modelName")));
        this.render('flow',{ outlet: 'flow',controller: controller });
    },
    afterModel: function(model, transition) {
    },
    deactivate:function(){
        //在这个路由中可能出现删除失败的情况，所以也需要回滚
        var controller = this.controllerFor("flow");
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
            this.transitionTo('flow.edit');
        },
        goFlowversion:function(flowversion){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('flowversion',flowversion);
        }
    }
});
Hsc.FlowEditRoute = Ember.Route.extend({
    controllerName: 'flow',
    renderTemplate: function(controller) {
        controller.set("isEditing",true);
        controller.set("isNew",false);
        controller.set("pannelTitle",Hsc.get("editModelTag").fmt(controller.get("modelName")));
        this.render('flow', {outlet: 'flow',controller: controller});
    },
    afterModel: function(model, transition) {
    },
    deactivate:function(){
        var controller = this.controllerFor("flow");
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
            this.transitionTo('flow.index');
        },
    }
});

Hsc.Flow = DS.Model.extend({
    name: DS.attr('string'),
    type: DS.attr('string'),//有两种类型freedom和strict，分别表示自由流程及严谨流程、自由流程不可以设置流程步骤指向，其工作单可以自由选择下一步骤、严谨流可以设置流程步骤指向，其工作单的下一步骤将只能流转到设置好的指向步骤中
    is_bedstand: DS.attr('boolean', {defaultValue: false}),
    is_valid: DS.attr('boolean', {defaultValue: false}),
    is_enabled: DS.attr('boolean', {defaultValue: false}),
    description: DS.attr('string',{defaultValue: ""}),
    help_text: DS.attr('string'),
    hint_text: DS.attr('string',{defaultValue: ""}),
    current:function(){
        var curId = this.get("id");
        return this.store.peekAll('flowversion').find(function (flowversion) {
            return flowversion.get("is_current") && flowversion.get("flow.id") == curId;
        });
    }.property("modified_date"),
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
                var isRepeated = this.store.peekAll('flow').filter(function (flow) {
                    return flow.get("id") != curId && flow.get("name") == name;
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
    }.observes("description"),
    helpTextDidChange:function(){
        var help_text = this.get("help_text");
        if(this.get("hasDirtyAttributes")){
            if(!Ember.isEmpty(help_text) && help_text.length > 200){
                this.get('errors').add('help_text', '长度不能超过200字符');
            }
        }
    }.observes("help_text"),
    hintTextDidChange:function(){
        var hint_text = this.get("hint_text");
        if(this.get("hasDirtyAttributes")){
            if(!Ember.isEmpty(hint_text) && hint_text.length > 200){
                this.get('errors').add('hint_text', '长度不能超过200字符');
            }
        }
    }.observes("hint_text")
});

Hsc.FlowsView = Ember.View.extend({
    classNames:['start-setting-flows','navigable-pane','collapse']
});
Hsc.FlowView = Ember.View.extend({
    classNames:['start-setting-flows-flow','navigable-pane','collapse']
});

Hsc.FlowsController = Ember.ArrayController.extend({
    needs:["application"],
    // sortProperties: ['created_date','id'],
    // sortAscending: true,
    createdDateSorting: ['created_date:asc','id'],
    createdDateSortingDesc: ['created_date:desc','id'],
    modifiedDateSortingDesc: ['modified_date:desc'],
    arrangedResult: Ember.computed.sort('model', 'createdDateSorting'),
    actions:{
        navigablePush:function(){
            $(".start-setting.navigable-pane").navigablePush({
                targetTo:".start-setting-flows.navigable-pane",
                animation:Hsc.transitionAnimation
            });
            Hsc.transitionAnimation = "none";
        },
        navigablePop:function(){
            $(".start-setting-flows.navigable-pane").navigablePop({
                targetTo:".start-setting.navigable-pane",
                animation:Hsc.transitionAnimation
            });
            Hsc.transitionAnimation = "none";
        },
    }
});

Hsc.FlowController = Ember.ObjectController.extend({
    needs:["application","testtypestable","bedstandstable"],
    isEditing:false,
    isNew:false,
    modelName:"流程",
    pannelTitle:"流程详情",
    testtypeDefaultHintBinding:Ember.Binding.oneWay("controllers.testtypestable.defaultHint"),
    bedstandDefaultHintBinding:Ember.Binding.oneWay("controllers.bedstandstable.defaultHint"),
    currentStateNameBinding:Ember.Binding.oneWay("model.currentState.stateName"),
    afterRecordIsDeleted:function(){
        //当记录被删除时，返回上一个界面，这里的删除包括当前用户删除及从服务器中push过来的删除
        var currentStateName = this.get("model.currentState.stateName");
        if(currentStateName == "root.deleted.saved"){
            var currentRouteName = this.get("controllers.application.currentRouteName");
            if(currentRouteName == "flow.index" 
                || currentRouteName == "flow.edit.index"){
                this.send("goBack");
            }
        }
    }.observes("currentStateName"),
    isNeedToShowFix:function(){
        return !(this.get("isNew") || this.get("isEditing"));
    }.property("isNew","isEditing"),
    helpInfo:"点击修改按钮修改流程基本信息或点击流程步骤按钮查看和设置流程步骤。",
    instancesForUpgrade:function(){
        return this.store.filter('instance', function (instance) {
            return !instance.get("flowversion.is_current") && !instance.get("is_finished");
        });
    }.property("model.current.version"),
    actions:{
        navigablePush:function(){
            var controller = this;
            $(".start-setting-flows.navigable-pane").navigablePush({
                targetTo:".start-setting-flows-flow.navigable-pane",
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
            $(".start-setting-flows-flow.navigable-pane").navigablePop({
                targetTo:".start-setting-flows.navigable-pane",
                animation:Hsc.transitionAnimation
            });
            Hsc.transitionAnimation = "none";
        },
        edit: function () {
            this.send("goEdit");
        },
        setIsBedstand:function(value){
            this.get('model').set("is_bedstand",value);
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

Hsc.Flow.FIXTURES = [
    {
        id: 1,
        name: '标准自由流程',
        type: 'freedom',
        current: 1,
        is_valid: true,
        is_enabled: true,
        description: '作为系统初始版本需要的流程设置，该流程不能定制其流程流转方向（但可以定制其“返回上一步骤”功能）。',
        help_text: '',
        creater: 'sdfsdfdsfsdf',
        created_date: 'sdfsdfdsfsdf',
        modifier: 'sdfsdfdsfsdf',
        modified_date: 'sdfsdfdsfsdf'
    }
];
