MobileApp.UnitplayRoute = Ember.Route.extend({
    beforeModel: function(transition) {
        var sessionController = this.controllerFor("session");
        sessionController.checkSession(transition);
    },
    model:function(params, transition){
        return MobileApp.Unitplay.create({
            filter:MobileApp.Playfilter.create()
        });
    },
    setupController: function(controller, model) {
        this._super(controller, model);
        controller.send("fetchExperiments",true);
    },
    deactivate:function(){
        var controller = this.controllerFor("unitplay");
        controller.set("model.current_page",1);
        controller.set("model.total_record",0);
        controller.get("model.experiments").clear();
        controller.set("model.experiments",[]);
        controller.set("model.filter",null);
        controller.set("model.experiment",null);
        controller.set("isLastLoaded",false);
        controller.set("isLoadingMore",false);
        return this;
    },
    actions:{
        goBack:function(){
            this.send("goIndex");
        },
        goPlayfilter:function(){
            MobileApp.transitionAnimation = "slideHorizontal";
            this.transitionTo('unitplay.playfilter');
        },
        goPlaytimer:function(){
            MobileApp.transitionAnimation = "slideHorizontal";
            this.transitionTo('unitplay.playtimer');
        }
    }
});
MobileApp.Unitplay = MobileApp.Model.extend({
    members:["experiments","filter"],
    action:"unitplay",
    current_page:1,
    page_size:5,
    total_record:0,
    experiments: [],
    filter:null,
    experiment:null
});
MobileApp.UnitplayController = Ember.ObjectController.extend({
    needs:["session","projects","unit_configs","cars","places"],
    isLoading:false,
    isLoadingMore:false,
    isLastLoaded:false,
    actions:{
        fetchExperiments:function(isFirst){
            var currentPage = this.get("model.current_page"),
                pageSize = this.get("model.page_size"),
                filter = this.get("model.filter"),
                unitConfig = filter.get("unit_config"),
                project = filter.get("project"),
                car = filter.get("car"),
                place = filter.get("place"),
                expType = filter.get("exp_type"),
                startTime = filter.get("start_time"),
                endTime = filter.get("end_time");
            if(isFirst){
                this.set("isLoading",true);
            }
            else{
                if(this.get("isLastLoaded")){
                    console.log("isLastLoaded");
                    return;
                }
                this.set("isLoadingMore",true);
            }
            var sessionController = this.get("controllers.session");
            var fetcher = MobileApp.ExperimentsFetcher.create({
                token:sessionController.genrateToken(),
                log_id:localStorage.getItem("log_id"),
                current_page:currentPage,
                page_size:pageSize,
                unit:unitConfig ? unitConfig.get("unit_id") : 0,
                project:project ? project.get("pro_id") : 0,
                car:car ? car.get("car_id") : 0,
                place:place ? place.get("pla_id") : 0,
                exp_type:expType ? expType.get("exp_type_id") : 0,
                start_time:startTime,
                end_time:endTime
            });
            var promise = fetcher.tryPost();
            promise.then(function(result){
                if(isFirst){
                    this.set("isLoading",false);
                }
                else{
                    this.set("isLoadingMore",false);
                }
                var totalRecord = result.get("total_record"),
                    experiments = result.get("experiments");
                if(currentPage >= totalRecord/pageSize){
                    this.set("isLastLoaded",true);
                }
                this.set("model.total_record",totalRecord);
                this.send("loadExperiments",experiments,isFirst);
            }.switchScope(this),function(reason){
            }.switchScope(this));
        },
        loadExperiments:function(experiments,isFirst){
            var exps = [];
            experiments.forEach(function(item){
                exps.push(MobileApp.ExperimentDetail.create(Ember.Object.create(item).underscores()));
            });
            this.get("experiments").pushObjects(exps);
        },
        selExperiment:function(experiment){
            this.set("experiment",experiment);
            this.send("goPlaytimer");
        },
        loadMore:function(){
            var currentPage = this.get("model.current_page");
            this.set("model.current_page",currentPage + 1);
            this.send("fetchExperiments",false);
        }
    }
});