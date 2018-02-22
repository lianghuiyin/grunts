Hsc.AccountAccountpwdRoute = Ember.Route.extend({
    controllerName: 'account.accountpwd',
    renderTemplate: function(controller) {
        this.render('account/accountpwd',{ outlet: 'accountpwd',controller: controller });
    },
    setupController: function(controller, model) {
        var curUserId = controller.get("controllers.account.model.id");
        controller.set("model",this.store.createRecord('accountpwd',{
            user: curUserId
        }));
    },
    afterModel: function(model, transition) {
    },
    activate:function(){
        //这里要run.next的原因是要等view加载到页面后才能执行navigablePush，即要等view.didInsertElement执行完毕
        Ember.run.next(this,function(){
            var controller = this.controllerFor("account_accountpwd");
            controller.send("navigablePush");
        });
        return this;
    },
    deactivate:function(){
        var controller = this.controllerFor("account_accountpwd");
        var model = controller.get("model");
        model && model.rollbackAttributes();
        controller.send("navigablePop");
        //把所有用于交互的临时数据删除
        Ember.run.next(this,function(){
            this.store.unloadAll("accountpwd");
        }.switchScope(this));
        return this;
    },
    actions:{
        goBack:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('account');
        }
    }
});

Hsc.Accountpwd = DS.Model.extend({
    user: DS.attr('string'),
    old_password: DS.attr('string'),
    new_password: DS.attr('string'),
    confirm_password: DS.attr('string'),
    oldPasswordDidChange:function(){
        var old_password = this.get("old_password");
        if(this.get("hasDirtyAttributes")){
            if(Ember.isEmpty(old_password)){
                this.get('errors').add('old_password', '不能为空');
            }
        }
    }.observes("old_password"),
    newPasswordDidChange:function(){
        var new_password = this.get("new_password");
        if(this.get("hasDirtyAttributes")){
            if(Ember.isEmpty(new_password)){
                this.get('errors').add('new_password', '不能为空');
            }
            else if(!HOJS.lib.valiPasswordValue(new_password)){
                this.get('errors').add('new_password', '长度在6~16之间，只能包含字符、数字和下划线');
            }
        }
    }.observes("new_password"),
    confirmPasswordDidChange:function(){
        var confirm_password = this.get("confirm_password"),
            new_password = this.get("new_password");
        if(this.get("hasDirtyAttributes")){
            if(Ember.isEmpty(confirm_password)){
                this.get('errors').add('confirm_password', '不能为空');
            }
            else if(new_password != confirm_password){
                this.get('errors').add('confirm_password', '两次输入的密码必须相同');
            }
        }
    }.observes("confirm_password")
});

Hsc.AccountAccountpwdView = Ember.View.extend({
    classNames:['account-accountpwd','navigable-pane','collapse']
});
Hsc.AccountAccountpwdController = Ember.ObjectController.extend({
    needs:["application","account"],
    pannelTitle:"修改密码",
    actions:{
        navigablePush:function(){
            $(".account-index.navigable-pane").navigablePush({
                targetTo:".account-accountpwd.navigable-pane",
                animation:Hsc.transitionAnimation
            });
            Hsc.transitionAnimation = "none";
        },
        navigablePop:function(){
            $(".account-accountpwd.navigable-pane").navigablePop({
                targetTo:".account-index.navigable-pane",
                animation:Hsc.transitionAnimation
            });
            Hsc.transitionAnimation = "none";
        },
        save:function(){
            this.get('model').save().then(function(answer){
                this.send("goBack");
            }.switchScope(this), function(reason){
            }.switchScope(this));
        }
    }
});




