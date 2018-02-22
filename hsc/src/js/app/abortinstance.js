Hsc.CarAbortinstanceRoute = Ember.Route.extend({
    renderTemplate: function(controller) {
        this.render('car/abortinstance', { into:'start', outlet: 'car', controller: controller});
    },
    beforeModel: function(transition) {
    },
    model: function () {
        var car = this.controllerFor("car").get("model");
        if(!car){
            var curId = this.paramsFor("car").car_id;
            car = this.store.peekRecord("car",curId);
        }
        var relInstance = car.get("relInstance");
        var abortStep = this.store.peekRecord("step","-1");
        var abortStepColor = abortStep.get("color");
        var abortStepInfo = abortStep.get("default_info");
        return this.store.createRecord('abortinstance',{
            is_bedstand: false,
            instance: relInstance,
            abortStep : abortStep,
            abortStepColor : abortStepColor,
            abortStepInfo : abortStepInfo,
            creater: Hsc.get("currentUser"),
            created_date: new Date()
        });
    },
    afterModel: function(model, transition) {
        if(!model){
            transition.send("goIndex");
        }
        // var car = model.get("car");
        // if(!car){
        //     transition.send("goBack");
        // }
        if(!model.get("instance")){
            transition.send("goIndex");
            // relInstance = car.get("relInstance");
            // if(relInstance){
            //     model.set("instance",relInstance);
            // }
            // else{
            //     transition.send("goIndex");
            // }
        }
    },
    activate:function(){
        this.controllerFor("car_abortinstance").set("isNeedToPop",false);
        //这里要run.next的原因是要等view加载到页面后才能执行navigablePush，即要等view.didInsertElement执行完毕
        Ember.run.next(this,function(){
            var controller = this.controllerFor("car_abortinstance");
            controller.send("navigablePush");
        });
        return this;
    },
    deactivate:function(){
        var controller = this.controllerFor("car_abortinstance");
        var model = controller.get("model");
        model && model.rollbackAttributes();
        //这里加next的原因是不加的话，返回就没有动画效果
        Ember.run.next(this,function(){
            controller.send("navigablePop");
        });
        //把所有用于交互的临时数据删除
        Ember.run.next(this,function(){
            this.store.unloadAll("abortinstance");
        }.switchScope(this));
        return this;
    },
    actions:{
        goBack:function(){
            var controller = this.controllerFor("car_abortinstance");
            controller.set("isNeedToPop",true);
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('start.cars');
        },
        goIndex:function(){
            this.transitionTo('car.index');
        }
    }
});

Hsc.Abortinstance = DS.Model.extend({
    is_bedstand: DS.attr('boolean', {defaultValue: false}),
    instance: DS.belongsTo('instance'),
    abortStep: DS.belongsTo('step'),
    abortStepColor: DS.attr('string'),
    abortStepInfo: DS.attr('string'),
    outbox_users: DS.attr('string'),
    creater: DS.belongsTo('user'),
    created_date: DS.attr('date')
    // ownerDidChange:function(){
    //     if(!this.get("car.owner.id")){
    //         return;
    //     }
    //     if(this.get("car.owner.id") != this.get("creater.id")){
    //         this.get('errors').add('creater', '检测到当前用户不是车辆负责人，不能执行中止操作');
    //     }
    //     else{
    //         this.get('errors').remove('creater');
    //     }
    // }.observes("car.owner.id","Hsc.currentUser")
});

Hsc.CarAbortinstanceView = Ember.View.extend({
    classNames:['start-cars-car-abortinstance','navigable-pane','collapse']
});

Hsc.CarAbortinstanceController = Ember.ObjectController.extend({
    needs:["application","car"],
    modelName:"车辆",
    pannelTitle:"中止流转",
    helpInfo:"点击中止即可停止当前车辆的流转历程，把当前车辆重置为闲置状态，并且在必要的时候把关联台架运行状态重置为待样。",
    isNeedToPop:false,
    actions:{
        navigablePush:function(){
            var controller = this;
            $(".start-cars-car.navigable-pane").navigablePush({
                targetTo:".start-cars-car-abortinstance.navigable-pane",
                animation:Hsc.transitionAnimation,
                callBack:function(){
                    if(controller.get("controllers.car").get("relInstance.id") != controller.get("model.instance.id")){
                        controller.send("goBack");
                    }
                    // if(controller.get("controllers.car.id") != controller.get("model.car.id")){
                    //     controller.send("goBack");
                    // }
                }
            });
            Hsc.transitionAnimation = "none";
        },
        navigablePop:function(){
            if(this.get("isNeedToPop")){
                $(".start-cars-car-abortinstance.navigable-pane").navigablePop({
                    targetTo:".start-cars.navigable-pane",
                    animation:Hsc.transitionAnimation
                });
                Hsc.transitionAnimation = "none";
            }
            else{
                $(".start-cars-car.navigable-pane").addClass("active");
            }
        },
        save:function(){
            var currentUserId = Hsc.get("currentUser.id");
            var outbox_users = this.get("instance.outbox_users");
            if(!outbox_users){
                outbox_users = "";
            }
            var isCurrentUserInOutbox = HOJS.lib.checkItemInSplitStr(currentUserId,outbox_users);
            if(!isCurrentUserInOutbox){
                //当发件箱中不存在当前用户的时候，把当前用户加进去。
                if(outbox_users){
                    outbox_users = outbox_users + "," + currentUserId;
                }
                else{
                    outbox_users = currentUserId.toString();
                }
            }
            this.set("model.outbox_users",outbox_users);
            this.get('model').save().then(function(answer){
                this.send("goIndex");
            }.switchScope(this), function(reason){
            }.switchScope(this));
        },
        cancel: function () {
            this.send("goIndex");
        }
    }
});

Hsc.BedstandAbortinstanceRoute = Ember.Route.extend({
    renderTemplate: function(controller) {
        this.render('bedstand/abortinstance', { into:'start', outlet: 'bedstand', controller: controller});
    },
    beforeModel: function(transition) {
    },
    model: function () {
        var bedstand = this.controllerFor("bedstand").get("model");
        if(!bedstand){
            var curId = this.paramsFor("bedstand").bedstand_id;
            bedstand = this.store.peekRecord("bedstand",curId);
        }
        var relInstance = bedstand.get("relInstance");
        var abortStep = this.store.peekRecord("step","-1");
        var abortStepColor = abortStep.get("color");
        var abortStepInfo = abortStep.get("default_info");
        return this.store.createRecord('abortinstance',{
            is_bedstand: true,
            instance: relInstance,
            abortStep : abortStep,
            abortStepColor : abortStepColor,
            abortStepInfo : abortStepInfo,
            creater: Hsc.get("currentUser"),
            created_date: new Date()
        });
    },
    afterModel: function(model, transition) {
        if(!model){
            transition.send("goIndex");
        }
        // var car = model.get("car");
        // if(!car){
        //     transition.send("goBack");
        // }
        if(!model.get("instance")){
            transition.send("goIndex");
            // relInstance = car.get("relInstance");
            // if(relInstance){
            //     model.set("instance",relInstance);
            // }
            // else{
            //     transition.send("goIndex");
            // }
        }
    },
    activate:function(){
        this.controllerFor("bedstand_abortinstance").set("isNeedToPop",false);
        //这里要run.next的原因是要等view加载到页面后才能执行navigablePush，即要等view.didInsertElement执行完毕
        Ember.run.next(this,function(){
            var controller = this.controllerFor("bedstand_abortinstance");
            controller.send("navigablePush");
        });
        return this;
    },
    deactivate:function(){
        var controller = this.controllerFor("bedstand_abortinstance");
        var model = controller.get("model");
        model && model.rollbackAttributes();
        //这里加next的原因是不加的话，返回就没有动画效果
        Ember.run.next(this,function(){
            controller.send("navigablePop");
        });
        //把所有用于交互的临时数据删除
        Ember.run.next(this,function(){
            this.store.unloadAll("abortinstance");
        }.switchScope(this));
        return this;
    },
    actions:{
        goBack:function(){
            var controller = this.controllerFor("bedstand_abortinstance");
            controller.set("isNeedToPop",true);
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('start.bedstands');
        },
        goIndex:function(){
            this.transitionTo('bedstand.index');
        }
    }
});

Hsc.BedstandAbortinstanceView = Ember.View.extend({
    classNames:['start-bedstands-bedstand-abortinstance','navigable-pane','collapse']
});

Hsc.BedstandAbortinstanceController = Ember.ObjectController.extend({
    needs:["application","bedstand"],
    modelName:"台架",
    pannelTitle:"中止流转",
    helpInfo:"点击中止即可停止当前台架的流转历程，把当前台架重置为闲置状态，并且在必要的时候把关联台架运行状态重置为待样。",
    isNeedToPop:false,
    actions:{
        navigablePush:function(){
            var controller = this;
            $(".start-bedstands-bedstand.navigable-pane").navigablePush({
                targetTo:".start-bedstands-bedstand-abortinstance.navigable-pane",
                animation:Hsc.transitionAnimation,
                callBack:function(){
                    if(controller.get("controllers.bedstand").get("relInstance.id") != controller.get("model.instance.id")){
                        controller.send("goBack");
                    }
                    // if(controller.get("controllers.bedstand.id") != controller.get("model.bedstand.id")){
                    //     controller.send("goBack");
                    // }
                }
            });
            Hsc.transitionAnimation = "none";
        },
        navigablePop:function(){
            if(this.get("isNeedToPop")){
                $(".start-bedstands-bedstand-abortinstance.navigable-pane").navigablePop({
                    targetTo:".start-bedstands.navigable-pane",
                    animation:Hsc.transitionAnimation
                });
                Hsc.transitionAnimation = "none";
            }
            else{
                $(".start-bedstands-bedstand.navigable-pane").addClass("active");
            }
        },
        save:function(){
            var currentUserId = Hsc.get("currentUser.id");
            var outbox_users = this.get("instance.outbox_users");
            if(!outbox_users){
                outbox_users = "";
            }
            var isCurrentUserInOutbox = HOJS.lib.checkItemInSplitStr(currentUserId,outbox_users);
            if(!isCurrentUserInOutbox){
                //当发件箱中不存在当前用户的时候，把当前用户加进去。
                if(outbox_users){
                    outbox_users = outbox_users + "," + currentUserId;
                }
                else{
                    outbox_users = currentUserId.toString();
                }
            }
            this.set("model.outbox_users",outbox_users);
            this.get('model').save().then(function(answer){
                this.send("goIndex");
            }.switchScope(this), function(reason){
            }.switchScope(this));
        },
        cancel: function () {
            this.send("goIndex");
        }
    }
});




