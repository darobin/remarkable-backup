#!/usr/bin/env node

import { program } from 'commander';
import { isAbsolute, join } from 'path';
import process from 'process';
import axios from 'axios';
import { v4 as uuid } from 'uuid';
// import { Remarkable } from 'remarkable-typescript';
import loadJSON from './lib/load-json.js';
import saveJSON from './lib/save-json.js';
// import die from './lib/die.js';

// const baseURL = 'https://my.remarkable.com';
// const baseURL = 'http://localhost:8765';
const { version } = await loadJSON('./package.json');

// let { program } = require('commander')
//   , { Remarkable } = require('remarkable-node')
//   , { ok, die, ensureDir, dataDir, rmDir, getPassword, setPassword, deletePassword, saveFile } = require('./index')
//   , remarkable = require('./remarkable')
// ;

// --version
program.version(version);


program
  .requiredOption('-t, --tokens <path>', 'file in which the tokens are stored')
;


// POST /token/json/2/device/new (http://localhost)
// {
//   "host": "localhost:8765",
//   "user-agent": "rmapi",
//   "content-length": "98",
//   "authorization": "Bearer",
//   "accept-encoding": "gzip"
// }

// {"code":"ieovobzc","deviceDesc":"desktop-linux","deviceID":"ed0e041b-a2d5-4b02-b3ac-405c19f3bef6"}

// register
// The first time you connect this, you need to go to https://my.remarkable.com/device/desktop/connect and obtain a code.
// Pass this to `remarkable-backup register` to generate a device token that gets stored in the file specificed by
// `--tokens`.
program
  .command('register <code>')
  .description('The first time you connect, you need to go to https://my.remarkable.com/device/desktop/connect and obtain a code.')
  .action(async (code) => {
    const client = await createClient();
    console.log(`code`, code);
    const res = await client.post(
      // '/token/json/2/device/new',
      'https://my.remarkable.com/token/json/2/device/new',
      {
        code,
        deviceDesc: 'desktop-windows',
        deviceID: uuid(),
      },
      {
        responseType: 'text',
        headers: {
          'User-Agent': 'rmapi',
          'Authorization': 'Bearer',
          'Accept-Encoding': 'gzip',
          Accept: null,
          'Content-Type': null,
        },
      }
    );
    console.log(res.status, res.headers, res.data);
    const deviceToken = res.data;
    // const deviceToken = await client.register({ code });
    console.log(`device token`, deviceToken);
    await saveTokens({ deviceToken });
    console.log(`Registered device token ${deviceToken} successfully.`);
  })
;

async function createClient () {
  const { deviceToken } = await loadTokens();
  // const client = axios.create({ baseURL });
  if (deviceToken) {
    // XXX
    // need to do whatever dance to refresh the token after this use
    // const client = new Remarkable({ deviceToken });
    // await client.refreshToken();
    // return client;
  }
  return axios;
  // return client;
  // return new Remarkable();
}

function tokensPath () {
  const { tokens } = program.optsWithGlobals();
  return isAbsolute(tokens) ? tokens : join(process.cwd(), tokens);
}

async function loadTokens () {
  const tokens = tokensPath();
  try {
    return await loadJSON(tokens);
  }
  catch (err) {
    return {};
  }
}

async function saveTokens (data) {
  const tokens = tokensPath();
  return await saveJSON(tokens, data);
}

// Manage credentials
// The service is always com.berjon.kipple. The account for any system we add is always
// `system:account`. This allows us to store any number of credentials for a given system, while
// keeping it all in a single service.
// program
//   .command('login <system> <account> <password>')
//   .description('add a new login to the system, but note that this will not test it to see if it is correct')
//   .action(async (system, account, password) => {
//     try {
//       checkSystem(system);
//       let hadPwd = await deletePassword(system, account);
//       if (hadPwd) console.warn(`Updating password for ${system}:${account}…`);
//       if (system === 'remarkable') {
//         let client = new Remarkable();
//         password = await client.register({ code: password });
//       }
//       await setPassword(system, account, password);
//       ok();
//     }
//     catch (err) {
//       die(`Failed to login:`, err);
//     }
//   })
// ;

// program
//   .command('remove-login <system> <account>')
//   .description('removes a login from the system')
//   .action(async (system, account) => {
//     try {
//       await deletePassword(system, account);
//       ok();
//     }
//     catch (err) {
//       die(`Failed to remove login:`, err);
//     }
//   })
// ;

// // Manage sources
// // Data in Kipple is structured in this way:
// //  * system: the type of tool which the is the data's primary home (eg. roam)
// //  * account: the user of the system in question, there can be several users per system (eg. robin)
// //  * source: some systems have multiple sources, which may be separate databases or directories
// //    (eg. my-notes)
// // Adding a source adds the { system, account, source } tuple into the local store (with source
// // being optional). What that does depends on the system, it could well be nothing other than
// // creating an empty directory.
// program
//   .command('add-source <system> <account> [source]')
//   .description('adds a source of data, which is system/account/source, with an optional source')
//   .action(async (system, account, source) => {
//     try {
//       checkSystem(system);
//       if (system === 'roam' && !source) die(`Adding a Roam source requires specifying the database as your source.`);
//       let pwd = await getPassword(system, account);
//       if (!pwd) die(`Unknown account "${account}" in "${system}". Maybe "kipple login ${system} ${account}" first?`);
//       await ensureDir(dataDir(system, account, source));
//       ok();
//     }
//     catch (err) {
//       die(`Failed to add source:`, err);
//     }
//   })
// ;

// program
//   .command('remove-source <system> <account> [source]')
//   .description('removes a source of data, which is system/account/source, with an optional source')
//   .action(async (system, account, source) => {
//     try {
//       if (system === 'roam' || system === 'library-thing') {
//         if (system === 'roam' && !source) die(`Removing a Roam source requires specifying the database as your source.`);
//         await rmDir(dataDir(system, account, source));
//       }
//       else die(`Unknown system: ${system}`);
//       ok();
//     }
//     catch (err) {
//       die(`Failed to add source:`, err);
//     }
//   })
// ;

// // Pulling
// // This downloads the latest data from a system, optionally specifying account and source too.
// program
//   .command('pull <system> [account] [source]')
//   .description('pull data from a remote system, doing the specified account or all, same with source')
//   .action(async (system, account, source) => {
//     try {
//       if (system === 'roam') await roam.pull(account, source);
//       else if (system === 'library-thing') await libThing.pull(account);
//       else if (system === 'remarkable') await remarkable.pull(account);
//       else die(`Unknown system: ${system}`);
//       ok();
//     }
//     catch (err) {
//       die(`Failed to pull:`, err);
//     }
//   })
// ;

// // Listing
// // List the items in a given system
// program
//   .command('list-items <system> <account> [source]')
//   .description('list all the items in a given system, which must include the source if there is one')
//   .option('--sort <sortType>', 'how to sort the list (alpha/create/edit)', 'alpha')
//   .action(async (system, account, source, options) => {
//     try {
//       let list = [];
//       if (system === 'roam') {
//         if (!source) die(`In roam, the source is required`);
//         list = await roam.listItems(account, source, options);
//       }
//       // XXX: add support for library-thing
//       else die(`Unknown system: ${system}`);
//       process.stdout.write(list.join('\n') + '\n');
//     }
//     catch (err) {
//       die(`Failed to pull:`, err);
//     }
//   })
// ;

// // Conversion
// program
//   .command('html <system> <account> [source] <item>')
//   .description('finds the item in the source (or just account) and converts it to HTML')
//   .requiredOption('-o, --output <path>', 'where to output the HTML')
//   .action(async (system, account, source, item, options) => {
//     try {
//       let html;
//       if (system === 'roam') {
//         if (!source) die(`In roam, the source is required`);
//         html = await roam.toHTML(account, source, item);
//       }
//       // XXX: add support for library-thing
//       else die(`Unknown system: ${system}`);
//       await saveFile(options.output, html);
//       ok();
//     }
//     catch (err) {
//       die(`Failed to convert to HTML:`, err);
//     }
//   })
// ;

// now do something
program.parseAsync(process.argv);
