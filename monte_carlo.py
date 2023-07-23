import random
from pypokerengine.utils.card_utils import gen_cards, estimate_hole_card_win_rate

# Define the deck without the known cards
def get_remaining_deck(exclude_cards):
    suits = ['H', 'D', 'C', 'S']  # hearts, diamonds, clubs, spades
    ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A']  # card ranks
    deck = [s + r for s in suits for r in ranks]
    remaining_deck = [card for card in deck if card not in exclude_cards]
    return remaining_deck

# Monte Carlo simulation for our hand against two random hands
def simulate(hand, flop, simulations=1000):
    deck = get_remaining_deck(hand + flop)
    wins = 0
    for _ in range(simulations):
        random.shuffle(deck)
        hand1 = deck[:2]
        hand2 = deck[2:4]
        turn_river = deck[4:6]
        community_card = gen_cards(flop + turn_river)
        if estimate_hole_card_win_rate(nb_simulation=1, nb_player=3, hole_card=gen_cards(hand), community_card=community_card) == 1:
            wins += 1
    win_rate = wins / simulations
    return win_rate

hand = ['HJ', 'HQ']  # Our hand
flop = ['HK', 'HA', 'H2']  # Flop cards
simulations = 10000  # Number of simulations

win_rate = simulate(hand, flop, simulations)
print(f"Estimated win rate with hand {hand} and flop {flop} is {win_rate * 100}%")
