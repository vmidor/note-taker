/*
 * Processes rules
 * 
 */

var log = require('./utils').log;

//Private functions / properties
let validate = (input) => {
  log.debug(`Called function with args: "${input}`);
  if(!Array.isArray(input)) {
    throw new Error("Error: Rules must be an Array. Check the documentation on rules.");
  }
}

let isNumber = (input) => !isNaN(input);

let isMethod = (input) => !isNumber(input) && input[0].startsWith(".");

let method = (input) => input[0].replace('.', '');

let arg = (input) => input.length > 1 ? input[1] : undefined;

//Public functions
exports = module.exports = {
  process: (input, rules, callback) => {
    log.debug(`Called function with args: "${input}", "${rules}, ${callback}`);
    let rule;
    validate(rules);
    for (let r in rules) {
      rule = rules[r];
      if(isMethod(rule)) {
        if(Array.isArray(input)) {
          input = input[method(rule)];          
        } else {
          input = String(input)[method(rule)](arg(rule));
        }
      } else {
        if(isNumber(rule)) {
          input = input[rule];
        }
      }
      //console.log(`${">".repeat(r)} ${input}` )
    }
    log.debug(`Returning result ${input} to final 'process' callback...`);
    callback(input);      
  },
}
