MobileApp.MapOffsetFetcher = MobileApp.Model.extend({
    members:["lat","lng"],
    action:"fetchMapOffset",
    lat:null,
    lng:null
});

MobileApp.MapOffsetController = Ember.ObjectController.extend({
    actions:{
    	fetch:function(options){
            var lat = options.lat,
                lng = options.lng,
                callBackForSuc = options.callBackForSuc,
                callBackForFail = options.callBackForFail;
            var fetcher = MobileApp.MapOffsetFetcher.create({
                lat:lat,
                lng:lng
            });
            var promise = fetcher.tryPost();
            promise.then(function(result){
                callBackForSuc(result);
            }.switchScope(this),function(reason){
                callBackForFail(reason);
            }.switchScope(this));
    	}
    }
});