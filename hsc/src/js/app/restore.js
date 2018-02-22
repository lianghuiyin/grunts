Hsc.CarRestoreRoute = Ember.Route.extend({
    renderTemplate: function(controller) {
        this.render('car/restore', { into:'start', outlet: 'car', controller: controller});
    },
    beforeModel: function(transition) {
    },
    model: function () {
        var car = this.controllerFor("car").get("model");
        if(!car){
            var curId = this.paramsFor("car").car_id;
            car = this.store.peekRecord("car",curId);
        }
        return this.store.createRecord('car_restore',{
            car: car,
            creater: Hsc.get("currentUser"),
            created_date: new Date()
        });
    },
    afterModel: function(model, transition) {
        if(model){
            var status = model.get("car.status");
            if(status != "retired"){
                model.get('errors').add('car', '检测到当前车辆已还原为非退役状态，不能重复执行还原操作。');
            }
            else{
                model.get('errors').remove('car');
            }
        }
        else{
            transition.send("goIndex");
        }
    },
    activate:function(){
        this.controllerFor("car_restore").set("isNeedToPop",false);
        //这里要run.next的原因是要等view加载到页面后才能执行navigablePush，即要等view.didInsertElement执行完毕
        Ember.run.next(this,function(){
            var controller = this.controllerFor("car_restore");
            controller.send("navigablePush");
        });
        return this;
    },
    deactivate:function(){
        var controller = this.controllerFor("car_restore");
        var model = controller.get("model");
        model && model.rollbackAttributes();
        //这里加next的原因是不加的话，返回就没有动画效果
        Ember.run.next(this,function(){
            controller.send("navigablePop");
        });
        //把所有用于交互的临时数据删除
        Ember.run.next(this,function(){
            this.store.unloadAll("car_restore");
        }.switchScope(this));
        return this;
    },
    actions:{
        goBack:function(){
            var controller = this.controllerFor("car_restore");
            controller.set("isNeedToPop",true);
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('start.cars');
        },
        goIndex:function(){
            this.transitionTo('car.index');
        }
    }
});

Hsc.CarRestore = DS.Model.extend({
    car: DS.belongsTo('car'),
    creater: DS.belongsTo('user'),
    created_date: DS.attr('date'),
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

Hsc.CarRestoreView = Ember.View.extend({
    classNames:['start-cars-car-restore','navigable-pane','collapse']
});

Hsc.CarRestoreController = Ember.ObjectController.extend({
    needs:["application","car"],
    modelName:"车辆",
    pannelTitle:"车辆还原",
    helpInfo:"点击还原即可把当前车辆从退役状态还原为闲置状态。",
    isNeedToPop:false,
    actions:{
        navigablePush:function(){
            var controller = this;
            $(".start-cars-car.navigable-pane").navigablePush({
                targetTo:".start-cars-car-restore.navigable-pane",
                animation:Hsc.transitionAnimation,
                callBack:function(){
                    if(controller.get("controllers.car.id") != controller.get("model.car.id")){
                        controller.send("goBack");
                    }
                }
            });
            Hsc.transitionAnimation = "none";
        },
        navigablePop:function(){
            if(this.get("isNeedToPop")){
                $(".start-cars-car-restore.navigable-pane").navigablePop({
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




Hsc.BedstandRestoreRoute = Ember.Route.extend({
    renderTemplate: function(controller) {
        this.render('bedstand/restore', { into:'start', outlet: 'bedstand', controller: controller});
    },
    beforeModel: function(transition) {
    },
    model: function () {
        var bedstand = this.controllerFor("bedstand").get("model");
        if(!bedstand){
            var curId = this.paramsFor("bedstand").bedstand_id;
            bedstand = this.store.peekRecord("bedstand",curId);
        }
        return this.store.createRecord('bedstand_restore',{
            bedstand: bedstand,
            creater: Hsc.get("currentUser"),
            created_date: new Date()
        });
    },
    afterModel: function(model, transition) {
        if(model){
            var status = model.get("bedstand.status");
            if(status != "retired"){
                model.get('errors').add('bedstand', '检测到当前台架已还原为非退役状态，不能重复执行还原操作。');
            }
            else{
                model.get('errors').remove('bedstand');
            }
        }
        else{
            transition.send("goIndex");
        }
    },
    activate:function(){
        this.controllerFor("bedstand_restore").set("isNeedToPop",false);
        //这里要run.next的原因是要等view加载到页面后才能执行navigablePush，即要等view.didInsertElement执行完毕
        Ember.run.next(this,function(){
            var controller = this.controllerFor("bedstand_restore");
            controller.send("navigablePush");
        });
        return this;
    },
    deactivate:function(){
        var controller = this.controllerFor("bedstand_restore");
        var model = controller.get("model");
        model && model.rollbackAttributes();
        //这里加next的原因是不加的话，返回就没有动画效果
        Ember.run.next(this,function(){
            controller.send("navigablePop");
        });
        //把所有用于交互的临时数据删除
        Ember.run.next(this,function(){
            this.store.unloadAll("bedstand_restore");
        }.switchScope(this));
        return this;
    },
    actions:{
        goBack:function(){
            var controller = this.controllerFor("bedstand_restore");
            controller.set("isNeedToPop",true);
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('start.bedstands');
        },
        goIndex:function(){
            this.transitionTo('bedstand.index');
        }
    }
});

Hsc.BedstandRestore = DS.Model.extend({
    bedstand: DS.belongsTo('bedstand'),
    creater: DS.belongsTo('user'),
    created_date: DS.attr('date'),
});

Hsc.BedstandRestoreView = Ember.View.extend({
    classNames:['start-bedstands-bedstand-restore','navigable-pane','collapse']
});

Hsc.BedstandRestoreController = Ember.ObjectController.extend({
    needs:["application","bedstand"],
    modelName:"台架",
    pannelTitle:"台架还原",
    helpInfo:"点击还原即可把当前台架从退役状态还原为闲置状态。",
    isNeedToPop:false,
    actions:{
        navigablePush:function(){
            var controller = this;
            $(".start-bedstands-bedstand.navigable-pane").navigablePush({
                targetTo:".start-bedstands-bedstand-restore.navigable-pane",
                animation:Hsc.transitionAnimation,
                callBack:function(){
                    if(controller.get("controllers.bedstand.id") != controller.get("model.bedstand.id")){
                        controller.send("goBack");
                    }
                }
            });
            Hsc.transitionAnimation = "none";
        },
        navigablePop:function(){
            if(this.get("isNeedToPop")){
                $(".start-bedstands-bedstand-restore.navigable-pane").navigablePop({
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





