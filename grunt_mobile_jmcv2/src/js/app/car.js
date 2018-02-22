MobileApp.CarsFetcher = MobileApp.Model.extend({
    members:["token","log_id","project"],
    action:"fetchCars",
    token: "",
    log_id:"",
    project: ""
});
MobileApp.CarsController = Ember.ArrayController.extend({
    needs:["session","unitscene"],
	isLoading:false,
	project:null,
	getById:function(id){
		return this.get("model").findBy("car_id",id);
	},
	projectDidChange:function(){
		var project = this.get("project");
		var proId = project ? project.get("pro_id") : 0;
		console.log("CarsController.projectDidChange");
		if(proId > 0){
			this.send("load",proId);
		}
		else{
			this.set("model",[]);
		}
	}.observes("project"),
    actions:{
    	load:function(proId){
	        var sessionController = this.get("controllers.session");
    		var fetcher = MobileApp.CarsFetcher.create({
	            token:sessionController.genrateToken(),
	            log_id:localStorage.getItem("log_id"),
    			project:proId
    		});
    		this.set("isLoading",true);
            var promise = fetcher.tryPost();
            promise.then(function(result){
	    		this.set("isLoading",false);
	    		this.set("model",[]);
	    		var model = this.get("model");
	    		var cars = result.get("cars");
	            cars.forEach(function(item){
	                model.push(Ember.Object.create(Ember.Object.create(item).underscores()));
	            });
	            Ember.run.next(this,function(){
		            var unitsceneController = this.get("controllers.unitscene");
		            var car_id = unitsceneController.get("experiment.car_id");
		            if(car_id > 0){
		            	unitsceneController.set("model.car",this.getById(car_id));
		            }
	            });
            }.switchScope(this),function(reason){
	    		this.set("isLoading",false);
            }.switchScope(this));

    	}
    }
});