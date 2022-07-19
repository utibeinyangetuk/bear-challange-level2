"reach 0.1";
//Outcome array
const [ isOutcome, B_WINS, DRAW, A_WINS ] = makeEnum(3); 

//This computes the winner of the game
const winner = (hand1, hand2, hand3, hand4) => {

  if (hand1 + hand2 == hand3  && hand1 + hand2 != hand4){
    return A_WINS;
  }
  else if (hand1 + hand2 != hand3 && hand1 + hand2 == hand4){
    return B_WINS;
  }
  else  return DRAW;

};

const whitelist = (Selected, outcome, Alice, Bob) =>{
  if(outcome == A_WINS){
    Selected.insert(Alice);
  }
  else if (outcome == B_WINS){
    Selected.insert(Bob);
  }
}

// Makes the required payment to the winner
const payWinner = (disT, Selected, outcome, Alice, Bob, Deployer) => {
  if(Selected.member(Alice)) {
    transfer(balance(disT), disT).to(Alice);
    each([Alice, Bob], () => {
      interact.seeOutcome(outcome);
    });
  }
  else if (Selected.member(Bob)){
    transfer(balance(disT), disT).to(Bob);
    each([Alice, Bob], () => {
      interact.seeOutcome(outcome);
    });
    
  }
}

//Player abilities
const Player = {
  ...hasRandom,
  getFinger: Fun([], UInt),
  getPrediction : Fun([], UInt),
  seeOutcome: Fun([UInt], Null),
  attached:Fun([Token], Null)
};

export const main = Reach.App(() => {
//Deployer Interface
  const Deployer = Participant('Deployer', {
    geToken: Fun([],Token)
})

//Alice interface
  const Alice = Participant('Alice', {
    ...Player,
   
  });
//Bob interface
  const Bob   = Participant('Bob', {
    ...Player,
  });
  init();

Deployer.only(() => {
  const disT = declassify(interact.geToken());
});
Deployer.publish(disT);
commit();
const x = 10000000;
Deployer.pay([[x, disT]]);
const Selected = new Set();
commit();


  Alice.only(() => {
    interact.attached(disT);
  })
  Alice.publish();
  commit();



  Bob.only(() => {
    interact.attached(disT);
  })
  Bob.publish();

  var [hand1, hand2, hand3, hand4, outcome] = [0,0,0,0, DRAW];
  invariant(balance() == balance());

  while (outcome == DRAW) {
    commit();
    

    Alice.only(() => {
      const _handAlice = interact.getFinger();
      const _predictionAlice = interact.getPrediction();
      
      const [_handcommit, _handSalt] = makeCommitment(interact, _handAlice);
      const [_predictcommit, _predictsalt] = makeCommitment(interact, _predictionAlice);
      
      const commitAliceFinger = declassify(_handcommit);
      const commitAlicePredict = declassify(_predictcommit);


    });
    Alice.publish(commitAliceFinger, commitAlicePredict)

    commit();

    unknowable(Bob, Alice(_handAlice, _predictionAlice, _handSalt, _predictsalt));
    Bob.only(() => {
      const handBob = declassify(interact.getFinger());
      const predictionBob = declassify(interact.getPrediction());
      
    });
    Bob.publish(handBob, predictionBob)
    
    commit();

    Alice.only(() => {
      const handAlice = declassify(_handAlice); 
      const handSalt = declassify(_handSalt);
      const predictionAlice = declassify(_predictionAlice);
      const predictSalt = declassify(_predictsalt);
    });
    Alice.publish(handAlice, handSalt, predictionAlice, predictSalt)
   
    checkCommitment(commitAliceFinger, handSalt, handAlice);
    checkCommitment(commitAlicePredict, predictSalt, predictionAlice);
    
 
    [hand1, hand2, hand3, hand4, outcome] = [handAlice, handBob, predictionAlice, predictionBob, winner(hand1, hand2, hand3, hand4) ];
    
    continue;
    

  }

  
  whitelist(Selected, outcome, Alice, Bob);
  payWinner(disT, Selected, outcome, Alice, Bob, Deployer);
  transfer(balance(disT), disT).to(Deployer);
  transfer(balance()).to(Deployer);

 

  
  commit();

 
});