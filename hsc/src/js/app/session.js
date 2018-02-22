Hsc.SessionController = Ember.ObjectController.extend({
    needs:["application","startup"],
    isLogined:false,
    user:null,
    isSessionLost:false,
    lastSetURL:null,
    // inboxsBinding:"inboxInstances",
    // inboxInstances: function () {
    //     //这里不可以用store.all().filterBy函数，因为那个函数不会自动更新
    //     return this.store.filter('instance', function (instance) {
    //         return instance.get("isInbox");
    //     });
    // }.property(),
    userIdDidChange:function(){
        var isStartupLoaded = this.get("controllers.startup.isStartupLoaded"),
        	userId = this.get("userId");
        if(isStartupLoaded && userId){
        	this.set("user",this.store.peekRecord("user",userId));
        }
        else{
        	this.set("user",null);
        }
    }.observes("userId","controllers.startup.isStartupLoaded"),
    userId:0,
    previousTransition:null,
    userDidChange:function(){
    	Hsc.set("currentUser",this.get("user"));
    }.observes("user"),
    checkSession:function(transition){
		if(!this.get("isLogined")){
            var rootUrl = this.container.lookup('adapter:application').get("namespace");
            var promise = Ember.$.getJSON('/%@/session.ashx?timeTag=%@'.fmt(rootUrl,(new Date()).getTime()));
	        return promise.then(function(answer){
	        	var isLogined = answer.isLogined,
	        		userId = answer.userId;
	        	if(isLogined){
	        		this.set("isLogined",true);
	        		this.set("userId",userId);
					this.send("login",userId);
	        	}
	        	else{
	        		this.set("previousTransition",transition)
			        transition.send("goLogin");
	        	}
	        }.switchScope(this),function(){
        		this.set("previousTransition",transition)
		        transition.send("goLogin");
	        }.switchScope(this));
		}
    },
    checkIsAdmin:function(transition){
        if(!this.get("user.isAdmin")){
        	console.log("is_power_off");
            transition.send("goBack");
        }
    },
    checkIsCarOwners:function(transition){
        //如果不是车辆负责组用户，则没有车辆管理权限
        var user = this.get("user");
        if(user && !user.getIsCarOwners()){
            console.log("is_power_off");
            transition.send("goBack");
        }
    },
    isCarOwners:function(){
        var user = this.get("user");
        return user ? user.getIsCarOwners() : false;
    }.property("user.organizations.@each.is_car_owners"),
    checkIsBedstandOwners:function(transition){
        //如果不是台架负责组用户，则没有台架管理权限
        var user = this.get("user");
        if(user && !user.getIsBedstandOwners()){
            console.log("is_power_off");
            transition.send("goBack");
        }
    },
    isBedstandOwners:function(){
        var user = this.get("user");
        return user ? user.getIsBedstandOwners() : false;
    }.property("user.organizations.@each.is_bedstand_owners"),
    isBedstandsManager:function(){
        var user = this.get("user");
        return user ? user.getIsBedstandsManger() : false;
    }.property("user.organizations.@each.is_bedstand_owners","user.organizations.length"),
    checkIsConsoleOrg:function(transition){
    	var lastConsole = this.store.peekAll('console').get("lastObject");
        if(this.get("user.organization.id") != lastConsole.get("organization.id")){
        	console.log("is_power_off");
            transition.send("goBack");
        }
    },
    isSessionLostDidChange:function(){
    	if(this.get("isSessionLost")){
            Ember.run.later(this,function(){
	    		this.set("lastSetURL",this.get("controllers.application.target.location.lastSetURL"));
		    	this.send("logout",true);
            },3000);
    	}
    }.observes("isSessionLost"),
    actions:{
	    login:function(userId,isFromLogin){
	    	this.set("isSessionLost",false);
	        this.set("userId",userId);
	        this.set("isLogined",true);
	        var lastSetURL = this.get("lastSetURL");
	        var previousTransition = this.get("previousTransition");
	        if(lastSetURL){
		    	this.set("lastSetURL",null);
	        	this.transitionToRoute(lastSetURL);
	        }
	        else if(previousTransition){
	            this.set("previousTransition",null);
	            previousTransition.retry();
	        }
	        else if(isFromLogin){
	        	this.send("goIndex");
	        }
	    },
	    logout:function(isNeedToLogin){
	        this.set("userId",0);
	        this.set("user",null);
	        this.set("isLogined",false);
	        if(isNeedToLogin){
		        this.send("goLogin");
	        }
	    }
    }
});