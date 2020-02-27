const CONTRACT_NAME = 'cccccccccccc'; 
const mortgagor = 'ceaukhypqswl'; //抵押账号
const stake = 100000; //抵押金额
const price = 0.0108; //市价
const loan_rate = 0.4; //抵押率
const rate = 0.1; //年息
const cycle = 30;  //周期

const provider = 'fbl2hby11gug';  //平台账号，用于收取手续费
const stake_text = stake.toFixed(4) + ' FO'; 
const expect_loan_value = stake * loan_rate * price; //期望贷款额
const expect_repay = (expect_loan_value * (1 + rate*cycle/365) + 0.0001).toFixed(6); //预计还款额
const fee = 0.0001 * cycle;
const cur_time = action.publication_time;
// 认购截止时间
const invest_deadline = cur_time + 3600*24*3*1000000;
// 还贷截止时间
const repay_deadline = cur_time + 3600*24*(cycle+3)*1000000;


function getAccount() {
  let account = action.authorization[0].actor;
  action.require_auth(account);
  return account;
}


function sendToken (from, to, quantity, memo) {
  trans.send_inline("eosio.token", "transfer", {
    from: from,
    to: to,
    quantity: quantity,
    memo: memo
  }, [{
    "actor": from,
    "permission": "active"
  }])
}

function defi (from, to, quantity, memo) {
    if (from === CONTRACT_NAME || to !== CONTRACT_NAME) {
        return;
    }
        var bAsset = quantity.split(' ');
        bAsset[0] = Number(bAsset[0])
        var q = bAsset[0]
        var symbol = bAsset[1]
        var players = db.summary(CONTRACT_NAME, CONTRACT_NAME);
        var mc = players.find(1)
        var lenders = db.lenders(CONTRACT_NAME, CONTRACT_NAME);
        // Check Contract alive, if mc.data is defined then it's alive
        if (typeof(mc.data) !== "undefined") {
            if (mc.data.completed == 1) {
            return;
            }

            // Deny the invest if over deadline
                // And payback motegagor and investor
                if (cur_time > invest_deadline) {
                    if (mc.data.status == 'staked') {
                    sendToken(CONTRACT_NAME, mortgagor, stake_text, '认购失败，返回抵押');
                        for (var i = 0; i < lenders.get_primary_key(); i++)     {
                                const lender = lenders.find(i);
                                const payback = lender.data.invested;
                                const account = lender.data.lender;
                    lender.data.completed = 1;
                    lender.update(CONTRACT_NAME);
                        sendToken(CONTRACT_NAME, account, payback, '认购失败，返回本金');
                            }
                            mc.data.completed = 1;
                            mc.data.status = 'fail';
                mc.update(CONTRACT_NAME);
                        }
                    return
                }

            // Break a contract
            if (cur_time > repay_deadline && mc.data.completed == 0) {
                const total = Number(mc.data.invest);
                for (var i = 0; i < lenders.get_primary_key(); i++)     {
                    const lender = lenders.find(i);
                    const buy = Number((lender.data.invested).split(' ')[0]);
                        const proportion = buy/total;
                        const payback = (stake * proportion).toFixed(4) + ' FO';
                    const account = lender.data.lender;
                lender.data.completed = '1';
                mc.data.completed = '1';
                mc.data.status = 'break';
                lender.update(CONTRACT_NAME);
                mc.update(CONTRACT_NAME);
                    console.log('INFO, return Principal and interest for ', i, payback);
                    sendToken(CONTRACT_NAME, account, payback, '理财到期，贷款违约，按比例均分抵押资产');
                }
            sendToken(CONTRACT_NAME, from, quantity, '违约发生，退回触发款');
                    return;
            }
        }
        // Mortgagor
        if (from === mortgagor) {
            if (bAsset[0] === stake && symbol === "FO") {
                console.log('INFO, Satisfied condition, add recored in table');
                const id = cur_time;
                const record = {
              id: 1,
              mortgagor: mortgagor,
                  stake: quantity,
                  price: String(price) + " USD",
                  loan_rate: String(loan_rate),
              loan: String(expect_loan_value) + " USD",
                  rate: String(rate),
                          repay: expect_repay,
                  cycle: cycle,
                  invest: '0',
                  got: '0',
                  fee: '0',
                  status: 'staked',
                  deadline1: String(invest_deadline),
                  deadline2: String(repay_deadline),
                  completed: 0
                }
                players.emplace(CONTRACT_NAME, record);
            console.log('INFO: todo #', id, ' created');
            }  else if (symbol === "FOUSDT") {
                    if (q > mc.data.repay * 1.1) {
                    sendToken(CONTRACT_NAME, mortgagor, quantity, 'INFO: 高于还款额'+mc.data.repay);
                        return;
                    }
                    if (q < mc.data.repay) {
                    sendToken(CONTRACT_NAME, mortgagor, quantity, 'INFO: 低于还款额'+mc.data.repay);
                        return;
                    }
                var repay = db.repay(CONTRACT_NAME, CONTRACT_NAME);
                console.log('INFO, Satisfied condition, add recored in table');
                const id = cur_time;
                const record = {
              id: 1,
                  quantity: quantity,
                  timestamp: String(cur_time),
                  completed: 1
                }
                repay.emplace(CONTRACT_NAME, record);
            console.log('INFO: repay #', id, ' created');

                        // 6. Return Principal and interest
                    for (var i = 0; i < lenders.get_primary_key(); i++) {
                            const lender = lenders.find(i);
                            const payback = lender.data.payback;
                            const account = lender.data.lender;
                lender.data.completed = 1;
                lender.update(CONTRACT_NAME);
                            console.log('INFO, return Principal and interest for ', i, payback);
                    sendToken(CONTRACT_NAME, account, payback, '合约完成，返回本息');
                        }

                        // 5. Return stake
                sendToken(CONTRACT_NAME, mortgagor, stake_text, '合约完成，返回抵押');
            mc.data.completed = 1;
            mc.data.status = 'end';
            mc.update(CONTRACT_NAME);
            } else {
                sendToken(CONTRACT_NAME, mortgagor, quantity, 'INFO: 金额与合约要求不符');
                        return
                }
        // Investegators/buyers
        } else {
            if (typeof(mc.data) == "undefined") {
                    return;
                }
            // check if invest >= expect_loan_value
                if (Number(mc.data.invest) >= expect_loan_value) {
            sendToken(CONTRACT_NAME, from, quantity, '超过认购额，退回认购款');
                        return
                }

                // To avoid dust attack, q must >= 1
            if (symbol === "FOUSDT" && q >= 1) {
                        const id = lenders.get_primary_key();
            const payback = q * (1 + rate*cycle/365)
                        const new_invest = Number(Number(mc.data.invest) + q);
                        const new_invest_str = String(new_invest.toFixed(6)) + ' FOUSDT';

                        // 理财认购不得超过期望认购的20%
                        if (new_invest > expect_loan_value*1.2) {
                sendToken(CONTRACT_NAME, from, quantity, '超过认购额，退回认购款');
                        return
                    }

                        // 符合认购条件记入table
                const record = {
              id: id,
                  lender: from,
                  invested: quantity,
                  payback: String(payback.toFixed(6)) + ' FOUSDT',
                  timestamp: String(cur_time),
                  completed: 0
                }
                lenders.emplace(CONTRACT_NAME, record);

                console.log('INFO, Satisfied condition, add recored in table ', id);

                        // 3. Release loan if invest enough, and update status
                        if (new_invest >= expect_loan_value) {
                mc.data.got = String((new_invest*(1-fee)).toFixed(6)) + ' FOUSDT';
                mc.data.status = 'ongoing';
                    sendToken(CONTRACT_NAME, mortgagor, mc.data.got, '贷款释放');
                                if (fee > 0) {
                    mc.data.fee = String((new_invest * fee).toFixed(6)) + ' FOUSDT';
                        sendToken(CONTRACT_NAME, provider, mc.data.fee, '手续费');
                                }
            }
            mc.data.invest = String(new_invest);
            mc.data.repay = (new_invest * (1 + rate*cycle/365)).toFixed(6)
            mc.update(CONTRACT_NAME);
            }
        }
        console.log('INFO,', from ,to ,bAsset[0], symbol, memo);
}
exports.on_transfer = (from, to, quantity, memo) => {
    defi(from, to, quantity, memo);
};

exports.on_extransfer = (from, to, quantity, memo) => {
        const contract = quantity['contract'];
        if (contract != 'eosio') {
            return;
        }
    quantity = quantity['quantity'];
    defi(from, to, quantity, memo);
};
