// import { parse, end, toSeconds, pattern} from "iso8601-duration";
import moment from "moment";
import fs from 'fs'
// console.log( moment());
// console.log( moment().add(moment.duration('PT2H').asMilliseconds(),'milliseconds'));

// // const t = new Date();
// // console.log(t.toJSON());

// // const tx = parse('2H');
// // console.log('tx parse',tx);
// // const toSec = toSeconds(tx);
// // console.log('tx parse',toSec);
// // const second = t.getSeconds() ;
// // console.log('t',t);

// // t.setSeconds(second);
// // console.log('t1',t);
try {
    const da = moment().year()+'_'+moment().month()+'_'+moment().date();
const logs = __dirname+`/logs/results_${da}.json`;

fs.appendFileSync(logs, JSON.stringify({ time:new Date() })+',',{flag:'a+'});
} catch (error) {
    console.log('error',error);
    
}
