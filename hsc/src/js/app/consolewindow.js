Hsc.StartConsolewindowRoute = Ember.Route.extend({
    renderTemplate: function() {
        this.render({ outlet: 'consolewindow' });
    },
    beforeModel: function(transition) {
        var sessionController = this.controllerFor("session");
        return sessionController.checkIsConsoleOrg(transition);
    },
    model: function () {
        
        return this.store.peekAll('console').get("lastObject");
    },
    afterModel: function(model, transition) {
        if(!model){
            transition.send("goBack");
        }
    },
    activate:function(){
        //这里要run.next的原因是要等view加载到页面后才能执行navigablePush，即要等view.didInsertElement执行完毕
        Ember.run.next(this,function(){
            var controller = this.controllerFor("start_consolewindow");
            controller.send("navigablePush");
        });
        return this;
    },
    deactivate:function(){
        var controller = this.controllerFor("start_consolewindow");
        controller.send("navigablePop");
        return this;
    },
    actions:{
        goBack:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('start');
        }
    }
});

Hsc.StartConsolewindowView = Ember.View.extend({
    classNames:['start-consolewindow','navigable-pane','collapse']
});
Hsc.StartConsolewindowController = Ember.ObjectController.extend({
    needs:["application"],
    testtypes:function(){
        return this.store.filter("testtype",function(testtype){
            return true;
        });
    }.property(),
    unfinishedInstances:function(){
        return this.store.filter("instance",function(instance){
            return !instance.get("is_finished") && instance.get("lastChip.id");
        });
    }.property("searchKey"),
    searchKey:"",
    arrangedResult:function(){
        var searchKey = this.get("searchKey").toLowerCase();
        searchKey = searchKey.replace(/\\/g,"");
        if(searchKey){
            return this.get("unfinishedInstances").filter(function(item){
                return item.get("car.number").toLowerCase().search(searchKey) >= 0;
            });
        }
        else{
            return this.get("unfinishedInstances");
        }
    }.property("unfinishedInstances.length","searchKey"),
    sendings:function(){
        return this.store.filter("console_chip",function(instance){
            return true;
        });
    }.property(),
    actions:{
        navigablePush:function(){
            $(".start-index.navigable-pane").navigablePush({
                targetTo:".start-consolewindow.navigable-pane",
                animation:Hsc.transitionAnimation
            });
            Hsc.transitionAnimation = "none";
        },
        navigablePop:function(){
            $(".start-consolewindow.navigable-pane").navigablePop({
                targetTo:".start-index.navigable-pane",
                animation:Hsc.transitionAnimation
            });
            Hsc.transitionAnimation = "none";
        }
    }
});

Hsc.ConsolewindowTesttypeItemController = Ember.ObjectController.extend({
    needs:["application","start_consolewindow"],
    chipsSortingDesc: ['start_date:desc'],
    sortedChipsDesc: Ember.computed.sort('unfinishedChips', 'chipsSortingDesc'),
    relInstances: Ember.computed.alias("controllers.start_consolewindow.arrangedResult"),
    unfinishedChips:function(){
        var currentTesttypeId = this.get("id");
        //这里不可能用filterBy("car.testtype.id",currentTesttypeId)，
        //因为它无法排除工作单流转到其他步骤时lastChip为undeifned的情况
        var relInstances = this.get("relInstances").filter(function(item){
            return item.get("car.testtype.id") == currentTesttypeId && item.get("lastChip.id");
        });
        return relInstances.mapBy("lastChip");
    }.property("relInstances.@each.lastChip"),
    offChips:function(){
        return this.get("sortedChipsDesc").filterBy("state","off");
    }.property("sortedChipsDesc.@each.is_finished"),
    onChips:function(){
        return this.get("sortedChipsDesc").filterBy("state","on");
    }.property("sortedChipsDesc.@each.is_finished"),
});

