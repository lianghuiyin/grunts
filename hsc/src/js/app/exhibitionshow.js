Hsc.ExhibitionshowRoute = Ember.Route.extend({
    beforeModel: function() {
        
    },
    model: function (params) {
        var curId = params.exhibitionshow_id;
        return this.store.peekRecord('exhibition', curId);
    },
    afterModel: function(model, transition) {
        if(!model){
            transition.send("goBack");
        }
    },
    activate:function(){
        this.controllerFor("application").set("isShowingExhibition",true);
        Ember.run.next(this,function(){
            var controller = this.controllerFor("exhibitionshow");
            controller.send("bindSplits");
        });
        return this;
    },
    deactivate:function(){
        this.controllerFor("application").set("isShowingExhibition",false);
        var controller = this.controllerFor("exhibitionshow");
        controller.send("unbindSplits");
        return this;
    },
    actions:{
        goBack:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('index');
        }
    }
});

// Hsc.ExhibitionshowView = Ember.View.extend({
//     classNames:['exhibitionshow','navigable-pane','collapse']
// });
Hsc.ExhibitionshowController = Ember.ObjectController.extend({
    needs:["application"],
    runner:null,
    currentTarget:0,
    actions:{
        bindSplits:function(){
            
            if(!this.get("isNeedToSplit")){
                return;
            }
            this.send("tryRunNextSplit");
        },
        tryRunNextSplit:function(){
            var arraySplits = this.get("arraySplits"),
                areas = this.get("areas");
            var jqItems = $(".exhibitionshow-area-item-wrap.split-target"),
                jqItemsToShow = $(),
                jqItemsToHide = $(),
                currentTarget = this.get("currentTarget"),
                preTarget = currentTarget - 1;
            preTarget = preTarget < 0 ? arraySplits.length - 1 : preTarget;
            areas.forEach(function(area,index){
                if(area.get("target") == currentTarget){
                    jqItemsToShow.push(jqItems[index]);
                }
                else if(area.get("target") == preTarget){
                    jqItemsToHide.push(jqItems[index]);
                }
            });
            if(jqItemsToHide.length){
                jqItemsToHide.fadeOut("fast",function(){
                    jqItemsToShow.fadeIn();
                });
            }
            else{
                jqItemsToShow.show();
            }
            var lastRunner = Ember.run.later(this,function(){
                this.send("tryRunNextSplit");
            },arraySplits[currentTarget] * 1000);
            currentTarget++;
            if(currentTarget >= arraySplits.length){
                currentTarget = 0;
            }
            this.set("currentTarget",currentTarget);
            this.set("runner",lastRunner);
        },
        unbindSplits:function(){
            if(!this.get("isNeedToSplit")){
                return;
            }
            var runner = this.get("runner");
            runner && Ember.run.cancel(runner);
        }
        // navigablePush:function(){
        //     $(".start-index.navigable-pane").navigablePush({
        //         targetTo:".exhibitionshow.navigable-pane",
        //         animation:Hsc.transitionAnimation
        //     });
        //     Hsc.transitionAnimation = "none";
        // },
        // navigablePop:function(){
        //     $(".exhibitionshow.navigable-pane").navigablePop({
        //         targetTo:".start-index.navigable-pane",
        //         animation:Hsc.transitionAnimation
        //     });
        //     Hsc.transitionAnimation = "none";
        // }
    }
});

Hsc.ExhibitionshowAreaItemController = Ember.ObjectController.extend({
    needs:["application","exhibitionshow"],
    colMdClass:function(){
        var is_fluid = this.get("controllers.exhibitionshow.is_fluid");
        return is_fluid ? "col-md-12" : "col-md-%@".fmt(this.get("columns"));
    }.property("columns"),
    rowMdClass:function(){
        var is_fluid = this.get("controllers.exhibitionshow.is_fluid");
        return is_fluid ? "" : "row-md-%@".fmt(this.get("rows"));
    }.property("rows"),
    isHasChild:function(){
        return this.get("children.length") > 0;
    }.property("children"),
    /**
     * [checkInstance 检测instance是否符合area定制的条件，
     * 依次检测area的steps、workshops及testtypes只有三个条件同时满足时才表示通过检测]
     * @param  {[Hsc.Instance]} instance [description]
     * @param  {[Hsc.Screenarea]} area     [description]
     * @return {[boolean]}          [返回是否符合]
     */
    checkIsInstanceInArea:function(instance,area,isHasChild){
        if(instance.get("is_finished")){
            //instance为空时肯定不需要显示在展示台，直接检测不通过即可
            return false;
        }
        else{
            var lastTrace = instance.get("lastTrace"),
                lastChip = instance.get("lastChip"),
                isStepChecked = false,//是否通过步骤的检测
                isWorkshopChecked = false,//是否通过车间组的检测
                isTesttypeChecked = false,//是否通过试验类型的检测
                areaSteps = area.get("steps"),
                areaWorkshops = area.get("workshops"),
                areaTesttypes = area.get("testtypes"),
                areaState = area.get("state"),
                lastTraceStepId = lastTrace ? lastTrace.get("step.id") : 0,
                lastChipState = lastChip ? lastChip.get("state") : null;
            //步骤的真实id是带有版本号前缀的，这里的需要清除其前缀来对比
            lastTraceStepId = lastTraceStepId ? lastTraceStepId.replace(/^V\d+_/,"") : 0;
            if(areaSteps && areaSteps.get("length") > 0){
                //areaSteps存在时才开始检测，
                if(lastChip){
                    //lastChip不为空时要同时检测步骤及步骤的控制台状态
                    isStepChecked = areaSteps.isAny("id",lastTraceStepId) && (areaState ? areaState == lastChipState : true);
                }
                else{
                    //lastChip为空时只要检测步骤，即只检测lastTrace
                    //lastTrace为空时说明instance已结束，这时肯定不需要显示在展示台，直接检测不通过即可
                    isStepChecked = lastTrace ? areaSteps.isAny("id",lastTraceStepId) : false;
                }
            }
            else{
                //areaSteps为空时说明不需要检测步骤
                isStepChecked = true;
            }
            if(isStepChecked){
                //如果通过了步骤的检测，继续车间组的检测及试验类型的检测
                if(areaWorkshops && areaWorkshops.get("length") > 0){
                    //areaWorkshops存在时才开始检测
                    //lastTrace为空时说明instance已结束，这时肯定不需要显示在展示台，直接检测不通过即可
                    isWorkshopChecked = lastTrace ? areaWorkshops.isAny("id",lastTrace.get("workshop.id")) : false;
                }
                else{
                    //areaWorkshops为空时说明不需要检测车间组
                    isWorkshopChecked = true;
                }
                if(isWorkshopChecked){
                    //如果通过了车间组的检测，继续试验类型的检测
                    if(areaTesttypes && areaTesttypes.get("length") > 0){
                        //areaTesttypes存在时才开始检测
                        isTesttypeChecked = areaTesttypes.isAny("id",instance.get("car.testtype.id"));
                    }
                    else{
                        //areaTesttypes为空时说明不需要检测试验类型
                        isTesttypeChecked = true;
                    }
                    if(!isTesttypeChecked){
                        //如果没有通过试验类型的检测，直接返回不通过检测
                        return false;
                    }
                }
                else{
                    //如果没有通过车间组的检测，直接返回不通过检测
                    return false;
                }
            }
            else{
                //如果没有通过步骤的检测，直接返回不通过检测
                return false;
            }
            return isStepChecked && isWorkshopChecked && isTesttypeChecked;
        }
    },
    instances:function(){
        var self = this,isHasChild = this.get("isHasChild"),
            children = this.get("children"),
            checkIsInstanceInArea = this.get("checkIsInstanceInArea");
        return this.store.filter("instance",function(instance){
            if(isHasChild){
                if(instance.get("is_finished")){
                    return false;
                }
                else{
                    var isChecked = false;
                    children.every(function(child,index){
                        //只要instance能满足任何一个子区域设置说明通过检测，反之不通过
                        isChecked = checkIsInstanceInArea(instance,child);
                        if(isChecked){
                            //如果发现有一个通过，则立刻退出循环
                            return false;
                        }
                        else{
                            return true;
                        }
                    });
                    return isChecked;
                }
            }
            else{
                return checkIsInstanceInArea(instance,self);
            }
        });
    }.property()
});

Hsc.ExhibitionshowChildItemController = Ember.ObjectController.extend({
    needs:["exhibitionshow_area_item","exhibitionshow"],
    colMdClass:function(){
        var is_fluid = this.get("controllers.exhibitionshow.is_fluid");
        return is_fluid ? "col-md-12" : "col-md-%@".fmt(this.get("columns"));
    }.property("columns"),
    instances:function(){
        var self = this,checkIsInstanceInArea = this.get("controllers.exhibitionshow_area_item.checkIsInstanceInArea");
        return this.store.filter("instance",function(instance){
            return checkIsInstanceInArea(instance,self);
        });
    }.property()
});

