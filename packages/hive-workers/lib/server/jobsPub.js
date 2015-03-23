Meteor.publish('allHiveJobs', function(userId) {
    return HiveJobs.find();
});
