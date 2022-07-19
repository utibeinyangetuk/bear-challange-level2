import { loadStdlib } from '@reach-sh/stdlib';
import * as backend from './build/index.main.mjs';
import {ask} from '@reach-sh/stdlib/ask.mjs';

const stdlib = loadStdlib({ REACH_NO_WARN: 'Y' });
const startingBalance = stdlib.parseCurrency(100);
console.log('RULES FOR THE SELECTION');
console.log('BOTH PLAYERS PLAY A GAME OF MORRA')
console.log('THE WINNER GETS SELECTED FOR THE WHITELIST AND GETS 10M IN MORA')
const creator_name = await ask(`what's your name deployer: `)
const playerName1 = await ask(`what's your name player1: `)
const playerName2 = await ask(`what's your name player2: `)


const accDeployer = await stdlib.newTestAccount(startingBalance);
const accPlayer1 = await stdlib.newTestAccount(startingBalance);
const accPlayer2 = await stdlib.newTestAccount(startingBalance);
const disT = await stdlib.launchToken(accDeployer, "MORRA", "MMM");

const ctcDeployer = accDeployer.contract(backend);

const ctcPlayer1 = accPlayer1.contract(backend, ctcDeployer.getInfo())
console.log(`Connecting players to contract......`)
console.log(`Starting Morra Game......`)
const ctcPlayer2 = accPlayer2.contract(backend, ctcDeployer.getInfo())

const tokenbalance = async (acc, name) => {
    const amt = await stdlib.balanceOf(acc, disT.id);
    console.log(`${name} has ${amt} ${disT.sym}`)
}

const creator_balance = await tokenbalance(accDeployer, creator_name)
const player1_balance = await tokenbalance(accPlayer1, playerName1)
const player2_balance = await tokenbalance(accPlayer2, playerName2)

const player1_address = await accPlayer1.getAddress()
const player2_address = await accPlayer2.getAddress()

const player1_before = await stdlib.balanceOf(accPlayer1, disT.id);
const player2_before = await stdlib.balanceOf(accPlayer2, disT.id);

const p1_guess = await ask(`${playerName1} please enter a number from 1-5`);
const p2_guess = await ask(`${playerName2} please enter a number from 1-5`);
const predict1 = await ask(`${playerName1} please enter your prediction from 1-10`);
const predict2 = await ask(`${playerName2} please enter your prediction from 1-10`);



await Promise.all([
    ctcDeployer.p.Deployer({
        geToken: () => disT.id
    }),
    ctcPlayer1.p.Alice({
        attached: async (tok) => {
            accPlayer1.tokenAccept(tok)
            console.log(`${playerName1} opted in to ${disT.name} token `)
        },
        seeOutcome: async(outcome) => {
          const outcomeDecimal = parseInt(outcome);
          switch (outcomeDecimal) {
            case 0:
              console.log(`${playerName2} wins`);
              console.log(`${playerName2} Bob was selected for the whitelist`)
              
              break;
            case 1:
              console.log("Nobody wins this round");
              break;
            case 2:
              console.log(`${playerName1} wins`);
              console.log(`${playerName1} was selected for the whitelist`)
          
            default:
              break;
          }
        },
        random: () => stdlib.hasRandom.random(),
        getFinger: () => parseInt(p1_guess),
        getPrediction: () => parseInt(predict1)
    }),
    ctcPlayer2.p.Bob({
        attached: async (tok) => {
            accPlayer2.tokenAccept(tok)
            console.log(`${playerName2} opted in to ${disT.name} token `)
        },
        seeOutcome: async(outcome) => {
          const outcomeDecimal = parseInt(outcome);
          switch (outcomeDecimal) {
            case 0:
              console.log(`${playerName2} wins`);
              console.log(`${playerName2} was selected for the whitelist`)
              break;
            case 1:
              console.log("Nobody wins this round");
              break;
            case 2:
              console.log(`${playerName1} wins`);
              console.log(`${playerName1} was selected for the whitelist`)
            default:
              break;
          }
        },
        random: () => stdlib.hasRandom.random(),
        getFinger: () => parseInt(p2_guess),
        getPrediction: () => parseInt(predict2)
    }),

]);

const player1_after = await stdlib.balanceOf(accPlayer1, disT.id);
const player2_after = await stdlib.balanceOf(accPlayer2, disT.id);
console.log(`${playerName1} has ${player1_after} ${disT.sym}`);
console.log(`${playerName2} has ${player2_after} ${disT.sym}`);
const metaData = await accDeployer.tokenMetadata(disT.id);
console.log('TOKEN PROPERTIES........................')
console.log('Token Name: ',metaData.name.toString())
console.log('Token Symbol: ',metaData.symbol.toString())
console.log('Supply: ',metaData.supply.toString())
console.log('Decimals: ',metaData.decimals.toString())
console.log('Console App Process Complete.')
process.exit();