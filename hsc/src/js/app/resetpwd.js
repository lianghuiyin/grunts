
Hsc.UserResetpwdRoute = Ember.Route.extend({
    renderTemplate: function(controller) {
        this.render('user/resetpwd', { into:'start', outlet: 'user', controller: controller});
    },
    beforeModel: function(transition) {
    },
    model: function () {
        var curUserId = this.paramsFor("user").user_id;
        return this.store.createRecord('resetpwd',{
            user: curUserId
        });
    },
    afterModel: function(model, transition) {
    },
    activate:function(){
        this.controllerFor("user_resetpwd").set("isNeedToPop",false);
        //这里要run.next的原因是要等view加载到页面后才能执行navigablePush，即要等view.didInsertElement执行完毕
        Ember.run.next(this,function(){
            var controller = this.controllerFor("user_resetpwd");
            controller.send("navigablePush");
        });
        return this;
    },
    deactivate:function(){
        var controller = this.controllerFor("user_resetpwd");
        var model = controller.get("model");
        model && model.rollbackAttributes();
        //这里加next的原因是不加的话，返回就没有动画效果
        Ember.run.next(this,function(){
            controller.send("navigablePop");
        });
        //把所有用于交互的临时数据删除
        Ember.run.next(this,function(){
            this.store.unloadAll("resetpwd");
        }.switchScope(this));
        return this;
    },
    actions:{
        goBack:function(){
            var controller = this.controllerFor("user_resetpwd");
            controller.set("isNeedToPop",true);
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('users');
        },
        goIndex:function(){
            this.transitionTo('user.index');
        }
    }
});

Hsc.Resetpwd = DS.Model.extend({
    user: DS.attr('string'),
    new_password: DS.attr('string', {defaultValue: "hhhhhh"}),
    newPasswordDidChange:function(){
        var new_password = this.get("new_password");
        if(this.get("hasDirtyAttributes")){
            if(Ember.isEmpty(new_password)){
                this.get('errors').add('new_password', '不能为空');
            }
            else if(!HOJS.lib.valiPasswordValue(new_password)){
                this.get('errors').add('new_password', '以字母开头，长度在6~16之间，只能包含字符、数字和下划线');
            }
        }
    }.observes("new_password")
});

Hsc.UserResetpwdView = Ember.View.extend({
    classNames:['start-setting-users-user-resetpwd','navigable-pane','collapse']
});

Hsc.UserResetpwdController = Ember.ObjectController.extend({
    needs:["application","user"],
    modelName:"用户",
    pannelTitle:"重置用户密码",
    helpInfo:function(){
        return "保存后用户密码将被重置为:%@".fmt(this.get("model.new_password"));
    }.property("model.new_password"),
    isNeedToPop:false,
    actions:{
        navigablePush:function(){
            var controller = this;
            $(".start-setting-users-user.navigable-pane").navigablePush({
                targetTo:".start-setting-users-user-resetpwd.navigable-pane",
                animation:Hsc.transitionAnimation,
                callBack:function(){
                    if(controller.get("controllers.user.id") != controller.get("model.user")){
                        controller.send("goBack");
                    }
                }
            });
            Hsc.transitionAnimation = "none";
        },
        navigablePop:function(){
            if(this.get("isNeedToPop")){
                $(".start-setting-users-user-resetpwd.navigable-pane").navigablePop({
                    targetTo:".start-setting-users.navigable-pane",
                    animation:Hsc.transitionAnimation
                });
                Hsc.transitionAnimation = "none";
            }
            else{
                $(".start-setting-users-user.navigable-pane").addClass("active");
            }
        },
        save:function(){
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






