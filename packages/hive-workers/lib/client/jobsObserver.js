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
            getNextJob();

        }
    });
};

/*
function getNextJobs() {
    for(var i = 0; i < (HiveWorker._maxConcurrentJobs - HiveWorker._currentJobNum); i++ ) {
        var sorted = HiveJobs.findOne({ locked: false });
        startJob(sorted);
    }
}*/

function getNextJob() {
    if(HiveWorker._currentJobNum < HiveWorker._maxConcurrentJobs) {
        HiveWorker._currentJobNum++;

        Meteor.call('getNextJob', function (err, res) {
            if (err) {
                console.log("Error Getting Job" + err.reason);
            } else {
                if (res === -1) {
                    console.log("No Jobs Exist, exitting");
                    return;
                } else {
                    startJob(res);
                }
            }
            getNextJob();
        });
    }

    /*HiveWorker._currentJobNum++;
    console.log("Inside getNextJob");
    var sorted = HiveJobs.findOne({ locked: false });
    console.log("Got jobs", sorted.length);
    var job = sorted.length > 0 ? sorted[0] : null;

    if(job) {
        startJob(job);
    }*/
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
        }, function (failureData) {
            console.log("Failed");
            jobFailed(thisJobId, failureData)
        });
};
function unlock(jobId) {
    HiveJobs.update(jobId,
        {
            $set : { locked : false }
        }
    );
}

function jobFailed(jobId, failureData) {
    HiveJobs.update(jobId,
        {
            $push : { jobResults : failureData }
        },
        {
            $set : {
                added : new Date(),
                locked : false
            }
        }
    );
};