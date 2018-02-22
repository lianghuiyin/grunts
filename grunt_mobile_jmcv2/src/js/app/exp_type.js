MobileApp.ExpTypesController = Ember.ArrayController.extend({
	getById:function(id){
		return this.get("model").findBy("exp_type_id",id);
	},
    actions:{
    	load:function(exp_types){
    		this.set("model",[]);
    		var model = this.get("model");
            exp_types.forEach(function(item){
                model.push(Ember.Object.create(Ember.Object.create(item).underscores()));
            });
    	}
    }
});