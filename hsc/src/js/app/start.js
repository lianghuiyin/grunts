Hsc.StartRoute = Ember.Route.extend({
    beforeModel: function(transition) {
        var sessionController = this.controllerFor("session");
        return sessionController.checkSession(transition);
    },
    activate:function(){
        //这里要run.next的原因是要等view加载到页面后才能执行navigablePush，即要等view.didInsertElement执行完毕
        Ember.run.next(this,function(){
            $(".start-index.navigable-pane").removeAttr("style").addClass("active");
            Hsc.transitionAnimation = "none";
        });
        return this;
    },
    actions:{
        willTransition: function(transition) {
            //由于在其子路由中切换到父路由(比如点击导航顶部的主页按钮)时不会触发父路由对应view的didInsertElement函数，所以需要手动显示出对应的界面
            if(transition.targetName == "start.index"){
                $(".start-index.navigable-pane").removeAttr("style").addClass("active");
            }
        },
        goInstances:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('start.instances.inbox');
        },
        goCars:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('start.cars');
        },
        goBedstands:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('start.bedstands');
        },
        goCartraces:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('start.cartraces');
        },
        goBedstandtraces:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('start.bedstandtraces');
        },
        goSetting:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('start.setting');
        },
        goConsoleWindow:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('start.consolewindow');
        },
        goMonitorInstances:function(name){
            this.controllerFor("start.instances.monitor").set("searchKey",name);
            this.transitionTo('start.instances.monitor');
        },
        goMonitorInstance:function(instance){
            this.transitionTo('monitor.instance',instance);
        }
    }
});

Hsc.StartView = Ember.View.extend({
    attributeBindings:"id",
    id:"home",
    classNames:['navigable-container']
});

Hsc.StartController = Ember.Controller.extend({
    needs:["application","session"],
    consoles:function(){
        var currentUser = Hsc.get("currentUser");
        if(!currentUser){
            return [];
        }
        else{
            //这里不可以用store.all().filterBy函数，因为那个函数不会自动更新
            return this.store.filter('console', function (console) {
                return currentUser.get("organization.id") == console.get("organization.id");
            });
        }
    }.property('Hsc.currentUser')
});


