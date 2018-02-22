MobileApp.ProjectsController = Ember.ArrayController.extend({
	getById:function(id){
		return this.get("model").findBy("pro_id",id);
	},
    actions:{
    	load:function(projects){
    		this.set("model",[]);
    		var model = this.get("model");
            projects.forEach(function(item){
                model.push(Ember.Object.create(Ember.Object.create(item).underscores()));
            });
    	}
    }
});