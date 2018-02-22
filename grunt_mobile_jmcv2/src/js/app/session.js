MobileApp.SessionController = Ember.ObjectController.extend({
    needs:["application","startup"],
    isLogined:false,
    logId:0,
    logName:"",
    role:null,
    roleName:"",
    power:null,
    previousTransition:null,
    sharedkey:"horizon2003_jmcv2",
    genrateToken:function(){
        var exp = Math.round(new Date().addHours(2).getTime()/1000);
        var sharedkey = this.get("sharedkey");
        var ck = window.CryptoJS.enc.Latin1.parse(sharedkey).toString();
        var info = Ember.Object.create({
            exp:exp,
            log_id:this.get("logId"),
            log_name:this.get("logName"),
            role:this.get("role"),
            role_name:this.get("roleName"),
            power:this.get("power")
        });
        return KJUR.jws.JWS.sign(null, '{"alg":"HS256","typ":"JWT"}', JSON.stringify(info.classifys()), ck)
    },
    checkSession:function(transition){
        var isLogined = this.get("isLogined");
        if(!isLogined){
            this.set("previousTransition",transition);
            transition.send("goLogin");
        }
    },
    // checkIsAdmin:function(transition){
    //     if(!this.get("user.isAdmin")){
    //     	console.log("is_power_off");
    //         transition.send("goBack");
    //     }
    // },
    // checkIsCarOwners:function(transition){
    //     //如果不是车辆负责组用户，则不有车辆管理权限
    //     if(!this.get("user.organization.is_car_owners")){
    //         console.log("is_power_off");
    //         transition.send("goBack");
    //     }
    // },
    // checkIsConsoleOrg:function(transition){
    // 	var lastConsole = this.store.all('console').get("lastObject");
    //     if(this.get("user.organization.id") != lastConsole.get("organization.id")){
    //     	console.log("is_power_off");
    //         transition.send("goBack");
    //     }
    // },
    actions:{
	    login:function(logInfo,isFromLogin){
	        this.set("logId",logInfo.get("log_id"));
            this.set("logName",logInfo.get("log_name"));
            this.set("role",logInfo.get("role"));
            this.set("roleName",logInfo.get("role_name"));
            this.set("power",logInfo.get("power"));
	        this.set("isLogined",true);
            if(isFromLogin){
                this.send("syncLocal","login",logInfo);
            }
	        var previousTransition = this.get("previousTransition");
            var startupController = this.get("controllers.startup");
            if(startupController.get("isStartupLoaded")){
                if(previousTransition){
                    this.set("previousTransition",null);
                    previousTransition.retry();
                }
                else if(isFromLogin){
                    this.send("goIndex");
                }
            }
            else{
                this.transitionToRoute("startup");
            }
	    },
	    logout:function(isNeedToLogin){
            this.set("logId",0);
            this.set("logName","");
            this.set("role",null);
            this.set("roleName","");
            this.set("power",null);
            this.set("isLogined",false);
            this.send("syncLocal","logout");
	        if(isNeedToLogin){
		        this.send("goLogin");
	        }
	    },
        syncLocal:function(kind,logInfo){
            if(!window.localStorage){
                return;
            }
            if(!logInfo){
                logInfo = {};
            }
            switch(kind){
                case "login":
                    localStorage.setItem("log_id",logInfo.get("log_id"));
                    localStorage.setItem("log_name",logInfo.get("log_name"));
                    localStorage.setItem("role",logInfo.get("role"));
                    localStorage.setItem("role_name",logInfo.get("role_name"));
                    localStorage.setItem("power",logInfo.get("power"));
                    break;
                case "logout":
                    localStorage.clear();
                    break;
                case "init":
                    //同步localStorage中的域名地址到MobileApp
                    var dns = localStorage.getItem("dns");
                    if(dns){
                        MobileApp.set("dns",dns);
                    }
                    //同步localStorage中的登录信息
                    var logId = localStorage.getItem("log_id");
                    if(logId){
                        logInfo = Ember.Object.create({
                            log_id:logId,
                            log_name:localStorage.getItem("log_name"),
                            role:localStorage.getItem("role"),
                            role_name:localStorage.getItem("role_name"),
                            power:localStorage.getItem("power"),
                        });
                        this.send("login",logInfo);
                    }
                    //如果需要在多个窗口中同步session数据则需要定时检查数据变化
                    // setInterval(function(){
                    //     //判断localStorage中的数据与sessionController中数据是否一样，如果不一样则同步
                    // }, 3000); 
                    break;
            }
        }
    }
});