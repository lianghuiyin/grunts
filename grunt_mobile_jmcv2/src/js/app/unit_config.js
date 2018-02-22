MobileApp.UnitConfigsController = Ember.ArrayController.extend({
	getById:function(id){
		return this.get("model").findBy("unit_id",id);
	},
    actions:{
    	load:function(unit_configs){
    		this.set("model",[]);
    		var model = this.get("model");
            unit_configs.forEach(function(item){
                model.push(Ember.Object.create(Ember.Object.create(item).underscores()));
            });
    	}
    }
});