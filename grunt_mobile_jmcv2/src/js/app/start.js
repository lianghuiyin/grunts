MobileApp.StartRoute = Ember.Route.extend({
    beforeModel: function(transition) {
        var sessionController = this.controllerFor("session");
        sessionController.checkSession(transition);
    },
    model: function(params, transition) {
    },
    activate:function(){
        Ember.run.next(this,function(){
            $(".screenicons-box").screenicons();
        });
        return this;
    },
    actions:{
    }
});

MobileApp.StartController = Ember.Controller.extend({
});


