// create timeline and events/objects for study (the first next lines are always the same! consent then check whether it's same person)
var timeline = [];
//timeline = create_consent(timeline, taskinfo);
//timeline = check_same_different_person(timeline);

timeline.push(instructions);
timeline.push(practice_trial);
timeline.push(instructions2);
timeline.push(trial);
timeline.push(debrief_block);
timeline = create_demographics(timeline);
