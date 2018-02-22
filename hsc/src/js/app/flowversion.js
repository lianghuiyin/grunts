Hsc.FlowversionRoute = Ember.Route.extend({
    controllerName: 'flowversion',
    renderTemplate: function(controller) {
        controller.set("isEditing",false);
        controller.set("pannelTitle",Hsc.get("detailModelTag").fmt(controller.get("modelName")));
        this.render('flowversion',{ into:'start', outlet: 'flowversion',controller: controller });
    },
    beforeModel: function() {
    },
    model:function(params){
        var curId = params.flowversion_id;
        var flowversion = this.store.peekRecord('flowversion', curId);
        //注意，这里如果没有找到记录，将返回null
        return flowversion;
    },
    afterModel: function(model, transition) {
        if(!model){
            transition.send("goBack");
        }
    },
    setupController: function(controller, model) {
        controller.set("selectedStep",null);
    },
    activate:function(){
        //这里要run.next的原因是要等view加载到页面后才能执行navigablePush，即要等view.didInsertElement执行完毕
        Ember.run.next(this,function(){
            var controller = this.controllerFor("flowversion");
            controller.send("navigablePush");
        });
        return this;
    },
    deactivate:function(){
        var controller = this.controllerFor("flowversion");
        controller.set("selectedStep",null);
        controller.send("navigablePop");
        return this;
    },
    actions:{
        redirectToNewVersion:function(version){
            //重定向到升级后的新版本
            Ember.run.next(this,function(){
                this.replaceWith('flowversion',version);
            });
        },
        goBack:function(){
            var flow = this.paramsFor("flow").flow_id;
            Hsc.transitionAnimation = "slideHorizontal";
            if(flow){
                this.transitionTo('flow',flow);
            }
            else{
                this.transitionTo('flows');
            }
        }
    }
});
Hsc.FlowversionIndexRoute = Ember.Route.extend({
    controllerName: 'flowversion',
    renderTemplate: function(controller) {
        controller.set("isEditing",false);
        controller.set("pannelTitle",Hsc.get("detailModelTag").fmt(controller.get("modelName")));
        this.render('flowversion',{ into:'start',outlet: 'flowversion',controller: controller });
    },
    actions:{
        goEdit:function(){
            this.transitionTo('flowversion.edit');
        }
    }
});
Hsc.FlowversionEditRoute = Ember.Route.extend({
    controllerName: 'flowversion',
    renderTemplate: function(controller) {
        controller.set("isEditing",true);
        controller.set("pannelTitle",Hsc.get("editModelTag").fmt(controller.get("modelName")));
        this.render('flowversion', { into:'start',outlet: 'flowversion',controller: controller});
    },
    afterModel: function(model, transition) {
        if(!model || !model.get("is_current")){
            transition.send("goBack");
        }
    },
    deactivate:function(){
        var controller = this.controllerFor("flowversion");
        var model = controller.get("model");
        if(model){
            //这里要toArray的原因是如果有两个及以上的新建步骤的话
            //第一个新建步骤rollback后会造成forEach函数中第二个新建步骤为undefined
            //这可能是forEach的bug
            model.get("steps").toArray().forEach(function(item){
                item.rollbackAttributes();
            });
            //已删除记录不在steps属性中，需要单独找到并回滚
            model.get("steps.canonicalState").filterBy("isDeleted",true).forEach(function(item){
                item.rollbackAttributes();
            });
            model.rollbackAttributes();
            if(controller.get("selectedStep.isDeleted") || controller.get("selectedStep.isNew")){
                controller.set("selectedStep",null);
            }
        }
        return this;
    },
    actions:{
        goIndex:function(){
            this.transitionTo('flowversion.index');
        }
    }
});

Hsc.FlowversionSerializer = Hsc.ApplicationSerializer.extend(DS.EmbeddedRecordsMixin, {
    attrs: {
        steps: {embedded: 'always'}
    }
});
Hsc.Flowversion = DS.Model.extend({
    flow: DS.belongsTo('flow'),
    version: DS.attr('number'),
    is_current: DS.attr('boolean', {defaultValue: true}),
    steps: DS.hasMany('step'),
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
    startStep:function(){
        return this.get("steps").findBy("type","start");
    }.property("modified_date")
});

Hsc.FlowversionView = Ember.View.extend({
    classNames:['start-setting-flows-flow-flowversion','navigable-pane','collapse']
});

Hsc.FlowversionController = Ember.ObjectController.extend({
    needs:["application","selectedStep"],
    isEditing:false,
    modelName:"流程步骤",
    pannelTitle:"流程步骤详情",
    isNeedToShowFix:function(){
        return !(this.get("isNew") || this.get("isEditing"));
    }.property("isNew","isEditing"),
    helpInfo:function(){
        return "以下是%@所有步骤信息，请选择一个步骤。".fmt(this.get("flow.name"));
    }.property("flow.name"),
    selectedStep:null,
    stepsDirtyDidChange:function(){
        console.log("stepsDirtyDidChange");
        //canonicalState集合中包含了被删除的记录，如果直接取steps无法获取被删除的记录
        //当添加或删除步骤时该函数会被触发3次，修改步骤只会触发一次
        //为了兼顾被删除的记录要额外判断下canonicalState中的步骤
        var model = this.get("model");
        if(!model){
            return;
        }
        var steps = this.get("steps");
        var stepsInCanonical = this.get("steps.canonicalState");
        var isAnyDirty = steps.isAny("hasDirtyAttributes",true);
        isAnyDirty = isAnyDirty ? true : stepsInCanonical.isAny("hasDirtyAttributes",true);
        if(isAnyDirty){
            model.set('isDeepDirty',true);
        }
        else{
            model.set('isDeepDirty',false);
        }
    }.observes("steps.@each.hasDirtyAttributes"),
    stepsValidDidChange:function(){
        console.log("stepsValidDidChange");
        //canonicalState集合中包含了被删除的记录，如果直接取steps无法获取被删除的记录
        //当添加或删除步骤时该函数会被触发3次，修改步骤只会触发一次
        //为了兼顾被删除的记录要额外判断下canonicalState中的步骤
        var model = this.get("model");
        if(!model){
            return;
        }
        var steps = this.get("steps");
        var isAnyInvalid = steps.isAny("isValid",false);
        if(isAnyInvalid){
            model.set('isDeepValid',false);
        }
        else{
            model.set('isDeepValid',true);
        }
    }.observes("steps.@each.isValid"),
    actions:{
        navigablePush:function(){
            var controller = this;
            $(".start-setting-flows-flow.navigable-pane").navigablePush({
                targetTo:".start-setting-flows-flow-flowversion.navigable-pane",
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
            $(".start-setting-flows-flow-flowversion.navigable-pane").navigablePop({
                targetTo:".start-setting-flows-flow.navigable-pane",
                animation:Hsc.transitionAnimation
            });
            Hsc.transitionAnimation = "none";
        },
        edit: function () {
            this.send("goEdit");
        },
        save:function(){
            this.get('model').save().then(function(answer){
                if(!answer.get("is_current")){
                    var curVersion = answer.get("flow.current");
                    this.set("selectedStep",null);
                    this.send("redirectToNewVersion",curVersion);
                }
                else{
                    this.send("goIndex");
                }
            }.switchScope(this), function(reason){
            }.switchScope(this));
        },
        cancel:function(){
            this.send("goIndex");
        },
        selStep:function(id){
            this.set("selectedStep",this.get("steps").findBy("id",id));
        },
        addStep:function(){
            var curVersion = this.get("model");
            var newStep = this.get("model.steps").createRecord({
                name: '新步骤',
                type: 'process',
                handler_org_type: 'fix_organization',
                next_step_type: 'all_step'
            });
            

            // var newStep = this.store.createRecord("step",{
            //     flowversion: curVersion,
            //     name: '中间步骤',
            //     type: 'process',
            //     handler_org_type: 'fix_organization',
            //     next_step_type: 'all_step'
            // });
            // newStep.set("flowversion",curVersion);
            this.set("selectedStep",newStep);
        },
        deleteStep:function(){
            this.get("selectedStep").deleteRecord();
            this.set("selectedStep",null);
            this.get("model").notifyPropertyChange("isRelationshipsChanged");
        }
    }
});

Hsc.Flowversion.FIXTURES = [
    {
        id: 1,
        flow: 1,
        version: 1,
        is_current: true,
        steps:[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16],
        // steps: [
        //     {
        //         id: 1,
        //         name: '开始'
        //     },
        //     {
        //         id: 2,
        //         name: '结束'
        //     }
        // ],
        creater: 'sdfsdfdsfsdf',
        created_date: 'sdfsdfdsfsdf',
        modifier: 'sdfsdfdsfsdf',
        modified_date: 'sdfsdfdsfsdf'
    }
];
