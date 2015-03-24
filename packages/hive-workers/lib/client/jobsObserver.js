createHiveObserver = function() {
    HiveJobs.find().observe({
        added: function() {
            if(HiveWorker._currentJobNum < HiveWorker._maxConcurrentJobs) {
                getNextJob();
            }
        },
        changed : function() {

        },
        removed: function() {
            console.log("Removed hive jab");
            //getNextJob();

        }
    });
};

function getNextJob() {
    if(HiveWorker._currentJobNum < HiveWorker._maxConcurrentJobs) {
        Meteor.call('getNextJob', function (err, res) {
            if (err) {
                console.log("Error Getting Job" + err.reason);
            } else {
                if (res === -1) {
                    console.log("No Jobs Exist, exiting");
                    return;
                } else {
                    HiveWorker._currentJobNum++;
                    startJob(res);
                }
            }
            getNextJob();
        });
    }
};

function startJob(job) {
    console.log("Going to start job", job);
    var thisJobId = job._id;


        var jobs = HiveWorker._jobMap;
        console.log("Starting job", job.name);
        console.log(jobs[job.name]);

        if (!_.has(jobs, job.name)) {
            //TODO: Handle this case where the client doesnt have that job, (probably unassign)
            console.log("Couldnt find job in the job map");
            return;
        }

        var data = null;

        if (job.data) {
            data = job.data;
        }

        HiveWorker._jobMap[job.name](data, function (successData) {
            console.log("Callback Recieved");
            console.log("Completing", thisJobId);
            Meteor.call('hiveQueueJobComplete', thisJobId);

            HiveWorker._currentJobNum--;

            getNextJob();
        }, function (failureData) {
            console.log("Failed");
            Meteor.call('hiveQueueJobFailed', thisJobId, failureData, function(err, res){
                if(err) {
                    console.log("JOB FAILED - FAILURE -- DOUBLE FAILURE" + err.reason);
                    return;
                }
                HiveWorker._currentJobNum--;

                getNextJob();
            });
        });
};