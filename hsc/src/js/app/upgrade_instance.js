Hsc.UpgradeInstance = DS.Model.extend({
    instance: DS.belongsTo('instance'),
    trace: DS.belongsTo('trace'),
    car: DS.belongsTo('car'),
    bedstand: DS.belongsTo('bedstand'),
    vehicletype: DS.belongsTo('vehicletype'),
    is_bedstand: DS.attr('boolean', {defaultValue: false}),
    description: DS.attr('string',{defaultValue: ""}),
    flow: DS.belongsTo('flow'),
    new_flowversion: DS.belongsTo('flowversion'),
    upgrade_step: DS.belongsTo('step'),
    upgrade_step_color: DS.attr('string'),
    upgrade_step_info: DS.attr('string'),
    recove_step: DS.belongsTo('step'),
    recove_step_color: DS.attr('string'),
    recove_step_info: DS.attr('string'),
    new_step: DS.belongsTo('step'),
    next_bedstand_running_state: DS.attr('string', {defaultValue: "waiting"}),//下一步骤台架目标运行状态：waiting（待样）、running（运行）、repairing（检修）
    new_step_type: DS.attr('string'),
    new_organization: DS.belongsTo('organization'),
    new_user: DS.belongsTo('user'),
    new_yellow_timeout: DS.attr('number', {defaultValue: 0}),
    new_red_timeout: DS.attr('number', {defaultValue: 0}),
    new_color: DS.attr('string'),
    outbox_users: DS.attr('string'),
    new_outbox_users: DS.attr('string'),
    creater: DS.attr('string'),
    created_date: DS.attr('date'),
    new_instance: DS.belongsTo('instance')
});
