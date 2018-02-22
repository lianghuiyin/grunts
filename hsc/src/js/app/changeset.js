Hsc.Changeset = DS.Model.extend({
    user: DS.attr("string"),
    sync_token: DS.attr('date')
});

Hsc.ChangesetController = Ember.ObjectController.extend({
    needs:["application","session"],
    lastErrorToken:null,//记录最后一次请求changeset错误的时间，当其变化时重新攫取changeset
    lastErrorTokenDidChange:function(){
        this.send("tryFetch");
    }.observes("lastErrorToken"),
    afterChangesetFetched:function(isSuccess,userId){
        var store = this.store;
        store.unloadAll("changeset");
        if(isSuccess){
            var userId = parseInt(userId);
            var sessionController = this.get("controllers.session");
            var isLogined = sessionController.get("isLogined"),
                isLoginedNew = userId ? true : false;
            var currentRouteName = this.get("controllers.application.currentRouteName");
            var isInLoginRoute = currentRouteName == "login";
            if(isLogined != isLoginedNew){
                //登录状态变化时做相应处理
                var isLoginNeeded = false;
                if(currentRouteName != "exhibitionshow" 
                    && currentRouteName != "contact"){
                    isLoginNeeded = true;
                }
                if(isLoginedNew){
                    sessionController.send("login",userId,isInLoginRoute);
                }
                else{
                    sessionController.set("lastSetURL",this.get("controllers.application.target.location.lastSetURL"));
                    sessionController.send("logout",isLoginNeeded);
                }
            }
            var curUserId = sessionController.get("userId");
            if(userId != curUserId){
                sessionController.send("login",userId,isInLoginRoute);
            }
        }
    },
    actions:{
        tryFetch:function(){
            var prom = this.store.createRecord("changeset",{
                user: this.get("controllers.session").get("userId"),
                sync_token: new Date()
            }).save(true);
            prom.then(function(answer){
                this.afterChangesetFetched(true,answer.get("user"));
            }.switchScope(this), function(reason){
                this.afterChangesetFetched(false);
            }.switchScope(this));
            return prom;
        }
    }
});

Hsc.Deleted = DS.Model.extend({
    model: DS.attr("string"),
    target_ids: DS.attr('string'),
    created_date: DS.attr('date')
});

