Hsc.InboxInstance = DS.Model.extend({
    // flowversion: DS.belongsTo('flowversion'),
    // flowversion_modified_date: DS.attr('date'),//用于判断后台流程版本是否有更新
    instance: DS.belongsTo('instance'),
    bedstand: DS.belongsTo('bedstand'),
    vehicletype: DS.belongsTo('vehicletype'),
    is_bedstand: DS.attr('boolean', {defaultValue: false}),
    description: DS.attr('string',{defaultValue: ""}),
    trace: DS.belongsTo('trace'),
    outbox_users: DS.attr('string'),
    current_is_handler_locked: DS.attr('boolean'),
    current_is_controllable: DS.attr('boolean'),
    current_info: DS.attr('string'),
    current_user: DS.belongsTo('user'),//预定用户（即上一步骤选择的预定用户）或当前步骤的指定用户，其发送到后台的意义在于不为空时验证其值是否等于处理人
    current_handler: DS.belongsTo('user'),
    next_step: DS.belongsTo('step'),
    next_is_bedstand_info_needed: DS.attr('boolean', {defaultValue: false}),
    next_bedstand_running_state: DS.attr('string', {defaultValue: "waiting"}),//下一步骤台架目标运行状态：waiting（待样）、running（运行）、repairing（检修）
    next_step_type: DS.attr('string'),
    next_handler_org_type: DS.attr('string'),
    next_handler_type: DS.attr('string'),
    next_organization: DS.belongsTo('organization'),
    next_user: DS.belongsTo('user'),
    next_is_skip_weekend: DS.attr('boolean', {defaultValue: true}),
    next_yellow_due: DS.attr('date'),
    next_red_due: DS.attr('date'),
    next_due_days: DS.attr('number', {defaultValue: 0}),
    next_color: DS.attr('string'),
    creater: DS.attr('string'),
    created_date: DS.attr('date'),
    // flowversionDidChange:function(){
    //     this.set("flowversion",this.get("instance.flowversion"));
    // }.observes("instance.flowversion"),
    // lastTraceDidChange:function(){
    //     this.set("trace",this.get("instance.lastTrace"));
    // }.observes("instance.lastTrace.id"),
    // currentModifiedDateDidChange:function(){
    //     //随时记录当前工作单所用流程版本的最新修改日期
    //     //用于后台对比是否有更新，如果有更新则强行要求更新后再提交，
    //     //如果一直处于更新失败状态，则可以刷新浏览器重新开始
    //     this.set("flowversion_modified_date",this.get("flowversion.modified_date"))
    // }.observes("flowversion.modified_date"),
    // currentStepIsHandlerLockedDidChange:function(){
    //     if(this.get("isDeleted")){
    //         return;
    //     }
    //     this.set("current_is_handler_locked",this.get("instance.lastTrace.step.is_handler_locked"));
    // }.observes("instance.lastTrace.step.is_handler_locked"),
    // currentStepisControllableDidChange:function(){
    //     if(this.get("isDeleted")){
    //         return;
    //     }
    //     this.set("current_is_controllable",this.get("instance.lastTrace.step.is_controllable"));
    // }.observes("instance.lastTrace.step.is_controllable"),
    // currentStepDefaultInfoDidChange:function(){
    //     if(this.get("isDeleted")){
    //         return;
    //     }
    //     this.set("current_info",this.get("instance.lastTrace.step.default_info"));
    // }.observes("instance.lastTrace.step.default_info"),
    // currentStepUserDidChange:function(){
    //     if(this.get("isDeleted")){
    //         return;
    //     }
    //     this.set("current_user",this.get("instance.lastTrace.user"));
    // }.observes("instance.lastTrace.user"),
    // isFixOrganization:Ember.computed.equal('instance.lastTrace.step.handler_org_type', 'fix_organization'),
    // isNextFixOrganization:Ember.computed.equal('next_handler_org_type', 'fix_organization'),

    isFixUser:Ember.computed.equal('instance.lastTrace.step.handler_type', 'fix_user'),
    isReserveUser:Ember.computed.equal('instance.lastTrace.step.handler_type', 'reserve_user'),
    isEmptyUser:Ember.computed.equal('instance.lastTrace.step.handler_type', 'empty'),
    isNextFixUser:Ember.computed.equal('next_handler_type', 'fix_user'),
    isNextReserveUser:Ember.computed.equal('next_handler_type', 'reserve_user'),
    isNextEmptyUser:Ember.computed.equal('next_handler_type', 'empty'),
    isNextUsersEmpty:Ember.computed.equal('nextUsers.length', 0),
    isSendToPrevious:Ember.computed.equal('instance.lastTrace.step.next_step_type', 'last_step'),
    isNeedNextUserSelection:function(){
        //是否需要显示下一步骤处理人选择框
        //注意虽然isNextFixUser为true时只有一个用户，但还是需要显示出来
        //并且一定要显示在选择框中
        return this.get("isNextFixUser") || this.get("isNextReserveUser");
    }.property("isNextFixUser","isNextReserveUser"),
    nextStepBedstandRunningStateDidChange:function(){
        if(this.get("isDeleted")){
            return;
        }
        this.set("next_bedstand_running_state",this.get("next_step.bedstand_running_state"));
    }.observes("next_step.bedstand_running_state"),
    // nextStepYellowTimeout:function(){
    //     if(this.get("isDeleted")){
    //         return;
    //     }
    //     this.set("next_due_days",this.get("next_step.yellow_timeout"));
    // }.observes("next_step.yellow_timeout"),
    nextStepColorDidChange:function(){
        if(this.get("isDeleted")){
            return;
        }
        this.set("next_color",this.get("next_step.color"));
    }.observes("next_step.color"),
    currentHandlerDidChange:function(){
        if(this.get("isDeleted")){
            return;
        }
        if(!this.get("flowversion.is_current")){
            if(this.get('errors.length')){
                this.get('errors').clear();
            }
            return;
        }
        var current_handler = this.get("current_handler");
        if(this.get("hasDirtyAttributes")){
            if(Ember.isEmpty(current_handler)){
                this.get('errors').add('current_handler', '不能为空');
            }
            else{
                this.get('errors').remove('current_handler');
            }
        }
    }.observes("current_handler","flowversion.is_current"),
    currentInfoDidChange:function(){
        if(this.get("isDeleted")){
            return;
        }
        if(!this.get("flowversion.is_current")){
            if(this.get('errors.length')){
                this.get('errors').clear();
            }
            return;
        }
        var current_info = this.get("current_info");
        if(this.get("hasDirtyAttributes")){
            if(Ember.isEmpty(current_info)){
                this.get('errors').add('current_info', '不能为空');
            }
            else if(current_info.length > 200){
                this.get('errors').add('current_info', '长度不能超过200字符');
            }
        }
    }.observes("current_info","flowversion.is_current"),
    nextStepDidChange:function(){
        if(this.get("isDeleted")){
            return;
        }
        if(!this.get("flowversion.is_current")){
            if(this.get('errors.length')){
                this.get('errors').clear();
            }
            return;
        }
        var next_step = this.get("next_step");
        if(this.get("hasDirtyAttributes")){
            if(Ember.isEmpty(next_step)){
                this.get('errors').add('next_step', '不能为空');
            }
            else{
                this.get('errors').remove('next_step');
            }
        }
    }.observes("next_step","flowversion.is_current"),
    nextUserDidChange:function(){
        if(this.get("isDeleted")){
            return;
        }
        if(!this.get("flowversion.is_current")){
            if(this.get('errors.length')){
                this.get('errors').clear();
            }
            return;
        }
        var next_user = this.get("next_user");
        if(this.get("hasDirtyAttributes")){
            if(this.get("isNeedNextUserSelection") && Ember.isEmpty(next_user)){
                this.get('errors').add('next_user', '不能为空');
            }
            else{
                this.get('errors').remove('next_user');
            }
        }
    }.observes("next_user","isNeedNextUserSelection","flowversion.is_current"),
    // currentMileageDidChange:function(){
    //     if(this.get("isDeleted")){
    //         return;
    //     }
    //     if(!this.get("flowversion.is_current")){
    //         if(this.get('errors.length')){
    //             this.get('errors').clear();
    //         }
    //         return;
    //     }
    //     var current_mileage = this.get("current_mileage");
    //     if(this.get("hasDirtyAttributes")){
    //         if(Ember.isEmpty(current_mileage)){
    //             this.get('errors').add('current_mileage', '不能为空');
    //         }
    //         else if(!/^((0)|([1-9]+\d*))([\.]{1}[\d]+)?$/g.test(current_mileage)){
    //             this.get('errors').add('current_mileage', '请输入零或有效正数');
    //         }
    //     }
    // }.observes("current_mileage","flowversion.is_current"),
    // bedstandDidChange:function(){
    //     if(this.get("isDeleted")){
    //         return;
    //     }
    //     if(!this.get("flowversion.is_current")){
    //         if(this.get('errors.length')){
    //             this.get('errors').clear();
    //         }
    //         return;
    //     }
    //     var bedstand = this.get("bedstand");
    //     if(this.get("hasDirtyAttributes")){
    //         if(Ember.isEmpty(bedstand)){
    //             this.get('errors').add('bedstand', '不能为空');
    //         }
    //         else{
    //             this.get('errors').remove('bedstand');
    //         }
    //     }
    // }.observes("bedstand","flowversion.is_current"),
    descriptionDidChange:function(){
        if(this.get("isDeleted")){
            return;
        }
        if(!this.get("flowversion.is_current")){
            if(this.get('errors.length')){
                this.get('errors').clear();
            }
            return;
        }
        var description = this.get("description");
        if(this.get("hasDirtyAttributes")){
            if(!Ember.isEmpty(description) && description.length > 200){
                this.get('errors').add('description', '长度不能超过200字符');
            }
        }
    }.observes("description","flowversion.is_current")
});
