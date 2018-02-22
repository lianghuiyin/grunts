Hsc.AccountRoute = Ember.Route.extend({
    controllerName: 'account',
    beforeModel: function(transition) {
        var sessionController = this.controllerFor("session");
        return sessionController.checkSession(transition);
    },
    model:function(){
        return this.controllerFor("session").get("user");
    },
    afterModel: function(model, transition) {
        if(!model){
            transition.send("goBack");
        }
    },
    activate:function(){
        //这里要run.next的原因是要等view加载到页面后才能执行navigablePush，即要等view.didInsertElement执行完毕
        Ember.run.next(this,function(){
            var controller = this.controllerFor("account");
            controller.send("navigablePush");
        });
        return this;
    },
    actions:{
        willTransition: function(transition) {
            //由于在其子路由中切换到父路由(比如点击导航顶部的主页按钮)时不会触发父路由对应view的didInsertElement函数，所以需要手动显示出对应的界面
            if(transition.targetName == "account.index"){
                $(".account-index.navigable-pane").removeAttr("style").addClass("active");
            }
        },
        goAccountinfo:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('account.accountinfo');
        },
        goAccountpwd:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('account.accountpwd');
        }
    }
});

Hsc.AccountView = Ember.View.extend({
    attributeBindings:"id",
    id:"account",
    classNames:['navigable-container']
});

Hsc.AccountController = Ember.ObjectController.extend({
    needs:["application"],
    actions:{
        navigablePush:function(){
            $(".account-index.navigable-pane").addClass("active");
            Hsc.transitionAnimation = "none";
        },
        logout:function(){
            this.get("controllers.application").send("logout",true);
        }
    }
});

