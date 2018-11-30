const usernameEl = document.getElementById('inputUsername');
const usernameHelp = document.getElementById('usernameHelpBlock');
const button = document.getElementById('submitBtn');
const passwordEl = document.getElementById('inputPassword');
const password2El = document.getElementById('inputPasswordRepeat');
const passwordHelp = document.getElementById('passwordHelpBlock');
const password2Help = document.getElementById('passwordRepeatHelpBlock');
const fullnameEl = document.getElementById('inputFullname');
const fullnameHelp = document.getElementById('fullnameHelpBlock');

let validUsername = false;
let validFullname = false;
let validPassword = false;

function checkFullname() {
    validFullname = /^[іІєЄa-zA-Zа-яА-Я]+(([',. -][іІєЄa-zA-Zа-яА-Я ])?[іІєЄa-zA-Zа-яА-Я]*)*$/.test(
        fullnameEl.value
    );
    fullnameHelp.innerHTML = validFullname ? '' : 'Write a real name please.';
    fullnameEl.classList.remove('is-invalid');
    fullnameEl.classList.remove('is-valid');
    if (fullnameEl.value.length)
        fullnameEl.classList.add(validFullname ? 'is-valid' : 'is-invalid');
    sumbitActive();
}

async function checkUsername() {
    const username = usernameEl.value;
    if (username.length >= 4) return await checkUsernameAvailiability(username);

    validUsername = false;
    if (!username.length) {
        usernameEl.classList.remove('is-invalid');
        usernameEl.classList.remove('is-valid');
    } else usernameEl.classList.add('is-invalid');
    usernameHelp.innerHTML =
        'Your username should be 4-20 characters long, contain only letter, numbers and -_ symbols.';
}

function checkUsernameRegex(username) {
    if (/^[a-zA-Z0-9_.-]*$/.test(username)) return true;
    usernameEl.classList.remove('is-valid');
    usernameEl.classList.add('is-invalid');
    usernameHelp.innerHTML = 'Your username should contain only letter, numbers and -_. symbols.';
    validUsername = false;
}

async function checkUsernameAvailiability(username) {
    if (!checkUsernameRegex(username)) return;
    console.log('here');
    if (!/[a-zA-Z0-9_-]+/.test(usernameEl.value)) {
        usernameEl.classList.remove('is-invalid');
        usernameEl.classList.remove('is-valid');
        usernameEl.classList.add(response.exist ? 'is-invalid' : 'is-valid');
        usernameHelp.innerHTML = response.exist ? 'Username is already taken' : '';
    }
    const response = JSON.parse(await (await fetch('/api/v1/users/exist/' + username)).text());
    usernameEl.classList.remove('is-invalid');
    usernameEl.classList.remove('is-valid');
    usernameEl.classList.add(response.exist ? 'is-invalid' : 'is-valid');
    usernameHelp.innerHTML = response.exist ? 'Username is already taken' : '';
    validUsername = !response.exist;
    sumbitActive(!response.exist);
}

function sumbitActive() {
    button.classList.remove('active');
    button.classList.remove('disabled');
    button.classList.add(validUsername && validPassword && validFullname ? 'active' : 'disabled');
}

function validatePassword() {
    if (!passwordEl.value.length) {
        passwordHelp.innerHTML = '';
        passwordEl.classList.remove('is-invalid');
        passwordEl.classList.remove('is-valid');
        return;
    }
    if (passwordEl.value.length < 8) {
        validPassword = false;
        passwordHelp.innerHTML = 'Your password should be 8-20 characters long.';
        passwordEl.classList.remove('is-valid');
        passwordEl.classList.add('is-invalid');
    } else {
        passwordHelp.innerHTML = '';
        passwordEl.classList.remove('is-invalid');
        passwordEl.classList.add('is-valid');
        validatePasswordEqual();
    }
}

function validatePasswordEqual() {
    if (!password2El.value.length) {
        password2El.classList.remove('is-invalid');
        password2El.classList.remove('is-valid');
        return;
    }
    validPassword = passwordEl.value === password2El.value;
    password2Help.innerHTML = validPassword ? '' : "Passwords don't match";
    password2El.classList.remove('is-invalid');
    password2El.classList.remove('is-valid');
    password2El.classList.add(validPassword ? 'is-valid' : 'is-invalid');
    sumbitActive();
}
