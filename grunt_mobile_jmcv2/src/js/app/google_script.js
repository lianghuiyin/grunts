MobileApp.GoogleScriptController = Ember.ObjectController.extend({
    apiUrl:"http://ditu.google.cn/maps/api/js?sensor=false",
    callbackName:"google_script_callback",//给谷歌地图脚本增加回调函数名称，注意是加到全局window对象中，所以取名要注意冲突
    // pluginPath:"js/base/jquery.easyGoogleMap.js",//成功加载google maps api的脚本后要追加的脚本地址
    pluginPath:"dist/js/jquery.easyGoogleMap.js",//成功加载google maps api的脚本后要追加的脚本地址
    isLoaded:false,//记录是否加载过谷歌地图脚本，只需要加载一次，不能重复加载
    actions:{
        fetch:function(callback){
            //给谷歌地图脚本增加回调函数，以便可以用ajax抓取谷歌API脚本
            var callbackName = this.get("callbackName"),
                apiUrl = this.get("apiUrl");
            window[callbackName] = function(){
            };
            $.getScript("%@&callback=%@".fmt(apiUrl,callbackName),function(){
                var pluginPath = this.get("pluginPath");
                if(pluginPath){
                    //这里要setTimeout的原因是，如果不加setTimeout，有时会出现$.getScript失败的情况。
                    setTimeout(function(){
                        $.getScript(pluginPath,function(){
                            this.set("isLoaded",true);
                            callback();
                        }.switchScope(this));
                    }.switchScope(this),2000);
                }
                else{
                    this.set("isLoaded",true);
                    callback();
                }
            }.switchScope(this));
        }
    }
});

