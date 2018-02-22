Hsc.StepAdapter = Hsc.ApplicationAdapter.extend({
    generateIdForRecord:function(store, record){
        var flowversionController = this.container.lookup("controller:flowversion");
        return Hsc.generateUUID(this.container.lookup("controller:flowversion").get("version"));
    }
});
Hsc.Step = DS.Model.extend({
    name: DS.attr('string'),
    nickname: DS.attr('string', {defaultValue: ''}),
    type: DS.attr('string'),//开始步骤（start）、开始步骤（start）、结束步骤（end）、中间步骤（process）
    handler_org_type: DS.attr('string', {defaultValue: 'fix_organization'}),//处理组织类型，不能为空，选项：指定组织fix_organization，试验类型关联组织relate_testtype，台架关联组织relate_bedstand
    handler_type: DS.attr('string', {defaultValue: 'empty'}),//处理人类型，不能为空，选项：指定人员fix_user，处理时预定人员reserve_user，空empty
    next_step_type: DS.attr('string'),//流转方式，不能为空，选项：自由流转all_step，返回上一步last_step
    next_step_default: DS.attr('string',{defaultValue: 'none'}),//默认下一步骤，选项：开始start、结束end、无none
    organization: DS.belongsTo('organization'),//关联组织，handler_org_type为fix_organization时不能为空
    user: DS.belongsTo('user'),//关联用户，handler_type为fix_user时不能为空
    is_endable: DS.attr('boolean', {defaultValue: false}),//是否可流转到结束步骤，只有该属性值为true时，才可以把工作单流转到结束步骤，即下一步骤列表才可能包含结束步骤待选
    is_handler_locked: DS.attr('boolean', {defaultValue: true}),//是否锁定处理人为当前登录账户，如果锁定则工作单中处理人只能是当前登录用户，不可以选择处理人，反之可以选择其他用户为处理人
    is_listable: DS.attr('boolean', {defaultValue: true}),//是否可在大屏展示
    is_bedstand_info_needed: DS.attr('boolean', {defaultValue: false}),//是否需要台架备注
    description: DS.attr('string',{defaultValue: ""}),
    help_text: DS.attr('string'),//当工作单流转到当前步骤时给用户提示帮助
    default_info: DS.attr('string'),//当前步骤的默认处理信息
    form_power:DS.attr('string', {defaultValue: "readonly"}),//readonly/editable/none
    bedstand_running_state:DS.attr('string', {defaultValue: "waiting"}),//当前步骤台架目标运行状态：waiting（待样）、running（运行）、repairing（检修）、rating（标定）、upkeeping（保养）
    yellow_timeout: DS.attr('number', {defaultValue: 0}),
    red_timeout: DS.attr('number', {defaultValue: 0}),
    color: DS.attr('string', {defaultValue: "green"}),
    // flowversion: DS.belongsTo('flowversion'),//这个属性是hasmany,embeded自带的需要加上才能关联到父字段
    isStart:function(){
        return this.get("type") == "start";
    }.property("modified_date"),
    isEnd:function(){
        return this.get("type") == "end";
    }.property("modified_date"),
    nameDidChange:function(){
        var name = this.get("name");
        if(this.get("hasDirtyAttributes") && !this.get("isDeleted")){
            if(Ember.isEmpty(name)){
                this.get('errors').add('name', '不能为空');
            }
            else if(name.length > 20){
                this.get('errors').add('name', '长度不能超过20字符');
            }
            else{
                var curId = this.get("id");
                var steps = this.get("flowversion.steps");
                var isRepeated = steps && steps.filter(function (step) {
                    return step.get("id") != curId && step.get("name") == name;
                }).length > 0;
                if(isRepeated){
                    this.get('errors').add('name', '不能重复');
                }
                else{
                    this.get('errors').remove('name');
                }

            }
        }
    }.observes("name","flowversion.steps.@each.name"),
    organizationDidChange:function(){
        if(this.get("isEnd")){
            return;
        }
        var organization = this.get("organization"),
            handler_org_type = this.get("handler_org_type");
        if(this.get("hasDirtyAttributes") && !this.get("isDeleted")){
            if(handler_org_type == "fix_organization" && Ember.isEmpty(organization)){
                this.get('errors').add('organization', '不能为空');
            }
            else{
                this.get('errors').remove('organization');
            }
        }
    }.observes("organization"),
    userDidChange:function(){
        var user = this.get("user"),
            handler_type = this.get("handler_type");
        if(this.get("hasDirtyAttributes") && !this.get("isDeleted")){
            if(handler_type == "fix_user" && Ember.isEmpty(user)){
                this.get('errors').add('user', '不能为空');
            }
            else{
                this.get('errors').remove('user');
            }
        }
    }.observes("user"),
    descriptionDidChange:function(){
        var description = this.get("description");
        if(this.get("hasDirtyAttributes") && !this.get("isDeleted")){
            if(!Ember.isEmpty(description) && description.length > 200){
                this.get('errors').add('description', '长度不能超过200字符');
            }
        }
    }.observes("description"),
    helpTextDidChange:function(){
        var help_text = this.get("help_text");
        if(this.get("hasDirtyAttributes") && !this.get("isDeleted")){
            if(!Ember.isEmpty(help_text) && help_text.length > 200){
                this.get('errors').add('help_text', '长度不能超过200字符');
            }
        }
    }.observes("help_text"),
    defaultInfoDidChange:function(){
        var default_info = this.get("default_info");
        if(this.get("hasDirtyAttributes") && !this.get("isDeleted")){
            if(!Ember.isEmpty(default_info) && default_info.length > 200){
                this.get('errors').add('default_info', '长度不能超过200字符');
            }
        }
    }.observes("default_info"),
    yellowTimeoutDidChange:function(){
        var yellow_timeout = this.get("yellow_timeout");
        if(this.get("hasDirtyAttributes") && !this.get("isDeleted")){
            if(Ember.isEmpty(yellow_timeout)){
                this.get('errors').add('yellow_timeout', '不能为空');
            }
            // else if(!/^0$|^[1-9]\d*$/g.test(yellow_timeout)){
            else if(!/^(0|[1-9]\d*)(\.\d{1})?$/g.test(yellow_timeout)){
                this.get('errors').add('yellow_timeout', '请输入零或有效正数(小数点1位)');
            }
        }
    }.observes("yellow_timeout"),
    redTimeoutDidChange:function(){
        var red_timeout = this.get("red_timeout");
        if(this.get("hasDirtyAttributes") && !this.get("isDeleted")){
            if(Ember.isEmpty(red_timeout)){
                this.get('errors').add('red_timeout', '不能为空');
            }
            // else if(!/^0$|^[1-9]\d*$/g.test(red_timeout)){
            else if(!/^(0|[1-9]\d*)(\.\d{1})?$/g.test(red_timeout)){
                this.get('errors').add('red_timeout', '请输入零或有效正数(小数点1位)');
            }
        }
    }.observes("red_timeout"),
    nextStepDefaultOrIsEndableDidChange:function(){
        var next_step_default = this.get("next_step_default"),
            is_endable = this.get("is_endable"),
            next_step_type = this.get("next_step_type");
        if(this.get("hasDirtyAttributes") && !this.get("isDeleted")){
            var tempErrorTag = false;
            if(next_step_type === "last_step" && next_step_default !== "none"){
                tempErrorTag = true;
                this.get('errors').remove('next_step_default');
                this.get('errors').add('next_step_default', '流转方式为“返回上一步”时，只能为无');
            }
            else{
                this.get('errors').remove('next_step_default');
            }

            if(!is_endable && next_step_default === "end"){
                this.get('errors').add('next_step_default', '与“可流转到结束步骤”属性冲突');
                this.get('errors').add('is_endable', '与“默认下一步骤”属性冲突');
            }
            else{
                if(!tempErrorTag){
                    this.get('errors').remove('next_step_default');
                }
                this.get('errors').remove('is_endable');
            }
        }
    }.observes("is_endable","next_step_default","next_step_type")
});

Hsc.StepController = Ember.ObjectController.extend({
    needs:["flowversion"],
    isDeletedForTemp:false,
    isSelected:function(){
        return this.get("controllers.flowversion.selectedStep.id") == this.get("id");
    }.property("controllers.flowversion.selectedStep")
});
Hsc.SelectedStepController = Ember.ObjectController.extend({
    needs:["application","flowversion","session"],
    isEditing:false,
    isNew:false,
    pannelTitle:"控制台详情",
    helpInfo:"只有该控制台的“关联组织”才能操作该控制台，\
    在控制台中可以在“激活”和“停止”两种状态间切换，\
    可通过设置超时时限来提醒用户车辆处于“激活”或“停止”状态的时间已超时，\
    “帮助信息”中的文字内容将出现在控制台的帮助栏以帮助用户正确的操作该控制台。",
    organizations:function(){
        // return this.store.peekAll("organization");
        //这里不可以用store.all().filterBy函数，因为那个函数不会自动更新
        return this.store.filter('organization', function (organization) {
            return true;
        });
    }.property(),
    selectedOrganization:function(k,v){
        var model = this.get('model');
        if(!model){
            return;
        }
        if (v === undefined) {
            return model.get("organization");
        } else {
            model.set('organization', v);
            model.notifyPropertyChange("isRelationshipsChanged");
            return v;
        }
    }.property("model.organization"),
    users:function(){
        var model = this.get('model'),
            organization = model ? model.get("organization") : null;
        if(organization){
            return this.store.filter('user', function (user) {
                return user.get('organization.id') == organization.get("id");
            });
        }
        else{
            return [];
        }
    }.property("model.organization"),
    selectedUser:function(k,v){
        var model = this.get('model');
        if(!model){
            return;
        }
        if (v === undefined) {
            return model.get("user");
        } else {
            model.set('user', v);
            model.notifyPropertyChange("isRelationshipsChanged");
            return v;
        }
    }.property("model.user"),
    isNotEndStep:function(){
        return this.get("type") != "end";
    }.property("type"),
    isFixUserDisabled:function(){
        //这里不可以用Ember.computed.equal或not，因为handler_org_type变化时不会实时更新
        return this.get("model.handler_org_type") != "fix_organization";
    }.property("model.handler_org_type"),
    isFixOrganization:Ember.computed.equal('handler_org_type', 'fix_organization'),
    isRelateTesttype:Ember.computed.equal('handler_org_type', 'relate_testtype'),
    isRelateBedstand:Ember.computed.equal('handler_org_type', 'relate_bedstand'),
    isFixUser:Ember.computed.equal('handler_type', 'fix_user'),
    isReserveUser:Ember.computed.equal('handler_type', 'reserve_user'),
    isEmptyUser:Ember.computed.equal('handler_type', 'empty'),
    isAllStep:Ember.computed.equal('next_step_type', 'all_step'),
    isLastStep:Ember.computed.equal('next_step_type', 'last_step'),
    isGray:Ember.computed.equal('color', 'gray'),
    isGreen:Ember.computed.equal('color', 'green'),
    isYellow:Ember.computed.equal('color', 'yellow'),
    isRed:Ember.computed.equal('color', 'red'),
    isFormEditable:Ember.computed.equal('form_power', 'editable'),
    isFormReadonly:function(){
        var form_power = this.get("form_power");
        return form_power == "readonly" || form_power == null;
    }.property("form_power"),
    isFormNone:Ember.computed.equal('form_power', 'none'),

    isBedstandWaiting:function(){
        var bedstand_running_state = this.get("bedstand_running_state");
        return bedstand_running_state == "waiting" || bedstand_running_state == null;
    }.property("bedstand_running_state"),
    isBedstandRunning:Ember.computed.equal('bedstand_running_state', 'running'),
    isBedstandRepairing:Ember.computed.equal('bedstand_running_state', 'repairing'),
    isBedstandRating:Ember.computed.equal('bedstand_running_state', 'rating'),
    isBedstandUpkeeping:Ember.computed.equal('bedstand_running_state', 'upkeeping'),

    isNextStepDefaultStart:Ember.computed.equal('next_step_default', 'start'),
    isNextStepDefaultEnd:Ember.computed.equal('next_step_default', 'end'),
    isNextStepDefaultNone:function(){
        var next_step_default = this.get("next_step_default");
        return next_step_default == "none" || next_step_default == null;
    }.property("next_step_default"),

    isUsersEmpty:function(){
        if(this.get("model.organization")){
            return this.get("users.length") == 0;
        }
        else{
            return false;
        }
    }.property("users.length","model.organization"),
    actions:{
        setColor:function(value){
            this.get('model').set("color",value);
        },
        setFormPower:function(value){
            this.get('model').set("form_power",value);
        },
        setBedstandRunningState:function(value){
            this.get('model').set("bedstand_running_state",value);
        },
        setNextStepDefault:function(value){
            this.get('model').set("next_step_default",value);
        },
        setHandlerOrgType:function(value){
            var model = this.get("model");
            model.set("handler_org_type",value);
            if(value != "fix_organization"){
                if(model.get("handler_type") == "fix_user"){
                    //如果handler_org_type不是指定组织，则handler_type不可以为指定用户，所以需要强行改成其他值
                    model.set("handler_type","empty");
                    model.set("user",null);
                    model.notifyPropertyChange("isRelationshipsChanged");
                }
                if(model.get("organization") != null){
                    model.set("organization",null);
                    model.notifyPropertyChange("isRelationshipsChanged");
                }
            }
            model.notifyPropertyChange("organization");
        },
        setHandlerType:function(value){
            var model = this.get("model");
            model.set("handler_type",value);
            if(value != "fix_user"){
                model.set("user",null);
                model.notifyPropertyChange("isRelationshipsChanged");
            }
            model.notifyPropertyChange("user");
        },
        setNextStepType:function(value){
            this.get('model').set("next_step_type",value);
        },
        setIsEndable:function(value){
            this.get('model').set("is_endable",value);
        },
        setIsHandlerLocked:function(value){
            this.get('model').set("is_handler_locked",value);
        },
        setIsListable:function(value){
            this.get('model').set("is_listable",value);
        },
        setIsBedstandInfoNeeded:function(value){
            this.get('model').set("is_bedstand_info_needed",value);
        },
        deleteRecord:function(){
        }
    }
});

Hsc.Step.FIXTURES = [
    {
        id: 1,
        name: '试验前准备',
        type: 'start',
        handler_org_type: 'fix_organization',
        handler_type: 'reserve_user',
        next_step_type: 'all_step',//all_step/last_step
        organization: 1,
        user:null,
        is_handler_locked:true,
        is_controllable:false,
        console:null,
        yellow_timeout: 80,
        red_timeout: 120,
        color: 'green',
        default_info: '准备好了，可以装车了',
        description: '当需要支持小组协调处理试验前工作时可以发送到该步骤',
        help_text: ''
    },
    {
        id: 2,
        name: '退役',
        type: 'end',
        handler_org_type: 'fix_organization',
        handler_type: 'empty',
        next_step_type: 'all_step',
        organization: null,
        user:null,
        is_handler_locked:true,
        is_controllable:false,
        console:null,
        yellow_timeout: 0,
        red_timeout: 0,
        color: 'green',
        default_info: '',
        description: '当车辆退股后可以发送到该步骤，同时结束该工作单',
        help_text: ''
    },
    {
        id: 3,
        name: '保养',
        type: 'process',
        handler_org_type: 'fix_organization',
        handler_type: 'empty',
        next_step_type: 'last_step',//all_step/last_step
        organization: 5,
        user:null,
        is_handler_locked:false,
        is_controllable:false,
        console:null,
        yellow_timeout: 80,
        red_timeout: 120,
        color: 'green',
        default_info: '保养完成',
        description: '当车辆需要保养时可以发送到该步骤',
        help_text: ''
    },
    {
        id: 4,
        name: '工程师检查',
        type: 'process',
        handler_org_type: 'fix_organization',
        handler_type: 'reserve_user',
        next_step_type: 'all_step',//all_step/last_step
        organization: 3,
        user:null,
        is_handler_locked:true,
        is_controllable:false,
        console:null,
        yellow_timeout: 80,
        red_timeout: 120,
        color: 'green',
        default_info: '检查完成',
        description: '',
        help_text: ''
    },
    {
        id: 5,
        name: '装车',
        type: 'process',
        handler_org_type: 'reserve_workshop',
        handler_type: 'empty',
        next_step_type: 'last_step',//all_step/last_step
        organization: null,
        user:null,
        is_handler_locked:false,
        is_controllable:false,
        console:null,
        yellow_timeout: 80,
        red_timeout: 120,
        color: 'green',
        default_info: '装车完成，可以投入试验了',
        description: '当需要装车时可以发送到该步骤',
        help_text: '请输入处理信息后点击发送来提交工作单，该工作单将返回给支持小组协调后续工作。'
    },
    {
        id: 6,
        name: '检查员检查',
        type: 'process',
        handler_org_type: 'fix_organization',
        handler_type: 'empty',
        next_step_type: 'all_step',//all_step/last_step
        organization: 2,
        user:null,
        is_handler_locked:true,
        is_controllable:false,
        console:null,
        yellow_timeout: 80,
        red_timeout: 120,
        color: 'green',
        default_info: '检查完成',
        description: '',
        help_text: ''
    },
    {
        id: 7,
        name: '统计员接收',
        type: 'process',
        handler_org_type: 'fix_organization',
        handler_type: 'empty',
        next_step_type: 'all_step',//all_step/last_step
        organization: 4,
        user:null,
        is_handler_locked:true,
        is_controllable:false,
        console:null,
        yellow_timeout: 80,
        red_timeout: 120,
        color: 'green',
        default_info: '',
        description: '当需要统计员接收车辆并准备投入试验时可以发送到该步骤',
        help_text: ''
    },
    {
        id: 8,
        name: '投入试验',
        type: 'process',
        handler_org_type: 'fix_organization',
        handler_type: 'empty',
        next_step_type: 'all_step',//all_step/last_step
        organization: 4,
        user:null,
        is_handler_locked:true,
        is_controllable:true,
        console:1,
        yellow_timeout: 0,
        red_timeout: 0,
        color: 'gray',
        default_info: '试验完成',
        description: '当把车辆投入试验并需要在试验控制台开始试验时可以发送到该步骤',
        help_text: ''
    },
    {
        id: 9,
        name: '换胎',
        type: 'process',
        handler_org_type: 'fix_organization',
        handler_type: 'empty',
        next_step_type: 'last_step',//all_step/last_step
        organization: 6,
        user:null,
        is_handler_locked:false,
        is_controllable:false,
        console:null,
        yellow_timeout: 80,
        red_timeout: 120,
        color: 'green',
        default_info: '换好胎了',
        description: '当轮胎需要更换时可以发送到该步骤',
        help_text: ''
    },
    {
        id: 10,
        name: '换制动片',
        type: 'process',
        handler_org_type: 'fix_organization',
        handler_type: 'empty',
        next_step_type: 'last_step',//all_step/last_step
        organization: 5,
        user:null,
        is_handler_locked:false,
        is_controllable:false,
        console:null,
        yellow_timeout: 80,
        red_timeout: 120,
        color: 'green',
        default_info: '换过制动片了',
        description: '当需要更换制动片时可以发送到该步骤',
        help_text: ''
    },
    {
        id: 11,
        name: '故障支持',
        type: 'process',
        handler_org_type: 'fix_organization',
        handler_type: 'reserve_user',
        next_step_type: 'all_step',//all_step/last_step
        organization: 1,
        user:null,
        is_handler_locked:true,
        is_controllable:false,
        console:null,
        yellow_timeout: 80,
        red_timeout: 120,
        color: 'green',
        default_info: '请帮忙处理下这个故障',
        description: '当出现故障时可以发送到该步骤，由支持小组协调处理',
        help_text: ''
    },
    {
        id: 12,
        name: '故障维修',
        type: 'process',
        handler_org_type: 'reserve_workshop',
        handler_type: 'empty',
        next_step_type: 'last_step',//all_step/last_step
        organization: null,
        user:null,
        is_handler_locked:false,
        is_controllable:false,
        console:null,
        yellow_timeout: 80,
        red_timeout: 120,
        color: 'green',
        default_info: '修理好了',
        description: '当需要处理故障时可以发送到该步骤',
        help_text: ''
    },
    {
        id: 13,
        name: '试验后准备',
        type: 'process',
        handler_org_type: 'fix_organization',
        handler_type: 'reserve_user',
        next_step_type: 'all_step',//all_step/last_step
        organization: 1,
        user:null,
        is_handler_locked:true,
        is_controllable:false,
        console:null,
        yellow_timeout: 80,
        red_timeout: 120,
        color: 'green',
        default_info: '准备好了，可以拆解了',
        description: '当试验完成后可以发送到该步骤，由支持小组协调试验后的工作',
        help_text: ''
    },
    {
        id: 14,
        name: '拆解',
        type: 'process',
        handler_org_type: 'reserve_workshop',
        handler_type: 'empty',
        next_step_type: 'last_step',//all_step/last_step
        organization: null,
        user:null,
        is_handler_locked:false,
        is_controllable:false,
        console:null,
        yellow_timeout: 80,
        red_timeout: 120,
        color: 'green',
        default_info: '拆解完成',
        description: '试验完成后需要把车辆拆解时可以发送到该步骤',
        help_text: ''
    },
    {
        id: 15,
        name: '工程师招车',
        type: 'process',
        handler_org_type: 'fix_organization',
        handler_type: 'reserve_user',
        next_step_type: 'all_step',//all_step/last_step
        organization: 3,
        user:null,
        is_handler_locked:true,
        is_controllable:false,
        console:null,
        yellow_timeout: 80,
        red_timeout: 120,
        color: 'green',
        default_info: '',
        description: '当工程师需要招车时可以发送到该步骤',
        help_text: ''
    },
    {
        id: 16,
        name: '支持组招车',
        type: 'process',
        handler_org_type: 'fix_organization',
        handler_type: 'reserve_user',
        next_step_type: 'all_step',//all_step/last_step
        organization: 1,
        user:null,
        is_handler_locked:true,
        is_controllable:false,
        console:null,
        yellow_timeout: 80,
        red_timeout: 120,
        color: 'green',
        default_info: '',
        description: '当支持小组需要招车时可以发送到该步骤',
        help_text: ''
    }
];
