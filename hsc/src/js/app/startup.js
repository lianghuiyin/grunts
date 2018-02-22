Hsc.StartupRoute = Ember.Route.extend({
    beforeModel: function(transition) {
        // var sessionController = this.controllerFor("session");
        // return sessionController.checkSession(transition);
    },
    unloadAllRecord:function(){
        this.store.unloadAll("startup");
    },
    model: function(params, transition) {
        // this.loadFixtureData();
        var prom = this.store.createRecord("startup",{
            user: this.controllerFor("session").get("userId"),
            sync_token: new Date()
        }).save(true);
        prom.then(function(answer){
            this.unloadAllRecord();
        }.switchScope(this),function(reason){
            //这里请求失败时整个model没有了要重新构建，并且返回到setupController函数后需要手动设置其model为返回值
            if(reason instanceof DS.InvalidError){
                var errors = new DS.Errors();
                Ember.keys(reason.errors).forEach(function (key) {
                    errors.add(Ember.String.underscore(key), reason.errors[key]);
                });
                return {
                    errors:errors
                };
            }
            this.unloadAllRecord();
        }.switchScope(this));
        return prom;
    },
    loadLocalData:function(){
        //加载本地预定数据
        var store = this.get("store");
        //二期再开发展示台设置功能，一期写死在程序里
        store.pushPayload({
            "exhibitions": Hsc.Exhibition.FIXTURES
        });
        //添加辅助步骤
        store.pushPayload({
            "steps": [{
                Id: "-1",
                Name: '强制结束',
                Type: 'abort',
                Color: 'red',
                DefaultInfo: '',
                Description: '当强行把工作单结束将流转到该步骤',
                HelpText: ''
            },{
                Id: "-2",
                Name: '版本升级',
                Type: 'upgrade',
                Color: 'gray',
                DefaultInfo: '',
                Description: '当工作单要进行流程版本升级将流转到该步骤',
                HelpText: ''
            },{
                Id: "-3",
                Name: '恢复流转',
                Type: 'recove',
                Color: 'green',
                DefaultInfo: '',
                Description: '当工作单的流程版本升级后将流转到该步骤',
                HelpText: ''
            }]
        });
        // Hsc.Exhibition.FIXTURES.forEach(function(item,index){
        //     store.push('exhibition', item);
        // });
        // Hsc.Screenarea.FIXTURES.forEach(function(item,index){
        //     store.push('screenarea', item);
        // });
    },
    setupController: function(controller, model) {
        if(!(model instanceof Hsc.Startup) && model.errors){
            controller.set("model",model);
        }
        else{
            this.loadLocalData();
            controller.set("isStartupLoaded",true);
            controller.send("doSchedules");
            controller.fixScrollBug();
            controller.fixNavbarCollapseInPhone();

            var user = parseInt(model.get("user"));
            if(user > 0){
                var sessionController = this.controllerFor("session");
                sessionController.send("login",user);
            }

            var previousTransition = controller.get("previousTransition");
            if(previousTransition){
                controller.set("previousTransition",null);
                Ember.run.next(this,function(){
                    previousTransition.retry();
                });
            }
            else{
                this.send("goIndex");
            }
        }
    },
    loadFixtureData:function(){
        var store = this.store;
        Hsc.Role.FIXTURES.forEach(function(item,index){
            store.push('role', item);
        });
        Hsc.Organization.FIXTURES.forEach(function(item,index){
            store.push('organization', item);
        });
        Hsc.User.FIXTURES.forEach(function(item,index){
            store.push('user', item);
        });
        Hsc.Car.FIXTURES.forEach(function(item,index){
            store.push('car', item);
        });
        Hsc.Testtype.FIXTURES.forEach(function(item,index){
            store.push('testtype', item);
        });
        Hsc.Flow.FIXTURES.forEach(function(item,index){
            store.push('flow', item);
        });
        Hsc.Flowversion.FIXTURES.forEach(function(item,index){
            store.push('flowversion', item);
        });
        Hsc.Step.FIXTURES.forEach(function(item,index){
            store.push('step', item);
        });
        Hsc.Exhibition.FIXTURES.forEach(function(item,index){
            store.push('exhibition', item);
        });
        Hsc.Screenarea.FIXTURES.forEach(function(item,index){
            store.push('screenarea', item);
        });
        Hsc.Instance.FIXTURES.forEach(function(item,index){
            store.push('instance', item);
        });
        Hsc.Trace.FIXTURES.forEach(function(item,index){
            store.push('trace', item);
        });
        var sessionController = this.controllerFor("session");
        sessionController.set("user",this.store.peekRecord("user",7));
        sessionController.set("isLogined",true);
    }
});

Hsc.Startup = DS.Model.extend({
    user: DS.attr("string"),
    sync_token: DS.attr('date')
});

Hsc.StartupController = Ember.ObjectController.extend({
    needs:["application","changeset","timeout"],
    isStartupLoaded:false,//记录是否加载过启动数据，切换用户时不需要重新加载，除非刷新浏览器
    // isTopPreviousTracesLoaded:false,
    previousTransition:null,
    fixScrollBug:function(){
        //当需要在手机上禁用整个网页的滚动条时，开放下面的代码
        //但要增加一些判断，只在e.target=body元素的时候才禁用touchstart事件的默认行为（即滚动）
        // $("body").on("touchstart",function(e){
        //     
        //     console.log("mousemove--");
        //     e.preventDefault();
        //     console.log("mousemove");
        // });
    },
    fixNavbarCollapseInPhone:function(){
        Ember.run.next(function(){
            $('.navbar-collapse').delegate("li a","click",function(){
                if(Hsc.checkIsInMobile()){
                    Ember.run.next(function(){
                        $('.navbar-collapse').collapse("toggle");
                    });
                }
            });
        });
    },
    actions:{
        retry:function(){
            this.get("target.router").refresh();
        },
        clearLocalDataFromStore:function(){
            var store = this.get("store");
            var isUnloadTraceNeeded = false,
                isUnloadInstanceNeeded = false,
                isUnloadCarNeeded = false;

            //优化性能，定期把trace/instance/car清除掉，但要根据当前所处界面只清除可以清除的部分
            var currentRouteName = this.get("controllers.application.currentRouteName");
            console.log("doSchedules-currentRouteName:" + currentRouteName);
            switch(currentRouteName){
                case "inbox.instance.index":
                    console.log("doSchedules-inbox.instance.index");
                    //待处理工作单详细页
                    isUnloadInstanceNeeded = true;
                    isUnloadCarNeeded = true;
                    break;
                case "outbox.instance.index":
                    console.log("doSchedules-outbox.instance.index");
                    //已处理工作单详细页
                    isUnloadInstanceNeeded = true;
                    isUnloadCarNeeded = true;
                    break;
                case "start.cars.index":
                    console.log("doSchedules-start.cars.index");
                    //车辆列表页
                    isUnloadTraceNeeded = true;
                    isUnloadInstanceNeeded = true;
                    break;
                case "start.cars.new.index":
                    console.log("doSchedules-start.cars.new.index");
                    //新建车辆详细页
                    isUnloadTraceNeeded = true;
                    isUnloadInstanceNeeded = true;
                    break;
                case "car.index":
                    console.log("doSchedules-car.index");
                    //车辆详细页
                    isUnloadTraceNeeded = true;
                    isUnloadInstanceNeeded = true;
                    break;
                case "start.cartrace.index":
                    console.log("doSchedules-start.cartraces.index");
                    //车辆履历列表页
                    isUnloadTraceNeeded = true;
                    isUnloadInstanceNeeded = true;
                    break;
                case "cartrace.index":
                    console.log("doSchedules-cartrace.index");
                    //车辆履历详情页
                    //优化性能，定期把已结束的instance清除掉
                    isUnloadInstanceNeeded = true;
                    break;
                case "start.bedstandtrace.index":
                    console.log("doSchedules-start.bedstandtraces.index");
                    //台架履历列表页
                    isUnloadTraceNeeded = true;
                    isUnloadInstanceNeeded = true;
                    break;
                case "bedstandtrace.index":
                    console.log("doSchedules-bedstandtrace.index");
                    //台架履历详情页
                    //优化性能，定期把已结束的instance清除掉
                    isUnloadInstanceNeeded = true;
                    break;
                case "login":
                    console.log("doSchedules-login");
                    //登录页
                    //不可以执行任何清除操作，因为随时都可能出现登录信息失效
                    //而从其他界面跳转到登录界面并且再次登录后会自动返回上一个界面的情况
                    break;
                case "monitor.instance.index":
                    console.log("doSchedules-monitor.instance.index");
                    //监控箱工作单详细页
                    isUnloadInstanceNeeded = true;
                    isUnloadCarNeeded = true;
                    break;
                default:
                    console.log("doSchedules-default");
                    isUnloadTraceNeeded = true;
                    isUnloadInstanceNeeded = true;
                    isUnloadCarNeeded = true;
                    break;
            }
            if(isUnloadTraceNeeded){
                //优化性能，定期把已结束的trace清除掉
                var traces = store.peekAll("trace").filterBy("is_finished",true);
                traces.forEach(function(trace){
                    var traceInstance = trace.get("instance");
                    store.unloadRecord(trace);
                    if(traceInstance){
                        //其删除后其instance中的traces属性不会自动更新，所以需要手动通知
                        traceInstance.notifyPropertyChange("traces");
                    }
                    // var lastTrace = traceInstance ? traceInstance.get("lastTrace") : null;
                    // //这里不可以直接用traceInstance.get("lastTrace.previous_trace.id")去判断，因为lastTrace.previous_trace可能不在本地拿不到id
                    // if(lastTrace && lastTrace.toJSON().previous_trace != trace.get("id")){
                    //     //要保留instance最后两个步骤，所以如果trace正好是最后一步的上一步骤则不能清除
                    //     store.unloadRecord(trace);
                    //     if(traceInstance){
                    //         //其删除后其instance中的traces属性不会自动更新，所以需要手动通知
                    //         traceInstance.notifyPropertyChange("traces");
                    //     }
                    // }
                });
            }
            if(isUnloadInstanceNeeded){
                //优化性能，定期把已结束的instance清除掉
                var instances = store.peekAll("instance").filterBy("is_finished",true);
                instances.forEach(function(instance){
                    store.unloadRecord(instance);
                });
            }
            if(isUnloadCarNeeded){
                //优化性能，定期把退役的car清除掉
                var cars = store.peekAll("car").filterBy("status","retired");
                cars.forEach(function(car){
                    store.unloadRecord(car);
                });
            }
        },
        doSchedules:function(){
            console.log("StartupController.acctions.doSchedules================");
            //定期攫取数据库中的数据变化
            var changesetController = this.get("controllers.changeset");
            Ember.run.later(function(){
                changesetController.send("tryFetch");

                var self = arguments.callee;
                Ember.run.later(function(){
                    self();
                },18000);
            },24000);

            //定期计算超时时间关联的颜色值
            var timeoutController = this.get("controllers.timeout");
            Ember.run.later(function(){
                timeoutController.send("tryRefresh");

                var self = arguments.callee;
                Ember.run.later(function(){
                    self();
                },220000);
            },300000);

            //定期把本地store中无用的数据清除掉以释放内存
            Ember.run.later(this,function(){
                this.send("clearLocalDataFromStore");

                var self = arguments.callee;
                Ember.run.later(this,function(){
                    self.switchScope(this)();
                },160000);
            },120000);

            // //请求最后一步trace的previous_traces
            // Ember.run.later(this,function(){
            //     var self = arguments.callee;
            //     this.store.find('trace', { 
            //         type: "top_previous_traces",
            //         count:1
            //     }).then(function(answer){
            //         console.log("StartupController.acctions.top_previous_traces_success================");
            //         this.set("isTopPreviousTracesLoaded",true);
            //     }.switchScope(this),function(){
            //         console.log("StartupController.acctions.top_previous_traces_error================");
            //         Ember.run.later(this,function(){
            //             self.switchScope(this)();
            //         },5000);
            //     }.switchScope(this));
            // },5000);
        }
    }
});

