/*!
 * bootstrap-navigable v1.0
 * Copyright 2011-2014 Lit.In
 */

(function ($) {
    var lastTarget = {};
    $.fn.navigablePush = function (options) {
        var settings = {};
        (function(){
            //默认参数设置
            var defaultSettings = {
                targetTo:null,//要切换到的目标Panel
                direction:"push",//方向pop/push
                animation:"fade",//动画fade/slide(slideHorizontal)/slideVertical/none
                callBack: function(){}
            };
            if (typeof (options) == 'undefined') options = {};
            settings = defaultSettings;
            if (options) {
                $.extend(settings, options);
            };
        })();
        return this.each(function(){
            navigable.ini(settings,$(this));
        });
    };
    $.fn.navigablePop = function (options) {
        var settings = {};
        (function(){
            //默认参数设置
            var defaultSettings = {
                targetTo:null,
                direction:"pop",//方向pop/push
                animation:"fade",//动画fade/slide(slideHorizontal)/slideVertical/none
                callBack: function(){}
            };
            if (typeof (options) == 'undefined') options = {};
            settings = defaultSettings;
            if (options) {
                $.extend(settings, options);
            };
        })();
        return this.each(function(){
            navigable.ini(settings,$(this));
        });
    };
    var navigable = {
        ini:function(settings,obj){
            if(this.valiSettings(settings)){
            	var from = obj,to = settings.targetTo;
            	switch(settings.animation){
            		case "fade":
		            	from.fadeOut(function(){
			            	to.fadeIn(function(){
                                from.removeClass("active");
                                to.addClass("active");
                                settings.callBack();
                            });
		            	});
            			break;
                    case "slide":
                        //≈slideHorizontal
                        if(settings.direction == "push"){
                            to.fadeIn();
                            from.css("float","left").animate({marginLeft:"-200%"},function(){
                                from.hide();
                                settings.callBack();
                            });
                        }
                        else{
                            from.fadeOut();
                            to.show().animate({marginLeft:"0%"},function(){
                                to.css("float","none");
                                from.hide();
                                from.removeClass("active");
                                to.addClass("active");
                                settings.callBack();
                            });
                        }
                        break;
                    case "slideHorizontal":
                        //≈slide
                        // var fromWidth = from.outerWidth();
                        var duration = from.css("transition-duration");
                        duration = duration ? parseFloat(duration.match(/\d+(.\d+)*/)[0]) : 0;
                        duration = duration > 0 ? duration * 1000 : 1
                        if(settings.direction == "push"){
                            // from.wrap("<div style = 'width:" + fromWidth + "px'></div>");
                            // to.wrap("<div style = 'width:" + fromWidth + "px'></div>");
                            // var pFrom = from.parent(),
                            //     pTo = to.parent();
                            // pFrom.wrap("<div style = 'width:" + fromWidth * 2 + "px'></div>");
                            // var p = pFrom.parent();
                            // pTo.appendTo(p);
                            // pFrom.css("float","left");
                            // pTo.css("float","left");
                            // to.show();
                            // pFrom.animate({marginLeft:"-200%"},function(){
                            //     pFrom.hide();
                            //     from.hide();
                            //     to.insertAfter(p);
                            //     from.insertAfter(p);
                            //     p.remove();
                            // });
                            if(duration > 1){
                                to.addClass("right");
                                setTimeout(function(){
                                    from.removeClass("active").addClass("left");
                                    to.addClass("active").removeClass("right").show();
                                    setTimeout(function(){
                                        from.removeClass("left");
                                        settings.callBack();
                                    },duration)
                                },100);
                            }
                            else{
                                to.css("left","100%").show();
                                from.animate({left:"-100%"});
                                to.animate({left:0},function(){
                                    from.hide().css("left",0);
                                    from.removeClass("active");
                                    to.addClass("active");
                                    settings.callBack();
                                });
                            }
                        }
                        else{
                            // to.wrap("<div style = 'width:" + fromWidth + "px'></div>");
                            // from.wrap("<div style = 'width:" + fromWidth + "px'></div>");
                            // var pTo = to.parent(),
                            //     pFrom = from.parent();
                            // pFrom.wrap("<div style = 'width:" + fromWidth * 2 + "px'></div>");
                            // var p = pFrom.parent(); 
                            // pTo.hide().prependTo(p).css("float","left").css("margin-left","-200%").show();
                            // pFrom.css("float","left");
                            // to.show();
                            // pTo.animate({marginLeft:"0%"},function(){ 
                            //     pFrom.hide();
                            //     from.hide().insertAfter(p);
                            //     to.insertAfter(p);
                            //     p.remove(); 
                            // });
                            if(duration > 1){
                                to.addClass("left");
                                setTimeout(function(){
                                    from.removeClass("active").addClass("right");
                                    to.removeClass("left").addClass("active");
                                    setTimeout(function(){
                                        from.removeClass("right");
                                        settings.callBack();
                                    },duration)
                                },100);
                            }
                            else{
                                to.css("left","-100%").show();
                                from.animate({left:"100%"});
                                to.animate({left:0},function(){
                                    from.hide().css("left",0);
                                    from.removeClass("active");
                                    to.addClass("active");
                                    settings.callBack();
                                });
                            }
                        }
                        break;
                    case "slideVertical":
                        if(settings.direction == "push"){
                            to.show();
                            from.animate({marginTop:"-50%"},function(){
                                from.hide();
                                settings.callBack();
                            });
                        }
                        else{
                            to.show().animate({marginTop:"0%"},function(){
                                from.hide();
                                from.removeClass("active");
                                to.addClass("active");
                                settings.callBack();
                            });
                        }
                        break;
            		default:
		            	from.removeAttr("style").removeClass("active");
		            	to.removeAttr("style").addClass("active");
                        settings.callBack();
            			break;
            	}
            }
        },
        valiSettings:function(settings){
            var errCount = 0;
            if(typeof settings.callBack != "function"){
                this.debug("settings.callBack must be a function type");
                errCount++;
            }
            if(settings.direction != "push" && settings.direction != "pop"){
                this.debug("settings.direction must be a string in [\"push\",\"pop\"]");
                errCount++;
            }
            var targetTo = settings.targetTo;
            targetTo = (typeof targetTo == 'string' ?
                     $(targetTo) : targetTo);
            if(!((targetTo instanceof $) && targetTo.length > 0)){
                this.debug("settings.targetTo must targetTo to an valid jquery object");
                errCount++;
            }
            else{
	            settings.targetTo = targetTo;
            }
            return errCount > 0 ? false : true;
        },
        debug:function (msg) {
            if (window.console && window.console.log && typeof msg == "string"){
                window.console.log('$.fn.navigable: ' + msg);
            }
        }
    }
    $('body').on('click', '[data-toggle=navigable]', function(e) {
        $(e.target).trigger("navigable-go");
	});
    $('body').on('navigable-go',function(e){
        var target = $(e.target);
        target = target.attr("data-toggle") == "navigable" ? target : target.closest("[data-toggle=navigable]");
        var from = target.closest(".navigable-pane"),
            push = target.attr("data-navigable-push"),
            pop = target.attr("data-navigable-pop"),
            animation = target.attr("data-navigable-ani");
        if(push){
            var fromId = from.attr("id");
            if(lastTarget[fromId]){
                lastTarget[fromId].removeClass("active");
            }
            if(target.attr("data-navigable-activable")){
                target.addClass("active");
                lastTarget[fromId] = target;
            }
            from.navigablePush({
                targetTo:push,
                animation:animation
            });
        }
        else if(pop){
            from.navigablePop({
                targetTo:pop,
                animation:animation
            });
        }
    });
})(jQuery);

