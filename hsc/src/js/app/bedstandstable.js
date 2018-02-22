Hsc.BedstandstableRoute = Ember.Route.extend({
    controllerName: 'bedstandstable',
    model:function(params){
        return this.store.peekAll("instance");
    },
    activate:function(){
        this.controllerFor("application").set("isShowingExhibition",true);
        if(window.screen && window.screen.width >= 2560){
            Ember.run.next(function(){
                $(".bedstandstable-box").autoscroll();
            });
        }
        return this;
    },
    deactivate:function(){
        this.controllerFor("application").set("isShowingExhibition",false);
        if(window.screen && window.screen.width >= 2560){
            $(".bedstandstable-box").autoscroll("stop");
        }
        return this;
    },
    actions:{
        goTag:function(tag){
            if(tag){
                this.transitionTo('bedstandstable.tag',tag);
            }
            else{
                this.transitionTo('bedstandstable');
            }
        },
        goInstance:function(instance){
            this.transitionTo('monitor.instance',instance);
        }
    }
});

Hsc.BedstandstableTagRoute = Ember.Route.extend({
    controllerName: 'bedstandstable',
    model:function(params){
        this.controllerFor("bedstandstable").set("tag",params.tag);
        return this.modelFor("bedstandstable");
    },
    deactivate:function(){
        this.controllerFor("bedstandstable").set("tag","");
        return this;
    }
});

Hsc.BedstandstableView = Ember.View.extend({
    attributeBindings:"id",
    id:"bedstandstable",
    classNames:['navigable-container']
});

Hsc.BedstandstableController = Ember.ObjectController.extend({
    needs:["application","startup"],
    allCars:function(){
        return this.store.peekAll('car');
    }.property(),
    allBedstands:function(){
        return this.store.peekAll('bedstand');
    }.property("flow"),
    bedstands:function(){
        var tag = this.get("tag");
        return this.get("allBedstands").filter(function (bedstand) {
            return tag?(bedstand.get("tag") == tag):true;
        }).sortBy("sort");
    }.property("allBedstands","tag","allBedstands.@each.sort"),
    tag:"",
    allTagValues:function(){
        return this.get("allBedstands").mapBy("tag").uniq().removeObject("");
    }.property("allBedstands","tag"),
    tags:function(){
        var allTagValues = this.get("allTagValues").sort();
        return allTagValues.map(function(item,index){
            return {value:item}
        });
    }.property("allTagValues"),
    flow:function(){
        return this.store.peekAll('flow').findBy("is_bedstand");
    }.property(),
    allSteps:function(){
        return this.get("flow.current.steps")
    }.property("flow"),
    defaultHint:"信息栏：{{运行试验}}台设备运行中、{{设备检修}}台设备检修中",
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
        setTag:function(value){
            this.send("goTag",value);
        },
        clearTag:function(){
            this.send("goTag",null);
        }
    }
});

Hsc.BedstandstableItemController = Ember.ObjectController.extend({
    needs:["application","bedstandstable"],
    instances:function(){
        var allInstances = this.get("parentController.model");
        var currentBedstandId = this.get("id");
        var currentRunningState = this.get("running_state");
        if(currentRunningState == "waiting"){
            return [];
        }
        return allInstances.filter(function(instance){
            return instance.get("bedstand.id") == currentBedstandId && instance.get("lastTrace.step_running_state") == currentRunningState;
        });
    }.property("parentController.model.@each.lastTrace")
});

// Hsc.BedstandstableTesttypeStepItemController = Ember.ObjectController.extend({
//     needs:["application","bedstandstable_testtype_item"],
//     title:function(){
//         return this.get("parentController.name") + "\\" + this.get("name");
//     }.property("parentController.name","name"),
//     instances:function(){
//         var parentInstances = this.get("parentController.instances");
//         var currentStepId = this.get("id");
//         return parentInstances.filter(function(instance){
//             // 这里replace(/^V\d+_/,"")是把版本号前缀清除后再对比
//             return instance.get("lastTrace.step.id").replace(/^V\d+_/,"") == currentStepId.replace(/^V\d+_/,"");
//         });
//     }.property("parentController.instances.@each.lastTrace")
// });





