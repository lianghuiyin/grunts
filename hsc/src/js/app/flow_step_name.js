Hsc.Flowstepsname = DS.Model.extend({
    steps: DS.attr("string")
});

Hsc.FlowstepsnameController = Ember.ObjectController.extend({
    actions:{
        trySync:function(callback){
            var ss = this.store.peekAll("step").toArray().map(function(n){
                return {Id:n.get("id"),Name:n.get("name")};
            });
            var r = this.store.createRecord("flowstepsname",{steps:JSON.stringify(ss)});
            // var r = this.store.createRecord("flowstepsname",{steps:ss});
            var prom = r.save(true);
            prom.then(function(answer){
                callback(true);
            }.switchScope(this), function(reason){
                callback(false);
            }.switchScope(this));
            return prom;
        }
    }
});


