const SHA256 = require('crypto-js/sha256.js');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

class Transaction {
    constructor (fromAddress, toAddress, amount) {
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.amount = amount;
    }

    calcHash () {
        return SHA256(this.fromAddress + this.toAddress + this.amount).toString();
    }

    sign (signingKey) {

        if (signingKey.getPublic('hex') !== this.fromAddress) {
            throw new Error("You can't sign for other wallets");
        }

        const hashTx = this.calcHash();
        const sig = signingKey.sign(hashTx, 'base64');
        this.signature = sig.toDER('hex');
    }

    isValid () {
        if (this.fromAddress === null) return true;

        if (!this.signature || this.signature.length === 0) {
            throw new Error("No signature found");
        }

        const publicKey = ec.keyFromPublic(this.fromAddress, 'hex');
        return publicKey.verify(this.calcHash(), this.signature);
    }
}

class Block {
    constructor (timestamp, transactions, previousHash = '') {
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.previousHash = previousHash;
        this.nonce = 0;
        this.hash = this.calcHash();
        
    }

    calcHash () {
        return SHA256(this.previousHash + this.timestamp + JSON.stringify(this.transactions) + this.nonce).toString();
    }

    miningBlock (difficulty) {
        while (this.hash.substring(0, difficulty) !== Array(difficulty+1).join("0")) {
            this.nonce++;
            this.hash = this.calcHash();
        }

        console.log("Block found: " + this.hash)
    }

    hasValidTransactions () {
        for (const tx of this.transactions) {
            if (!tx.isValid()) {
                return false;
            }
        }

        return true;
    }
}



class Blockchain {
    constructor () {
        this.chain = [this.genesis()];
        this.difficulty = 4;
        this.pendingTransactions = [];
        this.miningReward = 100;
    }

    genesis () {
        return new Block(Date.now(), "Genesis", "0");
    }

    newestBlock () {
        return this.chain[this.chain.length - 1];
    }

    minePendingTransactions (rewardAddress) {
        const rewardTx = new Transaction(null, rewardAddress, this.miningReward);
        this.pendingTransactions.push(rewardTx);

        let block = new Block(Date.now(), this.pendingTransactions, this.newestBlock().hash);
        block.miningBlock(this.difficulty);

        console.log("Block mined");
        this.chain.push(block);
        this.pendingTransactions = [];
    }

    addTransaction (transaction) {

        if (!transaction.fromAddress || !transaction.toAddress) {
            throw new Error('Transaction must include from and to address');
        }

        if (!transaction.isValid()) {
            throw new Error('Can\'t add invalid transaction');
        }

        this.pendingTransactions.push(transaction);
    }

    getBalance (address) {
        let balance = 0;

        for (const block of this.chain) {
            for (const transaction of block.transactions) {
                if (transaction.fromAddress === address) {
                    balance -= transaction.amount;
                }
                if (transaction.toAddress === address) {
                    balance += transaction.amount;
                }
            }
        }
        return balance;
    }

    validateChain () {
        for (let i = 1; i < this.chain.length; i++) {
            const thisBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            if (!thisBlock.hasValidTransactions()) {
                return false;
            }

            if (previousBlock.hash !== previousBlock.calcHash()) {
                //console.log(previousBlock.hash, previousBlock.calcHash())
                return false;
                
            }

            if (thisBlock.hash !== thisBlock.calcHash()) {
                //console.log(thisBlock.hash, previousBlock.calcHash())
                return false;
                
            }

            if (thisBlock.previousHash !== previousBlock.calcHash()) {
                //console.log(thisBlock.previousHash, previousBlock.calcHash())
                return false;
                
            }
        }

        return true;
    }
}

module.exports.Blockchain = Blockchain;

module.exports.Transaction = Transaction;