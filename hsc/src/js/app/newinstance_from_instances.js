Hsc.StartInstancesBedstandsRoute = Hsc.StartBedstandsRoute.extend({
    controllerName: 'start.instances.bedstands',
    renderTemplate: function(controller) {
        this.render('start/bedstands', {outlet: 'instances_bedstands',controller: controller});
    },
    actions:{
        goBack:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('start.instances.inbox');
        },
        goBedstand:function(bedstand){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('start.instances.bedstands.newinstance',bedstand);
        }
    }
});

Hsc.StartInstancesBedstandsController = Hsc.StartBedstandsController.extend({
    isFromInstances:true,
    pannelTitle:"新建台架工作单",
    helpInfo:"请选择一个要新建工作单的台架，只有闲置状态的台架才允许新建工作单。",
    actions:{
        navigablePush:function(){
            var from = ".start-instances.navigable-pane",
                to = ".start-bedstands.navigable-pane";
            $(from).navigablePush({
                targetTo:to,
                animation:Hsc.transitionAnimation
            });
            Hsc.transitionAnimation = "none";
        },
        navigablePop:function(){
            var to = ".start-instances.navigable-pane",
                from = ".start-bedstands.navigable-pane";
            $(from).navigablePop({
                targetTo:to,
                animation:Hsc.transitionAnimation
            });
            Hsc.transitionAnimation = "none";
        }
    }
});

Hsc.StartInstancesBedstandsNewinstanceRoute = Ember.Route.extend({
    renderTemplate: function(controller) {
        this.render('bedstand/newinstance', { into:'start', outlet: 'instances_bedstands_newinstance', controller: controller});
    },
    beforeModel: function(transition) {
        var params = transition.params["start.instances.bedstands.newinstance"];
        var curId = params.bedstand_id;
        var bedstand = this.store.peekRecord("bedstand",curId);
        if(!bedstand || !bedstand.get("isUnused")){
            alert("只有闲置状态的台架才允许新建工作单。");
            transition.send("goBack");
        }
    },
    model: function (params) {
        var curId = params.bedstand_id;
        var bedstand = this.store.peekRecord('bedstand', curId);
        var flow = this.store.peekAll("flow").findBy("is_bedstand",true)
        //这里新建newinstance时，只设置基本属性，其他属性需要随流程版本升级自动更新，所以写在model中了
        return this.store.createRecord('newinstance',{
            flow: flow,
            bedstand: bedstand,
            is_bedstand:true,
            creater: Hsc.get("currentUser.id"),
            created_date: new Date()
        });
    },
    afterModel: function(model, transition) {
        if(!model || !model.get("bedstand")){
            transition.send("goBack");
        }
    },
    activate:function(){
        // this.controllerFor("bedstand_newinstance").set("isNeedToPop",false);
        //这里要run.next的原因是要等view加载到页面后才能执行navigablePush，即要等view.didInsertElement执行完毕
        Ember.run.next(this,function(){
            var controller = this.controller;
            controller.send("navigablePush");
        });
        return this;
    },
    deactivate:function(){
        var controller = this.controller;
        var model = controller.get("model");
        model && model.rollbackAttributes();
        controller.send("navigablePop");
        //把所有用于交互的临时数据删除
        Ember.run.next(this,function(){
            this.store.unloadAll("newinstance");
        }.switchScope(this));
        return this;
    },
    actions:{
        goBack:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('start.instances.bedstands');
        },
        goIndex:function(){
            this.send("goBack");
        }
    }
});

Hsc.StartInstancesBedstandsNewinstanceController = Hsc.BedstandNewinstanceController.extend({
    actions:{
        navigablePush:function(){
            var controller = this;
            $(".start-bedstands.navigable-pane").navigablePush({
                targetTo:".start-bedstands-bedstand-newinstance.navigable-pane",
                animation:Hsc.transitionAnimation,
                callBack:function(){
                    if(!controller.get("model.bedstand.id")){
                        controller.send("goBack");
                    }
                }
            });
            Hsc.transitionAnimation = "none";
        },
        navigablePop:function(){
            $(".start-bedstands-bedstand-newinstance.navigable-pane").navigablePop({
                targetTo:".start-bedstands.navigable-pane",
                animation:Hsc.transitionAnimation
            });
            Hsc.transitionAnimation = "none";
        }
    }
});
