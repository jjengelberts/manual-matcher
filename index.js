function checkBoxSelector(choice) {
    // If choice < length answers then a value has been selected
    // If choice == length then the "None of the above" option has been selected
    let answers = document.getElementsByName("answers");
    if (choice == answers.length - 1) {
        // None is selected, unselect other options
        for (let i = 0; i < answers.length - 1; i ++) {
            answers[i].checked = false;
        }
    } else {
        // Other option is select, unselect "None of the above"
        answers[answers.length - 1].checked = false;
    }
    if (!answers[choice].checked) {
        answers[choice].checked = false;
    } else {
        answers[choice].checked = true;
    }
}