import random

# from tkinter import *

# window = Tk()
# window.title("Gubs")
# window.configure(background="#5c4d42")

# photo1 = PhotoImage(file="gub_card.png")
# Label(window, image=photo1, background="#5c4d42").grid(row=0, column=0, sticky=W)

# window.mainloop()


"""
players: cards in hand, cards in play
deck of cards: drawcard

gubs: move to discard pile. add to total points
spear:moves a gub or protection card to discard
hand and played classes that will be subclasses of the player
mushroom: protect gub
toad ridaaaaaa: protect gub
discard pile:

event cards: when drawn -> used
flashflood: discard all naked gubs
G U B cards: win logic, if tie, lowest ammount of cards in hand wins

possibly make it a actuial 2


Goals:
1. Make the deck

2. Make the player

3. Deal inital cards to players

4. Show initally dealed cards
"""

# structure [name,  number_of_cards, card_type]
cards_info = [
    ["gub", 8, "playable"],
    ["spear", 4, "playable"],
    ["mushroom", 6, "playable"],
    ["toad_rida", 2, "playable"],
    ["G", 1, "event"],
    ["U", 1, "event"],
    ["B", 1, "event"],
    ["flash_flood", 1, "event"],
]


class Card:
    def __init__(self, data):
        self.name = data[0]
        self.number_of_cards = data[1]
        self.card_type = data[2]


class Deck:
    def __str__(self):
        return ", ".join(str(card.card_type) for card in self.cards)

    def __init__(self):
        self.cards = []
        self.shuffled_cards = []

        for card_info in cards_info:
            for x in range(card_info[1]):
                card = Card(card_info)
                self.cards.append(card)

        shuffled_cards = []
        copy_cards = self.cards[:]

        for card in self.cards:
            random_number = random.randint(0, len(copy_cards) - 1)
            card_being_shuffled = copy_cards.pop(random_number)
            shuffled_cards.append(card_being_shuffled)

        self.cards = shuffled_cards


deck = Deck()

print(deck)
