Hsc.AccountAccountinfoRoute = Ember.Route.extend({
    controllerName: 'account.accountinfo',
    beforeModel: function() {
    },
    model:function(params){
        return this.modelFor("account");
    },
    afterModel: function(model, transition) {
    },
    activate:function(){
        //这里要run.next的原因是要等view加载到页面后才能执行navigablePush，即要等view.didInsertElement执行完毕
        Ember.run.next(this,function(){
            var controller = this.controllerFor("account_accountinfo");
            controller.send("navigablePush");
        });
        return this;
    },
    deactivate:function(){
        var controller = this.controllerFor("account_accountinfo");
        controller.send("navigablePop");
        return this;
    },
    actions:{
        goBack:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('account');
        }
    }
});
Hsc.AccountAccountinfoIndexRoute = Ember.Route.extend({
    controllerName: 'account.accountinfo',
    renderTemplate: function(controller) {
        controller.set("isEditing",false);
        controller.set("pannelTitle",Hsc.get("detailModelTag").fmt(controller.get("modelName")));
        this.render('account/accountinfo',{ outlet: 'accountinfo',controller: controller });
    },
    actions:{
        goEdit:function(){
            this.transitionTo('account.accountinfo.edit');
        }
    }
});
Hsc.AccountAccountinfoEditRoute = Ember.Route.extend({
    controllerName: 'account.accountinfo',
    renderTemplate: function(controller) {
        controller.set("isEditing",true);
        controller.set("pannelTitle",Hsc.get("editModelTag").fmt(controller.get("modelName")));
        this.render('account/accountinfo', {outlet: 'accountinfo',controller: controller});
    },
    deactivate:function(){
        var controller = this.controllerFor("account_accountinfo");
        var model = controller.get("model");
        // model && model.rollbackAttributes();
        //这里要增加删除的判断，是因为如果该记录被其他用户删除然后push过来的话，rollbackAttributes会把删除的记录撤销
        if(model && !model.get("isDeleted")){
            model.rollbackAttributes();
        }
        return this;
    },
    actions:{
        goIndex:function(){
            this.transitionTo('account.accountinfo.index');
        }
    }
});

Hsc.AccountAccountinfoView = Ember.View.extend({
    classNames:['account-accountinfo','navigable-pane','collapse']
});
Hsc.AccountAccountinfoController = Ember.ObjectController.extend({
    needs:["application"],
    isEditing:false,
    modelName:"账户",
    pannelTitle:"账户详情",
    helpInfo:"帮助信息",
    actions:{
        navigablePush:function(){
            $(".account-index.navigable-pane").navigablePush({
                targetTo:".account-accountinfo.navigable-pane",
                animation:Hsc.transitionAnimation
            });
            Hsc.transitionAnimation = "none";
        },
        navigablePop:function(){
            $(".account-accountinfo.navigable-pane").navigablePop({
                targetTo:".account-index.navigable-pane",
                animation:Hsc.transitionAnimation
            });
            Hsc.transitionAnimation = "none";
        },
        edit: function () {
            this.send("goEdit");
        },
        setIsDeveloper:function(value){
            this.get('model').set("is_developer",value);
        },
        save:function(){
            this.get('model').save().then(function(answer){
                this.send("goIndex");
            }.switchScope(this), function(reason){
            }.switchScope(this));
        },
        cancel:function(){
            this.send("goIndex");
        }
    }
});




