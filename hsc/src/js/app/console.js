Hsc.ConsolesRoute = Ember.Route.extend({
    renderTemplate: function() {
        this.render({ outlet: 'consoles' });
    },
    beforeModel: function() {
        
    },
    model: function () {
        return this.store.peekAll('console');
    },
    afterModel: function(model, transition) {
    },
    activate:function(){
        //这里要run.next的原因是要等view加载到页面后才能执行navigablePush，即要等view.didInsertElement执行完毕
        Ember.run.next(this,function(){
            var controller = this.controllerFor("consoles");
            controller.send("navigablePush");
        });
        return this;
    },
    deactivate:function(){
        var controller = this.controllerFor("consoles");
        controller.send("navigablePop");
        return this;
    },
    actions:{
        goBack:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('start.setting');
        },
        goConsole:function(console){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('console',console);
        },
        goNew:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('consoles.new');
        }
    }
});
Hsc.ConsoleRoute = Ember.Route.extend({
    controllerName: 'console',
    beforeModel: function() {
    },
    model:function(params){
        var curId = params.console_id;
        var console = this.store.peekRecord('console', curId);
        if(!console && curId.indexOf("fixture") == 0){
            //如果没有找到记录，并且是fixture开头的新记录则创建一个新记录来匹配
            return this.controllerFor("consoles").createRecord();
        }
        else{
            //注意，这里如果没有找到记录，并且不是fixture开头的新记录，将返回null
            return console;
        }
    },
    afterModel: function(model, transition) {
        if(!model){
            transition.send("goBack");
        }
    },
    activate:function(){
        //这里要run.next的原因是要等view加载到页面后才能执行navigablePush，即要等view.didInsertElement执行完毕
        Ember.run.next(this,function(){
            var controller = this.controllerFor("console");
            controller.send("navigablePush");
        });
        return this;
    },
    deactivate:function(){
        var controller = this.controllerFor("console");
        controller.send("navigablePop");
        return this;
    },
    actions:{
        goBack:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('consoles');
        }
    }
});
Hsc.ConsoleIndexRoute = Ember.Route.extend({
    controllerName: 'console',
    renderTemplate: function(controller) {
        controller.set("isEditing",false);
        controller.set("isNew",false);
        controller.set("pannelTitle",Hsc.get("detailModelTag").fmt(controller.get("modelName")));
        this.render('console',{ outlet: 'console',controller: controller });
    },
    afterModel: function(model, transition) {
    },
    deactivate:function(){
        //在这个路由中可能出现删除失败的情况，所以也需要回滚
        var controller = this.controllerFor("console");
        var model = controller.get("model");
        // model && model.rollbackAttributes();
        //删除数据失败需要还原，这里增加hasDirtyAttributes的判断，是因为删除成功的话hasDirtyAttributes为false，这时如果执行rollbackAttributes会造成model显示为没有删除成功
        if(model && model.get("hasDirtyAttributes")){
            model.rollbackAttributes();
        }
        return this;
    },
    actions:{
        goEdit:function(){
            this.transitionTo('console.edit');
        }
    }
});
Hsc.ConsoleEditRoute = Ember.Route.extend({
    controllerName: 'console',
    renderTemplate: function(controller) {
        controller.set("isEditing",true);
        controller.set("isNew",false);
        controller.set("pannelTitle",Hsc.get("editModelTag").fmt(controller.get("modelName")));
        this.render('console', {outlet: 'console',controller: controller});
    },
    afterModel: function(model, transition) {
    },
    deactivate:function(){
        var controller = this.controllerFor("console");
        var model = controller.get("model");
        // model && model.rollbackAttributes();
        //这里要增加删除的判断，是因为如果该记录被其他用户删除然后push过来的话，rollbackAttributes会把删除的记录撤销
        if(model && !model.get("isDeleted")){
            model.rollbackAttributes();
        }
        return this;
    },
    actions:{
        goIndex:function(){
            this.transitionTo('console.index');
        },
    }
});

Hsc.Console = DS.Model.extend({
    name: DS.attr('string'),
    organization: DS.belongsTo('organization'),
    description: DS.attr('string',{defaultValue: ""}),
    help_text: DS.attr('string'),
    on_yellow_timeout: DS.attr('number', {defaultValue: 0}),
    on_red_timeout: DS.attr('number', {defaultValue: 0}),
    on_color: DS.attr('string', {defaultValue: "green"}),
    off_yellow_timeout: DS.attr('number', {defaultValue: 0}),
    off_red_timeout: DS.attr('number', {defaultValue: 0}),
    off_color: DS.attr('string', {defaultValue: "gray"}),
    creater: DS.attr('string'),
    created_date: DS.attr('date'),
    modifier: DS.attr('string'),
    modified_date: DS.attr('date'),
    createrObject:function(){
        return this.store.peekRecord("user",this.get("creater"));
    }.property("creater"),
    modifierObject:function(){
        return this.store.peekRecord("user",this.get("creater"));
    }.property("creater"),
    nameDidChange:function(){
        var name = this.get("name");
        if(this.get("hasDirtyAttributes")){
            if(Ember.isEmpty(name)){
                this.get('errors').add('name', '不能为空');
            }
            else if(name.length > 20){
                this.get('errors').add('name', '长度不能超过20字符');
            }
            else{
                var curId = this.get("id");
                var isRepeated = this.store.peekAll('console').filter(function (console) {
                    return console.get("id") != curId && console.get("name") == name;
                }).length > 0;
                if(isRepeated){
                    this.get('errors').add('name', '不能重复');
                }

            }
        }
    }.observes("name"),
    organizationDidChange:function(){
        var organization = this.get("organization");
        if(this.get("hasDirtyAttributes")){
            if(Ember.isEmpty(organization)){
                this.get('errors').add('organization', '不能为空');
            }
            else{
                this.get('errors').remove('organization');
            }
        }
    }.observes("organization"),
    onYellowTimeoutDidChange:function(){
        var on_yellow_timeout = this.get("on_yellow_timeout");
        if(this.get("hasDirtyAttributes")){
            if(Ember.isEmpty(on_yellow_timeout)){
                this.get('errors').add('on_yellow_timeout', '不能为空');
            }
            else if(!/^0$|^[1-9]\d*$/g.test(on_yellow_timeout)){
                this.get('errors').add('on_yellow_timeout', '请输入零或有效正整数');
            }
        }
    }.observes("on_yellow_timeout"),
    onRedTimeoutDidChange:function(){
        var on_red_timeout = this.get("on_red_timeout");
        if(this.get("hasDirtyAttributes")){
            if(Ember.isEmpty(on_red_timeout)){
                this.get('errors').add('on_red_timeout', '不能为空');
            }
            else if(!/^0$|^[1-9]\d*$/g.test(on_red_timeout)){
                this.get('errors').add('on_red_timeout', '请输入零或有效正整数');
            }
        }
    }.observes("on_red_timeout"),
    offYellowTimeoutDidChange:function(){
        var off_yellow_timeout = this.get("off_yellow_timeout");
        if(this.get("hasDirtyAttributes")){
            if(Ember.isEmpty(off_yellow_timeout)){
                this.get('errors').add('off_yellow_timeout', '不能为空');
            }
            else if(!/^0$|^[1-9]\d*$/g.test(off_yellow_timeout)){
                this.get('errors').add('off_yellow_timeout', '请输入零或有效正整数');
            }
        }
    }.observes("off_yellow_timeout"),
    offRedTimeoutDidChange:function(){
        var off_red_timeout = this.get("off_red_timeout");
        if(this.get("hasDirtyAttributes")){
            if(Ember.isEmpty(off_red_timeout)){
                this.get('errors').add('off_red_timeout', '不能为空');
            }
            else if(!/^0$|^[1-9]\d*$/g.test(off_red_timeout)){
                this.get('errors').add('off_red_timeout', '请输入零或有效正整数');
            }
        }
    }.observes("off_red_timeout"),
    descriptionDidChange:function(){
        var description = this.get("description");
        if(this.get("hasDirtyAttributes")){
            if(!Ember.isEmpty(description) && description.length > 200){
                this.get('errors').add('description', '长度不能超过200字符');
            }
        }
    }.observes("description"),
    helpTextDidChange:function(){
        var help_text = this.get("help_text");
        if(this.get("hasDirtyAttributes")){
            if(!Ember.isEmpty(help_text) && help_text.length > 200){
                this.get('errors').add('help_text', '长度不能超过200字符');
            }
        }
    }.observes("help_text")
});

Hsc.ConsolesView = Ember.View.extend({
    classNames:['start-setting-consoles','navigable-pane','collapse']
});
Hsc.ConsoleView = Ember.View.extend({
    classNames:['start-setting-consoles-console','navigable-pane','collapse']
});

Hsc.ConsolesController = Ember.ArrayController.extend({
    needs:["application"],
    // sortProperties: ['created_date','id'],
    // sortAscending: true,
    createdDateSorting: ['created_date:asc','id'],
    createdDateSortingDesc: ['created_date:desc','id'],
    modifiedDateSortingDesc: ['modified_date:desc'],
    arrangedResult: Ember.computed.sort('model', 'createdDateSorting'),
    actions:{
        navigablePush:function(){
            $(".start-setting.navigable-pane").navigablePush({
                targetTo:".start-setting-consoles.navigable-pane",
                animation:Hsc.transitionAnimation
            });
            Hsc.transitionAnimation = "none";
        },
        navigablePop:function(){
            $(".start-setting-consoles.navigable-pane").navigablePop({
                targetTo:".start-setting.navigable-pane",
                animation:Hsc.transitionAnimation
            });
            Hsc.transitionAnimation = "none";
        }
    }
});

Hsc.ConsoleController = Ember.ObjectController.extend({
    needs:["application"],
    isEditing:false,
    isNew:false,
    modelName:"控制台",
    pannelTitle:"控制台详情",
    currentStateNameBinding:Ember.Binding.oneWay("model.currentState.stateName"),
    afterRecordIsDeleted:function(){
        //当记录被删除时，返回上一个界面，这里的删除包括当前用户删除及从服务器中push过来的删除
        var currentStateName = this.get("model.currentState.stateName");
        if(currentStateName == "root.deleted.saved"){
            var currentRouteName = this.get("controllers.application.currentRouteName");
            if(currentRouteName == "console.index" 
                || currentRouteName == "console.edit.index"){
                this.send("goBack");
            }
        }
    }.observes("currentStateName"),
    isNeedToShowFix:function(){
        return !(this.get("isNew") || this.get("isEditing"));
    }.property("isNew","isEditing"),
    helpInfo:"只有该控制台的“关联组织”才能操作该控制台，\
    在控制台中可以在“激活”和“停止”两种状态间切换，\
    可通过设置超时时限来提醒用户车辆处于“激活”或“停止”状态的时间已超时，\
    “帮助信息”中的文字内容将出现在控制台的帮助栏以帮助用户正确的操作该控制台。",
    organizations:function(){
        return this.store.peekAll("organization");
    }.property(),
    selectedOrganization:function(k,v){
        var model = this.get('model');
        if (v === undefined) {
            return model.get("organization");
        } else {
            model.set('organization', v);
            model.notifyPropertyChange("isRelationshipsChanged");
            return v;
        }
    }.property("model.organization"),
    // selectedOrganizationBinding:"organization",
    isOnGray:Ember.computed.equal('on_color', 'gray'),
    isOnGreen:Ember.computed.equal('on_color', 'green'),
    isOnYellow:Ember.computed.equal('on_color', 'yellow'),
    isOnRed:Ember.computed.equal('on_color', 'red'),

    isOffGray:Ember.computed.equal('off_color', 'gray'),
    isOffGreen:Ember.computed.equal('off_color', 'green'),
    isOffYellow:Ember.computed.equal('off_color', 'yellow'),
    isOffRed:Ember.computed.equal('off_color', 'red'),
    actions:{
        navigablePush:function(){
            var controller = this;
            $(".start-setting-consoles.navigable-pane").navigablePush({
                targetTo:".start-setting-consoles-console.navigable-pane",
                animation:Hsc.transitionAnimation,
                callBack:function(){
                    if(!controller.get("model")){
                        controller.send("goBack");
                    }
                }
            });
            Hsc.transitionAnimation = "none";
        },
        navigablePop:function(){
            $(".start-setting-consoles-console.navigable-pane").navigablePop({
                targetTo:".start-setting-consoles.navigable-pane",
                animation:Hsc.transitionAnimation
            });
            Hsc.transitionAnimation = "none";
        },
        edit: function () {
            this.send("goEdit");
        },
        setOnColor:function(value){
            this.get('model').set("on_color",value);
        },
        setOffColor:function(value){
            this.get('model').set("off_color",value);
        },
        save:function(){
            var isNew = this.get("isNew");
            this.get('model').save().then(function(answer){
                if(isNew){
                    this.send("goBack");
                }
                else{
                    this.send("goIndex");
                }
            }.switchScope(this), function(reason){
            }.switchScope(this));
        },
        cancel:function(){
            if(this.get("isNew")){
                this.send("goBack");
            }
            else{
                this.send("goIndex");
            }
        },
        deleteRecord:function(){
            this.get("model").deleteRecord();
            this.get("model").save().then(function(answer){
            }.switchScope(this), function(reason){
            }.switchScope(this));
        }
    }
});

