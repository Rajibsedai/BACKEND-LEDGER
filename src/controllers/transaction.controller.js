const transactionModel = require("../models/transation.model")
const ledgerModel = require("../models/ledger.model")
const emailService = require("../services/email.service")
const accountModel = require("../models/account.model")
const mongoose = require("mongoose")

/**
 ** - Create a new Transaction
 * The 10 steps Transger flow:
       1.Validate request
       2.Validate idempotency key
       3.Check account status
       4.Derive sender balance from ledger
       5.Create transaction(PENDING)
       6.Create DEBIT ledger entry
       7.Create CREDIT ledger entry
       8.Mark transaction COMPLETED
       9.COmit MongoDB session
       10. Send email notification

 */

async function createTransaction(req,res){

    //Validate Request

    const {fromAccount, toAccount, amount, idempotencyKey}= req.body

    if(!fromAccount || !toAccount || !amount ||!idempotencyKey){
        return res.status(400).json({
            message:"FromAccount, toAccount, amount and idempotency key is required"
        })
    }

    const fromUserAccount = await accountMOdel.findOne({
        _id: fromAccount
    })

    const toUserAccount = await accountMOdel.findOne({
        _id: toAccount
    })
    
    if(!fromUserAccount || !toUserAccount){
        return res.status(400).json({
            message:"Invalid formAccount or ToAccount"
        })
    }

    //validate Idempotency KEy

    const isTransactionAlreadyExist = await transactionModel.findOne({
        idempotencyKey: idempotencyKey
    })

    if(isTransactionAlreadyExist){
        if(isTransactionAlreadyExist.status =="COMPLETED"){
            return res.status(200).json({
                message:"Transaction already processed",
                transaction: isTransactionAlreadyExist
            })
        }
        if(isTransactionAlreadyExist.status =="PENDING"){
            return res.status(200).json({
                message:"Transaction is still processing",
                
            })
        }
        if(isTransactionAlreadyExist.status =="FAILED"){
            return res.status(500).json({
                message:"Transaction Failed, Please try",
                
            })
        }

        if(isTransactionAlreadyExist.status =="REVERSED"){
            return res.status(200).json({
                message:"Transaction was reversed, please try",
            })
        }
    }

    //Check account status

    if(fromUserAccount.status !="ACTIVE" || toUserAccount.status !="ACTIVE")
    {
        return res.status(400).json({
            message:"Both fromAccount and toAccount must be active to process transaction"
        })
    }

    // Derive sender balance form ledger

    const balance = await fromUserAccount.getBalance()

    if(balance < amount)
       return res.status(400).json({
            message:`Insufficient balance. Current balance is ${balance}. Requested
             amount is ${amount}`
    })

    // Create transaction (Pending)
    const session = await mongoose.startSession()
    session.startTransaction()

    
}