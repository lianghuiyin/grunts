Hsc.CarRetireRoute = Ember.Route.extend({
    renderTemplate: function(controller) {
        this.render('car/retire', { into:'start', outlet: 'car', controller: controller});
    },
    beforeModel: function(transition) {
    },
    model: function () {
        var car = this.controllerFor("car").get("model");
        if(!car){
            var curId = this.paramsFor("car").car_id;
            car = this.store.peekRecord("car",curId);
        }
        return this.store.createRecord('car_retire',{
            car: car,
            creater: Hsc.get("currentUser"),
            created_date: new Date()
        });
    },
    afterModel: function(model, transition) {
        if(model){
            var status = model.get("car.status");
            if(status == "retired"){
                model.get('errors').add('car', '检测到当前车辆已退役，不能重复执行退役操作。');
            }
            else if(status == "turning"){
                model.get('errors').add('car', '检测到当前车辆正在流转中，请等待车辆正常结束流转或先中止流转后再执行退役操作。');
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
        this.controllerFor("car_retire").set("isNeedToPop",false);
        //这里要run.next的原因是要等view加载到页面后才能执行navigablePush，即要等view.didInsertElement执行完毕
        Ember.run.next(this,function(){
            var controller = this.controllerFor("car_retire");
            controller.send("navigablePush");
        });
        return this;
    },
    deactivate:function(){
        var controller = this.controllerFor("car_retire");
        var model = controller.get("model");
        model && model.rollbackAttributes();
        //这里加next的原因是不加的话，返回就没有动画效果
        Ember.run.next(this,function(){
            controller.send("navigablePop");
        });
        //把所有用于交互的临时数据删除
        Ember.run.next(this,function(){
            this.store.unloadAll("car_retire");
        }.switchScope(this));
        return this;
    },
    actions:{
        goBack:function(){
            var controller = this.controllerFor("car_retire");
            controller.set("isNeedToPop",true);
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('start.cars');
        },
        goIndex:function(){
            this.transitionTo('car.index');
        }
    }
});

Hsc.CarRetire = DS.Model.extend({
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

Hsc.CarRetireView = Ember.View.extend({
    classNames:['start-cars-car-retire','navigable-pane','collapse']
});

Hsc.CarRetireController = Ember.ObjectController.extend({
    needs:["application","car"],
    modelName:"车辆",
    pannelTitle:"车辆退役",
    helpInfo:"点击退役即可把当前车辆设置为退役状态，只有闲置状态的车辆可以退役，车辆退役后，可再次手动还原为闲置状态。",
    isNeedToPop:false,
    actions:{
        navigablePush:function(){
            var controller = this;
            $(".start-cars-car.navigable-pane").navigablePush({
                targetTo:".start-cars-car-retire.navigable-pane",
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
                $(".start-cars-car-retire.navigable-pane").navigablePop({
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
                this.get('model.errors').clear();
                this.send("goIndex");
            }.switchScope(this), function(reason){
            }.switchScope(this));
        },
        cancel: function () {
            this.send("goIndex");
        }
    }
});



Hsc.BedstandRetireRoute = Ember.Route.extend({
    renderTemplate: function(controller) {
        this.render('bedstand/retire', { into:'start', outlet: 'bedstand', controller: controller});
    },
    beforeModel: function(transition) {
    },
    model: function () {
        var bedstand = this.controllerFor("bedstand").get("model");
        if(!bedstand){
            var curId = this.paramsFor("bedstand").bedstand_id;
            bedstand = this.store.peekRecord("bedstand",curId);
        }
        return this.store.createRecord('bedstand_retire',{
            bedstand: bedstand,
            creater: Hsc.get("currentUser"),
            created_date: new Date()
        });
    },
    afterModel: function(model, transition) {
        if(model){
            var status = model.get("bedstand.status");
            if(status == "retired"){
                model.get('errors').add('bedstand', '检测到当前台架已退役，不能重复执行退役操作。');
            }
            else if(status == "turning"){
                model.get('errors').add('bedstand', '检测到当前台架正在流转中，请等待台架正常结束流转或先中止流转后再执行退役操作。');
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
        this.controllerFor("bedstand_retire").set("isNeedToPop",false);
        //这里要run.next的原因是要等view加载到页面后才能执行navigablePush，即要等view.didInsertElement执行完毕
        Ember.run.next(this,function(){
            var controller = this.controllerFor("bedstand_retire");
            controller.send("navigablePush");
        });
        return this;
    },
    deactivate:function(){
        var controller = this.controllerFor("bedstand_retire");
        var model = controller.get("model");
        model && model.rollbackAttributes();
        //这里加next的原因是不加的话，返回就没有动画效果
        Ember.run.next(this,function(){
            controller.send("navigablePop");
        });
        //把所有用于交互的临时数据删除
        Ember.run.next(this,function(){
            this.store.unloadAll("bedstand_retire");
        }.switchScope(this));
        return this;
    },
    actions:{
        goBack:function(){
            var controller = this.controllerFor("bedstand_retire");
            controller.set("isNeedToPop",true);
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('start.bedstands');
        },
        goIndex:function(){
            this.transitionTo('bedstand.index');
        }
    }
});

Hsc.BedstandRetire = DS.Model.extend({
    bedstand: DS.belongsTo('bedstand'),
    creater: DS.belongsTo('user'),
    created_date: DS.attr('date')
});

Hsc.BedstandRetireView = Ember.View.extend({
    classNames:['start-bedstands-bedstand-retire','navigable-pane','collapse']
});

Hsc.BedstandRetireController = Ember.ObjectController.extend({
    needs:["application","bedstand"],
    modelName:"台架",
    pannelTitle:"台架退役",
    helpInfo:"点击退役即可把当前台架设置为退役状态，只有闲置状态的台架可以退役，台架退役后，可再次手动还原为闲置状态。",
    isNeedToPop:false,
    actions:{
        navigablePush:function(){
            var controller = this;
            $(".start-bedstands-bedstand.navigable-pane").navigablePush({
                targetTo:".start-bedstands-bedstand-retire.navigable-pane",
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
                $(".start-bedstands-bedstand-retire.navigable-pane").navigablePop({
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
                this.get('model.errors').clear();
                this.send("goIndex");
            }.switchScope(this), function(reason){
            }.switchScope(this));
        },
        cancel: function () {
            this.send("goIndex");
        }
    }
});



