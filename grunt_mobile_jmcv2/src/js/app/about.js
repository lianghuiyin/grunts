MobileApp.AboutRoute = Ember.Route.extend({
    beforeModel: function(transition) {
    },
    model:function(params, transition){
    },
    deactivate:function(){
        this.get("controller").set("previousPath",null);
    },
    actions:{
        goBack:function(){
            var controller = this.get("controller");
            controller.send("goBack");
        },
        goDns:function(){
            MobileApp.transitionAnimation = "slideHorizontal";
            this.transitionTo('about.dns');
        }
    }
});
MobileApp.AboutController = Ember.ObjectController.extend({
    needs:["application","session","startup"],
    previousPath:null,
    dnsBinding:"MobileApp.dns",
    actions:{
	    goBack:function(){
            var previousPath = this.get("previousPath");
            if(previousPath){
                this.transitionToRoute(previousPath);
            }
            else{
                this.send("goIndex");
            }
	    },
        syncStartup:function(){
            this.get("controllers.startup").send("trySync");
        }
	}
});