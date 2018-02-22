Hsc.LoginRoute = Ember.Route.extend({
    beforeModel: function(transition) {
        var isLogined = this.controllerFor("session").get("isLogined");
        if(isLogined){
            this.transitionTo('start');
        }
    },
    model:function(params, transition){
    	return this.store.createRecord("login");
    },
    deactivate:function(){
        //把所有用于交互的临时数据删除
        Ember.run.next(this,function(){
            this.store.unloadAll("login");
        }.switchScope(this));
        return this;
    }
});

Hsc.Login = DS.Model.extend({
    log_name: DS.attr('string'),
    log_password: DS.attr('string'),
    is_passed:DS.attr('boolean', {defaultValue: false})
});

Hsc.LoginController = Ember.ObjectController.extend({
    needs:["application","session"],
    passwordDidChange:function(){
    	if(this.get("model.log_password.length")){
            this.get("model.errors").remove('server_side_error');
    	}
    }.observes("model.log_password"),
    actions:{
	    go:function(options){
            this.get("model").save().then(function(result){
                if(result.get("is_passed")){
                    $("#login").remove();//因为显示加载中的时候登录界面没有立刻消失，所以这里强行移除界面
                    this.get("controllers.session").send("login",result.id,true);
                }
            }.switchScope(this),function(reason){
                this.set("log_password","");
            }.switchScope(this));
	    }
	}
});