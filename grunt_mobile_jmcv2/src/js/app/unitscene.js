MobileApp.UnitsceneRoute = Ember.Route.extend({
    beforeModel: function(transition) {
        var sessionController = this.controllerFor("session");
        sessionController.checkSession(transition);
    },
    model:function(params, transition){
        return MobileApp.Unitscene.create();
    },
    actions:{
        goBack:function(){
            this.send("goIndex");
        },
        goUnitmap:function(){
            MobileApp.transitionAnimation = "slideHorizontal";
            this.transitionTo('unitscene.unitmap');
        }
    }
});
MobileApp.Unitscene = MobileApp.Model.extend({
    members:["project","unit_config","car","place","experiment"],
    action:"unitscene",
    // mode:'unit',//单设备模式unit，地点模式place
    project: null,
    unit_config:null,
    car:null,
    place:null,
    experiment:null,
    unit_configDidChange:function(){
        var unit_config = this.get("unit_config");
        if(Ember.isEmpty(unit_config)){
            this.get('errors').add('unit_config', '不能为空');
        }
        else{
            this.get('errors').remove('unit_config');
        }
    }.observes("unit_config"),
    projectDidChange:function(){
        var project = this.get("project");
        if(Ember.isEmpty(project)){
            this.get('errors').add('project', '不能为空');
        }
        else{
            this.get('errors').remove('project');
        }
    }.observes("project"),
    carDidChange:function(){
        var car = this.get("car");
        if(Ember.isEmpty(car)){
            this.get('errors').add('car', '不能为空');
        }
        else{
            this.get('errors').remove('car');
        }
    }.observes("car")
});
MobileApp.UnitsceneController = Ember.ObjectController.extend({
    needs:["session","projects","unit_configs","cars","places"],
    unitConfigs:function(){
        return this.get("controllers.unit_configs.model");
    }.property("controllers.unit_configs.length"),
    selectedUnitConfig:function(k,v){
        var model = this.get('model');
        if (v === undefined) {
            return model.get("unit_config");
        } else {
            model.set('unit_config', v);
            model.set("project",null);
            model.set("car",null);
            model.set("place",null);
            model.set("experiment",null);
            this.send("fetchExperimentByUnit",v)
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
            // model.set("project",null);
            model.set("unit_config",null);
            model.set("place",null);
            model.set("experiment",null);
            this.send("fetchExperimentByCar",v)
            return v;
        }
    }.property("model.car"),
    projectDidChange:function(){
        var selProject = this.get("model.project");
        this.get("controllers.cars").set("project",selProject);
    }.observes("model.project"),
    actions:{
        fetchExperimentByUnit:function(unit){
            if(!unit){
                return;
            }
            var selUnitConfigId = unit.get("unit_id");
            if(selUnitConfigId && selUnitConfigId > 0){
                var sessionController = this.get("controllers.session");
                var fetcher = MobileApp.AssigningExperimentByUnitFetcher.create({
                    token:sessionController.genrateToken(),
                    log_id:localStorage.getItem("log_id"),
                    unit:selUnitConfigId
                });
                var promise = fetcher.tryPost();
                promise.then(function(result){
                    var exp = result.get("experiment");
                    exp = MobileApp.Experiment.create(Ember.Object.create(exp).underscores());
                    this.set("model.experiment",exp);
                    var projectsController = this.get("controllers.projects");
                    var selProject = projectsController.getById(exp.get("pro_id"));
                    this.set("model.project",selProject);
                    var placesController = this.get("controllers.places");
                    var selPlace = placesController.getById(exp.get("pla_id"));
                    this.set("model.place",selPlace);
                    //因为每次更改project都会触发CarsController重新load，所以选中车辆操作在CarsController的Load事件中
                }.switchScope(this),function(reason){
                }.switchScope(this));
            }
        },
        fetchExperimentByCar:function(car){
            if(!car){
                return;
            }
            var selCarId = car.get("car_id");
            if(selCarId && selCarId > 0){
                var sessionController = this.get("controllers.session");
                var fetcher = MobileApp.AssigningExperimentByCarFetcher.create({
                    token:sessionController.genrateToken(),
                    log_id:localStorage.getItem("log_id"),
                    car:selCarId
                });
                var promise = fetcher.tryPost();
                promise.then(function(result){
                    var exp = result.get("experiment");
                    exp = MobileApp.Experiment.create(Ember.Object.create(exp).underscores());
                    this.set("model.experiment",exp);
                    Ember.run.next(this,function(){
                        var unitId = this.get("model.experiment.unit_id");
                        if(unitId > 0){
                            var unitConfigsController = this.get("controllers.unit_configs");
                            var selUnitConfig = unitConfigsController.getById(unitId);
                            this.set("model.unit_config",selUnitConfig);
                            var placesController = this.get("controllers.places");
                            var selPlace = placesController.getById(exp.get("pla_id"));
                            this.set("model.place",selPlace);
                        }
                    });
                }.switchScope(this),function(reason){
                }.switchScope(this));
            }
        },
        start:function(){
            this.get("model").notifyAllPropertyChange();
            if(this.get("model.errors.length") == 0){
                this.send("goUnitmap");
            }
        }
    }
});