Hsc.StartSettingRoute = Ember.Route.extend({
    renderTemplate: function() {
        this.render({ outlet: 'setting' });
    },
    beforeModel: function(transition) {
        var sessionController = this.controllerFor("session");
        return sessionController.checkIsAdmin(transition);
    },
    activate:function(){
        //这里要run.next的原因是要等view加载到页面后才能执行navigablePush，即要等view.didInsertElement执行完毕
        Ember.run.next(this,function(){
            var controller = this.controllerFor("start_setting");
            controller.send("navigablePush");
        });
        return this;
    },
    deactivate:function(){
        var controller = this.controllerFor("start_setting");
        controller.send("navigablePop");
        return this;
    },
    actions:{
        goBack:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('start');
        },
        goRoles:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('roles');
        },
        goOrganizations:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('organizations');
        },
        goUsers:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('users');
        },
        goCars:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('cars');
        },
        goVehicletypes:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('vehicletypes');
        },
        goTesttypes:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('testtypes');
        },
        goBedstands:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('bedstands');
        },
        goConsoles:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('consoles');
        },
        goFlows:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('flows');
        },
        goExhibitions:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('exhibitions');
        }
    }
});

Hsc.StartSettingView = Ember.View.extend({
    classNames:['start-setting','navigable-pane','collapse']
});
Hsc.StartSettingController = Ember.ObjectController.extend({
    needs:["application"],
    actions:{
        navigablePush:function(){
            $(".start-index.navigable-pane").navigablePush({
                targetTo:".start-setting.navigable-pane",
                animation:Hsc.transitionAnimation
            });
            Hsc.transitionAnimation = "none";
        },
        navigablePop:function(){
            $(".start-setting.navigable-pane").navigablePop({
                targetTo:".start-index.navigable-pane",
                animation:Hsc.transitionAnimation
            });
            Hsc.transitionAnimation = "none";
        }
    }
});

