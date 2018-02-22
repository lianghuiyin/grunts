Hsc.TimeoutController = Ember.ObjectController.extend({
    actions:{
        tryRefresh:function(){
            console.log("trying refresh timeout!");
            var instances = this.store.peekAll("instance").filterBy("is_finished",false);
            var lastTrace = null,lastChip = null;
            instances.forEach(function(item){
                lastTrace =  item.get("lastTrace");
                if(lastTrace){
                    lastTrace.notifyPropertyChange("realTimeoutColor");
                    lastTrace.notifyPropertyChange("realTimeoutPercentage");
                }
            });
        }
    }
});

