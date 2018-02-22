/***
滚动条自动滚动
 ***/

(function($) {
    var Autoscroll = {
        //默认参数设置
        defaultSettings: {
            interval:200,
            startInterval:2000,
            endInterval:2000,
            speed:2,
            autoStart:true
        },
        ini: function(settings, obj) {
          if(settings.autoStart){
            this.start(settings, obj);
          }
        },
        start: function(settings, obj) {
          obj.data("stop",false);
          this.autoRun(settings, obj, settings.startInterval);
        },
        stop: function(obj) {
          obj.data("stop",true);
        },
        autoRun: function(settings, obj, timeout) {
          if(!timeout){
            timeout = 200;
          }
          clearTimeout(settings.timeoutTag);
          if(obj.data("stop")){
            return;
          }
          var self = this;
          settings.timeoutTag = setTimeout(function(){
            self.scroll(settings, obj);
          },timeout);
        },
        scroll:function(settings, obj){
          console.log(settings.top);
          obj.scrollTop(settings.top);
          if(settings.isReverse){
            if(obj.scrollTop() <= 0){
              settings.isReverse = false;
              this.autoRun(settings, obj, settings.startInterval);
            }
            else{
              settings.top -= settings.speed;
              this.autoRun(settings, obj);
            }
          }
          else{
            if(obj[0].scrollTop
              + obj[0].clientHeight >= obj[0].scrollHeight){
              settings.isReverse = true;
              this.autoRun(settings, obj, settings.endInterval);
            }
            else{
              settings.top += settings.speed;
              this.autoRun(settings, obj);
            }
          }
        },
    }
    $.fn.autoscroll = function(options) {
        if(options == "stop"){
          return $(this).each(function(i, n) {
              Autoscroll.stop($(n));
          });
        }
        if (typeof(options) == 'undefined') options = {};
        var settings = Autoscroll.defaultSettings;
        if (options) {
            $.extend(settings, options);
        };
        $.extend(settings, {
          isReverse:false,
          timeoutTag:null,
          top:0
        });
        return $(this).each(function(i, n) {
            Autoscroll.ini(settings, $(n));
        });
    };
})(jQuery)