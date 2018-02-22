Hsc.TesttypestableRoute = Ember.Route.extend({
    controllerName: 'testtypestable',
    model:function(){
        return this.store.peekAll("instance");
    },
    activate:function(){
        this.controllerFor("application").set("isShowingExhibition",true);
        // if(window.screen && window.screen.width >= 2560){
        //     Ember.run.next(function(){
        //         $(".testtypestable-box").autoscroll();
        //     });
        // }
        return this;
    },
    deactivate:function(){
        this.controllerFor("application").set("isShowingExhibition",false);
        // if(window.screen && window.screen.width >= 2560){
        //     $(".testtypestable-box").autoscroll("stop");
        // }
        return this;
    },
    actions:{
        goInstance:function(instance){
            this.transitionTo('monitor.instance',instance);
        }
    }
});

Hsc.TesttypestableView = Ember.View.extend({
    attributeBindings:"id",
    id:"testtypestable",
    classNames:['navigable-container']
});

Hsc.TesttypestableController = Ember.ObjectController.extend({
    needs:["application"],
    flow:function(){
        return this.store.peekAll('flow').findBy("is_bedstand",false);
    }.property(),
    allSteps:function(){
        return this.get("flow.current.steps")
    }.property("flow"),
    steps:function(){
        return this.get("allSteps").filter(function (step) {
            return step.get("type") != "end" && step.get("is_listable");
        });
    }.property("allSteps"),
    // stepPercentageClass:function(){
    //     var length = this.get("steps.length");
    //     var percentage = Math.floor(100/length);
    //     return "w%@per".fmt(percentage);
    // }.property("steps.length"),
    allCars:function(){
        return this.store.peekAll('car');
    }.property(),
    allTesttypes:function(){
        return this.store.peekAll('testtype');
    }.property("flow"),
    testtypes:function(){
        return this.get("allTesttypes").filter(function (testtype) {
            return testtype.get("is_listable");
        });
    }.property("allTesttypes"),
    // defaultHint:"信息栏：待流转车辆数为{{流转}}台、待报废车辆数为{{试验完成}}台",
    defaultHint:"信息栏：待流转车辆数为<<闲置>>台，流转中车辆数为((<<流转中>>-{{试验完成}}-{{信息纠错}}))台、待报废车辆数为{{试验完成}}台",
    hint:function(){
        console.log("computing hint for testtypestable");
        var hint = this.get("flow.hint_text");
        hint = hint ? hint : this.get("defaultHint");
        var stepName,stepNames = hint.match(/{{[^{}]+}}/g),steps;
        if(stepNames && stepNames.length){
            steps = stepNames.map(function(n){
                stepName = n.replace(/{|}/g,"");
                return this.get("allSteps").findBy("name",stepName);
            }.switchScope(this));
        }
        var instances,tempCount;
        if(steps && steps.length){
            instances = this.get("model").filterBy("is_finished",false);
            tempCount = 0;
            steps.forEach(function(n){
                if(n){
                    tempCount = instances.filterBy("lastTrace.step.name",n.get("name")).length;
                    hint = hint.replace("{{%@}}".replace("%@", n.get("name")),tempCount);
                }
            });
        }
        if(/(<<流转中>>)|(<<闲置>>)/.test(hint)){
            var cars = this.get("allCars");
            if(/<<闲置>>/.test(hint)){
                tempCount = cars.filterBy("status","unused").get("length");
                hint = hint.replace("<<闲置>>",tempCount);
            }
            if(/<<流转中>>/.test(hint)){
                tempCount = cars.filterBy("status","turning").get("length");
                hint = hint.replace("<<流转中>>",tempCount);
            }
        }
        // 匹配并替换((script))格式的脚本为其自身Eval的结果。
        var scripts = hint.match(/\(\([^()]+\)\)/g);
        if(scripts && scripts.length){
            scripts.forEach(function(n){
                if(n){
                    tempCount = eval(n);
                    hint = hint.replace(n,tempCount);
                }
            });
        }
        return hint;
    }.property("model.@each.lastTrace","flow.hint_text","allCars.@each.status"),
    actions:{
    }
});

Hsc.TesttypestableTesttypeItemController = Ember.ObjectController.extend({
    needs:["application","testtypestable"],
    instances:function(){
        var allInstances = this.get("parentController.model");
        var currentTesttypeId = this.get("id");
        return allInstances.filter(function(instance){
            return instance.get("car.testtype.id") == currentTesttypeId;
        });
    }.property("parentController.model.@each.lastTrace")
});

Hsc.TesttypestableTesttypeStepItemController = Ember.ObjectController.extend({
    needs:["application","testtypestable_testtype_item"],
    title:function(){
        return this.get("parentController.name") + "\\" + this.get("name");
    }.property("parentController.name","name"),
    instances:function(){
        var parentInstances = this.get("parentController.instances");
        var currentStepId = this.get("id");
        return parentInstances.filter(function(instance){
            // 这里replace(/^V\d+_/,"")是把版本号前缀清除后再对比
            return instance.get("lastTrace.step.id").replace(/^V\d+_/,"") == currentStepId.replace(/^V\d+_/,"");
        });
    }.property("parentController.instances.@each.lastTrace")
});

Hsc.TesttypestableTesttypeStepInstanceItemController = Ember.ObjectController.extend({
    needs:["application","testtypestable_testtype_step_item"],
    title:function(){
        var car = this.get("car");
        return car.get("vehicletype.name") + car.get("number").substr(3);
    }.property("car.number","car.vehicletype.name")
});