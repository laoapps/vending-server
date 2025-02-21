const uuid = `9c380a9d-2274-42d7-8e4b-eb3b6d69c78e`;

function generatePassword() {
    let s: string = '';
    for(let i = 0; i < uuid.length; i++) {
        if (Number(uuid[i]) || uuid[i] == '0') {
            s += uuid[i];
        }
    }
    s = s.substring(s.length-6, s.length);
    console.log(`111111${s}`);
}
