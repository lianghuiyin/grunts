MobileApp.LoginRoute = Ember.Route.extend({
    beforeModel: function(transition) {
        var sessionController = this.controllerFor("session");
        var isLogined = sessionController.get("isLogined");
        if(isLogined){
            this.transitionTo('start');
        }
    },
    model:function(params, transition){
        return MobileApp.Login.create();
    },
    deactivate:function(){
        return this;
    }
});

MobileApp.Login = MobileApp.Model.extend({
    members:["log_name","log_password"],
    action:"login",
    log_name: "",
    log_password: ""
});

MobileApp.LoginController = Ember.ObjectController.extend({
    needs:["application","session"],
    passwordDidChange:function(){
    	if(this.get("model.log_password.length")){
            this.get("model.errors").remove('server_side_error');
    	}
    }.observes("model.log_password"),
    actions:{
	    go:function(){
            var promise = this.get("model").tryPost();
            promise.then(function(result){
                if(result.get("is_passed")){
                    // $("#login").remove();//因为显示加载中的时候登录界面没有立刻消失，所以这里强行移除界面
                    this.get("controllers.session").send("login",result,true);
                }
            }.switchScope(this),function(reason){
                this.set("log_password","");
            }.switchScope(this));
	    }
	}
});