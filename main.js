import preflopTable from "./preflop.js";

const suits = ["H", "D", "C", "S"];
const values = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "T",
  "J",
  "Q",
  "K",
  "A",
];
const actions = ["check", "bet", "fold", "call", "raise"];
const playedRewards = ["Playable", "Premium", "Strong"];

// Function to create a deck
const createDeck = (suits, values) => {
  return suits.flatMap((suit) => values.map((value) => value + suit));
};

// Function to shuffle the deck
const shuffle = (array) => {
  return array
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
};

// Function to deal cards to players
const dealHands = (deck, numPlayers) => {
  return Array.from({ length: numPlayers }, () => [deck.pop(), deck.pop()]);
};

// Function to deal the board
const dealBoard = (deck) => {
  return {
    flop: [deck.pop(), deck.pop(), deck.pop()],
    turn: deck.pop(),
    river: deck.pop(),
  };
};

const determineActionForReward = (reward, turn) => {
  // console.log(reward, turn);
  if (playedRewards.includes(reward)) {
    return turn > 0 ? actions[3] : actions[3];
  }

  return actions[2];
};

// 2 variable :
// pot = somme raises en cour
// pendant le tour
// raise = compris entre 1 BB & Pot

// Check si diff entre pot et raise > 1

// Function to generate a random action for each player
const generateAction = (playerAction, playerNb, hands, turn) => {
  const playerHand = hands[playerNb].map((hand) => hand.substr(0, 1)).join("");
  const playerHandReversed = playerHand.split("").reverse().join("");
  const foundState = preflopTable
    .map((entry) => ({
      ...entry,
      ...{ Action: determineActionForReward(entry.Reward, turn) },
    }))
    .find((obj) => {
      if ([playerHandReversed, playerHand].includes(obj.State)) return true;

      const withoutSign = convertRangeToStatesArray(obj.State).map((state) =>
        state.substr(0, 2)
      );

      if (
        withoutSign.includes(playerHand) ||
        withoutSign.includes(playerHandReversed)
      ) {
        return true;
      }

      return false;
    });

  const action = foundState ? foundState.Action : actions[2];

  console.log({ ...playerAction, action: action })

  return { ...playerAction, action: action };
};

const generateRaises = (playerAction, oldPot, newPot) => {
  const diff = newPot - oldPot;

  if (diff === 0)
    return {
      ...playerAction,
      raise: playerAction.action !== actions[2] ? newPot / 2 : 0,
    };

  return {
    ...playerAction,
    raise: playerAction.raise
  };
};

// Function to create the post-flop table
const createPostFlopTable = (hands, board, playerActions) => {
  return hands.map((hand, i) => {
    const action = playerActions[i];
    return {
      HandID: 1,
      PlayerID: i + 1,
      FlopCards: board["flop"].join(","),
      TurnCard: board["turn"],
      RiverCard: board["river"],
      PlayerHand: hand.join(","),
      ActionType: action.action,
      ActionAmount: action.raise,
      PotSize: potSumFromActions(playerActions),
    };
  });
};

const convertRangeToStatesArray = (state) => {
  if (!state.includes("-")) return [state];

  const [rangeEnd, rangeStart] = state.split("-");
  const [firstCard1, firstCard2] = [rangeEnd[0], rangeStart[0]];
  const [fistSign1, fistSign2] = [rangeEnd[2], rangeStart[2]];

  if (firstCard1 !== firstCard2) {
    throw new Error("The first cards of the range must be the same");
  }

  if (fistSign1 !== fistSign2) {
    throw new Error("The first signs of the range must be the same");
  }

  const rangeEndIndex = values.indexOf(rangeEnd[1]);
  const rangeStartIndex = values.indexOf(rangeStart[1]);

  // Functionnal way to generate the array
  return Array.from({ length: rangeEndIndex - rangeStartIndex + 1 }, (_, i) => {
    return `${firstCard1}${values[i]}${fistSign1}`;
  });
};

const potSumFromActions = (playerActions) => {
  return playerActions.reduce(
    (sum, playerAction) => sum + playerAction.raise,
    0
  );
};

let players = 3;
let turns = 2;

// Create and shuffle the deck
let deck = shuffle(createDeck(suits, values));
// console.log(deck);

let playerActions = Array.from({ length: players }, () => ({
  raise: 100,
}));

const round = (turn) => {
  // Deal two cards to each player
  const hands = dealHands(deck, players);

  // Deal the flop, turn and river
  const board = dealBoard(deck);

  console.log(playerActions);
  const pot = potSumFromActions(playerActions);

  playerActions = playerActions.map((playerAction, playerNb) =>
    generateAction(playerAction, playerNb, hands, turn)
  );

  const newPot = potSumFromActions(playerActions);
  playerActions = playerActions.map((playerAction) =>
    generateRaises(playerAction, pot, newPot)
  );

  console.log(playerActions);

  // Create the post-flop table
  const postFlopTable = createPostFlopTable(hands, board, playerActions);

  // Output the post-flop table
  console.log(postFlopTable);
};

for (let i = 0; i < turns; i++) {
  round(i);
}
