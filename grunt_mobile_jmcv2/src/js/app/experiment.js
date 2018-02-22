MobileApp.Experiment = MobileApp.Model.extend({
    members:["exp_id","unit_id","pro_id","car_id","pla_id","exp_type_id"],
    action:"experiment",
    exp_id: 0,
    unit_id:0,
    pro_id:0,
    car_id:0,
    pla_id:0,
    exp_type_id:0
});
MobileApp.ExperimentDetail = MobileApp.Model.extend({
    members:["exp_id","unit_id","pro_id","car_id","pla_id","exp_type_id"],
    action:"experiment",
    exp_id: 0,
    unit_id:0,
    unit_no:"",
    pro_id:0,
    pro_name:"",
    car_id:0,
    car_no:"",
    pla_id:0,
    pla_name:"",
    exp_type_id:0,
    exp_type_name:"",
    start_time:"",
    end_time:""
});
MobileApp.ExperimentController = Ember.ObjectController.extend({
    // needs:["projects","unit_configs","cars"],
    // projects:function(){
    //     return this.get("controllers.projects.model");
    // }.property("controllers.projects.length"),
    // selectedProject:function(k,v){
    //     var model = this.get('model');
    //     if (v === undefined) {
    //         return model.get("project");
    //     } else {
    //         model.set('project', v);
    //         return v;
    //     }
    // }.property("model.project"),
    actions:{
    }
});
MobileApp.AssigningExperimentByUnitFetcher = MobileApp.Model.extend({
    members:["token","log_id","unit"],
    action:"fetch_assigning_experiment_by_unit",
    token: "",
    log_id:"",
    unit:""
});

MobileApp.AssigningExperimentByCarFetcher = MobileApp.Model.extend({
    members:["token","log_id","car"],
    action:"fetch_assigning_experiment_by_car",
    token: "",
    log_id:"",
    car:""
});

MobileApp.ExperimentsFetcher = MobileApp.Model.extend({
    members:["token","log_id","current_page","page_size","unit","project","car","place","exp_type","start_time","end_time"],
    action:"fetch_experiments",
    token: "",
    log_id:"",
    current_page:"",
    page_size:"",
    unit:"",
    project:"",
    car:"",
    place:"",
    exp_type:"",
    start_time:null,
    end_time:null
});

MobileApp.DataReceiveDaysByUnitAndTimeFetcher = MobileApp.Model.extend({
    members:["token","log_id","unit","start_time","end_time"],
    action:"fetch_data_receive_days_by_unit_and_time",
    token: "",
    log_id:"",
    unit:"",
    start_time:null,
    end_time:null
});