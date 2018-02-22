MobileApp.UnitplayPlayfilterRoute = Ember.Route.extend({
    model:function(params, transition){
        var filter = this.controllerFor("unitplay").get("filter");
        return filter ? MobileApp.Playfilter.create(filter.getProperties(filter.get("members"))) : MobileApp.Playfilter.create();
    },
    activate:function(){
        //这里要run.next的原因是要等view加载到页面后才能执行navigablePush，即要等view.didInsertElement执行完毕
        Ember.run.next(this,function(){
            var controller = this.get("controller");
            controller.send("navigablePush");
        });
        return this;
    },
    deactivate:function(){
        var controller = this.controllerFor("unitplay_playfilter");
        controller.send("navigablePop");
        return this;
    },
    actions:{
        goBack:function(){
            MobileApp.transitionAnimation = "slideHorizontal";
            this.transitionTo('unitplay');
        }
    }
});

MobileApp.Playfilter = MobileApp.Model.extend({
    members:["unit_config","project","car","place","exp_type","start_time","end_time"],
    action:"playfilter",
    unit_config:null,
    project:null,
    car:null,
    place:null,
    exp_type:null,
    start_time:null,
    end_time:null,
    dateDidChange:function(){
        var start_time = this.get("start_time"),
            end_time = this.get("end_time");
        var errMsgForSt,errMsgForEt;

        if(start_time && end_time){
            if(!HOJS.lib.compareTime(start_time,end_time,true)){
                errMsgForSt = "开始时间必须小于结束时间";
                errMsgForEt = "开始时间必须小于结束时间";
            }
        }
        if(Ember.isEmpty(errMsgForSt)){
            this.get('errors').remove('start_time');
        }
        else{
            this.get('errors').remove('start_time');
            this.get('errors').add('start_time', errMsgForSt);
        }
        if(Ember.isEmpty(errMsgForEt)){
            this.get('errors').remove('end_time');
        }
        else{
            this.get('errors').remove('end_time');
            this.get('errors').add('end_time', errMsgForEt);
        }
    }.observes("start_time","end_time")
});

MobileApp.UnitplayPlayfilterView = Ember.View.extend({
    classNames:['unitplay-playfilter','navigable-pane','collapse','h100per']
});

MobileApp.UnitplayPlayfilterController = Ember.ObjectController.extend({
    needs:["session","projects","unit_configs","cars","places","exp_types","unitplay"],
    initDateTime:function(){
        var minDate = (new Date()).addYears(-50),
            maxDate = (new Date()).addYears(50);
        var options = {
            theme: "ios",
            mode: "scroller",
            display: "modal",
            lang: "zh",
            minDate: minDate,
            maxDate: maxDate,
            stepMinute: 1,
            dateFormat:"yyyy-mm-dd",
            timeFormat:"HH:ii:ss",
            timeWheels:"HHiiss",
            // defaultValue:new Date(expStartTime)
            buttons:['set', 'cancel', 'clear', 'now']
        }
        // options.defaultValue = new Date(expStartTime);
        $("#start_time").mobiscroll().datetime(options);
        $("#end_time").mobiscroll().datetime(options);
    },
    unitConfigs:function(){
        return this.get("controllers.unit_configs.model");
    }.property("controllers.unit_configs.length"),
    selectedUnitConfig:function(k,v){
        var model = this.get('model');
        if (v === undefined) {
            return model.get("unit_config");
        } else {
            model.set('unit_config', v);
            return v;
        }
    }.property("model.unit_config"),
    projects:function(){
        return this.get("controllers.projects.model");
    }.property("controllers.projects.length"),
    selectedProject:function(k,v){
        var model = this.get('model');
        if (v === undefined) {
            return model.get("project");
        } else {
            model.set('project', v);
            return v;
        }
    }.property("model.project"),
    cars:function(){
        return this.get("controllers.cars.model");
    }.property("controllers.cars.length"),
    selectedCar:function(k,v){
        var model = this.get('model');
        if (v === undefined) {
            return model.get("car");
        } else {
            model.set('car', v);
            return v;
        }
    }.property("model.car"),
    projectDidChange:function(){
        var selProject = this.get("model.project");
        this.get("controllers.cars").set("project",selProject);
    }.observes("model.project"),
    expTypes:function(){
        return this.get("controllers.exp_types.model");
    }.property("controllers.exp_types.length"),
    selectedExpType:function(k,v){
        var model = this.get('model');
        if (v === undefined) {
            return model.get("exp_type");
        } else {
            model.set('exp_type', v);
            return v;
        }
    }.property("model.exp_type"),
    places:function(){
        return this.get("controllers.places.model");
    }.property("controllers.places.length"),
    selectedPlace:function(k,v){
        var model = this.get('model');
        if (v === undefined) {
            return model.get("place");
        } else {
            model.set('place', v);
            return v;
        }
    }.property("model.place"),
    actions:{
        navigablePush:function(){
            $(".unitplay-index.navigable-pane").navigablePush({
                targetTo:".unitplay-playfilter.navigable-pane",
                animation:MobileApp.transitionAnimation
            });
            MobileApp.transitionAnimation = "none";
            this.initDateTime();
        },
        navigablePop:function(){
            $(".unitplay-playfilter.navigable-pane").navigablePop({
                targetTo:".unitplay-index.navigable-pane",
                animation:MobileApp.transitionAnimation
            });
            MobileApp.transitionAnimation = "none";
        },
        search:function(){
            this.get("model").notifyAllPropertyChange();
            if(this.get("model.errors.length") == 0){
                var unitplayController = this.get("controllers.unitplay");
                unitplayController.set("model.filter",this.get("model"));
                unitplayController.set("model.current_page",1);
                unitplayController.set("model.total_record",0);
                unitplayController.set("isLastLoaded",false);
                unitplayController.get("experiments").clear();
                unitplayController.send("fetchExperiments");
                this.send("goBack");
            }
        },
        cancel:function(){
            this.send("goBack");
        }
    }
});

