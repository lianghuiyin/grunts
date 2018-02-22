MobileApp.MarkerIconColorFetcher = MobileApp.Model.extend({
    members:["experiment"],
    action:"fetchMapIconColor",
    experiment:null
});

MobileApp.MarkerIconController = Ember.ObjectController.extend({
    markersPath: "images/markers", //markers图标文件路径
    getMarkerUrlByColor: function(markerColor) {
        // "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|%@".fmt(markerColor)
        return "%@/chart_%@.png".fmt(this.get("markersPath"), markerColor.toUpperCase());
    },
    actions:{
    	fetchMarkerIconColor:function(options){
            var experiment = options.experiment,
                callBackForSuc = options.callBackForSuc,
                callBackForFail = options.callBackForFail;
            var fetcher = MobileApp.MarkerIconColorFetcher.create({
                experiment:experiment
            });
            var promise = fetcher.tryPost();
            promise.then(function(result){
                callBackForSuc(result);
            }.switchScope(this),function(reason){
                callBackForFail(reason);
            }.switchScope(this));
    	},
        /**
         * [loadMarkerImage 加载地图图标，成功后调用回调函数]
         * @param  {[type]} markerColor [地图Marker的颜色值，不带#前缀]
         * @param  {[type]} callBack    [图片加载成功后的回调函数]
         */
        loadMarkerImage: function(options) {
            var markerColor = options.markerColor,
                callBack = options.callBack;
            var tmpImg = new Image();
            var pinColor = markerColor ? markerColor : "FE7569";
            $(tmpImg).bind("load", function() {
                callBack();
            });
            $(tmpImg).attr("src", this.getMarkerUrlByColor(pinColor));
        }
    }
});