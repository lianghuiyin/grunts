/*!
 * screenicons v1.0
 * Copyright 2015 Lit.In
 */

(function ($) {
    $.fn.screenicons = function (options) {
        var settings = {};
        (function(){
            //默认参数设置
            var defaultSettings = {
                animation:"fade",//动画fade/none
                delay:2000,
                callBack: function(){}
            };
            if (typeof (options) == 'undefined') options = {};
            settings = defaultSettings;
            if (options) {
                $.extend(settings, options);
            };
        })();
        return this.each(function(){
            screenicons.ini(settings,$(this));
        });
    };
    var screenicons = {
        ini:function(settings,obj){
            if(this.valiSettings(settings)){
                var box = obj,icons = box.find(".screenicon");
                var inners = box.find(".screenicon .screenicon-inner");
                var innerGlyphicons = box.find(".screenicon .glyphicon");
                var boxW = box.width(),boxH = box.height();
                var count = icons.length,rowCount = 2;
                if(boxW/boxH < 1 && count < 4){
                    rowCount = 1;//每行的icon个数
                }
                else if(count > 4){
                    rowCount = 3;//每行的icon个数
                }
                var rows = Math.round(count/rowCount);//行数
                var rate = 0.50;
                var horizontalLength = Math.round((boxW/rowCount)*rate);
                var verticalLength = Math.round((boxH/rows)*rate);
                var iconLength = horizontalLength < verticalLength ? horizontalLength : verticalLength;
                icons.width(iconLength);
                icons.height(iconLength);
                inners.css("margin-top",Math.round((iconLength/2)*0.6));
                inners.css("font-size",Math.round((iconLength/8)*0.8));
                innerGlyphicons.css("font-size",Math.round((iconLength/8)*2.2));
                var everyLeft = Math.round(boxW/(rowCount + 1));
                var everyTop = Math.round(boxH/(rows + 1));
                var colIndex = 0;
                var rowIndex = 0;
                icons.each(function(index,icon){
                    if(index%rowCount == 0){
                        rowIndex++;
                        colIndex = 1;
                    }
                    else{
                        colIndex++;
                    }
                    $(icon).css("left",Math.round((everyLeft * colIndex) - iconLength/2).toString() + "px");
                    $(icon).css("top",Math.round((everyTop * rowIndex) - iconLength/2).toString() + "px");
                });
                icons.fadeIn();
            }
        },
        valiSettings:function(settings){
            var errCount = 0;
            if(typeof settings.callBack != "function"){
                this.debug("settings.callBack must be a function type");
                errCount++;
            }
            if(settings.animation != "fade" && settings.animation != "none"){
                this.debug("settings.animation must be a string in [\"fade\",\"none\"]");
                errCount++;
            }
            if(typeof settings.delay != "number"){
                this.debug("settings.delay must be a number");
                errCount++;
            }
            return errCount > 0 ? false : true;
        },
        debug:function (msg) {
            if (window.console && window.console.log && typeof msg == "string"){
                window.console.log('$.fn.screenicons: ' + msg);
            }
        }
    }
    $(window).resize(function(){
        $(".screenicons-box").screenicons();
    });
})(jQuery);

