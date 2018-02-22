MobileApp.PlacesController = Ember.ArrayController.extend({
	getById:function(id){
		return this.get("model").findBy("pla_id",id);
	},
    actions:{
    	load:function(places){
    		this.set("model",[]);
    		var model = this.get("model");
            places.forEach(function(item){
                model.push(Ember.Object.create(Ember.Object.create(item).underscores()));
            });
    	}
    }
});