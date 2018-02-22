Hsc.StartInstancesRoute = Ember.Route.extend({
    renderTemplate: function() {
        this.render({ outlet: 'instances' });
    },
    beforeModel: function() {
    },
    model: function () {
    },
    afterModel: function(model, transition) {
    },
    activate:function(){
        //这里要run.next的原因是要等view加载到页面后才能执行navigablePush，即要等view.didInsertElement执行完毕
        Ember.run.next(this,function(){
            var controller = this.controllerFor("start_instances");
            controller.send("navigablePush");
        });
        return this;
    },
    deactivate:function(){
        var controller = this.controllerFor("start_instances");
        controller.send("navigablePop");
        controller.send("resetSearchSet");
        return this;
    },
    actions:{
        goBack:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('start');
        },
        goInbox:function(){
            this.controller.set("isToShowAll",false);
            this.transitionTo('start.instances.inbox');
        },
        goOutbox:function(){
            this.controller.set("isToShowAll",false);
            this.transitionTo('start.instances.outbox');
        },
        goMonitor:function(){
            this.controller.set("isToShowAll",false);
            this.transitionTo('start.instances.monitor');
        },
        goNewBedstandInstance:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('start.instances.bedstands');
        },
        goInstancesCars:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('start.instances.cars');
        }
    }
});
Hsc.StartInstancesInboxRoute = Ember.Route.extend({
    controllerName: 'start_instances',
    model: function () {
        //这里不可以用store.all().filterBy函数，因为那个函数不会自动更新
        return this.store.filter('instance', function (instance) {
            return instance.get("isInbox");
        });
    },
    setupController: function (controller, model) {
        this._super(controller, model);
        controller.set("isInboxSelected",true);
        controller.set("isOutboxSelected",false);
        controller.set("isMonitorSelected",false);
    },
    actions:{
        goInstance:function(instance){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('inbox.instance',instance);
        },
        refresh:function(){
            this.refresh();
        }
    }
});
Hsc.StartInstancesOutboxRoute = Ember.Route.extend({
    controllerName: 'start_instances',
    model: function () {
        //这里不可以用store.all().filterBy函数，因为那个函数不会自动更新
        return this.store.filter('instance', function (instance) {
            return instance.get("isOutbox");
        });
    },
    setupController: function (controller, model) {
        this._super(controller, model);
        controller.set("isInboxSelected",false);
        controller.set("isOutboxSelected",true);
        controller.set("isMonitorSelected",false);
    },
    actions:{
        goInstance:function(instance){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('outbox.instance',instance);
        },
        refresh:function(){
            this.refresh();
        }
    }
});
Hsc.StartInstancesMonitorRoute = Ember.Route.extend({
    controllerName: 'start_instances',
    model: function () {
        //这里不可以用store.all().filterBy函数，因为那个函数不会自动更新
        return this.store.filter('instance', function (instance) {
            return !instance.get("is_finished");
        });
    },
    setupController: function (controller, model) {
        this._super(controller, model);
        controller.set("isInboxSelected",false);
        controller.set("isOutboxSelected",false);
        controller.set("isMonitorSelected",true);
    },
    actions:{
        goInstance:function(instance){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('monitor.instance',instance);
        },
        refresh:function(){
            this.refresh();
        }
    }
});
Hsc.InboxInstanceRoute = Ember.Route.extend({
    controllerName: 'inbox-instance',
    renderTemplate: function(controller) {
        this.render('inbox/instance',{ 
            outlet: 'instance',
            controller: controller 
        });
    },
    beforeModel: function() {
        
    },
    model:function(params){
        var curId = params.instance_id;
        var instance = this.store.peekRecord('instance', curId);
        if(!instance){
            return null;
        }
        var newInboxInstance = this.store.createRecord("inbox_instance",{
            instance: instance,
            bedstand: instance.get("bedstand"),
            vehicletype: instance.get("vehicletype"),
            is_bedstand: instance.get("is_bedstand"),
            description: instance.get("description"),
            flowversion: instance.get("flowversion"),//千万不能用flow.current，那样流程版本升级的话，这里就一起升级了
            trace: instance.get("lastTrace"),
            current_is_handler_locked: instance.get("lastTrace.step.is_handler_locked"),
            current_is_controllable: instance.get("lastTrace.step.is_controllable"),
            current_info: instance.get("lastTrace.step.default_info"),
            current_user: instance.get("lastTrace.user"),
            current_handler: this.controllerFor("session").get("user"),
            creater: Hsc.get("currentUser.id"),
            created_date: new Date()
        });
        return newInboxInstance;
    },
    afterModel: function(model, transition) {
        if(!model){
            transition.send("goInbox");
        }
    },
    setupController: function (controller, model) {
        this._super(controller, model);
        // if(controller.get("isFormEditable")){
        //     //待处理工作单中清空里程信息让用户重新填写
        //     controller.set("current_mileage",null);
        // }
    },
    activate:function(){
        //这里要run.next的原因是要等view加载到页面后才能执行navigablePush，即要等view.didInsertElement执行完毕
        Ember.run.next(this,function(){
            var controller = this.controllerFor("inbox_instance");
            controller.send("navigablePush");
        });
        return this;
    },
    deactivate:function(){
        var controller = this.controllerFor("inbox_instance");
        var model = controller.get("model");
        model && model.rollbackAttributes();
        controller.send("navigablePop");
        //把所有用于交互的临时数据删除
        Ember.run.next(this,function(){
            this.store.unloadAll("inbox_instance");
        }.switchScope(this));
        return this;
    },
    actions:{
        goBack:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('start.instances.inbox');
        },
        goUpgradedInstance:function(instance){
            Ember.run.next(this,function(){
                this.transitionTo('inbox.instance',instance);
            }.switchScope(this));
        }
    }
});
Hsc.OutboxInstanceRoute = Ember.Route.extend({
    controllerName: 'outbox-instance',
    renderTemplate: function(controller) {
        this.render('outbox/instance',{ 
            outlet: 'instance',
            controller: controller
        });
    },
    beforeModel: function() {
        
    },
    model:function(params){
        var curId = params.instance_id;
        var instance = this.store.peekRecord('instance', curId);
        if(!instance){
            return null;
        }
        return instance;
    },
    afterModel: function(model, transition) {
        if(!model){
            transition.send("goOutbox");
        }
    },
    activate:function(){
        //这里要run.next的原因是要等view加载到页面后才能执行navigablePush，即要等view.didInsertElement执行完毕
        Ember.run.next(this,function(){
            var controller = this.controllerFor("outbox_instance");
            controller.send("navigablePush");
        });
        return this;
    },
    deactivate:function(){
        var controller = this.controllerFor("outbox_instance");
        var model = controller.get("model");
        model && model.rollbackAttributes();
        controller.send("navigablePop");
        return this;
    },
    actions:{
        goBack:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('start.instances.outbox');
        }
    }
});
Hsc.MonitorInstanceRoute = Hsc.OutboxInstanceRoute.extend({
    controllerName: 'monitor-instance',
    afterModel: function(model, transition) {
        if(!model){
            transition.send("goMonitor");
        }
    },
    activate:function(){
        //这里要run.next的原因是要等view加载到页面后才能执行navigablePush，即要等view.didInsertElement执行完毕
        Ember.run.next(this,function(){
            var controller = this.controllerFor("monitor_instance");
            controller.send("navigablePush");
        });
        return this;
    },
    deactivate:function(){
        var controller = this.controllerFor("monitor_instance");
        var model = controller.get("model");
        model && model.rollbackAttributes();
        controller.send("navigablePop");
        return this;
    },
    actions:{
        goBack:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('start.instances.monitor');
        }
    }
});

Hsc.Instance = DS.Model.extend({
    car: DS.belongsTo('car'),
    bedstand: DS.belongsTo('bedstand'),
    vehicletype: DS.belongsTo('vehicletype'),
    is_bedstand: DS.attr('boolean', {defaultValue: false}),
    is_started: DS.attr('boolean', {defaultValue: false}),
    is_finished: DS.attr('boolean', {defaultValue: false}),
    is_abort: DS.attr('boolean', {defaultValue: false}),
    flow: DS.belongsTo('flow'),
    flowversion: DS.belongsTo('flowversion'),
    inbox_organization: DS.belongsTo('organization'),
    inbox_user: DS.belongsTo('user'),
    outbox_users: DS.attr('string'),
    previous_trace_step: DS.belongsTo('step'),
    previous_trace_info: DS.attr('string'),
    description: DS.attr('string',{defaultValue: ""}),
    creater: DS.belongsTo('user'),
    created_date: DS.attr('date'),
    modifier: DS.belongsTo('user'),
    modified_date: DS.attr('date'),
    searchKeys:function(){
        if(!this.get("id")){
            return [];
        }
        var is_bedstand = this.get("is_bedstand");
        var stepName = this.get("lastTrace.step.name");
        stepName = stepName ? stepName.toLowerCase() : "";
        var re = [];
        if(is_bedstand){
            re = [stepName];
        }
        else{
            var carNumber = this.get("car.number").toLowerCase();
            var testtypeName = this.get("car.testtype.name").toLowerCase();
            re = [carNumber,testtypeName,stepName];
        }
        var bedstand = this.get("bedstand");
        if(bedstand){
            re.push(bedstand.get("name"));
        }
        var vehicletype = this.get("vehicletype");
        if(vehicletype){
            re.push(vehicletype.get("name"));
        }
        return re;
    }.property("lastTrace","lastTrace.step"),
    userName:function(){
        var inbox_user = this.get("inbox_user");
        return inbox_user ? inbox_user.get("name") : "";
    }.property("inbox_user","inbox_user.name"),
    traces:function(){
        return this.store.peekAll("trace").filterBy("instance.id",this.get("id"));
    }.property("modified_date"),
    lastTrace:function(){
        if(this.get("is_abort")){
            return this.get("traces.lastObject");
        }
        else{
            return this.get("traces").find(function(trace){
                return !trace.get("is_finished") || trace.get("step.type") == "end";
            });
        }
    }.property("traces"),
    isInbox:function(){
        if(this.get("is_finished")){
            return false;
        }
        var currentUser = Hsc.get("currentUser");
        var inboxUserId = this.get('inbox_user.id');
        if(!currentUser){
            return false;
        }
        //如果工作单是发给用户的，则判断是否发组当前用户，反之就一定是发组组织的，则判断是否发组当前用户所在组织
        if(inboxUserId){
            return inboxUserId == currentUser.get("id");
        }
        else{
            return currentUser.get("organizations").contains(this.get('inbox_organization'));
        }
    }.property("modified_date","inbox_organization","inbox_user","Hsc.currentUser.organizations"),
    isOutbox:function(){
        if(this.get("is_finished")){
            return false;
        }
        var outbox_users = this.get("outbox_users");
        var currentUser = Hsc.get("currentUser.id");
        return HOJS.lib.checkItemInSplitStr(currentUser,outbox_users);
        // var traces = this.get("traces");
        // if(currentUser && traces && traces.length > 0){
        //     return !!traces.findBy("handler.id",currentUser.get("id")) || !!traces.findBy("modifier",currentUser.get("id"));
        // }
        // else{
        //     return false;
        // }
    }.property("modified_date","Hsc.currentUser"),
    isFinishedDidChange:function(){
        if(this.get("is_finished")){
            //当把工作单发送到时结束步骤时，无法更新lastTrace，所以手动通知
            Ember.run.next(this,function(){
                this.notifyPropertyChange("lastTrace");
            });
        }
    }.observes("is_finished")
});

Hsc.StartInstancesView = Ember.View.extend({
    classNames:['start-instances','navigable-pane','collapse']
});
Hsc.InboxInstanceView = Ember.View.extend({
    classNames:['start-instances-inbox-instance','navigable-pane','collapse']
});
Hsc.OutboxInstanceView = Ember.View.extend({
    classNames:['start-instances-outbox-instance','navigable-pane','collapse']
});

Hsc.StartInstancesController = Ember.ArrayController.extend({
    needs:["application","session"],
    isToShowAll:false,
    topCount:20,
    isTopButtonNeeded:function(){
        //只要列表个数超过topCount则需要切换按钮
        return this.get("allArrangedResult.length") > this.get("topCount");
    }.property("isToShowAll","allArrangedResult.length"),
    sortedInstances: Ember.computed.sort('model', function(a, b){
        var aStepId = a.get("lastTrace.step.id"); 
        var bStepId = b.get("lastTrace.step.id");
        var targetStepId = "0_19CN4S98E";//统计员接收步骤的id
        //步骤id会带有版本前缀，需要清除
        aStepId = aStepId ? aStepId.replace(/^V\d+_/,"") : 0;
        bStepId = bStepId ? bStepId.replace(/^V\d+_/,"") : 0;
        if(aStepId == targetStepId && bStepId != targetStepId){
            //aStepId为“统计员接收”步骤则优先aStepId排序
            return -1;
        }
        else if(aStepId != targetStepId && bStepId == targetStepId){
            //bStepId为“统计员接收”步骤则优先bStepId排序
            return 1;
        }
        //用修改时间倒序排
        var aModifiedDate = a.get("modified_date");
        var bModifiedDate = b.get("modified_date");
        if (aModifiedDate > bModifiedDate) {
            return -1;
        } else if (aModifiedDate < bModifiedDate) {
            return 1;
        }

        return 0;
    }),
    searchKey:"",
    searchHelp:"输入车辆编号、试验类型、车型、台架或所处步骤搜索",
    searchKeyDidChange:function(){
        this.set("isToShowAll",false);
    }.observes("searchKey"),
    allArrangedResult:function(){
        var searchKey = this.get("searchKey").toLowerCase();
        searchKey = searchKey.replace(/\\/g,"");
        if(searchKey){
            return this.get("sortedInstances").filter(function(item){
                return item.get("searchKeys").find(function(key){
                    return key.search(searchKey) >= 0;
                });
            });
        }
        else{
            return this.get("sortedInstances");
        }
    }.property("sortedInstances.@each.searchKeys","searchKey"),
    arrangedResult:function(){
        var allArrangedResult = this.get("allArrangedResult"),
            isToShowAll = this.get("isToShowAll");
        if(isToShowAll){
            return allArrangedResult;
        }
        else{
            var topCount = this.get("topCount");
            return allArrangedResult.filter(function(item, index, self){
                return index < topCount;
            });
        }
    }.property("allArrangedResult","isToShowAll"),
    isInboxSelected:true,
    isOutboxSelected:false,
    isMonitorSelected:false,
    // inboxsCount:function(){
    //     // this.modelFor("start_instances"); 
    //     return this.get("model.length");
    // }.property(),
    createRecord:function(){
        var instance = this.store.createRecord('instance', {
            car: 'car3',
        });
        return instance;
    },
    userDidChange:function(){
        var currentRouteName = this.get("controllers.application.currentRouteName");
        if(currentRouteName == "start.instances.inbox.index" 
            || currentRouteName == "start.instances.outbox.index"
            || currentRouteName == "inbox.instance.index"
            || currentRouteName == "outbox.instance.index"){
            this.send("refresh");
        }
    }.observes("controllers.session.user.id"),
    actions:{
        navigablePush:function(){
            $(".start-index.navigable-pane").navigablePush({
                targetTo:".start-instances.navigable-pane",
                animation:Hsc.transitionAnimation
            });
            Hsc.transitionAnimation = "none";
        },
        navigablePop:function(){
            $(".start-instances.navigable-pane").navigablePop({
                targetTo:".start-index.navigable-pane",
                animation:Hsc.transitionAnimation
            });
            Hsc.transitionAnimation = "none";
        },
        toggleToShowAll:function(){
            this.toggleProperty("isToShowAll");
        },
        resetSearchSet:function(){
            //重置搜索相关设置
            this.beginPropertyChanges();
            this.set("searchKey","");
            this.set("isToShowAll",false);
            this.endPropertyChanges();
        }
    }
});

Hsc.InstanceController = Ember.ObjectController.extend({
});

Hsc.InboxInstanceController = Ember.ObjectController.extend({
    needs:["application","session"],
    modelName:"工作单",
    pannelTitle:"待处理工作单详情",
    isInboxDidChange:function(){
        //当工作单被其他人提交后可能isInbox属性会变化，需要实时检测
        //当变成不是待处理状态时应该返回到上一层界面
        if(!this.get("instance.isInbox")){
            //加next的原因是可能currentRouteName没有加载完成，造成没有goBack事件而报错
            Ember.run.next(this,function(){
                var currentRouteName = this.get("controllers.application.currentRouteName");
                if(currentRouteName == "inbox.instance.index"){
                    this.send("goBack");
                }
            });
        }
    }.observes("instance.isInbox"),
    isFormEditable:Ember.computed.equal('trace.step.form_power', 'editable'),
    isFormReadonly:function(){
        var form_power = this.get("trace.step.form_power");
        return form_power == "readonly" || form_power == null;
    }.property("trace.step.form_power"),
    isFormNone:Ember.computed.equal('trace.step.form_power', 'none'),
    helpInfo:function(){
        var stepHelpText = this.get("trace.step.help_text");
        if(stepHelpText){
            return stepHelpText;
        }
        else{
            return "请输入处理信息并选择下一步骤后点击发送来提交工作单到下一步骤。";
        }
    }.property("trace"),
    currentInfoHelpInfo:function(){
        var is_bedstand_info_needed = this.get("model.next_step.is_bedstand_info_needed");
        var isEndStep = this.get("model.next_step.type") == "end";
        if(is_bedstand_info_needed && !isEndStep){
            this.set("model.current_info","");
            return "请在此填入相关试验或者任务备注，该备注将显示于台架大屏上！";
        }
        // else if(isEndStep){
        //     this.set("model.current_info","");
        //     return "请在此填入相关试验或者任务备注，该备注将显示于台架大屏上！";
        // }
        else{
            var default_info = this.get("model.trace.step.default_info");
            this.set("model.current_info",default_info);
            return "请输入当前步骤处理信息";
        }
    }.property("model.next_step.is_bedstand_info_needed"),
    isStepRemovedAfterUpgrade:function(){
        //新的流程版本中当前步骤是否被移除
        if(this.get("flowversion.is_current")){
            return false;
        }
        else{
            var curStep = this.get("trace.step"),
                newVersion = this.get("instance.flow.current"),
                newVersionVersion = newVersion.get("version"),
                newVersionSteps = newVersion.get("steps");
            //把步骤的版本号前缀更新为新版本号
            var newVersionStepId = curStep.get("id").replace(/V\d+_/,"V%@_".fmt(newVersionVersion));
            var newStep = newVersionSteps.findProperty("id",newVersionStepId);
            return newStep ? false : true;
        }
    }.property("flowversion.version"),
    selectedStep:null,
    selectedHandler:null,
    isPrevTraceLoaded:function(){
        var prevTrace = this.get("trace.previous_trace");
        if(prevTrace){
            return prevTrace.get("isLoaded") && !prevTrace.get("isDeleted");
        }
        else{
            return true;
        }
    }.property("trace.previous_trace.isLoaded","trace.previous_trace.isDeleted"),
    nextSteps:function(){
        var allStep = this.get("instance.flowversion.steps"),
            nextStepType = this.get("trace.step.next_step_type");
        var prevTrace = this.get("trace.previous_trace");
        //是否上一步骤的类型为恢复流转，如果是的话，说明工作单版本升级了，其下一步骤列表肯定是列出所有步骤
        var isPrevTraceRecove = prevTrace ? prevTrace.get("step.type") == "recove" : false;
        if(nextStepType == "all_step" || isPrevTraceRecove){
            var currettStep = this.get("trace.step");
            var currentIsEndable = currettStep.get("is_endable");
            var currentStepId = currettStep.get("id");
            var currentNextStepDefault = currettStep.get("next_step_default");
            //根据下一步骤默认值来设置下一步骤值
            if(currentNextStepDefault === "start"){
                this.get("model").set("next_step",allStep.findBy("type","start"));
            }
            else if(currentNextStepDefault === "end"){
                this.get("model").set("next_step",allStep.findBy("type","end"));
            }
            return allStep.filter(function(item){
                //去掉当前步骤，如果当前步骤的is_endable属性为false，则要同时去掉结束步骤
                return item.get("id") != currentStepId && (currentIsEndable || item.get("type") != "end");
            });
        }
        else if(nextStepType == "last_step"){
            if(prevTrace){
                var prevStep = prevTrace.get("step");
                //自动选中上一步骤
                this.get("model").set("next_step",prevStep);
                return [prevStep];
            }
            else{
                return [null];
            }
        }
        
    }.property("instance","isPrevTraceLoaded"),
    selectedNextStep:function(k,v){
        var model = this.get("model");
        //这里一定要用!==，不可以用!=，因为null==undefined为true，但null===undefined为false，不等于号同理
        if(v !== undefined){
            model.set("next_step",v);
            return v;
        }
        else{
            return model.get("next_step");
        }
    }.property("model.next_step"),
    nextStepDidChange:function(){
        if(this.get("isDeleted")){
            return;
        }
        var model = this.get("model"),
            nextStep = model.get("next_step");
        var next_handler_org_type = nextStep?nextStep.get("handler_org_type"):null;
        model.beginPropertyChanges();
        model.set("next_is_bedstand_info_needed",nextStep?nextStep.get("is_bedstand_info_needed"):false);
        model.set("next_step_type",nextStep?nextStep.get("type"):null);
        model.set("next_handler_org_type",next_handler_org_type);
        model.set("next_handler_type",nextStep?nextStep.get("handler_type"):null);
        // model.set("next_organization",nextStep?nextStep.get("organization"):null);

        switch(next_handler_org_type){
            case "fix_organization":
                model.set("next_organization",model.get("next_step.organization"));
                break;
            case "relate_testtype":
                var testtype = model.get("instance.car.testtype");
                model.set("next_organization",testtype?testtype.get("organization"):null);
                break;
            case "relate_bedstand":
                var bedstand = model.get("bedstand");
                model.set("next_organization",bedstand?bedstand.get("organization"):null);
                break;
        }

        model.set("next_user",nextStep?nextStep.get("user"):null);
        model.endPropertyChanges();
    }.observes("model.next_step"),
    isNeedToInputTimeout:function(){
        var next_step = this.get("model.next_step");
        if (next_step){
            return !(next_step.get("isStart") || next_step.get("isEnd"));
        }
        else{
            return false;
        }
    }.property("model.next_step.type"),
    isNextSkipWeekend:true,
    isNextSkipWeekend:true,
    nextYellowTimeout:function(k,v){
        var model = this.get("model");
        if(!model){
            return "";
        }
        if(model.get("isDeleted")){
            return "";
        }
        //这里一定要用!==，不可以用!=，因为null==undefined为true，但null===undefined为false，不等于号同理
        if(v !== undefined){
            if(Ember.isEmpty(v)){
                model.get('errors').remove('next_yellow_due');
                model.get('errors').add('next_yellow_due', '不能为空，可以输入0值表示不计时');
            }
            // else if(!/^0$|^[1-9]\d*$/g.test(v)){
            else if(!/^(0|[1-9]\d*)(\.\d{1})?$/g.test(v)){
                model.get('errors').remove('next_yellow_due');
                model.get('errors').add('next_yellow_due', '请输入零或有效正数(小数点1位)');
            }
            else{
                model.get('errors').remove('next_yellow_due');
            }
            return v;
        }
        else{
            model.get('errors').remove('next_yellow_due');
            return model.get("next_step.yellow_timeout");
        }
    }.property("model.next_step.yellow_timeout"),
    nextYellowTimeoutDidChange:function(){
        var model = this.get("model");
        if(!model){
            return;
        }
        if(model.get("isDeleted")){
            return;
        }
        var nextYellowTimeout = this.get("nextYellowTimeout");
        if(nextYellowTimeout && !model.get('errors').has('next_yellow_due')){
            var isNextSkipWeekend = this.get("isNextSkipWeekend");
            var now = new Date().format("yyyy-MM-dd hh:mm:ss");
            var next_yellow_due = nextYellowTimeout ? HOJS.lib.addDaysForWorkday(now,nextYellowTimeout,isNextSkipWeekend) : null;
            model.set("next_yellow_due",next_yellow_due);
            model.set("next_due_days",nextYellowTimeout);

            var nextRedTimeout = nextYellowTimeout * 1.5;
            nextRedTimeout = HOJS.lib.deci(nextRedTimeout,1);
            this.set("nextRedTimeout",nextRedTimeout);
        }
    }.observes("model.next_step.yellow_timeout","nextYellowTimeout","isNextSkipWeekend"),
    nextRedTimeout:function(k,v){
        var model = this.get("model");
        if(!model){
            return "";
        }
        if(model.get("isDeleted")){
            return "";
        }
        //这里一定要用!==，不可以用!=，因为null==undefined为true，但null===undefined为false，不等于号同理
        if(v !== undefined){
            if(Ember.isEmpty(v)){
                model.get('errors').remove('next_red_due');
                model.get('errors').add('next_red_due', '不能为空，可以输入0值表示不计时');
            }
            // else if(!/^0$|^[1-9]\d*$/g.test(v)){
            else if(!/^(0|[1-9]\d*)(\.\d{1})?$/g.test(v)){
                model.get('errors').remove('next_red_due');
                model.get('errors').add('next_red_due', '请输入零或有效正数(小数点1位)');
            }
            else{
                model.get('errors').remove('next_red_due');
            }
            return v;
        }
        else{
            model.get('errors').remove('next_red_due');
            return model.get("next_step.red_timeout");
        }
    }.property("model.next_step.red_timeout"),
    nextRedTimeoutDidChange:function(){
        var model = this.get("model");
        if(!model){
            return;
        }
        if(model.get("isDeleted")){
            return;
        }
        var nextRedTimeout = this.get("nextRedTimeout");
        if(nextRedTimeout && !model.get('errors').has('next_red_due')){
            var now = new Date().format("yyyy-MM-dd hh:mm:ss");
            var isNextSkipWeekend = this.get("isNextSkipWeekend");
            var next_red_due = nextRedTimeout ? HOJS.lib.addDaysForWorkday(now,nextRedTimeout,isNextSkipWeekend) : null;
            model.set("next_red_due",next_red_due);
        }
    }.observes("model.next_step.red_timeout","nextRedTimeout","isNextSkipWeekend"),
    nextUsers:function(){
        var model = this.get("model"),
            next_step = model.get("next_step"),
            next_organization = model.get("next_organization"),
            next_handler_type = model.get("next_handler_type");
        if(next_handler_type == "reserve_user"){
            if(next_organization){
                return this.store.filter('user', function (user) {
                    return user.get('organization').contains(next_organization);
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
    isSendToPreviousDidChange:function(){
        //如果当前步骤的流转方式为返回上一步，则默认选中上一步骤的处理人为下一步骤处理人
        var isSendToPrevious = this.get("isSendToPrevious");
        if(isSendToPrevious){
            Ember.run.next(this,function(){
                var previous_trace = this.get("trace.previous_trace");
                if(previous_trace && this.get("isPrevTraceLoaded")){
                    var previous_handler_type = previous_trace.get("step.handler_type");
                    if(previous_handler_type == "fix_user" || previous_handler_type == "reserve_user"){
                        this.set("selectedNextUser",previous_trace.get("handler"));
                    }
                }
            });
        }
    }.observes("isSendToPrevious","isPrevTraceLoaded"),
    handlers:function(){
        var current_user = this.get("model.current_user");
        if(current_user){
            //如果current_user存在即lastTrace.user存在，亦即lastTrace.step.handler_type不为empty（为fix_user或reserve_user）
            return [current_user];
        }
        else{
            if(this.get("model.current_is_handler_locked")){
                return [this.get("controllers.session.user")];
            }
            else{
                // return this.store.peekAll("user").filterBy("organization",this.get("instance.lastTrace.organization"));
                //这里不可以用store.all().filterBy函数，因为那个函数不会自动更新
                var lastTraceOrgId = this.get("trace.organization.id");
                return this.store.filter('user', function (user) {
                    return user.get('organizations').mapBy("id").contains(lastTraceOrgId);
                });
            }
        }
    }.property("instance","model.current_user"),
    selectedHandler:function(k,v){
        var model = this.get("model");
        //这里一定要用!==，不可以用!=，因为null==undefined为true，但null===undefined为false，不等于号同理
        if(v !== undefined){
            model.set("current_handler",v);
            return v;
        }
        else{
            return model.get("current_handler");
        }
    }.property("model.current_handler"),
    traces:function(){
        //这里一定要注意，不可以在模板中直接用instance.traces，而一定要调用该函数返回的traces
        //因为instance为空时可能会报错，已知的报错为TracesController中的allSortedTracesDesc
        if(this.get("instance")){
            return this.get("instance.traces");
        }
        else{
            return [];
        }
    }.property("instance"),
    bedstands:function(){
        return this.store.filter('bedstand', function (bedstand) {
            return !bedstand.get("isRetired");
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
    // nextStepTypeDidChange:function(){
    //     if(this.get("isDeleted")){
    //         return;
    //     }
    //     this.set("next_step_type",this.get("next_step.type"));
    // }.observes("next_step.type"),
    // nextStepHandlerOrgTypeDidChange:function(){
    //     if(this.get("isDeleted")){
    //         return;
    //     }
    //     this.set("next_handler_org_type",this.get("next_step.handler_org_type"));
    // }.observes("next_step.handler_org_type"),
    // nextStepHandlerTypeDidChange:function(){
    //     if(this.get("isDeleted")){
    //         return;
    //     }
    //     this.set("next_handler_type",this.get("next_step.handler_type"));
    // }.observes("next_step.handler_type"),
    // nextStepOrganizationDidChange:function(){
    //     if(this.get("isDeleted")){
    //         return;
    //     }
    //     this.set("next_organization",this.get("next_step.organization"));
    // }.observes("next_step.organization"),
    // nextStepUserDidChange:function(){
    //     if(this.get("isDeleted")){
    //         return;
    //     }
    //     this.set("next_user",this.get("next_step.user"));
    // }.observes("next_step.user"),
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
    // nextStepColorDidChange:function(){
    //     if(this.get("isDeleted")){
    //         return;
    //     }
    //     this.set("next_color",this.get("next_step.color"));
    // }.observes("next_step.color"),
    isUpgrading:false,
    actions:{
        navigablePush:function(){
            var controller = this;
            $(".start-instances.navigable-pane").navigablePush({
                targetTo:".start-instances-inbox-instance.navigable-pane",
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
            $(".start-instances-inbox-instance.navigable-pane").navigablePop({
                targetTo:".start-instances.navigable-pane",
                animation:Hsc.transitionAnimation
            });
            Hsc.transitionAnimation = "none";
        },
        toggleIsNextSkipWeekend:function(){
            this.toggleProperty("isNextSkipWeekend");
        },
        send:function(){
            var outbox_users = this.get("instance.outbox_users");
            if(!outbox_users){
                outbox_users = "";
            }
            var currentUser = Hsc.get("currentUser.id");
            var isCurrentUserInOutbox = HOJS.lib.checkItemInSplitStr(currentUser,outbox_users);
            if(!isCurrentUserInOutbox){
                //当发件箱中不存在当前用户的时候，把当前用户加进去。
                if(outbox_users){
                    outbox_users = outbox_users + "," + currentUser;
                }
                else{
                    outbox_users = currentUser.toString();
                }
            }
            var currentHandler = this.get("current_handler.id");
            var isCurrentHandlerInOutbox = HOJS.lib.checkItemInSplitStr(currentHandler,outbox_users);
            if(!isCurrentHandlerInOutbox){
                //当发件箱中不存在当前处理人的时候，把当前用户加进去。
                if(outbox_users){
                    outbox_users = outbox_users + "," + currentUser;
                }
                else{
                    outbox_users = currentHandler.toString();
                }
            }

            var model = this.get('model');
            model.set("outbox_users",outbox_users);

            // var now = new Date().format("yyyy-MM-dd hh:mm:ss");
            // var next_yellow_timeout = this.get("model.next_step.yellow_timeout");
            // var next_red_timeout = this.get("model.next_step.red_timeout");
            // var next_yellow_due = next_yellow_timeout ? HOJS.lib.addDaysForWorkday(now,next_yellow_timeout) : null;
            // var next_red_due = next_red_timeout ? HOJS.lib.addDaysForWorkday(now,next_red_timeout) : null;
            // this.set("model.next_yellow_due",next_yellow_due);
            // this.set("model.next_red_due",next_red_due);
            // this.set("model.next_due_days",next_yellow_timeout);

            var now = new Date().format("yyyy-MM-dd hh:mm:ss");
            var isNextSkipWeekend = this.get("isNextSkipWeekend");

            var next_yellow_timeout = this.get("nextYellowTimeout");
            var next_yellow_due = next_yellow_timeout ? HOJS.lib.addDaysForWorkday(now,next_yellow_timeout,isNextSkipWeekend) : null;
            model.set("next_yellow_due",next_yellow_due);
            model.set("next_due_days",next_yellow_timeout);

            var next_red_timeout = this.get("nextRedTimeout");
            var next_red_due = next_red_timeout ? HOJS.lib.addDaysForWorkday(now,next_red_timeout,isNextSkipWeekend) : null;
            model.set("next_red_due",next_red_due);

            model.set("next_is_skip_weekend",isNextSkipWeekend);

            model.save().then(function(answer){
                this.send("goBack");
            }.switchScope(this), function(reason){
            }.switchScope(this));
        },
        unloadAllRecord:function(){
            this.store.unloadAll("upgrade_instance");
        },
        upgrade:function(){
            var upgradeStep = this.store.peekRecord("step","-2"),
                upgradeStepColor = upgradeStep.get("color"),
                upgradeStepInfo = upgradeStep.get("default_info");
            var recoveStep = this.store.peekRecord("step","-3"),
                recoveStepColor = recoveStep.get("color"),
                recoveStepInfo = recoveStep.get("default_info");
            var currentUserId = Hsc.get("currentUser.id");

            var curStep = this.get("trace.step"),
                newVersion = this.get("instance.flow.current"),
                newVersionVersion = newVersion.get("version"),
                newVersionSteps = newVersion.get("steps");
            //把步骤的版本号前缀更新为新版本号
            var newVersionStepId = curStep.get("id").replace(/V\d+_/,"V%@_".fmt(newVersionVersion));
            var newStep = newVersionSteps.findProperty("id",newVersionStepId);
            if(!newStep){
                newStep = newVersionSteps.findProperty("type","start");
            }
            var newOrganization = newStep.get("organization");
            if(!newOrganization){
                newOrganization = this.get("trace.organization");
            }
            var newUser = newStep.get("user");
            if(!newUser){
                newUser = this.get("trace.user");
            }
            var newYellowTimeout = newStep.get("yellow_timeout"),
                newRedTimeout = newStep.get("red_timeout"),
                newColor = newStep.get("color");

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

            var newUpgradeInstance = this.store.createRecord("upgrade_instance",{
                instance: this.get("instance"),
                trace: this.get("trace"),
                car: this.get("instance.car"),
                bedstand: this.get("instance.bedstand"),
                vehicletype: this.get("instance.vehicletype"),
                is_bedstand: this.get("instance.is_bedstand"),
                description: this.get("instance.description"),
                flow: this.get("instance.flow"),
                new_flowversion: this.get("instance.flow.current"),
                upgrade_step: upgradeStep,
                upgrade_step_color: upgradeStepColor,
                upgrade_step_info: upgradeStepInfo,
                recove_step: recoveStep,
                recove_step_color: recoveStepColor,
                recove_step_info: recoveStepInfo,
                current_is_controllable: this.get("current_is_controllable"),
                new_step: newStep,
                next_bedstand_running_state: newStep.get("bedstand_running_state"),
                new_step_type: newStep.get("type"),
                new_organization: newOrganization,
                new_user: newUser,
                new_yellow_timeout: newYellowTimeout,
                new_red_timeout: newRedTimeout,
                new_color: newColor,
                outbox_users: outbox_users,
                new_outbox_users: currentUserId.toString(),
                creater: currentUserId,
                created_date: new Date()
            });
            this.set("isUpgrading",true);
            newUpgradeInstance.save(true).then(function(answer){
                this.set("isUpgrading",false);
                var new_instance = answer.get("new_instance");
                this.send("unloadAllRecord");
                this.send("goUpgradedInstance",new_instance);
            }.switchScope(this), function(reason){
                this.set("isUpgrading",false);
                this.send("unloadAllRecord");
            }.switchScope(this));
        }
    }
});

Hsc.OutboxInstanceController = Ember.ObjectController.extend({
    needs:["application","session"],
    modelName:"工作单",
    pannelTitle:"已处理工作单详情",
    isOutboxDidChange:function(){
        //当工作单被其他人提交后可能isOutbox属性会变化，需要实时检测
        //当变成不是待处理状态时应该返回到上一层界面
        if(!this.get("isOutbox")){
            //加next的原因是可能currentRouteName没有加载完成，造成没有goBack事件而报错
            Ember.run.next(this,function(){
                var currentRouteName = this.get("controllers.application.currentRouteName");
                if(currentRouteName == "outbox.instance.index"){
                    this.send("goBack");
                }
            });
        }
    }.observes("isOutbox"),
    helpInfo:"您曾经处理过该工作单。",
    isPrevTraceLoaded:function(){
        var prevTrace = this.get("lastTrace.previous_trace");
        if(prevTrace){
            return prevTrace.get("isLoaded") && !prevTrace.get("isDeleted");
        }
        else{
            return true;
        }
    }.property("lastTrace.previous_trace.isLoaded","lastTrace.previous_trace.isDeleted"),
    actions:{
        navigablePush:function(){
            var controller = this;
            $(".start-instances.navigable-pane").navigablePush({
                targetTo:".start-instances-outbox-instance.navigable-pane",
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
            $(".start-instances-outbox-instance.navigable-pane").navigablePop({
                targetTo:".start-instances.navigable-pane",
                animation:Hsc.transitionAnimation
            });
            Hsc.transitionAnimation = "none";
        }
    }
});

Hsc.MonitorInstanceController = Hsc.OutboxInstanceController.extend({
    needs:["application","session"],
    modelName:"工作单",
    pannelTitle:"监控箱工作单详情",
    isFinishedDidChange:function(){
        //当变成已结束状态时应该返回到上一层界面
        if(this.get("is_finished")){
            //加next的原因是可能currentRouteName没有加载完成，造成没有goBack事件而报错
            Ember.run.next(this,function(){
                var currentRouteName = this.get("controllers.application.currentRouteName");
                if(currentRouteName == "monitor.instance.index"){
                    this.send("goBack");
                }
            });
        }
    }.observes("is_finished"),
    helpInfo:"该工作单正在流转。"
});

Hsc.TracesController = Ember.ArrayController.extend({
    needs:["application"],
    isLoadingMore:false,
    isLoadingTop:false,
    init:function(){
        this._super();
        Ember.run.next(this,function(){
            this.send("loadTopTraces");
        });
    },
    lastTraceDidChange:function(){
        //当步骤被其他人提交时，不会自动更新，这里通知下就行
        //如果不加Ember.run.next的话topSortedTracesDesc无法更新到
        Ember.run.next(this,function(){
            this.notifyPropertyChange("topSortedTracesDesc");
            this.notifyPropertyChange("sortedTracesDesc");
        });
    }.observes("@each.is_finished"),
    tracesSortingDesc: ['start_date:desc','id:desc'],
    allSortedTracesDesc: Ember.computed.sort('model', 'tracesSortingDesc'),
    topSortedTracesDesc: function(){
        //默认显示前三个历程
        var allSortedTracesDesc = this.get("allSortedTracesDesc");
        var topCount = this.get("topCount");
        return allSortedTracesDesc.filter(function(item, index, self){
            return index < topCount;
        });
    }.property(),
    isToShowAll:false,
    topCount:3,
    pageCount:10,
    isTopButtonNeeded:function(){
        //只要列表个数超过topCount则需要切换按钮
        return this.get("allSortedTracesDesc.length") > this.get("topCount");
    }.property("isToShowAll"),
    sortedTracesDesc: function(){
        return this.get("isToShowAll") ? this.get("allSortedTracesDesc") : this.get("topSortedTracesDesc")
    }.property("isToShowAll"),
    isFirstTraceLoaded:function(){
        //最早的第一个履历是否加载完成，标识服务器所有履历加载完成
        var firstTrace = this.get("allSortedTracesDesc.lastObject");
        //只要最早的那个步骤的上一步骤属性不为空说明还有更早的步骤没有加载
        if(firstTrace && firstTrace.get("previous_trace")){
            return false;
        }
        else{
            return true;
        }
    }.property(),
    actions:{
        toggleToShowAll:function(){
            this.toggleProperty("isToShowAll");
        },
        fixUnloadPreviousTrace:function(){
            //因为执行unloadRecord把记录从本地删除后，即使重新从服务器再抓取到本地。
            //但其他record如果有belongsTo指向该记录的，则其值不会自动更新，且isDeleted属性保持为true
            //只有手动更新其belongsTo属性值，让其与store中的记录同步
            var firstTrace = this.get("firstObject");
            var prevTrace = firstTrace.get("previous_trace");
            if(prevTrace.get("isDeleted")){
                var prevTraceInStore = this.store.peekRecord("trace",prevTrace.get("id")); 
                firstTrace.set("previous_trace",prevTraceInStore);
            }
        },
        loadTopTraces:function(){
            //如果没有加载前3个trace则从服务器中获取
            if(this.get("allSortedTracesDesc.length") == 1){
                this.set("isLoadingTop",true);
                var firstTrace = this.get("allSortedTracesDesc.lastObject");
                //只要最早的那个步骤的上一步骤属性不为空说明还有更早的步骤没有加载
                if(firstTrace.get("previous_trace")){
                    this.store.find('trace', { 
                        type: "top_traces_by_instance",
                        instance: firstTrace.get("instance.id"),
                        count:this.get("topCount") - 1//这里要减一的原因是第一个trace为is_finished=false其算topCount之一
                    }).then(function(answer){
                        //通知履历列表更新显示
                        if(!this.get("model")){
                            //在没有加载完成的情况下退出工作单界面，当最终加载完成时model为空，如果再执行下面的代码会报错。
                            return;
                        }
                        var newTraces = answer.toArray();
                        this.pushObjects(newTraces);
                        Ember.run.next(this,function(){
                            this.notifyPropertyChange("isTopButtonNeeded");
                            this.notifyPropertyChange("isFirstTraceLoaded");
                            this.send("fixUnloadPreviousTrace");
                            this.set("isLoadingTop",false);
                        });
                    }.switchScope(this),function(){
                        this.set("isLoadingTop",false);
                    }.switchScope(this));
                }
            }
        },
        loadMoreTraces:function(){
            //从服务器中加载更多履历
            var firstTrace = this.get("allSortedTracesDesc.lastObject");
            //只要最早的那个步骤的上一步骤属性不为空说明还有更早的步骤没有加载
            if(firstTrace.get("previous_trace")){
                this.set("isLoadingMore",true);
                var serializedStartDate = Hsc.DateTransform.prototype.serialize.call(null,firstTrace.get("start_date"));
                serializedStartDate = "\"%@\"".fmt(serializedStartDate);//作为url参数一定要带引号，否则后台无法识别
                this.store.find('trace', { 
                    type: "more_traces_by_instance",
                    instance: firstTrace.get("instance.id"),
                    count:this.get("pageCount"),
                    start_date: serializedStartDate
                }).then(function(answer){
                    if(!this.get("model")){
                        //在没有加载完成的情况下退出工作单界面，当最终加载完成时model为空，如果再执行下面的代码会报错。
                        return;
                    }
                    //通知履历列表更新显示
                    var firstTrace = this.get("allSortedTracesDesc.lastObject");
                    //清除前后台时间毫秒值解析误差可能带来的重复项
                    var newTraces = answer.toArray().removeObject(firstTrace);
                    this.pushObjects(newTraces);
                    this.notifyPropertyChange("isTopButtonNeeded");
                    this.notifyPropertyChange("isFirstTraceLoaded");
                    Ember.run.next(this,function(){
                        this.set("isToShowAll",true);
                        this.set("isLoadingMore",false);
                    });
                }.switchScope(this),function(){
                    this.set("isToShowAll",true);
                    this.set("isLoadingMore",false);
                }.switchScope(this));
            }
        }
    }
});

Hsc.Instance.FIXTURES = [
    {
        id: 1,
        name: 'car1-asdf',
        car: 1,
        testtype:1,
        is_started: false,
        is_finished: false,
        is_abort: false,
        flow: 1,
        flowversion: 1,
        inbox_organization: 1,
        inbox_user: 1,
        inbox_console: null,
        // outbox_users: 'asdfasdf',
        creater: 1,
        created_date: '2014-12-12 12:12:12',
        modifier: 1,
        modified_date: '2014-12-12 12:12:12'
    },
    {
        id: 2,
        name: 'car2-asdf',
        car: 2,
        testtype:2,
        is_started: true,
        is_finished: false,
        is_abort: false,
        flow: 1,
        flowversion: 1,
        inbox_organization: 4,
        inbox_user: 7,
        inbox_console: null,
        // outbox_users: 'asdfasdf',
        creater: 1,
        created_date: '2014-12-12 12:12:12',
        modifier: 1,
        modified_date: '2014-12-12 12:12:12'
    },
    {
        id: 3,
        name: 'car3-asdf',
        car: 3,
        testtype:2,
        is_started: true,
        is_finished: false,
        is_abort: false,
        flow: 1,
        flowversion: 1,
        inbox_organization: 4,
        inbox_user: null,
        inbox_console: null,
        // outbox_users: 'asdfasdf',
        creater: 1,
        created_date: '2014-12-12 12:12:12',
        modifier: 1,
        modified_date: '2014-12-12 12:12:12'
    },
    {
        id: 4,
        name: 'car4-asdf',
        car: 4,
        testtype:2,
        is_started: false,
        is_finished: false,
        is_abort: false,
        flow: 1,
        flowversion: 1,
        inbox_organization: 2,
        inbox_user: null,
        inbox_console: null,
        // outbox_users: 'asdfasdf',
        creater: 1,
        created_date: '2014-12-12 12:12:12',
        modifier: 1,
        modified_date: '2014-12-12 12:12:12'
    }
];
