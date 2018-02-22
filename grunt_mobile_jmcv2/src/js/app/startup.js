MobileApp.StartupRoute = Ember.Route.extend({
    beforeModel: function(transition) {
        var sessionController = this.controllerFor("session");
        return sessionController.checkSession(transition);
    },
    model: function(params, transition) {
        var promise = this.controllerFor("startup").getStartup();
        promise.then(function(result){
        }.switchScope(this),function(reason){
        }.switchScope(this));
        return promise;
    },
    setupController: function(controller, model) {
        if(model){
            controller.loadStartup(model);
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
});

MobileApp.Startup = MobileApp.Model.extend({
    members:["token","log_id"],
    action:"startup",
    token: "",
    log_id:""
});

MobileApp.StartupController = Ember.ObjectController.extend({
    needs:["application","session","projects","unit_configs","places","exp_types"],
    isStartupLoaded:false,//记录是否加载过启动数据，切换用户时需要重新加载
    previousTransition:null,
    isLoadingSync:false,
    sync:"",//最后一次同步的时间串
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
    getStartup:function(){
        var sessionController = this.get("controllers.session");
        var model = MobileApp.Startup.create({
            token:sessionController.genrateToken(),
            log_id:localStorage.getItem("log_id")
        });
        return model.tryPost();
    },
    loadStartup:function(model){
        var projects = model.get("projects");
        this.get("controllers.projects").send("load",projects);
        var unit_configs = model.get("unit_configs");
        this.get("controllers.unit_configs").send("load",unit_configs);
        var places = model.get("places");
        this.get("controllers.places").send("load",places);
        var exp_types = model.get("exp_types");
        this.get("controllers.exp_types").send("load",exp_types);
        var sync = model.get("sync");
        this.set("sync",sync);
    },
    actions:{
        retry:function(){
            this.get("target.router").refresh();
        },
        trySync:function(){
            this.set("isLoadingSync",true);
            var promise = this.getStartup();
            promise.then(function(result){
                this.set("isLoadingSync",false);
                this.loadStartup(result);
            }.switchScope(this),function(reason){
                this.set("isLoadingSync",false);
            }.switchScope(this));
        }
    }
});

