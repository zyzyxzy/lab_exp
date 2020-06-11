var subject = jsPsych.randomization.randomID(15); // random character subject id
var condition = 'control'; // experiment/task condition
var task = 'stroop';
var experiment = 'stroop';
var debug = true;
var no_incongruent_neighbors = true;
var show_feedback = true; // TODO: if true, show feedback (show accuracy and rt)
var adaptive = true; // TODO: if true, adapt task difficulty (reduce rt_deadline if correct; increase rt_deadlline if wrong; by 50 ms)

// TODO: make background black, instructions white

var rt_deadline = 5000;
var fixation_duration = 300;
var feedback_duration = 1000;
var itis = iti_exponential(low = 300, high = 700);

var color_key = { 'red': 'r', 'green': 'g', 'yellow': 'y' }; // color-key mapping
var stimuli_unique = [  // unique stroop trials
    { text: 'red', color: 'red', data: { trialtype: 'congruent', reps: 2 } },
    { text: 'green', color: 'green', data: { trialtype: 'congruent', reps: 2 } },
    { text: 'yellow', color: 'yellow', data: { trialtype: 'congruent', reps: 2 } },
    { text: 'red', color: 'green', data: { trialtype: 'incongruent', reps: 1 } },
    { text: 'red', color: 'yellow', data: { trialtype: 'incongruent', reps: 1 } },
    { text: 'green', color: 'red', data: { trialtype: 'incongruent', reps: 1 } },
    { text: 'green', color: 'yellow', data: { trialtype: 'incongruent', reps: 1 } },
    { text: 'yellow', color: 'red', data: { trialtype: 'incongruent', reps: 1 } },
    { text: 'yellow', color: 'green', data: { trialtype: 'incongruent', reps: 1 } },
    { text: 'xxxx', color: 'red', data: { trialtype: 'neutral', reps: 2 } },
    { text: 'xxxx', color: 'green', data: { trialtype: 'neutral', reps: 2 } },
    { text: 'xxxx', color: 'yellow', data: { trialtype: 'neutral', reps: 2 } }
];

// parameters below typically don't need to be changed
var stimuli_repetitions = [2, 2, 2, 1, 1, 1, 1, 1, 1, 2, 2, 2];
// repeat each stimulus reps times
var stimuli_shuffled = jsPsych.randomization.repeat(stimuli_unique, stimuli_repetitions);  // repeat and shuffle
if (no_incongruent_neighbors) { // ensure incongruent stimuli aren't presented consecutively
    function equality_test(a, b) {
        if (a.trialtype != 'incongruent') {
            return false;  // ignore if it's not incongruent trialtype
        } else {
            return a.trialtype === b.trialtype;  // return true if neighbors are both incongruent
        }
    }
    var stimuli_shuffled = jsPsych.randomization.shuffleNoRepeats(stimuli_shuffled, equality_test);
}
if (debug) { console.log(stimuli_shuffled); }

// add data to all trials
jsPsych.data.addProperties({
    subject: subject,
    condition: condition,
    task: task,
    experiment: experiment,
    browser: navigator.userAgent, // browser info
    datetime: Date(),
});

var timeline = [];

var n_trial = 0; // stroop trial number counter

var fixation = {
    type: "html-keyboard-response",
    choices: jsPsych.NO_KEYS,
    stimulus: "+", // TODO show the fixation image instead (see symbol counting task; image-keyboard-response)
    trial_duration: fixation_duration,
    data: { event: 'fixation' },
    on_finish: function (data) {
        data.n_trial = 0;
    },
};

var correct_key = ''; // correct key on each trial
var stimulus = {
    type: "html-keyboard-response",
    choices: Object.values(color_key),
    stimulus: function () {
        var text = jsPsych.timelineVariable('text', true);
        var color = jsPsych.timelineVariable('color', true);
        var trialtype = jsPsych.timelineVariable('data', true).trialtype;
        correct_key = color_key[jsPsych.timelineVariable('color', true)];
        if (debug) {
            console.log("trial " + n_trial + "; text: " + text + "; color: " + color + "; " + trialtype + ' (correct key: ' + correct_key + ")");
        }
        text_html = "<font style='color:" + color + "'>" + text + "</font>"; // TODO: make font size bigger
        return text_html;
    },
    trial_duration: rt_deadline,
    data: jsPsych.timelineVariable('data'),
    on_finish: function (data) {
        data.event = 'stimulus';
        data.text = jsPsych.timelineVariable('text', true);
        data.color = jsPsych.timelineVariable('color', true);
        data.key_press = jsPsych.pluginAPI.convertKeyCodeToKeyCharacter(data.key_press);
        data.n_trial = n_trial;
        if (data.key_press == correct_key) {
            data.acc = 1;
        } else {
            data.acc = 0;
        };
        if (debug) {
            console.log("response: " + data.key_press);
        };
        n_trial += 1;
    },
}

var feedback = { // TODO: show feedback if var feedback is true (if correct, "correct, 456 ms"; if wrong, "wrong, 600 ms"; if no response, "respond faster")
    type: "html-keyboard-response",
    stimulus: function () {
        return 'show feedback';
    },
    choices: jsPsych.NO_KEYS,
    trial_duration: feedback_duration,
}

var trial_sequence = {
    timeline: [fixation, stimulus, feedback],
    timeline_variables: stimuli_shuffled,
};
timeline.push(trial_sequence);

jsPsych.init({
    timeline: timeline,
    on_finish: function () {
        jsPsych.data.addProperties({ total_time: jsPsych.totalTime() });
        // $.ajax({
        //     type: "POST",
        //     url: "/submit-data",
        //     data: jsPsych.data.get().json(),
        //     contentType: "application/json"
        // })
        jsPsych.data.displayData();
    }
});