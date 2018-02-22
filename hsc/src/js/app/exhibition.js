Hsc.ExhibitionsRoute = Ember.Route.extend({
    renderTemplate: function() {
        this.render({ outlet: 'exhibitions' });
    },
    beforeModel: function() {
        
    },
    model: function () {
        
        return this.store.peekAll('exhibition');
    },
    afterModel: function(model, transition) {
    },
    activate:function(){
        //这里要run.next的原因是要等view加载到页面后才能执行navigablePush，即要等view.didInsertElement执行完毕
        Ember.run.next(this,function(){
            var controller = this.controllerFor("exhibitions");
            controller.send("navigablePush");
        });
        return this;
    },
    deactivate:function(){
        var controller = this.controllerFor("exhibitions");
        controller.send("navigablePop");
        return this;
    },
    actions:{
        goBack:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('start.setting');
        },
        goExhibition:function(exhibition){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('exhibition',exhibition);
        },
        goNew:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('exhibitions.new');
        }
    }
});
Hsc.ExhibitionRoute = Ember.Route.extend({
    controllerName: 'exhibition',
    beforeModel: function() {
    },
    model:function(params){
        var curId = params.exhibition_id;
        var exhibition = this.store.peekRecord('exhibition', curId);
        if(!exhibition && curId.indexOf("fixture") == 0){
            //如果没有找到记录，并且是fixture开头的新记录则创建一个新记录来匹配
            return this.controllerFor("exhibitions").createRecord();
        }
        else{
            //注意，这里如果没有找到记录，并且不是fixture开头的新记录，将返回null
            return exhibition;
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
            var controller = this.controllerFor("exhibition");
            controller.send("navigablePush");
        });
        return this;
    },
    deactivate:function(){
        var controller = this.controllerFor("exhibition");
        controller.send("navigablePop");
        return this;
    },
    actions:{
        goBack:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('exhibitions');
        }
    }
});
Hsc.ExhibitionIndexRoute = Ember.Route.extend({
    controllerName: 'exhibition',
    renderTemplate: function(controller) {
        controller.set("isEditing",false);
        controller.set("isNew",false);
        controller.set("pannelTitle",Hsc.get("detailModelTag").fmt(controller.get("modelName")));
        this.render('exhibition',{ outlet: 'exhibition',controller: controller });
    },
    deactivate:function(){
        //在这个路由中可能出现删除失败的情况，所以也需要回滚
        var controller = this.controllerFor("exhibition");
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
            this.transitionTo('exhibition.edit');
        }
    }
});
Hsc.ExhibitionEditRoute = Ember.Route.extend({
    controllerName: 'exhibition',
    renderTemplate: function(controller) {
        controller.set("isEditing",true);
        controller.set("isNew",false);
        controller.set("pannelTitle",Hsc.get("editModelTag").fmt(controller.get("modelName")));
        this.render('exhibition', {outlet: 'exhibition',controller: controller});
    },
    actions:{
        goIndex:function(){
            this.transitionTo('exhibition.index');
        },
    }
});

Hsc.ExhibitionSerializer = Hsc.ApplicationSerializer.extend(DS.EmbeddedRecordsMixin, {
    primaryKey:'id',
    attrs: {
        areas: {embedded: 'always'}
    }
});
Hsc.Exhibition = DS.Model.extend({
    name: DS.attr('string'),
    areas: DS.hasMany('screenarea'),
    splits: DS.attr('string'),//以逗号分隔的分屏显示时长，配合areas中的target属性可实现分屏显示功能
    is_fluid: DS.attr('boolean', {defaultValue: false}),//是否流式布局，即手机模式
    icon: DS.attr('string'),
    platform: DS.attr('string'),
    description: DS.attr('string',{defaultValue: ""}),
    creater: DS.attr('string'),
    created_date: DS.attr('date'),
    modifier: DS.attr('string'),
    modified_date: DS.attr('date'),
    arraySplits:function(){
        var splits = this.get("splits");
        return splits ? splits.split(",") : [];
    }.property(),
    isNeedToSplit:function(){
        var arraySplits = this.get("arraySplits");
        return arraySplits.length > 1;
    }.property()
});

Hsc.ExhibitionsView = Ember.View.extend({
    classNames:['start-setting-exhibitions','navigable-pane','collapse']
});
Hsc.ExhibitionView = Ember.View.extend({
    classNames:['start-setting-exhibitions-exhibition','navigable-pane','collapse']
});

Hsc.ExhibitionsController = Ember.ArrayController.extend({
    needs:["application"],
    createRecord:function(){
        var exhibition = this.store.createRecord('exhibition', {
            name: 'New Group'
        });
        return exhibition;
    },
    actions:{
        navigablePush:function(){
            $(".start-setting.navigable-pane").navigablePush({
                targetTo:".start-setting-exhibitions.navigable-pane",
                animation:Hsc.transitionAnimation
            });
            Hsc.transitionAnimation = "none";
        },
        navigablePop:function(){
            $(".start-setting-exhibitions.navigable-pane").navigablePop({
                targetTo:".start-setting.navigable-pane",
                animation:Hsc.transitionAnimation
            });
            Hsc.transitionAnimation = "none";
        },
        newRecord:function(){
            this.send("goNew");
        }
    }
});

Hsc.ExhibitionController = Ember.ObjectController.extend({
    needs:["application"],
    isEditing:false,
    isNew:false,
    modelName:"展示台",
    pannelTitle:"展示台详情",
    helpInfo:"在流程步骤中指定该展示台后将自动关联到该展示台的关联组织，工作单流转到该展示台也将自动发送到工作单到该展示台关联组织的工作台。",
    actions:{
        navigablePush:function(){
            var controller = this;
            $(".start-setting-exhibitions.navigable-pane").navigablePush({
                targetTo:".start-setting-exhibitions-exhibition.navigable-pane",
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
            $(".start-setting-exhibitions-exhibition.navigable-pane").navigablePop({
                targetTo:".start-setting-exhibitions.navigable-pane",
                animation:Hsc.transitionAnimation
            });
            Hsc.transitionAnimation = "none";
        },
        edit: function () {
            this.send("goEdit");
        },
        save:function(){
        },
        cancel:function(){
        },
        deleteRecord:function(){
        }
    }
});

Hsc.Exhibition.FIXTURES = [
    {
        id: 1,
        name: '标准展示台',
        areas: [
            {
                id: "1_1",
                workshops:null,
                children:null,
                title: 'Running SWP/SSS',
                testtypes:[1],
                steps: ["0_19CN4TNFG"],
                state: "on",
                columns: 4,
                rows: 6,
                description: '正在跑试验SWP/SSS的车辆'
            },
            {
                id: "1_2",
                workshops:null,
                children:null,
                title: 'Running SVP',
                testtypes:[2],
                steps: ["0_19CN4TNFG"],
                state: "on",
                columns: 2,
                rows: 6,
                description: '正在跑试验SVP的车辆'
            },
            {
                id: "1_3",
                workshops:null,
                children:null,
                title: 'Run-in & others',
                testtypes:[3],
                steps: ["0_19CN4TNFG"],
                state: "on",
                columns: 2,
                rows: 6,
                description: '正在跑试验Einlauf&others的车辆'
            },
            {
                id: "1_4",
                workshops:null,
                children:null,
                title: 'Not running cars',
                testtypes:null,
                steps: ["0_19CN4TNFG","0_19CN4S98E"],
                state: "off",
                columns: 4,
                rows: 6,
                description: '待统计员接收及待试验车辆'
            },
            {
                id: "1_5",
                workshops:null,
                children:null,
                title: 'Engineer',
                testtypes:null,
                steps: ["0_19CMRQBM9","0_19CN5B10P"],
                state: "",
                columns: 4,
                rows: 3,
                is_show_user: true,
                description: '工程师正在处理的车辆，包括工程师检查、工程师招车等'
            },
            {
                id: "1_6",
                workshops:null,
                children:null,
                title: 'Inspector',
                testtypes:null,
                steps: ["0_19CN4OA8F"],
                state: "",
                columns: 2,
                rows: 3,
                description: '检查员正在检查的车辆'
            },
            {
                id: "1_7",
                workshops:null,
                children:null,
                title: 'Tire change',
                testtypes:null,
                steps: ["0_19CN5073M"],
                state: "",
                columns: 2,
                rows: 3,
                description: '正在换胎的车辆'
            },
            {
                id: "1_8",
                workshops:null,
                children:null,
                title: 'Brake change',
                testtypes:null,
                steps: ["0_19CN523JL"],
                state: "",
                columns: 2,
                rows: 3,
                description: '正在换制动片的车辆'
            },
            {
                id: "1_9",
                workshops:null,
                children:null,
                title: 'Maintenance',
                testtypes:null,
                steps: ["0_19CMRKHCR"],
                state: "",
                columns: 2,
                rows: 3,
                description: '正在保养的车辆'
            },
            {
                id: "1_10",
                workshops:null,
                children:null,
                title: 'Support Team',
                testtypes:null,
                steps: ["1","0_19CN57N7P","0_19CN5C9AF","0_19CN53UCT"],
                state: "",
                columns: 4,
                rows: 3,
                is_show_user: true,
                description: '支持组正在处理的车辆，包括试验前准备、试验后准备、支持组招车、故障支持等'
            },
            {
                id: "1_11",
                workshops:null,
                children:[
                    {
                        id: "1_12",
                        workshops:[1],
                        children:null,
                        title: 'GroupA',
                        testtypes:null,
                        steps: [],
                        state: "",
                        columns: 3,
                        rows: 12,
                        description: '所有正在车间组GroupA中处理的车辆'
                    },
                    {
                        id: "1_13",
                        workshops:[2],
                        children:null,
                        title: 'GroupB',
                        testtypes:null,
                        steps: [],
                        state: "",
                        columns: 3,
                        rows: 12,
                        description: '所有正在车间组GroupB中处理的车辆'
                    },
                    {
                        id: "1_14",
                        workshops:[3],
                        children:null,
                        title: 'GroupC',
                        testtypes:null,
                        steps: [],
                        state: "",
                        columns: 2,
                        rows: 12,
                        description: '所有正在车间组GroupC中处理的车辆'
                    },
                    {
                        id: "1_15",
                        workshops:[4],
                        children:null,
                        title: 'GroupE',
                        testtypes:null,
                        steps: [],
                        state: "",
                        columns: 2,
                        rows: 12,
                        description: '所有正在车间组GroupE中处理的车辆'
                    },
                    {
                        id: "1_16",
                        workshops:[5],
                        children:null,
                        title: 'GroupK',
                        testtypes:null,
                        steps: [],
                        state: "",
                        columns: 2,
                        rows: 12,
                        description: '所有正在车间组GroupK中处理的车辆'
                    }
                ],
                title: 'WORKSHOP',
                testtypes:null,
                steps: [],
                state: "",
                columns: 8,
                rows: 3,
                description: '所有正在车间组处理的车辆，包括装车、故障维修、拆解等'
            }
        ],
        icon: 'glyphicon-th-large',
        platform: 'hidden-xs',
        description: '',
        creater: 1,
        created_date: new Date(),
        modifier: 1,
        created_date: new Date()
    },
    {
        id: 2,
        name: '分屏展示台',
        areas: [
            {
                id: "2_1",
                workshops:null,
                children:null,
                title: 'Running SWP/SSS',
                testtypes:[1],
                steps: ["0_19CN4TNFG"],
                state: "on",
                columns: 4,
                rows: 12,
                target: 0,
                description: '正在跑试验SWP/SSS的车辆'
            },
            {
                id: "2_2",
                workshops:null,
                children:null,
                title: 'Running SVP',
                testtypes:[2],
                steps: ["0_19CN4TNFG"],
                state: "on",
                columns: 2,
                rows: 12,
                target: 0,
                description: '正在跑试验SVP的车辆'
            },
            {
                id: "2_3",
                workshops:null,
                children:null,
                title: 'Run-in & others',
                testtypes:[3],
                steps: ["0_19CN4TNFG"],
                state: "on",
                columns: 2,
                rows: 12,
                target: 0,
                description: '正在跑试验Einlauf&others的车辆'
            },
            {
                id: "2_4",
                workshops:null,
                children:null,
                title: 'Not running cars',
                testtypes:null,
                steps: ["0_19CN4TNFG","0_19CN4S98E"],
                state: "off",
                columns: 4,
                rows: 12,
                target: 0,
                description: '待统计员接收及待试验车辆'
            },
            {
                id: "2_5",
                workshops:null,
                children:null,
                title: 'Engineer',
                testtypes:null,
                steps: ["0_19CMRQBM9","0_19CN5B10P"],
                state: "",
                columns: 4,
                rows: 5,
                is_show_user: true,
                target: 1,
                description: '工程师正在处理的车辆，包括工程师检查、工程师招车等'
            },
            {
                id: "2_6",
                workshops:null,
                children:null,
                title: 'Inspector',
                testtypes:null,
                steps: ["0_19CN4OA8F"],
                state: "",
                columns: 2,
                rows: 5,
                target: 1,
                description: '检查员正在检查的车辆'
            },
            {
                id: "2_7",
                workshops:null,
                children:null,
                title: 'Tire change',
                testtypes:null,
                steps: ["0_19CN5073M"],
                state: "",
                columns: 2,
                rows: 5,
                target: 1,
                description: '正在换胎的车辆'
            },
            {
                id: "2_8",
                workshops:null,
                children:null,
                title: 'Brake change',
                testtypes:null,
                steps: ["0_19CN523JL"],
                state: "",
                columns: 2,
                rows: 5,
                target: 1,
                description: '正在换制动片的车辆'
            },
            {
                id: "2_9",
                workshops:null,
                children:null,
                title: 'Maintenance',
                testtypes:null,
                steps: ["0_19CMRKHCR"],
                state: "",
                columns: 2,
                rows: 5,
                target: 1,
                description: '正在保养的车辆'
            },
            {
                id: "2_10",
                workshops:null,
                children:null,
                title: 'Support Team',
                testtypes:null,
                steps: ["1","0_19CN57N7P","0_19CN5C9AF","0_19CN53UCT"],
                state: "",
                columns: 4,
                rows: 7,
                is_show_user: true,
                target: 1,
                description: '支持组正在处理的车辆，包括试验前准备、试验后准备、支持组招车、故障支持等'
            },
            {
                id: "2_11",
                workshops:null,
                children:[
                    {
                        id: "2_12",
                        workshops:[1],
                        children:null,
                        title: 'GroupA',
                        testtypes:null,
                        steps: [],
                        state: "",
                        columns: 3,
                        rows: 12,
                        description: '所有正在车间组GroupA中处理的车辆'
                    },
                    {
                        id: "2_13",
                        workshops:[2],
                        children:null,
                        title: 'GroupB',
                        testtypes:null,
                        steps: [],
                        state: "",
                        columns: 3,
                        rows: 12,
                        description: '所有正在车间组GroupB中处理的车辆'
                    },
                    {
                        id: "2_14",
                        workshops:[3],
                        children:null,
                        title: 'GroupC',
                        testtypes:null,
                        steps: [],
                        state: "",
                        columns: 2,
                        rows: 12,
                        description: '所有正在车间组GroupC中处理的车辆'
                    },
                    {
                        id: "2_15",
                        workshops:[4],
                        children:null,
                        title: 'GroupE',
                        testtypes:null,
                        steps: [],
                        state: "",
                        columns: 2,
                        rows: 12,
                        description: '所有正在车间组GroupE中处理的车辆'
                    },
                    {
                        id: "2_16",
                        workshops:[5],
                        children:null,
                        title: 'GroupK',
                        testtypes:null,
                        steps: [],
                        state: "",
                        columns: 2,
                        rows: 12,
                        description: '所有正在车间组GroupK中处理的车辆'
                    }
                ],
                title: 'WORKSHOP',
                testtypes:null,
                steps: [],
                state: "",
                columns: 8,
                rows: 7,
                target: 1,
                description: '所有正在车间组处理的车辆，包括装车、故障维修、拆解等'
            }
        ],
        splits:"10,12",
        icon: 'glyphicon-film',
        platform: 'hidden-xs',
        description: '',
        creater: 1,
        created_date: new Date(),
        modifier: 1,
        created_date: new Date()
    },
    {
        id: 3,
        name: '手机展示台',
        areas: [
            {
                id: "3_1",
                workshops:null,
                children:null,
                title: 'Running SWP/SSS',
                testtypes:[1],
                steps: ["0_19CN4TNFG"],
                state: "on",
                columns: 12,
                rows: 6,
                description: '正在跑试验SWP/SSS的车辆'
            },
            {
                id: "3_2",
                workshops:null,
                children:null,
                title: 'Running SVP',
                testtypes:[2],
                steps: ["0_19CN4TNFG"],
                state: "on",
                columns: 12,
                rows: 6,
                description: '正在跑试验SVP的车辆'
            },
            {
                id: "3_3",
                workshops:null,
                children:null,
                title: 'Run-in & others',
                testtypes:[3],
                steps: ["0_19CN4TNFG"],
                state: "on",
                columns: 12,
                rows: 6,
                description: '正在跑试验Einlauf&others的车辆'
            },
            {
                id: "3_4",
                workshops:null,
                children:null,
                title: 'Not running cars',
                testtypes:null,
                steps: ["0_19CN4TNFG","0_19CN4S98E"],
                state: "off",
                columns: 12,
                rows: 6,
                description: '待统计员接收及待试验车辆'
            },
            {
                id: "3_5",
                workshops:null,
                children:null,
                title: 'Engineer',
                testtypes:null,
                steps: ["0_19CMRQBM9","0_19CN5B10P"],
                state: "",
                columns: 12,
                rows: 3,
                is_show_user: true,
                description: '工程师正在处理的车辆，包括工程师检查、工程师招车等'
            },
            {
                id: "3_6",
                workshops:null,
                children:null,
                title: 'Inspector',
                testtypes:null,
                steps: ["0_19CN4OA8F"],
                state: "",
                columns: 12,
                rows: 3,
                description: '检查员正在检查的车辆'
            },
            {
                id: "3_7",
                workshops:null,
                children:null,
                title: 'Tire change',
                testtypes:null,
                steps: ["0_19CN5073M"],
                state: "",
                columns: 12,
                rows: 3,
                description: '正在换胎的车辆'
            },
            {
                id: "3_8",
                workshops:null,
                children:null,
                title: 'Brake change',
                testtypes:null,
                steps: ["0_19CN523JL"],
                state: "",
                columns: 12,
                rows: 3,
                description: '正在换制动片的车辆'
            },
            {
                id: "3_9",
                workshops:null,
                children:null,
                title: 'Maintenance',
                testtypes:null,
                steps: ["0_19CMRKHCR"],
                state: "",
                columns: 12,
                rows: 3,
                description: '正在保养的车辆'
            },
            {
                id: "3_10",
                workshops:null,
                children:null,
                title: 'Support Team',
                testtypes:null,
                steps: ["1","0_19CN57N7P","0_19CN5C9AF","0_19CN53UCT"],
                state: "",
                columns: 12,
                rows: 3,
                is_show_user: true,
                description: '支持组正在处理的车辆，包括试验前准备、试验后准备、支持组招车、故障支持等'
            },
            {
                id: "3_11",
                workshops:null,
                children:[
                    {
                        id: "3_12",
                        workshops:[1],
                        children:null,
                        title: 'GroupA',
                        testtypes:null,
                        steps: [],
                        state: "",
                        columns: 12,
                        rows: 12,
                        description: '所有正在车间组GroupA中处理的车辆'
                    },
                    {
                        id: "3_13",
                        workshops:[2],
                        children:null,
                        title: 'GroupB',
                        testtypes:null,
                        steps: [],
                        state: "",
                        columns: 12,
                        rows: 12,
                        description: '所有正在车间组GroupB中处理的车辆'
                    },
                    {
                        id: "3_14",
                        workshops:[3],
                        children:null,
                        title: 'GroupC',
                        testtypes:null,
                        steps: [],
                        state: "",
                        columns: 12,
                        rows: 12,
                        description: '所有正在车间组GroupC中处理的车辆'
                    },
                    {
                        id: "3_15",
                        workshops:[4],
                        children:null,
                        title: 'GroupE',
                        testtypes:null,
                        steps: [],
                        state: "",
                        columns: 12,
                        rows: 12,
                        description: '所有正在车间组GroupE中处理的车辆'
                    },
                    {
                        id: "3_16",
                        workshops:[5],
                        children:null,
                        title: 'GroupK',
                        testtypes:null,
                        steps: [],
                        state: "",
                        columns: 12,
                        rows: 12,
                        description: '所有正在车间组GroupK中处理的车辆'
                    }
                ],
                title: 'WORKSHOP',
                testtypes:null,
                steps: [],
                state: "",
                columns: 12,
                rows: 3,
                description: '所有正在车间组处理的车辆，包括装车、故障维修、拆解等'
            }
        ],
        icon: 'glyphicon-phone',
        is_fluid: true,
        platform: '',
        description: '',
        creater: 1,
        created_date: new Date(),
        modifier: 1,
        created_date: new Date()
    }
];
