Hive = {
    _maxJobs : 1000,

    //Shared
    addJob : function(jobType, data) {

    },

    //Server Only
   configure : function() {
        initHiveJobPub();
    }
};

function initJobPub(userId) {
    if(Meteor.isServer) {
        Meteor.publish('allHiveJobs', function(userId) {
            HiveJobs.find({ assign : userId });
        });
    }
}

Meteor.methods({
    addJobToHiveQueue: function(name, data) {
        console.log("Adding job...", name, data);
        HiveJobs.insert({
            name: name,
            data: data || {},
            added: new Date(),
            locked: false
        });
    },
    hiveQueueJobComplete: function(id) {
        HiveJobs.remove(id);
    }
});

