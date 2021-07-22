const {Blockchain, Transaction} = require('./blockchain');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const myKey = ec.keyFromPrivate('98a1aa9e94acca8b46be00893881e4912e185dc2db1a96dc78176614f70f04ba');
const myWalletAddress = myKey.getPublic('hex');

let jackCoin = new Blockchain();

const tx1 = new Transaction(myWalletAddress, 'Public key goes here', 10);
tx1.sign(myKey);
jackCoin.addTransaction(tx1);

console.log('\nStart mining');

jackCoin.minePendingTransactions(myWalletAddress);

console.log('\nBalance', jackCoin.getBalance(myWalletAddress));
//console.log(jackCoin.chain)
//jackCoin.chain[1].transactions[0].amount = 1;
console.log('Is chain valid?', jackCoin.validateChain());