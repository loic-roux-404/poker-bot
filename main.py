import random
from preflop import preflop_table

suits = ["H", "D", "C", "S"]
values = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"]
actions = ["check", "bet", "fold", "call", "raise"]
played_rewards = ["Playable", "Premium", "Strong"]

def create_deck(suits, values):
    return [value + suit for value in values for suit in suits]

def shuffle(deck):
    random.shuffle(deck)
    return deck

def deal_hands(deck, num_players):
    return [[deck.pop(), deck.pop()] for _ in range(num_players)]

def deal_board(deck):
    return {
        'flop': [deck.pop(), deck.pop(), deck.pop()],
        'turn': deck.pop(),
        'river': deck.pop()
    }

def determine_action_for_reward(reward, turn):
    if reward in played_rewards:
        return actions[3] if turn > 0 else actions[3]
    return actions[2]

def generate_action(player_action, player_nb, hands, turn):
    if turn > 0: return player_action
    player_hand = ''.join(hand[0] for hand in hands[player_nb])
    player_hand_reversed = player_hand[::-1]
    found_state = next((entry | {'Action': determine_action_for_reward(entry['Reward'], turn)}
                        for entry in preflop_table
                        if entry['State'] in [player_hand, player_hand_reversed] or
                        player_hand in convert_range_to_states_array(entry['State']) or
                        player_hand_reversed in convert_range_to_states_array(entry['State'])), None)
    action = found_state['Action'] if found_state else actions[2]
    player_action = {**player_action, **{'action': action}}
    return player_action

def generate_raises(turn, player_action, old_pot, new_pot):
    if turn == 0: return player_action
    diff = new_pot - old_pot
    if diff == 0:
        player_action = {**player_action, **{'raise': new_pot / 2 if player_action['action'] != actions[2] else 0}}
        return player_action
    player_action = {**player_action, **{'action': actions[2]}}
    return player_action

def create_post_flop_table(hands, board, player_actions):
    return [{'HandID': 1,
             'PlayerID': i + 1,
             'FlopCards': ",".join(board['flop']),
             'TurnCard': board['turn'],
             'RiverCard': board['river'],
             'PlayerHand': ",".join(hand),
             'ActionType': player_actions[i]['action'],
             'ActionAmount': player_actions[i]['raise'],
             'PotSize': pot_sum_from_actions(player_actions)}
            for i, hand in enumerate(hands)]

def convert_range_to_states_array(state):
    if '-' not in state: return [state]
    range_end, range_start = state.split('-')
    first_card1, first_card2 = range_end[0], range_start[0]
    fist_sign1, fist_sign2 = range_end[2], range_start[2]
    if first_card1 != first_card2:
        raise ValueError("The first cards of the range must be the same")
    if fist_sign1 != fist_sign2:
        raise ValueError("The first signs of the range must be the same")
    range_end_index = values.index(range_end[1])
    range_start_index = values.index(range_start[1])
    return [f'{first_card1}{values[i]}{fist_sign1}' for i in range(range_start_index, range_end_index + 1)]

def pot_sum_from_actions(player_actions):
    return sum(player_action['raise'] for player_action in player_actions)

players = 3
turns = 2
deck = shuffle(create_deck(suits, values))
player_actions = [{'raise': 100} for _ in range(players)]

def round(turn):
    hands = deal_hands(deck, players)
    board = deal_board(deck)
    pot = pot_sum_from_actions(player_actions)

    player_actions = [generate_action(player_actions[player], i, hands, turn) for player in range(players)]

    new_pot = pot_sum_from_actions(player_actions)

    player_actions = [generate_raises(turn, player_action, pot, new_pot) for player_action in player_actions]
    post_flop_table = create_post_flop_table(hands, board, player_actions)
    print(post_flop_table)

for i in range(turns):
    round(i)
