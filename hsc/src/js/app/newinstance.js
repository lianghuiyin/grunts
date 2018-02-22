
Hsc.CarNewinstanceRoute = Ember.Route.extend({
    renderTemplate: function(controller) {
        this.render('car/newinstance', { into:'start', outlet: 'car', controller: controller});
    },
    beforeModel: function(transition) {
    },
    model: function () {
        var car = this.controllerFor("car").get("model");
        if(!car){
            var curId = this.paramsFor("car").car_id;
            car = this.store.peekRecord("car",curId);
        }
        var flow = this.store.peekAll("flow").findBy("is_bedstand",false);
        //这里新建newinstance时，只设置基本属性，其他属性需要随流程版本升级自动更新，所以写在model中了
        return this.store.createRecord('newinstance',{
            flow: flow,
            car: car,
            is_bedstand:false,
            creater: Hsc.get("currentUser.id"),
            created_date: new Date()
        });
    },
    afterModel: function(model, transition) {
    },
    activate:function(){
        this.controllerFor("car_newinstance").set("isNeedToPop",false);
        //这里要run.next的原因是要等view加载到页面后才能执行navigablePush，即要等view.didInsertElement执行完毕
        Ember.run.next(this,function(){
            var controller = this.controllerFor("car_newinstance");
            controller.send("navigablePush");
        });
        return this;
    },
    deactivate:function(){
        var controller = this.controllerFor("car_newinstance");
        var model = controller.get("model");
        model && model.rollbackAttributes();
        //这里加next的原因是不加的话，返回就没有动画效果
        Ember.run.next(this,function(){
            controller.send("navigablePop");
        });
        //把所有用于交互的临时数据删除
        Ember.run.next(this,function(){
            this.store.unloadAll("newinstance");
        }.switchScope(this));
        return this;
    },
    actions:{
        goBack:function(){
            var controller = this.controllerFor("car_newinstance");
            controller.set("isNeedToPop",true);
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('start.cars');
        },
        goIndex:function(){
            this.transitionTo('car.index');
        }
    }
});

Hsc.Newinstance = DS.Model.extend({
    flow: DS.belongsTo('flow'),
    flowversion: DS.belongsTo('flowversion'),
    car: DS.belongsTo('car'),
    bedstand: DS.belongsTo('bedstand'),
    vehicletype: DS.belongsTo('vehicletype'),
    is_bedstand: DS.attr('boolean', {defaultValue: false}),
    description: DS.attr('string',{defaultValue: ""}),
    next_step: DS.belongsTo('step'),
    next_bedstand_running_state: DS.attr('string', {defaultValue: "waiting"}),//waiting（待样）、running（运行）、repairing（检修）
    next_handler_org_type: DS.attr('string'),
    next_handler_type: DS.attr('string'),
    next_organization: DS.belongsTo('organization'),
    next_user: DS.belongsTo('user'),
    next_yellow_due: DS.attr('date'),
    next_red_due: DS.attr('date'),
    next_due_days: DS.attr('number', {defaultValue: 0}),
    next_color: DS.attr('string'),
    creater: DS.attr('string'),
    created_date: DS.attr('date'),
    currentDidChange:function(){
        if(this.get("isDeleted")){
            return;
        }
        this.set("flowversion",this.get("flow.current"));
    }.observes("flow.current"),
    startStepDidChange:function(){
        if(this.get("isDeleted")){
            return;
        }
        this.set("next_step",this.get("flowversion.startStep"));
    }.observes("flowversion.startStep"),
    nextStepBedstandRunningStateDidChange:function(){
        if(this.get("isDeleted")){
            return;
        }
        this.set("next_bedstand_running_state",this.get("next_step.bedstand_running_state"));
    }.observes("next_step.bedstand_running_state"),
    nextStepHandlerOrgTypeDidChange:function(){
        if(this.get("isDeleted")){
            return;
        }
        this.set("next_handler_org_type",this.get("next_step.handler_org_type"));
    }.observes("next_step.handler_org_type"),
    nextStepHandlerTypeDidChange:function(){
        if(this.get("isDeleted")){
            return;
        }
        this.set("next_handler_type",this.get("next_step.handler_type"));
    }.observes("next_step.handler_type"),
    isNextOrganizationNeedToChange:function(){
        var next_handler_org_type = this.get("next_handler_org_type");
        switch(next_handler_org_type){
            case "fix_organization":
                this.set("next_organization",this.get("next_step.organization"));
                break;
            case "relate_testtype":
                var testtype = this.get("car.testtype");
                this.set("next_organization",testtype?testtype.get("organization"):null);
                break;
            case "relate_bedstand":
                var bedstand = this.get("bedstand");
                this.set("next_organization",bedstand?bedstand.get("organization"):null);
                break;
        }
    }.observes("next_handler_org_type","next_step.organization","car.testtype.organization","bedstand.organization"),
    nextStepUserDidChange:function(){
        if(this.get("isDeleted")){
            return;
        }
        this.set("next_user",this.get("next_step.user"));
    }.observes("next_step.user"),
    nextStepYellowTimeout:function(){
        if(this.get("isDeleted")){
            return;
        }
        this.set("next_due_days",this.get("next_step.yellow_timeout"));
    }.observes("next_step.yellow_timeout"),
    // nextStepYellowTimeout:function(){
    //     if(this.get("isDeleted")){
    //         return;
    //     }
    //     this.set("next_yellow_timeout",this.get("next_step.yellow_timeout"));
    // }.observes("next_step.yellow_timeout"),
    // nextStepRedTimeoutDidChange:function(){
    //     if(this.get("isDeleted")){
    //         return;
    //     }
    //     this.set("next_red_timeout",this.get("next_step.red_timeout"));
    // }.observes("next_step.red_timeout"),
    nextStepColorDidChange:function(){
        if(this.get("isDeleted")){
            return;
        }
        this.set("next_color",this.get("next_step.color"));
    }.observes("next_step.color"),
    // isNextFixOrganization:Ember.computed.equal('next_handler_org_type', 'fix_organization'),
    // isNextRelateTesttype:Ember.computed.equal('next_handler_org_type', 'relate_testtype'),
    // isNextRelateBedstand:Ember.computed.equal('next_handler_org_type', 'relate_bedstand'),
    isNextFixUser:Ember.computed.equal('next_handler_type', 'fix_user'),
    isNextReserveUser:Ember.computed.equal('next_handler_type', 'reserve_user'),
    isNextEmptyUser:Ember.computed.equal('next_handler_type', 'empty'),
    isNeedNextUserSelection:function(){
        //是否需要显示下一步骤处理人选择框
        //注意虽然isNextFixUser为true时只有一个用户，但还是需要显示出来
        //并且一定要显示在选择框中
        return this.get("isNextFixUser") || this.get("isNextReserveUser");
    }.property("isNextFixUser","isNextReserveUser"),
    nextUserDidChange:function(){
        if(this.get("isDeleted")){
            return;
        }
        var next_user = this.get("next_user");
        if(this.get("hasDirtyAttributes")){
            if(this.get("isNeedNextUserSelection") && Ember.isEmpty(next_user)){
                this.get('errors').add('next_user', '不能为空');
            }
            else{
                this.get('errors').remove('next_user');
            }
        }
    }.observes("next_user","isNeedNextUserSelection"),
    nextOrganizationDidChange:function(){
        if(this.get("isDeleted")){
            return;
        }
        var next_organization = this.get("next_organization");
        if(this.get("hasDirtyAttributes")){
            if(Ember.isEmpty(next_organization)){
                this.get('errors').add('next_organization', '不能为空');
            }
            else{
                this.get('errors').remove('next_organization');
            }
        }
    }.observes("next_organization"),
    // bedstandDidChange:function(){
    //     if(this.get("isDeleted")){
    //         return;
    //     }
    //     var bedstand = this.get("bedstand");
    //     if(this.get("hasDirtyAttributes")){
    //         if(Ember.isEmpty(bedstand)){
    //             this.get('errors').add('bedstand', '不能为空');
    //         }
    //         else{
    //             this.get('errors').remove('bedstand');
    //         }
    //     }
    // }.observes("bedstand"),
    descriptionDidChange:function(){
        if(this.get("isDeleted")){
            return;
        }
        var description = this.get("description");
        if(this.get("hasDirtyAttributes")){
            if(!Ember.isEmpty(description) && description.length > 200){
                this.get('errors').add('description', '长度不能超过200字符');
            }
        }
    }.observes("description")
});

Hsc.CarNewinstanceView = Ember.View.extend({
    classNames:['start-cars-car-newinstance','navigable-pane','collapse']
});

Hsc.CarNewinstanceController = Ember.ObjectController.extend({
    needs:["application","car"],
    modelName:"车辆",
    pannelTitle:"开始流转",
    helpInfo:"点击开始即可把当前车辆流转到起始步骤。",
    isNeedToPop:false,
    bedstands:function(){
        return this.store.filter('bedstand', function () {
            return true;
        });
    }.property(),
    selectedBedstand:function(k,v){
        var model = this.get("model");
        //这里一定要用!==，不可以用!=，因为null==undefined为true，但null===undefined为false，不等于号同理
        if(v !== undefined){
            model.set("bedstand",v);
            return v;
        }
        else{
            return model.get("bedstand");
        }
    }.property("model.bedstand"),
    nextUsers:function(){
        var model = this.get("model"),
            next_step = model.get("next_step"),
            next_organization = model.get("next_organization"),
            next_handler_type = model.get("next_handler_type");
        if(next_handler_type == "reserve_user"){
            if(next_organization){
                return this.store.filter('user', function (user) {
                    return user.get('organizations').contains(next_organization);
                });
            }
            else{
                return [];
            }
        }
        else if(next_handler_type == "fix_user"){
            return [next_step.get("user")];
        }
        else{
            //next_handler_type="empty"
            return [];
        }
    }.property("model.next_organization","model.next_handler_type"),
    selectedNextUser:function(k,v){
        var model = this.get("model");
        //这里一定要用!==，不可以用!=，因为null==undefined为true，但null===undefined为false，不等于号同理
        if(v !== undefined){
            model.set("next_user",v);
            return v;
        }
        else{
            return model.get("next_user");
        }
    }.property("model.next_user"),
    isNextUsersEmpty:Ember.computed.equal('nextUsers.length', 0),
    actions:{
        navigablePush:function(){
            var controller = this;
            $(".start-cars-car.navigable-pane").navigablePush({
                targetTo:".start-cars-car-newinstance.navigable-pane",
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
                $(".start-cars-car-newinstance.navigable-pane").navigablePop({
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
            //这里开始时间最后应该换成从服务器最近获取到的时间，
            //而且必须转成字符串，因为不这样的话，后面addDaysForWorkday会改变now的值
            var now = new Date().format("yyyy-MM-dd hh:mm:ss");
            var next_yellow_timeout = this.get("model.next_step.yellow_timeout");
            var next_red_timeout = this.get("model.next_step.red_timeout");
            var next_yellow_due = next_yellow_timeout ? HOJS.lib.addDaysForWorkday(now,next_yellow_timeout) : null;
            var next_red_due = next_red_timeout ? HOJS.lib.addDaysForWorkday(now,next_red_timeout) : null;
            this.set("model.next_yellow_due",next_yellow_due);
            this.set("model.next_red_due",next_red_due);
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


Hsc.BedstandNewinstanceRoute = Ember.Route.extend({
    renderTemplate: function(controller) {
        this.render('bedstand/newinstance', { into:'start', outlet: 'bedstand', controller: controller});
    },
    beforeModel: function(transition) {
        var curId = this.paramsFor("bedstand").bedstand_id;
        var bedstand = this.store.peekRecord("bedstand",curId);
        if(!bedstand || !bedstand.get("isUnused")){
            alert("只有闲置状态的台架才允许新建工作单。");
            transition.send("goBack");
        }
    },
    model: function () {
        var curId = this.paramsFor("bedstand").bedstand_id;
        var bedstand = this.store.peekRecord("bedstand",curId);
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
    },
    activate:function(){
        this.controllerFor("bedstand_newinstance").set("isNeedToPop",false);
        //这里要run.next的原因是要等view加载到页面后才能执行navigablePush，即要等view.didInsertElement执行完毕
        Ember.run.next(this,function(){
            var controller = this.controllerFor("bedstand_newinstance");
            controller.send("navigablePush");
        });
        return this;
    },
    deactivate:function(){
        var controller = this.controllerFor("bedstand_newinstance");
        var model = controller.get("model");
        model && model.rollbackAttributes();
        //这里加next的原因是不加的话，返回就没有动画效果
        Ember.run.next(this,function(){
            controller.send("navigablePop");
        });
        //把所有用于交互的临时数据删除
        Ember.run.next(this,function(){
            this.store.unloadAll("newinstance");
        }.switchScope(this));
        return this;
    },
    actions:{
        goBack:function(){
            var controller = this.controllerFor("bedstand_newinstance");
            controller.set("isNeedToPop",true);
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('start.bedstands');
        },
        goIndex:function(){
            this.transitionTo('bedstand.index');
        }
    }
});

Hsc.BedstandNewinstanceView = Ember.View.extend({
    classNames:['start-bedstands-bedstand-newinstance','navigable-pane','collapse']
});

Hsc.BedstandNewinstanceController = Ember.ObjectController.extend({
    needs:["application","bedstand"],
    modelName:"台架",
    pannelTitle:"开始流转",
    helpInfo:"点击开始即可把当前台架流转到起始步骤。",
    isNeedToPop:false,
    allVehicletypes:function(){
        var curVehicletypeId = this.get('model.vehicletype.id');
        return this.store.filter('vehicletype', function (vehicletype) {
            if(curVehicletypeId == vehicletype.get("id")){
                return true
            }
            return vehicletype.get("is_enabled");
        });
    }.property("model.vehicletype","model.vehicletype.id"),
    vehicletypes:function(){
        var allVehicletypes = this.get('allVehicletypes');
        return allVehicletypes.sortBy("name");
    }.property("allVehicletypes.length","allVehicletypes.@each.name"),
    selectedVehicletype:function(k,v){
        var model = this.get("model");
        //这里一定要用!==，不可以用!=，因为null==undefined为true，但null===undefined为false，不等于号同理
        if(v !== undefined){
            model.set("vehicletype",v);
            return v;
        }
        else{
            return model.get("vehicletype");
        }
    }.property("model.vehicletype"),
    nextUsers:function(){
        var model = this.get("model"),
            next_step = model.get("next_step"),
            next_organization = model.get("next_organization"),
            next_handler_type = model.get("next_handler_type");
        if(next_handler_type == "reserve_user"){
            if(next_organization){
                return this.store.filter('user', function (user) {
                    return user.get('organizations').contains(next_organization);
                });
            }
            else{
                return [];
            }
        }
        else if(next_handler_type == "fix_user"){
            return [next_step.get("user")];
        }
        else{
            //next_handler_type="empty"
            return [];
        }
    }.property("model.next_organization","model.next_handler_type"),
    selectedNextUser:function(k,v){
        var model = this.get("model");
        //这里一定要用!==，不可以用!=，因为null==undefined为true，但null===undefined为false，不等于号同理
        if(v !== undefined){
            model.set("next_user",v);
            return v;
        }
        else{
            return model.get("next_user");
        }
    }.property("model.next_user"),
    isNextUsersEmpty:Ember.computed.equal('nextUsers.length', 0),
    actions:{
        navigablePush:function(){
            var controller = this;
            $(".start-bedstands-bedstand.navigable-pane").navigablePush({
                targetTo:".start-bedstands-bedstand-newinstance.navigable-pane",
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
                $(".start-bedstands-bedstand-newinstance.navigable-pane").navigablePop({
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
            //这里开始时间最后应该换成从服务器最近获取到的时间，
            //而且必须转成字符串，因为不这样的话，后面addDaysForWorkday会改变now的值
            var now = new Date().format("yyyy-MM-dd hh:mm:ss");
            var next_yellow_timeout = this.get("model.next_step.yellow_timeout");
            var next_red_timeout = this.get("model.next_step.red_timeout");
            var next_yellow_due = next_yellow_timeout ? HOJS.lib.addDaysForWorkday(now,next_yellow_timeout) : null;
            var next_red_due = next_red_timeout ? HOJS.lib.addDaysForWorkday(now,next_red_timeout) : null;
            this.set("model.next_yellow_due",next_yellow_due);
            this.set("model.next_red_due",next_red_due);
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





